import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/hooks/useApiClient';
import { View } from '@/model/view/View';
import type { IView, ICreateViewRo, IUpdateViewRo } from '@/api/types';

interface IViewContext {
  views: View[];
  currentView: View | null;
  isLoading: boolean;
  switchView: (viewId: string) => void;
  createView: (data: ICreateViewRo) => Promise<View>;
  updateView: (id: string, data: IUpdateViewRo) => Promise<View>;
  deleteView: (id: string) => Promise<void>;
  duplicateView: (id: string, name: string) => Promise<View>;
  getView: (id: string) => View | undefined;
}

const ViewContext = createContext<IViewContext | null>(null);

export function ViewProvider({ 
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

  // 获取视图列表
  const { data: rawViews = [], isLoading } = useQuery({
    queryKey: ['views', tableId],
    queryFn: () => apiClient.getViews(tableId),
    enabled: !!tableId,
  });

  // 转换为 View 实例
  const views = useMemo(() => 
    rawViews.map(view => new View(view)),
    [rawViews]
  );

  // 获取当前视图
  const currentView = useMemo(() => {
    if (!viewId) return views[0] || null;
    return views.find(v => v.id === viewId) || null;
  }, [viewId, views]);

  const getView = (id: string) => views.find(v => v.id === id);

  // 创建视图
  const createMutation = useMutation({
    mutationFn: (data: ICreateViewRo) => apiClient.createView(tableId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['views', tableId] });
    },
  });

  // 更新视图
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: IUpdateViewRo }) => 
      apiClient.updateView(tableId, id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['views', tableId] });
      queryClient.invalidateQueries({ queryKey: ['view', id] });
    },
  });

  // 删除视图
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteView(tableId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['views', tableId] });
    },
  });

  // 复制视图
  const duplicateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => {
      const view = getView(id);
      if (!view) throw new Error('View not found');
      
      return apiClient.createView(tableId, {
        name,
        type: view.type,
        tableId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['views', tableId] });
    },
  });

  const switchView = (id: string) => {
    // 视图切换逻辑，通常由父组件处理路由
    console.log('Switching to view:', id);
  };

  return (
    <ViewContext.Provider value={{
      views,
      currentView,
      isLoading,
      switchView,
      createView: async (data) => {
        const result = await createMutation.mutateAsync(data);
        return new View(result);
      },
      updateView: async (id, data) => {
        const result = await updateMutation.mutateAsync({ id, data });
        return new View(result);
      },
      deleteView: deleteMutation.mutateAsync,
      duplicateView: async (id, name) => {
        const result = await duplicateMutation.mutateAsync({ id, name });
        return new View(result);
      },
      getView,
    }}>
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (!context) throw new Error('useView must be used within ViewProvider');
  return context;
}


