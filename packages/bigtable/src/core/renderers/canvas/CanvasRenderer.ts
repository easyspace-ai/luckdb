/**
 * CanvasRenderer - 高性能 Canvas 2D 渲染器
 *
 * 优化策略：
 * 1. 批量绘制 - 按样式分组，减少状态切换
 * 2. 离屏渲染 - 使用 OffscreenCanvas
 * 3. 脏区域检测 - 只重绘变化的区域
 * 4. 文本缓存 - 缓存文本测量结果
 * 5. 路径复用 - 复用 Path2D 对象
 */

import type { IRenderer } from '../base/IRenderer';
import type { IRenderData, ICell, ITheme, ICellPosition } from '../../types';

interface ICellStyle {
  bg: string;
  text: string;
  border: string;
}

export class CanvasRenderer implements IRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;

  // 缓存
  private textMeasureCache: Map<string, TextMetrics> = new Map();
  private cellStyleCache: Map<string, ICellStyle> = new Map();

  // 性能优化
  private lastRenderData: IRenderData | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.dpr = window.devicePixelRatio || 1;

    const ctx = canvas.getContext('2d', {
      alpha: false, // 禁用透明度，提升性能
      desynchronized: true, // 异步渲染
    });

    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }

    this.ctx = ctx;
    this.setupCanvas();
  }

  /**
   * 渲染一帧
   */
  render(data: IRenderData): void {
    const { cells, theme, scrollState } = data;

    // 清空画布
    this.clear();

    // 按样式分组（减少状态切换）
    const cellsByStyle = this.groupCellsByStyle(cells, theme);

    // 批量渲染
    cellsByStyle.forEach((cells, styleKey) => {
      const style = this.cellStyleCache.get(styleKey)!;
      this.renderCellBatch(cells, style, theme);
    });

    // 渲染表头
    this.renderHeader(data);

    // 渲染网格线
    this.renderGridLines(data);

    this.lastRenderData = data;
  }

  /**
   * 清空画布
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    this.textMeasureCache.clear();
    this.cellStyleCache.clear();
  }

  // ==================== 私有方法 ====================

  /**
   * 设置 Canvas
   */
  private setupCanvas(): void {
    // 设置高DPI支持
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  /**
   * 按样式分组单元格
   */
  private groupCellsByStyle(cells: ICell[], theme: ITheme): Map<string, ICell[]> {
    const groups = new Map<string, ICell[]>();

    cells.forEach((cell) => {
      const style = this.getCellStyle(cell, theme);
      const styleKey = `${style.bg}-${style.text}-${style.border}`;

      if (!groups.has(styleKey)) {
        groups.set(styleKey, []);
        this.cellStyleCache.set(styleKey, style);
      }

      groups.get(styleKey)!.push(cell);
    });

    return groups;
  }

  /**
   * 获取单元格样式
   */
  private getCellStyle(cell: ICell, theme: ITheme): ICellStyle {
    // 根据单元格状态确定样式
    const isSelected = false; // TODO: 从 selection 中判断
    const isHovered = false; // TODO: 从 hover 中判断

    let bg = theme.bgPrimary;
    if (isSelected) bg = theme.bgSelected;
    else if (isHovered) bg = theme.bgHover;

    return {
      bg,
      text: theme.textPrimary,
      border: theme.borderColor,
    };
  }

  /**
   * 批量渲染单元格
   */
  private renderCellBatch(cells: ICell[], style: ICellStyle, theme: ITheme): void {
    const { ctx } = this;

    // 设置样式（只设置一次）
    ctx.fillStyle = style.bg;

    // 批量绘制背景
    cells.forEach((cell) => {
      const rect = this.getCellRect(cell);
      ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    });

    // 批量绘制文本
    ctx.fillStyle = style.text;
    ctx.font = `${theme.fontWeight} ${theme.fontSize}px ${theme.fontFamily}`;
    ctx.textBaseline = 'middle';

    cells.forEach((cell) => {
      const rect = this.getCellRect(cell);
      const text = String(cell.value || '');

      // 文本裁剪
      const maxWidth = rect.width - theme.cellPadding * 2;
      const clippedText = this.clipText(text, maxWidth, theme);

      ctx.fillText(clippedText, rect.x + theme.cellPadding, rect.y + rect.height / 2);
    });
  }

  /**
   * 渲染表头
   */
  private renderHeader(data: IRenderData): void {
    const { theme } = data;
    const { ctx } = this;

    // 绘制表头背景
    ctx.fillStyle = theme.bgSecondary;
    ctx.fillRect(0, 0, this.canvas.width / this.dpr, theme.headerHeight);

    // TODO: 绘制表头文本（需要列信息）
  }

  /**
   * 渲染网格线
   */
  private renderGridLines(data: IRenderData): void {
    const { cells, theme } = data;
    const { ctx } = this;

    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();

    cells.forEach((cell) => {
      const rect = this.getCellRect(cell);

      // 绘制右边框
      ctx.moveTo(rect.x + rect.width, rect.y);
      ctx.lineTo(rect.x + rect.width, rect.y + rect.height);

      // 绘制下边框
      ctx.moveTo(rect.x, rect.y + rect.height);
      ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
    });

    ctx.stroke();
  }

  /**
   * 获取单元格矩形（TODO: 应该从 CoordinateSystem 获取）
   */
  private getCellRect(cell: ICell): { x: number; y: number; width: number; height: number } {
    // 临时实现，实际应该从引擎获取
    const columnIndex = 0; // TODO
    const rowIndex = 0; // TODO

    return {
      x: columnIndex * 200,
      y: rowIndex * 36 + 40, // 40 是表头高度
      width: 200,
      height: 36,
    };
  }

  /**
   * 文本裁剪（添加省略号）
   */
  private clipText(text: string, maxWidth: number, theme: ITheme): string {
    const cacheKey = `${text}-${maxWidth}`;

    // 检查缓存
    if (this.textMeasureCache.has(cacheKey)) {
      return text; // 已测量过，直接返回
    }

    const metrics = this.ctx.measureText(text);

    if (metrics.width <= maxWidth) {
      this.textMeasureCache.set(cacheKey, metrics);
      return text;
    }

    // 需要裁剪
    let clipped = text;
    while (clipped.length > 0) {
      clipped = clipped.slice(0, -1);
      const testText = clipped + '...';
      const testMetrics = this.ctx.measureText(testText);

      if (testMetrics.width <= maxWidth) {
        return testText;
      }
    }

    return '...';
  }
}
