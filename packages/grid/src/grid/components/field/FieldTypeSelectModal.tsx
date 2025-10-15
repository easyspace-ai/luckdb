/**
 * Field Type Select Modal Component
 * 字段类型选择弹窗组件
 * 参考 teable-develop 的实现，提供字段类型选择和字段名称输入功能
 */

import { forwardRef, useImperativeHandle, useState, useRef, useEffect } from 'react';
import type { ForwardRefRenderFunction } from 'react';
import { VirtualFieldConfig, type IVirtualFieldConfigRef, type IFormulaFieldConfigOptions, type IRollupFieldConfigOptions } from './VirtualFieldConfig';

export type IFieldTypeModal =
  | 'singleLineText'
  | 'longText'
  | 'number'
  | 'singleSelect'
  | 'multipleSelect'
  | 'date'
  | 'dateTime'
  | 'checkbox'
  | 'user'
  | 'attachment'
  | 'link'
  | 'rating'
  | 'formula'
  | 'rollup'
  | 'autoNumber'
  | 'createdTime'
  | 'lastModifiedTime'
  | 'createdBy'
  | 'lastModifiedBy';

export interface IFieldTypeOption {
  type: IFieldTypeModal;
  name: string;
  icon: string;
  description?: string;
}

export interface IFieldTypeSelectModalRef {
  show: (position?: { x: number; y: number }, mode?: 'create' | 'edit', initialData?: { type?: IFieldTypeModal; name?: string; options?: IFormulaFieldConfigOptions | IRollupFieldConfigOptions }) => void;
  hide: () => void;
}

export interface IFieldTypeSelectModalProps {
  onConfirm?: (data: { type: IFieldTypeModal; name: string; options?: IFormulaFieldConfigOptions | IRollupFieldConfigOptions }) => void;
  onCancel?: () => void;
}

// 基础字段类型分组
const BASE_FIELD_TYPES: IFieldTypeOption[] = [
  { type: 'singleLineText', name: '单行文本', icon: '📝', description: '用于输入短文本内容' },
  { type: 'longText', name: '长文本', icon: '📄', description: '用于输入多行文本内容' },
  { type: 'number', name: '数字', icon: '🔢', description: '用于输入数值' },
  { type: 'singleSelect', name: '单选', icon: '🔘', description: '从预设选项中选择一个' },
  { type: 'multipleSelect', name: '多选', icon: '☑️', description: '从预设选项中选择多个' },
  { type: 'date', name: '日期', icon: '📅', description: '选择日期' },
  { type: 'checkbox', name: '复选框', icon: '☑️', description: '是/否选择' },
  { type: 'user', name: '用户', icon: '👤', description: '选择系统用户' },
  { type: 'rating', name: '评分', icon: '⭐', description: '星级评分' },
];

// 高级字段类型分组
const ADVANCED_FIELD_TYPES: IFieldTypeOption[] = [
  { type: 'attachment', name: '附件', icon: '📎', description: '上传文件附件' },
  { type: 'link', name: '关联', icon: '🔗', description: '关联其他表格记录' },
  { type: 'formula', name: '公式', icon: '🧮', description: '基于其他字段计算得出' },
  { type: 'rollup', name: '汇总', icon: '📊', description: '汇总关联字段的数据' },
  { type: 'autoNumber', name: '自动编号', icon: '#️⃣', description: '自动生成递增数字' },
];

// 系统字段类型分组
const SYSTEM_FIELD_TYPES: IFieldTypeOption[] = [
  { type: 'createdTime', name: '创建时间', icon: '🕒', description: '记录创建时间' },
  { type: 'lastModifiedTime', name: '修改时间', icon: '🕐', description: '记录最后修改时间' },
  { type: 'createdBy', name: '创建者', icon: '👤', description: '记录创建者' },
  { type: 'lastModifiedBy', name: '修改者', icon: '👤', description: '记录最后修改者' },
];

const FieldTypeSelectModalBase: ForwardRefRenderFunction<
  IFieldTypeSelectModalRef,
  IFieldTypeSelectModalProps
