/**
 * BigTable - React 组件
 * 高性能表格组件
 */

import React, { useEffect, useState } from 'react';
import { useBigTable } from './hooks/useBigTable';
import { useColumnResize } from './hooks/useColumnResize';
import { useColumnDrag } from './hooks/useColumnDrag';
import { useContextMenu } from './hooks/useContextMenu';
import { EditorOverlay } from './components/EditorOverlay';
import { ContextMenu } from './components/ContextMenu';
import { ScrollbarsOverlay } from './components/ScrollbarsOverlay';
import { Scrollbars } from './components/Scrollbars';
import { TouchLayer } from './components/TouchLayer';
import { useWheelScroll } from './hooks/useWheelScroll';
import { SelectionOverlay } from './components/SelectionOverlay';
import { useSelection } from './hooks/useSelection';
import { useFillDrag } from './hooks/useFillDrag';
import type { IRow, IColumn } from '../core';
import type { IEditorState, IEditorCallbacks } from '../core/editors/types';

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
  onCellDoubleClick?: (rowId: string | number, columnId: string | number) => void;
  onCellChange?: (rowId: string | number, columnId: string | number, value: unknown) => void;
  onScroll?: (scrollLeft: number, scrollTop: number) => void;

  // 编辑
  editable?: boolean;

  // 开发调试
  showPerformance?: boolean;
}

