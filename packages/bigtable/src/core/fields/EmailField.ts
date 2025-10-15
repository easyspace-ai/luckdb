/**
 * Email 字段
 */

import { BaseField } from './BaseField';
import { TextEditor } from '../editors/TextEditor';
import type { FieldType, IFieldMeta } from './types';
import type { IEditor } from '../editors/types';

export class EmailField extends BaseField {
  readonly type: FieldType = 'email' as FieldType;

  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  validate(value: unknown): boolean {
    if (!super.validate(value)) return false;
    if (value === null || value === undefined || value === '') return true;

    const email = String(value).trim();
    return this.emailRegex.test(email);
  }

  format(value: unknown): string {
    return value ? String(value).trim() : '';
  }

  parse(input: unknown): string | null {
    if (input === null || input === undefined || input === '') return null;
    return String(input).trim().toLowerCase();
  }

  getEditor(): IEditor {
    return new TextEditor({ placeholder: 'user@example.com' });
  }

  static getMeta(): IFieldMeta {
    return {
      type: 'email' as FieldType,
      name: 'Email',
      description: '邮箱地址(点击发送)',
      icon: '📧',
      category: 'basic',
      supportedOperations: ['filter', 'search'],
    };
  }
}
