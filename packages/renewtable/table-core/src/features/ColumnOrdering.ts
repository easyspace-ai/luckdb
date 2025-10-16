/**
 * ColumnOrdering Feature
 * Handles column drag and drop reordering
 * Based on TanStack Table architecture + aitable implementation
 */

import { TableFeature } from '../types/core';

export interface ColumnOrderState {
  columnOrder: string[];
  columnOrderingInfo: {
    isDragging: boolean;
    draggedColumnId: string;
    draggedColumnIndex: number;
    dropTargetIndex: number;
  };
}

export const ColumnOrdering: TableFeature = {
  name: 'ColumnOrdering',

  getInitialState(state) {
    return {
      columnOrder: [],
      columnOrderingInfo: {
        isDragging: false,
        draggedColumnId: '',
        draggedColumnIndex: -1,
        dropTargetIndex: -1,
      },
      ...state,
    };
  },
};

/**
 * Column Drag Handler
 * Manages column drag and drop interaction
 */
export class ColumnDragHandler {
  private isDragging = false;
  private draggedIndex = -1;
  private draggedId = '';
  private dropTargetIndex = -1;
  private dragPreview: HTMLElement | null = null;
  private dropIndicator: HTMLElement | null = null;

  public startDrag(
    columnIndex: number,
    columnId: string,
    sourceElement: HTMLElement,
    startX: number,
    startY: number
  ): void {
    this.isDragging = true;
    this.draggedIndex = columnIndex;
    this.draggedId = columnId;

    // Create drag preview
    this.dragPreview = this.createDragPreview(sourceElement);
    this.dragPreview.style.left = `${startX}px`;
    this.dragPreview.style.top = `${startY}px`;
    document.body.appendChild(this.dragPreview);

    // Create drop indicator
    this.dropIndicator = this.createDropIndicator();
    document.body.appendChild(this.dropIndicator);

    // Set cursor
    document.body.style.cursor = 'grabbing';
  }

  public updateDrag(targetIndex: number, x: number, y: number, targetX: number): void {
    if (!this.isDragging) return;

    this.dropTargetIndex = targetIndex;

    // Update preview position
    if (this.dragPreview) {
      this.dragPreview.style.left = `${x}px`;
      this.dragPreview.style.top = `${y}px`;
    }

    // Update drop indicator
    if (this.dropIndicator) {
      this.dropIndicator.style.left = `${targetX}px`;
      this.dropIndicator.style.display = 'block';
    }
  }

  public endDrag(columnOrder: string[]): string[] {
    if (!this.isDragging) return columnOrder;

    const newOrder = [...columnOrder];
    const draggedId = newOrder.splice(this.draggedIndex, 1)[0];
    
    if (draggedId) {
      const insertIndex = this.dropTargetIndex > this.draggedIndex 
        ? this.dropTargetIndex - 1 
        : this.dropTargetIndex;
      newOrder.splice(insertIndex, 0, draggedId);
    }

    this.cleanup();
    return newOrder;
  }

  public cancelDrag(): void {
    this.cleanup();
  }

  private createDragPreview(sourceElement: HTMLElement): HTMLElement {
    const preview = document.createElement('div');
    preview.className = 'column-drag-preview';
    preview.style.cssText = `
      position: fixed;
      background: white;
      border: 2px solid #1976d2;
      border-radius: 4px;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 600;
      color: #333;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: none;
      z-index: 10000;
      opacity: 0.9;
    `;
    preview.textContent = sourceElement.textContent || 'Column';
    return preview;
  }

  private createDropIndicator(): HTMLElement {
    const indicator = document.createElement('div');
    indicator.className = 'column-drop-indicator';
    indicator.style.cssText = `
      position: fixed;
      width: 2px;
      height: 40px;
      background: #1976d2;
      display: none;
      pointer-events: none;
      z-index: 9999;
    `;
    return indicator;
  }

  private cleanup(): void {
    this.isDragging = false;
    this.draggedIndex = -1;
    this.draggedId = '';
    this.dropTargetIndex = -1;

    if (this.dragPreview) {
      document.body.removeChild(this.dragPreview);
      this.dragPreview = null;
    }

    if (this.dropIndicator) {
      document.body.removeChild(this.dropIndicator);
      this.dropIndicator = null;
    }

    document.body.style.cursor = '';
  }

  public isDraggingColumn(): boolean {
    return this.isDragging;
  }
}

