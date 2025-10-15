// @ts-nocheck
/**
 * Grid Store Hooks
 * 
 * 提供便捷的 hooks 来访问和操作 store
 * 这些 hooks 经过优化，只订阅需要的状态，避免无脑重渲染
 */

import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  useGridStore,
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
  type GridStore,
  type Base,
  type Table,
  type Field,
  type Record,
  type View,
  type Permission,
  type Session,
} from './grid-store';
import type { ApiClient } from '../api/client';

// ============= Data Hooks =============

/**
 * 使用当前 Base
 */
export function useCurrentBase(): {
  base: Base | null;
  setBase: (base: Base | null) => void;
} {
  const base = useGridStore(selectCurrentBase);
  const setBase = useGridStore(state => state.setCurrentBase);
  
  return { base, setBase };
}

/**
 * 使用当前 Table
 */
export function useCurrentTable(): {
  table: Table | null;
  setTable: (table: Table | null) => void;
} {
  const table = useGridStore(selectCurrentTable);
  const setTable = useGridStore(state => state.setCurrentTable);
  
  return { table, setTable };
}

/**
 * 使用当前 View
 */
export function useCurrentView(): {
  view: View | null;
  setView: (view: View | null) => void;
} {
  const view = useGridStore(selectCurrentView);
  const setView = useGridStore(state => state.setCurrentView);
  
  return { view, setView };
}

/**
 * 使用 Bases
 */
export function useBases(apiClient: ApiClient): {
  bases: Base[];
  isLoading: boolean;
  error: Error | null;
  loadBases: () => Promise<void>;
  createBase: (data: Partial<Base>) => Promise<Base>;
  updateBase: (id: string, data: Partial<Base>) => Promise<void>;
  deleteBase: (id: string) => Promise<void>;
} {
  const bases = useGridStore(selectBases);
  const isLoading = useGridStore(state => state.isLoadingBases);
  const error = useGridStore(selectError);
  
  const loadBases = useCallback(
    () => useGridStore.getState().loadBases(apiClient),
    [apiClient]
  );
  
  const createBase = useCallback(
    (data: Partial<Base>) => useGridStore.getState().createBase(apiClient, data),
    [apiClient]
  );
  
  const updateBase = useCallback(
    (id: string, data: Partial<Base>) => useGridStore.getState().updateBase(apiClient, id, data),
    [apiClient]
  );
  
  const deleteBase = useCallback(
    (id: string) => useGridStore.getState().deleteBase(apiClient, id),
    [apiClient]
  );
  
  return {
    bases,
    isLoading,
    error,
    loadBases,
    createBase,
    updateBase,
    deleteBase,
  };
}

/**
 * 使用 Tables
 */
export function useTables(apiClient: ApiClient, baseId: string): {
  tables: Table[];
  isLoading: boolean;
  error: Error | null;
  loadTables: () => Promise<void>;
  createTable: (data: Partial<Table>) => Promise<Table>;
  updateTable: (id: string, data: Partial<Table>) => Promise<void>;
  deleteTable: (id: string) => Promise<void>;
} {
  const tables = useGridStore(selectTables);
  const isLoading = useGridStore(state => state.isLoadingTables);
  const error = useGridStore(selectError);
  
  const loadTables = useCallback(
    () => useGridStore.getState().loadTables(apiClient, baseId),
    [apiClient, baseId]
  );
  
  const createTable = useCallback(
    (data: Partial<Table>) => useGridStore.getState().createTable(apiClient, baseId, data),
    [apiClient, baseId]
  );
  
  const updateTable = useCallback(
    (id: string, data: Partial<Table>) => useGridStore.getState().updateTable(apiClient, id, data),
    [apiClient]
  );
  
  const deleteTable = useCallback(
    (id: string) => useGridStore.getState().deleteTable(apiClient, id),
    [apiClient]
  );
  
  return {
    tables,
    isLoading,
    error,
    loadTables,
    createTable,
    updateTable,
    deleteTable,
  };
}

/**
 * 使用 Fields
 */
