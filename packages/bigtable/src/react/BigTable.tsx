/**
 * BigTable - React 组件
 * 高性能表格组件
 */

import React, { useEffect } from 'react';
import { useBigTable, type IUseBigTableConfig } from './hooks/useBigTable';
import type { IRow, IColumn } from '../core';

export interface IBigTableProps {
  // 数据
  rows: IRow[];
  columns: IColumn[];

  // 配置
  renderMode?: 'dom' | 'canvas' | 'webgl';
  virtualization?: {
    enabled?: boolean;
    overscanCount?: number;
  };
  frozenColumnCount?: number;

  // 样式
  style?: React.CSSProperties;
  className?: string;

  // 事件
  onCellClick?: (rowId: string | number, columnId: string | number) => void;
  onScroll?: (scrollLeft: number, scrollTop: number) => void;

  // 开发调试
  showPerformance?: boolean;
}

export const BigTable: React.FC<IBigTableProps> = ({
  rows,
  columns,
  renderMode = 'canvas',
  virtualization,
  frozenColumnCount,
  style,
  className,
  onCellClick,
  onScroll,
  showPerformance = false,
}) => {
  // 使用 Hook
  const { canvasRef, containerRef, isReady, performanceMetrics, engine, scrollTo, getCellAtPoint } =
    useBigTable({
      rows,
      columns,
      renderMode,
      virtualization,
      frozenColumnCount,
    });

  // 处理点击事件
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onCellClick || !engine) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cellPosition = getCellAtPoint(x, y);
      if (cellPosition) {
        const row = rows[cellPosition.rowIndex];
        const column = columns[cellPosition.columnIndex];
        if (row && column) {
          onCellClick(row.id, column.id);
        }
      }
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [canvasRef, onCellClick, engine, rows, columns, getCellAtPoint]);

  // 处理滚动事件
  useEffect(() => {
    if (!engine || !onScroll) {
      return;
    }

    const handleScroll = (event: any) => {
      const { scrollState } = event;
      onScroll(scrollState.scrollLeft, scrollState.scrollTop);
    };

    engine.on('scroll', handleScroll);

    return () => {
      engine.off('scroll', handleScroll);
    };
  }, [engine, onScroll]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />

      {/* 性能指标（开发模式） */}
      {showPerformance && isReady && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 4,
            fontSize: 12,
            fontFamily: 'monospace',
            pointerEvents: 'none',
          }}
        >
          <div>FPS: {performanceMetrics.fps}</div>
          <div>Render: {performanceMetrics.renderTime.toFixed(2)}ms</div>
          <div>
            Visible: {performanceMetrics.visibleCells} / {performanceMetrics.totalCells}
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {!isReady && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff',
          }}
        >
          Loading...
        </div>
      )}
    </div>
  );
};
