import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn, tokens, transitions, elevation } from '../../grid/design-system';
import { 
  Eye, 
  EyeOff, 
  GripVertical, 
  MoreHorizontal, 
  ChevronDown,
  Settings,
  Lock
} from 'lucide-react';
import { FieldContextMenu } from './FieldContextMenu';

export interface FieldConfig {
  id: string;
  name: string;
  type: string;
  visible: boolean;
  locked?: boolean;
  required?: boolean;
  description?: string;
}

export interface FieldConfigComboboxProps {
  fields: FieldConfig[];
  onFieldToggle: (fieldId: string, visible: boolean) => void;
  onFieldReorder: (fromIndex: number, toIndex: number) => void;
  onFieldEdit: (fieldId: string) => void;
  onFieldDelete: (fieldId: string) => void;
  onFieldGroup: (fieldId: string) => void;
  onFieldCopy?: (fieldId: string) => void;
  onFieldInsertLeft?: (fieldId: string) => void;
  onFieldInsertRight?: (fieldId: string) => void;
  onFieldFilter?: (fieldId: string) => void;
  onFieldSort?: (fieldId: string) => void;
  onFieldFreeze?: (fieldId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function FieldConfigCombobox({
  fields,
  onFieldToggle,
  onFieldReorder,
  onFieldEdit,
  onFieldDelete,
  onFieldGroup,
  onFieldCopy,
  onFieldInsertLeft,
  onFieldInsertRight,
  onFieldFilter,
  onFieldSort,
  onFieldFreeze,
  disabled = false,
  className,
}: FieldConfigComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null);
  
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current && 
        typeof triggerRef.current.contains === 'function' &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setShowContextMenu(null);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 键盘导航
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setShowContextMenu(null);
    }
  }, []);

  // 拖拽开始
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    e.currentTarget.style.opacity = '0.5';
  }, []);

  // 拖拽结束
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    e.currentTarget.style.opacity = '1';
    setDraggedIndex(null);
  }, []);

  // 拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // 放置
  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onFieldReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  }, [draggedIndex, onFieldReorder]);

  // 获取字段类型图标
  const getFieldIcon = (type: string) => {
    switch (type) {
      case 'text':
        return '📝';
      case 'number':
        return '🔢';
      case 'singleSelect':
        return '🔘';
      case 'multipleSelect':
        return '☑️';
      case 'date':
        return '📅';
      case 'attachment':
        return '📎';
      case 'checkbox':
        return '☑️';
      default:
        return '📄';
    }
  };

  // 上下文菜单处理
  const handleContextMenu = useCallback((e: React.MouseEvent, fieldId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPosition({
      x: rect.right,
      y: rect.top,
    });
    setShowContextMenu(fieldId);
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* 触发器按钮 */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md',
          'border border-solid transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          disabled 
            ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400',
          isOpen && !disabled && 'bg-gray-50 border-gray-400'
        )}
        style={{
          borderColor: isOpen ? tokens.colors.border.focus : tokens.colors.border.subtle,
          focusRingColor: tokens.colors.border.focus,
        }}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="字段配置"
      >
        <Settings size={16} />
        字段配置
        <ChevronDown 
          size={14} 
          className={cn(
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* 下拉面板 */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          style={{
            backgroundColor: tokens.colors.surface.base,
            borderColor: tokens.colors.border.subtle,
            boxShadow: elevation.lg,
          }}
          onKeyDown={handleKeyDown}
          role="listbox"
          aria-label="字段配置列表"
        >
          {/* 面板标题 */}
          <div
            className="px-4 py-3 border-b border-gray-200"
            style={{
              borderBottomColor: tokens.colors.border.subtle,
            }}
          >
            <h3 className="text-sm font-semibold text-gray-900" style={{ color: tokens.colors.text.primary }}>
              字段配置
            </h3>
            <p className="text-xs text-gray-500 mt-1" style={{ color: tokens.colors.text.secondary }}>
              管理字段的显示、排序和属性
            </p>
          </div>

          {/* 字段列表 */}
          <div className="max-h-80 overflow-y-auto">
            {fields.map((field, index) => (
              <div
                key={field.id}
                draggable={!field.locked}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onContextMenu={(e) => !field.locked && handleContextMenu(e, field.id)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0',
                  'transition-colors duration-150',
                  'hover:bg-gray-50',
                  showContextMenu === field.id && 'bg-gray-50'
                )}
                style={{
                  borderBottomColor: tokens.colors.border.subtle,
                  backgroundColor: showContextMenu === field.id ? tokens.colors.surface.hover : 'transparent',
                }}
                role="option"
                aria-selected={false}
              >
                {/* 拖拽手柄 */}
                {!field.locked && (
                  <GripVertical 
                    size={16} 
                    className="text-gray-400 cursor-grab hover:text-gray-600"
                    style={{ color: tokens.colors.text.tertiary }}
                  />
                )}

                {/* 锁定图标 */}
                {field.locked && (
                  <Lock 
                    size={16} 
                    className="text-gray-400"
                    style={{ color: tokens.colors.text.tertiary }}
                  />
                )}

                {/* 字段图标和名称 */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-base flex-shrink-0">
                    {getFieldIcon(field.type)}
                  </span>
                  <span 
                    className={cn(
                      'text-sm truncate',
                      field.locked ? 'font-semibold' : 'font-medium'
                    )}
                    style={{ color: tokens.colors.text.primary }}
                    title={field.name}
                  >
                    {field.name}
                  </span>
                </div>

                {/* 显示/隐藏切换 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFieldToggle(field.id, !field.visible);
                  }}
                  className={cn(
                    'p-1 rounded transition-colors duration-150',
                    'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  )}
                  style={{
                    color: field.visible ? tokens.colors.text.primary : tokens.colors.text.tertiary,
                  }}
                  aria-label={field.visible ? '隐藏字段' : '显示字段'}
                >
                  {field.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>

                {/* 更多操作菜单 */}
                {!field.locked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      setContextMenuPosition({
                        x: rect.right,
                        y: rect.top,
                      });
                      setShowContextMenu(showContextMenu === field.id ? null : field.id);
                    }}
                    className={cn(
                      'p-1 rounded transition-colors duration-150',
                      'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    )}
                    style={{ color: tokens.colors.text.secondary }}
                    aria-label="更多操作"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* 上下文菜单 */}
      <FieldContextMenu
        isOpen={!!showContextMenu}
        position={contextMenuPosition}
        fieldId={showContextMenu || ''}
        fieldName={fields.find(f => f.id === showContextMenu)?.name || ''}
        onClose={() => setShowContextMenu(null)}
        onEdit={onFieldEdit}
        onCopy={onFieldCopy || (() => {})}
        onInsertLeft={onFieldInsertLeft || (() => {})}
        onInsertRight={onFieldInsertRight || (() => {})}
        onFilter={onFieldFilter || (() => {})}
        onSort={onFieldSort || (() => {})}
        onGroup={onFieldGroup}
        onFreeze={onFieldFreeze || (() => {})}
        onToggleVisibility={(fieldId) => {
          const field = fields.find(f => f.id === fieldId);
          if (field) {
            onFieldToggle(fieldId, !field.visible);
          }
        }}
        onDelete={onFieldDelete}
        fieldVisible={fields.find(f => f.id === showContextMenu)?.visible}
        fieldLocked={fields.find(f => f.id === showContextMenu)?.locked}
      />
    </div>
  );
}
