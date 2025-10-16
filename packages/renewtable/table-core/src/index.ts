/**
 * @luckdb/table-core
 * Headless canvas table core - Framework agnostic
 */

// Core
export { createTable } from './core/table';
export { CoordinateManager, ItemType } from './core/coordinate';
export type { CoordinateConfig, CellMetadata, IndicesMap } from './core/coordinate';

// Features
export { VirtualScroller, VirtualScrolling } from './features/VirtualScrolling';
export type { VirtualScrollingState } from './features/VirtualScrolling';
export { ColumnSizing, ColumnResizeHandler } from './features/ColumnSizing';
export type { ColumnSizingState, ColumnSizingOptions } from './features/ColumnSizing';
export { ColumnOrdering, ColumnDragHandler } from './features/ColumnOrdering';
export type { ColumnOrderState } from './features/ColumnOrdering';

// Renderers
export { CanvasRenderer } from './renderers/CanvasRenderer';
export { RendererRegistry } from './renderers/registry';
export { textRenderer } from './renderers/cell-renderers/text';
export { numberRenderer } from './renderers/cell-renderers/number';
export { booleanRenderer } from './renderers/cell-renderers/boolean';
export { dateRenderer } from './renderers/cell-renderers/date';
export { selectRenderer } from './renderers/cell-renderers/select';
export { ratingRenderer } from './renderers/cell-renderers/rating';

// Types
export type {
  Table,
  TableOptions,
  TableState,
  Column,
  ColumnDef,
  Row,
  Cell,
  Rect,
  Size,
  Position,
  VisibleRange,
  Updater,
  OnChangeFn,
  TableFeature,
} from './types/core';

export type {
  CellRenderer,
  CellRenderContext,
  CellStyle,
  GridTheme,
} from './types/canvas';

export { defaultTheme } from './types/canvas';

