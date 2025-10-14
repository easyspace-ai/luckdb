/**
 * WebSocket Manager
 * Manages reconnecting WebSocket connections
 */

import ReconnectingWebSocket from 'reconnecting-websocket';

export interface WebSocketConfig {
  maxReconnectionDelay?: number;
  minReconnectionDelay?: number;
  reconnectionDelayGrowFactor?: number;
  connectionTimeout?: number;
  maxRetries?: number;
  debug?: boolean;
}

export class WebSocketManager {
  private socket: ReconnectingWebSocket | null = null;
  private config: WebSocketConfig;
  private listeners: Map<string, Set<(event: MessageEvent) => void>> = new Map();

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 4000,
      maxRetries: Infinity,
      debug: false,
      ...config,
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(url: string): ReconnectingWebSocket {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = new ReconnectingWebSocket(url, [], {
      maxReconnectionDelay: this.config.maxReconnectionDelay,
      minReconnectionDelay: this.config.minReconnectionDelay,
      reconnectionDelayGrowFactor: this.config.reconnectionDelayGrowFactor,
      connectionTimeout: this.config.connectionTimeout,
      maxRetries: this.config.maxRetries,
      debug: this.config.debug,
    });

    this.setupEventListeners();
    return this.socket;
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.listeners.clear();
    }
  }

  /**
   * Send message through WebSocket
   */
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(data);
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  /**
   * Subscribe to WebSocket messages
   */
  subscribe(channel: string, callback: (event: MessageEvent) => void): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const channelListeners = this.listeners.get(channel);
      if (channelListeners) {
        channelListeners.delete(callback);
        if (channelListeners.size === 0) {
          this.listeners.delete(channel);
        }
      }
    };
  }

  /**
   * Get connection status
   */
  getStatus(): 'connecting' | 'connected' | 'disconnected' {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      default:
        return 'disconnected';
    }
  }

  /**
   * Setup event listeners for WebSocket
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.addEventListener('open', () => {
      if (this.config.debug) {
        console.log('[WebSocket] Connected');
      }
    });

    this.socket.addEventListener('close', () => {
      if (this.config.debug) {
        console.log('[WebSocket] Disconnected');
      }
    });

    this.socket.addEventListener('error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    this.socket.addEventListener('message', (event) => {
      // Notify all subscribers
      this.listeners.forEach((callbacks) => {
        callbacks.forEach((callback) => callback(event));
      });
    });
  }

  /**
   * Get the underlying WebSocket instance
   */
  getSocket(): ReconnectingWebSocket | null {
    return this.socket;
  }
}


