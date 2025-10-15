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

// Editors
export { BaseEditor } from './editors/BaseEditor';
export { TextEditor } from './editors/TextEditor';
export type {
  IEditor,
  IEditorState,
  IEditorCallbacks,
  IEditorConfig,
  IEditorMeta,
} from './editors/types';

// Interaction
export { KeyboardManager } from './interaction/KeyboardManager';
export { SelectionManager } from './interaction/SelectionManager';
export type { IKeyboardConfig, IKeyboardCallbacks } from './interaction/KeyboardManager';
export type { ISelectionCallbacks } from './interaction/SelectionManager';

// Fields
export { BaseField } from './fields/BaseField';
export { TextField } from './fields/TextField';
export { NumberField, NumberFormat } from './fields/NumberField';
export { DateField, DateFormat } from './fields/DateField';
export { CheckboxField } from './fields/CheckboxField';
export { FieldRegistry } from './fields/FieldRegistry';
export type {
  FieldType,
  IField,
  IFieldConfig,
  IFieldMeta,
  IFieldValidationRule,
} from './fields/types';

// Operations
export { RowOperations } from './operations/RowOperations';
export { ColumnOperations } from './operations/ColumnOperations';
export type { OperationType, IOperation, IOperationCallbacks } from './operations/types';

// History
export { HistoryManager } from './history/HistoryManager';
export { UpdateCellCommand } from './history/commands/UpdateCellCommand';
export { AddRowCommand } from './history/commands/AddRowCommand';
export { DeleteRowCommand } from './history/commands/DeleteRowCommand';
export type {
  ICommand,
  IHistoryItem,
  IHistoryManagerConfig,
  IHistoryManagerCallbacks,
} from './history/types';

// Data
export { SortManager } from './data/SortManager';
export { FilterManager } from './data/FilterManager';
export { GroupManager } from './data/GroupManager';
export { FilterOperator, AggregationType } from './data/types';
export type {
  ISortConfig,
  SortDirection,
  IFilterCondition,
  IFilterGroup,
  IGroupConfig,
  IGroup,
  IAggregationConfig,
} from './data/types';

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
