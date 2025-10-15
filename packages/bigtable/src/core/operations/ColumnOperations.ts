/**
 * 列操作管理器
 */

import type { IColumn, ColumnId } from '../types';
import type {
  IAddColumnParams,
  IDeleteColumnParams,
  IUpdateColumnParams,
  IMoveColumnParams,
  IOperationCallbacks,
} from './types';

export class ColumnOperations {
  private columns: IColumn[];
  private callbacks: IOperationCallbacks;

  constructor(columns: IColumn[], callbacks?: IOperationCallbacks) {
    this.columns = columns;
    this.callbacks = callbacks || {};
  }

  /**
   * 添加列
   */
  addColumn(params: IAddColumnParams): IColumn {
    const index = params.index ?? this.columns.length;
    const column = params.column;

    this.columns.splice(index, 0, column);
    this.callbacks.onColumnAdded?.(column, index);

    return column;
  }

  /**
   * 删除列
   */
  deleteColumn(params: IDeleteColumnParams): boolean {
    const index = this.columns.findIndex((col) => col.id === params.columnId);
    if (index === -1) {
      return false;
    }

    this.columns.splice(index, 1);
    this.callbacks.onColumnDeleted?.(params.columnId);

    return true;
  }

  /**
   * 更新列
   */
  updateColumn(params: IUpdateColumnParams): boolean {
    const column = this.columns.find((col) => col.id === params.columnId);
    if (!column) {
      return false;
    }

    Object.assign(column, params.updates);
    this.callbacks.onColumnUpdated?.(params.columnId, params.updates);

    return true;
  }

  /**
   * 移动列
   */
  moveColumn(params: IMoveColumnParams): boolean {
    const fromIndex = this.columns.findIndex((col) => col.id === params.columnId);
    if (fromIndex === -1 || fromIndex === params.toIndex) {
      return false;
    }

    const [column] = this.columns.splice(fromIndex, 1);
    this.columns.splice(params.toIndex, 0, column);

    return true;
  }

  /**
   * 调整列宽
   */
  resizeColumn(columnId: ColumnId, width: number): boolean {
    return this.updateColumn({
      columnId,
      updates: { width },
    });
  }

  /**
   * 冻结列
   */
  freezeColumn(columnId: ColumnId, frozen: boolean): boolean {
    return this.updateColumn({
      columnId,
      updates: { frozen },
    });
  }

  /**
   * 隐藏列
   */
  hideColumn(columnId: ColumnId, hidden: boolean): boolean {
    return this.updateColumn({
      columnId,
      updates: { hidden },
    });
  }

  /**
   * 获取所有列
   */
  getColumns(): IColumn[] {
    return this.columns;
  }

  /**
   * 获取列数量
   */
  getColumnCount(): number {
    return this.columns.length;
  }

  /**
   * 根据ID获取列
   */
  getColumnById(columnId: ColumnId): IColumn | undefined {
    return this.columns.find((col) => col.id === columnId);
  }

  /**
   * 根据索引获取列
   */
  getColumnByIndex(index: number): IColumn | undefined {
    return this.columns[index];
  }
}
