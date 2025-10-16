/**
 * Table Core
 * Main table instance based on TanStack Table architecture
 */

import { CoordinateManager } from './coordinate';
import { VirtualScroller } from '../features/VirtualScrolling';
import {
  TableOptions,
  TableState,
  Table,
  Column,
  Row,
  Cell,
  ColumnDef,
  Updater,
  TableFeature,
} from '../types/core';

export function createTable<TData>(options: TableOptions<TData>): Table<TData> {
  const initialState: TableState = {
    columnSizing: {},
    columnOrder: [],
    columnVisibility: {},
    sorting: [],
    scrollTop: 0,
    scrollLeft: 0,
    ...options.state,
  };

  let state = initialState;
  const features: TableFeature[] = [];

  // Initialize coordinate manager
  const coordManager = new CoordinateManager({
    rowHeight: options.rowHeight || 40,
    columnWidth: options.columnWidth || 150,
    rowCount: options.data.length,
    columnCount: options.columns.length,
    containerWidth: options.containerWidth || 800,
    containerHeight: options.containerHeight || 600,
  });

  // Initialize virtual scroller
  const virtualScroller = new VirtualScroller(
    coordManager,
    options.containerHeight || 600,
    options.containerWidth || 800
  );

  // Create columns
  const columns: Column<TData>[] = options.columns.map((columnDef, index) => {
    const column: Column<TData> = {
      id: columnDef.id || columnDef.accessorKey || `column_${index}`,
      columnDef,
      getSize: () => {
        return (
          state.columnSizing[column.id] ||
          columnDef.size ||
          options.columnWidth ||
          150
        );
      },
      getIndex: () => index,
    };
    return column;
  });

  // Create rows
  const rows: Row<TData>[] = options.data.map((data, index) => {
    const row: Row<TData> = {
      id: `row_${index}`,
      index,
      original: data,
      getVisibleCells: () => {
        return columns.map(column => {
          const cell: Cell<TData> = {
            id: `${row.id}_${column.id}`,
            row,
            column,
            getValue: () => {
              if (column.columnDef.accessorFn) {
                return column.columnDef.accessorFn(data);
              }
              if (column.columnDef.accessorKey) {
                return data[column.columnDef.accessorKey as keyof TData];
              }
              return undefined;
            },
            renderValue: () => {
              const value = cell.getValue();
              return value;
            },
          };
          return cell;
        });
      },
    };
    return row;
  });

  const table: Table<TData> = {
    options,
    initialState,
    _features: features,

    getState: () => state,

    setState: (updater: Updater<Partial<TableState>>) => {
      state = {
        ...state,
        ...(typeof updater === 'function' ? updater(state) : updater),
      };
      if (options.onStateChange) {
        options.onStateChange(state);
      }
    },

    getAllColumns: () => columns,
    
    getAllRows: () => rows,

    getRowModel: () => ({ rows }),

    setOptions: (newOptions: Partial<TableOptions<TData>>) => {
      Object.assign(table.options, newOptions);
    },

    reset: () => {
      state = initialState;
    },
  };

  // Apply features
  features.forEach(feature => {
    if (feature.createTable) {
      feature.createTable(table);
    }
  });

  return table;
}

