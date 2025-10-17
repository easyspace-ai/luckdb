/**
 * ViewHeader - 视图头部组件
 * 
 * 设计原则：
 * 1. 清晰的视觉层次（选中标签"浮起"）
 * 2. 流畅的动画过渡
 * 3. 支持静态标签和动态视图
 * 4. 移动端友好
 */

import React, { useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn, tokens, transitions, elevation } from '../../grid/design-system';
import { Plus, MoreVertical } from 'lucide-react';
import { CreateViewMenu } from './CreateViewMenu';
import { IconButton } from '../../ui/Button';

export interface Tab {
  key: string;
  label: string;
}

export interface View {
  id: string;
  name: string;
  type?: string;
}

export interface ViewHeaderProps {
  // 静态标签模式
  tabs?: Tab[];
  activeTabKey?: string;
  onTabChange?: (tabKey: string) => void;
  
  // 动态视图模式
  views?: View[];
  activeViewId?: string;
  onViewChange?: (viewId: string) => void;
  onCreateView?: (viewType: string) => void;
  onRenameView?: (viewId: string, newName: string) => void;
  onDeleteView?: (viewId: string) => void;
  
  // 操作按钮
  onAdd?: () => void;
  
  // 响应式
  isMobile?: boolean;
  isTouch?: boolean;
  
  className?: string;
}

/**
 * ViewTab - 单个标签组件
 */
interface ViewTabProps {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
  onRename?: (id: string) => void;
  onDelete?: (id: string) => void;
  isMobile?: boolean;
  isTouch?: boolean;
}

function ViewTab({ id, label, active, onClick, onRename, onDelete, isMobile, isTouch }: ViewTabProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuAnchorRef = useRef<HTMLDivElement | null>(null);

  return (
    <div
      role="tab"
      aria-selected={active}
      data-state={active ? 'active' : 'inactive'}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false);
        setMenuOpen(false);
      }}
      className={cn(
        // 基础样式
        'relative font-medium group',
        'transition-all duration-200 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        
        // 尺寸
        isMobile ? 'h-9 px-3 text-xs' : 'h-10 px-4 text-sm',
        
        // 固定宽度，支持四个字符
        isMobile ? 'min-w-[64px]' : 'min-w-[80px]',
        
        // 文字超出省略
        'overflow-hidden whitespace-nowrap text-ellipsis',
        
        // 移动端增大触摸区域
        isTouch && 'min-h-[44px]',
      )}
      style={{
        // 选中状态：向上浮起 + 阴影
        transform: active ? 'translateY(-2px)' : isHovering ? 'translateY(-1px)' : 'translateY(0)',
        color: active ? tokens.colors.text.primary : isHovering ? tokens.colors.text.primary : tokens.colors.text.secondary,
        zIndex: active ? 3 : 1,
        // 浏览器标签样式：选中时边框（上左右），并覆盖底部边框
        backgroundColor: active ? tokens.colors.surface.base : 'transparent',
        borderTopLeftRadius: active ? 8 : 0,
        borderTopRightRadius: active ? 8 : 0,
        borderLeft: active ? `1px solid ${tokens.colors.border.default}` : undefined,
        borderRight: active ? `1px solid ${tokens.colors.border.default}` : undefined,
        borderTop: active ? `1px solid ${tokens.colors.border.default}` : undefined,
        borderBottom: active ? '0px' : undefined,
        marginBottom: active ? '-1px' : 0, // 覆盖 header 的下边框，形成一体效果
      }}
    >
      {/* 标签内容：图标 + 文本，中线对齐；双击开始内联编辑（通过上层注入） */}
      <button className="relative z-10 flex items-center gap-2" onClick={onClick}>
        <span
          className="inline-block h-4 w-4 rounded-sm"
          style={{ backgroundColor: active ? tokens.colors.primary[500] : tokens.colors.text.secondary, opacity: 0.9 }}
        />
        <span>{label}</span>
        {/* 行内竖三点菜单触发区 */}
        {(onRename || onDelete) && (
          <div
            ref={menuAnchorRef}
            className="ml-1 rounded-md hover:bg-gray-100"
            style={{ padding: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              const rect = menuAnchorRef.current?.getBoundingClientRect();
              if (rect) {
                const width = 160;
                setMenuPos({ top: rect.bottom + 6, left: Math.max(8, rect.right - width) });
              }
              setMenuOpen((v) => !v);
            }}
            aria-label="更多操作"
            title="更多操作"
          >
            <MoreVertical size={16} color={tokens.colors.text.secondary} />
          </div>
        )}
      </button>

      {/* 右上角悬浮触发按钮已移除，改为行内竖三点 */}

      {/* 简易菜单（使用 Portal，position: fixed，避免被遮挡） */}
      {menuOpen && menuPos && createPortal(
        <div
          className="min-w-[160px] rounded-md border bg-white py-1 text-sm shadow-2xl"
          style={{
            position: 'fixed',
            top: menuPos.top,
            left: menuPos.left,
            zIndex: 9999,
            borderColor: tokens.colors.border.default,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {!!onRename && (
            <button
              className="w-full px-3 py-2 text-left hover:bg-gray-50"
              onClick={() => {
                setMenuOpen(false);
                onRename?.(id);
              }}
            >
              重命名
            </button>
          )}
          {!!onDelete && (
            <button
              className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50"
              onClick={() => {
                setMenuOpen(false);
                onDelete?.(id);
              }}
            >
              删除
            </button>
          )}
        </div>,
        document.body
      )}
      
      {/* 选中状态的底部细线，贴近浏览器标签效果 */}
      {active && (
        <span
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ backgroundColor: tokens.colors.surface.base }}
        />
      )}
      
      {/* Hover 状态的背景 */}
      {(active || isHovering) && (
        <span
          className="absolute inset-0 -z-10 rounded-t-lg"
          style={{
            backgroundColor: active 
              ? tokens.colors.surface.base 
              : tokens.colors.surface.hover,
            transition: transitions.presets.colors,
          }}
        />
      )}
    </div>
  );
}

