/**
 * GridEngine - 核心引擎
 *
 * 职责：
 * 1. 协调所有子系统（坐标、虚拟化、渲染）
 * 2. 管理数据和状态
 * 3. 提供统一 API
 * 4. 性能监控
 */

import { CoordinateSystem } from './CoordinateSystem';
import { VirtualScroller } from './VirtualScroller';
import type {
  IGridEngineConfig,
  IRow,
  IColumn,
  ICell,
  IScrollState,
  IVisibleRegion,
  IRenderer,
  IRenderData,
  ITheme,
  ICellPosition,
  IRectangle,
  EventHandler,
  IPerformanceMetrics,
} from '../types';

export class GridEngine {
  // 子系统
  private coordinateSystem: CoordinateSystem;
  private virtualScroller: VirtualScroller;
  private renderer: IRenderer | null = null;

  // 数据
  private rows: IRow[];
  private columns: IColumn[];

  // 状态
  private scrollState: IScrollState = {
    scrollLeft: 0,
    scrollTop: 0,
    isScrolling: false,
  };

  // 配置
  private config: IGridEngineConfig;
  private theme: ITheme;

  // 事件系统
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  // 性能监控
  private performanceMetrics: IPerformanceMetrics = {
    fps: 60,
    renderTime: 0,
    scrollTime: 0,
    totalCells: 0,
    visibleCells: 0,
  };

  // RAF
  private rafId: number | null = null;
  private lastFrameTime: number = 0;

  // 列拖动状态
  private columnDragState: {
    isDragging: boolean;
    dragColumnIndex: number;
    dropTargetIndex: number;
    dragStartX: number;
    currentX: number;
  } | null = null;

  // 列宽调整悬停状态
  private resizeHoverColumnIndex: number = -1;

  constructor(config: IGridEngineConfig) {
    this.config = config;
    this.rows = config.rows;
    this.columns = config.columns;

    // 初始化主题
    this.theme = this.createDefaultTheme(config.theme);

    // 初始化坐标系统
    this.coordinateSystem = new CoordinateSystem({
      rows: this.rows,
      columns: this.columns,
      containerWidth: config.containerWidth,
      containerHeight: config.containerHeight,
      headerHeight: this.theme.headerHeight,
      defaultRowHeight: this.theme.rowHeight,
      frozenColumnCount: config.frozenColumnCount,
    });

    // 初始化虚拟滚动
    this.virtualScroller = new VirtualScroller({
      enabled: config.virtualization?.enabled !== false,
      overscanCount: config.virtualization?.overscanCount,
      dynamicOverscan: true,
    });

    this.performanceMetrics.totalCells = this.rows.length * this.columns.length;
  }

  // ==================== 公共 API ====================

  /**
   * 设置渲染器
   */
  setRenderer(renderer: IRenderer): void {
    if (this.renderer) {
      this.renderer.destroy();
    }
    this.renderer = renderer;
  }

  /**
   * 开始渲染循环
   */
  startRenderLoop(): void {
    if (this.rafId !== null) {
      return; // 已经在运行
    }

    const render = (timestamp: number) => {
      // 计算 FPS
      if (this.lastFrameTime > 0) {
        const delta = timestamp - this.lastFrameTime;
        this.performanceMetrics.fps = Math.round(1000 / delta);
      }
      this.lastFrameTime = timestamp;

      // 执行渲染
      const startTime = performance.now();
      this.render();
      this.performanceMetrics.renderTime = performance.now() - startTime;

      // 继续循环
      this.rafId = requestAnimationFrame(render);
    };

    this.rafId = requestAnimationFrame(render);
  }

