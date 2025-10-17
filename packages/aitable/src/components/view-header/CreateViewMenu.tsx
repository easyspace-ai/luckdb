/**
 * CreateViewMenu - 创建视图下拉菜单
 * 
 * 设计原则：
 * 1. 清晰的视图类型图标
 * 2. 优雅的动画进出
 * 3. 点击外部自动关闭
 */

import React, { useEffect, useRef } from 'react';
import { cn, tokens, transitions, elevation } from '../../grid/design-system';
import { 
  Table, 
  LayoutGrid, 
  Calendar, 
  BarChart3, 
  Image, 
  FileText 
} from 'lucide-react';

export interface ViewType {
  type: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
}

export interface CreateViewMenuProps {
  onSelect: (viewType: string) => void;
  onClose: () => void;
}

const VIEW_TYPES: ViewType[] = [
  { type: 'grid', name: '表格视图', icon: Table, color: '#3b82f6' },
  { type: 'kanban', name: '看板视图', icon: LayoutGrid, color: '#10b981' },
  { type: 'calendar', name: '日历视图', icon: Calendar, color: '#06b6d4' },
  { type: 'gantt', name: '甘特视图', icon: BarChart3, color: '#ec4899' },
  { type: 'gallery', name: '画册视图', icon: Image, color: '#8b5cf6' },
  { type: 'form', name: '表单视图', icon: FileText, color: '#f59e0b' },
];

export function CreateViewMenu({ onSelect, onClose }: CreateViewMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // 延迟添加监听器，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {/* 背景遮罩（可选，用于捕获点击） */}
      <div
        className="fixed inset-0 z-[998]"
        style={{ backgroundColor: 'transparent' }}
        onClick={onClose}
      />

      {/* 菜单内容 */}
      <div
        ref={menuRef}
        onKeyDown={handleKeyDown}
        className={cn(
          'absolute top-full left-0 mt-2',
          'bg-white rounded-lg border shadow-lg',
          'py-2 min-w-[220px]',
          'z-[999]',
          // 进入动画
          'animate-in fade-in-0 slide-in-from-top-2 duration-200',
        )}
        style={{
          backgroundColor: tokens.colors.surface.base,
          borderColor: tokens.colors.border.subtle,
          boxShadow: elevation.lg,
        }}
        role="menu"
        aria-label="创建视图类型"
      >
        {/* 标题 */}
        <div
          className="px-4 py-2 text-xs font-semibold border-b mb-1"
          style={{
            color: tokens.colors.text.secondary,
            borderBottomColor: tokens.colors.border.subtle,
          }}
        >
          基础视图
        </div>

        {/* 视图类型选项 */}
        {VIEW_TYPES.map((viewType) => {
          const IconComponent = viewType.icon;
          return (
            <button
              key={viewType.type}
              onClick={() => onSelect(viewType.type)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5',
                'text-sm text-left',
                'transition-colors duration-150',
                'hover:bg-gray-50 focus:bg-gray-50',
                'focus:outline-none',
              )}
              style={{
                color: tokens.colors.text.primary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = tokens.colors.surface.hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              role="menuitem"
            >
              {/* 图标 */}
              <div
                className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-md"
                style={{
                  backgroundColor: `${viewType.color}15`,
                  color: viewType.color,
                }}
              >
                <IconComponent size={16} />
              </div>

              {/* 名称 */}
              <span>{viewType.name}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

