/**
 * 表格编辑器页面 - 极简版本
 * 
 * 只需传入 SDK 实例，组件自动处理一切！
 * 
 * ✨ 核心特性：
 * - 使用 useTableData hook 自动加载数据
 * - 使用 StandardDataView 内置功能（Header、Toolbar、StatusBar）
 * - 自动生成 columns 和 getCellContent
 * - 自动处理字段/记录/视图的增删改查
 * - 零配置，开箱即用
 * 
 * 📦 代码量从 420 行减少到 241 行（-43%）🎉
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// SDK
import luckdb from '@/lib/luckdb';
import type { Base } from '@luckdb/sdk';

// Aitable 组件和 Hooks
import '@luckdb/aitable/dist/index.css';
import { 
  AppProviders,
  StandardDataView,
  useTableData, // 🎉 神奇的 hook
} from '@luckdb/aitable';

// UI 组件
import { TableEditorLayout } from '@/components/layouts/table-editor-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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

  // ==================== 基础数据（Base）====================
  const [base, setBase] = useState<Base | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // ==================== 🎉 使用 useTableData hook 自动加载表格数据 ====================
  const tableData = useTableData({
    sdk: luckdb,
    tableId: tableId || '',
    autoLoad: !!tableId,
    limit: 100,
  });

  // ==================== 重定向到第一个表格 ====================
  const redirectToFirstTable = useCallback(async () => {
    if (!baseId) return;

    try {
      setInitialLoading(true);
      const baseData = await luckdb.getBase(baseId);
      setBase(baseData);

      const tables = await luckdb.listTables({ baseId });
      if (tables.length === 0) {
        toast.error('该数据库中没有表格');
        return;
      }

      const firstTable = tables[0];
      const viewsList = await luckdb.listViews({ tableId: firstTable.id });
      if (viewsList.length === 0) {
        toast.error('该表格中没有视图');
        return;
      }

      navigate(`/base/${baseId}/${firstTable.id}/${viewsList[0].id}`, { replace: true });
    } catch (error: any) {
      console.error('❌ 重定向失败:', error);
      toast.error(error?.message || '加载失败');
    } finally {
      setInitialLoading(false);
    }
  }, [baseId, navigate]);

  // ==================== 加载 Base 信息 ====================
  const loadBase = useCallback(async () => {
    if (!baseId) return;

    try {
      setInitialLoading(true);
      const baseData = await luckdb.getBase(baseId);
      setBase(baseData);
      console.log('✅ Base 加载完成:', baseData.name);
    } catch (error: any) {
      console.error('❌ 加载 Base 失败:', error);
      toast.error(error?.message || '加载失败');
    } finally {
      setInitialLoading(false);
    }
  }, [baseId]);

  useEffect(() => {
    if (baseId && tableId && viewId) {
      loadBase();
    } else if (baseId) {
      redirectToFirstTable();
    }
  }, [baseId, tableId, viewId, loadBase, redirectToFirstTable]);

  // ==================== 🎉 Grid Props（极简配置）====================
  
  // 单元格编辑 - 使用 tableData 的 updateRecord 方法
  const handleCellEdited = useCallback(async (cell: any, newCell: any) => {
    const [columnIndex, rowIndex] = cell;
    const field = tableData.fields[columnIndex];
    const record = tableData.records[rowIndex];
    
    if (!field || !record) return;

    try {
      await tableData.updateRecord(record.id, field.id, newCell.data);
      toast.success('更新成功');
    } catch (error: any) {
      console.error('❌ 更新失败:', error);
      toast.error(error?.message || '更新失败');
    }
  }, [tableData]);

  // Grid Props - 直接使用 tableData 的数据
  const gridProps = useMemo(() => ({
    columns: tableData.columns,
    rowCount: tableData.rowCount,
    getCellContent: tableData.getCellContent,
    freezeColumnCount: 1,
    rowHeight: 36,
    columnHeaderHeight: 40,
    onCellEdited: handleCellEdited,
    onDataRefresh: tableData.loadTableData, // 刷新数据
  }), [tableData, handleCellEdited]);

  // ==================== 字段配置（供 StandardDataView 使用）====================

  const fieldsConfig = useMemo(() => 
    tableData.fields.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type as any,
      visible: true,
      required: false,
      isPrimary: f.isPrimary || false,
      description: f.description || '',
      options: f.options || {},
    })),
    [tableData.fields]
  );

  // ==================== 渲染 ====================
  
  const loading = initialLoading || tableData.loading;

  if (loading) {
    return (
      <TableEditorLayout>
        <div className="h-full flex items-center justify-center p-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </TableEditorLayout>
    );
  }

  if (!base || !tableData.table) {
    return (
      <TableEditorLayout>
        <div className="h-full flex items-center justify-center">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                {!base && '数据库不存在'}
                {base && !tableData.table && '表格不存在'}
              </p>
            </CardContent>
          </Card>
        </div>
      </TableEditorLayout>
    );
  }

  return (
    <TableEditorLayout>
      <div className="h-full flex flex-col">
        {/* StandardDataView - 极简配置，使用所有内置功能 */}
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
              fields={fieldsConfig}
              tableId={tableId}
              sdk={luckdb}
              statusContent={
                <div className="text-xs text-muted-foreground">
                  共 {tableData.fields.length} 个字段，{tableData.totalRecords} 条记录
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
    </TableEditorLayout>
  );
}

