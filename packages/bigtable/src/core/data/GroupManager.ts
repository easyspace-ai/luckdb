/**
 * 分组管理器
 */

import type { IRow, ColumnId } from '../types';
import type {
  IGroupConfig,
  IGroup,
  IAggregationConfig,
  AggregationType,
  SortDirection,
} from './types';

export class GroupManager {
  /**
   * 按单字段分组
   */
  groupBy<T = IRow>(rows: T[], columnKey: string, order?: SortDirection): IGroup<T>[] {
    const groups = new Map<any, T[]>();

    // 分组
    rows.forEach((row) => {
      const key = (row as any).data?.[columnKey] ?? null;
      const group = groups.get(key) || [];
      group.push(row);
      groups.set(key, group);
    });

    // 转换为数组
    const result: IGroup<T>[] = Array.from(groups.entries()).map(([key, value]) => ({
      key,
      value,
      count: value.length,
    }));

    // 排序
    if (order) {
      result.sort((a, b) => {
        const cmp = this.compareKeys(a.key, b.key);
        return order === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }

  /**
   * 按多字段嵌套分组
   */
  groupByMultiple<T = IRow>(
    rows: T[],
    columnKeys: string[],
    order?: SortDirection
  ): IGroup<T | IGroup<T>>[] {
    if (columnKeys.length === 0) {
      return [];
    }

    if (columnKeys.length === 1) {
      return this.groupBy(rows, columnKeys[0], order);
    }

    // 第一层分组
    const firstLevelGroups = this.groupBy(rows, columnKeys[0], order);

    // 递归分组
    return firstLevelGroups.map((group) => ({
      ...group,
      value: this.groupByMultiple(group.value, columnKeys.slice(1), order) as any,
    }));
  }

  /**
   * 分组聚合
   */
  aggregate(
    groups: IGroup<IRow>[],
    aggregations: IAggregationConfig[],
    columnKeyMap: Map<ColumnId, string>
  ): IGroup<IRow>[] {
    return groups.map((group) => {
      const agg: Record<string, any> = {};

      aggregations.forEach((config) => {
        const columnKey = columnKeyMap.get(config.columnId);
        if (!columnKey) return;

        const values = group.value.map((row) => row.data[columnKey]);
        const name = config.name || `${config.type}_${config.columnId}`;

        agg[name] = this.computeAggregation(values, config.type);
      });

      return {
        ...group,
        aggregations: agg,
      };
    });
  }

  /**
   * 计算聚合值
   */
  private computeAggregation(values: unknown[], type: AggregationType): any {
    switch (type) {
      case 'count':
        return values.length;

      case 'sum':
        return values.reduce((sum, val) => sum + (Number(val) || 0), 0);

      case 'average': {
        const numbers = values.filter((v) => typeof v === 'number') as number[];
        if (numbers.length === 0) return null;
        return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
      }

      case 'min': {
        const numbers = values.filter((v) => typeof v === 'number') as number[];
        return numbers.length > 0 ? Math.min(...numbers) : null;
      }

      case 'max': {
        const numbers = values.filter((v) => typeof v === 'number') as number[];
        return numbers.length > 0 ? Math.max(...numbers) : null;
      }

      case 'countUnique': {
        const unique = new Set(values);
        return unique.size;
      }

      case 'arrayUnique': {
        return Array.from(new Set(values));
      }

      case 'concatenate': {
        return values
          .filter((v) => v !== null && v !== undefined)
          .map((v) => String(v))
          .join(', ');
      }

      default:
        return null;
    }
  }

  /**
   * 比较分组键
   */
  private compareKeys(a: any, b: any): number {
    if (a === null || a === undefined) return 1;
    if (b === null || b === undefined) return -1;

    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    return String(a).localeCompare(String(b));
  }
}
