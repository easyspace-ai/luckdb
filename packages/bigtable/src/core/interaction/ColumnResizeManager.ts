/**
 * 列宽调整管理器
 * 处理列宽拖拽调整功能
 */

export interface IColumnResizeConfig {
  minWidth?: number;
  maxWidth?: number;
  resizeHandleWidth?: number; // 拖拽把手的宽度
}

export interface IColumnResizeCallbacks {
  onResizeStart?: (columnIndex: number) => void;
  onResizing?: (columnIndex: number, newWidth: number) => void;
  onResizeEnd?: (columnIndex: number, newWidth: number) => void;
}

export interface IResizeState {
  isResizing: boolean;
  columnIndex: number;
  startX: number;
  startWidth: number;
  currentWidth: number;
}

export class ColumnResizeManager {
  private config: Required<IColumnResizeConfig>;
  private callbacks: IColumnResizeCallbacks;
  private resizeState: IResizeState | null = null;

  constructor(config?: Partial<IColumnResizeConfig>, callbacks?: IColumnResizeCallbacks) {
    this.config = {
      minWidth: config?.minWidth ?? 50,
      maxWidth: config?.maxWidth ?? 1000,
      resizeHandleWidth: config?.resizeHandleWidth ?? 6,
    };

    this.callbacks = callbacks || {};
  }

  /**
   * 检查是否在列分隔线上（可拖拽区域）
   */
  isOnResizeHandle(x: number, displayOffsets: number[]): number {
    const handleWidth = this.config.resizeHandleWidth;

    for (let i = 0; i < displayOffsets.length - 1; i++) {
      const columnEndX = displayOffsets[i + 1];

      // 检查鼠标是否在列边界附近（±handleWidth/2）
      if (Math.abs(x - columnEndX) <= handleWidth / 2) {
        return i; // 返回可调整的列索引
      }
    }

    return -1; // 不在任何调整把手上
  }

  /**
   * 开始调整列宽
   */
  startResize(columnIndex: number, mouseX: number, currentWidth: number): void {
    this.resizeState = {
      isResizing: true,
      columnIndex,
      startX: mouseX,
      startWidth: currentWidth,
      currentWidth: currentWidth,
    };

    this.callbacks.onResizeStart?.(columnIndex);
  }

  /**
   * 调整中
   */
  resize(mouseX: number): number | null {
    if (!this.resizeState) return null;

    const { startX, startWidth, columnIndex } = this.resizeState;
    const delta = mouseX - startX;
    let newWidth = startWidth + delta;

    // 限制最小/最大宽度
    newWidth = Math.max(this.config.minWidth, Math.min(this.config.maxWidth, newWidth));

    // 保存当前宽度
    this.resizeState.currentWidth = newWidth;

    this.callbacks.onResizing?.(columnIndex, newWidth);

    return newWidth;
  }

  /**
   * 结束调整
   */
  endResize(): { columnIndex: number; newWidth: number } | null {
    if (!this.resizeState) return null;

    const { columnIndex, currentWidth } = this.resizeState;
    const result = {
      columnIndex,
      newWidth: currentWidth, // 使用当前宽度（调整后的实际宽度）
    };

    this.callbacks.onResizeEnd?.(columnIndex, result.newWidth);

    this.resizeState = null;

    return result;
  }

  /**
   * 取消调整
   */
  cancelResize(): void {
    this.resizeState = null;
  }

  /**
   * 是否正在调整
   */
  isResizing(): boolean {
    return this.resizeState !== null && this.resizeState.isResizing;
  }

  /**
   * 获取调整状态
   */
  getResizeState(): IResizeState | null {
    return this.resizeState ? { ...this.resizeState } : null;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.resizeState = null;
  }
}
