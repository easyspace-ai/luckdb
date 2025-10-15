import { useEffect, useRef, useState } from 'react';
import type { GridEngine } from '../../core/engine/GridEngine';
import type { ICellPosition } from '../../core/types';

interface UseAutoFillParams {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  engine: GridEngine | null;
  getCellAtPoint: (x: number, y: number) => ICellPosition | null;
  onAutoFill: (from: ICellPosition, to: ICellPosition) => void;
}

export function useAutoFill({ canvasRef, engine, getCellAtPoint, onAutoFill }: UseAutoFillParams) {
  const [drag, setDrag] = useState<{ start: ICellPosition; current: ICellPosition } | null>(null);
  const handleSize = 6; // 右下角填充手柄尺寸

  // 在画布上绘制选区与手柄（简单版本，由渲染器负责会更好，这里先用 overlay）
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engine) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!drag) return;
      const theme = engine.getTheme();
      const rectStart = engine.getCellRect(drag.start);
      const rectCurrent = engine.getCellRect(drag.current);
      const x = Math.min(rectStart.x, rectCurrent.x);
      const y = Math.min(rectStart.y, rectCurrent.y);
      const w = Math.abs(rectStart.x - rectCurrent.x) + rectCurrent.width;
      const h = Math.abs(rectStart.y - rectCurrent.y) + rectCurrent.height;

      ctx.save();
      ctx.strokeStyle = theme.borderColorActive;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    };

    draw();
  }, [drag, canvasRef, engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engine) return;

    const onMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pos = getCellAtPoint(x, y);
      if (!pos) return;

      // 仅当命中选中单元格右下角的手柄区域时开始填充（简化：总是允许，后续可增加命中判断）
      setDrag({ start: pos, current: pos });
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!drag) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pos = getCellAtPoint(x, y);
      if (!pos) return;
      setDrag((prev) => (prev ? { start: prev.start, current: pos } : prev));
    };

    const onMouseUp = () => {
      if (drag) {
        onAutoFill(drag.start, drag.current);
      }
      setDrag(null);
    };

    canvas.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [canvasRef, engine, getCellAtPoint, drag, onAutoFill]);
}
