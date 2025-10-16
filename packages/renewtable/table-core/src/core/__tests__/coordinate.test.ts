import { describe, it, expect } from 'vitest';
import { CoordinateManager, ItemType } from '../coordinate';

describe('CoordinateManager', () => {
  it('should calculate correct row offsets', () => {
    const manager = new CoordinateManager({
      rowHeight: 40,
      columnWidth: 150,
      rowCount: 100,
      columnCount: 10,
      containerWidth: 800,
      containerHeight: 600,
    });

    expect(manager.getRowOffset(0)).toBe(0);
    expect(manager.getRowOffset(1)).toBe(40);
    expect(manager.getRowOffset(2)).toBe(80);
    expect(manager.getRowOffset(10)).toBe(400);
  });

  it('should calculate correct column offsets', () => {
    const manager = new CoordinateManager({
      rowHeight: 40,
      columnWidth: 150,
      rowCount: 100,
      columnCount: 10,
      containerWidth: 800,
      containerHeight: 600,
    });

    expect(manager.getColumnOffset(0)).toBe(0);
    expect(manager.getColumnOffset(1)).toBe(150);
    expect(manager.getColumnOffset(2)).toBe(300);
  });

  it('should handle custom row heights', () => {
    const manager = new CoordinateManager({
      rowHeight: 40,
      columnWidth: 150,
      rowCount: 100,
      columnCount: 10,
      containerWidth: 800,
      containerHeight: 600,
      rowHeightMap: {
        0: 60,
        1: 80,
        2: 100,
      },
    });

    expect(manager.getRowOffset(0)).toBe(0);
    expect(manager.getRowOffset(1)).toBe(60);
    expect(manager.getRowOffset(2)).toBe(140);
    expect(manager.getRowOffset(3)).toBe(240);
  });

  it('should find nearest cell index', () => {
    const manager = new CoordinateManager({
      rowHeight: 40,
      columnWidth: 150,
      rowCount: 100,
      columnCount: 10,
      containerWidth: 800,
      containerHeight: 600,
    });

    expect(manager.findNearestCellIndex(0, ItemType.Row)).toBe(0);
    expect(manager.findNearestCellIndex(40, ItemType.Row)).toBe(1);
    expect(manager.findNearestCellIndex(45, ItemType.Row)).toBe(1);
    expect(manager.findNearestCellIndex(80, ItemType.Row)).toBe(2);
  });

  it('should calculate visible range', () => {
    const manager = new CoordinateManager({
      rowHeight: 40,
      columnWidth: 150,
      rowCount: 1000,
      columnCount: 20,
      containerWidth: 800,
      containerHeight: 600,
    });

    const startRow = manager.getRowStartIndex(200);
    const stopRow = manager.getRowStopIndex(startRow, 200);

    expect(startRow).toBe(5);
    expect(stopRow).toBeGreaterThan(startRow);
    expect(stopRow).toBeLessThanOrEqual(20);
  });

  it('should get cell rect', () => {
    const manager = new CoordinateManager({
      rowHeight: 40,
      columnWidth: 150,
      rowCount: 100,
      columnCount: 10,
      containerWidth: 800,
      containerHeight: 600,
    });

    const rect = manager.getCellRect(2, 3);
    
    expect(rect.x).toBe(450); // 3 * 150
    expect(rect.y).toBe(80);  // 2 * 40
    expect(rect.width).toBe(150);
    expect(rect.height).toBe(40);
  });
});

