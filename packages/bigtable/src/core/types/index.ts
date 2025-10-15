/**
 * BigTable Core Types
 * 核心类型定义 - 框架无关
 */

// ==================== 基础类型 ====================

export interface IPosition {
  x: number;
  y: number;
}

export interface ISize {
  width: number;
  height: number;
}

export interface IRectangle extends IPosition, ISize {}

export interface IRange {
  start: number;
  end: number;
}

// ==================== 单元格类型 ====================

export type CellId = string;
export type RowId = string | number;
export type ColumnId = string | number;

export interface ICellPosition {
  rowIndex: number;
  columnIndex: number;
}

export interface ICell {
  id: CellId;
  rowId: RowId;
  columnId: ColumnId;
  value: unknown;
  type?: string;
  readonly?: boolean;
  [key: string]: unknown;
}

// ==================== 行列定义 ====================

export interface IRow {
  id: RowId;
  height?: number;
  data: Record<string, unknown>;
}

export interface IColumn {
  id: ColumnId;
  width: number;
  key: string;
  title?: string;
  type?: string;
  frozen?: boolean;
  [key: string]: unknown;
}

// ==================== 滚动状态 ====================

export interface IScrollState {
  scrollLeft: number;
  scrollTop: number;
  isScrolling: boolean;
}

// ==================== 可见区域 ====================

export interface IVisibleRegion {
  rowStartIndex: number;
  rowEndIndex: number;
  columnStartIndex: number;
  columnEndIndex: number;
}

// ==================== 选区 ====================

export interface ISelection {
  start: ICellPosition;
  end: ICellPosition;
}

// ==================== 渲染配置 ====================

export type RenderMode = 'dom' | 'canvas' | 'webgl';

export interface IRenderContext {
  canvas?: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
  dpr: number;
  theme: ITheme;
}

// ==================== 主题 ====================

export interface ITheme {
  // 颜色
  bgPrimary: string;
  bgSecondary: string;
  bgHover: string;
  bgActive: string;
  bgSelected: string;

  textPrimary: string;
  textSecondary: string;
  textDisabled: string;

  borderColor: string;
  borderColorActive: string;

  // 尺寸
  cellPadding: number;
  headerHeight: number;
  rowHeight: number;

  // 字体
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
}

// ==================== 引擎配置 ====================

export interface IGridEngineConfig {
  // 数据
  rows: IRow[];
  columns: IColumn[];

  // 容器
  containerWidth: number;
  containerHeight: number;

  // 渲染
  renderMode: RenderMode;

  // 虚拟化
  virtualization?: {
    enabled: boolean;
    overscanCount?: number;
  };

  // 冻结列
  frozenColumnCount?: number;

  // 主题
  theme?: Partial<ITheme>;
}

// ==================== 渲染器接口 ====================

export interface IRenderer {
  render(data: IRenderData): void;
  destroy(): void;
}

export interface IRenderData {
  cells: ICell[];
  rows: IRow[];
  columns: IColumn[];
  visibleRegion: IVisibleRegion;
  scrollState: IScrollState;
  selection?: ISelection;
  theme: ITheme;
  cellPositions?: Map<CellId, ICellPosition>;
  frozenColumnCount?: number;
  frozenWidth?: number;
}

// ==================== 事件 ====================

export interface IGridEvent {
  type: string;
  target?: ICellPosition;
  originalEvent?: Event;
  [key: string]: unknown;
}

export type EventHandler = (event: IGridEvent) => void;

// ==================== 性能监控 ====================

export interface IPerformanceMetrics {
  fps: number;
  renderTime: number;
  scrollTime: number;
  totalCells: number;
  visibleCells: number;
}
