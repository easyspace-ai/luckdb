/**
 * WebSocket 客户端实现
 * 提供实时协作、通知推送等功能
 * 遵循 ShareDB 风格的协议
 */

import WebSocket from 'ws';

// 简单的 EventEmitter 实现，兼容浏览器环境
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event]!.push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event]!.forEach(listener => listener(...args));
    }
  }

  off(event: string, listener: Function) {
    if (this.events[event]) {
      this.events[event] = this.events[event]!.filter(l => l !== listener);
    }
  }

  removeAllListeners(event?: string) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

import type { LuckDBConfig } from "../types";

export interface WebSocketClientOptions {
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  debug?: boolean;
}

/**
 * WebSocket 消息类型
 */
export type MessageType = 
  | 'subscribe'      // 订阅
  | 'unsubscribe'    // 取消订阅
  | 'query'          // 查询
  | 'queryResponse'  // 查询响应
  | 'submit'         // 提交操作
  | 'submitResponse' // 提交响应
  | 'op'             // 操作 (Operation)
  | 'presence'       // 在线状态
  | 'cursor'         // 光标
  | 'notification'   // 通知
  | 'conflict'       // 冲突
  | 'ping'           // 心跳
  | 'pong'           // 心跳响应
  | 'error';         // 错误

/**
 * 操作消息数据格式 (ShareDB 风格)
 */
