/**
 * 数字字段
 */

import { BaseField } from './BaseField';
import { TextEditor } from '../editors/TextEditor'; // 临时使用,后续创建 NumberEditor
import type { FieldType, IFieldConfig, IFieldMeta } from './types';
import type { IEditor } from '../editors/types';

export enum NumberFormat {
  Integer = 'integer',
  Decimal = 'decimal',
  Percent = 'percent',
  Currency = 'currency',
  Scientific = 'scientific',
}

export interface INumberFieldOptions {
  format?: NumberFormat;
  precision?: number; // 小数位数
  min?: number;
  max?: number;
  currency?: string; // 货币符号(USD, CNY等)
  thousandsSeparator?: boolean; // 千位分隔符
}

export class NumberField extends BaseField {
  readonly type: FieldType = 'number' as FieldType;

  private get options(): INumberFieldOptions {
    return (this.config.options as INumberFieldOptions) || {};
  }

  /**
   * 验证值
   */
  validate(value: unknown): boolean {
    // 基础验证
    if (!super.validate(value)) {
      return false;
    }

    if (value === null || value === undefined || value === '') {
      return true; // 允许空值
    }

    const num = Number(value);

    // 检查是否是有效数字
    if (isNaN(num) || !isFinite(num)) {
      return false;
    }

    // 检查范围
    if (this.options.min !== undefined && num < this.options.min) {
      return false;
    }

    if (this.options.max !== undefined && num > this.options.max) {
      return false;
    }

    return true;
  }

  /**
   * 格式化显示值
   */
  format(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    let num = Number(value);
    if (isNaN(num)) {
      return String(value);
    }

    const format = this.options.format || NumberFormat.Decimal;
    const precision = this.options.precision ?? 2;

    switch (format) {
      case NumberFormat.Integer:
        num = Math.round(num);
        return this.formatWithThousands(num, 0);

      case NumberFormat.Decimal:
        return this.formatWithThousands(num, precision);

      case NumberFormat.Percent:
        return (num * 100).toFixed(precision) + '%';

      case NumberFormat.Currency: {
        const currency = this.options.currency || 'USD';
        const symbol = this.getCurrencySymbol(currency);
        return symbol + this.formatWithThousands(num, precision);
      }

      case NumberFormat.Scientific:
        return num.toExponential(precision);

      default:
        return String(num);
    }
  }

  /**
   * 格式化带千位分隔符
   */
  private formatWithThousands(num: number, precision: number): string {
    let formatted = num.toFixed(precision);

    if (this.options.thousandsSeparator !== false) {
      const parts = formatted.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      formatted = parts.join('.');
    }

    return formatted;
  }

  /**
   * 获取货币符号
   */
  private getCurrencySymbol(currency: string): string {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CNY: '¥',
      KRW: '₩',
    };
    return symbols[currency] || currency + ' ';
  }

  /**
   * 解析输入值
   */
  parse(input: unknown): number | null {
    if (input === null || input === undefined || input === '') {
      return null;
    }

    // 移除千位分隔符和货币符号
    let str = String(input);
    str = str.replace(/[,\s$€£¥₩]/g, '');

    // 处理百分号
    if (str.endsWith('%')) {
      str = str.slice(0, -1);
      return Number(str) / 100;
    }

    const num = Number(str);
    return isNaN(num) ? null : num;
  }

  /**
   * 获取编辑器
   */
  getEditor(): IEditor {
    // TODO: 创建专用的 NumberEditor
    return new TextEditor({
      placeholder: this.options.format === NumberFormat.Currency ? 'Enter amount' : 'Enter number',
    });
  }

  /**
   * 获取字段元数据
   */
  static getMeta(): IFieldMeta {
    return {
      type: 'number' as FieldType,
      name: '数字',
      description: '整数、小数、百分比、货币',
      icon: '🔢',
      category: 'basic',
      supportedOperations: ['sort', 'filter', 'sum', 'avg', 'min', 'max', 'count'],
    };
  }
}
