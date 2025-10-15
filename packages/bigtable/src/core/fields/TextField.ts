/**
 * 文本字段
 */

import { BaseField } from './BaseField';
import { TextEditor } from '../editors/TextEditor';
import type { FieldType, IFieldConfig, IFieldMeta } from './types';
import type { IEditor } from '../editors/types';

export interface ITextFieldOptions {
  maxLength?: number;
  minLength?: number;
  multiline?: boolean;
  placeholder?: string;
  trim?: boolean;
}

export class TextField extends BaseField {
  readonly type: FieldType = 'text' as FieldType;

  private get options(): ITextFieldOptions {
    return (this.config.options as ITextFieldOptions) || {};
  }

  /**
   * 格式化显示值
   */
  format(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    let str = String(value);

    // 去除首尾空格
    if (this.options.trim !== false) {
      str = str.trim();
    }

    // 多行文本显示第一行
    if (!this.options.multiline && str.includes('\n')) {
      str = str.split('\n')[0] + '...';
    }

    return str;
  }

  /**
   * 解析输入值
   */
  parse(input: unknown): string {
    if (input === null || input === undefined) {
      return '';
    }

    let value = String(input);

    // 去除首尾空格
    if (this.options.trim !== false) {
      value = value.trim();
    }

    // 限制长度
    if (this.options.maxLength && value.length > this.options.maxLength) {
      value = value.slice(0, this.options.maxLength);
    }

    return value;
  }

  /**
   * 获取编辑器
   */
  getEditor(): IEditor {
    return new TextEditor({
      maxLength: this.options.maxLength,
      minLength: this.options.minLength,
      multiline: this.options.multiline,
      placeholder: this.options.placeholder,
      trim: this.options.trim,
    });
  }

  /**
   * 获取字段元数据
   */
  static getMeta(): IFieldMeta {
    return {
      type: 'text' as FieldType,
      name: '文本',
      description: '单行或多行文本',
      icon: '📝',
      category: 'basic',
      supportedOperations: ['sort', 'filter', 'group', 'search'],
    };
  }
}
