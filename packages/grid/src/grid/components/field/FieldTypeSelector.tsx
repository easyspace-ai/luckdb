import { useMemo, useState } from 'react';
import type { ForwardRefRenderFunction } from 'react';
import { forwardRef, useImperativeHandle } from 'react';
import { CellType } from '../../renderers/cell-renderer/interface';
import { FieldType } from '../../../types/field';
import { getCellTypeFromFieldType, isReadonlyField } from '../../../utils/field-mapping';

export interface IFieldTypeInfo {
  fieldType: FieldType;
  cellType: CellType;
  name: string;
  description: string;
  icon: string;
  category: 'basic' | 'advanced' | 'system';
  isReadonly?: boolean;
}

export interface IFieldTypeSelectorRef {
  show: (position: { x: number; y: number }) => void;
  hide: () => void;
}

export interface IFieldTypeSelectorProps {
  onSelect?: (fieldTypeInfo: IFieldTypeInfo) => void;
  onCancel?: () => void;
  currentFieldType?: FieldType;
  onHoverStateChange?: (hovered: boolean) => void;
  showSystemFields?: boolean; // 是否显示系统字段（创建时间、修改人等）
}

// 完整的字段类型定义 - 与参考项目对齐
export const FIELD_TYPE_CONFIGS: IFieldTypeInfo[] = [
  // 基础字段类型
  { 
    fieldType: FieldType.SingleLineText, 
    cellType: CellType.Text, 
    name: '单行文本', 
    description: '输入简短文本', 
    icon: 'A',
    category: 'basic'
  },
  { 
    fieldType: FieldType.LongText, 
    cellType: CellType.Text, 
    name: '长文本', 
    description: '多行文本输入', 
    icon: '📝',
    category: 'basic'
  },
  { 
    fieldType: FieldType.Number, 
    cellType: CellType.Number, 
    name: '数字', 
    description: '数值输入与计算', 
    icon: '#',
    category: 'basic'
  },
  { 
    fieldType: FieldType.SingleSelect, 
    cellType: CellType.Select, 
    name: '单选', 
    description: '从选项中选择一个', 
    icon: '◯',
    category: 'basic'
  },
  { 
    fieldType: FieldType.MultipleSelect, 
    cellType: CellType.Select, 
    name: '多选', 
    description: '从选项中选择多个', 
    icon: '☑️',
    category: 'basic'
  },
  { 
    fieldType: FieldType.User, 
    cellType: CellType.User, 
    name: '用户', 
    description: '选择协作成员', 
    icon: '👤',
    category: 'basic'
  },
  { 
    fieldType: FieldType.Date, 
    cellType: CellType.Date, 
    name: '日期', 
    description: '日期和时间', 
    icon: '📅',
    category: 'basic'
  },
  { 
    fieldType: FieldType.Rating, 
    cellType: CellType.Rating, 
    name: '评分', 
    description: '星级评分', 
    icon: '⭐',
    category: 'basic'
  },
  { 
    fieldType: FieldType.Checkbox, 
    cellType: CellType.Boolean, 
    name: '勾选', 
    description: '是/否 勾选框', 
    icon: '✔︎',
    category: 'basic'
  },
  { 
    fieldType: FieldType.Attachment, 
    cellType: CellType.Attachment, 
    name: '附件', 
    description: '上传文件和图片', 
    icon: '📎',
    category: 'basic'
  },
  
  // 高级字段类型
  { 
    fieldType: FieldType.Link, 
    cellType: CellType.Link, 
    name: '关联', 
    description: '关联其他表记录', 
    icon: '🔗',
    category: 'advanced'
  },
  { 
    fieldType: FieldType.Formula, 
    cellType: CellType.Text, 
    name: '公式', 
    description: '使用公式自动计算', 
    icon: 'ƒ',
    category: 'advanced',
    isReadonly: true
  },
  { 
    fieldType: FieldType.Rollup, 
    cellType: CellType.Text, 
    name: '汇总', 
    description: '汇总关联记录的值', 
    icon: 'Σ',
    category: 'advanced',
    isReadonly: true
  },
  { 
    fieldType: FieldType.Button, 
    cellType: CellType.Button, 
    name: '按钮', 
    description: '触发自定义操作', 
    icon: '⏺',
    category: 'advanced'
  },
  
  // 系统字段类型
  { 
    fieldType: FieldType.CreatedTime, 
    cellType: CellType.Date, 
    name: '创建时间', 
    description: '自动记录创建时间', 
    icon: '🕒',
    category: 'system',
    isReadonly: true
  },
  { 
    fieldType: FieldType.LastModifiedTime, 
    cellType: CellType.Date, 
    name: '修改时间', 
    description: '自动记录修改时间', 
    icon: '🕘',
    category: 'system',
    isReadonly: true
  },
  { 
    fieldType: FieldType.CreatedBy, 
    cellType: CellType.User, 
    name: '创建人', 
    description: '自动记录创建者', 
    icon: '👤',
    category: 'system',
    isReadonly: true
  },
  { 
    fieldType: FieldType.LastModifiedBy, 
    cellType: CellType.User, 
    name: '修改人', 
    description: '自动记录修改者', 
    icon: '👥',
    category: 'system',
    isReadonly: true
  },
  { 
    fieldType: FieldType.AutoNumber, 
    cellType: CellType.Number, 
    name: '自增数字', 
    description: '自动递增的编号', 
    icon: '№',
    category: 'system',
    isReadonly: true
  },
];

