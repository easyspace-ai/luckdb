// @ts-nocheck
/**
 * Number Field Model
 * Numeric fields with formatting options
 */

import { Field } from './Field';

export interface INumberFieldOptions {
  precision?: number;
  formatting?: {
    type?: 'number' | 'currency' | 'percent';
    symbol?: string;
    showThousandsSeparator?: boolean;
  };
}

export class NumberField extends Field {

  validate(value: unknown): boolean {
    if (this.isEmpty(value)) {
      return true;
    }
    return typeof value === 'number' && !isNaN(value);
  }

  format(value: unknown): string {
    if (this.isEmpty(value)) {
      return '';
    }

    const num = typeof value === 'string' ? parseFloat(value) : (value as number);
    if (isNaN(num)) {
      return '';
    }

    const precision = this.options.precision ?? 0;
    const formatting = this.options.formatting || {};

    let formatted = num.toFixed(precision);

    // Apply thousands separator
    if (formatting.showThousandsSeparator) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }

    // Apply formatting type
    switch (formatting.type) {
      case 'currency':
        return `${formatting.symbol || '$'}${formatted}`;
      case 'percent':
        return `${formatted}%`;
      default:
        return formatted;
    }
  }

  getEmptyValue(): null {
    return null;
  }

  toCellValue(value: unknown): number | null {
    if (this.isEmpty(value)) {
      return null;
    }

    const num = typeof value === 'string' ? parseFloat(value) : (value as number);
    if (isNaN(num)) {
      return null;
    }

    const precision = this.options.precision ?? 0;
    return parseFloat(num.toFixed(precision));
  }

  fromCellValue(cellValue: any): number | null {
    if (cellValue === null || cellValue === undefined) {
      return null;
    }
    const num = typeof cellValue === 'string' ? parseFloat(cellValue) : cellValue;
    return isNaN(num) ? null : num;
  }
}


