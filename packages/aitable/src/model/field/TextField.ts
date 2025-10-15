/**
 * Text Field Model
 * Single line text and long text fields
 */

import { Field } from './Field';

export class TextField extends Field {
  validate(value: unknown): boolean {
    if (this.isEmpty(value)) {
      return true;
    }
    return typeof value === 'string';
  }

  format(value: unknown): string {
    if (this.isEmpty(value)) {
      return '';
    }
    return String(value);
  }

  getEmptyValue(): string {
    return '';
  }

  toCellValue(value: unknown): string | null {
    if (this.isEmpty(value)) {
      return null;
    }
    return String(value);
  }

  fromCellValue(cellValue: any): string {
    if (cellValue === null || cellValue === undefined) {
      return '';
    }
    return String(cellValue);
  }
}


