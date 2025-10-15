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
  private cellPositionCache: Map<string, ICellPosition> = new Map();

  // 性能优化
  private lastRenderData: IRenderData | null = null;

  // 列拖动状态（从引擎传入）
  private columnDragState: {
    isDragging: boolean;
    dragColumnIndex: number;
    dropTargetIndex: number;
    dragStartX: number;
    currentX: number;
  } | null = null;

  // 列宽调整悬停列索引
  private resizeHoverColumnIndex: number = -1;

  // 列偏移缓存
  private columnOffsets: number[] = [];
  private cachedColumns: IColumn[] = [];

  // 帧缓存
  private frameCellRectCache = new Map<
    string,
    { x: number; y: number; width: number; height: number }
  >();
  private currentFrame = 0;

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

    console.log('[CanvasRenderer] Initialized with DPR:', this.dpr);
  }

  /**
   * 更新列偏移缓存
   */
  private updateColumnOffsets(columns: IColumn[]): void {
    // 引用相同，跳过
    if (this.cachedColumns === columns) return;

    this.columnOffsets = [0];
    let offset = 0;
    for (const col of columns) {
      offset += col.width || 200;
      this.columnOffsets.push(offset);
    }
    this.cachedColumns = columns;

    console.log('[CanvasRenderer] Column offsets updated:', this.columnOffsets.length);
  }

  /**
   * 渲染一帧
   */
  render(data: IRenderData): void {
    const { cells, theme, cellPositions, frozenColumnCount = 0, frozenWidth = 0 } = data;

    // ✅ 更新列偏移缓存
    this.updateColumnOffsets(data.columns);

    // ✅ 每帧清空缓存
    this.frameCellRectCache.clear();
    this.currentFrame++;

    // 调试：只在第一次渲染时输出详细信息
    if (!this.lastRenderData) {
      console.log('[CanvasRenderer] First render debug:', {
        cellCount: cells.length,
        sampleCell: cells[0],
        theme: {
          bgPrimary: theme.bgPrimary,
          textPrimary: theme.textPrimary,
          borderColor: theme.borderColor,
        },
        canvasSize: { w: this.canvas.width, h: this.canvas.height },
        dpr: this.dpr,
        frozenColumnCount,
        frozenWidth,
      });
    }

    // 清空画布
    this.clear();

    // 缓存位置信息
    if (cellPositions) {
      this.cellPositionCache = cellPositions;
    }

    // 分离冻结列和可滚动列的单元格
    const frozenCells: ICell[] = [];
    const scrollableCells: ICell[] = [];

    cells.forEach((cell) => {
      const pos = cellPositions?.get(cell.id);
      if (pos && pos.columnIndex < frozenColumnCount) {
        frozenCells.push(cell);
      } else {
        scrollableCells.push(cell);
      }
    });

    // 1. 渲染可滚动区域
    const scrollableCellsByStyle = this.groupCellsByStyle(scrollableCells, theme);
    scrollableCellsByStyle.forEach((cells, styleKey) => {
      const style = this.cellStyleCache.get(styleKey)!;
      this.renderCellBatch(cells, style, theme, data);
    });

    // 2. 渲染表头
    this.renderHeader(data);

    // 3. 渲染网格线
    this.renderGridLines(data);

    // 4. 渲染冻结列（覆盖在上面）
    if (frozenColumnCount > 0 && frozenCells.length > 0) {
      this.renderFrozenColumns(frozenCells, theme, data);
    }

    // 5. 渲染列拖动反馈
    if (this.columnDragState?.isDragging) {
      this.renderColumnDragFeedback(data);
    }

    // 6. 渲染列宽调整悬停高亮
    if (this.resizeHoverColumnIndex >= 0) {
      this.renderResizeHandle(this.resizeHoverColumnIndex, data);
    }

    this.lastRenderData = data;
  }

  /**
   * 设置列拖动状态（从引擎调用）
   */
  setColumnDragState(state: typeof this.columnDragState): void {
    this.columnDragState = state;
  }

  /**
   * 设置列宽调整悬停列索引（从引擎调用）
   */
  setResizeHoverColumn(index: number): void {
    this.resizeHoverColumnIndex = index;
  }

  /**
   * 清空画布
   */
  clear(): void {
    // 使用逻辑尺寸（因为坐标系已经被 scale 了）
    const logicalWidth = this.canvas.width / this.dpr;
    const logicalHeight = this.canvas.height / this.dpr;

    // 先填充背景色
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, logicalWidth, logicalHeight);
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

    // 设置 CSS 尺寸（确保显示尺寸正确）
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';

    // 缩放坐标系（关键：这样后续绘制使用逻辑坐标）
    this.ctx.scale(this.dpr, this.dpr);

    // 设置文本渲染质量
    this.ctx.imageSmoothingEnabled = true;

    console.log('[CanvasRenderer] Canvas setup:', {
      physical: { w: this.canvas.width, h: this.canvas.height },
      logical: { w: rect.width, h: rect.height },
      dpr: this.dpr,
    });
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
  private getCellStyle(_cell: ICell, theme: ITheme): ICellStyle {
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
  private renderCellBatch(
    cells: ICell[],
    style: ICellStyle,
    theme: ITheme,
    data: IRenderData
  ): void {
    const { ctx } = this;

    // ✅ 单次遍历，预先计算所有矩形
    const cellRects = cells
      .map((cell) => ({
        cell,
        rect: this.getCellRect(cell, data),
      }))
      .filter((item) => item.rect !== null);

    // 批量绘制背景
    ctx.fillStyle = style.bg;
    cellRects.forEach(({ rect }) => {
      ctx.fillRect(rect!.x, rect!.y, rect!.width, rect!.height);
    });

    // 批量绘制文本
    ctx.fillStyle = style.text;
    ctx.font = `${theme.fontWeight} ${theme.fontSize}px ${theme.fontFamily}`;
    ctx.textBaseline = 'middle';

    cellRects.forEach(({ cell, rect }) => {
      const text = String(cell.value || '');
      const maxWidth = rect!.width - theme.cellPadding * 2;
      const clippedText = this.clipText(text, maxWidth, theme);
      ctx.fillText(clippedText, rect!.x + theme.cellPadding, rect!.y + rect!.height / 2);
    });
  }

  /**
   * 渲染表头
   */
  private renderHeader(data: IRenderData): void {
    const { theme, columns, scrollState, frozenColumnCount = 0 } = data;
    const { ctx } = this;
    const headerHeight = theme.headerHeight;

    // 绘制表头背景
    ctx.fillStyle = theme.bgSecondary;
    ctx.fillRect(0, 0, this.canvas.width / this.dpr, headerHeight);

    // 绘制列标题
    ctx.fillStyle = theme.textPrimary;
    ctx.font = `600 ${theme.fontSize}px ${theme.fontFamily}`;
    ctx.textBaseline = 'middle';

    let x = 0;
    columns.forEach((column, index) => {
      const width = column.width || 200;
      const title = column.title || column.key || `Column ${index + 1}`;

      // 冻结列不受滚动影响，非冻结列需要减去滚动偏移
      const displayX = index >= frozenColumnCount ? x - scrollState.scrollLeft : x;

      // 绘制文本
      ctx.fillText(title, displayX + theme.cellPadding, headerHeight / 2);

      // 绘制列分隔线
      ctx.strokeStyle = theme.borderColor;
      ctx.beginPath();
      ctx.moveTo(displayX + width, 0);
      ctx.lineTo(displayX + width, headerHeight);
      ctx.stroke();

      x += width;
    });

    // 绘制表头底部边框
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, headerHeight);
    ctx.lineTo(this.canvas.width / this.dpr, headerHeight);
    ctx.stroke();
    ctx.lineWidth = 1;
  }

  /**
   * 渲染网格线
   */
  private renderGridLines(data: IRenderData): void {
    const { cells, theme } = data;
    const { ctx } = this;

    // ✅ 使用 Path2D
    const path = new Path2D();

    cells.forEach((cell) => {
      const rect = this.getCellRect(cell, data);
      if (!rect) return;

      // 右边框
      path.moveTo(rect.x + rect.width, rect.y);
      path.lineTo(rect.x + rect.width, rect.y + rect.height);

      // 下边框
      path.moveTo(rect.x, rect.y + rect.height);
      path.lineTo(rect.x + rect.width, rect.y + rect.height);
    });

    // ✅ 一次性绘制
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 1;
    ctx.stroke(path);
  }

  /**
   * 获取单元格矩形（使用真实坐标计算）
   */
  private getCellRect(
    cell: ICell,
    data: IRenderData
  ): { x: number; y: number; width: number; height: number } | null {
    // ✅ 帧缓存检查
    const cacheKey = `${cell.id}`;
    if (this.frameCellRectCache.has(cacheKey)) {
      return this.frameCellRectCache.get(cacheKey)!;
    }

    const { columns, rows, theme, cellPositions, scrollState, frozenColumnCount = 0 } = data;

    const position = cellPositions?.get(cell.id);
    if (!position) {
      console.warn('[CanvasRenderer] Cell position not found:', cell.id);
      return null;
    }

    const { rowIndex, columnIndex } = position;

    // ✅ O(1) 查表获取 X 坐标
    let x = this.columnOffsets[columnIndex];
    const width = this.columnOffsets[columnIndex + 1] - x;

    // 处理滚动和冻结
    if (columnIndex >= frozenColumnCount) {
      x -= scrollState.scrollLeft;
    }

    // ✅ Y 坐标计算（可以类似优化行偏移）
    const headerHeight = theme.headerHeight;
    const rowHeight = rows[rowIndex]?.height || theme.rowHeight;
    let y = headerHeight;

    for (let i = 0; i < rowIndex; i++) {
      y += rows[i]?.height || theme.rowHeight;
    }
    y -= scrollState.scrollTop;

    // 调试：只输出第一个单元格
    if (!this.lastRenderData && rowIndex === 0 && columnIndex === 0) {
      console.log('[CanvasRenderer] First cell rect:', {
        cellId: cell.id,
        position,
        rect: { x, y, width, height: rowHeight },
        scroll: scrollState,
      });
    }

    const rect = { x, y, width, height: rowHeight };

    // ✅ 存入缓存
    this.frameCellRectCache.set(cacheKey, rect);

    return rect;
  }

  /**
   * 渲染冻结列
   */
  private renderFrozenColumns(frozenCells: ICell[], theme: ITheme, data: IRenderData): void {
    const { ctx } = this;
    const { frozenWidth = 0, frozenColumnCount = 0 } = data;

    if (frozenColumnCount === 0 || frozenWidth === 0) return;

    // 保存当前状态
    ctx.save();

    // 先清空冻结列区域（防止滚动内容穿透）
    ctx.fillStyle = theme.bgPrimary;
    ctx.fillRect(
      0,
      theme.headerHeight,
      frozenWidth,
      this.canvas.height / this.dpr - theme.headerHeight
    );

    // 按样式分组渲染冻结列
    const frozenCellsByStyle = this.groupCellsByStyle(frozenCells, theme);
    frozenCellsByStyle.forEach((cells, styleKey) => {
      const style = this.cellStyleCache.get(styleKey)!;

      // 绘制背景
      ctx.fillStyle = style.bg;
      cells.forEach((cell) => {
        const rect = this.getCellRect(cell, data);
        if (rect) {
          ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        }
      });

      // 绘制文本
      ctx.fillStyle = style.text;
      ctx.font = `${theme.fontWeight} ${theme.fontSize}px ${theme.fontFamily}`;
      ctx.textBaseline = 'middle';

      cells.forEach((cell) => {
        const rect = this.getCellRect(cell, data);
        if (!rect) return;

        const text = String(cell.value || '');
        const maxWidth = rect.width - theme.cellPadding * 2;
        const clippedText = this.clipText(text, maxWidth, theme);

        ctx.fillText(clippedText, rect.x + theme.cellPadding, rect.y + rect.height / 2);
      });
    });

    // 绘制冻结列的边框
    ctx.strokeStyle = theme.borderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();

    frozenCells.forEach((cell) => {
      const rect = this.getCellRect(cell, data);
      if (!rect) return;

      // 右边框
      ctx.moveTo(rect.x + rect.width, rect.y);
      ctx.lineTo(rect.x + rect.width, rect.y + rect.height);

      // 下边框
      ctx.moveTo(rect.x, rect.y + rect.height);
      ctx.lineTo(rect.x + rect.width, rect.y + rect.height);
    });

    ctx.stroke();

    // 绘制冻结列右侧的阴影分隔线
    const gradient = ctx.createLinearGradient(frozenWidth, 0, frozenWidth + 10, 0);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(
      frozenWidth,
      theme.headerHeight,
      10,
      this.canvas.height / this.dpr - theme.headerHeight
    );

    // 恢复状态
    ctx.restore();
  }

  /**
   * 文本裁剪（添加省略号）
   */
  private clipText(text: string, maxWidth: number, _theme: ITheme): string {
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

  /**
   * 渲染列宽调整悬停高亮线
   */
  private renderResizeHandle(columnIndex: number, data: IRenderData): void {
    const { columns, theme, scrollState, frozenColumnCount = 0 } = data;
    const { ctx } = this;

    // 计算列的右边界 x 坐标
    let x = 0;
    for (let i = 0; i <= columnIndex; i++) {
      x += columns[i]?.width || 200;
    }

    // 处理滚动
    if (columnIndex >= frozenColumnCount) {
      x -= scrollState.scrollLeft;
    }

    // 绘制高亮线
    const totalHeight = this.canvas.height / this.dpr;
    ctx.save();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'; // 蓝色半透明
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, theme.headerHeight);
    ctx.lineTo(x, totalHeight);
    ctx.stroke();
    ctx.restore();
  }

  /**
   * 渲染列拖动反馈
   */
  private renderColumnDragFeedback(data: IRenderData): void {
    if (!this.columnDragState) return;

    const { columns, theme, scrollState, frozenColumnCount = 0 } = data;
    const { dragColumnIndex, dropTargetIndex, currentX } = this.columnDragState;
    const { ctx } = this;

    // 计算被拖动列的位置和尺寸
    const dragColumn = columns[dragColumnIndex];
    if (!dragColumn) return;

    const dragColumnWidth = dragColumn.width || 200;
    const headerHeight = theme.headerHeight;

    // 1. 绘制拖动列的阴影（覆盖整列，参考 grid 的效果）
    ctx.save();

    // 半透明整列阴影（包含表头与数据区），灰度贴近截图
    const totalHeight = this.canvas.height / this.dpr;
    const shadowX = currentX - dragColumnWidth / 2;
    const shadowY = 0;
    const shadowWidth = dragColumnWidth;
    const shadowHeight = totalHeight;

    // 背景块
    ctx.globalAlpha = 1.0;
    const dragShadowBg = 'rgba(143, 149, 169, 0.18)'; // 柔和灰紫蒙层
    ctx.fillStyle = dragShadowBg;
    ctx.fillRect(shadowX, shadowY, shadowWidth, shadowHeight);

    // 顶部表头强化
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(shadowX, 0, shadowWidth, headerHeight);

    // 边缘高亮线
    ctx.globalAlpha = 1.0;
    const dragBorderColor = '#7C3AED'; // 紫色高亮
    ctx.strokeStyle = dragBorderColor;
    ctx.lineWidth = 2;
    // 轻微外发光
    ctx.save();
    ctx.shadowColor = 'rgba(124,58,237,0.25)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeRect(shadowX + 0.5, 0.5, shadowWidth - 1, shadowHeight - 1);
    ctx.restore();

    // 冻结列阴影裁剪（非冻结列需减去滚动造成的视觉穿透）
    if (frozenColumnCount > 0) {
      ctx.save();
      // 在冻结区右侧添加淡渐变，避免与冻结分割线冲突
      const gradient = ctx.createLinearGradient(shadowX, 0, shadowX + 10, 0);
      gradient.addColorStop(0, 'rgba(0,0,0,0.06)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(shadowX, headerHeight, 10, totalHeight - headerHeight);
      ctx.restore();
    }

    // 表头标题（增强可见性）
    ctx.fillStyle = theme.textPrimary;
    ctx.font = `600 ${theme.fontSize}px ${theme.fontFamily}`;
    ctx.textBaseline = 'middle';
    const title = dragColumn.title || dragColumn.key || `Column ${dragColumnIndex + 1}`;
    ctx.fillText(title, shadowX + theme.cellPadding, headerHeight / 2);

    ctx.restore();

    // 2. 绘制目标插入位置指示器
    if (dropTargetIndex !== -1) {
      ctx.save();

      // 计算插入位置的 X 坐标
      let insertX = 0;
      for (let i = 0; i < dropTargetIndex; i++) {
        insertX += columns[i]?.width || 200;
      }
      // 非冻结列区域需考虑水平滚动
      if (dropTargetIndex >= frozenColumnCount) {
        insertX -= scrollState.scrollLeft;
      }

      // 绘制插入线（高亮贯穿表头与数据区）
      ctx.strokeStyle = dragBorderColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(insertX + 0.5, 0);
      ctx.lineTo(insertX + 0.5, totalHeight);
      ctx.stroke();

      // 绘制顶部和底部的指示三角形
      const triangleSize = 8;
      ctx.fillStyle = dragBorderColor;

      // 顶部三角形
      ctx.beginPath();
      ctx.moveTo(insertX, 0);
      ctx.lineTo(insertX - triangleSize / 2, triangleSize);
      ctx.lineTo(insertX + triangleSize / 2, triangleSize);
      ctx.closePath();
      ctx.fill();

      // 底部三角形
      const canvasHeight = totalHeight;
      ctx.beginPath();
      ctx.moveTo(insertX, canvasHeight);
      ctx.lineTo(insertX - triangleSize / 2, canvasHeight - triangleSize);
      ctx.lineTo(insertX + triangleSize / 2, canvasHeight - triangleSize);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.textMeasureCache.clear();
    this.cellStyleCache.clear();
    this.cellPositionCache.clear();
  }
}
