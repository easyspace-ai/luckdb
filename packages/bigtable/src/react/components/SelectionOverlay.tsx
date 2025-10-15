import React, { useMemo, useRef } from 'react';
import type { GridEngine } from '../../core/engine/GridEngine';
import type { ICellPosition } from '../../core/types';

interface SelectionOverlayProps {
  engine: GridEngine | null;
  selection: { start: ICellPosition; end: ICellPosition } | null;
  onStartFillDrag?: (e: React.MouseEvent) => void;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
  engine,
  selection,
  onStartFillDrag,
}) => {
  const handleSize = 8;
  const ref = useRef<HTMLDivElement>(null);

  const rect = useMemo(() => {
    if (!engine || !selection) return null;
    const { start, end } = selection;
    const a = engine.getCellRect(start);
    const b = engine.getCellRect(end);
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const right = Math.max(a.x + a.width, b.x + b.width);
    const bottom = Math.max(a.y + a.height, b.y + b.height);
    return { x, y, w: right - x, h: bottom - y };
  }, [engine, selection]);

  if (!engine || !selection || !rect) return null;

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        pointerEvents: 'none',
        boxSizing: 'border-box',
        border: '2px solid #3b82f6',
        zIndex: 997,
      }}
    >
      <div
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onStartFillDrag?.(e);
        }}
        style={{
          position: 'absolute',
          right: -handleSize / 2,
          bottom: -handleSize / 2,
          width: handleSize,
          height: handleSize,
          background: '#3b82f6',
          borderRadius: 2,
          pointerEvents: 'auto',
          cursor: 'crosshair',
        }}
      />
    </div>
  );
};
