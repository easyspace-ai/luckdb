/**
 * 复选框字段
 */

import { BaseField } from './BaseField';
import { TextEditor } from '../editors/TextEditor'; // 临时使用
import type { FieldType, IFieldConfig, IFieldMeta } from './types';
import type { IEditor } from '../editors/types';

export interface ICheckboxFieldOptions {
  trueLabel?: string; // true 的显示文本
  falseLabel?: string; // false 的显示文本
  color?: string; // 选中时的颜色
}

export class CheckboxField extends BaseField {
  readonly type: FieldType = 'checkbox' as FieldType;

  private get options(): ICheckboxFieldOptions {
    return (this.config.options as ICheckboxFieldOptions) || {};
  }

  /**
   * 验证值
   */
  validate(value: unknown): boolean {
    if (!super.validate(value)) {
      return false;
    }

    // 复选框只允许布尔值、null、undefined
    return typeof value === 'boolean' || value === null || value === undefined;
  }

  /**
   * 格式化显示值
   */
  format(value: unknown): string {
    const boolValue = this.toBoolean(value);

    if (boolValue === null) {
      return '';
    }

    if (boolValue) {
      return this.options.trueLabel || '✓';
    } else {
      return this.options.falseLabel || '';
    }
  }

  /**
   * 解析输入值
   */
  parse(input: unknown): boolean | null {
    return this.toBoolean(input);
  }

  /**
   * 转换为布尔值
   */
  private toBoolean(value: unknown): boolean | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value !== 0;
    }

    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (lower === 'true' || lower === 'yes' || lower === '1' || lower === '✓') {
        return true;
      }
      if (lower === 'false' || lower === 'no' || lower === '0' || lower === '') {
        return false;
      }
    }

    return null;
  }

  /**
   * 获取默认值
   */
  getDefaultValue(): boolean {
    return this.config.defaultValue === true;
  }

  /**
   * 获取编辑器
   */
  getEditor(): IEditor {
    // TODO: 创建专用的 CheckboxEditor
    return new TextEditor({
      placeholder: 'true/false',
    });
  }

  /**
   * 获取字段元数据
   */
  static getMeta(): IFieldMeta {
    return {
      type: 'checkbox' as FieldType,
      name: '复选框',
      description: '布尔值(是/否)',
      icon: '☑️',
      category: 'basic',
      supportedOperations: ['filter', 'count'],
    };
  }
}
