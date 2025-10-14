/**
 * Rating Field Model
 * Star rating fields
 */

import { Field } from './Field';

export interface IRatingFieldOptions {
  max?: number;
  icon?: 'star' | 'heart' | 'thumbsUp' | 'flag';
  color?: string;
}

export class RatingField extends Field {
  declare options: IRatingFieldOptions;

  validate(value: unknown): boolean {
    if (this.isEmpty(value)) {
      return true;
    }

    if (typeof value !== 'number') {
      return false;
    }

    const max = this.options.max ?? 5;
    return value >= 0 && value <= max && Number.isInteger(value);
  }

  format(value: unknown): string {
    if (this.isEmpty(value)) {
      return '';
    }

    const rating = typeof value === 'string' ? parseInt(value, 10) : (value as number);
    if (isNaN(rating)) {
      return '';
    }

    const max = this.options.max ?? 5;
    const icon = this.getIcon();
    const filled = icon.repeat(rating);
    const empty = '☆'.repeat(Math.max(0, max - rating));
    
    return filled + empty;
  }

  getEmptyValue(): number {
    return 0;
  }

  toCellValue(value: unknown): number | null {
    if (this.isEmpty(value)) {
      return null;
    }

    const rating = typeof value === 'string' ? parseInt(value, 10) : (value as number);
    if (isNaN(rating)) {
      return null;
    }

    const max = this.options.max ?? 5;
    return Math.max(0, Math.min(max, Math.floor(rating)));
  }

  fromCellValue(cellValue: any): number {
    if (cellValue === null || cellValue === undefined) {
      return 0;
    }

    const rating = typeof cellValue === 'string' ? parseInt(cellValue, 10) : cellValue;
    const max = this.options.max ?? 5;
    return isNaN(rating) ? 0 : Math.max(0, Math.min(max, Math.floor(rating)));
  }

  /**
   * Get icon character based on icon type
   */
  private getIcon(): string {
    switch (this.options.icon) {
      case 'heart':
        return '♥';
      case 'thumbsUp':
        return '👍';
      case 'flag':
        return '🚩';
      case 'star':
      default:
        return '★';
    }
  }
}


