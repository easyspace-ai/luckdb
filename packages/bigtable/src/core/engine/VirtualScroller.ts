/**
 * VirtualScroller - 智能虚拟滚动
 *
 * 特性：
 * 1. 动态overscan - 根据滚动速度调整缓冲区
 * 2. 预测加载 - 预判滚动方向，提前加载
 * 3. 滚动优化 - 防抖、节流、RAF优化
 */

import type { IVisibleRegion } from '../types';

export interface IVirtualScrollerConfig {
  enabled: boolean;
  overscanCount?: number;
  dynamicOverscan?: boolean;
}

export class VirtualScroller {
  private enabled: boolean;
  private baseOverscanCount: number;
  private dynamicOverscan: boolean;

  // 滚动状态
  private lastScrollTop: number = 0;
  private lastScrollLeft: number = 0;
  private lastScrollTime: number = 0;
  private scrollVelocity: number = 0;
  private scrollDirection: 'up' | 'down' | 'left' | 'right' | 'none' = 'none';

  constructor(config: IVirtualScrollerConfig) {
    this.enabled = config.enabled;
    this.baseOverscanCount = config.overscanCount || 3;
    this.dynamicOverscan = config.dynamicOverscan !== false;
  }

  /**
   * 计算扩展后的可见区域（包含 overscan）
   */
  getExtendedVisibleRegion(
    baseRegion: IVisibleRegion,
    scrollTop: number,
    scrollLeft: number,
    totalRows: number,
    totalColumns: number
  ): IVisibleRegion {
    if (!this.enabled) {
      return baseRegion;
    }

    // 更新滚动状态
    this.updateScrollState(scrollTop, scrollLeft);

    // 计算 overscan 数量
    const overscanCount = this.calculateOverscanCount();

    // 根据滚动方向智能扩展
    let { rowStartIndex, rowEndIndex, columnStartIndex, columnEndIndex } = baseRegion;

    // 垂直方向
    if (this.scrollDirection === 'down') {
      // 向下滚动，增加底部overscan
      rowEndIndex = Math.min(totalRows - 1, rowEndIndex + overscanCount * 2);
      rowStartIndex = Math.max(0, rowStartIndex - overscanCount);
    } else if (this.scrollDirection === 'up') {
      // 向上滚动，增加顶部overscan
      rowStartIndex = Math.max(0, rowStartIndex - overscanCount * 2);
      rowEndIndex = Math.min(totalRows - 1, rowEndIndex + overscanCount);
    } else {
      // 静止或慢速滚动，平均分配
      rowStartIndex = Math.max(0, rowStartIndex - overscanCount);
      rowEndIndex = Math.min(totalRows - 1, rowEndIndex + overscanCount);
    }

    // 水平方向
    if (this.scrollDirection === 'right') {
      columnEndIndex = Math.min(totalColumns - 1, columnEndIndex + overscanCount * 2);
      columnStartIndex = Math.max(0, columnStartIndex - overscanCount);
    } else if (this.scrollDirection === 'left') {
      columnStartIndex = Math.max(0, columnStartIndex - overscanCount * 2);
      columnEndIndex = Math.min(totalColumns - 1, columnEndIndex + overscanCount);
    } else {
      columnStartIndex = Math.max(0, columnStartIndex - overscanCount);
      columnEndIndex = Math.min(totalColumns - 1, columnEndIndex + overscanCount);
    }

    return {
      rowStartIndex,
      rowEndIndex,
      columnStartIndex,
      columnEndIndex,
    };
  }

  /**
   * 更新滚动状态
   */
  private updateScrollState(scrollTop: number, scrollLeft: number): void {
    const now = performance.now();
    const deltaTime = now - this.lastScrollTime;
    const deltaY = scrollTop - this.lastScrollTop;
    const deltaX = scrollLeft - this.lastScrollLeft;

    // 计算滚动速度（px/s）
    if (deltaTime > 0) {
      this.scrollVelocity = (Math.abs(Math.max(deltaY, deltaX)) / deltaTime) * 1000;
    }

    // 确定滚动方向
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      this.scrollDirection = deltaY > 0 ? 'down' : deltaY < 0 ? 'up' : 'none';
    } else {
      this.scrollDirection = deltaX > 0 ? 'right' : deltaX < 0 ? 'left' : 'none';
    }

    // 更新状态
    this.lastScrollTop = scrollTop;
    this.lastScrollLeft = scrollLeft;
    this.lastScrollTime = now;
  }

  /**
   * 根据滚动速度动态计算 overscan 数量
   */
  private calculateOverscanCount(): number {
    if (!this.dynamicOverscan) {
      return this.baseOverscanCount;
    }

    // 速度越快，overscan 越多
    if (this.scrollVelocity > 2000) {
      return this.baseOverscanCount * 4; // 极快滚动
    } else if (this.scrollVelocity > 1000) {
      return this.baseOverscanCount * 3; // 快速滚动
    } else if (this.scrollVelocity > 500) {
      return this.baseOverscanCount * 2; // 中速滚动
    } else {
      return this.baseOverscanCount; // 慢速/静止
    }
  }

  /**
   * 获取当前滚动速度
   */
  getScrollVelocity(): number {
    return this.scrollVelocity;
  }

  /**
   * 获取滚动方向
   */
  getScrollDirection(): string {
    return this.scrollDirection;
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.lastScrollTop = 0;
    this.lastScrollLeft = 0;
    this.lastScrollTime = 0;
    this.scrollVelocity = 0;
    this.scrollDirection = 'none';
  }
}