/**
 * ViewHeader 主组件
 */
export function ViewHeader({
  tabs,
  activeTabKey,
  onTabChange,
  views,
  activeViewId,
  onViewChange,
  onCreateView,
  onRenameView,
  onDeleteView,
  onAdd,
  isMobile = false,
  isTouch = false,
  className,
}: ViewHeaderProps) {
  const [showCreateViewMenu, setShowCreateViewMenu] = useState(false);

  // 处理标签切换
  const handleTabChange = useCallback((key: string) => {
    onTabChange?.(key);
  }, [onTabChange]);

  // 处理视图切换
  const handleViewChange = useCallback((viewId: string) => {
    onViewChange?.(viewId);
  }, [onViewChange]);

  // 处理创建视图
  const handleCreateView = useCallback((viewType: string) => {
    onCreateView?.(viewType);
    setShowCreateViewMenu(false);
  }, [onCreateView]);

  // 使用动态视图或静态标签
  const useViews = !!(views && views.length > 0);

  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'relative border-b',
        isMobile ? 'px-2 h-11' : 'px-4 h-12',
        className
      )}
      style={{
        backgroundColor: tokens.colors.surface.base,
        borderColor: tokens.colors.border.subtle,
      }}
      role="banner"
    >
      {/* 标签栏 */}
      <div 
        role="tablist" 
        className="flex items-center gap-1"
      >
        {useViews ? (
          // 动态视图模式
          views.map((view) => (
            <ViewTab
              key={view.id}
              id={view.id}
              label={view.name}
              active={activeViewId === view.id}
              onClick={() => handleViewChange(view.id)}
              onRename={onRenameView ? (id) => {
                // 上层会打开自定义对话框；此处仅发起请求
                onRenameView?.(id, view.name);
              } : undefined}
              onDelete={onDeleteView ? (id) => {
                onDeleteView?.(id);
              } : undefined}
              isMobile={isMobile}
              isTouch={isTouch}
            />
          ))
        ) : (
          // 静态标签模式
          tabs?.map((tab) => (
            <ViewTab
              key={tab.key}
              id={tab.key}
              label={tab.label}
              active={activeTabKey === tab.key}
              onClick={() => handleTabChange(tab.key)}
              isMobile={isMobile}
              isTouch={isTouch}
            />
          ))
        )}

        {/* 添加视图按钮：只要提供 onCreateView 就显示（无论使用静态标签还是动态视图） */}
        {onCreateView && (
          <div className="relative ml-2">
            <IconButton
              icon={Plus}
              variant="ghost"
              size={isMobile ? 'sm' : 'sm'}
              onClick={() => setShowCreateViewMenu(!showCreateViewMenu)}
              aria-label="添加视图"
              title="添加视图"
            />
            
            {/* 创建视图下拉菜单 */}
            {showCreateViewMenu && (
              <CreateViewMenu
                onSelect={handleCreateView}
                onClose={() => setShowCreateViewMenu(false)}
              />
            )}
          </div>
        )}
      </div>

      {/* 右侧操作按钮 */}
      {onAdd && (
        <IconButton
          icon={Plus}
          variant="secondary"
          size={isMobile ? 'sm' : 'md'}
          onClick={onAdd}
          className="rounded-full"
          style={{
            boxShadow: elevation.xs,
          }}
          aria-label="添加新项"
        />
      )}
    </div>
  );
}

