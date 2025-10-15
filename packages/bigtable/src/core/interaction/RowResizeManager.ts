/**
 * 行高调整管理器
 * 处理行高拖拽调整功能
 */

export interface IRowResizeConfig {
  minHeight?: number;
  maxHeight?: number;
  resizeHandleHeight?: number; // 拖拽把手的高度
}

export interface IRowResizeCallbacks {
  onResizeStart?: (rowIndex: number) => void;
  onResizing?: (rowIndex: number, newHeight: number) => void;
  onResizeEnd?: (rowIndex: number, newHeight: number) => void;
}

export interface IRowResizeState {
  isResizing: boolean;
  rowIndex: number;
  startY: number;
  startHeight: number;
}

export class RowResizeManager {
  private config: Required<IRowResizeConfig>;
  private callbacks: IRowResizeCallbacks;
  private resizeState: IRowResizeState | null = null;

  constructor(config?: Partial<IRowResizeConfig>, callbacks?: IRowResizeCallbacks) {
    this.config = {
      minHeight: config?.minHeight ?? 24,
      maxHeight: config?.maxHeight ?? 500,
      resizeHandleHeight: config?.resizeHandleHeight ?? 6,
    };

    this.callbacks = callbacks || {};
  }

  /**
   * 检查是否在行分隔线上（可拖拽区域）
   */
  isOnResizeHandle(
    y: number,
    rowOffsets: number[],
    scrollTop: number = 0,
    headerHeight: number = 40
  ): number {
    const handleHeight = this.config.resizeHandleHeight;

    for (let i = 0; i < rowOffsets.length - 1; i++) {
      const rowEndY = rowOffsets[i + 1] - scrollTop + headerHeight;

      // 检查鼠标是否在行边界附近（±handleHeight/2）
      if (Math.abs(y - rowEndY) <= handleHeight / 2) {
        return i; // 返回可调整的行索引
      }
    }

    return -1; // 不在任何调整把手上
  }

  /**
   * 开始调整行高
   */
  startResize(rowIndex: number, mouseY: number, currentHeight: number): void {
    this.resizeState = {
      isResizing: true,
      rowIndex,
      startY: mouseY,
      startHeight: currentHeight,
    };

    this.callbacks.onResizeStart?.(rowIndex);
  }

  /**
   * 调整中
   */
  resize(mouseY: number): number | null {
    if (!this.resizeState) return null;

    const { startY, startHeight, rowIndex } = this.resizeState;
    const delta = mouseY - startY;
    let newHeight = startHeight + delta;

    // 限制最小/最大高度
    newHeight = Math.max(this.config.minHeight, Math.min(this.config.maxHeight, newHeight));

    this.callbacks.onResizing?.(rowIndex, newHeight);

    return newHeight;
  }

  /**
   * 结束调整
   */
  endResize(): { rowIndex: number; newHeight: number } | null {
    if (!this.resizeState) return null;

    const { rowIndex, startHeight } = this.resizeState;
    const result = {
      rowIndex,
      newHeight: startHeight, // 实际高度由resize方法计算
    };

    this.callbacks.onResizeEnd?.(rowIndex, result.newHeight);

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
  getResizeState(): IRowResizeState | null {
    return this.resizeState ? { ...this.resizeState } : null;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.resizeState = null;
  }
}
