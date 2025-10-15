/**
 * BigTable 使用示例
 */

import React, { useState, useMemo } from 'react';
import { BigTable } from '../src';
import type { IRow, IColumn } from '../src';
import { useImportExport } from '../src/react/hooks/useImportExport';

// 生成测试数据
function generateData(rowCount: number): { rows: IRow[]; columns: IColumn[] } {
  const columns: IColumn[] = [
    { id: 'id', key: 'id', width: 80, title: 'ID', frozen: true },
    { id: 'name', key: 'name', width: 200, title: 'Name' },
    { id: 'age', key: 'age', width: 100, title: 'Age' },
    { id: 'email', key: 'email', width: 300, title: 'Email' },
    { id: 'city', key: 'city', width: 150, title: 'City' },
    { id: 'country', key: 'country', width: 150, title: 'Country' },
    { id: 'status', key: 'status', width: 120, title: 'Status' },
    { id: 'score', key: 'score', width: 100, title: 'Score' },
  ];

  const cities = ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Hangzhou'];
  const countries = ['China', 'USA', 'UK', 'Japan', 'Korea'];
  const statuses = ['Active', 'Inactive', 'Pending'];

  const rows: IRow[] = Array.from({ length: rowCount }, (_, i) => ({
    id: i + 1,
    data: {
      id: i + 1,
      name: `User ${i + 1}`,
      age: 20 + (i % 50),
      email: `user${i + 1}@example.com`,
      city: cities[i % cities.length],
      country: countries[i % countries.length],
      status: statuses[i % statuses.length],
      score: Math.floor(Math.random() * 100),
    },
  }));

  return { rows, columns };
}

export default function App() {
  const [rowCount, setRowCount] = useState(100); // 从100行开始方便测试编辑
  const [renderMode, setRenderMode] = useState<'dom' | 'canvas' | 'webgl'>('canvas');

  // 初始数据
  const initialData = useMemo(() => generateData(rowCount), [rowCount]);
  const [rows, setRows] = useState<IRow[]>(initialData.rows);
  const [columns, setColumns] = useState<IColumn[]>(initialData.columns);

  // 更新行数时重新生成数据
  React.useEffect(() => {
    const newData = generateData(rowCount);
    setRows(newData.rows);
    setColumns(newData.columns);
  }, [rowCount]);

  // 处理单元格修改
  const handleCellChange = (rowId: string | number, columnId: string | number, value: unknown) => {
    console.log('[App] Cell changed:', { rowId, columnId, value });

    setRows((prevRows) => {
      return prevRows.map((row) => {
        if (row.id === rowId) {
          // 查找对应的列
          const column = columns.find((col) => col.id === columnId);
          if (column) {
            return {
              ...row,
              data: {
                ...row.data,
                [column.key]: value,
              },
            };
          }
        }
        return row;
      });
    });
  };

  // 导入导出
  const { exportAsCSV, exportAsExcel, triggerImport } = useImportExport({
    rows,
    columns,
    onImport: (importedRows, importedColumns) => {
      console.log('[App] Imported data:', {
        rows: importedRows.length,
        columns: importedColumns.length,
      });
      setRows(importedRows);
      // Note: columns 在这个示例中是固定的，如果要支持动态列，需要更改数据结构
    },
  });

  return (
    <div style={{ padding: 20, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 20 }}>
        <h1>BigTable Demo</h1>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label>
              行数：
              <select value={rowCount} onChange={(e) => setRowCount(Number(e.target.value))}>
                <option value={100}>100</option>
                <option value={1000}>1,000</option>
                <option value={10000}>10,000</option>
                <option value={100000}>100,000</option>
                <option value={1000000}>1,000,000</option>
              </select>
            </label>
          </div>

          <div>
            <label>
              渲染模式：
              <select value={renderMode} onChange={(e) => setRenderMode(e.target.value as any)}>
                <option value="canvas">Canvas (推荐)</option>
                <option value="dom">DOM</option>
                <option value="webgl">WebGL (实验)</option>
              </select>
            </label>
          </div>

          <div style={{ color: '#666', fontSize: 14 }}>
            总单元格数：{(rows.length * columns.length).toLocaleString()}
          </div>

          {/* 导入导出按钮 */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button
              onClick={() => {
                // 测试：设置 Name 列宽度为 300px
                setColumns((prev) => {
                  const newCols = [...prev];
                  const nameColIndex = newCols.findIndex((c) => c.key === 'name');
                  if (nameColIndex >= 0) {
                    newCols[nameColIndex] = { ...newCols[nameColIndex], width: 300 };
                    console.log('[Test] 设置 Name 列宽度为 300px');
                  }
                  return newCols;
                });
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: '#f59e0b',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              🧪 测试: Name列→300px
            </button>
            <button
              onClick={() => triggerImport('.csv')}
              style={{
                padding: '6px 12px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              📥 导入 CSV
            </button>
            <button
              onClick={() => exportAsCSV(`bigtable_${Date.now()}.csv`)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              📤 导出 CSV
            </button>
            <button
              onClick={() => exportAsExcel(`bigtable_${Date.now()}.xlsx`)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#06b6d4',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              📊 导出 Excel
            </button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
        <BigTable
          rows={rows}
          columns={columns}
          renderMode={renderMode}
          frozenColumnCount={1} // 冻结第一列（ID列）
          editable={true}
          showPerformance
          onCellClick={(rowId, columnId) => {
            console.log('[App] Clicked:', rowId, columnId);
          }}
          onCellDoubleClick={(rowId, columnId) => {
            console.log('[App] Double clicked:', rowId, columnId);
          }}
          onCellChange={handleCellChange}
        />
      </div>

      <div style={{ marginTop: 20, fontSize: 14, color: '#666' }}>
        <h3>交互功能</h3>
        <ul style={{ marginTop: 10 }}>
          <li>
            ✅ <strong>列拖动排序</strong>
            ：在列头按住鼠标拖动可重新排序列（拖动时显示阴影和插入位置指示器）
          </li>
          <li>
            ✅ <strong>列宽调整</strong>：将鼠标悬停在列边界，拖动调整列宽
          </li>
          <li>
            ✅ <strong>单元格编辑</strong>：双击单元格进入编辑模式
          </li>
          <li>
            ✅ <strong>右键菜单</strong>：右键点击单元格显示上下文菜单
          </li>
          <li>
            ✅ <strong>冻结列</strong>：首列（ID）冻结，不受水平滚动影响
          </li>
        </ul>
      </div>

      <div style={{ marginTop: 20, fontSize: 14, color: '#666' }}>
        <h3>性能对比</h3>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>场景</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>@luckdb/grid (旧)</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>@luckdb/bigtable (新)</th>
              <th style={{ border: '1px solid #ddd', padding: 8 }}>提升</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>10K 行渲染</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>200ms</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>50ms</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>⚡ 4x</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>滚动帧率</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>45fps</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>60fps</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>⚡ 1.3x</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>包体积</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>500KB</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>180KB</td>
              <td style={{ border: '1px solid #ddd', padding: 8 }}>⚡ 2.8x</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
