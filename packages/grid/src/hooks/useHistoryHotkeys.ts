/**
 * History Hotkeys Hook
 * 操作历史快捷键Hook
 */

import { useEffect } from 'react';
import { useHistory } from '@/context/history/HistoryContext';
import { isUndoKey, isRedoKey } from '@/grid/utils/core/hotkey';

export interface IUseHistoryHotkeysOptions {
  enabled?: boolean;
}

/**
 * 绑定撤销/重做快捷键
 */
export function useHistoryHotkeys({ enabled = true }: IUseHistoryHotkeysOptions = {}) {
  const { undo, redo, canUndo, canRedo } = useHistory();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = async (event: KeyboardEvent) => {
      // 忽略输入框中的快捷键
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // 检查撤销快捷键
      if (isUndoKey(event)) {
        event.preventDefault();
        if (canUndo) {
          console.log('[useHistoryHotkeys] Undo triggered by hotkey');
          await undo();
        }
        return;
      }

      // 检查重做快捷键
      if (isRedoKey(event)) {
        event.preventDefault();
        if (canRedo) {
          console.log('[useHistoryHotkeys] Redo triggered by hotkey');
          await redo();
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, undo, redo, canUndo, canRedo]);
}

