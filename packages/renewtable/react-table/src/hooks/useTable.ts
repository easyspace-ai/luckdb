/**
 * useTable Hook
 * React hook for table instance
 */

import { useRef, useState, useEffect } from 'react';
import { createTable, Table, TableOptions, TableState } from '@luckdb/table-core';

export function useTable<TData>(options: TableOptions<TData>): Table<TData> {
  const tableRef = useRef<Table<TData>>();
  const [, forceUpdate] = useState({});

  if (!tableRef.current) {
    tableRef.current = createTable({
      ...options,
      onStateChange: (state) => {
        forceUpdate({});
        options.onStateChange?.(state);
      },
    });
  }

  // Update table options when they change
  useEffect(() => {
    if (tableRef.current) {
      tableRef.current.setOptions(options);
    }
  }, [options]);

  return tableRef.current;
}

