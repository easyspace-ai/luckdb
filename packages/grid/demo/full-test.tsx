import React, { useState, useRef, useMemo, useCallback } from 'react';
import { Grid, type IGridRef } from '../src/grid/core/Grid';
import { GridToolbar } from '../src/grid/components/toolbar/GridToolbar';
import { StatisticsRow, type IColumnStatistic } from '../src/grid/components/toolbar/StatisticsRow';
import type { IGridColumn } from '../src/grid/types/grid';
import type { ICell } from '../src/grid/renderers';
import { CellType } from '../src/grid/types';
import type { ICellItem } from '../src/grid/types';

export const FullTestDemo: React.FC = () => {
  const gridRef = useRef<IGridRef>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showStatistics, setShowStatistics] = useState(true);
  const [selectedRows, setSelectedRows] = useState(0);

  // 定义所有支持的列类型
  const initialColumns: IGridColumn[] = [
    // 基础列
    { id: 'id', name: 'ID', width: 80, isPrimary: true, icon: '🔑' },
    { id: 'title', name: '标题', width: 200, icon: '📝' },
    { id: 'description', name: '描述', width: 250, icon: '📄' },
    
    // 数字列
    { id: 'number', name: '数字', width: 100, icon: '🔢' },
    { id: 'currency', name: '金额', width: 120, icon: '💰' },
    { id: 'percentage', name: '百分比', width: 100, icon: '📊' },
    
    // 布尔列
    { id: 'isActive', name: '激活', width: 80, icon: '✓' },
    { id: 'isCompleted', name: '完成', width: 80, icon: '☑️' },
    
    // 选择列
    { id: 'status', name: '状态', width: 120, icon: '📋' },
    { id: 'priority', name: '优先级', width: 100, icon: '🎯' },
    { id: 'category', name: '分类', width: 120, icon: '📁' },
    
    // 多选列
    { id: 'tags', name: '标签', width: 180, icon: '🏷️' },
    { id: 'labels', name: '标记', width: 150, icon: '🔖' },
    
    // 日期列
    { id: 'createdAt', name: '创建时间', width: 180, icon: '📅' },
    { id: 'updatedAt', name: '更新时间', width: 180, icon: '🕐' },
    { id: 'dueDate', name: '截止日期', width: 150, icon: '⏰' },
    
    // 评分列
    { id: 'rating', name: '评分', width: 120, icon: '⭐' },
    { id: 'quality', name: '质量', width: 120, icon: '💎' },
    
    // 用户列
    { id: 'assignee', name: '负责人', width: 150, icon: '👤' },
    { id: 'creator', name: '创建者', width: 150, icon: '👨‍💼' },
    
    // 其他列
    { id: 'url', name: '链接', width: 200, icon: '🔗' },
    { id: 'email', name: '邮箱', width: 200, icon: '📧' },
    { id: 'phone', name: '电话', width: 150, icon: '📱' },
    { id: 'progress', name: '进度', width: 100, icon: '📈' },
  ];

  const [localColumns, setLocalColumns] = useState(initialColumns);

  // 生成大量测试数据 (200条)
  const generateRecords = (count: number) => {
    const statuses = ['待处理', '进行中', '已完成', '已取消', '暂停'];
    const priorities = ['低', '中', '高', '紧急'];
    const categories = ['开发', '设计', '测试', '运维', '产品', '市场'];
    const tagOptions = ['前端', '后端', '移动端', 'API', 'UI', 'UX', '性能', '安全', '数据库', '缓存'];
    const labelOptions = ['bug', 'feature', 'enhancement', 'documentation', 'refactor', 'hotfix'];
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
    
    const records = [];
    for (let i = 1; i <= count; i++) {
      const randomTags = tagOptions
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 4) + 1);
      
      const randomLabels = labelOptions
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 1);

      records.push({
        id: `T-${String(i).padStart(4, '0')}`,
        title: `任务 ${i} - ${['实现', '优化', '修复', '设计', '测试'][i % 5]}${['登录功能', '数据库', '界面', '性能', 'API'][i % 5]}`,
        description: `这是第 ${i} 个任务的详细描述，包含更多信息...`,
        number: Math.floor(Math.random() * 1000),
        currency: (Math.random() * 10000).toFixed(2),
        percentage: Math.floor(Math.random() * 100),
        isActive: Math.random() > 0.3,
        isCompleted: Math.random() > 0.5,
        status: statuses[i % statuses.length],
        priority: priorities[i % priorities.length],
        category: categories[i % categories.length],
        tags: randomTags,
        labels: randomLabels,
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString(),
        rating: Math.floor(Math.random() * 5) + 1,
        quality: Math.floor(Math.random() * 5) + 1,
        assignee: names[i % names.length],
        creator: names[(i + 2) % names.length],
        url: `https://example.com/task/${i}`,
        email: `user${i}@example.com`,
        phone: `138${String(i).padStart(8, '0')}`,
        progress: Math.floor(Math.random() * 100),
      });
    }
    return records;
  };

  // 使用 state 管理数据，这样编辑才能生效
  const [records, setRecords] = useState(() => generateRecords(200));

  // 统计数据 - 使用 useMemo 确保基于最新数据计算
  const statistics: IColumnStatistic[] = useMemo(() => [
    { columnId: 'number', columnIndex: 3, type: 'average', value: records.reduce((sum, r) => sum + r.number, 0) / records.length, label: '平均数字' },
    { columnId: 'number', columnIndex: 3, type: 'sum', value: records.reduce((sum, r) => sum + r.number, 0), label: '总和' },
    { columnId: 'isCompleted', columnIndex: 7, type: 'count', value: records.filter(r => r.isCompleted).length, label: '已完成' },
    { columnId: 'rating', columnIndex: 17, type: 'average', value: records.reduce((sum, r) => sum + r.rating, 0) / records.length, label: '平均评分' },
  ], [records]);

  const getCellContent = (cell: [number, number]): ICell => {
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

    const value = record[column.id as keyof typeof record];

    switch (column.id) {
      // 文本列
      case 'id':
      case 'title':
      case 'description':
      case 'url':
      case 'email':
      case 'phone':
        return {
          type: CellType.Text,
          data: String(value || ''),
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
          data: parseFloat(value as string),
          displayData: `¥${value}`,
        };

      // 布尔列
      case 'isActive':
      case 'isCompleted':
        return {
          type: CellType.Boolean,
          data: value as boolean,
          displayData: value ? '✓' : '',
        };

      // 单选列
      case 'status':
      case 'priority':
      case 'category': {
        const strValue = String(value || '');
        
        // 定义所有可用选项（根据列类型）
        let allChoices: Array<{ id: string; name: string; color: string; backgroundColor: string }> = [];
        
        if (column.id === 'status') {
          allChoices = [
            { id: '待处理', name: '待处理', color: '#94a3b8', backgroundColor: '#f1f5f9' },
            { id: '进行中', name: '进行中', color: '#3b82f6', backgroundColor: '#dbeafe' },
            { id: '已完成', name: '已完成', color: '#22c55e', backgroundColor: '#dcfce7' },
            { id: '已取消', name: '已取消', color: '#6b7280', backgroundColor: '#f3f4f6' },
            { id: '暂停', name: '暂停', color: '#f59e0b', backgroundColor: '#fef3c7' },
          ];
        } else if (column.id === 'priority') {
          allChoices = [
            { id: '低', name: '低', color: '#06b6d4', backgroundColor: '#cffafe' },
            { id: '中', name: '中', color: '#f59e0b', backgroundColor: '#fef3c7' },
            { id: '高', name: '高', color: '#ef4444', backgroundColor: '#fee2e2' },
            { id: '紧急', name: '紧急', color: '#dc2626', backgroundColor: '#fee2e2' },
          ];
        } else {
          allChoices = [
            { id: '开发', name: '开发', color: '#3b82f6', backgroundColor: '#dbeafe' },
            { id: '设计', name: '设计', color: '#8b5cf6', backgroundColor: '#ede9fe' },
            { id: '测试', name: '测试', color: '#14b8a6', backgroundColor: '#ccfbf1' },
            { id: '运维', name: '运维', color: '#f59e0b', backgroundColor: '#fef3c7' },
            { id: '产品', name: '产品', color: '#ec4899', backgroundColor: '#fce7f3' },
            { id: '市场', name: '市场', color: '#22c55e', backgroundColor: '#dcfce7' },
          ];
        }
        
        // 构建 choiceMap（id 和 name 都是显示文本）
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

      // 多选列（标签）- 使用 CellType.Select + isMultiple: true
      case 'tags': {
        const arrValue = Array.isArray(value) ? value : [];
        const tagOptions = ['前端', '后端', '移动端', 'API', 'UI', 'UX', '性能', '安全', '数据库', '缓存'];
        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#22c55e', '#ef4444', '#06b6d4', '#f97316', '#84cc16'];
        const choiceSorted = tagOptions.map((tag, idx) => ({
          id: tag,
          name: tag,
          color: colors[idx % colors.length],
        }));
        return {
          type: CellType.Select,
          data: arrValue,
          displayData: arrValue,
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
        return {
          type: CellType.Select,
          data: arrValue,
          displayData: arrValue,
          choiceSorted,
          isMultiple: true,
        };
      }

      // 日期列
      case 'createdAt':
      case 'updatedAt':
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
  };

  // 处理单元格编辑 - 更新 records state
  const handleCellEdited = useCallback((cell: ICellItem, newCell: ICell) => {
    const [columnIndex, rowIndex] = cell;
    const column = localColumns[columnIndex];
    if (!column) return;

    const columnId = column.id;

    setRecords((prevRecords) => {
      const newRecords = [...prevRecords];
      const record = newRecords[rowIndex];
      if (!record) return prevRecords;

      // 根据不同的列类型提取正确的值
      let newValue: any;
      
      switch (column.id) {
        case 'tags':
        case 'labels': {
          // 多选字段：data 是数组，包含选中的 ID，需要映射回显示文本
          if (Array.isArray(newCell.data)) {
            // 从 choiceSorted 中找到对应的 name 数组
            if ('choiceSorted' in newCell && Array.isArray(newCell.choiceSorted)) {
              newValue = newCell.data.map((id: string) => {
                const choice = newCell.choiceSorted.find((c: any) => c.id === id);
                return choice ? choice.name : id;
              });
            } else {
              newValue = newCell.data;
            }
          } else {
            newValue = [];
          }
          break;
        }
        
        case 'status':
        case 'priority':
        case 'category': {
          // 单选字段：data 是数组，包含选中的 ID，需要映射回显示文本
          if (Array.isArray(newCell.data) && newCell.data.length > 0) {
            const selectedId = newCell.data[0];
            // 从 choiceSorted 中找到对应的 name
            if ('choiceSorted' in newCell && Array.isArray(newCell.choiceSorted)) {
              const choice = newCell.choiceSorted.find((c: any) => c.id === selectedId);
              newValue = choice ? choice.name : selectedId;
            } else {
              newValue = selectedId;
            }
          } else {
            newValue = '';
          }
          break;
        }
        
        case 'isActive':
        case 'isCompleted':
          // 布尔字段：data 是 boolean
          newValue = Boolean(newCell.data);
          break;
        
        case 'rating':
        case 'quality':
        case 'number':
        case 'percentage':
        case 'progress':
          // 数字字段
          newValue = typeof newCell.data === 'number' ? newCell.data : Number(newCell.data) || 0;
          break;
        
        case 'assignee':
        case 'creator':
          // 用户字段：data 是用户对象数组，取第一个的 name
          if (Array.isArray(newCell.data) && newCell.data.length > 0) {
            newValue = newCell.data[0].name;
          } else {
            newValue = '';
          }
          break;
        
        default:
          // 文本字段：直接使用 data
          newValue = newCell.data;
          break;
      }

      // 更新记录
      newRecords[rowIndex] = {
        ...record,
        [columnId]: newValue,
      };

      console.log('✅ Cell updated:', { columnId, rowIndex, oldValue: record[columnId as keyof typeof record], newValue });
      return newRecords;
    });
  }, [localColumns]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f5f5f5',
      }}
    >
      {/* 页面标题 */}
      <div
        style={{
          padding: '16px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '2px solid #e5e7eb',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 8px 0' }}>
          🧪 完整功能测试 - 虚拟滚动演示
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          测试所有列类型和虚拟滚动功能 - {localColumns.length} 列 × {records.length} 行
        </p>
      </div>

      {/* 控制面板 */}
      <div
        style={{
          padding: '12px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showToolbar}
            onChange={(e) => setShowToolbar(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>显示工具栏</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showStatistics}
            onChange={(e) => setShowStatistics(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>显示统计</span>
        </label>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            已选: {selectedRows} 行
          </span>
          <button
            onClick={() => {
              if (gridRef.current) {
                console.log('Grid ref:', gridRef.current);
              }
            }}
            style={{
              padding: '6px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            测试 Grid API
          </button>
        </div>
      </div>

      {/* Grid容器 */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          margin: '16px 24px',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* 头部工具栏 */}
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
          />
        )}

        {/* Grid */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <Grid
            ref={gridRef}
            columns={localColumns}
            rowCount={records.length}
            getCellContent={getCellContent}
            freezeColumns={2}
            rowHeight={36}
            headerHeight={40}
            style={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
            }}
            onCellEdited={handleCellEdited}
            onSelectionChanged={(selection) => {
              console.log('Selection changed:', selection);
              if (selection.ranges && selection.ranges.length > 0) {
                const totalRows = selection.ranges.reduce((sum, range) => {
                  // 防御性检查：确保 range.start 和 range.end 存在
                  if (range && range.start && range.end && 
                      typeof range.start.row === 'number' && 
                      typeof range.end.row === 'number') {
                    return sum + (range.end.row - range.start.row + 1);
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
      </div>

      {/* 说明面板 */}
      <div
        style={{
          padding: '16px 24px',
          backgroundColor: '#ffffff',
          borderTop: '1px solid #e5e7eb',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', fontSize: '13px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>📊 数据规模</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>列数: {localColumns.length} 列</li>
              <li>行数: {records.length} 行</li>
              <li>单元格: {localColumns.length * records.length} 个</li>
              <li>虚拟滚动: ✅ 已启用</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>🎯 支持的列类型</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>文本、数字、货币、百分比</li>
              <li>布尔、单选、多选</li>
              <li>日期、时间、评分</li>
              <li>用户、链接、邮箱、电话</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>⚡ 功能测试</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>拖动调整列宽</li>
              <li>拖动重新排序列</li>
              <li>水平/垂直滚动</li>
              <li>选择单元格/行</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

