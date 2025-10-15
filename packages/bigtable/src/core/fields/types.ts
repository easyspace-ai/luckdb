/**
 * 字段类型定义
 */

import type { IEditor } from '../editors/types';

/**
 * 字段类型枚举
 */
export enum FieldType {
  // 基础字段(10种)
  Text = 'text',
  Number = 'number',
  Date = 'date',
  Checkbox = 'checkbox',
  Select = 'select',
  MultiSelect = 'multiSelect',
  Attachment = 'attachment',
  Url = 'url',
  Email = 'email',
  Phone = 'phone',

  // 高级字段(10种)
  Link = 'link',
  Lookup = 'lookup',
  Rollup = 'rollup',
  Formula = 'formula',
  Rating = 'rating',
  User = 'user',
  AutoNumber = 'autoNumber',
  CreatedTime = 'createdTime',
  ModifiedTime = 'modifiedTime',
  CreatedBy = 'createdBy',

  // 特色字段(10种)
  GeoLocation = 'geoLocation',
  JSON = 'json',
  Markdown = 'markdown',
  Code = 'code',
  Signature = 'signature',
  Color = 'color',
  Chart = 'chart',
  Progress = 'progress',
  Barcode = 'barcode',
  Button = 'button',
}

/**
 * 字段验证规则
 */
export interface IFieldValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: any;
  message?: string;
  validator?: (value: unknown) => boolean;
}

/**
 * 字段配置
 */
export interface IFieldConfig {
  // 基础配置
  type: FieldType;
  name: string;
  description?: string;
  icon?: string;

  // 默认值
  defaultValue?: unknown;

  // 验证规则
  validation?: IFieldValidationRule[];

  // 字段特定配置
  options?: Record<string, any>;
}

/**
 * 字段接口
 */
export interface IField {
  readonly type: FieldType;
  readonly config: IFieldConfig;

  /**
   * 验证值是否有效
   */
  validate(value: unknown): boolean;

  /**
   * 格式化显示值
   */
  format(value: unknown): string;

  /**
   * 解析输入值
   */
  parse(input: unknown): unknown;

  /**
   * 获取默认值
   */
  getDefaultValue(): unknown;

  /**
   * 获取编辑器
   */
  getEditor(): IEditor;

  /**
   * 序列化为 JSON
   */
  toJSON(): Record<string, any>;

  /**
   * 从 JSON 反序列化
   */
  fromJSON(json: Record<string, any>): void;
}

/**
 * 字段元数据
 */
export interface IFieldMeta {
  type: FieldType;
  name: string;
  description: string;
  icon: string;
  category: 'basic' | 'advanced' | 'special';
  supportedOperations: string[];
}
