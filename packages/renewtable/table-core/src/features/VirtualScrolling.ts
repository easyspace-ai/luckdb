/**
 * VirtualScrolling Feature
 * Handles virtual scrolling for large datasets
 */

import { CoordinateManager } from '../core/coordinate';
import { TableFeature, VisibleRange } from '../types/core';

export interface VirtualScrollingState {
  scrollTop: number;
  scrollLeft: number;
  visibleRange?: VisibleRange;
}

export class VirtualScroller {
  private scrollTop = 0;
  private scrollLeft = 0;

  constructor(
    private coordManager: CoordinateManager,
    private containerHeight: number,
    private containerWidth: number,
    private overscanRowCount = 5,
    private overscanColumnCount = 2
  ) {}

  public getVisibleRange(scrollTop: number, scrollLeft: number): VisibleRange {
    this.scrollTop = scrollTop;
    this.scrollLeft = scrollLeft;

    // Calculate visible row range
    const startRow = Math.max(0, this.coordManager.getRowStartIndex(scrollTop) - this.overscanRowCount);
    const endRow = Math.min(
      this.coordManager.rowCount - 1,
      this.coordManager.getRowStopIndex(startRow, scrollTop) + this.overscanRowCount
    );

    // Calculate visible column range
    const startCol = Math.max(0, this.coordManager.getColumnStartIndex(scrollLeft) - this.overscanColumnCount);
    const endCol = Math.min(
      this.coordManager.columnCount - 1,
      this.coordManager.getColumnStopIndex(startCol, scrollLeft) + this.overscanColumnCount
    );

    return {
      startRow,
      endRow,
      startCol,
      endCol,
    };
  }

  public scrollToRow(rowIndex: number): number {
    const offset = this.coordManager.getRowOffset(rowIndex);
    return offset;
  }

  public scrollToColumn(columnIndex: number): number {
    const offset = this.coordManager.getColumnOffset(columnIndex);
    return offset;
  }

  public updateDimensions(containerWidth: number, containerHeight: number): void {
    this.containerWidth = containerWidth;
    this.containerHeight = containerHeight;
    this.coordManager.containerWidth = containerWidth;
    this.coordManager.containerHeight = containerHeight;
  }
}

export const VirtualScrolling: TableFeature = {
  name: 'VirtualScrolling',
  
  getInitialState(state) {
    return {
      scrollTop: 0,
      scrollLeft: 0,
      ...state,
    };
  },
};

