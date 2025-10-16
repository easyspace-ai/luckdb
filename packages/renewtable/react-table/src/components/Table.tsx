/**
 * Table Component
 * Main React component for Canvas table
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  CanvasRenderer,
  CoordinateManager,
  VirtualScroller,
  ColumnDef,
  TableOptions,
  GridTheme,
  defaultTheme,
  ColumnResizeHandler,
  ColumnDragHandler,
} from '@luckdb/table-core';
import { useTable } from '../hooks/useTable';

export interface TableProps<TData> extends Omit<TableOptions<TData>, 'containerWidth' | 'containerHeight'> {
  width?: number;
  height?: number;
  theme?: Partial<GridTheme>;
  className?: string;
  style?: React.CSSProperties;
}

export function Table<TData>(props: TableProps<TData>) {
  const {
    data,
    columns,
    width = 800,
    height = 600,
    theme,
    className,
    style,
    ...tableOptions
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<CanvasRenderer>();
  const coordManagerRef = useRef<CoordinateManager>();
  const virtualScrollerRef = useRef<VirtualScroller>();
  const resizeHandlerRef = useRef<ColumnResizeHandler>();
  const dragHandlerRef = useRef<ColumnDragHandler>();

  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [columnSizes, setColumnSizes] = useState<Record<string, number>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const table = useTable({
    data,
    columns,
    ...tableOptions,
    containerWidth: width,
    containerHeight: height,
  });

  // Initialize Canvas renderer and handlers
  useEffect(() => {
    if (!canvasRef.current) return;

    const mergedTheme = { ...defaultTheme, ...theme };
    rendererRef.current = new CanvasRenderer(canvasRef.current, mergedTheme);

    // Initialize coordinate manager with custom column widths
    const columnWidthMap = columns.reduce((acc, col, idx) => {
      const size = columnSizes[col.id || `col_${idx}`] || col.size || tableOptions.columnWidth || 150;
      acc[idx] = size;
      return acc;
    }, {} as Record<number, number>);

    coordManagerRef.current = new CoordinateManager({
      rowHeight: tableOptions.rowHeight || 40,
      columnWidth: tableOptions.columnWidth || 150,
      rowCount: data.length,
      columnCount: columns.length,
      containerWidth: width,
      containerHeight: height,
      columnWidthMap,
    });

    // Initialize virtual scroller
    virtualScrollerRef.current = new VirtualScroller(
      coordManagerRef.current,
      height,
      width
    );

    // Initialize interaction handlers
    resizeHandlerRef.current = new ColumnResizeHandler();
    dragHandlerRef.current = new ColumnDragHandler();

    // Initialize column order
    if (columnOrder.length === 0) {
      setColumnOrder(columns.map((col, idx) => col.id || `col_${idx}`));
    }
  }, []);

  // Update theme when it changes
  useEffect(() => {
    if (rendererRef.current && theme) {
      rendererRef.current.setTheme(theme);
    }
  }, [theme]);

  // Render loop
  useEffect(() => {
    if (!rendererRef.current || !coordManagerRef.current || !virtualScrollerRef.current) {
      return;
    }

    // Get visible range
    const viewport = virtualScrollerRef.current.getVisibleRange(scrollTop, scrollLeft);

    // Convert data to 2D array for rendering
    const dataArray: any[][] = data.map(row => 
      columns.map(col => {
        if (col.accessorFn) {
          return col.accessorFn(row);
        }
        if (col.accessorKey) {
          return row[col.accessorKey as keyof TData];
        }
        return null;
      })
    );

    // Render
    rendererRef.current.render(
      coordManagerRef.current,
      dataArray,
      columns,
      viewport,
      scrollTop,
      scrollLeft
    );
  }, [data, columns, scrollTop, scrollLeft, width, height]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  // Helper: Check if clicking on column resize handle
  const isColumnResizeHandle = (x: number, y: number): { isHandle: boolean; columnIndex: number } => {
    const headerHeight = theme?.headerHeight || 36;
    if (y > headerHeight) return { isHandle: false, columnIndex: -1 };

    // Check each column boundary (5px tolerance)
    for (let i = 0; i < columns.length; i++) {
      const colOffset = coordManagerRef.current?.getColumnOffset(i) || 0;
      const colWidth = coordManagerRef.current?.getColumnWidth(i) || 150;
      const boundary = colOffset + colWidth - scrollLeft;

      if (Math.abs(x - boundary) < 5) {
        return { isHandle: true, columnIndex: i };
      }
    }

    return { isHandle: false, columnIndex: -1 };
  };

  // Helper: Get column index from x position
  const getColumnIndexFromX = (x: number): number => {
    const adjustedX = x + scrollLeft;
    for (let i = 0; i < columns.length; i++) {
      const offset = coordManagerRef.current?.getColumnOffset(i) || 0;
      const width = coordManagerRef.current?.getColumnWidth(i) || 150;
      if (adjustedX >= offset && adjustedX <= offset + width) {
        return i;
      }
    }
    return -1;
  };

  // Mouse down handler
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !resizeHandlerRef.current || !dragHandlerRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const headerHeight = theme?.headerHeight || 36;

    // Check if clicking on resize handle
    const { isHandle, columnIndex } = isColumnResizeHandle(x, y);

    if (isHandle && columnIndex >= 0) {
      // Start column resize
      const column = columns[columnIndex];
      const columnId = column?.id || `col_${columnIndex}`;
      const currentWidth = coordManagerRef.current?.getColumnWidth(columnIndex) || 150;

      resizeHandlerRef.current.startResize(
        columnIndex,
        columnId,
        e.clientX,
        currentWidth
      );
      setIsResizing(true);
      e.preventDefault();
      return;
    }

    // Check if clicking on column header (for dragging)
    if (y <= headerHeight) {
      const columnIndex = getColumnIndexFromX(x);
      if (columnIndex >= 0) {
        const column = columns[columnIndex];
        const columnId = column?.id || `col_${columnIndex}`;

        // Start column drag (after a small delay to distinguish from click)
        setTimeout(() => {
          if (!isResizing) {
            dragHandlerRef.current?.startDrag(
              columnIndex,
              columnId,
              canvasRef.current!,
              e.clientX,
              e.clientY
            );
            setIsDragging(true);
          }
        }, 150);
      }
    }
  }, [columns, theme, scrollLeft, isResizing]);

  // Mouse move handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Handle column resizing
    if (isResizing && resizeHandlerRef.current) {
      const newWidth = resizeHandlerRef.current.updateResize(e.clientX);
      const resizingInfo = resizeHandlerRef.current.getResizingColumn();

      if (resizingInfo && coordManagerRef.current) {
        // Update column width
        setColumnSizes(prev => ({
          ...prev,
          [resizingInfo.id]: newWidth,
        }));

        // Update coordinate manager
        coordManagerRef.current.columnWidthMap = {
          ...coordManagerRef.current.columnWidthMap,
          [resizingInfo.index]: newWidth,
        };
        coordManagerRef.current.lastColumnIndex = -1; // Force recalculation

        // Mark for rerender
        rendererRef.current?.markDirty();
      }
      e.preventDefault();
      return;
    }

    // Handle column dragging
    if (isDragging && dragHandlerRef.current) {
      const targetIndex = getColumnIndexFromX(x);
      if (targetIndex >= 0) {
        const targetX = coordManagerRef.current?.getColumnOffset(targetIndex) || 0;
        dragHandlerRef.current.updateDrag(targetIndex, e.clientX, e.clientY, targetX - scrollLeft + rect.left);
      }
      e.preventDefault();
      return;
    }

    // Update cursor style for resize handles
    const { isHandle } = isColumnResizeHandle(x, y);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = isHandle ? 'col-resize' : 'default';
    }
  }, [isResizing, isDragging, columns, scrollLeft]);

  // Mouse up handler
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    // End column resize
    if (isResizing && resizeHandlerRef.current) {
      const result = resizeHandlerRef.current.endResize();
      if (result && tableOptions.onColumnResize) {
        tableOptions.onColumnResize(result.columnId, result.newWidth);
      }
      setIsResizing(false);
    }

    // End column drag
    if (isDragging && dragHandlerRef.current) {
      const newOrder = dragHandlerRef.current.endDrag(columnOrder);
      setColumnOrder(newOrder);
      setIsDragging(false);
      
      if (tableOptions.onColumnOrderChange) {
        tableOptions.onColumnOrderChange(newOrder);
      }
    }
  }, [isResizing, isDragging, columnOrder, tableOptions]);

  // Calculate total dimensions for scrollable area
  const totalWidth = coordManagerRef.current?.totalWidth || width;
  const totalHeight = coordManagerRef.current?.totalHeight || height;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width,
        height,
        overflow: 'auto',
        userSelect: isResizing || isDragging ? 'none' : 'auto',
        ...style,
      }}
      onScroll={handleScroll}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Canvas for rendering */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          cursor: isResizing ? 'col-resize' : isDragging ? 'grabbing' : 'default',
        }}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
      />
      
      {/* Spacer for scrolling */}
      <div
        style={{
          width: totalWidth,
          height: totalHeight,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

