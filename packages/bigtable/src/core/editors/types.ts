/**
 * 编辑器类型定义
 */

import type { ICell } from '../types';

/**
 * 编辑器状态
 */
export interface IEditorState {
  cellId: string;
  cell: ICell;
  value: unknown;
  isEditing: boolean;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 编辑器回调
 */
export interface IEditorCallbacks {
  onChange?: (value: unknown) => void;
  onSave?: (value: unknown) => void;
  onCancel?: () => void;
  onClose?: () => void;
  /**
   * 当编辑器内触发 Tab/Shift+Tab 导航时回调
   * direction 为 'next' 表示向右一格，'prev' 表示向左一格
   */
  onTabNavigate?: (direction: 'next' | 'prev') => void;
}

/**
 * 编辑器配置
 */
export interface IEditorConfig {
  autoFocus?: boolean;
  selectAllOnFocus?: boolean;
  validateOnChange?: boolean;
  saveOnBlur?: boolean;
  saveOnEnter?: boolean;
  cancelOnEscape?: boolean;
}

/**
 * 编辑器接口
 */
export interface IEditor {
  readonly type: string;
  readonly config: IEditorConfig;

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
  parse(input: string): unknown;

  /**
   * 获取默认值
   */
  getDefaultValue(): unknown;
}

/**
 * 编辑器元数据
 */
export interface IEditorMeta {
  type: string;
  name: string;
  description: string;
  icon?: string;
  supportedFieldTypes: string[];
}
