/**
 * 选择管理器
 * 管理单元格/行/列的选择状态
 */

import type { ICellPosition, ISelection, IRange, CellId, RowId, ColumnId } from '../types';

export interface ISelectionCallbacks {
  onSelectionChange?: (selection: ISelection) => void;
  onActiveCellChange?: (position: ICellPosition | null) => void;
}

export class SelectionManager {
  private activeCell: ICellPosition | null = null;
  private selectedRanges: IRange[] = [];
  private selectedRows: Set<RowId> = new Set();
  private selectedColumns: Set<ColumnId> = new Set();
  private callbacks: ISelectionCallbacks;

  constructor(callbacks?: ISelectionCallbacks) {
    this.callbacks = callbacks || {};
  }

  /**
   * 设置活动单元格
   */
  setActiveCell(position: ICellPosition | null): void {
    this.activeCell = position;
    this.callbacks.onActiveCellChange?.(position);
    this.notifySelectionChange();
  }

  /**
   * 获取活动单元格
   */
  getActiveCell(): ICellPosition | null {
    return this.activeCell;
  }

  /**
   * 选择单个单元格
   */
  selectCell(position: ICellPosition): void {
    this.activeCell = position;
    this.selectedRanges = [
      {
        startRow: position.rowIndex,
        endRow: position.rowIndex,
        startColumn: position.columnIndex,
        endColumn: position.columnIndex,
      },
    ];
    this.selectedRows.clear();
    this.selectedColumns.clear();
    this.notifySelectionChange();
  }

  /**
   * 选择范围
   */
  selectRange(range: IRange): void {
    this.selectedRanges = [range];
    this.selectedRows.clear();
    this.selectedColumns.clear();
    this.notifySelectionChange();
  }

  /**
   * 添加范围到选区(多选)
   */
  addRange(range: IRange): void {
    this.selectedRanges.push(range);
    this.notifySelectionChange();
  }

  /**
   * 选择整行
   */
  selectRow(rowId: RowId): void {
    this.selectedRows.clear();
    this.selectedRows.add(rowId);
    this.selectedRanges = [];
    this.selectedColumns.clear();
    this.notifySelectionChange();
  }

  /**
   * 添加行到选区
   */
  addRow(rowId: RowId): void {
    this.selectedRows.add(rowId);
    this.notifySelectionChange();
  }

  /**
   * 选择整列
   */
  selectColumn(columnId: ColumnId): void {
    this.selectedColumns.clear();
    this.selectedColumns.add(columnId);
    this.selectedRanges = [];
    this.selectedRows.clear();
    this.notifySelectionChange();
  }

  /**
   * 添加列到选区
   */
  addColumn(columnId: ColumnId): void {
    this.selectedColumns.add(columnId);
    this.notifySelectionChange();
  }

  /**
   * 全选
   */
  selectAll(rowCount: number, columnCount: number): void {
    this.selectedRanges = [
      {
        startRow: 0,
        endRow: rowCount - 1,
        startColumn: 0,
        endColumn: columnCount - 1,
      },
    ];
    this.notifySelectionChange();
  }

  /**
   * 清除选区
   */
  clearSelection(): void {
    this.selectedRanges = [];
    this.selectedRows.clear();
    this.selectedColumns.clear();
    this.activeCell = null;
    this.notifySelectionChange();
  }

  /**
   * 获取当前选区
   */
  getSelection(): ISelection {
    return {
      activeCell: this.activeCell,
      ranges: this.selectedRanges,
      rows: Array.from(this.selectedRows),
      columns: Array.from(this.selectedColumns),
    };
  }

  /**
   * 检查单元格是否被选中
   */
  isCellSelected(position: ICellPosition): boolean {
    // 检查是否是活动单元格
    if (
      this.activeCell &&
      this.activeCell.rowIndex === position.rowIndex &&
      this.activeCell.columnIndex === position.columnIndex
    ) {
      return true;
    }

    // 检查是否在选区范围内
    return this.selectedRanges.some((range) => this.isPositionInRange(position, range));
  }

  /**
   * 检查位置是否在范围内
   */
  private isPositionInRange(position: ICellPosition, range: IRange): boolean {
    return (
      position.rowIndex >= range.startRow &&
      position.rowIndex <= range.endRow &&
      position.columnIndex >= range.startColumn &&
      position.columnIndex <= range.endColumn
    );
  }

  /**
   * 通知选区变化
   */
  private notifySelectionChange(): void {
    this.callbacks.onSelectionChange?.(this.getSelection());
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.clearSelection();
  }
}