const FieldTypeSelectorBase: ForwardRefRenderFunction<
  IFieldTypeSelectorRef,
  IFieldTypeSelectorProps
> = (props, ref) => {
  const { onSelect, onCancel, currentFieldType, onHoverStateChange, showSystemFields = true } = props;
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [keyword, setKeyword] = useState('');

  useImperativeHandle(ref, () => ({
    show: (pos: { x: number; y: number }) => {
      setPosition(pos);
      setIsVisible(true);
    },
    hide: () => {
      setIsVisible(false);
    },
  }));

  const handleSelect = (fieldTypeInfo: IFieldTypeInfo) => {
    onSelect?.(fieldTypeInfo);
    setIsVisible(false);
    setKeyword('');
  };

  const handleCancel = () => {
    onCancel?.();
    setIsVisible(false);
    setKeyword('');
  };

  // 过滤和分组字段类型
  const { basicFields, advancedFields, systemFields } = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    let fields = FIELD_TYPE_CONFIGS;
    
    // 根据设置过滤系统字段
    if (!showSystemFields) {
      fields = fields.filter(f => f.category !== 'system');
    }
    
    // 根据关键词过滤
    if (k) {
      fields = fields.filter(ft =>
        ft.name.toLowerCase().includes(k) || 
        ft.description.toLowerCase().includes(k) ||
        ft.fieldType.toLowerCase().includes(k)
      );
    }
    
    return {
      basicFields: fields.filter(f => f.category === 'basic'),
      advancedFields: fields.filter(f => f.category === 'advanced'),
      systemFields: fields.filter(f => f.category === 'system'),
    };
  }, [keyword, showSystemFields]);

  if (!isVisible) return null;

  const renderFieldGroup = (title: string, fields: IFieldTypeInfo[]) => {
    if (fields.length === 0) return null;
    
    return (
      <div className="mb-3">
        {!keyword && <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">{title}</div>}
        <div className="grid grid-cols-1 gap-y-2 px-3">
          {fields.map((fieldTypeInfo) => (
            <button
              key={fieldTypeInfo.fieldType}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all w-full ${
                currentFieldType === fieldTypeInfo.fieldType 
                  ? 'bg-blue-50 border-2 border-blue-500' 
                  : 'hover:bg-gray-50 border-2 border-transparent'
              }`}
              onClick={() => handleSelect(fieldTypeInfo)}
            >
              <span className="text-lg w-6 text-center shrink-0">{fieldTypeInfo.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-gray-900 truncate">
                  {fieldTypeInfo.name}
                  {fieldTypeInfo.isReadonly && <span className="ml-1 text-[10px] text-gray-400">(只读)</span>}
                </div>
                <div className="text-[11px] text-gray-500 truncate">{fieldTypeInfo.description}</div>
              </div>
              {currentFieldType === fieldTypeInfo.fieldType && (
                <span className="text-blue-600 text-sm shrink-0">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-2xl w-[400px]"
      style={{ 
        left: Math.min(position.x, window.innerWidth - 420), 
        top: Math.min(position.y, window.innerHeight - 500), 
        maxHeight: '480px'
      }}
      onMouseEnter={() => onHoverStateChange?.(true)}
      onMouseLeave={() => onHoverStateChange?.(false)}
    >
      <div className="sticky top-0 z-10 bg-white px-4 pt-4 pb-3 border-b border-gray-100 rounded-t-xl">
        <div className="text-base font-semibold text-gray-800 mb-3">选择字段类型</div>
        <div className="relative">
          <input
            className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="搜索字段类型..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            autoFocus
          />
          <span className="absolute left-3 top-3 text-gray-400 text-sm">🔍</span>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
        {renderFieldGroup('基础字段', basicFields)}
        {renderFieldGroup('高级字段', advancedFields)}
        {showSystemFields && renderFieldGroup('系统字段', systemFields)}
        
        {basicFields.length === 0 && advancedFields.length === 0 && systemFields.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-500">
            <div className="text-4xl mb-3">🔍</div>
            <div className="text-sm">未找到匹配的字段类型</div>
          </div>
        )}
      </div>

      <div className="sticky bottom-0 px-3 py-3 border-t border-gray-100 bg-white rounded-b-xl">
        <button
          className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md transition-colors font-medium"
          onClick={handleCancel}
        >
          取消
        </button>
      </div>
    </div>
  );
};

export const FieldTypeSelector = forwardRef(FieldTypeSelectorBase);
