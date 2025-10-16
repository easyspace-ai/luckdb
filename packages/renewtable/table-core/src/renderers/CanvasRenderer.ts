/**
 * CanvasRenderer - Main canvas rendering engine
 * Based on aitable's implementation with type safety
 */

import { CoordinateManager } from '../core/coordinate';
import { VisibleRange } from '../types/core';
import { GridTheme, defaultTheme, CellRenderContext } from '../types/canvas';
import { RendererRegistry } from './registry';

export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr: number;
  private theme: GridTheme;
  private rendererRegistry: RendererRegistry;

  // Layers for optimized rendering
  private needsFullRedraw = true;

  constructor(canvas: HTMLCanvasElement, theme: GridTheme = defaultTheme) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.theme = theme;
    this.rendererRegistry = new RendererRegistry();
    
    this.setupCanvas();
  }

  private setupCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  public setTheme(theme: Partial<GridTheme>): void {
    this.theme = { ...this.theme, ...theme };
    this.needsFullRedraw = true;
  }

  public getRendererRegistry(): RendererRegistry {
    return this.rendererRegistry;
  }

  public render(
    coordManager: CoordinateManager,
    data: any[][],
    columns: any[],
    viewport: VisibleRange,
    scrollTop: number,
    scrollLeft: number
  ): void {
    if (this.needsFullRedraw) {
      this.clear();
    }

    // 1. Render background grid
    this.renderGrid(coordManager, viewport, scrollTop, scrollLeft);

    // 2. Render column headers
    this.renderHeaders(coordManager, columns, scrollLeft);

    // 3. Render cells
    this.renderCells(coordManager, data, columns, viewport, scrollTop, scrollLeft);

    this.needsFullRedraw = false;
  }

  private clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);
  }

  private renderGrid(
    coordManager: CoordinateManager,
    viewport: VisibleRange,
    scrollTop: number,
    scrollLeft: number
  ): void {
    this.ctx.strokeStyle = this.theme.gridLines;
    this.ctx.lineWidth = this.theme.borderWidth;

    const headerHeight = this.theme.headerHeight;
    const containerHeight = coordManager.containerHeight;
    const containerWidth = coordManager.containerWidth;

    // Draw vertical lines (columns)
    for (let col = viewport.startCol; col <= viewport.endCol; col++) {
      const x = coordManager.getColumnOffset(col) - scrollLeft;
      if (x >= 0 && x <= containerWidth) {
        this.ctx.beginPath();
        this.ctx.moveTo(x, headerHeight);
        this.ctx.lineTo(x, containerHeight);
        this.ctx.stroke();
      }
    }

    // Draw horizontal lines (rows)
    for (let row = viewport.startRow; row <= viewport.endRow; row++) {
      const y = coordManager.getRowOffset(row) - scrollTop + headerHeight;
      if (y >= headerHeight && y <= containerHeight) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(containerWidth, y);
        this.ctx.stroke();
      }
    }
  }

  private renderHeaders(
    coordManager: CoordinateManager,
    columns: any[],
    scrollLeft: number
  ): void {
    const headerHeight = this.theme.headerHeight;

    // Header background
    this.ctx.fillStyle = this.theme.headerBackground;
    this.ctx.fillRect(0, 0, coordManager.containerWidth, headerHeight);

    // Header text
    this.ctx.fillStyle = this.theme.headerText;
    this.ctx.font = `${this.theme.headerFontWeight} ${this.theme.headerFontSize}px ${this.theme.fontFamily}`;
    this.ctx.textBaseline = 'middle';

    columns.forEach((column, index) => {
      const x = coordManager.getColumnOffset(index) - scrollLeft;
      const width = coordManager.getColumnWidth(index);

      if (x + width >= 0 && x <= coordManager.containerWidth) {
        // Draw header text
        this.ctx.fillText(
          column.header || column.id,
          x + this.theme.cellPadding,
          headerHeight / 2
        );

        // Draw column separator
        this.ctx.strokeStyle = this.theme.cellBorder;
        this.ctx.beginPath();
        this.ctx.moveTo(x + width, 0);
        this.ctx.lineTo(x + width, headerHeight);
        this.ctx.stroke();
      }
    });

    // Draw header bottom border
    this.ctx.strokeStyle = this.theme.cellBorder;
    this.ctx.beginPath();
    this.ctx.moveTo(0, headerHeight);
    this.ctx.lineTo(coordManager.containerWidth, headerHeight);
    this.ctx.stroke();
  }

  private renderCells(
    coordManager: CoordinateManager,
    data: any[][],
    columns: any[],
    viewport: VisibleRange,
    scrollTop: number,
    scrollLeft: number
  ): void {
    const headerHeight = this.theme.headerHeight;

    this.ctx.font = `${this.theme.fontSize}px ${this.theme.fontFamily}`;
    this.ctx.textBaseline = 'middle';

    for (let row = viewport.startRow; row <= viewport.endRow; row++) {
      const y = coordManager.getRowOffset(row) - scrollTop + headerHeight;
      const rowHeight = coordManager.getRowHeight(row);

      if (y + rowHeight < headerHeight || y > coordManager.containerHeight) {
        continue;
      }

      for (let col = viewport.startCol; col <= viewport.endCol; col++) {
        const x = coordManager.getColumnOffset(col) - scrollLeft;
        const colWidth = coordManager.getColumnWidth(col);

        if (x + colWidth < 0 || x > coordManager.containerWidth) {
          continue;
        }

        const value = data[row]?.[col];
        const column = columns[col];

        // Get renderer for this cell type
        const renderer = this.rendererRegistry.get(column?.cellType || 'text');

        // Render cell background
        this.ctx.fillStyle = this.theme.cellBackground;
        this.ctx.fillRect(x, y, colWidth, rowHeight);

        // Render cell content
        const context: CellRenderContext = {
          ctx: this.ctx,
          rect: { x, y, width: colWidth, height: rowHeight },
          value,
          style: {
            fontSize: this.theme.fontSize,
            fontFamily: this.theme.fontFamily,
            color: this.theme.cellText,
            padding: this.theme.cellPadding,
          },
          dpr: this.dpr,
        };

        renderer.draw(context);
      }
    }
  }

  public resize(width: number, height: number): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = width * this.dpr;
    this.canvas.height = height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.needsFullRedraw = true;
  }

  public markDirty(): void {
    this.needsFullRedraw = true;
  }
}

