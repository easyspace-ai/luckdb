/**
 * 日期字段
 */

import { BaseField } from './BaseField';
import { TextEditor } from '../editors/TextEditor'; // 临时使用
import type { FieldType, IFieldConfig, IFieldMeta } from './types';
import type { IEditor } from '../editors/types';

export enum DateFormat {
  Date = 'date', // 2024-10-15
  DateTime = 'datetime', // 2024-10-15 14:30
  Time = 'time', // 14:30
  Relative = 'relative', // 2 hours ago
  Custom = 'custom',
}

export interface IDateFieldOptions {
  format?: DateFormat;
  customFormat?: string; // 自定义格式(如 YYYY-MM-DD HH:mm:ss)
  includeTime?: boolean;
  timezone?: string; // 时区
  use24Hour?: boolean; // 24小时制
}

export class DateField extends BaseField {
  readonly type: FieldType = 'date' as FieldType;

  private get options(): IDateFieldOptions {
    return (this.config.options as IDateFieldOptions) || {};
  }

  /**
   * 验证值
   */
  validate(value: unknown): boolean {
    if (!super.validate(value)) {
      return false;
    }

    if (value === null || value === undefined || value === '') {
      return true;
    }

    // 尝试解析为日期
    const date = this.parseDate(value);
    return date !== null && !isNaN(date.getTime());
  }

  /**
   * 格式化显示值
   */
  format(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const date = this.parseDate(value);
    if (!date || isNaN(date.getTime())) {
      return String(value);
    }

    const format = this.options.format || DateFormat.Date;

    switch (format) {
      case DateFormat.Date:
        return this.formatDate(date);

      case DateFormat.DateTime:
        return this.formatDateTime(date);

      case DateFormat.Time:
        return this.formatTime(date);

      case DateFormat.Relative:
        return this.formatRelative(date);

      case DateFormat.Custom:
        return this.formatCustom(date, this.options.customFormat || 'YYYY-MM-DD');

      default:
        return date.toISOString();
    }
  }

  /**
   * 格式化日期(YYYY-MM-DD)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 格式化日期时间
   */
  private formatDateTime(date: Date): string {
    return this.formatDate(date) + ' ' + this.formatTime(date);
  }

  /**
   * 格式化时间
   */
  private formatTime(date: Date): string {
    const hours = this.options.use24Hour
      ? String(date.getHours()).padStart(2, '0')
      : String(date.getHours() % 12 || 12).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = this.options.use24Hour ? '' : date.getHours() >= 12 ? ' PM' : ' AM';
    return `${hours}:${minutes}${ampm}`;
  }

  /**
   * 格式化相对时间
   */
  private formatRelative(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${diffDay >= 14 ? 's' : ''} ago`;
    if (diffDay < 365) return `${Math.floor(diffDay / 30)} month${diffDay >= 60 ? 's' : ''} ago`;
    return `${Math.floor(diffDay / 365)} year${diffDay >= 730 ? 's' : ''} ago`;
  }

  /**
   * 自定义格式化
   */
  private formatCustom(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }

  /**
   * 解析输入值
   */
  parse(input: unknown): Date | null {
    if (input === null || input === undefined || input === '') {
      return null;
    }

    return this.parseDate(input);
  }

  /**
   * 解析日期
   */
  private parseDate(input: unknown): Date | null {
    if (input instanceof Date) {
      return input;
    }

    if (typeof input === 'number') {
      return new Date(input);
    }

    if (typeof input === 'string') {
      const date = new Date(input);
      return isNaN(date.getTime()) ? null : date;
    }

    return null;
  }

  /**
   * 获取默认值
   */
  getDefaultValue(): Date | null {
    if (this.config.defaultValue === 'now') {
      return new Date();
    }
    return super.getDefaultValue() as Date | null;
  }

  /**
   * 获取编辑器
   */
  getEditor(): IEditor {
    // TODO: 创建专用的 DateEditor
    return new TextEditor({
      placeholder: 'YYYY-MM-DD',
    });
  }

  /**
   * 获取字段元数据
   */
  static getMeta(): IFieldMeta {
    return {
      type: 'date' as FieldType,
      name: '日期',
      description: '日期、时间、日期时间',
      icon: '📅',
      category: 'basic',
      supportedOperations: ['sort', 'filter', 'group', 'daterange'],
    };
  }
}
