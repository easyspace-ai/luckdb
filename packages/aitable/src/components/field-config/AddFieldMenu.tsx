import React, { useState, useMemo, useRef, useEffect } from 'react';
import { tokens, transitions, elevation } from '../../grid/design-system';
import { 
  Search,
  Text, 
  Hash, 
  Calendar, 
  CheckSquare, 
  Image, 
  Link,
  Mail,
  Phone,
  MapPin,
  FileText,
  Star,
  Clock,
  User,
  List,
  Check,
  Sparkles,
  Plus
} from 'lucide-react';

/**
 * 字段类型分类
 */
export type FieldCategory = 
  | 'basic'      // 基础类型
  | 'select'     // 选择类型
  | 'datetime'   // 日期时间
  | 'link'       // 链接类型
  | 'advanced'   // 高级类型
  | 'collab';    // 协作类型

/**
 * 字段类型定义
 */
export interface FieldType {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  category: FieldCategory;
  color: string;
  popular?: boolean;
  keywords?: string[];
}

/**
 * 分类配置
 */
const categoryConfig: Record<FieldCategory, {
  name: string;
  icon: React.ComponentType<any>;
  color: string;
}> = {
  basic: {
    name: '基础字段',
    icon: FileText,
    color: '#3b82f6',
  },
  select: {
    name: '选择字段',
    icon: List,
    color: '#8b5cf6',
  },
  datetime: {
    name: '日期时间',
    icon: Calendar,
    color: '#06b6d4',
  },
  link: {
    name: '链接字段',
    icon: Link,
    color: '#10b981',
  },
  advanced: {
    name: '高级字段',
    icon: Sparkles,
    color: '#f59e0b',
  },
  collab: {
    name: '协作字段',
    icon: User,
    color: '#ec4899',
  },
};

/**
 * 字段类型列表（精简版，适合菜单显示）
 */
const fieldTypes: FieldType[] = [
  // 基础类型
  {
    id: 'text',
    name: '单行文本',
    icon: Text,
    description: '简短的文本内容',
    category: 'basic',
    color: '#3b82f6',
    popular: true,
    keywords: ['文本', 'text', '单行'],
  },
  {
    id: 'longText',
    name: '长文本',
    icon: FileText,
    description: '多行文本，支持换行',
    category: 'basic',
    color: '#10b981',
    popular: true,
    keywords: ['长文本', 'textarea', '多行'],
  },
  {
    id: 'number',
    name: '数字',
    icon: Hash,
    description: '数值和计算',
    category: 'basic',
    color: '#f59e0b',
    popular: true,
    keywords: ['数字', 'number', '数值'],
  },
  
  // 选择类型
  {
    id: 'singleSelect',
    name: '单选',
    icon: CheckSquare,
    description: '从多个选项中选择一个',
    category: 'select',
    color: '#8b5cf6',
    popular: true,
    keywords: ['单选', 'select', '选项'],
  },
  {
    id: 'multipleSelect',
    name: '多选',
    icon: List,
    description: '可以选择多个选项',
    category: 'select',
    color: '#ec4899',
    popular: true,
    keywords: ['多选', 'multi', '标签'],
  },
  {
    id: 'checkbox',
    name: '复选框',
    icon: Check,
    description: '是/否 二选一',
    category: 'select',
    color: '#84cc16',
    keywords: ['复选框', 'checkbox', '是否'],
  },
  
  // 日期时间
  {
    id: 'date',
    name: '日期',
    icon: Calendar,
    description: '日期和时间',
    category: 'datetime',
    color: '#06b6d4',
    popular: true,
    keywords: ['日期', 'date', '时间'],
  },
  
  // 链接类型
  {
    id: 'link',
    name: '链接',
    icon: Link,
    description: '网址链接',
    category: 'link',
    color: '#6366f1',
    keywords: ['链接', 'url', '网址'],
  },
  {
    id: 'email',
    name: '邮箱',
    icon: Mail,
    description: '电子邮件地址',
    category: 'link',
    color: '#14b8a6',
    keywords: ['邮箱', 'email', '邮件'],
  },
  {
    id: 'phone',
    name: '电话',
    icon: Phone,
    description: '电话号码',
    category: 'link',
    color: '#ef4444',
    keywords: ['电话', 'phone', '手机'],
  },
  
  // 高级类型
  {
    id: 'rating',
    name: '评分',
    icon: Star,
    description: '星级评分',
    category: 'advanced',
    color: '#eab308',
    keywords: ['评分', 'rating', '星级'],
  },
  {
    id: 'formula',
    name: '公式',
    icon: Sparkles,
    description: '基于其他字段计算得出',
    category: 'advanced',
    color: '#8b5cf6',
    popular: true,
    keywords: ['公式', 'formula', '计算', '函数'],
  },
  
  // 协作类型
  {
    id: 'user',
    name: '成员',
    icon: User,
    description: '选择用户或成员',
    category: 'collab',
    color: '#64748b',
    keywords: ['用户', 'user', '成员', '人员'],
  },
  {
    id: 'attachment',
    name: '附件',
    icon: Image,
    description: '上传文件和图片',
    category: 'collab',
    color: '#f97316',
    keywords: ['附件', 'attachment', '文件', '图片'],
  },
];

