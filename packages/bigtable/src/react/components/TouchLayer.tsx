import React, { useCallback, useRef } from 'react';
import type { GridEngine } from '../../core/engine/GridEngine';

interface TouchLayerProps {
  engine: GridEngine | null;
  containerRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
}

export const TouchLayer: React.FC<TouchLayerProps> = ({ engine, containerRef, children }) => {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);
  const velocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTouchTimeRef = useRef<number>(0);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!engine || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      touchStartRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        time: Date.now(),
      };

      touchMoveRef.current = null;
      velocityRef.current = { x: 0, y: 0 };
      lastTouchTimeRef.current = Date.now();
    },
    [engine, containerRef]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!engine || !touchStartRef.current || e.touches.length !== 1) return;

      e.preventDefault(); // 阻止页面滚动

      const touch = e.touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const currentX = touch.clientX - rect.left;
      const currentY = touch.clientY - rect.top;

      const deltaX = currentX - touchStartRef.current.x;
      const deltaY = currentY - touchStartRef.current.y;

      // 计算速度（用于惯性滚动）
      const now = Date.now();
      const deltaTime = now - lastTouchTimeRef.current;
      if (deltaTime > 0) {
        velocityRef.current = {
          x: deltaX / deltaTime,
          y: deltaY / deltaTime,
        };
      }

      touchMoveRef.current = { x: currentX, y: currentY };
      lastTouchTimeRef.current = now;

      // 应用滚动
      const scrollState = engine.getScrollState();
      engine.scrollTo(
        Math.max(0, scrollState.scrollLeft - deltaX),
        Math.max(0, scrollState.scrollTop - deltaY)
      );
    },
    [engine, containerRef]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!engine || !touchStartRef.current) return;

      // 惯性滚动
      const velocity = velocityRef.current;
      const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

      if (speed > 0.5) {
        // 最小速度阈值
        const friction = 0.95; // 摩擦系数
        const maxDuration = 1000; // 最大惯性滚动时间

        const currentVelocity = { ...velocity };
        let duration = 0;

        const animate = () => {
          if (
            duration >= maxDuration ||
            (Math.abs(currentVelocity.x) < 0.1 && Math.abs(currentVelocity.y) < 0.1)
          ) {
            return;
          }

          const scrollState = engine.getScrollState();
          engine.scrollTo(
            Math.max(0, scrollState.scrollLeft - currentVelocity.x * 16), // 16ms 帧间隔
            Math.max(0, scrollState.scrollTop - currentVelocity.y * 16)
          );

          currentVelocity.x *= friction;
          currentVelocity.y *= friction;
          duration += 16;

          requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
      }

      // 重置状态
      touchStartRef.current = null;
      touchMoveRef.current = null;
      velocityRef.current = { x: 0, y: 0 };
    },
    [engine]
  );

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return <>{children}</>;
};
