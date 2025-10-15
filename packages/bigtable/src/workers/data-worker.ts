/**
 * Data Worker
 * 在 Web Worker 中处理数据操作（排序/筛选/分组）
 * 避免阻塞主线程
 */

import type { IRow, IColumn, ColumnId } from '../core/types';
import type { ISortConfig, IFilterCondition, IGroupConfig } from '../core/data/types';

// Worker 消息类型
type WorkerMessage =
  | { type: 'SORT'; rows: IRow[]; config: ISortConfig[] }
  | { type: 'FILTER'; rows: IRow[]; conditions: IFilterCondition[] }
  | { type: 'GROUP'; rows: IRow[]; config: IGroupConfig }
  | {
      type: 'AGGREGATE';
      rows: IRow[];
      columnId: ColumnId;
      operation: 'sum' | 'avg' | 'min' | 'max' | 'count';
    };

// Worker 响应类型
type WorkerResponse =
  | { type: 'SORT_RESULT'; rows: IRow[] }
  | { type: 'FILTER_RESULT'; rows: IRow[] }
  | { type: 'GROUP_RESULT'; groups: any[] }
  | { type: 'AGGREGATE_RESULT'; value: number }
  | { type: 'ERROR'; error: string };

// Worker 上下文
const ctx: Worker = self as any;

/**
 * 处理消息
 */
ctx.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type } = e.data;

  try {
    switch (type) {
      case 'SORT':
        handleSort(e.data);
        break;

      case 'FILTER':
        handleFilter(e.data);
        break;

      case 'GROUP':
        handleGroup(e.data);
        break;

      case 'AGGREGATE':
        handleAggregate(e.data);
        break;

      default:
        console.warn('[DataWorker] Unknown message type:', type);
    }
  } catch (error) {
    ctx.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * 处理排序
 */
function handleSort(message: Extract<WorkerMessage, { type: 'SORT' }>): void {
  const { rows, config } = message;

  const sortedRows = [...rows].sort((a, b) => {
    for (const sortConfig of config) {
      const { columnId, direction } = sortConfig;

      const aValue = a.data[columnId as string];
      const bValue = b.data[columnId as string];

      let comparison = 0;

      if (aValue === null || aValue === undefined) {
        comparison = 1;
      } else if (bValue === null || bValue === undefined) {
        comparison = -1;
      } else if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      if (comparison !== 0) {
        return direction === 'desc' ? -comparison : comparison;
      }
    }

    return 0;
  });

  ctx.postMessage({
    type: 'SORT_RESULT',
    rows: sortedRows,
  });
}

/**
 * 处理筛选
 */
function handleFilter(message: Extract<WorkerMessage, { type: 'FILTER' }>): void {
  const { rows, conditions } = message;

  const filteredRows = rows.filter((row) => {
    return conditions.every((condition) => {
      const { columnId, operator, value } = condition;
      const cellValue = row.data[columnId as string];

      switch (operator) {
        case 'equals':
          return cellValue === value;
        case 'not_equals':
          return cellValue !== value;
        case 'contains':
          return String(cellValue).includes(String(value));
        case 'not_contains':
          return !String(cellValue).includes(String(value));
        case 'greater_than':
          return Number(cellValue) > Number(value);
        case 'less_than':
          return Number(cellValue) < Number(value);
        case 'is_empty':
          return cellValue === null || cellValue === undefined || cellValue === '';
        case 'is_not_empty':
          return cellValue !== null && cellValue !== undefined && cellValue !== '';
        default:
          return true;
      }
    });
  });

  ctx.postMessage({
    type: 'FILTER_RESULT',
    rows: filteredRows,
  });
}

/**
 * 处理分组
 */
function handleGroup(message: Extract<WorkerMessage, { type: 'GROUP' }>): void {
  const { rows, config } = message;
  const { columnId } = config;

  const groups = new Map<unknown, IRow[]>();

  rows.forEach((row) => {
    const key = row.data[columnId as string];
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row);
  });

  const groupsArray = Array.from(groups.entries()).map(([key, rows]) => ({
    key,
    rows,
    count: rows.length,
  }));

  ctx.postMessage({
    type: 'GROUP_RESULT',
    groups: groupsArray,
  });
}

/**
 * 处理聚合
 */
function handleAggregate(message: Extract<WorkerMessage, { type: 'AGGREGATE' }>): void {
  const { rows, columnId, operation } = message;

  const values = rows.map((row) => Number(row.data[columnId as string])).filter((v) => !isNaN(v));

  let result: number;

  switch (operation) {
    case 'sum':
      result = values.reduce((sum, v) => sum + v, 0);
      break;
    case 'avg':
      result = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
      break;
    case 'min':
      result = values.length > 0 ? Math.min(...values) : 0;
      break;
    case 'max':
      result = values.length > 0 ? Math.max(...values) : 0;
      break;
    case 'count':
      result = values.length;
      break;
    default:
      result = 0;
  }

  ctx.postMessage({
    type: 'AGGREGATE_RESULT',
    value: result,
  });
}

// 导出类型给主线程使用
export type { WorkerMessage, WorkerResponse };
