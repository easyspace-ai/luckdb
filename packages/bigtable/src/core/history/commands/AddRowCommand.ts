/**
 * 添加行命令
 */

import type { ICommand } from '../types';
import type { IRow, RowId } from '../../types';

export interface IAddRowCommandParams {
  row: IRow;
  index: number;
  addFn: (row: IRow, index: number) => void;
  deleteFn: (rowId: RowId) => void;
}

export class AddRowCommand implements ICommand {
  private params: IAddRowCommandParams;

  constructor(params: IAddRowCommandParams) {
    this.params = params;
  }

  execute(): void {
    this.params.addFn(this.params.row, this.params.index);
  }

  undo(): void {
    this.params.deleteFn(this.params.row.id);
  }

  redo(): void {
    this.execute();
  }
}
