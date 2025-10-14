import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiClient } from '@/hooks/useApiClient';
import type { IPermission, IUpdatePermissionRo } from '@/api/types';

type PermissionLevel = 'owner' | 'editor' | 'commenter' | 'viewer' | 'none';
type PermissionAction = 'create' | 'read' | 'update' | 'delete';
type PermissionResource = 'base' | 'table' | 'field' | 'record' | 'view' | 'comment';

interface IPermissionContext {
  permissions: IPermission[];
  isLoading: boolean;
  hasPermission: (resource: PermissionResource, action: PermissionAction) => boolean;
  canCreateField: () => boolean;
  canEditField: (fieldId: string) => boolean;
  canDeleteField: (fieldId: string) => boolean;
  canCreateRecord: () => boolean;
  canEditRecord: (recordId: string) => boolean;
  canDeleteRecord: (recordId: string) => boolean;
  canEditCell: (recordId: string, fieldId: string) => boolean;
  canCreateView: () => boolean;
  canEditView: (viewId: string) => boolean;
  canDeleteView: (viewId: string) => boolean;
  canComment: () => boolean;
  updatePermission: (userId: string, data: IUpdatePermissionRo) => Promise<void>;
  getCurrentUserRole: () => PermissionLevel;
}

const PermissionContext = createContext<IPermissionContext | null>(null);

export function PermissionProvider({ 
  baseId,
  tableId,
  userId,
  children 
}: { 
  baseId: string;
  tableId?: string;
  userId?: string;
  children: ReactNode;
}) {
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  // 获取权限列表
  const { data: permissions = [], isLoading } = useQuery({
    queryKey: ['permissions', baseId, tableId],
    queryFn: () => apiClient.getPermissions(baseId, tableId),
    enabled: !!baseId,
  });

  // 获取当前用户的权限
  const currentUserPermission = useMemo(() => {
    if (!userId) return null;
    return permissions.find(p => p.principalId === userId);
  }, [permissions, userId]);

  const getCurrentUserRole = (): PermissionLevel => {
    return (currentUserPermission?.role as PermissionLevel) || 'none';
  };

  // 通用权限检查
  const hasPermission = (resource: PermissionResource, action: PermissionAction): boolean => {
    const role = getCurrentUserRole();
    
    // Owner 拥有所有权限
    if (role === 'owner') return true;
    
    // Editor 可以创建、读取、更新
    if (role === 'editor') {
      if (action === 'delete') return false;
      return true;
    }
    
    // Commenter 可以读取和评论
    if (role === 'commenter') {
      return action === 'read' || (resource === 'comment' && action === 'create');
    }
    
    // Viewer 只能读取
    if (role === 'viewer') {
      return action === 'read';
    }
    
    return false;
  };

  // 字段权限
  const canCreateField = () => hasPermission('field', 'create');
  const canEditField = (fieldId: string) => {
    // 可以添加字段级别的权限检查
    return hasPermission('field', 'update');
  };
  const canDeleteField = (fieldId: string) => hasPermission('field', 'delete');

  // 记录权限
  const canCreateRecord = () => hasPermission('record', 'create');
  const canEditRecord = (recordId: string) => hasPermission('record', 'update');
  const canDeleteRecord = (recordId: string) => hasPermission('record', 'delete');

  // 单元格权限
  const canEditCell = (recordId: string, fieldId: string) => {
    // 检查记录和字段的编辑权限
    return canEditRecord(recordId) && canEditField(fieldId);
  };

  // 视图权限
  const canCreateView = () => hasPermission('view', 'create');
  const canEditView = (viewId: string) => hasPermission('view', 'update');
  const canDeleteView = (viewId: string) => hasPermission('view', 'delete');

  // 评论权限
  const canComment = () => hasPermission('comment', 'create');

  // 更新权限
  const updateMutation = useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: IUpdatePermissionRo }) => 
      apiClient.updatePermission(baseId, userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', baseId] });
    },
  });

  return (
    <PermissionContext.Provider value={{
      permissions,
      isLoading,
      hasPermission,
      canCreateField,
      canEditField,
      canDeleteField,
      canCreateRecord,
      canEditRecord,
      canDeleteRecord,
      canEditCell,
      canCreateView,
      canEditView,
      canDeleteView,
      canComment,
      updatePermission: (userId, data) => updateMutation.mutateAsync({ userId, data }),
      getCurrentUserRole,
    }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const context = useContext(PermissionContext);
  if (!context) throw new Error('usePermission must be used within PermissionProvider');
  return context;
}


