/**
 * Realtime Fields Hook
 * 实时字段同步Hook
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConnection } from '@/context/connection/ConnectionContext';

export interface IUseRealtimeFieldsOptions {
  tableId: string;
  enabled?: boolean;
}

/**
 * 监听字段结构实时变化并自动更新React Query缓存
 */
export function useRealtimeFields({
  tableId,
  enabled = true,
}: IUseRealtimeFieldsOptions) {
  const { shareConnection, isConnected } = useConnection();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !isConnected || !shareConnection) {
      return;
    }

    const docPath = `tables.${tableId}.fields`;
    let doc: any;

    const subscribe = async () => {
      try {
        // 订阅字段文档
        doc = await shareConnection.subscribe(docPath);

        // 监听操作
        doc.on('op', (op: any[], source: boolean) => {
          if (!source) {
            // 来自其他客户端的操作
            console.log('[useRealtimeFields] Received remote operation:', op);

            // 更新字段缓存
            queryClient.invalidateQueries({
              queryKey: ['fields', tableId],
            });

            // 同时更新表信息缓存（因为字段是表的一部分）
            queryClient.invalidateQueries({
              queryKey: ['table', tableId],
            });
          }
        });

        // 监听字段添加
        doc.on('create', () => {
          console.log('[useRealtimeFields] Field document created');
          queryClient.invalidateQueries({
            queryKey: ['fields', tableId],
          });
        });

        // 监听字段删除
        doc.on('del', () => {
          console.log('[useRealtimeFields] Field document deleted');
          queryClient.invalidateQueries({
            queryKey: ['fields', tableId],
          });
        });

        console.log('[useRealtimeFields] Subscribed to', docPath);
      } catch (error) {
        console.error('[useRealtimeFields] Failed to subscribe:', error);
      }
    };

    subscribe();

    return () => {
      if (doc) {
        doc.destroy();
        console.log('[useRealtimeFields] Unsubscribed from', docPath);
      }
    };
  }, [tableId, enabled, isConnected, shareConnection, queryClient]);
}

