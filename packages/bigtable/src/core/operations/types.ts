/**
 * 操作类型定义
 */

import type { IRow, IColumn, RowId, ColumnId, CellId } from '../types';

/**
 * 操作类型
 */
export enum OperationType {
  // 行操作
  AddRow = 'addRow',
  DeleteRow = 'deleteRow',
  UpdateRow = 'updateRow',
  DuplicateRow = 'duplicateRow',
  MoveRow = 'moveRow',

  // 列操作
  AddColumn = 'addColumn',
  DeleteColumn = 'deleteColumn',
  UpdateColumn = 'updateColumn',
  MoveColumn = 'moveColumn',

  // 单元格操作
  UpdateCell = 'updateCell',
  UpdateCells = 'updateCells',

  // 批量操作
  BatchUpdate = 'batchUpdate',
}

/**
 * 操作接口
 */
export interface IOperation {
  type: OperationType;
  timestamp: number;
  userId?: string;
  data: any;
}

/**
 * 行操作参数
 */
export interface IAddRowParams {
  index?: number;
  data?: Record<string, any>;
}

export interface IDeleteRowParams {
  rowId: RowId;
}

export interface IUpdateRowParams {
  rowId: RowId;
  data: Partial<IRow['data']>;
}

export interface IDuplicateRowParams {
  rowId: RowId;
  index?: number;
}

export interface IMoveRowParams {
  rowId: RowId;
  toIndex: number;
}

/**
 * 列操作参数
 */
export interface IAddColumnParams {
  column: IColumn;
  index?: number;
}

export interface IDeleteColumnParams {
  columnId: ColumnId;
}

export interface IUpdateColumnParams {
  columnId: ColumnId;
  updates: Partial<IColumn>;
}

export interface IMoveColumnParams {
  columnId: ColumnId;
  toIndex: number;
}

/**
 * 单元格操作参数
 */
export interface IUpdateCellParams {
  rowId: RowId;
  columnId: ColumnId;
  value: unknown;
}

/**
 * 操作回调
 */
export interface IOperationCallbacks {
  onRowAdded?: (row: IRow, index: number) => void;
  onRowDeleted?: (rowId: RowId) => void;
  onRowUpdated?: (rowId: RowId, data: Partial<IRow['data']>) => void;
  onColumnAdded?: (column: IColumn, index: number) => void;
  onColumnDeleted?: (columnId: ColumnId) => void;
  onColumnUpdated?: (columnId: ColumnId, updates: Partial<IColumn>) => void;
  onCellUpdated?: (rowId: RowId, columnId: ColumnId, value: unknown) => void;
}
