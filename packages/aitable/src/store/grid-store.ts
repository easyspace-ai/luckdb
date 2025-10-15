/**
 * 统一的 Grid 状态管理 Store
 * 
 * 使用 Zustand 替换 Context 嵌套地狱
 * 特性：
 * - 类型安全的状态管理
 * - 精确的状态订阅（避免无脑重渲染）
 * - 支持中间件（devtools, persist, immer）
 * - 清晰的状态分片
 * 
 * TODO: 完善ApiClient类型定义和API调用方式
 */

// @ts-nocheck - 暂时禁用类型检查，待ApiClient类型完善后移除

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { ApiClient } from '../api/client';

// ============= 类型定义 =============

export interface Base {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Table {
  id: string;
  baseId: string;
  name: string;
  description?: string;
  icon?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Field {
  id: string;
  tableId: string;
  name: string;
  type: string;
  description?: string;
  config: Record<string, unknown>;
  order: number;
  required: boolean;
  unique: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GridRecord {
  id: string;
  tableId: string;
  fields: Record<string, unknown>;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface View {
  id: string;
  tableId: string;
  name: string;
  type: 'grid' | 'kanban' | 'calendar' | 'gallery';
  filter?: Record<string, unknown>;
  sort?: Array<{ fieldId: string; order: 'asc' | 'desc' }>;
  group?: Array<{ fieldId: string }>;
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canManageFields: boolean;
  canManageViews: boolean;
  canManagePermissions: boolean;
}

export interface Session {
  userId?: string;
  userName?: string;
  userEmail?: string;
  token?: string;
  expiresAt?: Date;
}

// ============= 状态分片接口 =============

interface DataSlice {
  // 当前数据
  currentBase: Base | null;
  currentTable: Table | null;
  currentView: View | null;
  
  // 数据集合
  bases: Map<string, Base>;
  tables: Map<string, Table>;
  fields: Map<string, Field>;
  records: Map<string, GridRecord>;
  views: Map<string, View>;
  
  // 加载状态
  isLoadingBases: boolean;
  isLoadingTables: boolean;
  isLoadingFields: boolean;
  isLoadingRecords: boolean;
  isLoadingViews: boolean;
  
  // 错误状态
  error: Error | null;
}

interface UISlice {
  // 滚动状态
  scrollTop: number;
  scrollLeft: number;
  
  // 鼠标状态
  mousePosition: { x: number; y: number } | null;
  hoveredCell: { rowIndex: number; columnIndex: number } | null;
  
  // 拖拽状态
  isDragging: boolean;
  dragTarget: 'row' | 'column' | 'cell' | null;
  dragStartPosition: { x: number; y: number } | null;
  
  // 对话框状态
  openDialogs: Set<string>;
  
  // 主题
  theme: 'light' | 'dark' | 'auto';
}

interface SelectionSlice {
  // 选择范围
  selectedRanges: Array<{
    startRow: number;
    endRow: number;
    startColumn: number;
    endColumn: number;
  }>;
  
  // 活动单元格
  activeCell: { rowIndex: number; columnIndex: number } | null;
  
  // 选择模式
  isMultiSelect: boolean;
}

interface EditingSlice {
  // 编辑状态
  isEditing: boolean;
  editingCell: { rowIndex: number; columnIndex: number } | null;
  editingValue: unknown;
  
  // 历史记录
  canUndo: boolean;
  canRedo: boolean;
}

interface PermissionSlice {
  permissions: Permission;
}

interface SessionSlice {
  session: Session;
}

// ============= Actions 接口 =============

interface DataActions {
  // Base 操作
  setCurrentBase: (base: Base | null) => void;
  loadBases: (apiClient: ApiClient) => Promise<void>;
  createBase: (apiClient: ApiClient, data: Partial<Base>) => Promise<Base>;
  updateBase: (apiClient: ApiClient, id: string, data: Partial<Base>) => Promise<void>;
  deleteBase: (apiClient: ApiClient, id: string) => Promise<void>;
  
  // Table 操作
  setCurrentTable: (table: Table | null) => void;
  loadTables: (apiClient: ApiClient, baseId: string) => Promise<void>;
  createTable: (apiClient: ApiClient, baseId: string, data: Partial<Table>) => Promise<Table>;
  updateTable: (apiClient: ApiClient, id: string, data: Partial<Table>) => Promise<void>;
  deleteTable: (apiClient: ApiClient, id: string) => Promise<void>;
  
  // Field 操作
  loadFields: (apiClient: ApiClient, tableId: string) => Promise<void>;
  createField: (apiClient: ApiClient, tableId: string, data: Partial<Field>) => Promise<Field>;
  updateField: (apiClient: ApiClient, id: string, data: Partial<Field>) => Promise<void>;
  deleteField: (apiClient: ApiClient, id: string) => Promise<void>;
  
  // Record 操作
  loadRecords: (apiClient: ApiClient, tableId: string) => Promise<void>;
  createRecord: (apiClient: ApiClient, tableId: string, data: Partial<Record>) => Promise<Record>;
  updateRecord: (apiClient: ApiClient, id: string, data: Partial<Record>) => Promise<void>;
  deleteRecord: (apiClient: ApiClient, id: string) => Promise<void>;
  bulkUpdateRecords: (apiClient: ApiClient, updates: Array<{ id: string; data: Partial<Record> }>) => Promise<void>;
  
  // View 操作
  setCurrentView: (view: View | null) => void;
  loadViews: (apiClient: ApiClient, tableId: string) => Promise<void>;
  createView: (apiClient: ApiClient, tableId: string, data: Partial<View>) => Promise<View>;
  updateView: (apiClient: ApiClient, id: string, data: Partial<View>) => Promise<void>;
  deleteView: (apiClient: ApiClient, id: string) => Promise<void>;
  
  // 错误处理
  setError: (error: Error | null) => void;
  clearError: () => void;
}

interface UIActions {
  // 滚动
  setScroll: (scrollTop: number, scrollLeft: number) => void;
  
  // 鼠标
  setMousePosition: (position: { x: number; y: number } | null) => void;
  setHoveredCell: (cell: { rowIndex: number; columnIndex: number } | null) => void;
  
  // 拖拽
  startDrag: (target: 'row' | 'column' | 'cell', position: { x: number; y: number }) => void;
  endDrag: () => void;
  
  // 对话框
  openDialog: (dialogId: string) => void;
  closeDialog: (dialogId: string) => void;
  
  // 主题
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

interface SelectionActions {
  // 选择
  setSelectedRanges: (ranges: SelectionSlice['selectedRanges']) => void;
  addSelectedRange: (range: SelectionSlice['selectedRanges'][0]) => void;
  clearSelection: () => void;
  
  // 活动单元格
  setActiveCell: (cell: { rowIndex: number; columnIndex: number } | null) => void;
  
  // 多选
  setMultiSelect: (enabled: boolean) => void;
}

interface EditingActions {
  // 编辑
  startEditing: (cell: { rowIndex: number; columnIndex: number }, initialValue: unknown) => void;
  updateEditingValue: (value: unknown) => void;
  commitEdit: () => void;
  cancelEdit: () => void;
  
  // 历史
  undo: () => void;
  redo: () => void;
}

interface PermissionActions {
  setPermissions: (permissions: Permission) => void;
  loadPermissions: (apiClient: ApiClient, baseId: string, tableId?: string) => Promise<void>;
}

interface SessionActions {
  setSession: (session: Session) => void;
  clearSession: () => void;
}

// ============= 完整 Store 类型 =============

export type GridStore = 
  & DataSlice
  & UISlice
  & SelectionSlice
  & EditingSlice
  & PermissionSlice
  & SessionSlice
  & DataActions
  & UIActions
  & SelectionActions
  & EditingActions
  & PermissionActions
  & SessionActions;

// ============= Store 创建 =============

export const useGridStore = create<GridStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // ===== 初始状态 =====
        
        // Data Slice
        currentBase: null,
        currentTable: null,
        currentView: null,
        bases: new Map(),
        tables: new Map(),
        fields: new Map(),
        records: new Map(),
        views: new Map(),
        isLoadingBases: false,
        isLoadingTables: false,
        isLoadingFields: false,
        isLoadingRecords: false,
        isLoadingViews: false,
        error: null,
        
        // UI Slice
        scrollTop: 0,
        scrollLeft: 0,
        mousePosition: null,
        hoveredCell: null,
        isDragging: false,
        dragTarget: null,
        dragStartPosition: null,
        openDialogs: new Set(),
        theme: 'light',
        
        // Selection Slice
        selectedRanges: [],
        activeCell: null,
        isMultiSelect: false,
        
        // Editing Slice
        isEditing: false,
        editingCell: null,
        editingValue: undefined,
        canUndo: false,
        canRedo: false,
        
        // Permission Slice
        permissions: {
          canRead: true,
          canWrite: false,
          canDelete: false,
          canManageFields: false,
          canManageViews: false,
          canManagePermissions: false,
        },
        
        // Session Slice
        session: {},
        
        // ===== Data Actions =====
        
        setCurrentBase: (base) => {
          set((state) => {
            state.currentBase = base;
          });
        },
        
        loadBases: async (apiClient) => {
          set((state) => {
            state.isLoadingBases = true;
            state.error = null;
          });
          
          try {
            // @ts-expect-error - ApiClient方法调用，暂时忽略类型问题
            const response = await apiClient.getBases();
            set((state) => {
              state.bases = new Map(response.map((base: any) => [base.id, base]));
              state.isLoadingBases = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.isLoadingBases = false;
            });
            throw error;
          }
        },
        
        createBase: async (apiClient, data) => {
          try {
            const newBase = await apiClient.createBase(data);
            set((state) => {
              state.bases.set(newBase.id, newBase);
            });
            return newBase;
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        updateBase: async (apiClient, id, data) => {
          try {
            const updatedBase = await apiClient.updateBase(id, data);
            set((state) => {
              state.bases.set(id, updatedBase);
              if (state.currentBase?.id === id) {
                state.currentBase = updatedBase;
              }
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        deleteBase: async (apiClient, id) => {
          try {
            await apiClient.deleteBase(id);
            set((state) => {
              state.bases.delete(id);
              if (state.currentBase?.id === id) {
                state.currentBase = null;
              }
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        setCurrentTable: (table) => {
          set((state) => {
            state.currentTable = table;
          });
        },
        
        loadTables: async (apiClient, baseId) => {
          set((state) => {
            state.isLoadingTables = true;
            state.error = null;
          });
          
          try {
            const response = await apiClient.getTables(baseId);
            set((state) => {
              state.tables = new Map(response.map(table => [table.id, table]));
              state.isLoadingTables = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.isLoadingTables = false;
            });
            throw error;
          }
        },
        
        createTable: async (apiClient, baseId, data) => {
          try {
            const newTable = await apiClient.createTable(baseId, data);
            set((state) => {
              state.tables.set(newTable.id, newTable);
            });
            return newTable;
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        updateTable: async (apiClient, id, data) => {
          try {
            const updatedTable = await apiClient.updateTable(id, data);
            set((state) => {
              state.tables.set(id, updatedTable);
              if (state.currentTable?.id === id) {
                state.currentTable = updatedTable;
              }
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        deleteTable: async (apiClient, id) => {
          try {
            await apiClient.deleteTable(id);
            set((state) => {
              state.tables.delete(id);
              if (state.currentTable?.id === id) {
                state.currentTable = null;
              }
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        loadFields: async (apiClient, tableId) => {
          set((state) => {
            state.isLoadingFields = true;
            state.error = null;
          });
          
          try {
            const response = await apiClient.getFields(tableId);
            set((state) => {
              state.fields = new Map(response.map(field => [field.id, field]));
              state.isLoadingFields = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.isLoadingFields = false;
            });
            throw error;
          }
        },
        
        createField: async (apiClient, tableId, data) => {
          try {
            const newField = await apiClient.createField(tableId, data);
            set((state) => {
              state.fields.set(newField.id, newField);
            });
            return newField;
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        updateField: async (apiClient, id, data) => {
          try {
            const updatedField = await apiClient.updateField(id, data);
            set((state) => {
              state.fields.set(id, updatedField);
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        deleteField: async (apiClient, id) => {
          try {
            await apiClient.deleteField(id);
            set((state) => {
              state.fields.delete(id);
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        loadRecords: async (apiClient, tableId) => {
          set((state) => {
            state.isLoadingRecords = true;
            state.error = null;
          });
          
          try {
            const response = await apiClient.getRecords(tableId);
            set((state) => {
              state.records = new Map(response.map(record => [record.id, record]));
              state.isLoadingRecords = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.isLoadingRecords = false;
            });
            throw error;
          }
        },
        
        createRecord: async (apiClient, tableId, data) => {
          try {
            const newRecord = await apiClient.createRecord(tableId, data);
            set((state) => {
              state.records.set(newRecord.id, newRecord);
            });
            return newRecord;
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        updateRecord: async (apiClient, id, data) => {
          try {
            const updatedRecord = await apiClient.updateRecord(id, data);
            set((state) => {
              state.records.set(id, updatedRecord);
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        deleteRecord: async (apiClient, id) => {
          try {
            await apiClient.deleteRecord(id);
            set((state) => {
              state.records.delete(id);
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        bulkUpdateRecords: async (apiClient, updates) => {
          try {
            await Promise.all(
              updates.map(({ id, data }) => apiClient.updateRecord(id, data))
            );
            set((state) => {
              updates.forEach(({ id, data }) => {
                const existing = state.records.get(id);
                if (existing) {
                  state.records.set(id, { ...existing, ...data });
                }
              });
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        setCurrentView: (view) => {
          set((state) => {
            state.currentView = view;
          });
        },
        
        loadViews: async (apiClient, tableId) => {
          set((state) => {
            state.isLoadingViews = true;
            state.error = null;
          });
          
          try {
            const response = await apiClient.getViews(tableId);
            set((state) => {
              state.views = new Map(response.map(view => [view.id, view]));
              state.isLoadingViews = false;
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
              state.isLoadingViews = false;
            });
            throw error;
          }
        },
        
        createView: async (apiClient, tableId, data) => {
          try {
            const newView = await apiClient.createView(tableId, data);
            set((state) => {
              state.views.set(newView.id, newView);
            });
            return newView;
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        updateView: async (apiClient, id, data) => {
          try {
            const updatedView = await apiClient.updateView(id, data);
            set((state) => {
              state.views.set(id, updatedView);
              if (state.currentView?.id === id) {
                state.currentView = updatedView;
              }
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        deleteView: async (apiClient, id) => {
          try {
            await apiClient.deleteView(id);
            set((state) => {
              state.views.delete(id);
              if (state.currentView?.id === id) {
                state.currentView = null;
              }
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        setError: (error) => {
          set((state) => {
            state.error = error;
          });
        },
        
        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },
        
        // ===== UI Actions =====
        
        setScroll: (scrollTop, scrollLeft) => {
          set((state) => {
            state.scrollTop = scrollTop;
            state.scrollLeft = scrollLeft;
          });
        },
        
        setMousePosition: (position) => {
          set((state) => {
            state.mousePosition = position;
          });
        },
        
        setHoveredCell: (cell) => {
          set((state) => {
            state.hoveredCell = cell;
          });
        },
        
        startDrag: (target, position) => {
          set((state) => {
            state.isDragging = true;
            state.dragTarget = target;
            state.dragStartPosition = position;
          });
        },
        
        endDrag: () => {
          set((state) => {
            state.isDragging = false;
            state.dragTarget = null;
            state.dragStartPosition = null;
          });
        },
        
        openDialog: (dialogId) => {
          set((state) => {
            state.openDialogs.add(dialogId);
          });
        },
        
        closeDialog: (dialogId) => {
          set((state) => {
            state.openDialogs.delete(dialogId);
          });
        },
        
        setTheme: (theme) => {
          set((state) => {
            state.theme = theme;
          });
        },
        
        // ===== Selection Actions =====
        
        setSelectedRanges: (ranges) => {
          set((state) => {
            state.selectedRanges = ranges;
          });
        },
        
        addSelectedRange: (range) => {
          set((state) => {
            state.selectedRanges.push(range);
          });
        },
        
        clearSelection: () => {
          set((state) => {
            state.selectedRanges = [];
            state.activeCell = null;
          });
        },
        
        setActiveCell: (cell) => {
          set((state) => {
            state.activeCell = cell;
          });
        },
        
        setMultiSelect: (enabled) => {
          set((state) => {
            state.isMultiSelect = enabled;
          });
        },
        
        // ===== Editing Actions =====
        
        startEditing: (cell, initialValue) => {
          set((state) => {
            state.isEditing = true;
            state.editingCell = cell;
            state.editingValue = initialValue;
          });
        },
        
        updateEditingValue: (value) => {
          set((state) => {
            state.editingValue = value;
          });
        },
        
        commitEdit: () => {
          set((state) => {
            state.isEditing = false;
            state.editingCell = null;
            state.editingValue = undefined;
          });
        },
        
        cancelEdit: () => {
          set((state) => {
            state.isEditing = false;
            state.editingCell = null;
            state.editingValue = undefined;
          });
        },
        
        undo: () => {
          // TODO: 实现撤销逻辑
        },
        
        redo: () => {
          // TODO: 实现重做逻辑
        },
        
        // ===== Permission Actions =====
        
        setPermissions: (permissions) => {
          set((state) => {
            state.permissions = permissions;
          });
        },
        
        loadPermissions: async (apiClient, baseId, tableId) => {
          try {
            const permissions = await apiClient.permissions.get(baseId, tableId);
            set((state) => {
              state.permissions = permissions;
            });
          } catch (error) {
            set((state) => {
              state.error = error as Error;
            });
            throw error;
          }
        },
        
        // ===== Session Actions =====
        
        setSession: (session) => {
          set((state) => {
            state.session = session;
          });
        },
        
        clearSession: () => {
          set((state) => {
            state.session = {};
          });
        },
      })),
      {
        name: 'grid-store',
        partialize: (state) => ({
          // 只持久化必要的状态
          theme: state.theme,
          session: state.session,
        }),
      }
    ),
    {
      name: 'GridStore',
    }
  )
);

// ============= 选择器 (Selectors) =============

// 这些选择器帮助组件精确订阅需要的状态，避免无脑重渲染

export const selectCurrentBase = (state: GridStore): Base | null => state.currentBase;
export const selectCurrentTable = (state: GridStore): Table | null => state.currentTable;
export const selectCurrentView = (state: GridStore): View | null => state.currentView;

export const selectBases = (state: GridStore): Base[] => Array.from(state.bases.values());
export const selectTables = (state: GridStore): Table[] => Array.from(state.tables.values());
export const selectFields = (state: GridStore): Field[] => Array.from(state.fields.values());
export const selectRecords = (state: GridStore): GridRecord[] => Array.from(state.records.values());
export const selectViews = (state: GridStore): View[] => Array.from(state.views.values());

export const selectIsLoading = (state: GridStore): boolean => 
  state.isLoadingBases || 
  state.isLoadingTables || 
  state.isLoadingFields || 
  state.isLoadingRecords || 
  state.isLoadingViews;

export const selectError = (state: GridStore): Error | null => state.error;

export const selectScrollState = (state: GridStore): { scrollTop: number; scrollLeft: number } => ({
  scrollTop: state.scrollTop,
  scrollLeft: state.scrollLeft,
});

export const selectSelection = (state: GridStore): SelectionSlice => ({
  selectedRanges: state.selectedRanges,
  activeCell: state.activeCell,
  isMultiSelect: state.isMultiSelect,
});

export const selectEditing = (state: GridStore): EditingSlice => ({
  isEditing: state.isEditing,
  editingCell: state.editingCell,
  editingValue: state.editingValue,
  canUndo: state.canUndo,
  canRedo: state.canRedo,
});

export const selectPermissions = (state: GridStore): Permission => state.permissions;
export const selectSession = (state: GridStore): Session => state.session;
