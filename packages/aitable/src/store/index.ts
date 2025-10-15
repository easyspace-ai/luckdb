// @ts-nocheck
/**
 * Grid Store 统一导出
 * 
 * 这是新的状态管理方案，替换旧的 Context 嵌套
 */

// Store
export { useGridStore, type GridStore } from './grid-store';

// Types
export type {
  Base,
  Table,
  Field,
  Record,
  View,
  Permission,
  Session,
} from './grid-store';

// Selectors
export {
  selectCurrentBase,
  selectCurrentTable,
  selectCurrentView,
  selectBases,
  selectTables,
  selectFields,
  selectRecords,
  selectViews,
  selectIsLoading,
  selectError,
  selectScrollState,
  selectSelection,
  selectEditing,
  selectPermissions,
  selectSession,
} from './grid-store';

// Provider
export { GridStoreProvider } from './GridStoreProvider';
export type { default as GridStoreProviderType } from './GridStoreProvider';

// Hooks
export {
  useCurrentBase,
  useCurrentTable,
  useCurrentView,
  useBases,
  useTables,
  useFields,
  useRecords,
  useViews,
  useScrollState,
  useMouseState,
  useDragState,
  useDialog,
  useTheme,
  useSelection,
  useEditing,
  usePermissions,
  useSession,
  useIsLoading,
  useError,
} from './hooks';
