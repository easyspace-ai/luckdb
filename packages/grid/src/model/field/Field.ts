/**
 * Base Field Model
 * Abstract base class for all field types
 */

import type { FieldType } from '@/api/types';

export interface IFieldOptions {
  [key: string]: any;
}

export interface IFieldConfig {
  id: string;
  name: string;
  type: FieldType;
  tableId: string;
  options?: IFieldOptions;
  description?: string;
  isComputed: boolean;
  isPrimary: boolean;
  createdTime?: string;
  lastModifiedTime?: string;
}

export abstract class Field {
  public id: string;
  public name: string;
  public type: FieldType;
  public tableId: string;
  public options: IFieldOptions;
  public description?: string;
  public isComputed: boolean;
  public isPrimary: boolean;
  public createdTime?: string;
  public lastModifiedTime?: string;

  constructor(config: IFieldConfig) {
    this.id = config.id;
    this.name = config.name;
    this.type = config.type;
    this.tableId = config.tableId;
    this.options = config.options || {};
    this.description = config.description;
    this.isComputed = config.isComputed;
    this.isPrimary = config.isPrimary;
    this.createdTime = config.createdTime;
    this.lastModifiedTime = config.lastModifiedTime;
  }

  /**
   * Validate if a value is valid for this field type
   */
  abstract validate(value: unknown): boolean;

  /**
   * Format value for display
   */
  abstract format(value: unknown): string;

  /**
   * Get empty value for this field type
   */
  abstract getEmptyValue(): unknown;

  /**
   * Check if value is empty
   */
  isEmpty(value: unknown): boolean {
    return value === null || value === undefined || value === '';
  }

  /**
   * Convert value to cell value format
   */
  abstract toCellValue(value: unknown): any;

  /**
   * Convert cell value to display format
   */
  abstract fromCellValue(cellValue: any): unknown;

  /**
   * Get field configuration
   */
  toConfig(): IFieldConfig {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      tableId: this.tableId,
      options: this.options,
      description: this.description,
      isComputed: this.isComputed,
      isPrimary: this.isPrimary,
      createdTime: this.createdTime,
      lastModifiedTime: this.lastModifiedTime,
    };
  }

  /**
   * Clone this field
   */
  clone(): Field {
    return Object.create(Object.getPrototypeOf(this), {
      ...Object.getOwnPropertyDescriptors(this),
    });
  }
}


