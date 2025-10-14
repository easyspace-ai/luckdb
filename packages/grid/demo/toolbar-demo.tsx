import React, { useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Grid, type IGridRef } from '../src/grid/core/Grid';
import { GridToolbar } from '../src/grid/components/toolbar/GridToolbar';
import { StatisticsRow, type IColumnStatistic } from '../src/grid/components/toolbar/StatisticsRow';
import type { IGridColumn } from '../src/grid/types/grid';
import type { ICell } from '../src/grid/renderers';
import { CellType } from '../src/grid/types';

const ToolbarDemo: React.FC = () => {
  const gridRef = useRef<IGridRef>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const [showStatistics, setShowStatistics] = useState(true);
  const [selectedRows, setSelectedRows] = useState(3);

  // 定义列
  const initialColumns: IGridColumn[] = [
    { id: 'task', name: '任务名称', width: 200, isPrimary: true, icon: '🔒' },
    { id: 'score', name: '评分', width: 100, icon: '📊' },
    { id: 'status', name: '状态', width: 120, icon: '📋' },
    { id: 'tags', name: '标签', width: 150, icon: '🏷️' },
    { id: 'checkbox', name: '完成', width: 80, icon: '☑️' },
    { id: 'rating', name: '评级', width: 120, icon: '⭐' },
  ];

  const [localColumns, setLocalColumns] = useState(initialColumns);

  // 模拟数据
  const records = [
    { id: '1', task: '实现登录功能', score: 85, status: '已完成', tags: ['前端', '后端'], checkbox: true, rating: 4 },
    { id: '2', task: '优化数据库查询', score: 92, status: '进行中', tags: ['后端', '性能'], checkbox: false, rating: 5 },
    { id: '3', task: '编写单元测试', score: 78, status: '已完成', tags: ['测试'], checkbox: true, rating: 3 },
    { id: '4', task: '设计UI界面', score: 88, status: '待处理', tags: ['UI', '设计'], checkbox: false, rating: 4 },
    { id: '5', task: '部署到生产环境', score: 95, status: '已完成', tags: ['运维'], checkbox: true, rating: 5 },
  ];

  // 统计数据
  const statistics: IColumnStatistic[] = [
    { columnId: 'score', columnIndex: 1, type: 'average', value: 87.6, label: '平均评分' },
    { columnId: 'score', columnIndex: 1, type: 'sum', value: 438, label: '总分' },
    { columnId: 'checkbox', columnIndex: 4, type: 'count', value: 3, label: '已完成' },
  ];

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
      case 'task':
        return {
          type: CellType.Text,
          data: String(value || ''),
          displayData: String(value || ''),
        };
      case 'score':
        return {
          type: CellType.Number,
          data: value as number,
          displayData: String(value || ''),
        };
      case 'status':
        return {
          type: CellType.Text,
          data: String(value || ''),
          displayData: String(value || ''),
        };
      case 'tags':
        return {
          type: CellType.Text,
          data: Array.isArray(value) ? value.join(', ') : '',
          displayData: Array.isArray(value) ? value.join(', ') : '',
        };
      case 'checkbox':
        return {
          type: CellType.Boolean,
          data: value as boolean,
          displayData: value ? '✓' : '',
        };
      case 'rating':
        return {
          type: CellType.Number,
          data: value as number,
          displayData: '⭐'.repeat((value as number) || 0),
        };
      default:
        return {
          type: CellType.Text,
          data: String(value || ''),
          displayData: String(value || ''),
        };
    }
  };

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
          🎛️ 工具栏和统计行演示
        </h1>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          演示头部工具栏和底部统计行的显示/隐藏功能
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
          <span style={{ fontSize: '14px', fontWeight: '500' }}>显示头部工具栏</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={showStatistics}
            onChange={(e) => setShowStatistics(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '14px', fontWeight: '500' }}>显示底部统计行</span>
        </label>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              setShowToolbar(!showToolbar);
              setShowStatistics(!showStatistics);
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
            切换全部
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
          minHeight: 0, // 关键：允许flex子元素收缩
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

        {/* 隐藏工具栏时显示展开按钮 */}
        {!showToolbar && (
          <div
            style={{
              padding: '8px 16px',
              borderBottom: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '14px', color: '#6b7280' }}>工具栏已隐藏</span>
            <button
              onClick={() => setShowToolbar(true)}
              style={{
                padding: '4px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ▼ 展开工具栏
            </button>
          </div>
        )}

        {/* Grid */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <Grid
            ref={gridRef}
            columns={localColumns}
            rowCount={records.length}
            getCellContent={getCellContent}
            freezeColumns={1}
            rowHeight={36}
            headerHeight={40}
            style={{
              width: '100%',
              height: '100%',
              overflow: 'auto', // 关键：让Grid内部显示滚动条
            }}
            onCellEdited={(cell, newValue) => {
              console.log('Cell edited:', cell, newValue);
            }}
            onSelectionChanged={(selection) => {
              console.log('Selection changed:', selection);
              // 模拟选择行数变化
              if (selection.ranges && selection.ranges.length > 0) {
                const totalRows = selection.ranges.reduce((sum, range) => {
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
            // 列宽调整
            onColumnResize={(column, newSize, colIndex) => {
              console.log('Column resized:', column.name, 'New width:', newSize);
              const newColumns = [...localColumns];
              newColumns[colIndex] = { ...newColumns[colIndex], width: newSize };
              setLocalColumns(newColumns);
            }}
            // 列拖动排序
            onColumnOrdered={(dragColIndexCollection, dropColIndex) => {
              console.log('Column ordered:', dragColIndexCollection, 'Drop at:', dropColIndex);
              const newColumns = [...localColumns];
              const draggedColumns = dragColIndexCollection.map((i) => newColumns[i]);
              
              // 移除拖动的列
              const remainingColumns = newColumns.filter(
                (_, i) => !dragColIndexCollection.includes(i)
              );
              
              // 在目标位置插入
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

        {/* 隐藏统计行时显示展开按钮 */}
        {!showStatistics && (
          <div
            style={{
              padding: '6px 16px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: '13px', color: '#6b7280' }}>统计行已隐藏</span>
            <button
              onClick={() => setShowStatistics(true)}
              style={{
                padding: '4px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              ▲ 展开统计
            </button>
          </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '13px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>📊 统计信息</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>总记录数: {records.length} 条</li>
              <li>已选记录: {selectedRows} 条</li>
              <li>平均评分: 87.6 分</li>
              <li>已完成任务: 3 个</li>
            </ul>
          </div>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0' }}>🎯 功能说明</h3>
            <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
              <li>点击工具栏右侧 ▲ 按钮可隐藏工具栏</li>
              <li>点击统计行右侧 ▼ 按钮可隐藏统计行</li>
              <li>使用顶部控制面板快速切换显示状态</li>
              <li>支持独立控制工具栏和统计行的显示</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// 挂载应用
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<ToolbarDemo />);
}

