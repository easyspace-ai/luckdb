/**
 * useBigTable - 主 Hook
 * 将核心引擎包装成 React Hook
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { GridEngine, CanvasRenderer } from '../../core';
import type {
  IGridEngineConfig,
  IRow,
  IColumn,
  ICellPosition,
  IPerformanceMetrics,
} from '../../core';

export interface IUseBigTableConfig
  extends Omit<IGridEngineConfig, 'containerWidth' | 'containerHeight'> {
  // 容器尺寸会自动检测
}

export interface IUseBigTableReturn {
  // 引擎实例
  engine: GridEngine | null;

  // Canvas ref
  canvasRef: React.RefObject<HTMLCanvasElement>;
  containerRef: React.RefObject<HTMLDivElement>;

  // 状态
  isReady: boolean;
  performanceMetrics: IPerformanceMetrics;

  // 方法
  scrollTo: (scrollLeft?: number, scrollTop?: number) => void;
  updateData: (rows?: IRow[], columns?: IColumn[]) => void;
  getCellAtPoint: (x: number, y: number) => ICellPosition | null;
}

export const useBigTable = (config: IUseBigTableConfig): IUseBigTableReturn => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GridEngine | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<IPerformanceMetrics>({
    fps: 0,
    renderTime: 0,
    scrollTime: 0,
    totalCells: 0,
    visibleCells: 0,
  });

  // 初始化引擎
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) {
      return;
    }

    // 获取容器尺寸
    const rect = container.getBoundingClientRect();

    // 创建引擎
    const engine = new GridEngine({
      ...config,
      containerWidth: rect.width,
      containerHeight: rect.height,
    });

    // 创建渲染器
    const renderer = new CanvasRenderer(canvas);
    engine.setRenderer(renderer);

    // 开始渲染循环
    engine.startRenderLoop();

    engineRef.current = engine;
    setIsReady(true);

    // 性能监控
    const metricsInterval = setInterval(() => {
      const metrics = engine.getPerformanceMetrics();
      setPerformanceMetrics(metrics);
    }, 1000);

    // 清理
    return () => {
      clearInterval(metricsInterval);
      engine.destroy();
      engineRef.current = null;
      setIsReady(false);
    };
  }, [config.rows, config.columns, config.renderMode]);

  // 监听容器尺寸变化
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !engineRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry && engineRef.current) {
        const { width, height } = entry.contentRect;
        engineRef.current.updateContainerSize(width, height);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 滚动方法
  const scrollTo = useCallback((scrollLeft?: number, scrollTop?: number) => {
    engineRef.current?.scrollTo(scrollLeft, scrollTop);
  }, []);

  // 更新数据
  const updateData = useCallback((rows?: IRow[], columns?: IColumn[]) => {
    engineRef.current?.updateData(rows, columns);
  }, []);

  // 根据坐标获取单元格
  const getCellAtPoint = useCallback((x: number, y: number) => {
    return engineRef.current?.getCellAtPoint(x, y) || null;
  }, []);

  return {
    engine: engineRef.current,
    canvasRef,
    containerRef,
    isReady,
    performanceMetrics,
    scrollTo,
    updateData,
    getCellAtPoint,
  };
};
