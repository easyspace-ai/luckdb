/**
 * CoordinateManager - Handles cell positioning and sizing calculations
 * Extracted from aitable and made type-safe
 */

export enum ItemType {
  Row = 'Row',
  Column = 'Column',
}

export interface CellMetadata {
  size: number;
  offset: number;
}

export type IndicesMap = Record<number, number>;
export type CellMetadataMap = Record<number, CellMetadata>;

export interface CoordinateConfig {
  rowCount: number;
  pureRowCount?: number;
  columnCount: number;
  containerWidth: number;
  containerHeight: number;
  rowHeight: number;
  columnWidth: number;
  rowHeightMap?: IndicesMap;
  columnWidthMap?: IndicesMap;
  rowInitSize?: number;
  columnInitSize?: number;
  freezeColumnCount?: number;
}

export class CoordinateManager {
  protected defaultRowHeight: number;
  protected defaultColumnWidth: number;
  public pureRowCount: number;
  public rowCount: number;
  public columnCount: number;
  private _containerWidth: number;
  private _containerHeight: number;
  public rowHeightMap: IndicesMap = {};
  public columnWidthMap: IndicesMap = {};
  public rowInitSize: number;
  public columnInitSize: number;
  public lastRowIndex = -1;
  public lastColumnIndex = -1;
  public rowMetaDataMap: CellMetadataMap = {};
  public columnMetaDataMap: CellMetadataMap = {};
  private _freezeColumnCount: number;

  constructor(config: CoordinateConfig) {
    this.defaultRowHeight = config.rowHeight;
    this.defaultColumnWidth = config.columnWidth;
    this.rowCount = config.rowCount;
    this.pureRowCount = config.pureRowCount ?? config.rowCount;
    this.columnCount = config.columnCount;
    this.rowInitSize = config.rowInitSize ?? 0;
    this.columnInitSize = config.columnInitSize ?? 0;
    this._containerWidth = config.containerWidth;
    this._containerHeight = config.containerHeight;
    this.rowHeightMap = config.rowHeightMap ?? {};
    this.columnWidthMap = config.columnWidthMap ?? {};
    this._freezeColumnCount = config.freezeColumnCount ?? 1;
  }

  public get freezeRegionWidth(): number {
    return this.getColumnOffset(this._freezeColumnCount);
  }

  public get freezeColumnCount(): number {
    return this._freezeColumnCount;
  }

  public set freezeColumnCount(count: number) {
    this._freezeColumnCount = count;
  }

  public get containerWidth(): number {
    return this._containerWidth;
  }

  public set containerWidth(width: number) {
    this._containerWidth = width;
  }

  public get containerHeight(): number {
    return this._containerHeight;
  }

  public set containerHeight(height: number) {
    this._containerHeight = height;
  }

  public get columnWidth(): number {
    return this.defaultColumnWidth;
  }

  public set columnWidth(width: number) {
    this.defaultColumnWidth = width;
  }

  public get rowHeight(): number {
    return this.defaultRowHeight;
  }

  public set rowHeight(height: number) {
    this.defaultRowHeight = height;
  }

  public get totalWidth(): number {
    const { offset, size } = this.getCellMetaData(this.columnCount - 1, ItemType.Column);
    return offset + size;
  }

  public get totalHeight(): number {
    const { offset, size } = this.getCellMetaData(this.rowCount - 1, ItemType.Row);
    return offset + size;
  }

  public getRowHeight(index: number): number {
    return this.rowHeightMap[index] ?? this.defaultRowHeight;
  }

  public getColumnWidth(index: number): number {
    return this.columnWidthMap[index] ?? this.defaultColumnWidth;
  }

  protected getCellMetaData(index: number, itemType: ItemType): CellMetadata {
    let cellMetadataMap: CellMetadataMap;
    let itemSize: number;
    let lastMeasuredIndex: number;
    let offset: number;
    const isColumnType = itemType === ItemType.Column;

    if (isColumnType) {
      itemSize = this.columnWidth;
      offset = this.columnInitSize;
      lastMeasuredIndex = this.lastColumnIndex;
      cellMetadataMap = this.columnMetaDataMap;
    } else {
      itemSize = this.rowHeight;
      offset = this.rowInitSize;
      lastMeasuredIndex = this.lastRowIndex;
      cellMetadataMap = this.rowMetaDataMap;
    }

    if (index > lastMeasuredIndex) {
      const itemMetadata = cellMetadataMap[lastMeasuredIndex];
      if (lastMeasuredIndex >= 0 && itemMetadata) {
        offset = itemMetadata.offset + itemMetadata.size;
      }

      for (let i = lastMeasuredIndex + 1; i <= index; i++) {
        const size = (isColumnType ? this.columnWidthMap[i] : this.rowHeightMap[i]) ?? itemSize;

        cellMetadataMap[i] = {
          offset,
          size,
        };
        offset += size;
      }

      if (isColumnType) {
        this.lastColumnIndex = index;
      } else {
        this.lastRowIndex = index;
      }
    }

    return cellMetadataMap[index] ?? { size: 0, offset: 0 };
  }

