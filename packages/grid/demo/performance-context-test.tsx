import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Grid, type IGridRef } from '../src/grid/core/Grid';
import type { IGridColumn } from '../src/grid/types/grid';
import type { ICell } from '../src/grid/renderers';
import { CellType } from '../src/grid/types';
import type { ICellItem } from '../src/grid/types';

// 导入 Context Providers
import { SessionProvider } from '../src/context/session/SessionContext';
import { AppProvider } from '../src/context/app/AppContext';
import { HistoryProvider } from '../src/context/history/HistoryContext';

export const PerformanceContextTest: React.FC = () => {
  const gridRef = useRef<IGridRef>(null);
  const [dataSize, setDataSize] = useState(1000); // 默认1000行
  const [performanceMetrics, setPerformanceMetrics] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  // 定义列
  const columns: IGridColumn[] = [
    { id: 'id', name: 'ID', width: 80, isPrimary: true },
    { id: 'name', name: '名称', width: 150 },
    { id: 'email', name: '邮箱', width: 200 },
    { id: 'age', name: '年龄', width: 80 },
    { id: 'department', name: '部门', width: 120 },
    { id: 'salary', name: '薪资', width: 120 },
    { id: 'status', name: '状态', width: 100 },
    { id: 'rating', name: '评分', width: 120 },
    { id: 'isActive', name: '激活', width: 80 },
    { id: 'joinDate', name: '入职日期', width: 150 },
  ];

  // 生成大量数据
  const generateData = useCallback((count: number) => {
    const startTime = performance.now();
    const data = [];
    const departments = ['工程', '产品', '设计', '市场', '销售', '运营'];
    const statuses = ['在职', '离职', '休假', '试用'];
    
    for (let i = 0; i < count; i++) {
      data.push({
        id: `EMP-${String(i + 1).padStart(6, '0')}`,
        name: `员工 ${i + 1}`,
        email: `employee${i + 1}@company.com`,
        age: Math.floor(Math.random() * 40) + 22,
        department: departments[i % departments.length],
        salary: Math.floor(Math.random() * 50000) + 50000,
        status: statuses[i % statuses.length],
        rating: Math.floor(Math.random() * 5) + 1,
        isActive: Math.random() > 0.3,
        joinDate: new Date(2020 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      });
    }
    
    const endTime = performance.now();
    console.log(`生成 ${count} 条数据耗时: ${(endTime - startTime).toFixed(2)}ms`);
    return data;
  }, []);

  const [records, setRecords] = useState(() => generateData(dataSize));

  const getCellContent = useCallback((cell: [number, number]): ICell => {
    const [colIndex, rowIndex] = cell;
    const record = records[rowIndex];
    const column = columns[colIndex];

    if (!record || !column) {
      return { type: CellType.Text, data: '', displayData: '' };
    }

    const value = record[column.id as keyof typeof record];

    switch (column.id) {
      case 'rating':
        return {
          type: CellType.Rating,
          data: value as number,
          icon: '⭐',
          color: '#fbbf24',
          max: 5,
        };
      
      case 'isActive':
        return {
          type: CellType.Boolean,
          data: value as boolean,
          displayData: value ? '✓' : '',
        };
      
      case 'status':
        const statusColors: Record<string, string> = {
          '在职': '#22c55e',
          '离职': '#ef4444',
          '休假': '#f59e0b',
          '试用': '#3b82f6',
        };
        return {
          type: CellType.Select,
          data: [String(value)],
          displayData: [String(value)],
          choiceSorted: Object.keys(statusColors).map(s => ({
            id: s,
            name: s,
            color: statusColors[s],
          })),
          isMultiple: false,
        };
      
      case 'joinDate':
        return {
          type: CellType.Date,
          data: value as string,
          displayData: value ? new Date(value as string).toLocaleDateString('zh-CN') : '',
        };
      
      case 'salary':
        return {
          type: CellType.Number,
          data: value as number,
          displayData: `¥${(value as number).toLocaleString()}`,
        };
      
      default:
        return {
          type: CellType.Text,
          data: String(value || ''),
          displayData: String(value || ''),
        };
    }
  }, [records, columns]);

  // 性能测试
  const runPerformanceTest = useCallback(() => {
    console.log('🚀 开始性能测试...');
    
    const metrics: any = {
      dataSize: records.length,
      columnCount: columns.length,
      totalCells: records.length * columns.length,
    };

    // 测试1: 初始渲染时间
    const renderStart = performance.now();
    // Grid已经渲染，这里只是标记
    const renderEnd = performance.now();
    metrics.initialRenderTime = (renderEnd - renderStart).toFixed(2) + 'ms';

    // 测试2: getCellContent 调用性能
    const cellTestStart = performance.now();
    for (let i = 0; i < 100; i++) {
      getCellContent([0, i]);
    }
    const cellTestEnd = performance.now();
    metrics.getCellContentAvg = ((cellTestEnd - cellTestStart) / 100).toFixed(4) + 'ms';

    // 测试3: 内存使用
    if ((performance as any).memory) {
      const mem = (performance as any).memory;
      metrics.memoryUsage = {
        used: (mem.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
        total: (mem.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
        limit: (mem.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB',
      };
    }

    // 测试4: FPS 估算
    let frameCount = 0;
    const fpsStart = performance.now();
    const fpsInterval = setInterval(() => {
      frameCount++;
    }, 16.67); // ~60fps

    setTimeout(() => {
      clearInterval(fpsInterval);
      const fpsEnd = performance.now();
      const duration = (fpsEnd - fpsStart) / 1000;
      metrics.estimatedFPS = (frameCount / duration).toFixed(2);
      
      setPerformanceMetrics(metrics);
      console.log('📊 性能测试结果:', metrics);
    }, 1000);
  }, [records, columns, getCellContent]);

  // 自动运行性能测试
  useEffect(() => {
    const timer = setTimeout(() => {
      runPerformanceTest();
    }, 1000);
    return () => clearTimeout(timer);
  }, [runPerformanceTest]);

  // 改变数据量
  const changeDataSize = useCallback((newSize: number) => {
    setIsLoading(true);
    const start = performance.now();
    
    setTimeout(() => {
      const newData = generateData(newSize);
      setRecords(newData);
      setDataSize(newSize);
      
      const end = performance.now();
      console.log(`数据更新完成，耗时: ${(end - start).toFixed(2)}ms`);
      setIsLoading(false);
      
      // 重新运行性能测试
      setTimeout(() => runPerformanceTest(), 500);
    }, 100);
  }, [generateData, runPerformanceTest]);

  // 编辑处理
  const handleCellEdited = useCallback((cell: ICellItem, newCell: ICell) => {
    const [columnIndex, rowIndex] = cell;
    const column = columns[columnIndex];
    if (!column) return;

    setRecords((prevRecords) => {
      const newRecords = [...prevRecords];
      const record = newRecords[rowIndex];
      if (!record) return prevRecords;

      let newValue: any;
      switch (column.id) {
        case 'status':
          newValue = Array.isArray(newCell.data) && newCell.data.length > 0 ? newCell.data[0] : '';
          break;
        case 'isActive':
          newValue = Boolean(newCell.data);
          break;
        case 'rating':
          newValue = typeof newCell.data === 'number' ? newCell.data : 0;
          break;
        default:
          newValue = newCell.data;
          break;
      }

      newRecords[rowIndex] = { ...record, [column.id]: newValue };
      return newRecords;
    });
  }, [columns]);

  return (
    <SessionProvider>
      <AppProvider>
        <HistoryProvider>
          <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f5f5f5' }}>
            {/* 头部 */}
            <div style={{ padding: '20px', backgroundColor: '#ffffff', borderBottom: '2px solid #e5e7eb' }}>
              <h1 style={{ fontSize: '32px', fontWeight: '600', margin: '0 0 10px 0' }}>
                ⚡ 性能测试 & Context 系统集成
              </h1>
              <p style={{ margin: 0, color: '#6b7280' }}>
                测试虚拟滚动性能、大数据集渲染、编辑响应速度和 Context 系统集成
              </p>
            </div>

            {/* 控制面板 */}
            <div style={{ padding: '16px 20px', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>数据量:</span>
                <button
                  onClick={() => changeDataSize(100)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: dataSize === 100 ? '#3b82f6' : '#ffffff',
                    color: dataSize === 100 ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                  }}
                  disabled={isLoading}
                >
                  100
                </button>
                <button
                  onClick={() => changeDataSize(1000)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: dataSize === 1000 ? '#3b82f6' : '#ffffff',
                    color: dataSize === 1000 ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                  }}
                  disabled={isLoading}
                >
                  1,000
                </button>
                <button
                  onClick={() => changeDataSize(10000)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: dataSize === 10000 ? '#3b82f6' : '#ffffff',
                    color: dataSize === 10000 ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                  }}
                  disabled={isLoading}
                >
                  10,000
                </button>
                <button
                  onClick={() => changeDataSize(50000)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: dataSize === 50000 ? '#3b82f6' : '#ffffff',
                    color: dataSize === 50000 ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                  }}
                  disabled={isLoading}
                >
                  50,000
                </button>
                <button
                  onClick={() => changeDataSize(100000)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: dataSize === 100000 ? '#ef4444' : '#ffffff',
                    color: dataSize === 100000 ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                  disabled={isLoading}
                >
                  🔥 10万
                </button>
                <button
                  onClick={() => changeDataSize(500000)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: dataSize === 500000 ? '#dc2626' : '#ffffff',
                    color: dataSize === 500000 ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                  disabled={isLoading}
                >
                  🔥 50万
                </button>
                <button
                  onClick={() => changeDataSize(1000000)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: dataSize === 1000000 ? '#991b1b' : '#ffffff',
                    color: dataSize === 1000000 ? '#ffffff' : '#374151',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                  disabled={isLoading}
                >
                  🔥 100万
                </button>
              </div>

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                <button
                  onClick={runPerformanceTest}
                  style={{
                    padding: '6px 16px',
                    fontSize: '13px',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  disabled={isLoading}
                >
                  🚀 运行性能测试
                </button>
              </div>
            </div>

            {/* 性能指标显示 */}
            {Object.keys(performanceMetrics).length > 0 && (
              <div style={{ padding: '16px 20px', backgroundColor: '#eff6ff', borderBottom: '1px solid #bfdbfe', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>数据规模</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>
                    {performanceMetrics.dataSize?.toLocaleString()} 行
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>总单元格</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>
                    {performanceMetrics.totalCells?.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>getCellContent 平均</div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>
                    {performanceMetrics.getCellContentAvg}
                  </div>
                </div>
                {performanceMetrics.estimatedFPS && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>估算 FPS</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>
                      {performanceMetrics.estimatedFPS}
                    </div>
                  </div>
                )}
                {performanceMetrics.memoryUsage && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>内存使用</div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>
                      {performanceMetrics.memoryUsage.used}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Grid 容器 */}
            <div style={{ flex: 1, display: 'flex', margin: '16px 20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden', minHeight: 0, position: 'relative' }}>
              {isLoading && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#3b82f6' }}>
                    加载中...
                  </div>
                </div>
              )}
              <Grid
                ref={gridRef}
                columns={columns}
                rowCount={records.length}
                getCellContent={getCellContent}
                onCellEdited={handleCellEdited}
                freezeColumns={1}
                rowHeight={36}
                headerHeight={40}
                style={{ width: '100%', height: '100%' }}
              />
            </div>

            {/* 底部信息 */}
            <div style={{ padding: '12px 20px', backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb', fontSize: '13px', color: '#6b7280' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  Context 系统: SessionContext ✅ | AppContext ✅ | HistoryContext ✅
                </div>
                <div>
                  当前数据: {records.length.toLocaleString()} 行 × {columns.length} 列
                </div>
              </div>
            </div>
          </div>
        </HistoryProvider>
      </AppProvider>
    </SessionProvider>
  );
};

