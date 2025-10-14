import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { SessionProvider } from './session/SessionContext';
import { AppProvider } from './app/AppContext';
import { ConnectionProvider } from './connection/ConnectionContext';
import { BaseProvider } from './base/BaseContext';
import { TableProvider } from './table/TableContext';
import { FieldProvider } from './field/FieldContext';
import { RecordProvider } from './record/RecordContext';
import { ViewProvider } from './view/ViewContext';
import { PermissionProvider } from './permission/PermissionContext';
import { HistoryProvider } from './history/HistoryContext';

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
  children
}: {
  baseId?: string;
  tableId?: string;
  viewId?: string;
  wsUrl?: string;
  userId?: string;
  children: ReactNode;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AppProvider>
          <HistoryProvider>
            <ConnectionProvider wsUrl={wsUrl} autoConnect={!!wsUrl}>
              {baseId ? (
                <BaseProvider baseId={baseId}>
                  <PermissionProvider baseId={baseId} tableId={tableId} userId={userId}>
                    {tableId ? (
                      <TableProvider baseId={baseId} tableId={tableId}>
                        <ViewProvider tableId={tableId} viewId={viewId}>
                          <FieldProvider tableId={tableId}>
                            <RecordProvider tableId={tableId} viewId={viewId}>
                              {children}
                            </RecordProvider>
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
            </ConnectionProvider>
          </HistoryProvider>
        </AppProvider>
      </SessionProvider>
    </QueryClientProvider>
  );
}

