/**
 * Boolean Field Model
 * Checkbox fields
 */

import { Field } from './Field';

export class BooleanField extends Field {
  validate(value: unknown): boolean {
    if (this.isEmpty(value)) {
      return true;
    }
    return typeof value === 'boolean';
  }

  format(value: unknown): string {
    if (this.isEmpty(value)) {
      return '';
    }
    return value ? '✓' : '';
  }

  getEmptyValue(): boolean {
    return false;
  }

  toCellValue(value: unknown): boolean {
    if (this.isEmpty(value)) {
      return false;
    }
    return Boolean(value);
  }

  fromCellValue(cellValue: any): boolean {
    if (cellValue === null || cellValue === undefined) {
      return false;
    }
    return Boolean(cellValue);
  }
}


