/**
 * 列宽调整 Hook
 */

import { useEffect, useRef, useCallback } from 'react';
import { ColumnResizeManager } from '../../core/interaction';
import type { IColumn } from '../../core';
import type { GridEngine } from '../../core/engine/GridEngine';

export interface IUseColumnResizeConfig {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  columns: IColumn[];
  engine: GridEngine | null;
  onColumnResize?: (columnIndex: number, newWidth: number) => void;
}

export function useColumnResize(config: IUseColumnResizeConfig) {
  const { canvasRef, columns, engine, onColumnResize } = config;
  const resizeManagerRef = useRef<ColumnResizeManager | null>(null);
  const columnWidthsRef = useRef<number[]>([]);
  const previewLineRef = useRef<HTMLDivElement | null>(null);

  // 初始化列宽调整管理器
  useEffect(() => {
    resizeManagerRef.current = new ColumnResizeManager(
      {
        minWidth: 50,
        maxWidth: 1000,
        resizeHandleWidth: 5, // 使用 Grid 标准
      },
      {
        onResizeStart: (columnIndex) => {
          console.log('[ColumnResize] Start resizing column:', columnIndex);
        },
        onResizing: (columnIndex, newWidth) => {
          // 只打印日志，不触发更新（避免性能问题）
          // console.log('[ColumnResize] Resizing:', columnIndex, 'width:', newWidth);
        },
        onResizeEnd: (columnIndex, newWidth) => {
          console.log('[ColumnResize] End resizing column:', columnIndex, 'new width:', newWidth);
          // 只在结束时触发一次更新
          if (onColumnResize) {
            onColumnResize(columnIndex, newWidth);
          }
        },
      }
    );

    return () => {
      resizeManagerRef.current?.destroy();
    };
  }, [onColumnResize]);

  // 更新列宽度缓存
  useEffect(() => {
    columnWidthsRef.current = columns.map((col) => col.width || 100);
  }, [columns]);

  // 处理鼠标事件
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engine) return;

    const resizeManager = resizeManagerRef.current;
    if (!resizeManager) return;

    let isResizing = false;
    let resizingColumnIndex = -1;

    // 获取列边界位置（参考 Grid 实现）
    const getColumnBoundaries = (): number[] => {
      const boundaries = [0];
      const coordinateSystem = (engine as any)?.coordinateSystem;

      if (!coordinateSystem) {
        // 降级处理：简单累加
        let offset = 0;
        for (let i = 0; i < columns.length; i++) {
          const width = columns[i].width || 100;
          offset += width;
          boundaries.push(offset);
        }
        return boundaries;
      }

      // 使用坐标系统的方法
      for (let i = 0; i < columns.length; i++) {
        const offset = coordinateSystem.getColumnOffset(i + 1);
        boundaries.push(offset);
      }
      return boundaries;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const theme = engine.getTheme();
      const scrollState = engine.getScrollState();

      // 检查是否在表头区域
      if (y > theme.headerHeight) {
        if (!isResizing) {
          canvas.style.cursor = 'default';
        }
        return;
      }

      if (isResizing) {
        // 正在调整列宽
        const newWidth = resizeManager.resize(x);
        if (newWidth !== null && resizingColumnIndex >= 0) {
          // 更新列宽
          onColumnResize?.(resizingColumnIndex, newWidth);
        }
      } else {
        // 检查是否在列分隔线上
        const boundaries = getColumnBoundaries();
        const columnIndex = resizeManager.isOnResizeHandle(x, boundaries);

        if (columnIndex >= 0) {
          canvas.style.cursor = 'col-resize';
          engine.setResizeHoverColumn(columnIndex); // ✅ 新增：设置悬停状态
        } else {
          canvas.style.cursor = 'default';
          engine.setResizeHoverColumn(-1); // ✅ 新增：清除悬停状态
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const theme = engine.getTheme();
      const scrollState = engine.getScrollState();

      // 只在表头区域处理
      if (y > theme.headerHeight) return;

      // 检查是否在列分隔线上
      const boundaries = getColumnBoundaries();
      const columnIndex = resizeManager.isOnResizeHandle(x, boundaries);

      if (columnIndex >= 0) {
        e.preventDefault();
        isResizing = true;
        resizingColumnIndex = columnIndex;
        const currentWidth = columnWidthsRef.current[columnIndex];
        resizeManager.startResize(columnIndex, x, currentWidth);

        // 创建预览线
        showPreviewLine(rect.x + x);

        // 在document上添加mousemove和mouseup监听器（防止鼠标离开canvas）
        document.addEventListener('mousemove', handleMouseMoveDocument);
        document.addEventListener('mouseup', handleMouseUpDocument);
      }
    };

    const handleMouseMoveDocument = (e: MouseEvent) => {
      if (!isResizing) return;

      e.preventDefault(); // 防止文本选择

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;

      // 更新预览线位置
      updatePreviewLine(e.clientX);

      const newWidth = resizeManager.resize(x);

      if (newWidth !== null && resizingColumnIndex >= 0) {
        // 实时更新列宽（不节流，确保流畅）
        onColumnResize?.(resizingColumnIndex, newWidth);
      }
    };

    const handleMouseUpDocument = () => {
      if (isResizing) {
        const result = resizeManager.endResize();
        if (result) {
          console.log('[ColumnResize] Resize completed:', result);
        }
        isResizing = false;
        resizingColumnIndex = -1;
        canvas.style.cursor = 'default';

        // 隐藏预览线
        hidePreviewLine();

        // 移除document上的监听器
        document.removeEventListener('mousemove', handleMouseMoveDocument);
        document.removeEventListener('mouseup', handleMouseUpDocument);
      }
    };

    // 预览线辅助函数
    const showPreviewLine = (x: number) => {
      if (!previewLineRef.current) {
        const line = document.createElement('div');
        line.style.position = 'fixed';
        line.style.top = '0';
        line.style.bottom = '0';
        line.style.width = '2px';
        line.style.backgroundColor = '#3b82f6';
        line.style.zIndex = '9999';
        line.style.pointerEvents = 'none';
        document.body.appendChild(line);
        previewLineRef.current = line;
      }

      previewLineRef.current.style.left = `${x}px`;
      previewLineRef.current.style.display = 'block';
    };

    const updatePreviewLine = (x: number) => {
      if (previewLineRef.current) {
        previewLineRef.current.style.left = `${x}px`;
      }
    };

    const hidePreviewLine = () => {
      if (previewLineRef.current) {
        previewLineRef.current.style.display = 'none';
      }
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      // 清理可能残留的document监听器
      document.removeEventListener('mousemove', handleMouseMoveDocument);
      document.removeEventListener('mouseup', handleMouseUpDocument);
      // 清理预览线
      if (previewLineRef.current) {
        previewLineRef.current.remove();
        previewLineRef.current = null;
      }
    };
  }, [canvasRef, engine, columns, onColumnResize]);

  return {};
}
