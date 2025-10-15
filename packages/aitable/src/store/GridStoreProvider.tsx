/**
 * Grid Store Provider
 * 
 * 替换 7 层 Context 嵌套为单一的 Provider
 * 
 * Before:
 * <SessionProvider>
 *   <AppProvider>
 *     <BaseProvider>
 *       <PermissionProvider>
 *         <TableProvider>
 *           <ViewProvider>
 *             <FieldProvider>
 *               {children}
 *             </FieldProvider>
 *           </ViewProvider>
 *         </TableProvider>
 *       </PermissionProvider>
 *     </BaseProvider>
 *   </AppProvider>
 * </SessionProvider>
 * 
 * After:
 * <GridStoreProvider>
 *   {children}
 * </GridStoreProvider>
 */

import React, { ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGridStore } from './grid-store';
import type { ApiClient } from '../api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分钟
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

interface GridStoreProviderProps {
  children: ReactNode;
  apiClient: ApiClient;
  baseId?: string;
  tableId?: string;
  viewId?: string;
  userId?: string;
  autoLoad?: boolean;
}

/**
 * Grid Store Provider 组件
 * 
 * 提供：
 * - 统一的状态管理
 * - API 客户端注入
 * - 自动数据加载
 * - React Query 集成
 */
export function GridStoreProvider({
  children,
  apiClient,
  baseId,
  tableId,
  viewId,
  userId,
  autoLoad = true,
}: GridStoreProviderProps): JSX.Element {
  const loadBases = useGridStore(state => state.loadBases);
  const loadTables = useGridStore(state => state.loadTables);
  const loadFields = useGridStore(state => state.loadFields);
  const loadRecords = useGridStore(state => state.loadRecords);
  const loadViews = useGridStore(state => state.loadViews);
  const loadPermissions = useGridStore(state => state.loadPermissions);
  
  const setCurrentBase = useGridStore(state => state.setCurrentBase);
  const setCurrentTable = useGridStore(state => state.setCurrentTable);
  const setCurrentView = useGridStore(state => state.setCurrentView);
  const setSession = useGridStore(state => state.setSession);
  
  const bases = useGridStore(state => state.bases);
  const tables = useGridStore(state => state.tables);
  const views = useGridStore(state => state.views);

  // 自动加载数据
  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    const loadData = async (): Promise<void> => {
      try {
        // 1. 加载 bases
        await loadBases(apiClient);
        
        // 2. 如果指定了 baseId，设置当前 base 并加载 tables
        if (baseId) {
          const base = bases.get(baseId);
          if (base) {
            setCurrentBase(base);
            await loadTables(apiClient, baseId);
            await loadPermissions(apiClient, baseId);
            
            // 3. 如果指定了 tableId，设置当前 table 并加载 fields、records、views
            if (tableId) {
              const table = tables.get(tableId);
              if (table) {
                setCurrentTable(table);
                await Promise.all([
                  loadFields(apiClient, tableId),
                  loadRecords(apiClient, tableId),
                  loadViews(apiClient, tableId),
                ]);
                
                // 4. 如果指定了 viewId，设置当前 view
                if (viewId) {
                  const view = views.get(viewId);
                  if (view) {
                    setCurrentView(view);
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    void loadData();
  }, [
    autoLoad,
    apiClient,
    baseId,
    tableId,
    viewId,
    loadBases,
    loadTables,
    loadFields,
    loadRecords,
    loadViews,
    loadPermissions,
    setCurrentBase,
    setCurrentTable,
    setCurrentView,
    bases,
    tables,
    views,
  ]);

  // 设置用户 session
  useEffect(() => {
    if (userId) {
      setSession({ userId });
    }
  }, [userId, setSession]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// 导出简化的 API
export default GridStoreProvider;
