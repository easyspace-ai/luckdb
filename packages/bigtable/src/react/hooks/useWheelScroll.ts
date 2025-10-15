import { useEffect, useCallback } from 'react';
import type { GridEngine } from '../../core/engine/GridEngine';

interface UseWheelScrollParams {
  containerRef: React.RefObject<HTMLDivElement>;
  engine: GridEngine | null;
}

// 优化滚轮增量计算（参考 Grid 实现）
const getWheelDelta = (event: WheelEvent, pageHeight = 600, lineHeight = 20) => {
  let deltaX = event.deltaX;
  let deltaY = event.deltaY;

  // 处理不同浏览器的滚轮事件差异
  if (event.deltaMode === 1) {
    // DOM_DELTA_LINE
    deltaX *= lineHeight;
    deltaY *= lineHeight;
  } else if (event.deltaMode === 2) {
    // DOM_DELTA_PAGE
    deltaX *= pageHeight;
    deltaY *= pageHeight;
  }

  // 限制滚动增量，避免过度滚动
  const maxDelta = pageHeight * 0.5;
  deltaX = Math.max(-maxDelta, Math.min(maxDelta, deltaX));
  deltaY = Math.max(-maxDelta, Math.min(maxDelta, deltaY));

  return [deltaX, deltaY];
};

export function useWheelScroll({ containerRef, engine }: UseWheelScrollParams) {
  const scrollHandler = useCallback(
    (deltaX: number, deltaY: number) => {
      if (!engine) return;

      const scrollState = engine.getScrollState();
      engine.scrollTo(scrollState.scrollLeft + deltaX, scrollState.scrollTop + deltaY);
    },
    [engine]
  );

  const onWheel = useCallback(
    (event: WheelEvent) => {
      if (!engine) return;

      // 阻止事件冒泡到页面，防止页面滚动
      event.preventDefault();
      event.stopPropagation();

      const containerSize = engine.getContainerSize();
      const [fixedDeltaX, fixedDeltaY] = getWheelDelta({
        event,
        pageHeight: containerSize.height - 40 - 1, // 减去表头高度
        lineHeight: 20,
      });

      scrollHandler(fixedDeltaX, fixedDeltaY);
    },
    [engine, scrollHandler]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', onWheel);
    };
  }, [containerRef, onWheel]);
}
