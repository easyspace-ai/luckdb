import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { ForwardRefRenderFunction } from 'react';
import type { IUserCell } from '../../renderers/cell-renderer/interface';
import type { IEditorProps, IEditorRef } from '../editors/EditorContainer';
import { Input } from '../../../ui';

const UserEditorBase: ForwardRefRenderFunction<IEditorRef<IUserCell>, IEditorProps<IUserCell>> = (
  props,
  ref
) => {
  const { cell, style, onChange, isEditing } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(cell.data);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    setValue: (data: IUserCell['data']) => setValue(data),
    saveValue: () => {
      if (!isEditing) return;
      onChange?.(value?.length ? value : null);
    },
  }));

  // 简化版：仅支持以逗号分隔的“名称”快速编辑和清空
  const display = (value || []).map((u) => u.name || u.id).join(', ');

  const onBlur = () => {
    const items = (inputRef.current?.value || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name, idx) => ({ id: `${idx}`, name }));
    setValue(items.length ? items : []);
    onChange?.(items.length ? items : null);
  };

  return (
    <div className="rounded-sm border p-2 shadow-sm" style={style}>
      <Input ref={inputRef} defaultValue={display} placeholder="输入用户，逗号分隔" onBlur={onBlur} />
    </div>
  );
};

export const UserEditor = forwardRef(UserEditorBase);


