import { useEffect, useState } from 'react';
import type { GridEngine } from '../../core/engine/GridEngine';
import type { ICellPosition } from '../../core/types';

interface UseSelectionParams {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  engine: GridEngine | null;
  getCellAtPoint: (x: number, y: number) => ICellPosition | null;
}

export function useSelection({ canvasRef, engine, getCellAtPoint }: UseSelectionParams) {
  const [selection, setSelection] = useState<{ start: ICellPosition; end: ICellPosition } | null>(
    null
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engine) return;

    const onMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pos = getCellAtPoint(x, y);
      if (!pos) return;
      // 点击仅选中单格，不在普通拖动中扩大选区
      setSelection({ start: pos, end: pos });
    };

    const onMouseUp = () => {
      // 保留选区
    };

    canvas.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [canvasRef, engine, getCellAtPoint]);

  return { selection, setSelection } as const;
}
