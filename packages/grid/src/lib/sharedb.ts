/**
 * ShareDB Connection Manager
 * Manages ShareDB connections for real-time collaboration
 */

import sharedb from 'sharedb/lib/client';
import type ReconnectingWebSocket from 'reconnecting-websocket';

export interface ShareDBConfig {
  debug?: boolean;
}

export class ShareDBConnection {
  private connection: sharedb.Connection | null = null;
  private config: ShareDBConfig;
  private docs: Map<string, sharedb.Doc> = new Map();

  constructor(config: ShareDBConfig = {}) {
    this.config = {
      debug: false,
      ...config,
    };
  }

  /**
   * Initialize ShareDB connection with WebSocket
   */
  initialize(socket: ReconnectingWebSocket): sharedb.Connection {
    if (this.connection) {
      this.close();
    }

    // ShareDB expects a WebSocket-like interface
    this.connection = new sharedb.Connection(socket as any);

    if (this.config.debug) {
      console.log('[ShareDB] Connection initialized');
    }

    return this.connection;
  }

  /**
   * Get a ShareDB document
   */
  getDoc(collection: string, docId: string): sharedb.Doc | null {
    if (!this.connection) {
      console.error('[ShareDB] Connection not initialized');
      return null;
    }

    const key = `${collection}:${docId}`;
    
    if (!this.docs.has(key)) {
      const doc = this.connection.get(collection, docId);
      this.docs.set(key, doc);
    }

    return this.docs.get(key)!;
  }

  /**
   * Subscribe to a document
   */
  subscribeDoc(
    collection: string,
    docId: string,
    callback: (doc: sharedb.Doc) => void
  ): () => void {
    const doc = this.getDoc(collection, docId);
    
    if (!doc) {
      return () => {};
    }

    doc.subscribe((err) => {
      if (err) {
        console.error('[ShareDB] Subscribe error:', err);
        return;
      }

      callback(doc);

      // Listen for operations
      doc.on('op', (op, source) => {
        if (this.config.debug) {
          console.log('[ShareDB] Operation received:', op, 'from:', source);
        }
        callback(doc);
      });
    });

    // Return cleanup function
    return () => {
      doc.unsubscribe();
      const key = `${collection}:${docId}`;
      this.docs.delete(key);
      doc.destroy();
    };
  }

  /**
   * Submit an operation to a document
   */
  async submitOp(
    collection: string,
    docId: string,
    op: sharedb.Op
  ): Promise<void> {
    const doc = this.getDoc(collection, docId);
    
    if (!doc) {
      throw new Error('Document not found');
    }

    return new Promise((resolve, reject) => {
      doc.submitOp(op, (err) => {
        if (err) {
          console.error('[ShareDB] Submit operation error:', err);
          reject(err);
        } else {
          if (this.config.debug) {
            console.log('[ShareDB] Operation submitted:', op);
          }
          resolve();
        }
      });
    });
  }

  /**
   * Create a new document
   */
  async createDoc(
    collection: string,
    docId: string,
    data: any
  ): Promise<sharedb.Doc> {
    const doc = this.getDoc(collection, docId);
    
    if (!doc) {
      throw new Error('Failed to get document');
    }

    return new Promise((resolve, reject) => {
      doc.create(data, (err) => {
        if (err) {
          console.error('[ShareDB] Create document error:', err);
          reject(err);
        } else {
          if (this.config.debug) {
            console.log('[ShareDB] Document created:', docId);
          }
          resolve(doc);
        }
      });
    });
  }

  /**
   * Delete a document
   */
  async deleteDoc(collection: string, docId: string): Promise<void> {
    const doc = this.getDoc(collection, docId);
    
    if (!doc) {
      throw new Error('Document not found');
    }

    return new Promise((resolve, reject) => {
      doc.del((err) => {
        if (err) {
          console.error('[ShareDB] Delete document error:', err);
          reject(err);
        } else {
          if (this.config.debug) {
            console.log('[ShareDB] Document deleted:', docId);
          }
          const key = `${collection}:${docId}`;
          this.docs.delete(key);
          resolve();
        }
      });
    });
  }

  /**
   * Close the ShareDB connection
   */
  close(): void {
    if (this.connection) {
      // Clean up all documents
      this.docs.forEach((doc) => {
        doc.unsubscribe();
        doc.destroy();
      });
      this.docs.clear();

      this.connection.close();
      this.connection = null;

      if (this.config.debug) {
        console.log('[ShareDB] Connection closed');
      }
    }
  }

  /**
   * Get the underlying ShareDB connection
   */
  getConnection(): sharedb.Connection | null {
    return this.connection;
  }

  /**
   * Check if connection is active
   */
  isConnected(): boolean {
    return this.connection !== null;
  }
}


