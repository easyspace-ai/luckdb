/**
 * 表格编辑器页面 - 全新设计
 * 
 * 使用 @luckdb/aitable 内置功能，代码简洁优雅
 * 
 * 核心特性：
 * - 使用内置字段映射工具（零配置）
 * - 使用 StandardDataView 的内置功能
 * - 自动处理字段类型转换
 * - 自动处理数据刷新
 * - 最小化代码，最大化功能
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// SDK
import luckdb from '@/lib/luckdb';
import type { Base, Table, View, Field, Record } from '@luckdb/sdk';

// Aitable 组件和工具
import '@luckdb/aitable/dist/index.css';
import { 
  AppProviders,
  StandardDataView,
  createGetCellContent,
  convertFieldsToColumns,
} from '@luckdb/aitable';
import type { IGridProps } from '@luckdb/aitable';

// UI 组件
import { TableEditorLayout } from '@/components/layouts/table-editor-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ViewTabs } from '@/components/views/ViewTabs';
import { useAuthStore } from '@/stores/auth-store';

export default function TableEditor() {
  // ==================== 路由参数 ====================
  const { baseId, tableId, viewId } = useParams<{
    baseId: string;
    tableId?: string;
    viewId?: string;
  }>();
  const navigate = useNavigate();
  
  // ==================== 认证状态 ====================
  const { accessToken, refreshToken, isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    if (accessToken && refreshToken && isAuthenticated) {
      console.log('🔐 Restoring SDK authentication...');
      luckdb.setAccessToken(accessToken);
      luckdb.setRefreshToken(refreshToken);
    }
  }, [accessToken, refreshToken, isAuthenticated]);

  // ==================== 数据状态 ====================
  const [base, setBase] = useState<Base | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [views, setViews] = useState<View[]>([]);
  const [fields, setFields] = useState<Field[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  // ==================== 数据加载 ====================
  const loadData = useCallback(async () => {
    if (!baseId || !tableId || !viewId) return;

    try {
      setLoading(true);

      // 并行加载所有数据
      const [baseData, tableData, viewData, viewsList, fieldsData, recordsResponse] = await Promise.all([
        luckdb.getBase(baseId),
        luckdb.getTable(tableId),
        luckdb.getView(viewId),
        luckdb.listViews({ tableId }),
        luckdb.listFields({ tableId }),
        luckdb.listRecords({ tableId, limit: 100 }),
      ]);

      // 处理 records 数据结构（SDK 可能返回多种格式）
      let recordsData: any[] = [];
      const data: any = recordsResponse.data;
      if (Array.isArray(data)) {
        recordsData = data;
      } else if (data?.list && Array.isArray(data.list)) {
        recordsData = data.list;
      }

      // 更新状态
      setBase(baseData);
      setTable(tableData);
      setView(viewData);
      setViews(viewsList);
      setFields(fieldsData);
      setRecords(recordsData);

      console.log('✅ 数据加载完成:', {
        base: baseData.name,
        table: tableData.name,
        view: viewData.name,
        fieldsCount: fieldsData.length,
        recordsCount: recordsData.length,
      });
    } catch (error: any) {
      console.error('❌ 加载数据失败:', error);
      toast.error(error?.message || '加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [baseId, tableId, viewId]);

  useEffect(() => {
    if (baseId && tableId && viewId) {
      loadData();
    } else if (baseId) {
      // 只有 baseId，重定向到第一个表格
      redirectToFirstTable();
    }
  }, [baseId, tableId, viewId, loadData]);

  // ==================== 重定向到第一个表格 ====================
  const redirectToFirstTable = async () => {
    if (!baseId) return;

    try {
      setLoading(true);
      const baseData = await luckdb.getBase(baseId);
      setBase(baseData);

      const tables = await luckdb.listTables({ baseId });
      if (tables.length === 0) {
        toast.error('该数据库中没有表格');
        return;
      }

      const firstTable = tables[0];
      const views = await luckdb.listViews({ tableId: firstTable.id });
      if (views.length === 0) {
        toast.error('该表格中没有视图');
        return;
      }

      navigate(`/base/${baseId}/${firstTable.id}/${views[0].id}`, { replace: true });
    } catch (error: any) {
      console.error('❌ 重定向失败:', error);
      toast.error(error?.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // ==================== Grid 配置（使用内置映射工具）====================
  
  // 🎉 使用内置工具自动生成列定义和单元格内容
  const columns = useMemo(() => convertFieldsToColumns(fields), [fields]);
  const getCellContent = useMemo(() => createGetCellContent(fields, records), [fields, records]);

  // 单元格编辑
  const handleCellEdited = useCallback(async (cell: any, newCell: any) => {
    const [columnIndex, rowIndex] = cell;
    const field = fields[columnIndex];
    const record = records[rowIndex];
    
    if (!field || !record) return;

    try {
      await luckdb.updateRecord(tableId!, record.id, {
        [field.id]: newCell.data
      });

      // 更新本地状态
      setRecords(prev => 
        prev.map(r => r.id === record.id 
          ? { ...r, data: { ...r.data, [field.id]: newCell.data } }
          : r
        )
      );

      toast.success('更新成功');
    } catch (error: any) {
      console.error('❌ 更新失败:', error);
      toast.error(error?.message || '更新失败');
    }
  }, [fields, records, tableId]);

  // Grid Props
  const gridProps: IGridProps = useMemo(() => ({
    columns,
    rowCount: records.length,
    getCellContent,
    freezeColumnCount: 1,
    rowHeight: 36,
    columnHeaderHeight: 40,
    onCellEdited: handleCellEdited,
    onColumnResize: (column, newSize) => {
      console.log('📏 列宽调整:', column.name, newSize);
    },
    onColumnOrdered: (dragColIndexCollection, dropColIndex) => {
      console.log('🔄 列排序:', dragColIndexCollection, 'Drop at:', dropColIndex);
    },
    // 数据刷新回调
    onDataRefresh: loadData,
  }), [columns, records.length, getCellContent, handleCellEdited, loadData]);

  // ==================== 视图操作 ====================
  
  const handleSelectView = useCallback((vid: string) => {
    if (!baseId || !tableId) return;
    navigate(`/base/${baseId}/${tableId}/${vid}`);
  }, [baseId, tableId, navigate]);

  const handleCreateView = useCallback(async (type: 'grid' | 'kanban') => {
    if (!tableId) return;
    
    try {
      const defaultNameBase = type === 'grid' ? '表格视图' : '看板视图';
      
      // 智能命名：找到下一个可用编号
      const existingViewsOfType = views.filter(v => {
        if (v.type !== type) return false;
        const pattern = new RegExp(`^${defaultNameBase} \\d+$`);
        return pattern.test(v.name);
      });
      
      const existingNumbers = existingViewsOfType
        .map(v => {
          const match = v.name.match(new RegExp(`^${defaultNameBase} (\\d+)$`));
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => num > 0)
        .sort((a, b) => a - b);
      
      let nextIndex = 1;
      for (const num of existingNumbers) {
        if (num === nextIndex) {
          nextIndex++;
        } else {
          break;
        }
      }
      
      const name = `${defaultNameBase} ${nextIndex}`;
      
      const newView = await luckdb.createView({ 
        tableId, 
        name, 
        type,
        description: `自动创建的${defaultNameBase}`
      });
      
      setViews(prev => [...prev, newView]);
      handleSelectView(newView.id);
      toast.success(`已创建${name}并自动切换`);
      
    } catch (e: any) {
      console.error('❌ 创建视图失败:', e);
      toast.error(e?.message || '创建视图失败');
    }
  }, [tableId, views, handleSelectView]);

  const handleRenameView = useCallback(async (vid: string) => {
    try {
      const current = views.find(v => v.id === vid);
      const newName = window.prompt('重命名视图', current?.name || '');
      if (!newName || newName === current?.name) return;
      
      const updated = await luckdb.updateView(vid, { name: newName });
      setViews(prev => prev.map(v => v.id === vid ? updated : v));
      if (view?.id === vid) setView(updated);
      toast.success('重命名成功');
    } catch (e: any) {
      toast.error(e?.message || '重命名失败');
    }
  }, [views, view]);

  const handleDeleteView = useCallback(async (vid: string) => {
    if (views.length <= 1) {
      toast.error('至少保留一个视图');
      return;
    }
    
    try {
      await luckdb.deleteView(vid);
      const remain = views.filter(v => v.id !== vid);
      setViews(remain);
      
      if (view?.id === vid && remain[0] && baseId && tableId) {
        navigate(`/base/${baseId}/${tableId}/${remain[0].id}`);
      }
      
      toast.success('已删除视图');
    } catch (e: any) {
      toast.error(e?.message || '删除失败');
    }
  }, [views, view, baseId, tableId, navigate]);

  // ==================== 视图数据（供 StandardDataView 使用）====================
  const viewsData = useMemo(() => 
    views.map(v => ({
      id: v.id,
      name: v.name,
      type: v.type,
    })), 
    [views]
  );

  // ==================== 字段配置（供 StandardDataView 使用）====================
  const fieldsConfig = useMemo(() => 
    fields.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type as any,
      visible: true,
      required: false,
      isPrimary: f.primary || false,
      description: f.description || '',
      options: f.options || {},
    })),
    [fields]
  );

  // ==================== 渲染 ====================
  
  if (loading) {
    return (
      <TableEditorLayout>
        <div className="h-full flex items-center justify-center p-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </TableEditorLayout>
    );
  }

  if (!base || !table || !view) {
    return (
      <TableEditorLayout>
        <div className="h-full flex items-center justify-center">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {!base && '数据库不存在'}
                {base && !table && '表格不存在'}
                {base && table && !view && '视图不存在'}
              </p>
            </CardContent>
          </Card>
        </div>
      </TableEditorLayout>
    );
  }

  return (
    <TableEditorLayout>
      <div className="h-screen flex flex-col">
        {/* 视图标签栏 */}
        <div className="border-b p-3 bg-background flex-shrink-0">
          <ViewTabs
            views={views}
            activeViewId={view?.id}
            onSelect={handleSelectView}
            onCreate={handleCreateView}
            onRename={handleRenameView}
            onDelete={handleDeleteView}
          />
        </div>

        {/* StandardDataView - 使用内置功能 */}
        <div className="flex-1 flex flex-col min-h-0">
          {baseId && tableId && viewId ? (
            <AppProviders
              baseId={baseId}
              tableId={tableId}
              viewId={viewId}
              sdk={luckdb}
              userId={useAuthStore.getState().user?.id || 'anonymous'}
            >
              <StandardDataView
                gridProps={gridProps}
                showHeader={false} // 我们有自定义的视图标签
                showToolbar={true}
                showStatus={true}
                // 传入字段配置，启用内置功能
                fields={fieldsConfig}
                tableId={tableId}
                sdk={luckdb}
                // 视图管理
                views={viewsData}
                activeViewId={view?.id}
                onViewChange={handleSelectView}
                onCreateView={handleCreateView}
                // 状态栏
                statusContent={
                  <div className="text-xs text-muted-foreground">
                    {fields.length} 个字段
                  </div>
                }
                className="h-full"
              />
            </AppProviders>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  缺少必要的参数，无法加载表格组件
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TableEditorLayout>
  );
}

