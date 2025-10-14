import React from 'react';
import ReactDOM from 'react-dom/client';
import { Grid } from '../src/grid/core/Grid';
import { GridToolbar } from '../src/grid/components/toolbar/GridToolbar';
import { StatisticsRow } from '../src/grid/components/toolbar/StatisticsRow';
import { CellType } from '../src/grid/types';
import type { IColumn, ICell } from '../src/grid/types';

// 创建测试数据
const createColumns = (): IColumn[] => [
  { id: 'id', name: 'ID', width: 80, isPrimary: true },
  { id: 'name', name: '名称', width: 150 },
  { id: 'score', name: '评分', width: 100 },
  { id: 'status', name: '状态', width: 120 },
];

const createRecords = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `${i + 1}`,
    name: `项目 ${i + 1}`,
    score: Math.floor(80 + Math.random() * 20),
    status: i % 2 === 0 ? '已完成' : '进行中',
  }));

// Grid组件包装器
const GridContainer: React.FC<{ containerId: string; title: string }> = ({ containerId, title }) => {
  const [showToolbar, setShowToolbar] = React.useState(true);
  const [showStats, setShowStats] = React.useState(true);
  const columns = createColumns();
  const records = createRecords(10);

  const getCellContent = ([col, row]: readonly [number, number]): ICell => {
    const record = records[row];
    const column = columns[col];
    
    if (!record || !column) {
      return { type: CellType.Text, data: '', displayData: '' };
    }

    const value = record[column.id as keyof typeof record];
    return {
      type: CellType.Text,
      data: String(value),
      displayData: String(value),
    };
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {showToolbar && (
        <GridToolbar
          onFieldConfig={() => console.log('Field config')}
          onFilter={() => console.log('Filter')}
          onSort={() => console.log('Sort')}
          onGroup={() => console.log('Group')}
          onSearch={() => console.log('Search')}
          onFullscreen={() => console.log('Fullscreen')}
          onShare={() => console.log('Share')}
          onAPI={() => console.log('API')}
          onCollaboration={() => console.log('Collaboration')}
          onUndo={() => console.log('Undo')}
          onRedo={() => console.log('Redo')}
          onAddNew={() => console.log('Add new')}
          onToggleToolbar={() => setShowToolbar(false)}
        />
      )}
      
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Grid
          columns={columns}
          rowCount={records.length}
          getCellContent={getCellContent}
          freezeColumns={1}
          rowHeight={32}
          headerHeight={36}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {showStats && (
        <StatisticsRow
          totalRecords={records.length}
          selectedRecords={0}
          statistics={[
            { columnId: 'score', columnIndex: 2, type: 'average', value: 88.5, label: '平均分' },
          ]}
          onToggleStatistics={() => setShowStats(false)}
        />
      )}
    </div>
  );
};

// 渲染到所有测试容器
const containers = ['container-1', 'container-2', 'container-3', 'container-4'];

containers.forEach((containerId, index) => {
  const element = document.getElementById(containerId);
  if (element) {
    const root = ReactDOM.createRoot(element);
    root.render(<GridContainer containerId={containerId} title={`Test ${index + 1}`} />);
  }
});

