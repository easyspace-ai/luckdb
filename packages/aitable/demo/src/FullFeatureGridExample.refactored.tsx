/**
 * 全功能 Grid 示例 - 使用新设计系统
 * 
 * ✨ 新特性：
 * 1. ✅ 使用重构后的 GridToolbar（Lucide 图标）
 * 2. ✅ 集成 ThemeProvider（支持暗色模式）
 * 3. ✅ 使用 Design Tokens
 * 4. ✅ 流畅的动画效果
 */

import { useState, useRef, useMemo, useCallback } from 'react';
import { 
  Grid, 
  type IGridRef, 
  type IGridColumn, 
  type ICellItem,
  CellType,
  type ICell,
  StatisticsRow,
} from '@luckdb/aitable';
import { GridStoreProvider } from '@luckdb/aitable/store';
import { createSDKAdapter } from '@luckdb/aitable/api';
import { GridErrorBoundary } from '@luckdb/aitable/grid/error-handling';
import { generateDemoData, type DemoRecord } from './data';

// 🆕 使用新设计系统
import { 
  ThemeProvider, 
  useTheme, 
  ThemeToggle,
  tokens,
  cn,
  animations,
} from '@luckdb/aitable/grid/design-system';

// 🆕 使用重构后的 GridToolbar
import { GridToolbar } from '@luckdb/aitable/grid/components/toolbar/GridToolbar.refactored';

