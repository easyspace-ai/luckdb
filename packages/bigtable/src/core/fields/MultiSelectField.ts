/**
 * 多选字段
 */

import { BaseField } from './BaseField';
import { TextEditor } from '../editors/TextEditor';
import type { FieldType, IFieldMeta } from './types';
import type { IEditor } from '../editors/types';
import type { ISelectOption } from './SelectField';

export interface IMultiSelectFieldOptions {
  options: ISelectOption[];
  max?: number; // 最多选择数量
}

export class MultiSelectField extends BaseField {
  readonly type: FieldType = 'multiSelect' as FieldType;

  private get options(): IMultiSelectFieldOptions {
    return (this.config.options as IMultiSelectFieldOptions) || { options: [] };
  }

  validate(value: unknown): boolean {
    if (!super.validate(value)) return false;
    if (value === null || value === undefined) return true;

    if (!Array.isArray(value)) return false;

    // 检查数量限制
    if (this.options.max && value.length > this.options.max) {
      return false;
    }

    // 检查每个选项是否存在
    return value.every((id) => this.options.options.some((opt) => opt.id === String(id)));
  }

  format(value: unknown): string {
    if (!Array.isArray(value) || value.length === 0) return '';

    return value
      .map((id) => {
        const option = this.options.options.find((opt) => opt.id === String(id));
        return option ? option.name : String(id);
      })
      .join(', ');
  }

  parse(input: unknown): string[] | null {
    if (input === null || input === undefined || input === '') return null;
    if (Array.isArray(input)) return input.map(String);

    // 尝试解析逗号分隔的字符串
    return String(input)
      .split(',')
      .map((s) => s.trim());
  }

  getEditor(): IEditor {
    return new TextEditor({ placeholder: 'Select options (comma separated)' });
  }

  static getMeta(): IFieldMeta {
    return {
      type: 'multiSelect' as FieldType,
      name: '多选',
      description: '从预定义选项中选择多个',
      icon: '🏷️',
      category: 'basic',
      supportedOperations: ['filter', 'contains'],
    };
  }
}
