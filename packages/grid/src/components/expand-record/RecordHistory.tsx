/**
 * Record History Component
 * 记录历史查看器
 */

import { FC, useEffect, useState } from 'react';
import { OperationHistory, type IHistoryEntry } from '@/lib/operation-history';

export interface IRecordHistoryProps {
  recordId: string;
}

export const RecordHistory: FC<IRecordHistoryProps> = ({ recordId }) => {
  const [history, setHistory] = useState<IHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟加载历史记录
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        // TODO: 从实际历史系统加载
        // 这里使用模拟数据
        const mockHistory: IHistoryEntry[] = [
          {
            id: '1',
            operation: {
              type: 'replace',
              path: ['fields', 'name'],
              value: '新值',
              oldValue: '旧值',
            },
            timestamp: Date.now() - 3600000,
            userId: 'user1',
            userName: '张三',
            description: '更新了 "姓名" 字段',
            recordId,
            fieldId: 'name',
          },
          {
            id: '2',
            operation: {
              type: 'replace',
              path: ['fields', 'status'],
              value: '已完成',
              oldValue: '进行中',
            },
            timestamp: Date.now() - 7200000,
            userId: 'user2',
            userName: '李四',
            description: '更新了 "状态" 字段',
            recordId,
            fieldId: 'status',
          },
        ];

        setHistory(mockHistory);
      } catch (error) {
        console.error('Failed to load history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [recordId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">加载历史记录...</div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">暂无历史记录</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map(entry => (
        <div key={entry.id} className="border-l-2 border-blue-500 pl-4 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-medium">{entry.description}</div>
              <div className="text-sm text-gray-500 mt-1">
                {entry.userName} · {formatTimestamp(entry.timestamp)}
              </div>
            </div>
          </div>
          
          {entry.operation.type === 'replace' && (
            <div className="mt-2 text-sm">
              <div className="flex gap-4">
                <div>
                  <span className="text-gray-500">旧值:</span>{' '}
                  <span className="line-through text-red-600">
                    {String(entry.operation.oldValue || '(空)')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">新值:</span>{' '}
                  <span className="text-green-600">
                    {String(entry.operation.value || '(空)')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;

  return new Date(timestamp).toLocaleString('zh-CN');
}

