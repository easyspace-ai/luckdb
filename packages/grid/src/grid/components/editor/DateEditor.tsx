import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { ForwardRefRenderFunction } from 'react';
import type { IEditorRef } from '../editors/EditorContainer';
import type { IEditorProps } from '../editors/EditorContainer';
import type { ITextCell } from '../../renderers/cell-renderer/interface';
import { Input } from '../../../ui';

// 简化版日期编辑器：内部仍使用 TextCell 表达，外部由业务层将其映射为日期字段
const DateEditorBase: ForwardRefRenderFunction<IEditorRef<ITextCell>, IEditorProps<ITextCell>> = (
  props,
  ref
) => {
  const { cell, style, onChange, isEditing } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(String(cell.data ?? ''));

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    setValue: (data: ITextCell['data']) => setValue(String(data ?? '')),
    saveValue: () => {
      if (!isEditing) return;
      onChange?.(value || null);
    },
  }));

  const onBlur = () => {
    onChange?.(value || null);
  };

  return (
    <div className="rounded-sm border p-2 shadow-sm" style={style}>
      <Input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        onBlur={onBlur}
        placeholder="选择日期"
      />
    </div>
  );
};

export const DateEditor = forwardRef(DateEditorBase);


