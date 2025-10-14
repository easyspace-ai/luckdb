/**
 * Realtime Records Hook
 * 实时记录同步Hook
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConnection } from '@/context/connection/ConnectionContext';

export interface IUseRealtimeRecordsOptions {
  tableId: string;
  viewId?: string;
  enabled?: boolean;
}

/**
 * 监听记录实时变化并自动更新React Query缓存
 */
export function useRealtimeRecords({
  tableId,
  viewId,
  enabled = true,
}: IUseRealtimeRecordsOptions) {
  const { shareConnection, isConnected } = useConnection();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !isConnected || !shareConnection) {
      return;
    }

    const docPath = `tables.${tableId}.records`;
    let doc: any;

    const subscribe = async () => {
      try {
        // 订阅记录文档
        doc = await shareConnection.subscribe(docPath);

        // 监听操作
        doc.on('op', (op: any[], source: boolean) => {
          if (!source) {
            // 来自其他客户端的操作，更新缓存
            console.log('[useRealtimeRecords] Received remote operation:', op);

            // 使记录查询缓存失效，触发重新获取
            queryClient.invalidateQueries({
              queryKey: ['records', tableId],
            });

            if (viewId) {
              queryClient.invalidateQueries({
                queryKey: ['records', tableId, viewId],
              });
            }
          }
        });

        // 监听创建
        doc.on('create', () => {
          console.log('[useRealtimeRecords] Document created');
          queryClient.invalidateQueries({
            queryKey: ['records', tableId],
          });
        });

        // 监听删除
        doc.on('del', () => {
          console.log('[useRealtimeRecords] Document deleted');
          queryClient.invalidateQueries({
            queryKey: ['records', tableId],
          });
        });

        console.log('[useRealtimeRecords] Subscribed to', docPath);
      } catch (error) {
        console.error('[useRealtimeRecords] Failed to subscribe:', error);
      }
    };

    subscribe();

    return () => {
      if (doc) {
        doc.destroy();
        console.log('[useRealtimeRecords] Unsubscribed from', docPath);
      }
    };
  }, [tableId, viewId, enabled, isConnected, shareConnection, queryClient]);
}