export function useFields(apiClient: ApiClient, tableId: string): {
  fields: Field[];
  isLoading: boolean;
  error: Error | null;
  loadFields: () => Promise<void>;
  createField: (data: Partial<Field>) => Promise<Field>;
  updateField: (id: string, data: Partial<Field>) => Promise<void>;
  deleteField: (id: string) => Promise<void>;
} {
  const fields = useGridStore(selectFields);
  const isLoading = useGridStore(state => state.isLoadingFields);
  const error = useGridStore(selectError);
  
  const loadFields = useCallback(
    () => useGridStore.getState().loadFields(apiClient, tableId),
    [apiClient, tableId]
  );
  
  const createField = useCallback(
    (data: Partial<Field>) => useGridStore.getState().createField(apiClient, tableId, data),
    [apiClient, tableId]
  );
  
  const updateField = useCallback(
    (id: string, data: Partial<Field>) => useGridStore.getState().updateField(apiClient, id, data),
    [apiClient]
  );
  
  const deleteField = useCallback(
    (id: string) => useGridStore.getState().deleteField(apiClient, id),
    [apiClient]
  );
  
  return {
    fields,
    isLoading,
    error,
    loadFields,
    createField,
    updateField,
    deleteField,
  };
}

/**
 * 使用 Records
 */
export function useRecords(apiClient: ApiClient, tableId: string): {
  records: Record[];
  isLoading: boolean;
  error: Error | null;
  loadRecords: () => Promise<void>;
  createRecord: (data: Partial<Record>) => Promise<Record>;
  updateRecord: (id: string, data: Partial<Record>) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  bulkUpdateRecords: (updates: Array<{ id: string; data: Partial<Record> }>) => Promise<void>;
} {
  const records = useGridStore(selectRecords);
  const isLoading = useGridStore(state => state.isLoadingRecords);
  const error = useGridStore(selectError);
  
  const loadRecords = useCallback(
    () => useGridStore.getState().loadRecords(apiClient, tableId),
    [apiClient, tableId]
  );
  
  const createRecord = useCallback(
    (data: Partial<Record>) => useGridStore.getState().createRecord(apiClient, tableId, data),
    [apiClient, tableId]
  );
  
  const updateRecord = useCallback(
    (id: string, data: Partial<Record>) => useGridStore.getState().updateRecord(apiClient, id, data),
    [apiClient]
  );
  
  const deleteRecord = useCallback(
    (id: string) => useGridStore.getState().deleteRecord(apiClient, id),
    [apiClient]
  );
  
  const bulkUpdateRecords = useCallback(
    (updates: Array<{ id: string; data: Partial<Record> }>) => 
      useGridStore.getState().bulkUpdateRecords(apiClient, updates),
    [apiClient]
  );
  
  return {
    records,
    isLoading,
    error,
    loadRecords,
    createRecord,
    updateRecord,
    deleteRecord,
    bulkUpdateRecords,
  };
}

/**
 * 使用 Views
 */
export function useViews(apiClient: ApiClient, tableId: string): {
  views: View[];
  isLoading: boolean;
  error: Error | null;
  loadViews: () => Promise<void>;
  createView: (data: Partial<View>) => Promise<View>;
  updateView: (id: string, data: Partial<View>) => Promise<void>;
  deleteView: (id: string) => Promise<void>;
} {
  const views = useGridStore(selectViews);
  const isLoading = useGridStore(state => state.isLoadingViews);
  const error = useGridStore(selectError);
  
  const loadViews = useCallback(
    () => useGridStore.getState().loadViews(apiClient, tableId),
    [apiClient, tableId]
  );
  
  const createView = useCallback(
    (data: Partial<View>) => useGridStore.getState().createView(apiClient, tableId, data),
    [apiClient, tableId]
  );
  
  const updateView = useCallback(
    (id: string, data: Partial<View>) => useGridStore.getState().updateView(apiClient, id, data),
    [apiClient]
  );
  
  const deleteView = useCallback(
    (id: string) => useGridStore.getState().deleteView(apiClient, id),
    [apiClient]
  );
  
  return {
    views,
    isLoading,
    error,
    loadViews,
    createView,
    updateView,
    deleteView,
  };
}

// ============= UI Hooks =============

/**
 * 使用滚动状态
 */
export function useScrollState(): {
  scrollTop: number;
  scrollLeft: number;
  setScroll: (scrollTop: number, scrollLeft: number) => void;
} {
  const { scrollTop, scrollLeft } = useGridStore(selectScrollState);
  const setScroll = useGridStore(state => state.setScroll);
  
  return { scrollTop, scrollLeft, setScroll };
}

/**
 * 使用鼠标状态
 */
export function useMouseState(): {
  position: { x: number; y: number } | null;
  hoveredCell: { rowIndex: number; columnIndex: number } | null;
  setPosition: (position: { x: number; y: number } | null) => void;
  setHoveredCell: (cell: { rowIndex: number; columnIndex: number } | null) => void;
} {
  const position = useGridStore(state => state.mousePosition);
  const hoveredCell = useGridStore(state => state.hoveredCell);
  const setPosition = useGridStore(state => state.setMousePosition);
  const setHoveredCell = useGridStore(state => state.setHoveredCell);
  
  return {
    position,
    hoveredCell,
    setPosition,
    setHoveredCell,
  };
}

