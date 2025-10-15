/**
 * 列拖拽排序管理器
 * 处理列的拖拽重排功能
 */

export interface IColumnDragConfig {
  dragThreshold?: number; // 拖拽触发阈值（像素）
  canDragColumn?: (columnIndex: number) => boolean;
}

export interface IColumnDragCallbacks {
  onDragStart?: (columnIndex: number) => void;
  onDragging?: (fromIndex: number, toIndex: number) => void;
  onDragEnd?: (fromIndex: number, toIndex: number) => void;
  onDragCancel?: () => void;
}

export interface IDragState {
  isDragging: boolean;
  dragColumnIndex: number;
  currentX: number;
  startX: number;
  draggedOverColumnIndex: number;
}

export class ColumnDragManager {
  private config: Required<IColumnDragConfig>;
  private callbacks: IColumnDragCallbacks;
  private dragState: IDragState | null = null;

  constructor(config?: Partial<IColumnDragConfig>, callbacks?: IColumnDragCallbacks) {
    this.config = {
      dragThreshold: config?.dragThreshold ?? 5,
      canDragColumn: config?.canDragColumn ?? (() => true),
    };

    this.callbacks = callbacks || {};
  }

  /**
   * 开始拖拽
   */
  startDrag(columnIndex: number, mouseX: number): boolean {
    if (!this.config.canDragColumn(columnIndex)) {
      return false;
    }

    this.dragState = {
      isDragging: false, // 先不激活，等超过阈值
      dragColumnIndex: columnIndex,
      currentX: mouseX,
      startX: mouseX,
      draggedOverColumnIndex: columnIndex,
    };

    return true;
  }

  /**
   * 拖拽中
   */
  drag(
    mouseX: number
  ): { isDragging: boolean; shouldSwap: boolean; fromIndex: number; toIndex: number } | null {
    if (!this.dragState) return null;

    this.dragState.currentX = mouseX;

    // 检查是否超过拖拽阈值
    const deltaX = Math.abs(mouseX - this.dragState.startX);
    if (!this.dragState.isDragging && deltaX > this.config.dragThreshold) {
      this.dragState.isDragging = true;
      this.callbacks.onDragStart?.(this.dragState.dragColumnIndex);
    }

    return {
      isDragging: this.dragState.isDragging,
      shouldSwap: false,
      fromIndex: this.dragState.dragColumnIndex,
      toIndex: this.dragState.draggedOverColumnIndex,
    };
  }

  /**
   * 更新拖拽悬停列
   */
  updateDraggedOverColumn(columnIndex: number): void {
    if (!this.dragState) return;

    if (columnIndex !== this.dragState.draggedOverColumnIndex) {
      this.dragState.draggedOverColumnIndex = columnIndex;

      if (this.dragState.isDragging) {
        this.callbacks.onDragging?.(this.dragState.dragColumnIndex, columnIndex);
      }
    }
  }

  /**
   * 结束拖拽
   */
  endDrag(): { fromIndex: number; toIndex: number } | null {
    if (!this.dragState) return null;

    const result = {
      fromIndex: this.dragState.dragColumnIndex,
      toIndex: this.dragState.draggedOverColumnIndex,
    };

    // 只有真正拖拽了才触发回调
    if (this.dragState.isDragging && result.fromIndex !== result.toIndex) {
      this.callbacks.onDragEnd?.(result.fromIndex, result.toIndex);
    }

    this.dragState = null;

    return result.fromIndex !== result.toIndex ? result : null;
  }

  /**
   * 取消拖拽
   */
  cancelDrag(): void {
    if (this.dragState) {
      this.callbacks.onDragCancel?.();
      this.dragState = null;
    }
  }

  /**
   * 是否正在拖拽
   */
  isDragging(): boolean {
    return this.dragState !== null && this.dragState.isDragging;
  }

  /**
   * 获取拖拽状态
   */
  getDragState(): IDragState | null {
    return this.dragState ? { ...this.dragState } : null;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.dragState = null;
  }
}