> = ({ onConfirm, onCancel }, ref) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [selectedType, setSelectedType] = useState<IFieldTypeModal>('singleLineText');
  const [fieldName, setFieldName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<IFormulaFieldConfigOptions | IRollupFieldConfigOptions | undefined>();
  const modalRef = useRef<HTMLDivElement>(null);
  const virtualFieldConfigRef = useRef<IVirtualFieldConfigRef>(null);

  useImperativeHandle(ref, () => ({
    show: (pos = { x: 100, y: 100 }, modalMode = 'create', initialData) => {
      setPosition(pos);
      setMode(modalMode);
      setSelectedType(initialData?.type || 'singleLineText');
      setFieldName(initialData?.name || '');
      setFieldOptions(initialData?.options);
      setIsCreating(false);
      setIsConfiguring(false);
      setVisible(true);
    },
    hide: () => {
      setVisible(false);
      setIsCreating(false);
      setIsConfiguring(false);
    },
  }));

  // 全局点击关闭菜单
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setVisible(false);
        onCancel?.();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
        onCancel?.();
      }
    };

    // 延迟添加监听器，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onCancel]);

  const handleTypeSelect = (type: IFieldTypeModal) => {
    setSelectedType(type);
    
    // 检查是否需要配置虚拟字段
    if (type === 'formula' || type === 'rollup') {
      setIsConfiguring(true);
      virtualFieldConfigRef.current?.show(type, fieldOptions);
    } else {
      setIsCreating(true);
    }
  };

  const handleBack = () => {
    setIsCreating(false);
    setIsConfiguring(false);
  };

  const handleVirtualFieldConfigConfirm = (options: IFormulaFieldConfigOptions | IRollupFieldConfigOptions) => {
    setFieldOptions(options);
    setIsConfiguring(false);
    setIsCreating(true);
  };

  const handleVirtualFieldConfigCancel = () => {
    setIsConfiguring(false);
    setIsCreating(false);
  };

  const handleConfirm = () => {
    if (fieldName.trim()) {
      onConfirm?.({ 
        type: selectedType, 
        name: fieldName.trim(),
        options: fieldOptions
      });
      setVisible(false);
    }
  };

  const handleCancel = () => {
    setVisible(false);
    onCancel?.();
  };

  const getSelectedTypeInfo = () => {
    const allTypes = [...BASE_FIELD_TYPES, ...ADVANCED_FIELD_TYPES, ...SYSTEM_FIELD_TYPES];
    return allTypes.find(t => t.type === selectedType) || BASE_FIELD_TYPES[0];
  };

  if (!visible) return null;

  // 如果正在配置虚拟字段，显示配置组件
  if (isConfiguring) {
    return (
      <VirtualFieldConfig
        ref={virtualFieldConfigRef}
        onConfirm={handleVirtualFieldConfigConfirm}
        onCancel={handleVirtualFieldConfigCancel}
      />
    );
  }

  const selectedTypeInfo = getSelectedTypeInfo();

  return (
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        backgroundColor: 'white',
        border: '2px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        padding: '0',
        minWidth: '400px',
        maxWidth: '500px',
        width: 'max-content',
        zIndex: 10000,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 头部 */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 600, 
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {isCreating && (
              <button
                onClick={handleBack}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  color: '#6b7280',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                ←
              </button>
            )}
            {mode === 'create' ? '添加字段' : '编辑字段'}
          </h3>
          {!isCreating && (
            <p style={{ 
              margin: '4px 0 0', 
              fontSize: '14px', 
              color: '#6b7280' 
            }}>
              选择字段类型
            </p>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ padding: '16px 24px' }}>
        {!isCreating ? (
          // 字段类型选择
          <div>
            {/* 基础字段类型 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                margin: '0 0 12px', 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#374151' 
              }}>
                基础字段
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '8px' 
              }}>
                {BASE_FIELD_TYPES.map((fieldType) => (
                  <button
                    key={fieldType.type}
                    onClick={() => handleTypeSelect(fieldType.type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{fieldType.icon}</span>
                    <div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 500, 
                        color: '#111827',
                        marginBottom: '2px'
                      }}>
                        {fieldType.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280' 
                      }}>
                        {fieldType.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 高级字段类型 */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                margin: '0 0 12px', 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#374151' 
              }}>
                高级字段
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '8px' 
              }}>
                {ADVANCED_FIELD_TYPES.map((fieldType) => (
                  <button
                    key={fieldType.type}
                    onClick={() => handleTypeSelect(fieldType.type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{fieldType.icon}</span>
                    <div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 500, 
                        color: '#111827',
                        marginBottom: '2px'
                      }}>
                        {fieldType.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280' 
                      }}>
                        {fieldType.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 系统字段类型 */}
            <div>
              <h4 style={{ 
                margin: '0 0 12px', 
                fontSize: '14px', 
                fontWeight: 600, 
                color: '#374151' 
              }}>
                系统字段
              </h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '8px' 
              }}>
                {SYSTEM_FIELD_TYPES.map((fieldType) => (
                  <button
                    key={fieldType.type}
                    onClick={() => handleTypeSelect(fieldType.type)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3b82f6';
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.backgroundColor = 'white';
                    }}
                  >
                    <span style={{ fontSize: '20px' }}>{fieldType.icon}</span>
                    <div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 500, 
                        color: '#111827',
                        marginBottom: '2px'
                      }}>
                        {fieldType.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#6b7280' 
                      }}>
                        {fieldType.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // 字段名称输入
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontSize: '14px', 
                fontWeight: 500,
                color: '#374151'
              }}>
                字段名称
              </label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="请输入字段名称"
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
              />
            </div>

            <div style={{
              padding: '12px',
              backgroundColor: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: 500, 
                color: '#374151',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>{selectedTypeInfo.icon}</span>
                {selectedTypeInfo.name}
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280',
                marginBottom: '4px'
              }}>
                {selectedTypeInfo.description}
              </div>
              {fieldOptions && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: '#e0f2fe',
                  borderRadius: '4px',
                  border: '1px solid #0ea5e9',
                }}>
                  <div style={{ 
                    fontSize: '12px', 
                    fontWeight: 500,
                    color: '#0c4a6e',
                    marginBottom: '2px'
                  }}>
                    配置信息
                  </div>
                  <div style={{ 
                    fontSize: '11px', 
                    color: '#075985',
                    fontFamily: 'monospace',
                    wordBreak: 'break-all'
                  }}>
                    {fieldOptions.expression}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div style={{
        padding: '16px 24px 20px',
        borderTop: '1px solid #f3f4f6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <button
          onClick={handleCancel}
          style={{
            padding: '8px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: 'white',
            color: '#374151',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#f9fafb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          取消
        </button>
        {isCreating && (
          <button
            onClick={handleConfirm}
            disabled={!fieldName.trim()}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              background: fieldName.trim() ? '#3b82f6' : '#d1d5db',
              color: fieldName.trim() ? 'white' : '#9ca3af',
              fontSize: '14px',
              cursor: fieldName.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (fieldName.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb';
              }
            }}
            onMouseLeave={(e) => {
              if (fieldName.trim()) {
                e.currentTarget.style.backgroundColor = '#3b82f6';
              }
            }}
          >
            确认
          </button>
        )}
      </div>
    </div>
  );
};

export const FieldTypeSelectModal = forwardRef(FieldTypeSelectModalBase);
