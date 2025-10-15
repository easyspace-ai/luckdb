/**
 * 文本编辑器
 */

import { BaseEditor } from './BaseEditor';
import type { IEditorConfig, IEditorMeta } from './types';

/**
 * 文本编辑器配置
 */
export interface ITextEditorConfig extends IEditorConfig {
  maxLength?: number;
  minLength?: number;
  placeholder?: string;
  multiline?: boolean;
  trim?: boolean;
}

export class TextEditor extends BaseEditor {
  readonly type = 'text';

  private textConfig: ITextEditorConfig;

  constructor(config?: Partial<ITextEditorConfig>) {
    super(config);
    this.textConfig = {
      ...this.config,
      maxLength: config?.maxLength,
      minLength: config?.minLength ?? 0,
      placeholder: config?.placeholder ?? '',
      multiline: config?.multiline ?? false,
      trim: config?.trim ?? true,
    };
  }

  /**
   * 验证文本值
   */
  validate(value: unknown): boolean {
    if (value === null || value === undefined) {
      return this.textConfig.minLength === 0;
    }

    const str = String(value);

    // 检查最小长度
    if (this.textConfig.minLength && str.length < this.textConfig.minLength) {
      return false;
    }

    // 检查最大长度
    if (this.textConfig.maxLength && str.length > this.textConfig.maxLength) {
      return false;
    }

    return true;
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
    if (this.textConfig.trim) {
      str = str.trim();
    }

    return str;
  }

  /**
   * 解析输入值
   */
  parse(input: string): string {
    let value = input;

    // 去除首尾空格
    if (this.textConfig.trim) {
      value = value.trim();
    }

    // 限制长度
    if (this.textConfig.maxLength && value.length > this.textConfig.maxLength) {
      value = value.slice(0, this.textConfig.maxLength);
    }

    return value;
  }

  /**
   * 获取默认值
   */
  getDefaultValue(): string {
    return '';
  }

  /**
   * 获取编辑器元数据
   */
  static getMeta(): IEditorMeta {
    return {
      type: 'text',
      name: '文本编辑器',
      description: '单行或多行文本输入',
      icon: '📝',
      supportedFieldTypes: ['text', 'string', 'singleLineText', 'multilineText'],
    };
  }
}
