/**
 * 字段注册表
 * 管理字段类型的注册和创建
 */

import type { FieldType, IField, IFieldConfig, IFieldMeta } from './types';
import { TextField } from './TextField';
import { NumberField } from './NumberField';
import { DateField } from './DateField';
import { CheckboxField } from './CheckboxField';
import { SelectField } from './SelectField';
import { MultiSelectField } from './MultiSelectField';
import { AttachmentField } from './AttachmentField';
import { UrlField } from './UrlField';
import { EmailField } from './EmailField';
import { PhoneField } from './PhoneField';

type FieldConstructor = new (config: IFieldConfig) => IField;

export class FieldRegistry {
  private static registry = new Map<FieldType, FieldConstructor>();
  private static metadata = new Map<FieldType, IFieldMeta>();

  /**
   * 注册字段类型
   */
  static register(type: FieldType, constructor: FieldConstructor, meta: IFieldMeta): void {
    this.registry.set(type, constructor);
    this.metadata.set(type, meta);
  }

  /**
   * 创建字段实例
   */
  static create(config: IFieldConfig): IField {
    const Constructor = this.registry.get(config.type);
    if (!Constructor) {
      throw new Error(`Unknown field type: ${config.type}`);
    }
    return new Constructor(config);
  }

  /**
   * 获取字段元数据
   */
  static getMeta(type: FieldType): IFieldMeta | undefined {
    return this.metadata.get(type);
  }

  /**
   * 获取所有注册的字段类型
   */
  static getAll(): Array<{ type: FieldType; meta: IFieldMeta }> {
    const result: Array<{ type: FieldType; meta: IFieldMeta }> = [];
    this.metadata.forEach((meta, type) => {
      result.push({ type, meta });
    });
    return result;
  }

  /**
   * 检查字段类型是否已注册
   */
  static has(type: FieldType): boolean {
    return this.registry.has(type);
  }

  /**
   * 初始化默认字段类型
   */
  static initializeDefaults(): void {
    // 注册10种基础字段
    this.register('text' as FieldType, TextField as any, TextField.getMeta());
    this.register('number' as FieldType, NumberField as any, NumberField.getMeta());
    this.register('date' as FieldType, DateField as any, DateField.getMeta());
    this.register('checkbox' as FieldType, CheckboxField as any, CheckboxField.getMeta());
    this.register('select' as FieldType, SelectField as any, SelectField.getMeta());
    this.register('multiSelect' as FieldType, MultiSelectField as any, MultiSelectField.getMeta());
    this.register('attachment' as FieldType, AttachmentField as any, AttachmentField.getMeta());
    this.register('url' as FieldType, UrlField as any, UrlField.getMeta());
    this.register('email' as FieldType, EmailField as any, EmailField.getMeta());
    this.register('phone' as FieldType, PhoneField as any, PhoneField.getMeta());
  }
}

// 自动初始化默认字段
FieldRegistry.initializeDefaults();
