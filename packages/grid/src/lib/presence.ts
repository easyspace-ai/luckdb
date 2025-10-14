/**
 * Presence System
 * 在线状态和协作者追踪
 */

import type { ShareDBConnection } from './sharedb';

export interface IUserPresence {
  userId: string;
  userName: string;
  userAvatar?: string;
  color: string;
  cursor?: {
    recordId: string;
    fieldId: string;
  };
  selection?: {
    recordIds: string[];
  };
  activeCell?: {
    recordId: string;
    fieldId: string;
  };
  lastActiveTime: number;
}

export interface IPresenceConfig {
  tableId: string;
  viewId?: string;
  connection: ShareDBConnection;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export class PresenceManager {
  private config: IPresenceConfig;
  private presenceDoc: any;
  private localPresence: IUserPresence;
  private remotePresences: Map<string, IUserPresence> = new Map();
  private listeners: Set<(presences: IUserPresence[]) => void> = new Set();
  private heartbeatInterval?: NodeJS.Timeout;
  private color: string;

  constructor(config: IPresenceConfig) {
    this.config = config;
    this.color = this.generateUserColor(config.userId);
    
    this.localPresence = {
      userId: config.userId,
      userName: config.userName,
      userAvatar: config.userAvatar,
      color: this.color,
      lastActiveTime: Date.now(),
    };
  }

  /**
   * 初始化在线状态
   */
  async initialize(): Promise<void> {
    const docPath = `presence.${this.config.tableId}${this.config.viewId ? `.${this.config.viewId}` : ''}`;
    
    try {
      this.presenceDoc = await this.config.connection.subscribe(docPath);
      
      // 监听远程变更
      this.presenceDoc.on('op', () => {
        this.updateRemotePresences();
      });

      // 初始化本地状态
      await this.updateLocalPresence(this.localPresence);

      // 启动心跳
      this.startHeartbeat();

      // 初始加载远程状态
      this.updateRemotePresences();
    } catch (error) {
      console.error('Failed to initialize presence:', error);
      throw error;
    }
  }

  /**
   * 更新光标位置
   */
  async updateCursor(recordId: string, fieldId: string): Promise<void> {
    this.localPresence.cursor = { recordId, fieldId };
    this.localPresence.lastActiveTime = Date.now();
    await this.updateLocalPresence(this.localPresence);
  }

  /**
   * 更新活动单元格
   */
  async updateActiveCell(recordId: string, fieldId: string): Promise<void> {
    this.localPresence.activeCell = { recordId, fieldId };
    this.localPresence.lastActiveTime = Date.now();
    await this.updateLocalPresence(this.localPresence);
  }

  /**
   * 更新选择
   */
  async updateSelection(recordIds: string[]): Promise<void> {
    this.localPresence.selection = { recordIds };
    this.localPresence.lastActiveTime = Date.now();
    await this.updateLocalPresence(this.localPresence);
  }

  /**
   * 清除光标
   */
  async clearCursor(): Promise<void> {
    delete this.localPresence.cursor;
    this.localPresence.lastActiveTime = Date.now();
    await this.updateLocalPresence(this.localPresence);
  }

  /**
   * 清除活动单元格
   */
  async clearActiveCell(): Promise<void> {
    delete this.localPresence.activeCell;
    this.localPresence.lastActiveTime = Date.now();
    await this.updateLocalPresence(this.localPresence);
  }

  /**
   * 获取所有在线用户
   */
  getActiveUsers(): IUserPresence[] {
    const now = Date.now();
    const timeout = 30000; // 30秒超时

    return Array.from(this.remotePresences.values()).filter(
      presence => now - presence.lastActiveTime < timeout
    );
  }

  /**
   * 获取特定单元格的协作者
   */
  getUsersAtCell(recordId: string, fieldId: string): IUserPresence[] {
    return this.getActiveUsers().filter(
      presence =>
        presence.activeCell?.recordId === recordId &&
        presence.activeCell?.fieldId === fieldId
    );
  }

  /**
   * 监听在线状态变更
   */
  onPresenceChange(callback: (presences: IUserPresence[]) => void): () => void {
    this.listeners.add(callback);

    // 立即触发一次
    callback(this.getActiveUsers());

    // 返回取消监听函数
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * 更新本地状态
   */
  private async updateLocalPresence(presence: IUserPresence): Promise<void> {
    if (!this.presenceDoc) return;

    try {
      const data = this.presenceDoc.data || {};
      const users = data.users || {};
      
      await this.config.connection.submitOp(this.presenceDoc.collection + '.' + this.presenceDoc.id, [
        {
          p: ['users', this.config.userId],
          oi: presence,
        },
      ]);
    } catch (error) {
      console.error('Failed to update local presence:', error);
    }
  }

  /**
   * 更新远程状态
   */
  private updateRemotePresences(): void {
    if (!this.presenceDoc || !this.presenceDoc.data) return;

    const users = this.presenceDoc.data.users || {};
    
    this.remotePresences.clear();
    
    for (const [userId, presence] of Object.entries(users)) {
      if (userId !== this.config.userId) {
        this.remotePresences.set(userId, presence as IUserPresence);
      }
    }

    // 通知监听器
    this.notifyListeners();
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    const activeUsers = this.getActiveUsers();
    this.listeners.forEach(callback => callback(activeUsers));
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.localPresence.lastActiveTime = Date.now();
      this.updateLocalPresence(this.localPresence);
    }, 10000); // 每10秒更新一次
  }

  /**
   * 生成用户颜色
   */
  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    ];

    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  }

  /**
   * 清理
   */
  async destroy(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // 移除本地状态
    if (this.presenceDoc) {
      try {
        await this.config.connection.submitOp(
          this.presenceDoc.collection + '.' + this.presenceDoc.id,
          [
            {
              p: ['users', this.config.userId],
              od: this.localPresence,
            },
          ]
        );
      } catch (error) {
        console.error('Failed to remove presence:', error);
      }

      this.presenceDoc.destroy();
    }

    this.listeners.clear();
    this.remotePresences.clear();
  }
}

