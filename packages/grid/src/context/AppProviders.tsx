import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { SessionProvider } from './session/SessionContext';
import { AppProvider } from './app/AppContext';
// import { ConnectionProvider } from './connection/ConnectionContext'; // 依赖已删除的 lib
// import { HistoryProvider } from './history/HistoryContext'; // 依赖已删除的 lib
import { BaseProvider } from './base/BaseContext';
import { TableProvider } from './table/TableContext';
import { FieldProvider } from './field/FieldContext';
import { ViewProvider } from './view/ViewContext';
import { PermissionProvider } from './permission/PermissionContext';
import { ApiClient } from '../api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

export function AppProviders({
  baseId,
  tableId,
  viewId,
  wsUrl,
  userId,
  apiClient,
  children
}: {
  baseId?: string;
  tableId?: string;
  viewId?: string;
  wsUrl?: string;
  userId?: string;
  apiClient: ApiClient;
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AppProvider>
          {/* <HistoryProvider> - 依赖已删除的 lib */}
            {/* <ConnectionProvider wsUrl={wsUrl} autoConnect={!!wsUrl}> - 依赖已删除的 lib */}
              {baseId ? (
                <BaseProvider baseId={baseId} apiClient={apiClient}>
                  <PermissionProvider baseId={baseId} tableId={tableId} apiClient={apiClient}>
                    {tableId ? (
                      <TableProvider baseId={baseId} tableId={tableId} apiClient={apiClient}>
                        <ViewProvider tableId={tableId} viewId={viewId} apiClient={apiClient}>
                          <FieldProvider tableId={tableId} apiClient={apiClient}>
                            {children}
                          </FieldProvider>
                        </ViewProvider>
                      </TableProvider>
                    ) : (
                      children
                    )}
                  </PermissionProvider>
                </BaseProvider>
              ) : (
                children
              )}
            {/* </ConnectionProvider> */}
          {/* </HistoryProvider> */}
        </AppProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}
