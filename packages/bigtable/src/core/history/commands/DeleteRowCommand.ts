/**
 * 删除行命令
 */

import type { ICommand } from '../types';
import type { IRow, RowId } from '../../types';

export interface IDeleteRowCommandParams {
  row: IRow;
  index: number;
  addFn: (row: IRow, index: number) => void;
  deleteFn: (rowId: RowId) => void;
}

export class DeleteRowCommand implements ICommand {
  private params: IDeleteRowCommandParams;

  constructor(params: IDeleteRowCommandParams) {
    this.params = params;
  }

  execute(): void {
    this.params.deleteFn(this.params.row.id);
  }

  undo(): void {
    // 恢复删除的行到原位置
    this.params.addFn(this.params.row, this.params.index);
  }

  redo(): void {
    this.execute();
  }
}