export const BigTable: React.FC<IBigTableProps> = ({
  rows,
  columns: initialColumns,
  renderMode = 'canvas',
  virtualization,
  frozenColumnCount,
  style,
  className,
  onCellClick,
  onCellDoubleClick,
  onCellChange,
  onScroll,
  editable = true,
  showPerformance = false,
}) => {
  // 编辑器状态
  const [editorState, setEditorState] = useState<IEditorState | null>(null);

  // 列状态（支持动态调整列宽）
  const [columns, setColumns] = useState<IColumn[]>(initialColumns);

  // 同步外部columns变化
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // 使用 Hook
  const { canvasRef, containerRef, isReady, performanceMetrics, engine, getCellAtPoint } =
    useBigTable({
      rows,
      columns,
      renderMode,
      virtualization: virtualization
        ? { enabled: virtualization.enabled ?? true, overscanCount: virtualization.overscanCount }
        : undefined,
      frozenColumnCount,
    });

  // 鼠标滚轮滚动（水平+垂直）
  useWheelScroll({ containerRef, engine });

  // 列宽调整
  useColumnResize({
    canvasRef,
    columns,
    engine,
    onColumnResize: (columnIndex, newWidth) => {
      const roundedWidth = Math.round(newWidth);
      console.log('[BigTable] onColumnResize -', 'column:', columnIndex, 'newWidth:', roundedWidth);

      // 更新 state
      setColumns((prevColumns) => {
        const newColumns = [...prevColumns];
        newColumns[columnIndex] = { ...newColumns[columnIndex], width: roundedWidth };

        // 直接更新 engine（避免 useEffect 循环）
        if (engine) {
          console.log('[BigTable] Directly updating engine with new columns');
          engine.updateColumns(newColumns);
        }

        return newColumns;
      });
    },
  });

  // 列拖动排序
  useColumnDrag({
    canvasRef,
    columns,
    engine,
    onColumnReorder: (fromIndex, toIndex) => {
      console.log('[BigTable] onColumnReorder -', 'from:', fromIndex, 'to:', toIndex);

      // 更新 state
      setColumns((prevColumns) => {
        const newColumns = [...prevColumns];
        const [removed] = newColumns.splice(fromIndex, 1);

        // 如果目标位置在拖动列之后，需要调整索引
        const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
        newColumns.splice(adjustedToIndex, 0, removed);

        // 直接更新 engine
        if (engine) {
          console.log('[BigTable] Directly updating engine with reordered columns');
          engine.updateColumns(newColumns);
        }

        return newColumns;
      });
    },
    enabled: true,
  });

  // 右键菜单
  const { menuState, handleItemClick, handleClose } = useContextMenu({
    canvasRef,
    engine,
    onMenuItemClick: (itemId, context) => {
      console.log('[BigTable] Menu item clicked:', itemId, context);

      // 处理菜单项点击
      switch (itemId) {
        case 'copy':
          console.log('Copy');
          break;
        case 'paste':
          console.log('Paste');
          break;
        case 'delete-row':
          if (context.rowIndex !== undefined) {
            console.log('Delete row:', context.rowIndex);
          }
          break;
        case 'delete-column':
          if (context.columnIndex !== undefined) {
            console.log('Delete column:', context.columnIndex);
          }
          break;
        // 更多菜单项处理...
      }
    },
  });

  // 处理点击事件
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engine) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cellPosition = getCellAtPoint(x, y);
      if (cellPosition && onCellClick) {
        const row = rows[cellPosition.rowIndex];
        const column = columns[cellPosition.columnIndex];
        if (row && column) {
          onCellClick(row.id, column.id);
        }
      }
    };

    const handleDoubleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const cellPosition = getCellAtPoint(x, y);
      if (cellPosition) {
        const row = rows[cellPosition.rowIndex];
        const column = columns[cellPosition.columnIndex];
        if (row && column) {
          // 触发双击回调
          onCellDoubleClick?.(row.id, column.id);

          // 如果可编辑,打开编辑器
          if (editable) {
            openEditor(cellPosition);
          }
        }
      }
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('dblclick', handleDoubleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [canvasRef, onCellClick, onCellDoubleClick, editable, engine, rows, columns, getCellAtPoint]);

  // 拖拽填充（Excel-like 简化版）
  const { selection, setSelection } = useSelection({ canvasRef, engine, getCellAtPoint });
  const { startFillDrag } = useFillDrag({
    canvasRef,
    engine,
    selection,
    setSelection,
    getCellAtPoint,
    onFill: (range) => {
      console.log('[BigTable] Fill range:', range);
      if (!engine) return;
      const startRow = Math.min(range.start.rowIndex, range.end.rowIndex);
      const endRow = Math.max(range.start.rowIndex, range.end.rowIndex);
      const startCol = Math.min(range.start.columnIndex, range.end.columnIndex);
      const endCol = Math.max(range.start.columnIndex, range.end.columnIndex);

      // 取首单元格值作为复制源
      const sourceRow = rows[startRow];
      const sourceCol = columns[startCol];
      if (!sourceRow || !sourceCol) return;
      const sourceValue = sourceRow.data[sourceCol.key];

      // 复制填充（简单策略：全部设为源值）
      const newRows = rows.map((r, ri) => {
        if (ri < startRow || ri > endRow) return r;
        const newData = { ...r.data } as any;
        for (let ci = startCol; ci <= endCol; ci++) {
          const col = columns[ci];
          if (!col) continue;
          newData[col.key] = sourceValue;
        }
        return { ...r, data: newData } as typeof r;
      });

      engine.updateRows(newRows);
    },
  });

  // 打开编辑器
  const openEditor = (cellPosition: { rowIndex: number; columnIndex: number }) => {
    if (!engine) return;

    const row = rows[cellPosition.rowIndex];
    const column = columns[cellPosition.columnIndex];
    if (!row || !column) return;

    const theme = engine.getTheme();
    const scrollState = engine.getScrollState();

    // 计算单元格位置(相对于可视区域)
    const DEFAULT_COLUMN_WIDTH = 100;
    let x = 0;
    for (let i = 0; i < cellPosition.columnIndex; i++) {
      x += columns[i].width || DEFAULT_COLUMN_WIDTH;
    }
    x -= scrollState.scrollLeft;

    const y = cellPosition.rowIndex * theme.rowHeight + theme.headerHeight - scrollState.scrollTop;

    const width = column.width || DEFAULT_COLUMN_WIDTH;
    const height = theme.rowHeight;

    // 创建编辑器状态
    const cellId = `${row.id}-${column.id}`;
    const cellValue = row.data[column.key];

    const state: IEditorState = {
      cellId,
      cell: {
        id: cellId,
        rowId: row.id,
        columnId: column.id,
        value: cellValue,
        type: column.type,
      },
      value: cellValue,
      isEditing: true,
      position: { x, y, width, height },
    };

    setEditorState(state);

    console.log('[BigTable] Opening editor:', {
      cellId,
      value: cellValue,
      position: state.position,
    });
  };

  // 编辑器回调
  const editorCallbacks: IEditorCallbacks = {
    onChange: (newValue) => {
      console.log('[BigTable] Editor value changed:', newValue);
    },

    onSave: (newValue) => {
      if (!editorState) return;

      const cell = editorState.cell;

      console.log('[BigTable] Saving cell:', {
        rowId: cell.rowId,
        columnId: cell.columnId,
        oldValue: cell.value,
        newValue,
      });

      // 触发外部回调
      onCellChange?.(cell.rowId, cell.columnId, newValue);

      // TODO: 更新内部数据
    },

    onCancel: () => {
      console.log('[BigTable] Editor cancelled');
    },

    onClose: () => {
      setEditorState(null);
    },
    onTabNavigate: (direction) => {
      // 根据当前 editorState 计算相邻单元格并打开编辑器
      if (!editorState || !engine) return;
      const { cell } = editorState;
      const rowIndex = rows.findIndex((r) => r.id === cell.rowId);
      const columnIndex = columns.findIndex((c) => c.id === cell.columnId);
      if (rowIndex < 0 || columnIndex < 0) return;

      const targetColumnIndex = direction === 'next' ? columnIndex + 1 : columnIndex - 1;
      if (targetColumnIndex < 0 || targetColumnIndex >= columns.length) return;

      openEditor({ rowIndex, columnIndex: targetColumnIndex });
    },
  };

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

      {/* 自定义滚动条覆盖层 */}
      {engine && <ScrollbarsOverlay engine={engine} />}

      {/* 触摸支持层 */}
      <TouchLayer engine={engine} containerRef={containerRef}>
        {/* 自定义滚动条 */}
        <Scrollbars engine={engine} containerRef={containerRef} />
      </TouchLayer>

      {/* 编辑器覆盖层 */}
      {editable && editorState && (
        <EditorOverlay editorState={editorState} callbacks={editorCallbacks} />
      )}

      {/* 选区覆盖层 + 填充手柄 */}
      {selection && (
        <SelectionOverlay
          engine={engine}
          selection={selection}
          onStartFillDrag={() => startFillDrag()}
        />
      )}

      {/* 右键菜单 */}
      <ContextMenu
        isOpen={menuState.isOpen}
        x={menuState.x}
        y={menuState.y}
        items={menuState.items}
        onItemClick={handleItemClick}
        onClose={handleClose}
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
            zIndex: 998,
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
