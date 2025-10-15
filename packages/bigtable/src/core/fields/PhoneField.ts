/**
 * 电话字段
 */

import { BaseField } from './BaseField';
import { TextEditor } from '../editors/TextEditor';
import type { FieldType, IFieldMeta } from './types';
import type { IEditor } from '../editors/types';

export interface IPhoneFieldOptions {
  countryCode?: string;
  format?: 'international' | 'national' | 'raw';
}

export class PhoneField extends BaseField {
  readonly type: FieldType = 'phone' as FieldType;

  private get options(): IPhoneFieldOptions {
    return (this.config.options as IPhoneFieldOptions) || {};
  }

  validate(value: unknown): boolean {
    if (!super.validate(value)) return false;
    if (value === null || value === undefined || value === '') return true;

    const phone = String(value).replace(/[\s\-()]/g, '');

    // 简单验证:只包含数字和+号
    return /^\+?\d{7,15}$/.test(phone);
  }

  format(value: unknown): string {
    if (value === null || value === undefined || value === '') return '';

    const phone = String(value);
    const format = this.options.format || 'raw';

    if (format === 'raw') {
      return phone;
    }

    // 简单格式化(可以后续集成 libphonenumber-js)
    const digits = phone.replace(/\D/g, '');

    if (format === 'international') {
      return '+' + digits;
    }

    // national format (简单实现)
    if (digits.length === 11) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }

    return phone;
  }

  parse(input: unknown): string | null {
    if (input === null || input === undefined || input === '') return null;

    const phone = String(input).trim();

    // 自动添加国家代码
    if (this.options.countryCode && !phone.startsWith('+')) {
      return `+${this.options.countryCode}${phone}`;
    }

    return phone;
  }

  getEditor(): IEditor {
    return new TextEditor({ placeholder: '+86 138 0000 0000' });
  }

  static getMeta(): IFieldMeta {
    return {
      type: 'phone' as FieldType,
      name: '电话',
      description: '电话号码',
      icon: '📞',
      category: 'basic',
      supportedOperations: ['filter', 'search'],
    };
  }
}
