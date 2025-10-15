/**
 * URL 字段
 */

import { BaseField } from './BaseField';
import { TextEditor } from '../editors/TextEditor';
import type { FieldType, IFieldMeta } from './types';
import type { IEditor } from '../editors/types';

export interface IUrlFieldOptions {
  allowedProtocols?: string[]; // 允许的协议(http, https, ftp等)
  openInNewTab?: boolean;
}

export class UrlField extends BaseField {
  readonly type: FieldType = 'url' as FieldType;

  private get options(): IUrlFieldOptions {
    return (this.config.options as IUrlFieldOptions) || {};
  }

  validate(value: unknown): boolean {
    if (!super.validate(value)) return false;
    if (value === null || value === undefined || value === '') return true;

    const url = String(value);

    // 简单URL验证
    try {
      const urlObj = new URL(url);

      if (this.options.allowedProtocols && this.options.allowedProtocols.length > 0) {
        const protocol = urlObj.protocol.replace(':', '');
        return this.options.allowedProtocols.includes(protocol);
      }

      return true;
    } catch {
      return false;
    }
  }

  format(value: unknown): string {
    return value ? String(value) : '';
  }

  parse(input: unknown): string | null {
    if (input === null || input === undefined || input === '') return null;

    let url = String(input).trim();

    // 自动添加 https:// 前缀
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    return url;
  }

  getEditor(): IEditor {
    return new TextEditor({ placeholder: 'https://example.com' });
  }

  static getMeta(): IFieldMeta {
    return {
      type: 'url' as FieldType,
      name: 'URL',
      description: 'URL链接(点击打开)',
      icon: '🔗',
      category: 'basic',
      supportedOperations: ['filter', 'search'],
    };
  }
}
