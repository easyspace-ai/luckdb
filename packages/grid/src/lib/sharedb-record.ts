/**
 * ShareDB Record Synchronization
 * 记录级别的实时同步
 */

import type { ShareDBConnection } from './sharedb';
import type { Record as RecordModel } from '@/model/record/Record';

export interface IRecordSyncConfig {
  tableId: string;
  viewId?: string;
  connection: ShareDBConnection;
}

export interface IRecordOperation {
  type: 'create' | 'update' | 'delete';
  recordId: string;
  fieldId?: string;
  value?: unknown;
  oldValue?: unknown;
  timestamp: number;
  userId?: string;
}

export class RecordSync {
  private config: IRecordSyncConfig;
  private subscriptions: Map<string, any> = new Map();
  private listeners: Map<string, Set<(op: IRecordOperation) => void>> = new Map();

  constructor(config: IRecordSyncConfig) {
    this.config = config;
  }

  /**
   * 订阅记录变更
   */
  async subscribeRecord(recordId: string): Promise<void> {
    if (this.subscriptions.has(recordId)) {
      return; // 已订阅
    }

    const docPath = `tables.${this.config.tableId}.records.${recordId}`;
    
    try {
      const doc = await this.config.connection.subscribe(docPath);
      
      // 监听操作
      doc.on('op', (op: any[], source: boolean) => {
        if (!source) {
          // 来自其他客户端的操作
          this.handleRemoteOperation(recordId, op);
        }
      });

      this.subscriptions.set(recordId, doc);
    } catch (error) {
      console.error(`Failed to subscribe to record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * 取消订阅记录
   */
  unsubscribeRecord(recordId: string): void {
    const doc = this.subscriptions.get(recordId);
    if (doc) {
      doc.destroy();
      this.subscriptions.delete(recordId);
    }
  }

  /**
   * 更新记录字段
   */
  async updateField(
    recordId: string,
    fieldId: string,
    value: unknown
  ): Promise<void> {
    const docPath = `tables.${this.config.tableId}.records.${recordId}`;
    
    try {
      await this.config.connection.submitOp(docPath, [
        {
          p: ['fields', fieldId],
          oi: value,
        },
      ]);

      // 触发本地监听器
      this.emitOperation({
        type: 'update',
        recordId,
        fieldId,
        value,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`Failed to update field ${fieldId} in record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * 批量更新字段
   */
  async updateFields(
    recordId: string,
    updates: Record<string, unknown>
  ): Promise<void> {
    const docPath = `tables.${this.config.tableId}.records.${recordId}`;
    
    const ops = Object.entries(updates).map(([fieldId, value]) => ({
      p: ['fields', fieldId],
      oi: value,
    }));

    try {
      await this.config.connection.submitOp(docPath, ops);

      // 触发本地监听器
      for (const [fieldId, value] of Object.entries(updates)) {
        this.emitOperation({
          type: 'update',
          recordId,
          fieldId,
          value,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      console.error(`Failed to batch update fields in record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * 创建记录
   */
  async createRecord(
    recordId: string,
    data: Record<string, unknown>
  ): Promise<void> {
    const docPath = `tables.${this.config.tableId}.records.${recordId}`;
    
    try {
      await this.config.connection.create(docPath, {
        id: recordId,
        fields: data,
        createdTime: new Date().toISOString(),
        lastModifiedTime: new Date().toISOString(),
      });

      this.emitOperation({
        type: 'create',
        recordId,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error(`Failed to create record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * 删除记录
   */
  async deleteRecord(recordId: string): Promise<void> {
    const docPath = `tables.${this.config.tableId}.records.${recordId}`;
    
    try {
      await this.config.connection.delete(docPath);

      this.emitOperation({
        type: 'delete',
        recordId,
        timestamp: Date.now(),
      });

      // 取消订阅
      this.unsubscribeRecord(recordId);
    } catch (error) {
      console.error(`Failed to delete record ${recordId}:`, error);
      throw error;
    }
  }

  /**
   * 监听记录变更
   */
  onRecordChange(
    recordId: string,
    callback: (op: IRecordOperation) => void
  ): () => void {
    if (!this.listeners.has(recordId)) {
      this.listeners.set(recordId, new Set());
    }

    this.listeners.get(recordId)!.add(callback);

    // 返回取消监听函数
    return () => {
      const callbacks = this.listeners.get(recordId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.listeners.delete(recordId);
        }
      }
    };
  }

  /**
   * 处理远程操作
   */
  private handleRemoteOperation(recordId: string, ops: any[]): void {
    for (const op of ops) {
      if (op.p && op.p[0] === 'fields' && op.p.length === 2) {
        const fieldId = op.p[1];
        
        this.emitOperation({
          type: 'update',
          recordId,
          fieldId,
          value: op.oi,
          oldValue: op.od,
          timestamp: Date.now(),
        });
      }
    }
  }

  /**
   * 触发操作事件
   */
  private emitOperation(op: IRecordOperation): void {
    const callbacks = this.listeners.get(op.recordId);
    if (callbacks) {
      callbacks.forEach(callback => callback(op));
    }
  }

  /**
   * 清理所有订阅
   */
  destroy(): void {
    this.subscriptions.forEach((doc, recordId) => {
      this.unsubscribeRecord(recordId);
    });
    this.listeners.clear();
  }
}

