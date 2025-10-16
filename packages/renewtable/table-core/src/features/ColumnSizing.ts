/**
 * ColumnSizing Feature
 * Handles column width resizing
 * Based on TanStack Table architecture + aitable implementation
 */

import { TableFeature } from '../types/core';

export interface ColumnSizingState {
  columnSizing: Record<string, number>;
  columnSizingInfo: {
    isResizing: boolean;
    startX: number;
    startWidth: number;
    columnId: string;
    columnIndex: number;
  };
}

export interface ColumnSizingOptions {
  enableColumnResizing?: boolean;
  columnResizeMode?: 'onChange' | 'onEnd';
  onColumnSizingChange?: (sizing: Record<string, number>) => void;
}

export const ColumnSizing: TableFeature = {
  name: 'ColumnSizing',

  getInitialState(state) {
    return {
      columnSizing: {},
      columnSizingInfo: {
        isResizing: false,
        startX: 0,
        startWidth: 0,
        columnId: '',
        columnIndex: -1,
      },
      ...state,
    };
  },
};

/**
 * Column Resize Handler
 * Manages the column resizing interaction
 */
export class ColumnResizeHandler {
  private isResizing = false;
  private startX = 0;
  private startWidth = 0;
  private columnIndex = -1;
  private columnId = '';
  private minWidth = 50;
  private maxWidth = 800;

  public startResize(
    columnIndex: number,
    columnId: string,
    startX: number,
    startWidth: number,
    minWidth = 50,
    maxWidth = 800
  ): void {
    this.isResizing = true;
    this.columnIndex = columnIndex;
    this.columnId = columnId;
    this.startX = startX;
    this.startWidth = startWidth;
    this.minWidth = minWidth;
    this.maxWidth = maxWidth;

    // Set cursor style
    document.body.style.cursor = 'col-resize';
  }

  public updateResize(currentX: number): number {
    if (!this.isResizing) return this.startWidth;

    const delta = currentX - this.startX;
    const newWidth = this.startWidth + delta;

    // Clamp to min/max
    return Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));
  }

  public endResize(): {
    columnIndex: number;
    columnId: string;
    newWidth: number;
  } | null {
    if (!this.isResizing) return null;

    const result = {
      columnIndex: this.columnIndex,
      columnId: this.columnId,
      newWidth: this.startWidth,
    };

    this.isResizing = false;
    this.columnIndex = -1;
    this.columnId = '';

    // Reset cursor
    document.body.style.cursor = '';

    return result;
  }

  public isCurrentlyResizing(): boolean {
    return this.isResizing;
  }

  public getResizingColumn(): { index: number; id: string } | null {
    if (!this.isResizing) return null;
    return {
      index: this.columnIndex,
      id: this.columnId,
    };
  }
}

