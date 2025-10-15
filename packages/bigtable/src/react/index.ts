/**
 * BigTable React - React 适配层
 */

export { BigTable, type IBigTableProps } from './BigTable';
export { useBigTable, type IUseBigTableConfig, type IUseBigTableReturn } from './hooks/useBigTable';
export { useColumnDrag, type IColumnDragState } from './hooks/useColumnDrag';
export { EditorOverlay, type EditorOverlayProps } from './components/EditorOverlay';
export { TouchLayer } from './components/TouchLayer';
export { Scrollbars } from './components/Scrollbars';

// Re-export core types for convenience
export type { IRow, IColumn, ICell, ITheme, IPerformanceMetrics } from '../core';
export type { IEditorState, IEditorCallbacks } from '../core/editors/types';