function FullFeatureGridExampleContent() {
  const gridRef = useRef<IGridRef>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showStatistics, setShowStatistics] = useState(true);
  const [selectedRows, setSelectedRows] = useState(0);
  
  // 🆕 使用主题
  const { theme, isDark } = useTheme();

  // 定义所有支持的列类型（24列）
  const initialColumns: IGridColumn[] = [
    // 基础列
    { id: 'id', name: 'ID', width: 80, isPrimary: true, icon: '🔑' },
    { id: 'description', name: '描述', width: 250, icon: '📄' },
    
    // 数字列
    { id: 'number', name: '数字', width: 100, icon: '🔢' },
    { id: 'currency', name: '金额', width: 120, icon: '💰' },
    { id: 'percentage', name: '百分比', width: 100, icon: '📊' },
    
    // 布尔列
    { id: 'boolean1', name: '激活', width: 80, icon: '✓' },
    { id: 'boolean2', name: '完成', width: 80, icon: '☑️' },
    
    // 选择列
    { id: 'status', name: '状态', width: 120, icon: '📋' },
    { id: 'priority', name: '优先级', width: 100, icon: '🎯' },
    { id: 'category', name: '分类', width: 120, icon: '📁' },
    
    // 多选列
    { id: 'tags', name: '标签', width: 180, icon: '🏷️' },
    { id: 'labels', name: '标记', width: 150, icon: '🔖' },
    
    // 评分列
    { id: 'rating', name: '评分', width: 120, icon: '⭐' },
    { id: 'quality', name: '质量', width: 120, icon: '💎' },
    
    // 日期列
    { id: 'date', name: '日期', width: 120, icon: '📅' },
    { id: 'createdAt', name: '创建时间', width: 180, icon: '🕐' },
    { id: 'dueDate', name: '截止日期', width: 150, icon: '⏰' },
    
    // 用户列
    { id: 'assignee', name: '负责人', width: 150, icon: '👤' },
    { id: 'creator', name: '创建者', width: 150, icon: '👨‍💼' },
    
    // 其他列
    { id: 'email', name: '邮箱', width: 200, icon: '📧' },
    { id: 'link', name: '链接', width: 200, icon: '🔗' },
    { id: 'phone', name: '电话', width: 150, icon: '📱' },
    { id: 'progress', name: '进度', width: 100, icon: '📈' },
    { id: 'title', name: '标题', width: 200, icon: '📝' },
  ];

  const [localColumns, setLocalColumns] = useState(initialColumns);
  const [records, setRecords] = useState<DemoRecord[]>(() => generateDemoData(200));

  // 统计数据
  const statistics = useMemo(() => [
    { columnId: 'number', columnIndex: 2, type: 'average' as const, value: records.reduce((sum, r) => sum + r.number, 0) / records.length, label: '平均数字' },
    { columnId: 'number', columnIndex: 2, type: 'sum' as const, value: records.reduce((sum, r) => sum + r.number, 0), label: '总和' },
    { columnId: 'boolean2', columnIndex: 6, type: 'count' as const, value: records.filter(r => r.boolean2).length, label: '已完成' },
    { columnId: 'rating', columnIndex: 12, type: 'average' as const, value: records.reduce((sum, r) => sum + r.rating, 0) / records.length, label: '平均评分' },
  ], [records]);

  // 获取单元格内容（保持原有逻辑）
  const getCellContent = useCallback(
    (cell: [number, number]): any => {
      const [colIndex, rowIndex] = cell;
      const record = records[rowIndex];
      const column = localColumns[colIndex];

      if (!record || !column) {
        return {
          type: CellType.Text,
          data: '',
          displayData: '',
        };
      }

      const value = record[column.id as keyof DemoRecord];

      switch (column.id) {
        // 文本列
        case 'id':
        case 'title':
        case 'description':
        case 'link':
        case 'phone':
          return {
            type: CellType.Text,
            data: String(value || ''),
            displayData: String(value || ''),
          };

        // 邮箱列
        case 'email':
          return {
            type: CellType.Link,
            data: {
              title: String(value || ''),
              url: `mailto:${value}`,
            },
            displayData: String(value || ''),
          };

        // 数字列
        case 'number':
        case 'percentage':
        case 'progress':
          return {
            type: CellType.Number,
            data: value as number,
            displayData: String(value || '0'),
          };

        // 货币列
        case 'currency':
          return {
            type: CellType.Number,
            data: value as number,
            displayData: `¥${(value as number).toFixed(2)}`,
          };

        // 布尔列
        case 'boolean1':
        case 'boolean2':
          return {
            type: CellType.Boolean,
            data: value as boolean,
            displayData: value ? '✓' : '',
          };

        // 单选列
        case 'status': {
          const strValue = String(value || '');
          const allChoices = [
            { id: '待处理', name: '待处理', color: '#94a3b8', backgroundColor: '#f1f5f9' },
            { id: '进行中', name: '进行中', color: '#3b82f6', backgroundColor: '#dbeafe' },
            { id: '已完成', name: '已完成', color: '#22c55e', backgroundColor: '#dcfce7' },
            { id: '已取消', name: '已取消', color: '#6b7280', backgroundColor: '#f3f4f6' },
            { id: '暂停', name: '暂停', color: '#f59e0b', backgroundColor: '#fef3c7' },
          ];
          
          const choiceMap: Record<string, any> = {};
          allChoices.forEach(choice => {
            choiceMap[choice.id] = choice;
          });
          
          return {
            type: CellType.Select,
            data: strValue ? [strValue] : [],
            displayData: strValue ? [strValue] : [],
            choiceMap,
            choiceSorted: allChoices,
            isMultiple: false,
          };
        }

        case 'priority': {
          const strValue = String(value || '');
          const allChoices = [
            { id: '低', name: '低', color: '#06b6d4', backgroundColor: '#cffafe' },
            { id: '中', name: '中', color: '#f59e0b', backgroundColor: '#fef3c7' },
            { id: '高', name: '高', color: '#ef4444', backgroundColor: '#fee2e2' },
            { id: '紧急', name: '紧急', color: '#dc2626', backgroundColor: '#fee2e2' },
          ];
          
          const choiceMap: Record<string, any> = {};
          allChoices.forEach(choice => {
            choiceMap[choice.id] = choice;
          });
          
          return {
            type: CellType.Select,
            data: strValue ? [strValue] : [],
            displayData: strValue ? [strValue] : [],
            choiceMap,
            choiceSorted: allChoices,
            isMultiple: false,
          };
        }

        case 'category': {
          const strValue = String(value || '');
          const allChoices = [
            { id: '开发', name: '开发', color: '#3b82f6', backgroundColor: '#dbeafe' },
            { id: '设计', name: '设计', color: '#8b5cf6', backgroundColor: '#ede9fe' },
            { id: '测试', name: '测试', color: '#14b8a6', backgroundColor: '#ccfbf1' },
            { id: '运维', name: '运维', color: '#f59e0b', backgroundColor: '#fef3c7' },
            { id: '产品', name: '产品', color: '#ec4899', backgroundColor: '#fce7f3' },
            { id: '市场', name: '市场', color: '#22c55e', backgroundColor: '#dcfce7' },
          ];
          
          const choiceMap: Record<string, any> = {};
          allChoices.forEach(choice => {
            choiceMap[choice.id] = choice;
          });
          
          return {
            type: CellType.Select,
            data: strValue ? [strValue] : [],
            displayData: strValue ? [strValue] : [],
            choiceMap,
            choiceSorted: allChoices,
            isMultiple: false,
          };
        }

        // 多选列（标签）
        case 'tags': {
          const arrValue = Array.isArray(value) ? value : [];
          const tagOptions = ['前端', '后端', '移动端', 'API', 'UI', 'UX', '性能', '安全', '数据库', '缓存'];
          const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];
          const choiceSorted = tagOptions.map((tag, idx) => ({
            id: tag,
            name: tag,
            color: colors[idx % colors.length],
          }));
          
          const choiceMap: Record<string, any> = {};
          choiceSorted.forEach(choice => {
            choiceMap[choice.id] = choice;
          });
          
          return {
            type: CellType.Select,
            data: arrValue,
            displayData: arrValue,
            choiceMap,
            choiceSorted,
            isMultiple: true,
          };
        }
        
        case 'labels': {
          const arrValue = Array.isArray(value) ? value : [];
          const labelOptions = ['bug', 'feature', 'enhancement', 'documentation', 'refactor', 'hotfix'];
          const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#f97316'];
          const choiceSorted = labelOptions.map((label, idx) => ({
            id: label,
            name: label,
            color: colors[idx % colors.length],
          }));
          
          const choiceMap: Record<string, any> = {};
          choiceSorted.forEach(choice => {
            choiceMap[choice.id] = choice;
          });
          
          return {
            type: CellType.Select,
            data: arrValue,
            displayData: arrValue,
            choiceMap,
            choiceSorted,
            isMultiple: true,
          };
        }

        // 日期列
        case 'date':
        case 'createdAt':
        case 'dueDate':
          return {
            type: CellType.Date,
            data: value as string,
            displayData: value ? new Date(value as string).toLocaleDateString('zh-CN') : '',
          };

        // 评分列
        case 'rating':
        case 'quality':
          return {
            type: CellType.Rating,
            data: (value as number) || 0,
            icon: '⭐',
            color: '#fbbf24',
            max: 5,
          };

        // 用户列
        case 'assignee':
        case 'creator': {
          const userName = String(value || '');
          return {
            type: CellType.User,
            data: userName ? [{ id: userName, name: userName, avatarUrl: '' }] : [],
            displayData: userName ? `👤 ${userName}` : '',
          };
        }

        default:
          return {
            type: CellType.Text,
            data: String(value || ''),
            displayData: String(value || ''),
          };
      }
    },
    [localColumns, records]
  );

  // 处理单元格编辑（保持原有逻辑）
  const handleCellEdited = useCallback(
    (cell: ICellItem, newCell: ICell) => {
      const [columnIndex, rowIndex] = cell;
      const column = localColumns[columnIndex];
      if (!column) return;

      setRecords((prevRecords) => {
        const newRecords = [...prevRecords];
        const record = newRecords[rowIndex];
        if (!record) return prevRecords;

        let newValue: any;
        
        switch (column.id) {
          case 'tags':
          case 'labels':
            newValue = Array.isArray(newCell.data) ? newCell.data : [];
            break;
          
          case 'status':
          case 'priority':
          case 'category':
            if (Array.isArray(newCell.data) && newCell.data.length > 0) {
              newValue = newCell.data[0];
            } else {
              newValue = '';
            }
            break;
          
          case 'boolean1':
          case 'boolean2':
            newValue = Boolean(newCell.data);
            break;
          
          case 'rating':
          case 'quality':
          case 'number':
          case 'percentage':
          case 'progress':
          case 'currency':
            newValue = typeof newCell.data === 'number' ? newCell.data : Number(newCell.data) || 0;
            break;
          
          case 'assignee':
          case 'creator':
            if (Array.isArray(newCell.data) && newCell.data.length > 0) {
              newValue = newCell.data[0].name;
            } else {
              newValue = '';
            }
            break;
          
          default:
            newValue = newCell.data;
            break;
        }

        newRecords[rowIndex] = {
          ...record,
          [column.id as string]: newValue,
        };

        console.log('✅ Cell updated:', { columnId: column.id, rowIndex, newValue });
        return newRecords;
      });
    },
    [localColumns]
  );

  // 字段操作回调函数（保持原有逻辑）
  const handleAddColumn = useCallback((fieldType: any, insertIndex?: number, fieldName?: string, options?: any) => {
    console.log('Add column:', fieldType, 'at index:', insertIndex, 'name:', fieldName, 'options:', options);
    
    const getFieldIcon = (type: string) => {
      const iconMap: Record<string, string> = {
        'singleLineText': '📝',
        'longText': '📄',
        'number': '🔢',
        'singleSelect': '🔘',
        'multipleSelect': '☑️',
        'date': '📅',
        'checkbox': '☑️',
        'user': '👤',
        'attachment': '📎',
        'link': '🔗',
        'rating': '⭐',
        'formula': '🧮',
        'rollup': '📊',
        'autoNumber': '#️⃣',
        'createdTime': '🕒',
        'lastModifiedTime': '🕐',
        'createdBy': '👤',
        'lastModifiedBy': '👤',
      };
      return iconMap[type] || '📄';
    };
    
    const newColumn: IGridColumn = {
      id: `col-${Date.now()}`,
      name: fieldName || `新字段_${Date.now()}`,
      width: 150,
      icon: getFieldIcon(fieldType),
      type: fieldType,
      options: options,
    };
    
    setLocalColumns(prev => {
      const newColumns = [...prev];
      const insertPos = insertIndex ?? newColumns.length;
      newColumns.splice(insertPos, 0, newColumn);
      return newColumns;
    });
  }, []);

  const handleEditColumn = useCallback((columnIndex: number, updatedColumn: IGridColumn) => {
    console.log('Edit column:', columnIndex, updatedColumn);
    setLocalColumns(prev => prev.map((col, idx) => 
      idx === columnIndex ? { ...col, ...updatedColumn } : col
    ));
  }, []);

  const handleDuplicateColumn = useCallback((columnIndex: number) => {
    console.log('Duplicate column:', columnIndex);
    setLocalColumns(prev => {
      const newColumns = [...prev];
      const originalColumn = newColumns[columnIndex];
      const duplicatedColumn = {
        ...originalColumn,
        id: `col-${Date.now()}`,
        name: `${originalColumn.name}_副本`,
      };
      newColumns.splice(columnIndex + 1, 0, duplicatedColumn);
      return newColumns;
    });
  }, []);

  const handleDeleteColumn = useCallback((columnIndex: number) => {
    console.log('Delete column:', columnIndex);
    setLocalColumns(prev => prev.filter((_, idx) => idx !== columnIndex));
  }, []);

  const handleStartEditColumn = useCallback((columnIndex: number, column: IGridColumn) => {
    console.log('Start editing column:', columnIndex, column);
  }, []);

  const handleDeleteRow = useCallback((selection: any) => {
    console.log('Delete row selection:', selection);
    console.log('删除行功能已触发，实际项目中需要连接后端API');
  }, []);

  // 创建模拟的 API 客户端
  const apiClient = createSDKAdapter({
    baseURL: 'http://localhost:8080/api/v1',
    token: 'demo-token',
    onError: (error) => {
      console.error('API Error:', error);
    },
    onUnauthorized: () => {
      console.log('Unauthorized - redirecting to login');
    },
  });

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ 
        backgroundColor: theme.cellBg,
        color: theme.textColor,
      }}
    >
      {/* 🆕 页面标题 - 使用设计系统 */}
      <div
        className={cn(
          'flex items-center justify-between',
          'px-6 py-4 border-b',
          animations.tailwind.slideInFromTop,
        )}
        style={{ 
          backgroundColor: theme.columnHeaderBg,
          borderColor: theme.cellLineColor,
        }}
      >
        <div>
          <h1 className="text-2xl font-bold mb-1">
            🎨 全功能 Grid 示例 - 新设计系统
          </h1>
          <p className="text-sm" style={{ color: theme.textColorSecondary }}>
            使用 Lucide 图标 + Design Tokens + 暗色模式 - {localColumns.length} 列 × {records.length} 行
          </p>
        </div>
        
        {/* 🆕 主题切换按钮 */}
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: theme.textColorSecondary }}>
            {isDark ? '🌙 暗色模式' : '☀️ 亮色模式'}
          </span>
          <ThemeToggle className={cn(
            'p-2 rounded-md transition-colors duration-200',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
          )} />
        </div>
      </div>

      {/* 🆕 控制面板 - 优化样式 */}
      <div
        className="flex items-center gap-4 px-6 py-3 border-b"
        style={{ 
          backgroundColor: theme.columnHeaderBg,
          borderColor: theme.cellLineColor,
        }}
      >
        <label className={cn(
          'flex items-center gap-2 cursor-pointer',
          'transition-opacity duration-200',
          'hover:opacity-80',
        )}>
          <input
            type="checkbox"
            checked={showToolbar}
            onChange={(e) => setShowToolbar(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm font-medium">显示工具栏</span>
        </label>

        <label className={cn(
          'flex items-center gap-2 cursor-pointer',
          'transition-opacity duration-200',
          'hover:opacity-80',
        )}>
          <input
            type="checkbox"
            checked={showStatistics}
            onChange={(e) => setShowStatistics(e.target.checked)}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-sm font-medium">显示统计</span>
        </label>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm" style={{ color: theme.textColorSecondary }}>
            已选: {selectedRows} 行
          </span>
          <button
            onClick={() => {
              if (gridRef.current) {
                console.log('Grid ref:', gridRef.current);
              }
            }}
            className={cn(
              'px-4 py-1.5 rounded-md',
              'text-sm font-medium',
              'border transition-all duration-200',
              animations.hover.colors,
              animations.focus.standard,
            )}
            style={{
              backgroundColor: theme.cellBg,
              borderColor: theme.cellLineColor,
              color: theme.textColor,
            }}
          >
            测试 Grid API
          </button>
        </div>
      </div>

      {/* Grid容器 */}
      <div
        className={cn(
          'flex-1 flex flex-col',
          'm-6 rounded-lg overflow-hidden',
          'min-h-0',
          animations.tailwind.scaleIn,
        )}
        style={{
          backgroundColor: theme.cellBg,
          boxShadow: tokens.elevation.md,
        }}
      >
        <GridStoreProvider
          baseId="demo-base"
          tableId="demo-table"
          viewId="demo-view"
          apiClient={apiClient}
          autoLoad={false}
        >
          <GridErrorBoundary>
            {/* 🆕 重构后的工具栏 */}
            {showToolbar && (
              <GridToolbar
                onUndo={() => console.log('Undo')}
                onRedo={() => console.log('Redo')}
                onAddNew={() => console.log('Add new')}
                onFieldConfig={() => console.log('Field config')}
                onFilter={() => console.log('Filter')}
                onSort={() => console.log('Sort')}
                onGroup={() => console.log('Group')}
                onSearch={() => console.log('Search')}
                onFullscreen={() => console.log('Fullscreen')}
                onShare={() => console.log('Share')}
                onAPI={() => console.log('API')}
                onCollaboration={() => console.log('Collaboration')}
                onToggleToolbar={() => setShowToolbar(false)}
                onToggleStatistics={() => setShowStatistics(!showStatistics)}
                showStatistics={showStatistics}
              />
            )}

            {/* Grid */}
            <div className="flex-1 min-h-0 relative">
              <Grid
                ref={gridRef}
                columns={localColumns}
                rowCount={records.length}
                getCellContent={getCellContent}
                freezeColumnCount={2}
                rowHeight={36}
                columnHeaderHeight={40}
                style={{
                  width: '100%',
                  height: '100%',
                }}
                onCellEdited={handleCellEdited}
                onSelectionChanged={(selection) => {
                  if (selection.isRowSelection && selection.ranges && selection.ranges.length > 0) {
                    const totalRows = selection.ranges.reduce((sum, range) => {
                      if (Array.isArray(range) && range.length === 2) {
                        return sum + (range[1] - range[0] + 1);
                      }
                      return sum;
                    }, 0);
                    setSelectedRows(totalRows);
                  } else {
                    setSelectedRows(0);
                  }
                }}
                onColumnResize={(column, newSize, colIndex) => {
                  console.log('Column resized:', column.name, 'New width:', newSize);
                  const newColumns = [...localColumns];
                  newColumns[colIndex] = { ...newColumns[colIndex], width: newSize };
                  setLocalColumns(newColumns);
                }}
                onColumnOrdered={(dragColIndexCollection, dropColIndex) => {
                  console.log('Column ordered:', dragColIndexCollection, 'Drop at:', dropColIndex);
                  const newColumns = [...localColumns];
                  const draggedColumns = dragColIndexCollection.map((i) => newColumns[i]);
                  
                  const remainingColumns = newColumns.filter(
                    (_, i) => !dragColIndexCollection.includes(i)
                  );
                  
                  remainingColumns.splice(dropColIndex, 0, ...draggedColumns);
                  setLocalColumns(remainingColumns);
                }}
                onEditColumn={handleEditColumn}
                onDuplicateColumn={handleDuplicateColumn}
                onDeleteColumn={handleDeleteColumn}
                onStartEditColumn={handleStartEditColumn}
                onDelete={handleDeleteRow}
                onColumnHeaderMenuClick={(colIndex, bounds) => {
                  console.log('📋 列头右键菜单:', colIndex, bounds);
                }}
                onRowHeaderMenuClick={(rowIndex, position) => {
                  console.log('📋 行头右键菜单:', rowIndex, position);
                }}
                onCellContextMenu={(rowIndex, colIndex, position) => {
                  console.log('📋 单元格右键菜单:', rowIndex, colIndex, position);
                }}
              />
            </div>

            {/* 底部统计行 */}
            {showStatistics && (
              <StatisticsRow
                statistics={statistics}
                totalRecords={records.length}
                selectedRecords={selectedRows}
                onStatisticClick={(colIndex) => console.log('Statistic clicked:', colIndex)}
                onToggleStatistics={() => setShowStatistics(false)}
                width={1200}
              />
            )}
          </GridErrorBoundary>
        </GridStoreProvider>
      </div>

      {/* 说明面板 */}
      <div
        className="px-6 py-4 border-t"
        style={{ 
          backgroundColor: theme.columnHeaderBg,
          borderColor: theme.cellLineColor,
        }}
      >
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="text-sm font-semibold mb-2">✨ 新设计系统特性</h3>
            <ul className="space-y-1" style={{ color: theme.textColorSecondary }}>
              <li>• Lucide React 专业图标</li>
              <li>• Design Tokens 颜色系统</li>
              <li>• 流畅的 60fps 动画</li>
              <li>• 完整的暗色模式支持</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">📊 支持的列类型</h3>
            <ul className="space-y-1" style={{ color: theme.textColorSecondary }}>
              <li>• 文本、数字、货币、百分比</li>
              <li>• 布尔、单选、多选</li>
              <li>• 日期、时间、评分</li>
              <li>• 用户、链接、邮箱、电话</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-2">⚡ 交互功能</h3>
            <ul className="space-y-1" style={{ color: theme.textColorSecondary }}>
              <li>• 拖动调整列宽</li>
              <li>• 拖动重新排序列</li>
              <li>• 水平/垂直滚动</li>
              <li>• 虚拟滚动优化</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🆕 包裹 ThemeProvider
export default function FullFeatureGridExample() {
  return (
    <ThemeProvider defaultMode="system">
      <FullFeatureGridExampleContent />
    </ThemeProvider>
  );
}

