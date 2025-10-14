import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Table,
  Eye,
  Settings,
  Plus,
  MoreHorizontal,
  Home,
} from 'lucide-react';
import luckdb from '@/lib/luckdb';
import type { Base, Table as TableType, View } from '@luckdb/sdk';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface TableEditorLayoutProps {
  children: ReactNode;
}

export function TableEditorLayout({ children }: TableEditorLayoutProps) {
  const navigate = useNavigate();
  const { baseId } = useParams<{ baseId: string }>();
  const [collapsed, setCollapsed] = useState(false);
  const [base, setBase] = useState<Base | null>(null);
  const [tables, setTables] = useState<TableType[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [views, setViews] = useState<View[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 创建表格对话框状态
  const [createTableDialogOpen, setCreateTableDialogOpen] = useState(false);
  const [creatingTable, setCreatingTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableDescription, setNewTableDescription] = useState('');

  useEffect(() => {
    if (baseId) {
      loadSidebarData();
    }
  }, [baseId]);

  useEffect(() => {
    if (selectedTableId) {
      loadViews(selectedTableId);
    }
  }, [selectedTableId]);

  const loadSidebarData = async () => {
    if (!baseId) return;

    try {
      setLoading(true);
      const [baseData, tablesData] = await Promise.all([
        luckdb.getBase(baseId),
        luckdb.listTables({ baseId }),
      ]);

      setBase(baseData);
      setTables(tablesData);

      // 默认选中第一个表格
      if (tablesData.length > 0 && !selectedTableId) {
        setSelectedTableId(tablesData[0].id);
      }
    } catch (error) {
      console.error('Failed to load sidebar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadViews = async (tableId: string) => {
    try {
      const viewsData = await luckdb.listViews({ tableId });
      setViews(viewsData);
    } catch (error) {
      console.error('Failed to load views:', error);
      setViews([]);
    }
  };

  const handleTableSelect = async (table: TableType) => {
    setSelectedTableId(table.id);
    
    // ✅ 优先使用后端返回的 defaultViewId
    if (table.defaultViewId) {
      navigate(`/base/${baseId}/${table.id}/${table.defaultViewId}`);
      return;
    }

    // ✅ 如果没有 defaultViewId，回退到查询第一个视图（兼容旧数据）
    try {
      const viewsData = await luckdb.listViews({ tableId: table.id });
      if (viewsData.length > 0) {
        const firstView = viewsData[0];
        navigate(`/base/${baseId}/${table.id}/${firstView.id}`);
      } else {
        toast.error('该表格没有可用的视图');
      }
    } catch (error) {
      console.error('Failed to load views for table:', error);
      toast.error('加载视图失败');
    }
  };

  const handleCreateTable = async () => {
    if (!newTableName.trim() || !baseId) {
      toast.error('请输入表格名称');
      return;
    }

    try {
      setCreatingTable(true);
      const newTable = await luckdb.createTable({
        baseId,
        name: newTableName.trim(),
        description: newTableDescription.trim() || undefined,
      });

      toast.success('创建表格成功');
      setCreateTableDialogOpen(false);
      setNewTableName('');
      setNewTableDescription('');

      // 不刷新，直接更新列表
      setTables([...tables, newTable]);
      
      // ✅ 自动跳转到新创建的表格的默认视图
      if (newTable.defaultViewId) {
        navigate(`/base/${baseId}/${newTable.id}/${newTable.defaultViewId}`);
      } else {
        // 如果后端没有返回 defaultViewId，只选中表格
        setSelectedTableId(newTable.id);
      }
    } catch (error: any) {
      console.error('Failed to create table:', error);
      toast.error(error?.message || '创建表格失败');
    } finally {
      setCreatingTable(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 侧边栏 */}
      <aside
        className={cn(
          'flex flex-col border-r bg-muted/40 transition-all duration-300',
          collapsed ? 'w-16' : 'w-72'
        )}
      >
        {/* 侧边栏头部 */}
        <div className="flex h-14 items-center justify-between border-b px-4">
          {!collapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              <span>返回首页</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(collapsed && 'mx-auto')}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {loading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Base 信息 */}
              {!collapsed && base && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Database className="h-4 w-4" />
                    <span>数据库</span>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <div className="font-semibold">{base.name}</div>
                    {base.description && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {base.description}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {collapsed && base && (
                <div className="flex justify-center">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Database className="h-5 w-5 text-primary" />
                  </div>
                </div>
              )}

              <Separator />

              {/* Tables 列表 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {!collapsed && (
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Table className="h-4 w-4" />
                      <span>表格</span>
                    </div>
                  )}
                  {!collapsed && (
                    <Dialog open={createTableDialogOpen} onOpenChange={setCreateTableDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>创建表格</DialogTitle>
                          <DialogDescription>
                            在当前数据库中创建一个新的表格
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="table-name">表格名称 *</Label>
                            <Input
                              id="table-name"
                              placeholder="例如：客户列表"
                              value={newTableName}
                              onChange={(e) => setNewTableName(e.target.value)}
                              disabled={creatingTable}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="table-description">描述（可选）</Label>
                            <Textarea
                              id="table-description"
                              placeholder="简要描述这个表格的用途"
                              value={newTableDescription}
                              onChange={(e) => setNewTableDescription(e.target.value)}
                              disabled={creatingTable}
                              rows={3}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setCreateTableDialogOpen(false);
                              setNewTableName('');
                              setNewTableDescription('');
                            }}
                            disabled={creatingTable}
                          >
                            取消
                          </Button>
                          <Button onClick={handleCreateTable} disabled={creatingTable}>
                            {creatingTable ? '创建中...' : '创建'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* 表格列表区域 - 红框区域 */}
                <div className="space-y-1 min-h-[200px]">
                  {tables.length === 0 ? (
                    !collapsed && (
                      <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                        <Table className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">暂无表格</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCreateTableDialogOpen(true)}
                        >
                          <Plus className="h-3 w-3 mr-2" />
                          创建第一个表格
                        </Button>
                      </div>
                    )
                  ) : (
                    tables.map((table) => (
                      <Button
                        key={table.id}
                        variant={selectedTableId === table.id ? 'secondary' : 'ghost'}
                        className={cn(
                          'w-full justify-start gap-2',
                          collapsed && 'justify-center px-2'
                        )}
                        onClick={() => handleTableSelect(table)}
                      >
                        <Table className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="truncate">{table.name}</span>
                        )}
                      </Button>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              {/* Views 列表 */}
              {selectedTableId && views.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    {!collapsed && (
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>视图</span>
                      </div>
                    )}
                    {!collapsed && (
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <Plus className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {views.map((view) => (
                      <Button
                        key={view.id}
                        variant="ghost"
                        className={cn(
                          'w-full justify-start gap-2 pl-6',
                          collapsed && 'justify-center px-2 pl-2'
                        )}
                      >
                        <Eye className="h-3 w-3 shrink-0" />
                        {!collapsed && (
                          <span className="truncate text-sm">{view.name}</span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}

        {/* 侧边栏底部 */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-2',
              collapsed && 'justify-center px-2'
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && <span>设置</span>}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start gap-2',
              collapsed && 'justify-center px-2'
            )}
          >
            <MoreHorizontal className="h-4 w-4 shrink-0" />
            {!collapsed && <span>更多</span>}
          </Button>
        </div>
      </aside>

      {/* 主内容区域 */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
