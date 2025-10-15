import { useEffect, useRef } from 'react';
import type { GridEngine } from '../../core/engine/GridEngine';
import type { ICellPosition } from '../../core/types';

interface UseFillDragParams {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  engine: GridEngine | null;
  selection: { start: ICellPosition; end: ICellPosition } | null;
  setSelection: React.Dispatch<
    React.SetStateAction<{ start: ICellPosition; end: ICellPosition } | null>
  >;
  getCellAtPoint: (x: number, y: number) => ICellPosition | null;
  onFill: (range: { start: ICellPosition; end: ICellPosition }) => void;
}

export function useFillDrag({
  canvasRef,
  engine,
  selection,
  setSelection,
  getCellAtPoint,
  onFill,
}: UseFillDragParams) {
  const draggingRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!engine || !canvas) return;

    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current || !selection) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pos = getCellAtPoint(x, y);
      if (!pos) return;
      // 拖动手柄时动态扩展选区（使用 setSelection 更新状态）
      setSelection((prev) => (prev ? { start: prev.start, end: pos } : prev));
      e.preventDefault();
    };

    const onMouseUp = () => {
      if (draggingRef.current && selection) {
        onFill(selection);
      }
      draggingRef.current = false;
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [canvasRef, engine, selection, setSelection, getCellAtPoint, onFill]);

  const startFillDrag = () => {
    draggingRef.current = true;
  };

  return { startFillDrag } as const;
}
