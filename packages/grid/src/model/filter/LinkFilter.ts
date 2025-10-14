/**
 * Link Field Filter
 * 关系链接字段过滤器
 */

import { BaseFilter, type IFilterConfig } from './BaseFilter';
import type { Field } from '../field/Field';
import type { Record } from '../record/Record';

export class LinkFilter extends BaseFilter {
  constructor(field: Field, config: IFilterConfig) {
    super(field, config);
  }

  match(record: Record): boolean {
    const { operator } = this.config;

    switch (operator) {
      case 'isEmpty':
      case 'hasNoRecord':
        return this.matchHasNoRecord(record);
      case 'isNotEmpty':
      case 'hasRecord':
        return this.matchHasRecord(record);
      default:
        return false;
    }
  }

  getDisplayText(): string {
    const { operator } = this.config;
    const fieldName = this.field.name;

    switch (operator) {
      case 'isEmpty':
      case 'hasNoRecord':
        return `${fieldName} 无关联记录`;
      case 'isNotEmpty':
      case 'hasRecord':
        return `${fieldName} 有关联记录`;
      default:
        return '';
    }
  }

  private getLinkedRecordIds(record: Record): string[] {
    const value = this.getValue(record);
    
    if (this.isEmpty(value)) return [];
    
    if (Array.isArray(value)) {
      return value.filter(v => v != null).map(v => String(v));
    }
    
    return [String(value)];
  }

  private matchHasRecord(record: Record): boolean {
    const linkedIds = this.getLinkedRecordIds(record);
    return linkedIds.length > 0;
  }

  private matchHasNoRecord(record: Record): boolean {
    return !this.matchHasRecord(record);
  }
}


