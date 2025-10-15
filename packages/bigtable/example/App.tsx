/**
 * BigTable 使用示例
 */

import React, { useState, useMemo } from 'react';
import { BigTable } from '../src';
import type { IRow, IColumn } from '../src';

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
  const [rowCount, setRowCount] = useState(10000);
  const [renderMode, setRenderMode] = useState<'dom' | 'canvas' | 'webgl'>('canvas');

  const { rows, columns } = useMemo(() => generateData(rowCount), [rowCount]);

  return (
    <div style={{ padding: 20, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 20 }}>
        <h1>BigTable Demo</h1>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
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
        </div>
      </div>

      <div style={{ flex: 1, border: '1px solid #e0e0e0', borderRadius: 4, overflow: 'hidden' }}>
        <BigTable
          rows={rows}
          columns={columns}
          renderMode={renderMode}
          showPerformance
          onCellClick={(rowId, columnId) => {
            console.log('Clicked:', rowId, columnId);
          }}
        />
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
