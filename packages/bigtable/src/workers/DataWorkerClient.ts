/**
 * Data Worker 客户端
 * 主线程与 Worker 通信的封装
 */

import type { IRow, ColumnId } from '../core/types';
import type { ISortConfig, IFilterCondition, IGroupConfig } from '../core/data/types';

export class DataWorkerClient {
  private worker: Worker | null = null;
  private messageId = 0;
  private pendingRequests = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }
  >();

  constructor(workerPath: string = '/data-worker.js') {
    try {
      this.worker = new Worker(new URL('../workers/data-worker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (e) => {
        const { messageId, type, data, error } = e.data;

        const request = this.pendingRequests.get(messageId);
        if (!request) return;

        if (type === 'ERROR') {
          request.reject(new Error(error));
        } else {
          request.resolve(data);
        }

        this.pendingRequests.delete(messageId);
      };

      this.worker.onerror = (error) => {
        console.error('[DataWorkerClient] Worker error:', error);
      };

      console.log('[DataWorkerClient] Initialized');
    } catch (error) {
      console.warn('[DataWorkerClient] Worker not supported:', error);
    }
  }

  /**
   * 排序
   */
  async sort(rows: IRow[], config: ISortConfig[]): Promise<IRow[]> {
    if (!this.worker) {
      // 降级到主线程排序
      return this.sortInMainThread(rows, config);
    }

    return this.sendMessage({
      type: 'SORT',
      rows,
      config,
    });
  }

  /**
   * 筛选
   */
  async filter(rows: IRow[], conditions: IFilterCondition[]): Promise<IRow[]> {
    if (!this.worker) {
      // 降级到主线程筛选
      return this.filterInMainThread(rows, conditions);
    }

    return this.sendMessage({
      type: 'FILTER',
      rows,
      conditions,
    });
  }

  /**
   * 分组
   */
  async group(rows: IRow[], config: IGroupConfig): Promise<any[]> {
    if (!this.worker) {
      // 降级到主线程分组
      return this.groupInMainThread(rows, config);
    }

    return this.sendMessage({
      type: 'GROUP',
      rows,
      config,
    });
  }

  /**
   * 聚合
   */
  async aggregate(
    rows: IRow[],
    columnId: ColumnId,
    operation: 'sum' | 'avg' | 'min' | 'max' | 'count'
  ): Promise<number> {
    if (!this.worker) {
      // 降级到主线程聚合
      return this.aggregateInMainThread(rows, columnId, operation);
    }

    return this.sendMessage({
      type: 'AGGREGATE',
      rows,
      columnId,
      operation,
    });
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.pendingRequests.clear();
  }

  // ==================== 私有方法 ====================

  /**
   * 发送消息到 Worker
   */
  private sendMessage(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      this.pendingRequests.set(id, { resolve, reject });

      this.worker!.postMessage({
        messageId: id,
        ...message,
      });

      // 超时处理
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Worker request timeout'));
        }
      }, 30000); // 30秒超时
    });
  }

  /**
   * 主线程排序（降级方案）
   */
  private sortInMainThread(rows: IRow[], config: ISortConfig[]): Promise<IRow[]> {
    const sorted = [...rows].sort((a, b) => {
      for (const sortConfig of config) {
        const aValue = a.data[sortConfig.columnId as string];
        const bValue = b.data[sortConfig.columnId as string];

        let comparison = 0;

        if (aValue === null || aValue === undefined) {
          comparison = 1;
        } else if (bValue === null || bValue === undefined) {
          comparison = -1;
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }

        if (comparison !== 0) {
          return sortConfig.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });

    return Promise.resolve(sorted);
  }

  /**
   * 主线程筛选（降级方案）
   */
  private filterInMainThread(rows: IRow[], conditions: IFilterCondition[]): Promise<IRow[]> {
    const filtered = rows.filter((row) => {
      return conditions.every((condition) => {
        const cellValue = row.data[condition.columnId as string];

        switch (condition.operator) {
          case 'equals':
            return cellValue === condition.value;
          case 'not_equals':
            return cellValue !== condition.value;
          default:
            return true;
        }
      });
    });

    return Promise.resolve(filtered);
  }

  /**
   * 主线程分组（降级方案）
   */
  private groupInMainThread(rows: IRow[], config: IGroupConfig): Promise<any[]> {
    const groups = new Map<unknown, IRow[]>();

    rows.forEach((row) => {
      const key = row.data[config.columnId as string];
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(row);
    });

    const result = Array.from(groups.entries()).map(([key, rows]) => ({
      key,
      rows,
      count: rows.length,
    }));

    return Promise.resolve(result);
  }

  /**
   * 主线程聚合（降级方案）
   */
  private aggregateInMainThread(
    rows: IRow[],
    columnId: ColumnId,
    operation: 'sum' | 'avg' | 'min' | 'max' | 'count'
  ): Promise<number> {
    const values = rows.map((row) => Number(row.data[columnId as string])).filter((v) => !isNaN(v));

    let result: number;

    switch (operation) {
      case 'sum':
        result = values.reduce((sum, v) => sum + v, 0);
        break;
      case 'avg':
        result = values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
        break;
      case 'min':
        result = values.length > 0 ? Math.min(...values) : 0;
        break;
      case 'max':
        result = values.length > 0 ? Math.max(...values) : 0;
        break;
      case 'count':
        result = values.length;
        break;
      default:
        result = 0;
    }

    return Promise.resolve(result);
  }
}
