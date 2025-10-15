/**
 * useColumnDrag - 列拖动排序 Hook
 *
 * 功能：
 * 1. 检测列头拖动
 * 2. 显示拖动反馈（阴影、插入位置）
 * 3. 更新列顺序
 */

import { useEffect, useRef, RefObject } from 'react';
import type { GridEngine } from '../../core/engine/GridEngine';
import type { IColumn } from '../../core';

const DRAG_THRESHOLD = 10; // 10px 移动距离才激活拖动，更精确

export interface IColumnDragState {
  isDragging: boolean;
  dragColumnIndex: number;
  dropTargetIndex: number;
  dragStartX: number;
  currentX: number;
}

interface IUseColumnDragOptions {
  canvasRef: RefObject<HTMLCanvasElement>;
  columns: IColumn[];
  engine: GridEngine | null;
  onColumnReorder?: (fromIndex: number, toIndex: number) => void;
  enabled?: boolean;
}

export const useColumnDrag = ({
  canvasRef,
  columns,
  engine,
  onColumnReorder,
  enabled = true,
}: IUseColumnDragOptions) => {
  const dragStateRef = useRef<IColumnDragState>({
    isDragging: false,
    dragColumnIndex: -1,
    dropTargetIndex: -1,
    dragStartX: 0,
    currentX: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engine || !enabled) {
      return;
    }

    const theme = engine.getTheme();
    const headerHeight = theme.headerHeight;
    const RESIZE_HANDLE_WIDTH = 8; // 与列宽调整保持一致或略大，避免误触

    /**
     * 获取鼠标位置对应的列索引
     */
    const getColumnIndexAtX = (x: number): number => {
      const scrollState = engine.getScrollState();
      const frozenCount = (engine as any)?.config?.frozenColumnCount ?? 0;

      // 计算冻结列
      let currentX = 0;
      for (let i = 0; i < frozenCount && i < columns.length; i++) {
        const width = columns[i].width || 200;
        if (x >= currentX && x < currentX + width) {
          return i;
        }
        currentX += width;
      }

      // 计算非冻结列（需要减去滚动偏移）
      const frozenWidth = currentX;
      currentX = frozenWidth - scrollState.scrollLeft;

      for (let i = frozenCount; i < columns.length; i++) {
        const width = columns[i].width || 200;
        if (x >= currentX && x < currentX + width) {
          return i;
        }
        currentX += width;
      }

      return -1;
    };

    /**
     * 获取显示坐标下的列边界（含冻结&滚动）
     */
    const getDisplayOffsets = (): number[] => {
      const offsets = [0];
      let acc = 0;
      // 尝试读取冻结列宽（可选，不依赖私有字段时回退为0）
      const frozenCount = (engine as any)?.config?.frozenColumnCount ?? 0;
      const frozenWidth = (engine as any)?.coordinateSystem?.getFrozenWidth?.() ?? 0;
      const scrollLeft = engine.getScrollState().scrollLeft;

      for (let i = 0; i < columns.length; i++) {
        const w = columns[i].width || 200;
        const displayX = i < frozenCount ? acc : acc - scrollLeft + frozenWidth;
        offsets.push(displayX + w);
        acc += w;
      }
      return offsets;
    };

    /** 判断是否在列边界的调整把手上 */
    const isOnResizeHandle = (x: number): boolean => {
      const boundaries = getColumnBoundaries();
      for (let i = 1; i < boundaries.length; i++) {
        const edge = boundaries[i];
        if (Math.abs(x - edge) <= RESIZE_HANDLE_WIDTH / 2) return true;
      }
      return false;
    };

    /**
     * 计算插入目标位置
     */
    const getDropTargetIndex = (x: number): number => {
      const boundaries = getColumnBoundaries();

      // 找到最接近的列边界
      for (let i = 0; i < boundaries.length - 1; i++) {
        const leftBound = boundaries[i];
        const rightBound = boundaries[i + 1];
        const midpoint = (leftBound + rightBound) / 2;

        if (x < midpoint) {
          return i;
        }
      }

      // 如果在最后一列之后
      return columns.length;
    };

    /**
     * 鼠标按下
     */
    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // 只在表头区域响应
      if (y < 0 || y > headerHeight) {
        return;
      }

      const columnIndex = getColumnIndexAtX(x);
      if (columnIndex === -1) {
        return;
      }

      // 如果位于列调整把手区域，交给列宽调整，不启动拖动
      if (isOnResizeHandle(x)) {
        return;
      }

      // ✅ 只记录起始状态，不立即拖动
      dragStateRef.current = {
        isDragging: false, // 改为 false
        dragColumnIndex: columnIndex,
        dropTargetIndex: columnIndex,
        dragStartX: x,
        currentX: x,
      };

      console.log('[useColumnDrag] Mouse down on column:', columnIndex);

      e.preventDefault();
    };

    /**
     * 鼠标移动
     */
    const handleMouseMove = (e: MouseEvent) => {
      const state = dragStateRef.current;

      if (state.dragColumnIndex === -1) return; // ✅ 检查是否有拖动候选

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;

      // 更新当前位置
      state.currentX = x;

      // ✅ 检查是否超过阈值
      if (!state.isDragging) {
        const distance = Math.abs(x - state.dragStartX);
        if (distance < DRAG_THRESHOLD) {
          return; // 未超过阈值，不触发拖动
        }

        // 超过阈值，激活拖动
        state.isDragging = true;
        console.log('[useColumnDrag] Drag activated, distance:', distance);
      }

      // 计算目标位置
      const dropTargetIndex = getDropTargetIndex(x);
      state.dropTargetIndex = dropTargetIndex;

      // 更新引擎状态（触发重新渲染）
      (engine as any).setColumnDragState?.(state);

      e.preventDefault();
    };

    /**
     * 鼠标抬起
     */
    const handleMouseUp = () => {
      const state = dragStateRef.current;

      if (!state.isDragging) {
        return;
      }

      const { dragColumnIndex, dropTargetIndex } = state;

      console.log('[useColumnDrag] Drop column:', {
        from: dragColumnIndex,
        to: dropTargetIndex,
      });

      // 执行列重排
      if (dragColumnIndex !== dropTargetIndex && dropTargetIndex !== -1) {
        onColumnReorder?.(dragColumnIndex, dropTargetIndex);
      }

      // 重置状态
      dragStateRef.current = {
        isDragging: false,
        dragColumnIndex: -1,
        dropTargetIndex: -1,
        dragStartX: 0,
        currentX: 0,
      };

      // 清除引擎拖动状态
      (engine as any).setColumnDragState?.(null);
    };

    /**
     * 鼠标离开
     */
    const handleMouseLeave = () => {
      // 取消拖动
      if (dragStateRef.current.isDragging) {
        dragStateRef.current = {
          isDragging: false,
          dragColumnIndex: -1,
          dropTargetIndex: -1,
          dragStartX: 0,
          currentX: 0,
        };

        (engine as any).setColumnDragState?.(null);
      }
    };

    // 添加事件监听
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [canvasRef, columns, engine, onColumnReorder, enabled]);

  return {
    dragState: dragStateRef.current,
  };
};
