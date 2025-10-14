import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TableEditorLayout } from '@/components/layouts/table-editor-layout';
import luckdb from '@/lib/luckdb';
import type { Base, Table, View, Field, Record } from '@luckdb/sdk';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function TableEditor() {
  const { baseId, tableId, viewId } = useParams<{
    baseId: string;
    tableId?: string;
    viewId?: string;
  }>();
  const navigate = useNavigate();

  const [base, setBase] = useState<Base | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (baseId) {
      if (tableId && viewId) {
        // 有完整的路径参数，直接加载
        loadTableData(tableId, viewId);
      } else {
        // 只有 baseId，需要重定向到第一个表格
        redirectToFirstTable();
      }
    }
  }, [baseId, tableId, viewId]);

  const redirectToFirstTable = async () => {
    if (!baseId) return;

    try {
      setLoading(true);

      // 获取 Base 信息
      const baseData = await luckdb.getBase(baseId);
      setBase(baseData);

      // 获取 Tables
      const tables = await luckdb.listTables({ baseId });
      if (tables.length === 0) {
        toast.error('该数据库中没有表格');
        setLoading(false);
        return;
      }

      const firstTable = tables[0];

      // 获取第一个 Table 的 Views
      const views = await luckdb.listViews({ tableId: firstTable.id });
      if (views.length === 0) {
        toast.error('该表格中没有视图');
        setLoading(false);
        return;
      }

      const firstView = views[0];

      // 重定向到完整 URL
      navigate(`/base/${baseId}/${firstTable.id}/${firstView.id}`, { replace: true });
    } catch (error: any) {
      console.error('Failed to redirect:', error);
      toast.error(error?.message || '加载失败');
      setLoading(false);
    }
  };

  const loadTableData = async (tableId: string, viewId: string) => {
    if (!baseId) return;

    try {
      setLoading(true);

      // 1. 获取 Base 信息
      const baseData = await luckdb.getBase(baseId);
      setBase(baseData);

      // 2. 获取 Table 信息
      const tableData = await luckdb.getTable(tableId);
      setTable(tableData);

      // 3. 获取 View 信息
      const viewData = await luckdb.getView(viewId);
      setView(viewData);

      // 4. 并行加载字段和记录数据
      const [fieldsData, recordsData] = await Promise.all([
        luckdb.listFields({ tableId }),
        luckdb.listRecords({ tableId, limit: 100 }),
      ]);

      setFields(fieldsData);
      setRecords(recordsData.data || []);
    } catch (error: any) {
      console.error('Failed to load table data:', error);
      toast.error(error?.message || '加载数据失败');
      
      // 如果 view 不存在，尝试重定向到表格的第一个视图
      if (error?.response?.status === 404 && tableId) {
        try {
          const views = await luckdb.listViews({ tableId });
          if (views.length > 0) {
            navigate(`/base/${baseId}/${tableId}/${views[0].id}`, { replace: true });
            return;
          }
        } catch (err) {
          console.error('Failed to redirect to first view:', err);
        }
      }
    } finally {
      setLoading(false);
    }
  };

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
      <div className="h-full flex flex-col">
        {/* 工具栏 */}
        <div className="border-b p-6 bg-background">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{table.name}</h1>
              <p className="text-sm text-muted-foreground mt-2">
                {view.name} · {records.length} 条记录 · {fields.length} 个字段
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 text-sm rounded-md border bg-muted/50">
                视图: {view.name}
              </div>
            </div>
          </div>
        </div>

        {/* 表格区域 */}
        <div className="flex-1 overflow-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>数据预览</span>
                <div className="text-xs font-normal text-muted-foreground">
                  Base: {base.name}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  暂无记录
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2">
                        <th className="p-3 text-left text-sm font-semibold bg-muted">ID</th>
                        {fields.slice(0, 10).map((field) => (
                          <th key={field.id} className="p-3 text-left text-sm font-semibold bg-muted whitespace-nowrap">
                            {field.name}
                            <span className="ml-2 text-xs text-muted-foreground font-normal">
                              ({field.type})
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {records.slice(0, 50).map((record) => (
                        <tr key={record.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3 text-sm font-mono text-xs text-muted-foreground">
                            {record.id.slice(0, 12)}...
                          </td>
                          {fields.slice(0, 10).map((field) => (
                            <td key={field.id} className="p-3 text-sm max-w-xs truncate">
                              {record.data?.[field.name] !== undefined && record.data?.[field.name] !== null
                                ? Array.isArray(record.data[field.name])
                                  ? JSON.stringify(record.data[field.name])
                                  : String(record.data[field.name])
                                : '-'
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {records.length > 50 && (
                    <div className="mt-4 text-sm text-muted-foreground text-center">
                      显示前 50 条记录，共 {records.length} 条
                    </div>
                  )}
                  
                  {fields.length > 10 && (
                    <div className="mt-2 text-sm text-muted-foreground text-center">
                      显示前 10 个字段，共 {fields.length} 个
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* URL 信息展示 */}
          <Card className="mt-6 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                当前 URL 结构
              </h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Base ID:</span>
                  <code className="bg-background px-2 py-1 rounded">{baseId}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Table ID:</span>
                  <code className="bg-background px-2 py-1 rounded">{tableId}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">View ID:</span>
                  <code className="bg-background px-2 py-1 rounded">{viewId}</code>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-muted-foreground">完整路径:</span>
                  <code className="bg-background px-2 py-1 rounded text-xs">
                    /base/{baseId}/{tableId}/{viewId}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid 组件待集成说明 */}
          <Card className="mt-6 border-dashed">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">🚧 Grid 表格组件待集成</h3>
              <p className="text-sm text-muted-foreground">
                高性能 Grid 组件正在集成中，将提供：
              </p>
              <ul className="mt-2 text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Canvas 渲染，流畅滚动</li>
                <li>双击编辑单元格</li>
                <li>多种字段编辑器</li>
                <li>拖拽调整列宽</li>
                <li>右键菜单</li>
                <li>排序、筛选、分组</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </TableEditorLayout>
  );
}
