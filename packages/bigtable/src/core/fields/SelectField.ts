/**
 * 单选字段
 */

import { BaseField } from './BaseField';
import { TextEditor } from '../editors/TextEditor'; // 临时使用
import type { FieldType, IFieldConfig, IFieldMeta } from './types';
import type { IEditor } from '../editors/types';

export interface ISelectOption {
  id: string;
  name: string;
  color?: string;
}

export interface ISelectFieldOptions {
  options: ISelectOption[];
  allowCustomOptions?: boolean;
  defaultOptionId?: string;
}

export class SelectField extends BaseField {
  readonly type: FieldType = 'select' as FieldType;

  private get options(): ISelectFieldOptions {
    return (this.config.options as ISelectFieldOptions) || { options: [] };
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

    // 检查选项是否存在
    const optionId = String(value);
    const exists = this.options.options.some((opt) => opt.id === optionId);

    return exists || this.options.allowCustomOptions === true;
  }

  /**
   * 格式化显示值
   */
  format(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    const optionId = String(value);
    const option = this.options.options.find((opt) => opt.id === optionId);

    return option ? option.name : optionId;
  }

  /**
   * 解析输入值
   */
  parse(input: unknown): string | null {
    if (input === null || input === undefined || input === '') {
      return null;
    }

    return String(input);
  }

  /**
   * 获取选项颜色
   */
  getOptionColor(value: unknown): string | undefined {
    if (value === null || value === undefined) {
      return undefined;
    }

    const optionId = String(value);
    const option = this.options.options.find((opt) => opt.id === optionId);

    return option?.color;
  }

  /**
   * 获取所有选项
   */
  getOptions(): ISelectOption[] {
    return this.options.options;
  }

  /**
   * 添加选项
   */
  addOption(option: ISelectOption): void {
    this.options.options.push(option);
  }

  /**
   * 获取编辑器
   */
  getEditor(): IEditor {
    // TODO: 创建专用的 SelectEditor
    return new TextEditor({
      placeholder: 'Select an option',
    });
  }

  /**
   * 获取字段元数据
   */
  static getMeta(): IFieldMeta {
    return {
      type: 'select' as FieldType,
      name: '单选',
      description: '从预定义选项中选择一个(带颜色)',
      icon: '🎯',
      category: 'basic',
      supportedOperations: ['filter', 'group', 'count'],
    };
  }
}
