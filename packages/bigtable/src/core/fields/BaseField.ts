/**
 * 字段基类
 */

import type { IField, IFieldConfig, IFieldMeta, FieldType, IFieldValidationRule } from './types';
import type { IEditor } from '../editors/types';

export abstract class BaseField implements IField {
  abstract readonly type: FieldType;

  readonly config: IFieldConfig;

  constructor(config: IFieldConfig) {
    this.config = config;
  }

  /**
   * 验证值
   */
  validate(value: unknown): boolean {
    if (!this.config.validation || this.config.validation.length === 0) {
      return true;
    }

    for (const rule of this.config.validation) {
      if (!this.validateRule(value, rule)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 验证单个规则
   */
  protected validateRule(value: unknown, rule: IFieldValidationRule): boolean {
    switch (rule.type) {
      case 'required':
        return value !== null && value !== undefined && value !== '';

      case 'min':
        if (typeof value === 'number') {
          return value >= (rule.value as number);
        }
        if (typeof value === 'string') {
          return value.length >= (rule.value as number);
        }
        return true;

      case 'max':
        if (typeof value === 'number') {
          return value <= (rule.value as number);
        }
        if (typeof value === 'string') {
          return value.length <= (rule.value as number);
        }
        return true;

      case 'pattern':
        if (typeof value === 'string') {
          const pattern = new RegExp(rule.value as string);
          return pattern.test(value);
        }
        return true;

      case 'custom':
        if (rule.validator) {
          return rule.validator(value);
        }
        return true;

      default:
        return true;
    }
  }

  /**
   * 格式化显示值
   */
  abstract format(value: unknown): string;

  /**
   * 解析输入值
   */
  abstract parse(input: unknown): unknown;

  /**
   * 获取默认值
   */
  getDefaultValue(): unknown {
    return this.config.defaultValue ?? null;
  }

  /**
   * 获取编辑器
   */
  abstract getEditor(): IEditor;

  /**
   * 序列化为 JSON
   */
  toJSON(): Record<string, any> {
    return {
      type: this.type,
      config: this.config,
    };
  }

  /**
   * 从 JSON 反序列化
   */
  fromJSON(json: Record<string, any>): void {
    Object.assign(this.config, json.config);
  }

  /**
   * 获取字段元数据
   */
  static getMeta(): IFieldMeta {
    throw new Error('getMeta() must be implemented by subclass');
  }
}
