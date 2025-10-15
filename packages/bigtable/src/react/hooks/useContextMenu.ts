/**
 * 右键菜单 Hook
 */

import { useEffect, useRef, useState } from 'react';
import { ContextMenuManager } from '../../core/interaction';
import type { IContextMenuContext, IMenuItem } from '../../core/interaction/ContextMenuManager';
import type { GridEngine } from '../../core/engine/GridEngine';

export interface IUseContextMenuConfig {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  engine: GridEngine | null;
  onMenuItemClick?: (itemId: string, context: IContextMenuContext) => void;
}

export interface IContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  items: IMenuItem[];
  context: IContextMenuContext | null;
}

export function useContextMenu(config: IUseContextMenuConfig) {
  const { canvasRef, engine, onMenuItemClick } = config;
  const menuManagerRef = useRef<ContextMenuManager | null>(null);
  const [menuState, setMenuState] = useState<IContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
    items: [],
    context: null,
  });

  // 初始化菜单管理器
  useEffect(() => {
    menuManagerRef.current = new ContextMenuManager(
      { items: [] },
      {
        onOpen: (x, y, context) => {
          const state = menuManagerRef.current?.getMenuState();
          if (state) {
            setMenuState({
              isOpen: true,
              x,
              y,
              items: state.items,
              context,
            });
          }
        },
        onClose: () => {
          setMenuState((prev) => ({ ...prev, isOpen: false }));
        },
        onItemClick: (itemId, context) => {
          console.log('[ContextMenu] Item clicked:', itemId, context);
          onMenuItemClick?.(itemId, context);
        },
      }
    );

    return () => {
      menuManagerRef.current?.destroy();
    };
  }, [onMenuItemClick]);

  // 处理右键事件
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engine) return;

    const menuManager = menuManagerRef.current;
    if (!menuManager) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const canvasX = e.clientX - rect.left;
      const canvasY = e.clientY - rect.top;

      const theme = engine.getTheme();

      // 判断点击区域
      const cellPosition = engine.getCellAtPoint(canvasX, canvasY);

      let context: IContextMenuContext;

      if (canvasY < theme.headerHeight) {
        // 点击在表头
        context = {
          type: 'column',
          columnIndex: cellPosition?.columnIndex,
        };
      } else if (cellPosition) {
        // 点击在单元格
        context = {
          type: 'cell',
          rowIndex: cellPosition.rowIndex,
          columnIndex: cellPosition.columnIndex,
        };
      } else {
        // 空白区域
        context = { type: 'empty' };
      }

      // 打开菜单（使用屏幕坐标）
      menuManager.open(e.clientX, e.clientY, context);
    };

    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [canvasRef, engine]);

  const handleItemClick = (itemId: string) => {
    menuManagerRef.current?.clickItem(itemId);
  };

  const handleClose = () => {
    menuManagerRef.current?.close();
  };

  return {
    menuState,
    handleItemClick,
    handleClose,
  };
}
