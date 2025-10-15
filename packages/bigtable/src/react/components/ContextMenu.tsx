/**
 * 右键菜单组件
 */

import React, { useEffect, useRef } from 'react';
import type { IMenuItem } from '../../core/interaction/ContextMenuManager';

export interface ContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  items: IMenuItem[];
  onItemClick: (itemId: string) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  x,
  y,
  items,
  onItemClick,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // 延迟添加监听器（避免立即触发）
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Esc 键关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        minWidth: 200,
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 6,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 10000,
        padding: '4px 0',
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {items.map((item) => {
        if (item.type === 'separator') {
          return (
            <div
              key={item.id}
              style={{
                height: 1,
                backgroundColor: '#e5e7eb',
                margin: '4px 0',
              }}
            />
          );
        }

        return (
          <div
            key={item.id}
            onClick={() => {
              if (!item.disabled) {
                onItemClick(item.id);
              }
            }}
            style={{
              padding: '8px 12px',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
              opacity: item.disabled ? 0.5 : 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'transparent',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span
                style={{
                  marginLeft: 16,
                  fontSize: 12,
                  color: '#9ca3af',
                }}
              >
                {item.shortcut}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};
