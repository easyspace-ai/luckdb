/**
 * 附件字段
 */

import { BaseField } from './BaseField';
import { TextEditor } from '../editors/TextEditor';
import type { FieldType, IFieldMeta } from './types';
import type { IEditor } from '../editors/types';

export interface IAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
}

export interface IAttachmentFieldOptions {
  maxFiles?: number;
  maxFileSize?: number; // bytes
  allowedTypes?: string[]; // MIME types
}

export class AttachmentField extends BaseField {
  readonly type: FieldType = 'attachment' as FieldType;

  private get options(): IAttachmentFieldOptions {
    return (this.config.options as IAttachmentFieldOptions) || {};
  }

  validate(value: unknown): boolean {
    if (!super.validate(value)) return false;
    if (value === null || value === undefined) return true;

    if (!Array.isArray(value)) return false;

    // 检查文件数量
    if (this.options.maxFiles && value.length > this.options.maxFiles) {
      return false;
    }

    // 检查每个附件
    return value.every((att: any) => {
      if (!att || typeof att !== 'object') return false;
      if (!att.id || !att.name || !att.url) return false;

      // 检查文件大小
      if (this.options.maxFileSize && att.size > this.options.maxFileSize) {
        return false;
      }

      // 检查文件类型
      if (this.options.allowedTypes && this.options.allowedTypes.length > 0) {
        return this.options.allowedTypes.some((type) => att.type.startsWith(type));
      }

      return true;
    });
  }

  format(value: unknown): string {
    if (!Array.isArray(value) || value.length === 0) return '';

    const attachments = value as IAttachment[];
    return attachments.map((att) => att.name).join(', ');
  }

  parse(input: unknown): IAttachment[] | null {
    if (input === null || input === undefined) return null;
    if (Array.isArray(input)) return input as IAttachment[];
    return null;
  }

  getEditor(): IEditor {
    // TODO: 创建专用的 AttachmentEditor(文件上传)
    return new TextEditor({ placeholder: 'Upload files' });
  }

  static getMeta(): IFieldMeta {
    return {
      type: 'attachment' as FieldType,
      name: '附件',
      description: '图片、文件上传',
      icon: '📎',
      category: 'basic',
      supportedOperations: ['count', 'isEmpty'],
    };
  }
}
