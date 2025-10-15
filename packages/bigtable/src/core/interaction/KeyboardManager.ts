/**
 * 键盘管理器
 * 处理键盘导航、快捷键等
 */

import type { ICellPosition } from '../types';

export interface IKeyboardConfig {
  enableArrowNavigation?: boolean;
  enableHomeEnd?: boolean;
  enablePageUpDown?: boolean;
  enableCtrlHome?: boolean;
  enableEnterEdit?: boolean;
  enableTabNavigation?: boolean;
  enableEscapeExit?: boolean;
}

export interface IKeyboardCallbacks {
  onNavigate?: (position: ICellPosition) => void;
  onEnterEditMode?: (position: ICellPosition) => void;
  onExitEditMode?: () => void;
  onSelectAll?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}

export class KeyboardManager {
  private config: Required<IKeyboardConfig>;
  private callbacks: IKeyboardCallbacks;
  private currentPosition: ICellPosition | null = null;
  private isEditing = false;

  // 总行数和列数
  private rowCount = 0;
  private columnCount = 0;

  constructor(config?: Partial<IKeyboardConfig>, callbacks?: IKeyboardCallbacks) {
    this.config = {
      enableArrowNavigation: config?.enableArrowNavigation ?? true,
      enableHomeEnd: config?.enableHomeEnd ?? true,
      enablePageUpDown: config?.enablePageUpDown ?? true,
      enableCtrlHome: config?.enableCtrlHome ?? true,
      enableEnterEdit: config?.enableEnterEdit ?? true,
      enableTabNavigation: config?.enableTabNavigation ?? true,
      enableEscapeExit: config?.enableEscapeExit ?? true,
    };

    this.callbacks = callbacks || {};
  }

  /**
   * 设置数据范围
   */
  setDataRange(rowCount: number, columnCount: number): void {
    this.rowCount = rowCount;
    this.columnCount = columnCount;
  }

  /**
   * 设置当前位置
   */
  setCurrentPosition(position: ICellPosition | null): void {
    this.currentPosition = position;
  }

  /**
   * 设置编辑状态
   */
  setEditingState(isEditing: boolean): void {
    this.isEditing = isEditing;
  }

  /**
   * 处理键盘事件
   */
  handleKeyDown(e: KeyboardEvent): boolean {
    // 如果正在编辑,只处理特殊键
    if (this.isEditing) {
      return this.handleEditingKeys(e);
    }

    // 导航模式
    return this.handleNavigationKeys(e);
  }

  /**
   * 处理编辑模式下的键盘事件
   */
  private handleEditingKeys(e: KeyboardEvent): boolean {
    // Escape - 退出编辑
    if (e.key === 'Escape' && this.config.enableEscapeExit) {
      this.callbacks.onExitEditMode?.();
      return true;
    }

    // 不拦截其他按键(让编辑器处理)
    return false;
  }

  /**
   * 处理导航模式下的键盘事件
   */
  private handleNavigationKeys(e: KeyboardEvent): boolean {
    if (!this.currentPosition) return false;

    let handled = false;

    // 方向键导航
    if (this.config.enableArrowNavigation) {
      handled = this.handleArrowKeys(e) || handled;
    }

    // Home/End
    if (this.config.enableHomeEnd) {
      handled = this.handleHomeEnd(e) || handled;
    }

    // PageUp/PageDown
    if (this.config.enablePageUpDown) {
      handled = this.handlePageUpDown(e) || handled;
    }

    // Ctrl+Home / Ctrl+End
    if (this.config.enableCtrlHome) {
      handled = this.handleCtrlHomeEnd(e) || handled;
    }

    // Enter - 进入编辑
    if (e.key === 'Enter' && this.config.enableEnterEdit) {
      e.preventDefault();
      this.callbacks.onEnterEditMode?.(this.currentPosition);
      handled = true;
    }

    // Tab - 下一个单元格
    if (e.key === 'Tab' && this.config.enableTabNavigation) {
      e.preventDefault();
      const nextPos = this.getNextPosition(this.currentPosition, e.shiftKey ? 'left' : 'right');
      if (nextPos) {
        this.callbacks.onNavigate?.(nextPos);
        this.currentPosition = nextPos;
      }
      handled = true;
    }

    // Ctrl+C - 复制
    if (e.key === 'c' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.callbacks.onCopy?.();
      handled = true;
    }

    // Ctrl+X - 剪切
    if (e.key === 'x' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.callbacks.onCut?.();
      handled = true;
    }

    // Ctrl+V - 粘贴
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.callbacks.onPaste?.();
      handled = true;
    }