  /**
   * 停止渲染循环
   */
  stopRenderLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /**
   * 渲染一帧
   */
  render(): void {
    if (!this.renderer) {
      return;
    }

    // 同步列拖动状态到渲染器
    if ('setColumnDragState' in this.renderer) {
      (this.renderer as any).setColumnDragState(this.columnDragState);
    }

    // 同步列宽调整悬停状态到渲染器
    if ('setResizeHoverColumn' in this.renderer) {
      (this.renderer as any).setResizeHoverColumn(this.resizeHoverColumnIndex);
    }

    // 计算可见区域
    const baseRegion = this.coordinateSystem.getVisibleRegion(
      this.scrollState.scrollLeft,
      this.scrollState.scrollTop
    );

    // 应用虚拟化
    const extendedRegion = this.virtualScroller.getExtendedVisibleRegion(
      baseRegion,
      this.scrollState.scrollTop,
      this.scrollState.scrollLeft,
      this.rows.length,
      this.columns.length
    );

    // 获取可见单元格
    const { cells, cellPositions } = this.getCellsInRegionWithPositions(extendedRegion);

    // 更新性能指标
    this.performanceMetrics.visibleCells = cells.length;

    // 渲染
    const renderData: IRenderData = {
      cells,
      rows: this.rows,
      columns: this.columns,
      visibleRegion: extendedRegion,
      scrollState: this.scrollState,
      theme: this.theme,
      cellPositions,
      frozenColumnCount: this.config.frozenColumnCount,
      frozenWidth: this.coordinateSystem.getFrozenWidth(),
    };

    this.renderer.render(renderData);
  }

  /**
   * 滚动
   */
  scrollTo(scrollLeft?: number, scrollTop?: number): void {
    const startTime = performance.now();

    if (scrollLeft !== undefined) {
      this.scrollState.scrollLeft = Math.max(
        0,
        Math.min(scrollLeft, this.coordinateSystem.getTotalWidth() - this.config.containerWidth)
      );
    }

    if (scrollTop !== undefined) {
      this.scrollState.scrollTop = Math.max(
        0,
        Math.min(scrollTop, this.coordinateSystem.getTotalHeight() - this.config.containerHeight)
      );
    }

    this.scrollState.isScrolling = true;
    this.performanceMetrics.scrollTime = performance.now() - startTime;

    // 触发事件
    this.emit('scroll', { scrollState: this.scrollState });

    // 一段时间后重置滚动状态
    setTimeout(() => {
      this.scrollState.isScrolling = false;
    }, 150);
  }

  /**
   * 更新数据
   */
  updateData(rows?: IRow[], columns?: IColumn[]): void {
    if (rows) {
      this.rows = rows;
      this.performanceMetrics.totalCells = this.rows.length * this.columns.length;
    }

    if (columns) {
      this.columns = columns;
      this.performanceMetrics.totalCells = this.rows.length * this.columns.length;
    }

    // 更新坐标系统
    this.coordinateSystem.updateConfig({
      rows: this.rows,
      columns: this.columns,
    });
  }

  /**
   * 更新容器尺寸
   */
  updateContainerSize(width: number, height: number): void {
    this.config.containerWidth = width;
    this.config.containerHeight = height;

    this.coordinateSystem.updateConfig({
      containerWidth: width,
      containerHeight: height,
    });
  }

  /**
   * 根据坐标获取单元格
   */
  getCellAtPoint(x: number, y: number): ICellPosition | null {
    return this.coordinateSystem.getCellPositionAtPoint(
      x,
      y,
      this.scrollState.scrollLeft,
      this.scrollState.scrollTop
    );
  }

