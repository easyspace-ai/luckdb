/**
 * 排序管理器
 */

import type { IRow, ColumnId } from '../types';
import type { ISortConfig, SortDirection } from './types';

type Comparator = (a: IRow, b: IRow) => number;

export class SortManager {
  /**
   * 按单列排序
   */
  sortByColumn(rows: IRow[], columnKey: string, direction: SortDirection): IRow[] {
    const sorted = [...rows];

    sorted.sort((a, b) => {
      const aValue = a.data[columnKey];
      const bValue = b.data[columnKey];

      const result = this.compareValues(aValue, bValue);
      return direction === 'asc' ? result : -result;
    });

    return sorted;
  }

  /**
   * 按多列排序
   */
  sortByColumns(rows: IRow[], sorts: ISortConfig[], columnKeyMap: Map<ColumnId, string>): IRow[] {
    if (sorts.length === 0) {
      return rows;
    }

    const sorted = [...rows];

    sorted.sort((a, b) => {
      for (const sort of sorts) {
        const columnKey = columnKeyMap.get(sort.columnId);
        if (!columnKey) continue;

        const aValue = a.data[columnKey];
        const bValue = b.data[columnKey];

        const result = this.compareValues(aValue, bValue);
        const directedResult = sort.direction === 'asc' ? result : -result;

        if (directedResult !== 0) {
          return directedResult;
        }
      }

      return 0;
    });

    return sorted;
  }

  /**
   * 自定义比较函数排序
   */
  sortWithComparator(rows: IRow[], comparator: Comparator): IRow[] {
    const sorted = [...rows];
    sorted.sort(comparator);
    return sorted;
  }

  /**
   * 比较两个值
   */
  private compareValues(a: unknown, b: unknown): number {
    // null/undefined 排最后
    if (a === null || a === undefined) return 1;
    if (b === null || b === undefined) return -1;

    // 数字比较
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    // 日期比较
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() - b.getTime();
    }

    // 布尔值比较
    if (typeof a === 'boolean' && typeof b === 'boolean') {
      return a === b ? 0 : a ? 1 : -1;
    }

    // 字符串比较(不区分大小写)
    const aStr = String(a).toLowerCase();
    const bStr = String(b).toLowerCase();
    return aStr.localeCompare(bStr);
  }
}
