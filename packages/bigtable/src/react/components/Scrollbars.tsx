import React, { useEffect, useRef, useMemo } from 'react';
import type { GridEngine } from '../../core/engine/GridEngine';

interface ScrollbarsProps {
  engine: GridEngine | null;
  containerRef: React.RefObject<HTMLDivElement>;
}

export const Scrollbars: React.FC<ScrollbarsProps> = ({ engine, containerRef }) => {
  const horizontalScrollRef = useRef<HTMLDivElement | null>(null);
  const verticalScrollRef = useRef<HTMLDivElement | null>(null);

  // 初始化滚动条尺寸
  useEffect(() => {
    if (!engine) return;

    const updateScrollbars = () => {
      const total = engine.getTotalSize();
      const container = engine.getContainerSize();

      // 更新水平滚动条内容尺寸
      if (horizontalScrollRef.current) {
        const content = horizontalScrollRef.current.querySelector('div');
        if (content) {
          content.style.width = `${total.width}px`;
        }
      }

      // 更新垂直滚动条内容尺寸
      if (verticalScrollRef.current) {
        const content = verticalScrollRef.current.querySelector('div');
        if (content) {
          content.style.height = `${total.height}px`;
        }
      }
    };

    // 监听引擎变化
    engine.on('render', updateScrollbars as any);
    updateScrollbars(); // 立即执行一次

    return () => {
      engine.off('render', updateScrollbars as any);
    };
  }, [engine]);

  const handleHorizontalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!engine) return;
    const scrollLeft = e.currentTarget.scrollLeft;
    console.log('[Scrollbars] Horizontal scroll:', scrollLeft);
    // 防止无限循环
    const currentState = engine.getScrollState();
    if (Math.abs(currentState.scrollLeft - scrollLeft) > 1) {
      console.log('[Scrollbars] Updating engine scrollLeft to:', scrollLeft);
      engine.scrollTo(scrollLeft, undefined);
    }
  };

  const handleVerticalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!engine) return;
    const scrollTop = e.currentTarget.scrollTop;
    console.log('[Scrollbars] Vertical scroll:', scrollTop);
    // 防止无限循环
    const currentState = engine.getScrollState();
    if (Math.abs(currentState.scrollTop - scrollTop) > 1) {
      console.log('[Scrollbars] Updating engine scrollTop to:', scrollTop);
      engine.scrollTo(undefined, scrollTop);
    }
  };

  // 获取滚动尺寸
  const scrollDimensions = useMemo(() => {
    if (!engine)
      return { scrollWidth: 1000, scrollHeight: 1000, containerWidth: 800, containerHeight: 600 };

    const total = engine.getTotalSize();
    const container = engine.getContainerSize();

    return {
      scrollWidth: Math.max(total.width, container.width),
      scrollHeight: Math.max(total.height, container.height),
      containerWidth: container.width,
      containerHeight: container.height,
    };
  }, [engine]);

  const placeholderElements = useMemo(() => {
    const res = [];
    let h = 0;
    let key = 0;

    while (h < scrollDimensions.scrollHeight) {
      const curH = Math.min(5000000, scrollDimensions.scrollHeight - h);
      res.push(<div key={key++} style={{ width: 0, height: curH }} />);
      h += curH;
    }
    return res;
  }, [scrollDimensions.scrollHeight]);

  // 调试：强制显示滚动条进行测试
  const showH = true; // engine && scrollDimensions.scrollWidth > scrollDimensions.containerWidth;
  const showV = true; // engine && scrollDimensions.scrollHeight > scrollDimensions.containerHeight;

  // 添加调试日志
  console.log('[Scrollbars] Dimensions:', scrollDimensions);
  console.log('[Scrollbars] Show H:', showH, 'Show V:', showV);

  return (
    <>
      {/* 水平滚动条 */}
      {showH && (
        <div
          ref={horizontalScrollRef}
          className="scrollbar scrollbar-thumb-foreground/40 scrollbar-thumb-rounded-md scrollbar-h-[10px] cursor-pointer will-change-transform"
          style={{
            position: 'absolute',
            bottom: 2,
            left: 0,
            width: scrollDimensions.containerWidth - (showV ? 16 : 0),
            height: 16,
            overflowX: 'scroll',
            overflowY: 'hidden',
            zIndex: 10001, // 确保滚动条在最上层，高于所有其他元素
          }}
          onScroll={handleHorizontalScroll}
        >
          <div
            style={{
              position: 'absolute',
              width: scrollDimensions.scrollWidth,
              height: 1,
            }}
          />
        </div>
      )}

      {/* 垂直滚动条 */}
      {showV && (
        <div
          ref={verticalScrollRef}
          className="scrollbar scrollbar-thumb-foreground/40 scrollbar-thumb-rounded-md scrollbar-w-[10px] scrollbar-min-thumb cursor-pointer will-change-transform"
          style={{
            position: 'absolute',
            right: 2,
            top: 0,
            width: 16,
            height: scrollDimensions.containerHeight - (showH ? 16 : 0),
            overflowX: 'hidden',
            overflowY: 'scroll',
            zIndex: 10001, // 确保滚动条在最上层，高于所有其他元素
          }}
          onScroll={handleVerticalScroll}
        >
          <div className="flex w-px shrink-0 flex-col">{placeholderElements}</div>
        </div>
      )}
    </>
  );
};
