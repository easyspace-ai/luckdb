import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/hooks/useApiClient';
import { RecordModel } from '@/model/record/Record';
import type { IRecord, ICreateRecordRo, IUpdateRecordRo } from '@/api/types';

interface IRecordContext {
  records: RecordModel[];
  totalCount: number;
  isLoading: boolean;
  hasMore: boolean;
  fetchMore: () => void;
  getRecord: (id: string) => RecordModel | undefined;
  createRecord: (data: ICreateRecordRo) => Promise<RecordModel>;
  updateRecord: (id: string, fieldId: string, value: unknown) => Promise<RecordModel>;
  deleteRecord: (id: string) => Promise<void>;
  batchUpdateRecords: (updates: IUpdateRecordRo[]) => Promise<void>;
}

const RecordContext = createContext<IRecordContext | null>(null);

export function RecordProvider({ 
  tableId,
  viewId,
  children 
}: { 
  tableId: string;
  viewId?: string;
  children: ReactNode;
}) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  // 无限滚动查询
  const {
    data,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ['records', tableId, viewId],
    queryFn: ({ pageParam = 0 }) => 
      apiClient.getRecords(tableId, { viewId, skip: pageParam, take: 100 }),
    getNextPageParam: (lastPage, pages) => {
      const totalFetched = pages.reduce((sum, page) => sum + (page.data?.length || 0), 0);
      return totalFetched < (lastPage.total || 0) ? totalFetched : undefined;
    },
    enabled: !!tableId,
    initialPageParam: 0,
  });

  // 转换为 RecordModel 实例
  const records = useMemo(() => {
    const allRecords = data?.pages.flatMap(page => page.data || []) || [];
    return allRecords.map(record => new RecordModel(record));
  }, [data]);

  const totalCount = data?.pages[0]?.total || 0;

  const getRecord = (id: string) => records.find(r => r.id === id);

  // 创建记录
  const createMutation = useMutation({
    mutationFn: (data: ICreateRecordRo) => apiClient.createRecord(tableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', tableId] });
    },
  });

  // 乐观更新记录
  const updateMutation = useMutation({
    mutationFn: ({ id, fieldId, value }: { id: string; fieldId: string; value: unknown }) =>
      apiClient.updateRecord(tableId, id, fieldId, value),
    onMutate: async ({ id, fieldId, value }) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['records', tableId] });
      const previous = queryClient.getQueryData(['records', tableId]);
      
      // 乐观更新
      queryClient.setQueryData(['records', tableId], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data?.map((record: IRecord) =>
              record.id === id
                ? { ...record, fields: { ...record.fields, [fieldId]: value } }
                : record
            ),
          })),
        };
      });

      return { previous };
    },
    onError: (err, variables, context) => {
      // 回滚
      if (context?.previous) {
        queryClient.setQueryData(['records', tableId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['records', tableId] });
    },
  });

  // 删除记录
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteRecord(tableId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', tableId] });
    },
  });

  // 批量更新
  const batchUpdateMutation = useMutation({
    mutationFn: (updates: IUpdateRecordRo[]) => apiClient.batchUpdateRecords(tableId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records', tableId] });
    },
  });

  return (
    <RecordContext.Provider value={{
      records,
      totalCount,
      isLoading,
      hasMore: hasNextPage || false,
      fetchMore: fetchNextPage,
      getRecord,
      createRecord: async (data) => {
        const result = await createMutation.mutateAsync(data);
        return new RecordModel(result);
      },
      updateRecord: async (id, fieldId, value) => {
        const result = await updateMutation.mutateAsync({ id, fieldId, value });
        return new RecordModel(result);
      },
      deleteRecord: deleteMutation.mutateAsync,
      batchUpdateRecords: async (updates: IUpdateRecordRo[]) => {
        await batchUpdateMutation.mutateAsync(updates);
      },
    }}>
      {children}
    </RecordContext.Provider>
  );
}

export function useRecord() {
  const context = useContext(RecordContext);
  if (!context) {
    throw new Error('useRecord must be used within RecordProvider');
  }
  return context;
}

