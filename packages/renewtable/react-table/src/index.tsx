/**
 * @luckdb/react-table
 * React adapter for table-core
 */

export { Table } from './components/Table';
export type { TableProps } from './components/Table';
export { useTable } from './hooks/useTable';

// Re-export from table-core for convenience
export type {
  ColumnDef,
  TableOptions,
  Table as TableInstance,
  Column,
  Row,
  Cell,
  GridTheme,
} from '@luckdb/table-core';

export { defaultTheme } from '@luckdb/table-core';