/**
 * 使用拖拽状态
 */
export function useDragState(): {
  isDragging: boolean;
  dragTarget: 'row' | 'column' | 'cell' | null;
  dragStartPosition: { x: number; y: number } | null;
  startDrag: (target: 'row' | 'column' | 'cell', position: { x: number; y: number }) => void;
  endDrag: () => void;
} {
  const state = useGridStore(
    useShallow((state) => ({
      isDragging: state.isDragging,
      dragTarget: state.dragTarget,
      dragStartPosition: state.dragStartPosition,
      startDrag: state.startDrag,
      endDrag: state.endDrag,
    }))
  );
  
  return state;
}

/**
 * 使用对话框状态
 */
export function useDialog(dialogId: string): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
} {
  const isOpen = useGridStore(state => state.openDialogs.has(dialogId));
  const openDialog = useGridStore(state => state.openDialog);
  const closeDialog = useGridStore(state => state.closeDialog);
  
  const open = useCallback(() => {
    openDialog(dialogId);
  }, [openDialog, dialogId]);
  
  const close = useCallback(() => {
    closeDialog(dialogId);
  }, [closeDialog, dialogId]);
  
  return { isOpen, open, close };
}

/**
 * 使用主题
 */
export function useTheme(): {
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
} {
  const theme = useGridStore(state => state.theme);
  const setTheme = useGridStore(state => state.setTheme);
  
  return { theme, setTheme };
}

// ============= Selection Hooks =============

/**
 * 使用选择状态
 */
export function useSelection(): {
  selectedRanges: Array<{
    startRow: number;
    endRow: number;
    startColumn: number;
    endColumn: number;
  }>;
  activeCell: { rowIndex: number; columnIndex: number } | null;
  isMultiSelect: boolean;
  setSelectedRanges: (ranges: GridStore['selectedRanges']) => void;
  addSelectedRange: (range: GridStore['selectedRanges'][0]) => void;
  clearSelection: () => void;
  setActiveCell: (cell: { rowIndex: number; columnIndex: number } | null) => void;
  setMultiSelect: (enabled: boolean) => void;
} {
  const selection = useGridStore(selectSelection);
  const actions = useGridStore(
    useShallow((state) => ({
      setSelectedRanges: state.setSelectedRanges,
      addSelectedRange: state.addSelectedRange,
      clearSelection: state.clearSelection,
      setActiveCell: state.setActiveCell,
      setMultiSelect: state.setMultiSelect,
    }))
  );
  
  return {
    ...selection,
    ...actions,
  };
}

// ============= Editing Hooks =============

/**
 * 使用编辑状态
 */
export function useEditing(): {
  isEditing: boolean;
  editingCell: { rowIndex: number; columnIndex: number } | null;
  editingValue: unknown;
  canUndo: boolean;
  canRedo: boolean;
  startEditing: (cell: { rowIndex: number; columnIndex: number }, initialValue: unknown) => void;
  updateEditingValue: (value: unknown) => void;
  commitEdit: () => void;
  cancelEdit: () => void;
  undo: () => void;
  redo: () => void;
} {
  const editing = useGridStore(selectEditing);
  const actions = useGridStore(
    useShallow((state) => ({
      startEditing: state.startEditing,
      updateEditingValue: state.updateEditingValue,
      commitEdit: state.commitEdit,
      cancelEdit: state.cancelEdit,
      undo: state.undo,
      redo: state.redo,
    }))
  );
  
  return {
    ...editing,
    ...actions,
  };
}

// ============= Permission Hooks =============

/**
 * 使用权限
 */
export function usePermissions(): Permission {
  return useGridStore(selectPermissions);
}

/**
 * 使用 Session
 */
export function useSession(): Session {
  return useGridStore(selectSession);
}

// ============= Loading & Error Hooks =============

/**
 * 使用加载状态
 */
export function useIsLoading(): boolean {
  return useGridStore(selectIsLoading);
}

/**
 * 使用错误状态
 */
export function useError(): {
  error: Error | null;
  setError: (error: Error | null) => void;
  clearError: () => void;
} {
  const error = useGridStore(selectError);
  const setError = useGridStore(state => state.setError);
  const clearError = useGridStore(state => state.clearError);
  
  return { error, setError, clearError };
}
