/**
 * 历史管理器
 * 实现撤销/重做功能
 */

import type {
  ICommand,
  IHistoryItem,
  IHistoryManagerConfig,
  IHistoryManagerCallbacks,
} from './types';

export class HistoryManager {
  private undoStack: IHistoryItem[] = [];
  private redoStack: IHistoryItem[] = [];
  private config: Required<IHistoryManagerConfig>;
  private callbacks: IHistoryManagerCallbacks;
  private lastBatchTime = 0;

  constructor(config?: Partial<IHistoryManagerConfig>, callbacks?: IHistoryManagerCallbacks) {
    this.config = {
      maxSize: config?.maxSize ?? Infinity,
      batchInterval: config?.batchInterval ?? 300,
      enableRedo: config?.enableRedo ?? true,
    };

    this.callbacks = callbacks || {};
  }

  /**
   * 执行命令(会自动添加到历史记录)
   */
  execute(command: ICommand, description?: string): void {
    // 执行命令
    command.execute();

    // 创建历史记录项
    const item: IHistoryItem = {
      command,
      timestamp: Date.now(),
      description,
    };

    // 尝试与上一个命令合并
    const lastItem = this.undoStack[this.undoStack.length - 1];
    const now = Date.now();

    if (
      lastItem &&
      now - this.lastBatchTime < this.config.batchInterval &&
      lastItem.command.canMerge &&
      lastItem.command.canMerge(command)
    ) {
      // 合并到上一个命令
      lastItem.command.merge?.(command);
      lastItem.timestamp = now;
      this.lastBatchTime = now;
    } else {
      // 添加新命令到历史栈
      this.undoStack.push(item);
      this.lastBatchTime = now;

      // 限制历史记录大小
      if (this.undoStack.length > this.config.maxSize) {
        this.undoStack.shift();
      }
    }

    // 清空重做栈
    if (this.config.enableRedo) {
      this.redoStack = [];
    }

    this.callbacks.onChange?.();
  }

  /**
   * 撤销
   */
  undo(): boolean {
    const item = this.undoStack.pop();
    if (!item) {
      return false;
    }

    item.command.undo();

    // 添加到重做栈
    if (this.config.enableRedo) {
      this.redoStack.push(item);
    }

    this.callbacks.onUndo?.(item);
    this.callbacks.onChange?.();

    return true;
  }

  /**
   * 重做
   */
  redo(): boolean {
    if (!this.config.enableRedo) {
      return false;
    }

    const item = this.redoStack.pop();
    if (!item) {
      return false;
    }

    item.command.redo();

    // 添加回撤销栈
    this.undoStack.push(item);

    this.callbacks.onRedo?.(item);
    this.callbacks.onChange?.();

    return true;
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.callbacks.onClear?.();
    this.callbacks.onChange?.();
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.config.enableRedo && this.redoStack.length > 0;
  }

  /**
   * 获取撤销栈大小
   */
  getUndoCount(): number {
    return this.undoStack.length;
  }

  /**
   * 获取重做栈大小
   */
  getRedoCount(): number {
    return this.redoStack.length;
  }

  /**
   * 获取历史记录
   */
  getHistory(): IHistoryItem[] {
    return [...this.undoStack];
  }
}