    // Ctrl+Z - 撤销
    if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
      e.preventDefault();
      this.callbacks.onUndo?.();
      handled = true;
    }

    // Ctrl+Y 或 Ctrl+Shift+Z - 重做
    if (
      (e.key === 'y' && (e.ctrlKey || e.metaKey)) ||
      (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)
    ) {
      e.preventDefault();
      this.callbacks.onRedo?.();
      handled = true;
    }

    // Ctrl+A - 全选
    if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.callbacks.onSelectAll?.();
      handled = true;
    }

    return handled;
  }

  /**
   * 处理方向键
   */
  private handleArrowKeys(e: KeyboardEvent): boolean {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      return false;
    }

    e.preventDefault();

    const direction = e.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
    const nextPos = this.getNextPosition(this.currentPosition!, direction);

    if (nextPos) {
      this.callbacks.onNavigate?.(nextPos);
      this.currentPosition = nextPos;
    }

    return true;
  }

  /**
   * 处理 Home/End
   */
  private handleHomeEnd(e: KeyboardEvent): boolean {
    if (!['Home', 'End'].includes(e.key)) {
      return false;
    }

    e.preventDefault();

    const nextPos = { ...this.currentPosition! };

    if (e.key === 'Home') {
      nextPos.columnIndex = 0;
    } else {
      nextPos.columnIndex = this.columnCount - 1;
    }

    this.callbacks.onNavigate?.(nextPos);
    this.currentPosition = nextPos;

    return true;
  }

  /**
   * 处理 PageUp/PageDown
   */
  private handlePageUpDown(e: KeyboardEvent): boolean {
    if (!['PageUp', 'PageDown'].includes(e.key)) {
      return false;
    }

    e.preventDefault();

    const pageSize = 10; // 一页10行
    const nextPos = { ...this.currentPosition! };

    if (e.key === 'PageUp') {
      nextPos.rowIndex = Math.max(0, nextPos.rowIndex - pageSize);
    } else {
      nextPos.rowIndex = Math.min(this.rowCount - 1, nextPos.rowIndex + pageSize);
    }

    this.callbacks.onNavigate?.(nextPos);
    this.currentPosition = nextPos;

    return true;
  }

  /**
   * 处理 Ctrl+Home / Ctrl+End
   */
  private handleCtrlHomeEnd(e: KeyboardEvent): boolean {
    if (!['Home', 'End'].includes(e.key) || !(e.ctrlKey || e.metaKey)) {
      return false;
    }

    e.preventDefault();

    const nextPos = { ...this.currentPosition! };

    if (e.key === 'Home') {
      nextPos.rowIndex = 0;
      nextPos.columnIndex = 0;
    } else {
      nextPos.rowIndex = this.rowCount - 1;
      nextPos.columnIndex = this.columnCount - 1;
    }

    this.callbacks.onNavigate?.(nextPos);
    this.currentPosition = nextPos;

    return true;
  }

  /**
   * 获取下一个位置
   */
  private getNextPosition(
    current: ICellPosition,
    direction: 'up' | 'down' | 'left' | 'right'
  ): ICellPosition | null {
    const next = { ...current };

    switch (direction) {
      case 'up':
        next.rowIndex = Math.max(0, current.rowIndex - 1);
        break;
      case 'down':
        next.rowIndex = Math.min(this.rowCount - 1, current.rowIndex + 1);
        break;
      case 'left':
        next.columnIndex = Math.max(0, current.columnIndex - 1);
        break;
      case 'right':
        next.columnIndex = Math.min(this.columnCount - 1, current.columnIndex + 1);
        break;
    }

    // 如果位置没变,返回 null
    if (next.rowIndex === current.rowIndex && next.columnIndex === current.columnIndex) {
      return null;
    }

    return next;
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.currentPosition = null;
    this.isEditing = false;
  }
}
