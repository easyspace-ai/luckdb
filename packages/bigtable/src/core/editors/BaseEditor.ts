/**
 * 编辑器基类
 */

import type { IEditor, IEditorConfig, IEditorMeta } from './types';

export abstract class BaseEditor implements IEditor {
  abstract readonly type: string;

  readonly config: IEditorConfig;

  protected readonly defaultConfig: IEditorConfig = {
    autoFocus: true,
    selectAllOnFocus: true,
    validateOnChange: true,
    saveOnBlur: true,
    saveOnEnter: true,
    cancelOnEscape: true,
  };

  constructor(config?: Partial<IEditorConfig>) {
    this.config = { ...this.defaultConfig, ...config };
  }

  /**
   * 验证值是否有效
   */
  abstract validate(value: unknown): boolean;

  /**
   * 格式化显示值
   */
  abstract format(value: unknown): string;

  /**
   * 解析输入值
   */
  abstract parse(input: string): unknown;

  /**
   * 获取默认值
   */
  abstract getDefaultValue(): unknown;

  /**
   * 获取编辑器元数据
   */
  static getMeta(): IEditorMeta {
    throw new Error('getMeta() must be implemented by subclass');
  }
}