export interface AddFieldMenuProps {
  isOpen: boolean;
  onClose: () => void;
  // Airtable 两步式：最终确认时回调；若不传则退化为仅选择类型
  onConfirm?: (payload: { type: string; name?: string; options?: any }) => void;
  onSelect?: (fieldType: string) => void;
  triggerRef?: React.RefObject<HTMLElement>;
}

/**
 * Airtable 风格的字段添加菜单
 * 
 * 特性：
 * - 智能定位（在触发元素下方显示）
 * - 自动调整位置防止被遮挡
 * - 紧凑的设计，适合菜单显示
 * - 搜索和分类功能
 */
export function AddFieldMenu({ isOpen, onClose, onConfirm, onSelect, triggerRef }: AddFieldMenuProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FieldCategory | 'all' | 'popular'>('all');
  const [step, setStep] = useState<'select' | 'configure'>('select');
  const [selectedType, setSelectedType] = useState<FieldType | null>(null);
  const [fieldName, setFieldName] = useState('');
  const [fieldOptions, setFieldOptions] = useState<any>({});
  const [fieldDescription, setFieldDescription] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 400 });

  // 筛选后的字段类型
  const filteredFieldTypes = useMemo(() => {
    let result = fieldTypes;
    
    // 按分类筛选
    if (selectedCategory === 'popular') {
      result = result.filter(type => type.popular);
    } else if (selectedCategory !== 'all') {
      result = result.filter(type => type.category === selectedCategory);
    }
    
    // 按搜索词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(type => 
        type.name.toLowerCase().includes(query) ||
        type.description.toLowerCase().includes(query) ||
        type.keywords?.some(keyword => keyword.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [selectedCategory, searchQuery]);

  // 智能定位逻辑（根据不同步骤的宽度动态修正，避免右侧裁切）
  useEffect(() => {
    if (!isOpen || !triggerRef?.current) return;

    const trigger = triggerRef.current;
    const rect = trigger.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };

    let top = rect.bottom + 4; // 优先在下方
    let left = rect.left;      // 与触发元素左侧对齐
    let maxHeight = 400;

    // 动态菜单宽度
    const menuWidth = step === 'select' ? 320 : 420;
    const margin = 8;

    // 横向边界修正：确保 [margin, viewport.width - menuWidth - margin]
    left = Math.min(Math.max(left, margin), viewport.width - menuWidth - margin);

    // 纵向边界：若下方空间不足则转到上方
    const availableBelow = viewport.height - top - margin;
    if (availableBelow < 220) {
      top = rect.top - 4;
      maxHeight = Math.min(400, rect.top - margin);
    } else {
      maxHeight = Math.min(400, availableBelow);
    }

    setPosition({ top, left, maxHeight });
  }, [isOpen, triggerRef, step]);

  // 打开时重置（修复再次打开仍停留在上次第二步的问题）
  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setSelectedType(null);
      setFieldName('');
      setFieldOptions({});
      setFieldDescription('');
    }
  }, [isOpen]);

  // 处理字段选择：若提供 onConfirm 则进入配置步骤，否则沿用仅选择
  const handleFieldSelect = (fieldType: string) => {
    const type = fieldTypes.find(t => t.id === fieldType) || null;
    setSelectedType(type);
    if (onConfirm) {
      if (fieldType === 'singleSelect' || fieldType === 'multipleSelect') {
        setFieldOptions({ options: [] });
      } else {
        setFieldOptions({});
      }
      setStep('configure');
    } else {
      onSelect?.(fieldType);
      onClose();
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          triggerRef?.current && typeof triggerRef.current.contains === 'function' && 
          !triggerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <>
      {/* 背景遮罩 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
        }}
        onClick={onClose}
      />

      {/* 菜单主体（两步式）*/}
      <div
        ref={menuRef}
        style={{
          position: 'fixed',
          top: position.top,
          left: position.left,
          width: step === 'select' ? '320px' : '420px',
          maxHeight: position.maxHeight,
          backgroundColor: tokens.colors.surface.base,
          border: `1px solid ${tokens.colors.border.subtle}`,
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
          zIndex: 51,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideDown 200ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {step === 'select' ? (
        <>
        {/* 搜索框 */}
        <div style={{ padding: '12px', borderBottom: `1px solid ${tokens.colors.border.subtle}` }}>
          <div style={{ position: 'relative' }}>
            <Search 
              size={16} 
              style={{ 
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: tokens.colors.text.tertiary,
                pointerEvents: 'none',
              }} 
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索字段类型..."
              autoFocus
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                fontSize: '13px',
                color: tokens.colors.text.primary,
                backgroundColor: tokens.colors.surface.base,
                border: `1px solid ${tokens.colors.border.subtle}`,
                borderRadius: '6px',
                outline: 'none',
                transition: transitions.presets.all,
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = tokens.colors.border.focus;
                e.target.style.boxShadow = `0 0 0 2px ${tokens.colors.border.focus}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = tokens.colors.border.subtle;
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
        </div>

        {/* 分类标签 */}
        <div 
          style={{ 
            padding: '8px 12px',
            borderBottom: `1px solid ${tokens.colors.border.subtle}`,
            display: 'flex',
            gap: '4px',
            flexWrap: 'wrap',
            backgroundColor: tokens.colors.surface.hover,
          }}
        >
          {[
            { id: 'all', name: '全部' },
            { id: 'popular', name: '常用' },
            ...Object.entries(categoryConfig).map(([id, config]) => ({
              id: id as FieldCategory,
              name: config.name,
            })),
          ].map((category) => {
            const isSelected = selectedCategory === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id as any)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: isSelected ? 500 : 400,
                  color: isSelected ? tokens.colors.text.primary : tokens.colors.text.secondary,
                  backgroundColor: isSelected ? tokens.colors.surface.base : 'transparent',
                  border: `1px solid ${isSelected ? tokens.colors.border.default : 'transparent'}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                  transition: transitions.presets.all,
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = tokens.colors.surface.base;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {/* 字段类型列表 */}
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto',
            padding: '4px',
          }}
        >
          {filteredFieldTypes.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                color: tokens.colors.text.secondary,
                fontSize: '13px',
              }}
            >
              <Search size={24} style={{ color: tokens.colors.text.tertiary, marginBottom: '8px' }} />
              <div>没有找到匹配的字段类型</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {filteredFieldTypes.map((type) => {
                const IconComponent = type.icon;
                
                return (
                  <button
                    key={type.id}
                    onClick={() => handleFieldSelect(type.id)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 150ms cubic-bezier(0.4, 0.0, 0.2, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = tokens.colors.surface.hover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {/* 图标 */}
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        backgroundColor: `${type.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconComponent size={14} style={{ color: type.color }} />
                    </div>

                    {/* 文字信息 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: tokens.colors.text.primary,
                          marginBottom: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {type.name}
                        {type.popular && (
                          <Star size={10} style={{ color: tokens.colors.text.warning, fill: tokens.colors.text.warning }} />
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: tokens.colors.text.secondary,
                          lineHeight: '1.3',
                        }}
                      >
                        {type.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        </>
        ) : (
          <>
            {/* 顶部：字段名 + 类型展示 + 返回 */}
            <div style={{ padding: '12px', borderBottom: `1px solid ${tokens.colors.border.subtle}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="字段名称（可选）"
                autoFocus
                style={{ width: '100%', padding: '8px 10px', fontSize: '14px', color: tokens.colors.text.primary, backgroundColor: tokens.colors.surface.base, border: `1px solid ${tokens.colors.border.subtle}`, borderRadius: '6px', outline: 'none' }}
              />
              <div style={{ fontSize: '12px', color: tokens.colors.text.secondary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ padding: '4px 8px', border: `1px solid ${tokens.colors.border.subtle}`, borderRadius: '4px', backgroundColor: tokens.colors.surface.hover }}>{selectedType?.name}</span>
                <button onClick={() => setStep('select')} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: tokens.colors.text.link, cursor: 'pointer', fontSize: '12px' }}>更改类型</button>
              </div>
            </div>

            {/* 配置区：覆盖单/多选和公式 */}
            <div style={{ padding: '12px', overflowY: 'auto', maxHeight: position.maxHeight - 120 }}>
              {selectedType?.id === 'singleSelect' || selectedType?.id === 'multipleSelect' ? (
                <SelectOptionsEditor value={fieldOptions} onChange={setFieldOptions} />
              ) : selectedType?.id === 'formula' ? (
                <FormulaEditor value={fieldOptions} onChange={setFieldOptions} />
              ) : (
                <div style={{ fontSize: '12px', color: tokens.colors.text.secondary }}>该字段暂无额外配置</div>
              )}
            </div>

            {/* 底部操作 */}
            <div style={{ 
              padding: '12px', 
              borderTop: `1px solid ${tokens.colors.border.subtle}`, 
              display: 'flex', 
              gap: '8px', 
              justifyContent: 'flex-end',
              backgroundColor: tokens.colors.surface.base,
              position: 'sticky',
              bottom: 0,
            }}>
              <button 
                onClick={onClose} 
                style={{ 
                  padding: '8px 12px', 
                  fontSize: '13px', 
                  background: 'transparent', 
                  border: `1px solid ${tokens.colors.border.subtle}`, 
                  borderRadius: '6px', 
                  cursor: 'pointer', 
                  color: tokens.colors.text.primary 
                }}
              >
                取消
              </button>
              <button 
                onClick={(e) => {
                  console.log('🔥 创建字段按钮被点击');
                  console.log('selectedType:', selectedType);
                  console.log('fieldName:', fieldName);
                  console.log('fieldOptions:', fieldOptions);
                  console.log('onConfirm:', onConfirm);
                  
                  // 防止事件冒泡
                  e.stopPropagation();
                  
                  if (!selectedType) {
                    console.error('❌ selectedType 为 null');
                    return;
                  }
                  
                  const payload = { 
                    type: selectedType.id, 
                    name: fieldName, 
                    options: { ...fieldOptions, description: fieldDescription } 
                  };
                  
                  console.log('准备调用 onConfirm，参数:', payload);
                  
                  onConfirm?.(payload);
                  onClose();
                }} 
                style={{ 
                  padding: '8px 12px', 
                  fontSize: '13px', 
                  background: tokens.colors.primary[600], 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                }}
              >
                创建字段
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}

export default AddFieldMenu;

// 公式编辑器
function FormulaEditor({ value, onChange }: { value: any; onChange: (val: any) => void }) {
  const [formula, setFormula] = useState(value?.formula || '');
  const [description, setDescription] = useState(value?.description || '');

  const handleFormulaChange = (newFormula: string) => {
    setFormula(newFormula);
    onChange({ ...value, formula: newFormula });
  };

  const handleDescriptionChange = (newDescription: string) => {
    setDescription(newDescription);
    onChange({ ...value, description: newDescription });
  };

  const handleAIGenerate = () => {
    // 模拟 AI 生成公式
    const aiFormula = 'SUM({数字字段1}, {数字字段2})';
    handleFormulaChange(aiFormula);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: tokens.colors.text.primary, marginBottom: '4px' }}>公式</div>
      
      {/* 公式输入框 */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={formula}
          onChange={(e) => handleFormulaChange(e.target.value)}
          placeholder="输入公式，例如：SUM({字段1}, {字段2})"
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '8px 10px',
            fontSize: '13px',
            color: tokens.colors.text.primary,
            backgroundColor: tokens.colors.surface.base,
            border: `1px solid ${tokens.colors.border.subtle}`,
            borderRadius: '6px',
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            lineHeight: '1.4',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = tokens.colors.border.focus;
            e.target.style.boxShadow = `0 0 0 2px ${tokens.colors.border.focus}20`;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = tokens.colors.border.subtle;
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* AI 生成按钮 */}
      <button
        onClick={handleAIGenerate}
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          background: tokens.colors.surface.hover,
          border: `1px solid ${tokens.colors.border.subtle}`,
          borderRadius: '6px',
          cursor: 'pointer',
          color: tokens.colors.text.primary,
          alignSelf: 'flex-start',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Sparkles size={12} />
        使用 AI 生成公式
      </button>

      {/* 描述输入 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '12px', fontWeight: 500, color: tokens.colors.text.primary }}>描述</label>
        <input
          type="text"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          placeholder="描述此字段的用途（可选）"
          style={{
            width: '100%',
            padding: '6px 8px',
            fontSize: '12px',
            color: tokens.colors.text.primary,
            backgroundColor: tokens.colors.surface.base,
            border: `1px solid ${tokens.colors.border.subtle}`,
            borderRadius: '6px',
            outline: 'none',
          }}
        />
      </div>
    </div>
  );
}

// 选项编辑器（简化版：单/多选）
function SelectOptionsEditor({ value, onChange }: { value: any; onChange: (val: any) => void }) {
  const options: Array<{ id: string; name: string; color?: string }> = value?.options ?? [];

  const addOption = () => {
    const next = [...options, { id: `${Date.now()}`, name: `选项${options.length + 1}` }];
    onChange({ ...value, options: next });
  };

  const updateName = (index: number, name: string) => {
    const next = options.slice();
    next[index] = { ...next[index], name };
    onChange({ ...value, options: next });
  };

  const remove = (index: number) => {
    const next = options.filter((_, i) => i !== index);
    onChange({ ...value, options: next });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '13px', fontWeight: 600, color: tokens.colors.text.primary, marginBottom: '4px' }}>选项</div>
      {options.length === 0 && (
        <div style={{ fontSize: '12px', color: tokens.colors.text.secondary }}>暂无选项</div>
      )}
      {options.map((opt, idx) => (
        <div key={opt.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            value={opt.name}
            onChange={(e) => updateName(idx, e.target.value)}
            style={{ flex: 1, padding: '6px 8px', fontSize: '13px', border: `1px solid ${tokens.colors.border.subtle}`, borderRadius: '6px' }}
          />
          <button onClick={() => remove(idx)} style={{ padding: '6px 8px', fontSize: '12px', background: 'transparent', border: `1px solid ${tokens.colors.border.subtle}`, borderRadius: '6px', cursor: 'pointer' }}>删除</button>
        </div>
      ))}
      <button onClick={addOption} style={{ padding: '8px 12px', fontSize: '13px', background: tokens.colors.surface.hover, border: `1px solid ${tokens.colors.border.subtle}`, borderRadius: '6px', cursor: 'pointer', alignSelf: 'flex-start' }}>+ 添加选项</button>
    </div>
  );
}
