/**
 * 筛选管理器
 */

import type { IRow } from '../types';
import type { IFilterCondition, IFilterGroup, FilterOperator } from './types';

export class FilterManager {
  /**
   * 按条件筛选
   */
  filterBy(
    rows: IRow[],
    conditions: IFilterCondition[],
    columnKeyMap: Map<string, string>
  ): IRow[] {
    if (conditions.length === 0) {
      return rows;
    }

    return rows.filter((row) => {
      return conditions.every((condition) => {
        const columnKey = columnKeyMap.get(condition.columnId);
        if (!columnKey) return true;

        const value = row.data[columnKey];
        return this.evaluateCondition(value, condition);
      });
    });
  }

  /**
   * 按组筛选(支持AND/OR)
   */
  filterByGroup(rows: IRow[], group: IFilterGroup, columnKeyMap: Map<string, string>): IRow[] {
    return rows.filter((row) => {
      return this.evaluateGroup(row, group, columnKeyMap);
    });
  }

  /**
   * 自定义筛选函数
   */
  filterWithFunction(rows: IRow[], fn: (row: IRow) => boolean): IRow[] {
    return rows.filter(fn);
  }

  /**
   * 评估筛选组
   */
  private evaluateGroup(
    row: IRow,
    group: IFilterGroup,
    columnKeyMap: Map<string, string>
  ): boolean {
    const results = group.conditions.map((item) => {
      if ('conditions' in item) {
        // 嵌套组
        return this.evaluateGroup(row, item as IFilterGroup, columnKeyMap);
      } else {
        // 单个条件
        const condition = item as IFilterCondition;
        const columnKey = columnKeyMap.get(condition.columnId);
        if (!columnKey) return true;

        const value = row.data[columnKey];
        return this.evaluateCondition(value, condition);
      }
    });

    // AND 或 OR
    return group.operator === 'and' ? results.every((r) => r) : results.some((r) => r);
  }

  /**
   * 评估单个筛选条件
   */
  private evaluateCondition(value: unknown, condition: IFilterCondition): boolean {
    const { operator, value: conditionValue } = condition;

    switch (operator) {
      // 通用
      case 'equals':
        return value === conditionValue;
      case 'notEquals':
        return value !== conditionValue;
      case 'isEmpty':
        return value === null || value === undefined || value === '';
      case 'isNotEmpty':
        return value !== null && value !== undefined && value !== '';

      // 文本
      case 'contains':
        return String(value || '').includes(String(conditionValue));
      case 'notContains':
        return !String(value || '').includes(String(conditionValue));
      case 'startsWith':
        return String(value || '').startsWith(String(conditionValue));
      case 'endsWith':
        return String(value || '').endsWith(String(conditionValue));

      // 数字/日期
      case 'greaterThan':
        return Number(value) > Number(conditionValue);
      case 'greaterThanOrEqual':
        return Number(value) >= Number(conditionValue);
      case 'lessThan':
        return Number(value) < Number(conditionValue);
      case 'lessThanOrEqual':
        return Number(value) <= Number(conditionValue);

      // 数组
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(value);
      case 'notIn':
        return Array.isArray(conditionValue) && !conditionValue.includes(value);

      // 日期
      case 'isToday':
        return this.isToday(value);
      case 'isYesterday':
        return this.isYesterday(value);
      case 'isTomorrow':
        return this.isTomorrow(value);
      case 'isThisWeek':
        return this.isThisWeek(value);
      case 'isThisMonth':
        return this.isThisMonth(value);
      case 'isThisYear':
        return this.isThisYear(value);

      default:
        return true;
    }
  }

  /**
   * 日期辅助函数
   */
  private isToday(value: unknown): boolean {
    if (!(value instanceof Date)) return false;
    const today = new Date();
    return this.isSameDay(value, today);
  }

  private isYesterday(value: unknown): boolean {
    if (!(value instanceof Date)) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.isSameDay(value, yesterday);
  }

  private isTomorrow(value: unknown): boolean {
    if (!(value instanceof Date)) return false;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.isSameDay(value, tomorrow);
  }

  private isThisWeek(value: unknown): boolean {
    if (!(value instanceof Date)) return false;
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return value >= startOfWeek && value < endOfWeek;
  }

  private isThisMonth(value: unknown): boolean {
    if (!(value instanceof Date)) return false;
    const now = new Date();
    return value.getMonth() === now.getMonth() && value.getFullYear() === now.getFullYear();
  }

  private isThisYear(value: unknown): boolean {
    if (!(value instanceof Date)) return false;
    const now = new Date();
    return value.getFullYear() === now.getFullYear();
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}
