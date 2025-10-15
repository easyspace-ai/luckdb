/**
 * 行操作管理器
 */

import type { IRow, RowId } from '../types';
import type {
  IAddRowParams,
  IDeleteRowParams,
  IUpdateRowParams,
  IDuplicateRowParams,
  IMoveRowParams,
  IOperationCallbacks,
} from './types';

export class RowOperations {
  private rows: IRow[];
  private callbacks: IOperationCallbacks;
  private nextRowId = 1;

  constructor(rows: IRow[], callbacks?: IOperationCallbacks) {
    this.rows = rows;
    this.callbacks = callbacks || {};

    // 计算下一个可用ID
    this.nextRowId = this.rows.reduce((max, row) => {
      const id = typeof row.id === 'number' ? row.id : parseInt(String(row.id), 10);
      return isNaN(id) ? max : Math.max(max, id + 1);
    }, 1);
  }

  /**
   * 添加行
   */
  addRow(params?: IAddRowParams): IRow {
    const index = params?.index ?? this.rows.length;
    const data = params?.data || {};

    const newRow: IRow = {
      id: this.nextRowId++,
      height: 36,
      data: {
        ...data,
      },
    };

    this.rows.splice(index, 0, newRow);
    this.callbacks.onRowAdded?.(newRow, index);

    return newRow;
  }

  /**
   * 删除行
   */
  deleteRow(params: IDeleteRowParams): boolean {
    const index = this.rows.findIndex((row) => row.id === params.rowId);
    if (index === -1) {
      return false;
    }

    this.rows.splice(index, 1);
    this.callbacks.onRowDeleted?.(params.rowId);

    return true;
  }

  /**
   * 更新行
   */
  updateRow(params: IUpdateRowParams): boolean {
    const row = this.rows.find((r) => r.id === params.rowId);
    if (!row) {
      return false;
    }

    Object.assign(row.data, params.data);
    this.callbacks.onRowUpdated?.(params.rowId, params.data);

    return true;
  }

  /**
   * 复制行
   */
  duplicateRow(params: IDuplicateRowParams): IRow | null {
    const sourceRow = this.rows.find((r) => r.id === params.rowId);
    if (!sourceRow) {
      return null;
    }

    const index = params.index ?? this.rows.findIndex((r) => r.id === params.rowId) + 1;

    const newRow: IRow = {
      id: this.nextRowId++,
      height: sourceRow.height,
      data: {
        ...sourceRow.data,
      },
    };

    this.rows.splice(index, 0, newRow);
    this.callbacks.onRowAdded?.(newRow, index);

    return newRow;
  }

  /**
   * 移动行
   */
  moveRow(params: IMoveRowParams): boolean {
    const fromIndex = this.rows.findIndex((r) => r.id === params.rowId);
    if (fromIndex === -1 || fromIndex === params.toIndex) {
      return false;
    }

    const [row] = this.rows.splice(fromIndex, 1);
    this.rows.splice(params.toIndex, 0, row);

    return true;
  }

  /**
   * 批量添加行
   */
  addRows(rowsData: Array<Record<string, any>>): IRow[] {
    const newRows = rowsData.map((data, i) => {
      const row: IRow = {
        id: this.nextRowId++,
        height: 36,
        data,
      };
      return row;
    });

    this.rows.push(...newRows);
    return newRows;
  }

  /**
   * 批量删除行
   */
  deleteRows(rowIds: RowId[]): number {
    let deletedCount = 0;

    for (const rowId of rowIds) {
      if (this.deleteRow({ rowId })) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * 获取所有行
   */
  getRows(): IRow[] {
    return this.rows;
  }

  /**
   * 获取行数量
   */
  getRowCount(): number {
    return this.rows.length;
  }

  /**
   * 根据ID获取行
   */
  getRowById(rowId: RowId): IRow | undefined {
    return this.rows.find((r) => r.id === rowId);
  }

  /**
   * 根据索引获取行
   */
  getRowByIndex(index: number): IRow | undefined {
    return this.rows[index];
  }
}
