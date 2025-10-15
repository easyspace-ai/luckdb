/**
 * BigTable React - React 适配层
 */

export { BigTable, type IBigTableProps } from './BigTable';
export { useBigTable, type IUseBigTableConfig, type IUseBigTableReturn } from './hooks/useBigTable';

// Re-export core types for convenience
export type { IRow, IColumn, ICell, ITheme, IPerformanceMetrics } from '../core';
