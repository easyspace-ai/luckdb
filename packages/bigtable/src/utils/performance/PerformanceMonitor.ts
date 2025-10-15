/**
 * 性能监控工具
 * 用于分析和优化渲染性能
 */

export interface IPerformanceMetrics {
  // FPS
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;

  // 渲染时间
  renderTime: number;
  avgRenderTime: number;
  maxRenderTime: number;

  // 内存
  memoryUsage?: number;

  // 单元格
  totalCells: number;
  visibleCells: number;
  renderedCells: number;

  // 帧时间分布
  frameTimes: number[];
}

export class PerformanceMonitor {
  private metrics: IPerformanceMetrics;
  private lastFrameTime: number = 0;
  private frameTimes: number[] = [];
  private renderTimes: number[] = [];
  private maxSamples = 60; // 保留最近60帧数据

  constructor() {
    this.metrics = this.createInitialMetrics();
  }

  /**
   * 记录帧开始
   */
  frameStart(): void {
    const now = performance.now();

    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime;
      this.frameTimes.push(frameTime);

      // 限制样本数量
      if (this.frameTimes.length > this.maxSamples) {
        this.frameTimes.shift();
      }

      // 更新 FPS
      this.metrics.fps = Math.round(1000 / frameTime);
    }

    this.lastFrameTime = now;
  }

  /**
   * 记录渲染时间
   */
  recordRenderTime(time: number): void {
    this.renderTimes.push(time);

    if (this.renderTimes.length > this.maxSamples) {
      this.renderTimes.shift();
    }

    this.metrics.renderTime = time;
    this.metrics.avgRenderTime = this.avg(this.renderTimes);
    this.metrics.maxRenderTime = Math.max(...this.renderTimes);
  }

  /**
   * 更新单元格统计
   */
  updateCellStats(total: number, visible: number, rendered: number): void {
    this.metrics.totalCells = total;
    this.metrics.visibleCells = visible;
    this.metrics.renderedCells = rendered;
  }

  /**
   * 获取当前指标
   */
  getMetrics(): IPerformanceMetrics {
    // 更新统计值
    if (this.frameTimes.length > 0) {
      this.metrics.avgFps = Math.round(1000 / this.avg(this.frameTimes));
      this.metrics.minFps = Math.round(1000 / Math.max(...this.frameTimes));
      this.metrics.maxFps = Math.round(1000 / Math.min(...this.frameTimes));
    }

    this.metrics.frameTimes = [...this.frameTimes];

    // 尝试获取内存使用（仅 Chrome）
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      this.metrics.memoryUsage = Math.round(mem.usedJSHeapSize / 1024 / 1024); // MB
    }

    return { ...this.metrics };
  }

  /**
   * 重置统计
   */
  reset(): void {
    this.metrics = this.createInitialMetrics();
    this.frameTimes = [];
    this.renderTimes = [];
    this.lastFrameTime = 0;
  }

  /**
   * 性能报告（文本格式）
   */
  getReport(): string {
    const m = this.getMetrics();

    return `
=== BigTable Performance Report ===

FPS:
- Current: ${m.fps} fps
- Average: ${m.avgFps} fps
- Min: ${m.minFps} fps
- Max: ${m.maxFps} fps

Render Time:
- Current: ${m.renderTime.toFixed(2)} ms
- Average: ${m.avgRenderTime.toFixed(2)} ms
- Max: ${m.maxRenderTime.toFixed(2)} ms

Cells:
- Total: ${m.totalCells.toLocaleString()}
- Visible: ${m.visibleCells.toLocaleString()}
- Rendered: ${m.renderedCells.toLocaleString()}
- Render Ratio: ${((m.renderedCells / m.totalCells) * 100).toFixed(2)}%

${m.memoryUsage ? `Memory: ${m.memoryUsage} MB` : ''}

Frame Time Distribution:
- P50: ${this.percentile(this.frameTimes, 50).toFixed(2)} ms
- P90: ${this.percentile(this.frameTimes, 90).toFixed(2)} ms
- P99: ${this.percentile(this.frameTimes, 99).toFixed(2)} ms
`;
  }

  // ==================== 私有方法 ====================

  /**
   * 创建初始指标
   */
  private createInitialMetrics(): IPerformanceMetrics {
    return {
      fps: 60,
      avgFps: 60,
      minFps: 60,
      maxFps: 60,
      renderTime: 0,
      avgRenderTime: 0,
      maxRenderTime: 0,
      totalCells: 0,
      visibleCells: 0,
      renderedCells: 0,
      frameTimes: [],
    };
  }

  /**
   * 计算平均值
   */
  private avg(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * 计算百分位数
   */
  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.floor((p / 100) * sorted.length);

    return sorted[index] || 0;
  }
}