export interface OperationMessage {
  op: Array<{
    p: string[];           // path: 操作路径
    oi?: any;             // object insert: 插入/更新对象
    od?: any;             // object delete: 删除对象
    li?: any;             // list insert: 列表插入
    ld?: any;             // list delete: 列表删除
    [key: string]: any;
  }>;
  source?: string;        // 操作来源
}

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | undefined;
  private config: LuckDBConfig;
  private options: WebSocketClientOptions;
  private reconnectAttempts: number = 0;
  private reconnectTimer: any | undefined;
  private heartbeatTimer: any | undefined;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private subscriptions: Set<string> = new Set(); // 记录已订阅的频道
  private messageId: number = 0; // 消息ID计数器

  constructor(config: LuckDBConfig, options: WebSocketClientOptions = {}) {
    super();
    this.config = config;
    this.options = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      debug: false,
      ...options
    };
  }

  /**
   * 连接 WebSocket
   */
  public async connect(): Promise<void> {
    if (this.isConnecting || this.isConnected) {
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        // 构建 WebSocket URL
        let wsUrl = this.config.baseUrl
          .replace(/^https:\/\//, 'wss://')
          .replace(/^http:\/\//, 'ws://');
        
        // 移除可能的 /api/v1 后缀
        wsUrl = wsUrl.replace(/\/api\/v1$/, '');
        
        // 添加 WebSocket 路径和 token
        const url = `${wsUrl}/ws?token=${this.config.accessToken}`;

        if (this.options.debug) {
          console.log('[LuckDB WebSocket] Connecting to:', url);
        }

        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
          this.handleOpen();
          resolve();
        });
        
        this.ws.on('message', this.handleMessage.bind(this));
        this.ws.on('close', this.handleClose.bind(this));
        this.ws.on('error', (error) => {
          this.handleError(error);
          if (this.isConnecting) {
            this.isConnecting = false;
            reject(error);
          }
        });

      } catch (error) {
        this.isConnecting = false;
        this.emit('error', error);
        reject(error);
      }
    });
  }

  /**
   * 断开连接
   */
  public disconnect(): void {
    this.clearTimers();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect'); // 1000 = 正常关闭
      this.ws = undefined;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.subscriptions.clear();
  }

  /**
   * 发送消息
   */
  public send(message: {
    type: MessageType;
    id?: string;
    collection?: string;
    document?: string | undefined;
    data?: any;
  }): void {
    if (!this.isConnected || !this.ws) {
      throw new Error('WebSocket is not connected');
    }

    // 自动生成消息 ID（如果没有提供）
    if (!message.id && message.type !== 'ping' && message.type !== 'pong') {
      message.id = `msg_${++this.messageId}_${Date.now()}`;
    }

    const messageStr = JSON.stringify(message);

    if (this.options.debug) {
      console.log('[LuckDB WebSocket] Sending:', messageStr);
    }

    this.ws.send(messageStr);
  }

  /**
   * 订阅频道 (使用 ShareDB 风格的 collection.document 格式)
   */
  public subscribe(collection: string, document?: string): void {
    const channelKey = document ? `${collection}.${document}` : collection;
    
    // 避免重复订阅
    if (this.subscriptions.has(channelKey)) {
      if (this.options.debug) {
        console.log('[LuckDB WebSocket] Already subscribed to:', channelKey);
      }
      return;
    }

    this.send({
      type: 'subscribe',
      collection: collection,
      document: document,
      id: `sub_${Date.now()}_${channelKey}`,
    });

    this.subscriptions.add(channelKey);

    if (this.options.debug) {
      console.log('[LuckDB WebSocket] Subscribed to:', channelKey);
    }
  }

  /**
   * 取消订阅
   */
  public unsubscribe(collection: string, document?: string): void {
    const channelKey = document ? `${collection}.${document}` : collection;
    
    if (!this.subscriptions.has(channelKey)) {
      return;
    }

    this.send({
      type: 'unsubscribe',
      collection: collection,
      document: document,
      id: `unsub_${Date.now()}_${channelKey}`,
    });

    this.subscriptions.delete(channelKey);

    if (this.options.debug) {
      console.log('[LuckDB WebSocket] Unsubscribed from:', channelKey);
    }
  }

  /**
   * 订阅表格更新
   */
  public subscribeToTable(tableId: string): void {
    this.subscribe('table', tableId);
  }

  /**
   * 取消订阅表格
   */
  public unsubscribeFromTable(tableId: string): void {
    this.unsubscribe('table', tableId);
  }

  /**
   * 订阅记录更新
   */
  public subscribeToRecord(tableId: string, recordId: string): void {
    this.subscribe('record', `${tableId}.${recordId}`);
  }

  /**
   * 取消订阅记录
   */
  public unsubscribeFromRecord(tableId: string, recordId: string): void {
    this.unsubscribe('record', `${tableId}.${recordId}`);
  }

  /**
   * 订阅视图更新
   */
  public subscribeToView(viewId: string): void {
    this.subscribe('view', viewId);
  }

  /**
   * 取消订阅视图
   */
  public unsubscribeFromView(viewId: string): void {
    this.unsubscribe('view', viewId);
  }

  /**
   * 处理连接打开事件
   */
  private handleOpen(): void {
    if (this.options.debug) {
      console.log('[LuckDB WebSocket] Connected');
    }

    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    this.startHeartbeat();
    this.emit('connected');

    // 重新订阅之前的频道
    if (this.subscriptions.size > 0) {
      if (this.options.debug) {
        console.log('[LuckDB WebSocket] Resubscribing to', this.subscriptions.size, 'channels');
      }
      const subs = Array.from(this.subscriptions);
      this.subscriptions.clear(); // 清空后重新订阅
      
      subs.forEach(channelKey => {
        const parts = channelKey.split('.');
        if (parts.length > 0 && parts[0]) {
          const collection = parts[0];
          const document = parts.length > 1 ? parts[1] : undefined;
          this.subscribe(collection, document);
        }
      });
    }
  }

  /**
   * 处理消息
   */
  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      
      if (this.options.debug) {
        console.log('[LuckDB WebSocket] Received:', message);
      }

      this.emit('message', message);
      
      // 根据消息类型触发特定事件
      switch (message.type) {
        case 'subscribe':
          // 订阅确认
          this.emit('subscribe_confirmed', message);
          break;
          
        case 'unsubscribe':
          // 取消订阅确认
          this.emit('unsubscribe_confirmed', message);
          break;
          
        case 'op':
          // 操作消息 (记录更新、字段变更等)
          this.emit('operation', message);
          this.emit('record_change', message); // 兼容旧版本
          
          // 触发特定类型的操作事件
          if (message.collection === 'table') {
            this.emit('table_update', message);
          } else if (message.collection === 'record') {
            this.emit('record_update', message);
          } else if (message.collection === 'view') {
            this.emit('view_update', message);
          }
          break;
          
        case 'presence':
          this.emit('presence_update', message);
          break;
          
        case 'cursor':
          this.emit('cursor_update', message);
          break;
          
        case 'notification':
          this.emit('notification', message);
          break;
          
        case 'error':
          this.emit('message_error', message);
          break;
          
        case 'pong':
          // 心跳响应
          this.emit('pong', message);
          break;
          
        default:
          this.emit('unknown_message', message);
      }
    } catch (error) {
      if (this.options.debug) {
        console.error('[LuckDB WebSocket] Failed to parse message:', error);
      }
      this.emit('parse_error', error);
    }
  }

  /**
   * 处理连接关闭事件
   */
  private handleClose(code: number, reason: Buffer): void {
    const reasonStr = reason.toString();
    
    if (this.options.debug) {
      console.log('[LuckDB WebSocket] Disconnected:', code, reasonStr);
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.clearTimers();
    
    this.emit('disconnected', { code, reason: reasonStr });

    // 如果不是主动断开(1000)，尝试重连
    if (code !== 1000 && this.reconnectAttempts < this.options.maxReconnectAttempts!) {
      this.scheduleReconnect();
    }
  }

  /**
   * 处理错误
   */
  private handleError(error: Error): void {
    if (this.options.debug) {
      console.error('[LuckDB WebSocket] Error:', error);
    }
    
    this.emit('error', error);
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.options.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1),
      30000 // 最大30秒
    );

    if (this.options.debug) {
      console.log(`[LuckDB WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    }

    this.emit('reconnecting', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.connect().catch(error => {
        if (this.options.debug) {
          console.error('[LuckDB WebSocket] Reconnect failed:', error);
        }
        this.emit('reconnect_failed', error);
      });
    }, delay);
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected && this.ws) {
        try {
          this.send({ type: 'ping', data: {} });
        } catch (error) {
          if (this.options.debug) {
            console.error('[LuckDB WebSocket] Heartbeat failed:', error);
          }
        }
      }
    }, this.options.heartbeatInterval);
  }

  /**
   * 清除定时器
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  /**
   * 获取连接状态
   */
  public getConnectionState(): 'connecting' | 'connected' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.isConnected) return 'connected';
    return 'disconnected';
  }

  /**
   * 获取重连次数
   */
  public getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * 获取已订阅的频道列表
   */
  public getSubscriptions(): string[] {
    return Array.from(this.subscriptions);
  }

  /**
   * 是否已订阅指定频道
   */
  public isSubscribed(collection: string, document?: string): boolean {
    const channelKey = document ? `${collection}.${document}` : collection;
    return this.subscriptions.has(channelKey);
  }
}
