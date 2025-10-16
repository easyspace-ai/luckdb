/**
 * Canvas rendering types
 */

import { Rect } from './core';

export interface CellStyle {
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  padding?: number;
  bold?: boolean;
  italic?: boolean;
}

export interface CellRenderContext {
  ctx: CanvasRenderingContext2D;
  rect: Rect;
  value: any;
  style: CellStyle;
  isSelected?: boolean;
  isHovered?: boolean;
  dpr: number;
}

export interface CellRenderer<TValue = any> {
  /**
   * Draw the cell content
   */
  draw(context: CellRenderContext): void;

  /**
   * Measure cell content size (optional)
   */
  measure?(value: TValue, style: CellStyle): { width: number; height: number };
}

export interface GridTheme {
  // Colors
  cellBackground: string;
  cellBackgroundHover: string;
  cellBackgroundSelected: string;
  cellBorder: string;
  cellText: string;
  headerBackground: string;
  headerText: string;
  gridLines: string;

  // Fonts
  fontSize: number;
  fontFamily: string;
  headerFontSize: number;
  headerFontWeight: string;

  // Sizes
  cellPadding: number;
  borderWidth: number;
  rowHeight: number;
  columnWidth: number;
  headerHeight: number;
}

export const defaultTheme: GridTheme = {
  cellBackground: '#ffffff',
  cellBackgroundHover: '#f5f5f5',
  cellBackgroundSelected: '#e3f2fd',
  cellBorder: '#e0e0e0',
  cellText: '#333333',
  headerBackground: '#fafafa',
  headerText: '#666666',
  gridLines: '#e0e0e0',
  
  fontSize: 14,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  headerFontSize: 13,
  headerFontWeight: '600',
  
  cellPadding: 8,
  borderWidth: 1,
  rowHeight: 40,
  columnWidth: 150,
  headerHeight: 36,
};

