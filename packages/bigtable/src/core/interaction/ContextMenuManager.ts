/**
 * 右键菜单管理器
 * 处理表格右键菜单功能
 */

export type MenuItemType = 'normal' | 'separator' | 'submenu';

export interface IMenuItem {
  id: string;
  type?: MenuItemType;
  label?: string;
  icon?: string;
  shortcut?: string;
  disabled?: boolean;
  submenu?: IMenuItem[];
  onClick?: () => void;
}

export interface IContextMenuConfig {
  items: IMenuItem[];
}

export interface IContextMenuCallbacks {
  onOpen?: (x: number, y: number, context: IContextMenuContext) => void;
  onClose?: () => void;
  onItemClick?: (itemId: string, context: IContextMenuContext) => void;
}

export interface IContextMenuContext {
  type: 'cell' | 'row' | 'column' | 'header' | 'empty';
  rowIndex?: number;
  columnIndex?: number;
  cellValue?: unknown;
}

export interface IContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  context: IContextMenuContext;
  items: IMenuItem[];
}

export class ContextMenuManager {
  private config: IContextMenuConfig;
  private callbacks: IContextMenuCallbacks;
  private menuState: IContextMenuState | null = null;

  constructor(config: IContextMenuConfig, callbacks?: IContextMenuCallbacks) {
    this.config = config;
    this.callbacks = callbacks || {};
  }

  /**
   * 打开菜单
   */
  open(x: number, y: number, context: IContextMenuContext): void {
    // 根据上下文动态生成菜单项
    const items = this.getMenuItems(context);

    this.menuState = {
      isOpen: true,
      x,
      y,
      context,
      items,
    };

    this.callbacks.onOpen?.(x, y, context);
  }

  /**
   * 关闭菜单
   */
  close(): void {
    if (this.menuState) {
      this.callbacks.onClose?.();
      this.menuState = null;
    }
  }

  /**
   * 点击菜单项
   */
  clickItem(itemId: string): void {
    if (!this.menuState) return;

    const item = this.findMenuItem(itemId, this.menuState.items);
    if (item && !item.disabled) {
      item.onClick?.();
      this.callbacks.onItemClick?.(itemId, this.menuState.context);
      this.close();
    }
  }

  /**
   * 获取菜单状态
   */
  getMenuState(): IContextMenuState | null {
    return this.menuState ? { ...this.menuState } : null;
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<IContextMenuConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.menuState = null;
  }

  // ==================== 私有方法 ====================

  /**
   * 根据上下文生成菜单项
   */
  private getMenuItems(context: IContextMenuContext): IMenuItem[] {
    const { type } = context;

    // 单元格菜单
    if (type === 'cell') {
      return [
        { id: 'copy', label: '复制', icon: 'copy', shortcut: 'Ctrl+C' },
        { id: 'paste', label: '粘贴', icon: 'paste', shortcut: 'Ctrl+V' },
        { id: 'cut', label: '剪切', icon: 'cut', shortcut: 'Ctrl+X' },
        { id: 'separator-1', type: 'separator' },
        { id: 'insert-row-above', label: '在上方插入行', icon: 'arrow-up' },
        { id: 'insert-row-below', label: '在下方插入行', icon: 'arrow-down' },
        { id: 'separator-2', type: 'separator' },
        { id: 'delete-row', label: '删除行', icon: 'trash', shortcut: 'Delete' },
      ];
    }

    // 列头菜单
    if (type === 'column') {
      return [
        { id: 'sort-asc', label: '升序排序', icon: 'arrow-up' },
        { id: 'sort-desc', label: '降序排序', icon: 'arrow-down' },
        { id: 'separator-1', type: 'separator' },
        { id: 'filter', label: '筛选', icon: 'filter' },
        { id: 'group', label: '分组', icon: 'group' },
        { id: 'separator-2', type: 'separator' },
        { id: 'freeze-column', label: '冻结列', icon: 'lock' },
        { id: 'hide-column', label: '隐藏列', icon: 'eye-off' },
        { id: 'separator-3', type: 'separator' },
        { id: 'insert-column-left', label: '在左侧插入列', icon: 'arrow-left' },
        { id: 'insert-column-right', label: '在右侧插入列', icon: 'arrow-right' },
        { id: 'separator-4', type: 'separator' },
        { id: 'delete-column', label: '删除列', icon: 'trash' },
      ];
    }

    // 行头菜单
    if (type === 'row') {
      return [
        { id: 'duplicate-row', label: '复制行', icon: 'copy' },
        { id: 'insert-row-above', label: '在上方插入行', icon: 'arrow-up' },
        { id: 'insert-row-below', label: '在下方插入行', icon: 'arrow-down' },
        { id: 'separator-1', type: 'separator' },
        { id: 'delete-row', label: '删除行', icon: 'trash' },
      ];
    }

    // 默认菜单
    return this.config.items;
  }

  /**
   * 查找菜单项
   */
  private findMenuItem(itemId: string, items: IMenuItem[]): IMenuItem | null {
    for (const item of items) {
      if (item.id === itemId) {
        return item;
      }
      if (item.submenu) {
        const found = this.findMenuItem(itemId, item.submenu);
        if (found) return found;
      }
    }
    return null;
  }
}
