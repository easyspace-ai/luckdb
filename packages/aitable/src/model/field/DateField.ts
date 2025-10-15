// @ts-nocheck
/**
 * Date Field Model
 * Date and datetime fields
 */

import { Field } from './Field';
import { format as formatDate, parseISO } from 'date-fns';

export interface IDateFieldOptions {
  formatting?: {
    date?: string; // e.g., 'yyyy-MM-dd'
    time?: string; // e.g., 'HH:mm:ss'
    timeZone?: string;
  };
  includeTime?: boolean;
}

export class DateField extends Field {
  // options类型继承自基类Field，使用时需要类型断言为IDateFieldOptions

  validate(value: unknown): boolean {
    if (this.isEmpty(value)) {
      return true;
    }

    if (typeof value === 'string') {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }

    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }

    return false;
  }

  format(value: unknown): string {
    if (this.isEmpty(value)) {
      return '';
    }

    try {
      const date =
        typeof value === 'string'
          ? parseISO(value)
          : value instanceof Date
          ? value
          : new Date(value as any);

      if (isNaN(date.getTime())) {
        return '';
      }

      const dateFormat = this.options.formatting?.date ?? 'yyyy-MM-dd';
      const timeFormat = this.options.formatting?.time ?? 'HH:mm';

      if (this.options.includeTime) {
        return formatDate(date, `${dateFormat} ${timeFormat}`);
      }

      return formatDate(date, dateFormat);
    } catch (error) {
      return '';
    }
  }

  getEmptyValue(): null {
    return null;
  }

  toCellValue(value: unknown): string | null {
    if (this.isEmpty(value)) {
      return null;
    }

    try {
      const date =
        typeof value === 'string'
          ? new Date(value)
          : value instanceof Date
          ? value
          : new Date(value as any);

      if (isNaN(date.getTime())) {
        return null;
      }

      return date.toISOString();
    } catch (error) {
      return null;
    }
  }

  fromCellValue(cellValue: any): Date | null {
    if (cellValue === null || cellValue === undefined) {
      return null;
    }

    try {
      const date = typeof cellValue === 'string' ? parseISO(cellValue) : new Date(cellValue);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      return null;
    }
  }
}


