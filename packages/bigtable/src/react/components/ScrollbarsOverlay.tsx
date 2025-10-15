import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GridEngine } from '../../core/engine/GridEngine';

interface IProps {
  engine: GridEngine | null;
}

export const ScrollbarsOverlay: React.FC<IProps> = ({ engine }) => {
  const hRef = useRef<HTMLDivElement | null>(null);
  const vRef = useRef<HTMLDivElement | null>(null);
  const [_, force] = useState(0);

  const update = () => force((c) => c + 1);

  useEffect(() => {
    if (!engine) return;
    const onScroll = () => update();
    engine.on('scroll', onScroll);
    return () => engine.off('scroll', onScroll);
  }, [engine]);

  const metrics = useMemo(() => {
    if (!engine) return null;
    const total = engine.getTotalSize();
    const view = engine.getContainerSize();
    const frozen = engine.getFrozenWidth();
    const scroll = engine.getScrollState();
    return { total, view, frozen, scroll };
  }, [engine, _]);

  useEffect(() => {
    if (!engine || !metrics) return;
    const { total, view, frozen, scroll } = metrics;
    const h = hRef.current!;
    const v = vRef.current!;

    // 水平滚动条：从冻结列右侧开始
    const trackWidth = Math.max(0, view.width - frozen);
    const thumbWidth = Math.max(20, (trackWidth * trackWidth) / Math.max(1, total.width - frozen));
    const maxScroll = Math.max(1, total.width - frozen - trackWidth);
    const left = frozen + (trackWidth - thumbWidth) * (scroll.scrollLeft / maxScroll);

    h.style.left = `${left}px`;
    h.style.width = `${thumbWidth}px`;

    // 垂直滚动条：顶部位于表头下边
    const trackHeight = Math.max(0, view.height - metrics.scrollTop /* not used */);
    const header = engine.getTheme().headerHeight;
    const vTrack = Math.max(0, view.height - header);
    const vThumb = Math.max(20, (vTrack * vTrack) / Math.max(1, total.height - header));
    const vMax = Math.max(1, total.height - header - vTrack);
    const top = header + (vTrack - vThumb) * (scroll.scrollTop / vMax);

    v.style.top = `${top}px`;
    v.style.height = `${vThumb}px`;
  }, [engine, metrics]);

  if (!engine) return null;

  const theme = engine.getTheme();
  const frozen = engine.getFrozenWidth();

  return (
    <>
      {/* 水平滚动条 */}
      <div
        style={{
          position: 'absolute',
          bottom: 4,
          left: frozen,
          right: 4,
          height: 8,
          background: 'rgba(0,0,0,0.06)',
          borderRadius: 4,
          overflow: 'hidden',
          zIndex: 998,
        }}
      >
        <div
          ref={hRef}
          style={{
            position: 'absolute',
            top: 0,
            height: '100%',
            background: 'rgba(124,58,237,0.65)',
            borderRadius: 4,
          }}
        />
      </div>

      {/* 垂直滚动条 */}
      <div
        style={{
          position: 'absolute',
          top: theme.headerHeight,
          bottom: 4,
          right: 4,
          width: 8,
          background: 'rgba(0,0,0,0.06)',
          borderRadius: 4,
          overflow: 'hidden',
          zIndex: 998,
        }}
      >
        <div
          ref={vRef}
          style={{
            position: 'absolute',
            left: 0,
            width: '100%',
            background: 'rgba(124,58,237,0.65)',
            borderRadius: 4,
          }}
        />
      </div>
    </>
  );
};