  private findNearestCellIndexLinear(index: number, offset: number, itemType: ItemType): number {
    const itemCount = itemType === ItemType.Column ? this.columnCount : this.rowCount;
    let interval = 1;

    while (index < itemCount && this.getCellMetaData(index, itemType).offset < offset) {
      index += interval;
      interval *= 2;
    }

    return this.findNearestCellIndexBinary(
      offset,
      Math.floor(index / 2),
      Math.min(index, itemCount - 1),
      itemType
    );
  }

  private findNearestCellIndexBinary(
    offset: number,
    low: number,
    high: number,
    itemType: ItemType
  ): number {
    while (low <= high) {
      const middle = low + Math.floor((high - low) / 2);
      const currentOffset = this.getCellMetaData(middle, itemType).offset;

      if (currentOffset === offset) {
        return middle;
      } else if (currentOffset < offset) {
        low = middle + 1;
      } else if (currentOffset > offset) {
        high = middle - 1;
      }
    }
    return low > 0 ? low - 1 : 0;
  }

  public findNearestCellIndex(offset: number, itemType: ItemType): number {
    let itemMetadataMap: CellMetadataMap;
    let lastIndex: number;

    if (itemType === ItemType.Column) {
      itemMetadataMap = this.columnMetaDataMap;
      lastIndex = this.lastColumnIndex;
    } else {
      itemMetadataMap = this.rowMetaDataMap;
      lastIndex = this.lastRowIndex;
    }

    const lastMeasuredItemOffset = lastIndex > 0 ? itemMetadataMap[lastIndex]?.offset ?? 0 : 0;

    if (lastMeasuredItemOffset >= offset) {
      return this.findNearestCellIndexBinary(offset, 0, lastIndex, itemType);
    }
    return this.findNearestCellIndexLinear(Math.max(0, lastIndex), offset, itemType);
  }

  public getRowStartIndex(scrollTop: number): number {
    return this.findNearestCellIndex(scrollTop, ItemType.Row);
  }

  public getRowStopIndex(startIndex: number, scrollTop: number): number {
    const itemMetadata = this.getCellMetaData(startIndex, ItemType.Row);
    const maxOffset = scrollTop + this._containerHeight;
    let offset = itemMetadata.offset + itemMetadata.size;
    let stopIndex = startIndex;

    while (stopIndex < this.rowCount - 1 && offset < maxOffset) {
      stopIndex++;
      offset += this.getCellMetaData(stopIndex, ItemType.Row).size;
    }
    return stopIndex;
  }

  public getColumnStartIndex(scrollLeft: number): number {
    return this.findNearestCellIndex(scrollLeft, ItemType.Column);
  }

  public getColumnStopIndex(startIndex: number, scrollLeft: number): number {
    const itemMetadata = this.getCellMetaData(startIndex, ItemType.Column);
    const maxOffset = scrollLeft + this._containerWidth;
    let offset = itemMetadata.offset + itemMetadata.size;
    let stopIndex = startIndex;

    while (stopIndex < this.columnCount - 1 && offset < maxOffset) {
      stopIndex++;
      offset += this.getCellMetaData(stopIndex, ItemType.Column).size;
    }
    return stopIndex;
  }

  public getRowOffset(rowIndex: number): number {
    return this.getCellMetaData(rowIndex, ItemType.Row).offset;
  }

  public getColumnOffset(columnIndex: number): number {
    return this.getCellMetaData(columnIndex, ItemType.Column).offset;
  }

  public getColumnRelativeOffset(columnIndex: number, scrollLeft: number): number {
    const x = this.getColumnOffset(columnIndex);
    return columnIndex < this._freezeColumnCount ? x : x - scrollLeft;
  }

  public refreshColumnDimensions(config: {
    columnCount: number;
    columnInitSize?: number;
    columnWidthMap?: IndicesMap;
  }): void {
    this.columnCount = config.columnCount;
    this.columnInitSize = config.columnInitSize ?? 0;
    this.columnWidthMap = config.columnWidthMap ?? {};
    this.lastColumnIndex = -1;
  }

  /**
   * Get cell rectangle (position and size)
   */
  public getCellRect(row: number, col: number): {
    x: number;
    y: number;
    width: number;
    height: number;
  } {
    return {
      x: this.getColumnOffset(col),
      y: this.getRowOffset(row),
      width: this.getColumnWidth(col),
      height: this.getRowHeight(row),
    };
  }
}

