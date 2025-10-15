/**
 * CoordinateSystem - 坐标系统
 * 负责所有位置计算、偏移量计算、可见区域计算
 *
 * 性能优化：
 * 1. 缓存所有计算结果
 * 2. 增量更新而非全量重算
 * 3. 使用 Map 存储，O(1) 查找
 */

import type { IColumn, IRow, IVisibleRegion, IRectangle, ICellPosition } from '../types';

export interface ICoordinateSystemConfig {
  rows: IRow[];
  columns: IColumn[];
  containerWidth: number;
  containerHeight: number;
  headerHeight: number;
  defaultRowHeight: number;
  frozenColumnCount?: number;
}

export class CoordinateSystem {
  // 配置
  private rows: IRow[];
  private columns: IColumn[];
  private containerWidth: number;
  private containerHeight: number;
  private headerHeight: number;
  private defaultRowHeight: number;
  private frozenColumnCount: number;

  // 缓存
  private rowOffsetCache: Map<number, number> = new Map();
  private columnOffsetCache: Map<number, number> = new Map();
  private totalWidth: number = 0;
  private totalHeight: number = 0;
  private frozenWidth: number = 0;

  constructor(config: ICoordinateSystemConfig) {
    this.rows = config.rows;
    this.columns = config.columns;
    this.containerWidth = config.containerWidth;
    this.containerHeight = config.containerHeight;
    this.headerHeight = config.headerHeight;
    this.defaultRowHeight = config.defaultRowHeight;
    this.frozenColumnCount = config.frozenColumnCount || 0;

    this.calculateDimensions();
  }

  // ==================== 公共 API ====================

  /**
   * 获取行偏移量（Y 坐标）
   */
  getRowOffset(rowIndex: number): number {
    if (this.rowOffsetCache.has(rowIndex)) {
      return this.rowOffsetCache.get(rowIndex)!;
    }

    let offset = this.headerHeight;
    for (let i = 0; i < rowIndex; i++) {
      offset += this.getRowHeight(i);
    }

    this.rowOffsetCache.set(rowIndex, offset);
    return offset;
  }

  /**
   * 获取列偏移量（X 坐标）
   */
  getColumnOffset(columnIndex: number): number {
    if (this.columnOffsetCache.has(columnIndex)) {
      return this.columnOffsetCache.get(columnIndex)!;
    }

    let offset = 0;
    for (let i = 0; i < columnIndex; i++) {
      offset += this.getColumnWidth(i);
    }

    this.columnOffsetCache.set(columnIndex, offset);
    return offset;
  }

  /**
   * 获取行高度
   */
  getRowHeight(rowIndex: number): number {
    return this.rows[rowIndex]?.height || this.defaultRowHeight;
  }

  /**
   * 获取列宽度
   */
  getColumnWidth(columnIndex: number): number {
    return this.columns[columnIndex]?.width || 100;
  }

  /**
   * 获取单元格矩形
   */
  getCellRect(position: ICellPosition): IRectangle {
    const x = this.getColumnOffset(position.columnIndex);
    const y = this.getRowOffset(position.rowIndex);
    const width = this.getColumnWidth(position.columnIndex);
    const height = this.getRowHeight(position.rowIndex);

    return { x, y, width, height };
  }

  /**
   * 根据坐标获取单元格位置
   */
  getCellPositionAtPoint(
    x: number,
    y: number,
    scrollLeft: number,
    scrollTop: number
  ): ICellPosition | null {
    // 调整坐标（加上滚动偏移）
    const adjustedX = x + scrollLeft;
    const adjustedY = y + scrollTop; // getRowOffset 已经包含了 headerHeight，所以不需要减

    // 二分查找列
    const columnIndex = this.binarySearchColumn(adjustedX);

    // 二分查找行（只在数据区域查找）
    const rowIndex = adjustedY < this.headerHeight ? -1 : this.binarySearchRow(adjustedY);

    if (columnIndex === -1 || rowIndex === -1) {
      return null;
    }

    return { rowIndex, columnIndex };
  }

  /**
   * 计算可见区域
   */
  getVisibleRegion(scrollLeft: number, scrollTop: number): IVisibleRegion {
    const rowStartIndex = this.binarySearchRow(scrollTop);
    const rowEndIndex = this.binarySearchRow(scrollTop + this.containerHeight - this.headerHeight);

    const columnStartIndex = this.binarySearchColumn(scrollLeft);
    const columnEndIndex = this.binarySearchColumn(scrollLeft + this.containerWidth);

    return {
      rowStartIndex: Math.max(0, rowStartIndex),
      rowEndIndex: Math.min(this.rows.length - 1, rowEndIndex + 1),
      columnStartIndex: Math.max(0, columnStartIndex),
      columnEndIndex: Math.min(this.columns.length - 1, columnEndIndex + 1),
    };
  }

  /**
   * 获取总宽度
   */
  getTotalWidth(): number {
    return this.totalWidth;
  }

  /**
   * 获取总高度
   */
  getTotalHeight(): number {
    return this.totalHeight;
  }

  /**
   * 获取冻结列宽度
   */
  getFrozenWidth(): number {
    return this.frozenWidth;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ICoordinateSystemConfig>): void {
    if (config.rows) this.rows = config.rows;
    if (config.columns) this.columns = config.columns;
    if (config.containerWidth !== undefined) this.containerWidth = config.containerWidth;
    if (config.containerHeight !== undefined) this.containerHeight = config.containerHeight;
    if (config.frozenColumnCount !== undefined) this.frozenColumnCount = config.frozenColumnCount;

    // 清空缓存
    this.rowOffsetCache.clear();
    this.columnOffsetCache.clear();

    // 重新计算
    this.calculateDimensions();
  }

  // ==================== 私有方法 ====================

  /**
   * 计算总尺寸
   */
  private calculateDimensions(): void {
    // 计算总宽度
    this.totalWidth = this.columns.reduce((sum, col) => sum + (col.width || 100), 0);

    // 计算总高度
    this.totalHeight =
      this.headerHeight +
      this.rows.reduce((sum, row) => sum + (row.height || this.defaultRowHeight), 0);

    // 计算冻结列宽度
    this.frozenWidth = this.columns
      .slice(0, this.frozenColumnCount)
      .reduce((sum, col) => sum + (col.width || 100), 0);
  }

  /**
   * 二分查找行索引
   */
  private binarySearchRow(offset: number): number {
    let left = 0;
    let right = this.rows.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const rowOffset = this.getRowOffset(mid);
      const rowHeight = this.getRowHeight(mid);

      if (offset >= rowOffset && offset < rowOffset + rowHeight) {
        return mid;
      } else if (offset < rowOffset) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return left < this.rows.length ? left : this.rows.length - 1;
  }

  /**
   * 二分查找列索引
   */
  private binarySearchColumn(offset: number): number {
    let left = 0;
    let right = this.columns.length - 1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const columnOffset = this.getColumnOffset(mid);
      const columnWidth = this.getColumnWidth(mid);

      if (offset >= columnOffset && offset < columnOffset + columnWidth) {
        return mid;
      } else if (offset < columnOffset) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return left < this.columns.length ? left : this.columns.length - 1;
  }
}
