/**
 * OffscreenCanvas 渲染器
 * 在 Web Worker 中渲染，避免阻塞主线程
 *
 * 性能提升：
 * - 渲染在独立线程
 * - 不阻塞UI交互
 * - 适合大数据量场景
 */

import type { IRenderer } from '../base/IRenderer';
import type { IRenderData } from '../../types';

export interface IOffscreenCanvasRendererConfig {
  workerPath?: string;
}

export class OffscreenCanvasRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private offscreen: OffscreenCanvas | null = null;
  private worker: Worker | null = null;
  private isSupported: boolean;

  constructor(canvas: HTMLCanvasElement, config?: IOffscreenCanvasRendererConfig) {
    this.canvas = canvas;

    // 检查浏览器支持
    this.isSupported =
      'OffscreenCanvas' in window && 'transferControlToOffscreen' in HTMLCanvasElement.prototype;

    if (this.isSupported) {
      this.initOffscreenCanvas(config);
    } else {
      console.warn(
        '[OffscreenCanvasRenderer] OffscreenCanvas not supported, falling back to regular Canvas'
      );
    }
  }

  /**
   * 初始化 OffscreenCanvas
   */
  private initOffscreenCanvas(config?: IOffscreenCanvasRendererConfig): void {
    try {
      // 转移控制权到 OffscreenCanvas
      this.offscreen = this.canvas.transferControlToOffscreen();

      // 创建 Worker
      const workerPath = config?.workerPath || '/render-worker.js';
      this.worker = new Worker(workerPath);

      // 发送 Canvas 到 Worker
      this.worker.postMessage(
        {
          type: 'INIT',
          canvas: this.offscreen,
          width: this.canvas.width,
          height: this.canvas.height,
          dpr: window.devicePixelRatio || 1,
        },
        [this.offscreen as any] // Transfer ownership
      );

      // 监听 Worker 消息
      this.worker.onmessage = (e) => {
        const { type, data } = e.data;

        switch (type) {
          case 'RENDER_COMPLETE':
            console.log('[OffscreenCanvasRenderer] Render complete:', data);
            break;

          case 'ERROR':
            console.error('[OffscreenCanvasRenderer] Worker error:', data);
            break;
        }
      };

      console.log('[OffscreenCanvasRenderer] Initialized successfully');
    } catch (error) {
      console.error('[OffscreenCanvasRenderer] Initialization failed:', error);
      this.isSupported = false;
    }
  }

  /**
   * 渲染一帧
   */
  render(data: IRenderData): void {
    if (!this.isSupported || !this.worker) {
      console.warn('[OffscreenCanvasRenderer] Not supported or not initialized');
      return;
    }

    // 发送渲染数据到 Worker
    // 注意：需要序列化数据（Map 需要转为数组）
    const serializedData = this.serializeRenderData(data);

    this.worker.postMessage({
      type: 'RENDER',
      data: serializedData,
    });
  }

  /**
   * 序列化渲染数据（准备发送到 Worker）
   */
  private serializeRenderData(data: IRenderData): any {
    return {
      cells: data.cells,
      rows: data.rows,
      columns: data.columns,
      visibleRegion: data.visibleRegion,
      scrollState: data.scrollState,
      theme: data.theme,
      frozenColumnCount: data.frozenColumnCount,
      frozenWidth: data.frozenWidth,
      // Map需要转为数组
      cellPositions: data.cellPositions ? Array.from(data.cellPositions.entries()) : [],
    };
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'DESTROY' });
      this.worker.terminate();
      this.worker = null;
    }

    this.offscreen = null;
  }
}

/**
 * TODO: Worker 实现（需要创建独立文件）
 *
 * // public/render-worker.js
 * let canvas = null;
 * let ctx = null;
 *
 * self.onmessage = (e) => {
 *   const { type, data } = e.data;
 *
 *   switch (type) {
 *     case 'INIT':
 *       canvas = data.canvas;
 *       ctx = canvas.getContext('2d');
 *       break;
 *
 *     case 'RENDER':
 *       renderFrame(data);
 *       break;
 *
 *     case 'DESTROY':
 *       canvas = null;
 *       ctx = null;
 *       break;
 *   }
 * };
 *
 * function renderFrame(data) {
 *   if (!ctx) return;
 *
 *   // 清空画布
 *   ctx.clearRect(0, 0, canvas.width, canvas.height);
 *
 *   // 绘制单元格
 *   data.cells.forEach(cell => {
 *     // ... 渲染逻辑（与CanvasRenderer类似）
 *   });
 *
 *   // 完成通知
 *   self.postMessage({ type: 'RENDER_COMPLETE', data: { cellCount: data.cells.length } });
 * }
 */
