/**
 * Core type definitions for table-core
 * Based on TanStack Table architecture
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface VisibleRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

export type Updater<T> = T | ((old: T) => T);
export type OnChangeFn<T> = (updaterOrValue: Updater<T>) => void;

export interface RowData {
  [key: string]: any;
}

export type AccessorFn<TData, TValue> = (row: TData) => TValue;

export interface ColumnDef<TData, TValue = any> {
  id?: string;
  header?: string;
  accessorKey?: string & keyof TData;
  accessorFn?: AccessorFn<TData, TValue>;
  size?: number;
  minSize?: number;
  maxSize?: number;
  enableResizing?: boolean;
  enableSorting?: boolean;
  meta?: Record<string, any>;
}

export interface TableOptions<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  state?: Partial<TableState>;
  onStateChange?: OnChangeFn<Partial<TableState>>;
  
  // Canvas specific
  rowHeight?: number;
  columnWidth?: number;
  containerWidth?: number;
  containerHeight?: number;
  
  // Feature toggles
  enableColumnResizing?: boolean;
  enableSorting?: boolean;
  enableVirtualization?: boolean;
  
  // Callbacks
  onColumnResize?: (columnId: string, size: number) => void;
  onColumnOrderChange?: (columnOrder: string[]) => void;
  onCellClick?: (rowIndex: number, columnId: string) => void;
  onCellDoubleClick?: (rowIndex: number, columnId: string) => void;
}

export interface TableState {
  columnSizing: Record<string, number>;
  columnOrder: string[];
  columnVisibility: Record<string, boolean>;
  sorting: SortingState;
  
  // Canvas specific
  scrollTop: number;
  scrollLeft: number;
  visibleRange?: VisibleRange;
}

export type SortingState = Array<{
  columnId: string;
  desc: boolean;
}>;

export interface Column<TData, TValue = any> {
  id: string;
  columnDef: ColumnDef<TData, TValue>;
  getSize: () => number;
  getIndex: () => number;
}

export interface Row<TData> {
  id: string;
  index: number;
  original: TData;
  getVisibleCells: () => Cell<TData>[];
}

export interface Cell<TData, TValue = any> {
  id: string;
  row: Row<TData>;
  column: Column<TData, TValue>;
  getValue: () => TValue;
  renderValue: () => any;
}

export interface Table<TData> {
  options: TableOptions<TData>;
  initialState: TableState;
  
  getState: () => TableState;
  setState: (updater: Updater<Partial<TableState>>) => void;
  
  getAllColumns: () => Column<TData>[];
  getAllRows: () => Row<TData>[];
  getRowModel: () => { rows: Row<TData>[] };
  
  setOptions: (options: Partial<TableOptions<TData>>) => void;
  reset: () => void;
  
  // Internal
  _features: TableFeature[];
}

export interface TableFeature {
  name?: string;
  getInitialState?: (state: Partial<TableState>) => Partial<TableState>;
  createTable?: <TData>(table: Table<TData>) => void;
  createColumn?: <TData>(column: Column<TData>, table: Table<TData>) => void;
  createRow?: <TData>(row: Row<TData>, table: Table<TData>) => void;
  createCell?: <TData>(cell: Cell<TData>, row: Row<TData>, column: Column<TData>, table: Table<TData>) => void;
}

