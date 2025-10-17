import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn, tokens, transitions, elevation } from '../../grid/design-system';
import { 
  ChevronDown,
  Check,
  Minus,
  Square
} from 'lucide-react';

export type RowHeight = 'short' | 'medium' | 'tall' | 'extra-tall';

export interface RowHeightOption {
  value: RowHeight;
  label: string;
  icon: React.ComponentType<any>;
}

export interface RowHeightComboboxProps {
  value?: RowHeight;
  onChange?: (rowHeight: RowHeight) => void;
  disabled?: boolean;
  className?: string;
}

const rowHeightOptions: RowHeightOption[] = [
  {
    value: 'short',
    label: '低',
    icon: () => (
      <div className="flex items-center gap-1">
        <div className="flex flex-col gap-0.5">
          <div className="w-3 h-0.5 bg-current"></div>
          <div className="w-4 h-0.5 bg-current"></div>
          <div className="w-3 h-0.5 bg-current"></div>
        </div>
        <ChevronDown size={12} className="opacity-50" />
      </div>
    ),
  },
  {
    value: 'medium',
    label: '中等',
    icon: () => (
      <div className="flex items-center gap-1">
        <div className="flex flex-col gap-1">
          <div className="w-4 h-0.5 bg-current"></div>
          <div className="w-4 h-0.5 bg-current"></div>
          <div className="w-4 h-0.5 bg-current"></div>
        </div>
        <ChevronDown size={12} className="opacity-50" />
      </div>
    ),
  },
  {
    value: 'tall',
    label: '高',
    icon: () => (
      <div className="flex items-center gap-1">
        <div className="flex flex-col gap-1.5">
          <div className="w-4 h-0.5 bg-current"></div>
          <div className="w-4 h-0.5 bg-current"></div>
          <div className="w-4 h-0.5 bg-current"></div>
        </div>
        <ChevronDown size={12} className="opacity-50" />
      </div>
    ),
  },
  {
    value: 'extra-tall',
    label: '超高',
    icon: () => (
      <div className="flex items-center gap-1">
        <div className="flex flex-col gap-2">
          <div className="w-4 h-0.5 bg-current"></div>
          <div className="w-4 h-0.5 bg-current"></div>
          <div className="w-4 h-0.5 bg-current"></div>
        </div>
        <ChevronDown size={12} className="opacity-50" />
      </div>
    ),
  },
];

export function RowHeightCombobox({
  value = 'medium',
  onChange,
  disabled = false,
  className,
}: RowHeightComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  
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
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  }, [isOpen]);

  // 选择行高
  const handleSelect = useCallback((rowHeight: RowHeight) => {
    onChange?.(rowHeight);
    setIsOpen(false);
  }, [onChange]);

  const currentOption = rowHeightOptions.find(option => option.value === value);

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
          outline: isOpen ? `2px solid ${tokens.colors.border.focus}` : 'none',
          outlineOffset: '2px',
        }}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="行高配置"
      >
        {/* 当前选中的图标 */}
        {currentOption && (
          <currentOption.icon />
        )}
        
        {/* 当前选中的标签 */}
        <span className="text-sm">
          {currentOption?.label || '中等'}
        </span>
        
        {/* 下拉箭头 */}
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
          className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          style={{
            backgroundColor: tokens.colors.surface.base,
            borderColor: tokens.colors.border.subtle,
            boxShadow: elevation.lg,
          }}
          onKeyDown={handleKeyDown}
          role="listbox"
          aria-label="行高选项"
        >
          {/* 面板标题 */}
          <div
            className="px-3 py-2 border-b border-gray-200"
            style={{
              borderBottomColor: tokens.colors.border.subtle,
            }}
          >
            <h3 className="text-xs font-medium text-gray-500" style={{ color: tokens.colors.text.secondary }}>
              行高配置
            </h3>
          </div>

          {/* 选项列表 */}
          <div className="py-1">
            {rowHeightOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = value === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-sm',
                    'hover:bg-gray-50 transition-colors duration-150',
                    'focus:outline-none focus:bg-gray-50'
                  )}
                  style={{
                    backgroundColor: isSelected ? tokens.colors.surface.selected : 'transparent',
                    color: isSelected ? tokens.colors.text.accent : tokens.colors.text.primary,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = tokens.colors.surface.hover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  {/* 选中状态指示器 */}
                  <div className="w-4 h-4 flex items-center justify-center">
                    {isSelected ? (
                      <Check size={14} style={{ color: tokens.colors.text.accent }} />
                    ) : (
                      <div className="w-3 h-3 rounded-full border border-gray-300" />
                    )}
                  </div>

                  {/* 图标 */}
                  <div 
                    className="flex-shrink-0"
                    style={{ 
                      color: isSelected ? tokens.colors.text.accent : tokens.colors.text.primary 
                    }}
                  >
                    <IconComponent />
                  </div>

                  {/* 标签 */}
                  <span className="flex-1 text-left">
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
