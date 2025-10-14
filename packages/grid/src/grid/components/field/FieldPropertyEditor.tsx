import { useState, useEffect } from 'react';
import type { ForwardRefRenderFunction } from 'react';
import { forwardRef, useImperativeHandle } from 'react';
import type { IGridColumn } from '../../types/grid';
import type { CellType } from '../../renderers/cell-renderer/interface';
import { FieldTypeSelector, FIELD_TYPE_CONFIGS, type IFieldTypeSelectorRef } from '../field/FieldTypeSelector';
import { FieldType } from '../../../types/field';
import { useRef } from 'react';
import { Input } from '../../../ui';

export interface IFieldPropertyEditorRef {
  show: (column: IGridColumn, columnIndex: number, position?: { x: number; y: number; width?: number }) => void;
  hide: () => void;
}

export interface IFieldPropertyEditorProps {
  onSave?: (columnIndex: number, updatedColumn: IGridColumn) => void;
  onCancel?: () => void;
}

const FieldPropertyEditorBase: ForwardRefRenderFunction<
  IFieldPropertyEditorRef,
  IFieldPropertyEditorProps
> = (props, ref) => {
  const { onSave, onCancel } = props;
  const [isVisible, setIsVisible] = useState(false);
  const [columnIndex, setColumnIndex] = useState(-1);
  const [anchorPosition, setAnchorPosition] = useState<{ x: number; y: number; width?: number } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    width: 150,
    description: '',
    icon: '',
    isPrimary: false,
    customTheme: undefined,
    type: FieldType.SingleLineText as unknown as FieldType,
    required: false,
    defaultValue: '',
  });

  // 对齐新选择器配置集合（内部存储 FieldType）
  const fieldTypeOptions = FIELD_TYPE_CONFIGS.map((t) => ({ label: t.name, value: t.fieldType }));
  const fieldTypeSelectorRef = useRef<IFieldTypeSelectorRef>(null);
  const typeAnchorRef = useRef<HTMLDivElement | null>(null);

  const openTypeSelector = () => {
    const rect = typeAnchorRef.current?.getBoundingClientRect();
    // 定位到输入框右侧对齐，顶部对齐（类似下拉菜单）
    const x = (rect?.right ?? 0) + window.scrollX + 8; // 右侧略偏移
    const y = (rect?.top ?? 0) + window.scrollY; // 顶部对齐
    fieldTypeSelectorRef.current?.show({ x, y });
  };
  let hoverHideTimer: number | undefined;
  let isHoveringPanel = false;
  const safeOpen = () => {
    if (hoverHideTimer) {
      window.clearTimeout(hoverHideTimer);
      hoverHideTimer = undefined as unknown as number;
    }
    openTypeSelector();
  };
  const onTypeMouseEnter = () => safeOpen();
  const onTypeMouseLeave = () => {
    hoverHideTimer = window.setTimeout(() => {
      if (!isHoveringPanel) fieldTypeSelectorRef.current?.hide();
    }, 200);
  };

  useImperativeHandle(ref, () => ({
    show: (column: IGridColumn, colIndex: number, position?: { x: number; y: number; width?: number }) => {
      setColumnIndex(colIndex);
      setAnchorPosition(position ?? null);
      setFormData({
        name: column.name || '',
        width: column.width || 150,
        description: column.description || '',
        icon: column.icon || '',
        isPrimary: column.isPrimary || false,
        customTheme: column.customTheme,
        type: (column as any).type ?? (FieldType.SingleLineText as unknown as FieldType),
        required: false,
        defaultValue: '',
      });
      setIsVisible(true);
    },
    hide: () => {
      setIsVisible(false);
      setColumnIndex(-1);
      setAnchorPosition(null);
    },
  }));

  const handleSave = () => {
    if (columnIndex >= 0) {
      const updatedColumn: IGridColumn = {
        id: `col-${Date.now()}`, // 生成新的ID
        name: formData.name,
        width: formData.width,
        description: formData.description,
        icon: formData.icon,
        isPrimary: formData.isPrimary,
        customTheme: formData.customTheme,
      };
      // 扩展字段：类型、校验、默认值（暂存到扩展属性，后续接入后端时再对齐）
      (updatedColumn as any).type = formData.type as unknown as FieldType;
      (updatedColumn as any).required = formData.required;
      (updatedColumn as any).defaultValue = formData.defaultValue;
      onSave?.(columnIndex, updatedColumn);
    }
    setIsVisible(false);
  };

  const handleCancel = () => {
    onCancel?.();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  // 浮层容器样式：若传入 anchorPosition，则作为定位浮层；否则居中遮罩
  // 计算可用高度用于滚动（锚定模式）
  const availableHeight = anchorPosition
    ? Math.max(320, (typeof window !== 'undefined' ? window.innerHeight : 800) - (anchorPosition.y ?? 0) - 16)
    : undefined;

  return (
    <div
      className={anchorPosition ? 'fixed z-50' : 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'}
      style={anchorPosition ? { left: (anchorPosition.x ?? 0), top: (anchorPosition.y ?? 0), right: 0 } : undefined}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-[520px] overflow-y-auto pointer-events-auto"
        style={anchorPosition
          ? { width: anchorPosition.width ?? 520, maxHeight: availableHeight }
          : { maxHeight: '80vh' }
        }
      >
        <h3 className="text-lg font-semibold mb-4">添加字段</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              字段名称
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="输入字段名称"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">字段类型</label>
            <div
              ref={typeAnchorRef}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white cursor-pointer flex items-center justify-between hover:border-gray-400"
              onClick={openTypeSelector}
              onMouseEnter={onTypeMouseEnter}
              onMouseLeave={onTypeMouseLeave}
            >
              <span className="text-sm text-gray-900">
                {fieldTypeOptions.find(o => (o.value as unknown as string) === (formData.type as unknown as string))?.label ?? '选择类型'}
              </span>
              <span className="text-gray-400">▾</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              列宽 (像素)
            </label>
            <Input
              type="number"
              value={formData.width}
              onChange={(e) => setFormData(prev => ({ ...prev, width: parseInt(e.target.value) || 150 }))}
              min="50"
              max="500"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="输入字段描述"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">禁止空值</label>
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.required}
                onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
              />
              <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              默认值
            </label>
            <Input
              value={formData.defaultValue}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultValue: e.target.value }))}
              placeholder="可选，设置默认值"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              图标
            </label>
            <Input
              value={formData.icon}
              onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
              placeholder="输入图标名称"
              className="w-full"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPrimary"
              checked={formData.isPrimary}
              onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
              className="mr-2"
            />
            <label htmlFor="isPrimary" className="text-sm font-medium text-gray-700">
              设为主字段
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
      <FieldTypeSelector
        ref={fieldTypeSelectorRef}
        currentFieldType={undefined}
        onSelect={(ft) => setFormData(prev => ({ ...prev, type: ft.fieldType as unknown as FieldType }))}
        onCancel={() => undefined}
        onHoverStateChange={(hovered) => {
          isHoveringPanel = hovered;
          if (hovered) safeOpen();
          if (!hovered && hoverHideTimer == null) {
            // when cursor leaves panel and anchor, hide quickly
            fieldTypeSelectorRef.current?.hide();
          }
        }}
      />
    </div>
  );
};

export const FieldPropertyEditor = forwardRef(FieldPropertyEditorBase);
