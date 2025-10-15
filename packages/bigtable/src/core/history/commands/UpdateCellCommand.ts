/**
 * 更新单元格命令
 */

import type { ICommand } from '../types';
import type { RowId, ColumnId } from '../../types';

export interface IUpdateCellCommandParams {
  rowId: RowId;
  columnId: ColumnId;
  oldValue: unknown;
  newValue: unknown;
  updateFn: (rowId: RowId, columnId: ColumnId, value: unknown) => void;
}

export class UpdateCellCommand implements ICommand {
  private params: IUpdateCellCommandParams;

  constructor(params: IUpdateCellCommandParams) {
    this.params = params;
  }

  execute(): void {
    this.params.updateFn(this.params.rowId, this.params.columnId, this.params.newValue);
  }

  undo(): void {
    this.params.updateFn(this.params.rowId, this.params.columnId, this.params.oldValue);
  }

  redo(): void {
    this.execute();
  }

  canMerge(other: ICommand): boolean {
    if (!(other instanceof UpdateCellCommand)) {
      return false;
    }

    // 只合并同一个单元格的连续编辑
    return (
      this.params.rowId === other.params.rowId && this.params.columnId === other.params.columnId
    );
  }

  merge(other: ICommand): void {
    if (other instanceof UpdateCellCommand) {
      // 更新新值,保持旧值不变
      this.params.newValue = other.params.newValue;
    }
  }
}
