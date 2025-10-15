/**
 * @luckdb/bigtable
 *
 * 新一代高性能表格组件
 *
 * 特性：
 * - 🚀 极致性能 - 支持百万级单元格
 * - 🎨 多渲染模式 - DOM / Canvas / WebGL
 * - 📦 体积小 - 核心 < 50KB
 * - 🔧 Headless UI - 框架无关
 * - 💡 智能虚拟化 - 动态overscan
 * - 📊 性能监控 - 实时FPS/渲染时间
 *
 * @packageDocumentation
 */

// React Components
export { BigTable, type IBigTableProps } from './react';
export { useBigTable, type IUseBigTableConfig, type IUseBigTableReturn } from './react';

// Core Engine (for advanced usage)
export {
  GridEngine,
  CoordinateSystem,
  VirtualScroller,
  CanvasRenderer,
  type IRenderer,
} from './core';

// Types
export type {
  IRow,
  IColumn,
  ICell,
  ITheme,
  IScrollState,
  IVisibleRegion,
  IPerformanceMetrics,
  RenderMode,
} from './core';