  /**
   * 获取单元格矩形
   */
  getCellRect(position: ICellPosition): IRectangle {
    return this.coordinateSystem.getCellRect(position);
  }

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): IPerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * 事件监听
   */
  on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * 移除事件监听
   */
  off(event: string, handler: EventHandler): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * 获取主题
   */
  getTheme(): ITheme {
    return { ...this.theme };
  }

  /**
   * 获取滚动状态
   */
  getScrollState(): IScrollState {
    return { ...this.scrollState };
  }

  /**
   * 获取内容总尺寸（用于自定义滚动条）
   */
  getTotalSize(): { width: number; height: number } {
    return {
      width: this.coordinateSystem.getTotalWidth(),
      height: this.coordinateSystem.getTotalHeight(),
    };
  }

  /**
   * 获取容器视口尺寸
   */
  getContainerSize(): { width: number; height: number } {
    return { width: this.config.containerWidth, height: this.config.containerHeight };
  }

  /**
   * 获取冻结区域宽度
   */
  getFrozenWidth(): number {
    return this.coordinateSystem.getFrozenWidth();
  }

  /**
   * 动态更新列配置
   */
  updateColumns(columns: IColumn[]): void {
    this.columns = columns;

    // 使用 updateConfig 而不是重新创建（性能更好）
    this.coordinateSystem.updateConfig({
      columns: this.columns,
    });

    // 触发重新渲染
    this.render();

    console.log(
      '[GridEngine] Columns updated, total width:',
      this.coordinateSystem.getTotalWidth()
    );
  }

  /**
   * 动态更新行数据
   */
  updateRows(rows: IRow[]): void {
    this.rows = rows;

    // 使用 updateConfig 而不是重新创建
    this.coordinateSystem.updateConfig({
      rows: this.rows,
    });

    // 触发重新渲染
    this.render();
  }

  /**
   * 设置列拖动状态
   */
  setColumnDragState(
    state: {
      isDragging: boolean;
      dragColumnIndex: number;
      dropTargetIndex: number;
      dragStartX: number;
      currentX: number;
    } | null
  ): void {
    this.columnDragState = state;
    // 触发重新渲染以显示拖动反馈
    this.render();
  }

  /**
   * 获取列拖动状态
   */
  getColumnDragState(): typeof this.columnDragState {
    return this.columnDragState;
  }

  /**
   * 列重排序
   */
  reorderColumn(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
      return;
    }

    const newColumns = [...this.columns];
    const [removed] = newColumns.splice(fromIndex, 1);

    // 如果目标位置在拖动列之后，需要调整索引
    const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    newColumns.splice(adjustedToIndex, 0, removed);

    this.updateColumns(newColumns);

    console.log('[GridEngine] Column reordered:', {
      from: fromIndex,
      to: toIndex,
      adjustedTo: adjustedToIndex,
      columnId: removed.id,
    });
  }

  /**
   * 设置列宽调整悬停列索引
   */
  setResizeHoverColumn(index: number): void {
    this.resizeHoverColumnIndex = index;
    this.render();
  }

  /**
   * 获取列宽调整悬停列索引
   */
  getResizeHoverColumn(): number {
    return this.resizeHoverColumnIndex;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stopRenderLoop();
    this.renderer?.destroy();
    this.eventHandlers.clear();
  }

  // ==================== 私有方法 ====================

  /**
   * 获取区域内的所有单元格（带位置信息）
   */
  private getCellsInRegionWithPositions(region: IVisibleRegion): {
    cells: ICell[];
    cellPositions: Map<string, ICellPosition>;
  } {
    const cells: ICell[] = [];
    const cellPositions = new Map<string, ICellPosition>();

    for (let rowIndex = region.rowStartIndex; rowIndex <= region.rowEndIndex; rowIndex++) {
      const row = this.rows[rowIndex];
      if (!row) continue;

      for (
        let columnIndex = region.columnStartIndex;
        columnIndex <= region.columnEndIndex;
        columnIndex++
      ) {
        const column = this.columns[columnIndex];
        if (!column) continue;

        const cell: ICell = {
          id: `${row.id}-${column.id}`,
          rowId: row.id,
          columnId: column.id,
          value: row.data[column.key],
          type: column.type,
        };

        cells.push(cell);
        cellPositions.set(cell.id, { rowIndex, columnIndex });
      }
    }

    return { cells, cellPositions };
  }

  /**
   * 获取区域内的所有单元格（向后兼容）
   */
  private getCellsInRegion(region: IVisibleRegion): ICell[] {
    return this.getCellsInRegionWithPositions(region).cells;
  }

  /**
   * 触发事件
   */
  private emit(event: string, data: any): void {
    this.eventHandlers.get(event)?.forEach((handler) => {
      handler({ type: event, ...data });
    });
  }

  /**
   * 创建默认主题
   */
  private createDefaultTheme(customTheme?: Partial<ITheme>): ITheme {
    const defaultTheme: ITheme = {
      bgPrimary: '#ffffff',
      bgSecondary: '#f8f9fa',
      bgHover: '#f0f1f3',
      bgActive: '#e8eaed',
      bgSelected: '#e3f2fd',

      textPrimary: '#1f2937',
      textSecondary: '#6b7280',
      textDisabled: '#9ca3af',

      borderColor: '#e5e7eb',
      borderColorActive: '#3b82f6',

      cellPadding: 8,
      headerHeight: 40,
      rowHeight: 36,

      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 14,
      fontWeight: 400,
    };

    return { ...defaultTheme, ...customTheme };
  }
}
