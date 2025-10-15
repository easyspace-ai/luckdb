/**
 * 历史管理类型定义
 */

/**
 * 命令接口
 */
export interface ICommand {
  /**
   * 执行命令
   */
  execute(): void;

  /**
   * 撤销命令
   */
  undo(): void;

  /**
   * 重做命令
   */
  redo(): void;

  /**
   * 是否可以与其他命令合并
   */
  canMerge?(other: ICommand): boolean;

  /**
   * 合并其他命令
   */
  merge?(other: ICommand): void;
}

/**
 * 历史记录项
 */
export interface IHistoryItem {
  command: ICommand;
  timestamp: number;
  userId?: string;
  description?: string;
}

/**
 * 历史管理配置
 */
export interface IHistoryManagerConfig {
  maxSize?: number; // 最大历史记录数(默认无限)
  batchInterval?: number; // 批量操作合并时间窗口(ms)
  enableRedo?: boolean; // 是否启用重做
}

/**
 * 历史管理回调
 */
export interface IHistoryManagerCallbacks {
  onUndo?: (item: IHistoryItem) => void;
  onRedo?: (item: IHistoryItem) => void;
  onClear?: () => void;
  onChange?: () => void;
}
