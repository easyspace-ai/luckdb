/**
 * Operation History System
 * 操作历史记录、撤销/重做功能
 */

import type { OTOperation } from './ot';

export interface IHistoryEntry {
  id: string;
  operation: OTOperation;
  timestamp: number;
  userId?: string;
  userName?: string;
  description: string;
  recordId?: string;
  fieldId?: string;
}

export interface IHistoryConfig {
  maxSize?: number; // 最大历史记录数
  autoSave?: boolean; // 自动保存到本地存储
  storageKey?: string; // 本地存储键名
}

export class OperationHistory {
  private history: IHistoryEntry[] = [];
  private currentIndex: number = -1;
  private config: Required<IHistoryConfig>;
  private listeners: Set<(history: IHistoryEntry[]) => void> = new Set();

  constructor(config: IHistoryConfig = {}) {
    this.config = {
      maxSize: config.maxSize || 100,
      autoSave: config.autoSave ?? true,
      storageKey: config.storageKey || 'grid_operation_history',
    };

    if (this.config.autoSave) {
      this.loadFromStorage();
    }
  }

  /**
   * 添加操作到历史记录
   */
  push(entry: Omit<IHistoryEntry, 'id' | 'timestamp'>): void {
    // 如果当前不在最新位置，删除后面的历史
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    const historyEntry: IHistoryEntry = {
      ...entry,
      id: this.generateId(),
      timestamp: Date.now(),
    };

    this.history.push(historyEntry);
    this.currentIndex++;

    // 限制历史记录数量
    if (this.history.length > this.config.maxSize) {
      const removeCount = this.history.length - this.config.maxSize;
      this.history = this.history.slice(removeCount);
      this.currentIndex -= removeCount;
    }

    this.notifyListeners();
    
    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  /**
   * 撤销操作
   */
  undo(): IHistoryEntry | null {
    if (!this.canUndo()) return null;

    const entry = this.history[this.currentIndex];
    this.currentIndex--;

    this.notifyListeners();
    
    if (this.config.autoSave) {
      this.saveToStorage();
    }

    return entry;
  }

  /**
   * 重做操作
   */
  redo(): IHistoryEntry | null {
    if (!this.canRedo()) return null;

    this.currentIndex++;
    const entry = this.history[this.currentIndex];

    this.notifyListeners();
    
    if (this.config.autoSave) {
      this.saveToStorage();
    }

    return entry;
  }

  /**
   * 检查是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  /**
   * 检查是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  /**
   * 获取所有历史记录
   */
  getHistory(): IHistoryEntry[] {
    return [...this.history];
  }

  /**
   * 获取指定记录的历史
   */
  getRecordHistory(recordId: string): IHistoryEntry[] {
    return this.history.filter(entry => entry.recordId === recordId);
  }

  /**
   * 获取指定字段的历史
   */
  getFieldHistory(recordId: string, fieldId: string): IHistoryEntry[] {
    return this.history.filter(
      entry => entry.recordId === recordId && entry.fieldId === fieldId
    );
  }

  /**
   * 获取当前位置
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * 跳转到指定历史位置
   */
  jumpTo(index: number): IHistoryEntry | null {
    if (index < 0 || index >= this.history.length) return null;

    this.currentIndex = index;
    this.notifyListeners();

    if (this.config.autoSave) {
      this.saveToStorage();
    }

    return this.history[index];
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.history = [];
    this.currentIndex = -1;
    this.notifyListeners();

    if (this.config.autoSave) {
      this.saveToStorage();
    }
  }

  /**
   * 监听历史变更
   */
  onChange(callback: (history: IHistoryEntry[]) => void): () => void {
    this.listeners.add(callback);

    // 返回取消监听函数
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      const data = {
        history: this.history,
        currentIndex: this.currentIndex,
      };
      localStorage.setItem(this.config.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save history to storage:', error);
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.config.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.history = parsed.history || [];
        this.currentIndex = parsed.currentIndex ?? -1;
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load history from storage:', error);
    }
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.getHistory()));
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 历史回放器
 */
export class HistoryPlayer {
  private history: IHistoryEntry[];
  private currentIndex: number = 0;
  private isPlaying: boolean = false;
  private playSpeed: number = 1000; // 默认每秒一个操作

  constructor(history: IHistoryEntry[]) {
    this.history = [...history];
  }

  /**
   * 开始回放
   */
  async play(
    onStep: (entry: IHistoryEntry, index: number) => void | Promise<void>,
    speed: number = 1000
  ): Promise<void> {
    this.playSpeed = speed;
    this.isPlaying = true;

    while (this.isPlaying && this.currentIndex < this.history.length) {
      const entry = this.history[this.currentIndex];
      await onStep(entry, this.currentIndex);
      
      this.currentIndex++;

      if (this.isPlaying) {
        await this.delay(this.playSpeed);
      }
    }

    this.isPlaying = false;
  }

  /**
   * 暂停回放
   */
  pause(): void {
    this.isPlaying = false;
  }

  /**
   * 恢复回放
   */
  resume(): void {
    this.isPlaying = true;
  }

  /**
   * 停止回放
   */
  stop(): void {
    this.isPlaying = false;
    this.currentIndex = 0;
  }

  /**
   * 跳转到指定位置
   */
  seek(index: number): void {
    if (index >= 0 && index < this.history.length) {
      this.currentIndex = index;
    }
  }

  /**
   * 设置回放速度
   */
  setSpeed(speed: number): void {
    this.playSpeed = speed;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

