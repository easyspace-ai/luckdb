import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BaseLayout } from '@/components/layouts/base-layout';
import luckdb from '@/lib/luckdb';
import type { Space, Base } from '@luckdb/sdk';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Database, Folder, MoreHorizontal, Plus, Star, Users } from 'lucide-react';

interface SpaceWithBases extends Space {
  bases?: Base[];
}

export default function Dashboard() {
  const [spaces, setSpaces] = useState<SpaceWithBases[]>([]);
  const [loading, setLoading] = useState(true);
  const [createSpaceDialogOpen, setCreateSpaceDialogOpen] = useState(false);
  const [createBaseDialogOpen, setCreateBaseDialogOpen] = useState(false);
  const [creatingSpace, setCreatingSpace] = useState(false);
  const [creatingBase, setCreatingBase] = useState(false);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [newSpaceDescription, setNewSpaceDescription] = useState('');
  const [newBaseName, setNewBaseName] = useState('');
  const [newBaseDescription, setNewBaseDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      setLoading(true);
      const spacesData = await luckdb.listSpaces();
      
      const spacesWithBases = await Promise.all(
        spacesData.map(async (space) => {
          try {
            const bases = await luckdb.listBases({ spaceId: space.id });
            return { ...space, bases };
          } catch (error) {
            console.error(`Failed to load bases for space ${space.id}:`, error);
            return { ...space, bases: [] };
          }
        })
      );

      setSpaces(spacesWithBases);
    } catch (error: any) {
      console.error('Failed to load spaces:', error);
      toast.error(error?.message || '加载空间失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSpace = async () => {
    if (!newSpaceName.trim()) {
      toast.error('请输入空间名称');
      return;
    }

    try {
      setCreatingSpace(true);
      const newSpace = await luckdb.createSpace({
        name: newSpaceName.trim(),
        description: newSpaceDescription.trim() || undefined,
      });

      toast.success('创建空间成功');
      setCreateSpaceDialogOpen(false);
      setNewSpaceName('');
      setNewSpaceDescription('');
      
      setSpaces([...spaces, { ...newSpace, bases: [] }]);
    } catch (error: any) {
      console.error('Failed to create space:', error);
      toast.error(error?.message || '创建空间失败');
    } finally {
      setCreatingSpace(false);
    }
  };

  const handleCreateBase = async () => {
    if (!newBaseName.trim() || !selectedSpaceId) {
      toast.error('请输入数据库名称');
      return;
    }

    try {
      setCreatingBase(true);
      const newBase = await luckdb.createBase({
        spaceId: selectedSpaceId,
        name: newBaseName.trim(),
        description: newBaseDescription.trim() || undefined,
      });

      toast.success('创建数据库成功');
      setCreateBaseDialogOpen(false);
      setNewBaseName('');
      setNewBaseDescription('');
      setSelectedSpaceId(null);
      
      // 不刷新，直接更新列表
      setSpaces(spaces.map(space => 
        space.id === selectedSpaceId 
          ? { ...space, bases: [...(space.bases || []), newBase] }
          : space
      ));
    } catch (error: any) {
      console.error('Failed to create base:', error);
      toast.error(error?.message || '创建数据库失败');
    } finally {
      setCreatingBase(false);
    }
  };

  const handleBaseClick = (baseId: string) => {
    navigate(`/base/${baseId}`);
  };

  const openCreateBaseDialog = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    setCreateBaseDialogOpen(true);
  };

  if (loading) {
  return (
      <BaseLayout title="Dashboard" description="查看和管理您的所有空间">
        <div className="px-4 lg:px-6">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="space-y-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-8 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, j) => (
                      <Skeleton key={j} className="h-24" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </BaseLayout>
    );
  }

  return (
    <BaseLayout title="Dashboard" description="查看和管理您的所有空间">
      <div className="px-4 lg:px-6 space-y-6">
        {/* 创建空间按钮 */}
        <div>
          <Dialog open={createSpaceDialogOpen} onOpenChange={setCreateSpaceDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                创建新空间
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>创建新空间</DialogTitle>
                <DialogDescription>
                  创建一个新的工作空间来组织您的数据
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">空间名称 *</Label>
                  <Input
                    id="name"
                    placeholder="例如：项目管理"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    disabled={creatingSpace}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">描述（可选）</Label>
                  <Textarea
                    id="description"
                    placeholder="简要描述这个空间的用途"
                    value={newSpaceDescription}
                    onChange={(e) => setNewSpaceDescription(e.target.value)}
                    disabled={creatingSpace}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateSpaceDialogOpen(false)}
                  disabled={creatingSpace}
                >
                  取消
                </Button>
                <Button onClick={handleCreateSpace} disabled={creatingSpace}>
                  {creatingSpace ? '创建中...' : '创建'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* 创建数据库对话框 */}
        <Dialog open={createBaseDialogOpen} onOpenChange={setCreateBaseDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>创建数据库</DialogTitle>
              <DialogDescription>
                在选中的空间中创建一个新的数据库
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="base-name">数据库名称 *</Label>
                <Input
                  id="base-name"
                  placeholder="例如：用户管理"
                  value={newBaseName}
                  onChange={(e) => setNewBaseName(e.target.value)}
                  disabled={creatingBase}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="base-description">描述（可选）</Label>
                <Textarea
                  id="base-description"
                  placeholder="简要描述这个数据库的用途"
                  value={newBaseDescription}
                  onChange={(e) => setNewBaseDescription(e.target.value)}
                  disabled={creatingBase}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCreateBaseDialogOpen(false);
                  setSelectedSpaceId(null);
                }}
                disabled={creatingBase}
              >
                取消
              </Button>
              <Button onClick={handleCreateBase} disabled={creatingBase}>
                {creatingBase ? '创建中...' : '创建'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 空间列表 */}
        {spaces.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Folder className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">暂无空间</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
                创建您的第一个工作空间，开始组织和管理您的数据
              </p>
              <Button onClick={() => setCreateSpaceDialogOpen(true)} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                创建第一个空间
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {spaces.map((space) => (
              <Card key={space.id} className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
                <CardHeader className="bg-muted/30 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Folder className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-bold">{space.name}</h2>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Star className="h-4 w-4" />
                          </Button>
                        </div>
                        {space.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {space.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 text-xs rounded-full bg-background border">
                        免费版
                      </span>
                      <Button variant="link" className="h-auto p-0 text-sm text-purple-600 hover:text-purple-700">
                        升级
                      </Button>
                      <Button onClick={() => openCreateBaseDialog(space.id)} size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        创建数据库
                      </Button>
                      <Button variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-1" />
                        邀请
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-6">
                  {!space.bases || space.bases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Database className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">该空间暂无数据库</p>
                      <Button 
                        variant="outline"
                        size="sm"
                        onClick={() => openCreateBaseDialog(space.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        创建第一个数据库
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {space.bases.map((base) => (
                        <Card
                          key={base.id}
                          className="cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all group"
                          onClick={() => handleBaseClick(base.id)}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
                                <Database className="h-6 w-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                                  {base.name}
                                </h3>
                                {base.description && (
                                  <p className="text-sm text-muted-foreground truncate mt-1">
                                    {base.description}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  点击打开
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
          </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </BaseLayout>
  );
}
