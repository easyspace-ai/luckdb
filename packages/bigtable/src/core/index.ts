/**
 * BigTable Core - 核心引擎（框架无关）
 */

// Engine
export { GridEngine } from './engine/GridEngine';
export { CoordinateSystem } from './engine/CoordinateSystem';
export { VirtualScroller } from './engine/VirtualScroller';

// Renderers
export { type IRenderer } from './renderers/base/IRenderer';
export { CanvasRenderer } from './renderers/canvas/CanvasRenderer';

// Types
export type {
  IPosition,
  ISize,
  IRectangle,
  IRange,
  CellId,
  RowId,
  ColumnId,
  ICellPosition,
  ICell,
  IRow,
  IColumn,
  IScrollState,
  IVisibleRegion,
  ISelection,
  RenderMode,
  IRenderContext,
  ITheme,
  IGridEngineConfig,
  IRenderData,
  IGridEvent,
  EventHandler,
  IPerformanceMetrics,
} from './types';
