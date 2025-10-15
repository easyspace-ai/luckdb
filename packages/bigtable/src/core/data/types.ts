/**
 * 数据操作类型定义
 */

import type { ColumnId } from '../types';

/**
 * 排序方向
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 排序配置
 */
export interface ISortConfig {
  columnId: ColumnId;
  direction: SortDirection;
}

/**
 * 筛选操作符
 */
export enum FilterOperator {
  // 通用
  Equals = 'equals',
  NotEquals = 'notEquals',
  IsEmpty = 'isEmpty',
  IsNotEmpty = 'isNotEmpty',

  // 文本
  Contains = 'contains',
  NotContains = 'notContains',
  StartsWith = 'startsWith',
  EndsWith = 'endsWith',

  // 数字/日期
  GreaterThan = 'greaterThan',
  GreaterThanOrEqual = 'greaterThanOrEqual',
  LessThan = 'lessThan',
  LessThanOrEqual = 'lessThanOrEqual',

  // 数组
  In = 'in',
  NotIn = 'notIn',

  // 日期
  IsToday = 'isToday',
  IsYesterday = 'isYesterday',
  IsTomorrow = 'isTomorrow',
  IsThisWeek = 'isThisWeek',
  IsThisMonth = 'isThisMonth',
  IsThisYear = 'isThisYear',
}

/**
 * 筛选条件
 */
export interface IFilterCondition {
  columnId: ColumnId;
  operator: FilterOperator;
  value?: any;
}

/**
 * 筛选组(支持AND/OR)
 */
export interface IFilterGroup {
  operator: 'and' | 'or';
  conditions: (IFilterCondition | IFilterGroup)[];
}

/**
 * 分组配置
 */
export interface IGroupConfig {
  columnId: ColumnId;
  order?: SortDirection;
}

/**
 * 分组结果
 */
export interface IGroup<T = any> {
  key: any;
  value: T[];
  count: number;
  aggregations?: Record<string, any>;
}

/**
 * 聚合函数类型
 */
export enum AggregationType {
  Count = 'count',
  Sum = 'sum',
  Average = 'average',
  Min = 'min',
  Max = 'max',
  CountUnique = 'countUnique',
  ArrayUnique = 'arrayUnique',
  Concatenate = 'concatenate',
}

/**
 * 聚合配置
 */
export interface IAggregationConfig {
  type: AggregationType;
  columnId: ColumnId;
  name?: string;
}
