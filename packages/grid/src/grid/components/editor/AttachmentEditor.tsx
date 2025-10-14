import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import type { ForwardRefRenderFunction } from 'react';
import type { IEditorRef } from '../editors/EditorContainer';
import type { IEditorProps } from '../editors/EditorContainer';
import type { IAttachmentCell } from '../../renderers/cell-renderer/interface';
import { Input } from '../../../ui';

// 附件编辑器：支持文件上传和文件链接编辑
const AttachmentEditorBase: ForwardRefRenderFunction<IEditorRef<IAttachmentCell>, IEditorProps<IAttachmentCell>> = (
  props,
  ref
) => {
  const { cell, style, onChange, isEditing } = props;
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(String(cell.data ?? ''));

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    setValue: (data: IAttachmentCell['data']) => setValue(String(data ?? '')),
    saveValue: () => {
      if (!isEditing) return;
      onChange?.(value || null);
    },
  }));

  const onBlur = () => {
    onChange?.(value || null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 模拟文件上传，实际项目中应该调用上传 API
      const fileName = file.name;
      setValue(fileName);
      onChange?.(fileName);
    }
  };

  return (
    <div className="rounded-sm border p-2 shadow-sm" style={style}>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
          onBlur={onBlur}
          placeholder="输入文件链接或上传文件"
          className="flex-1"
        />
        <input
          type="file"
          onChange={handleFileUpload}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer rounded-md border border-input bg-background px-3 py-1 text-sm hover:bg-accent hover:text-accent-foreground"
        >
          上传
        </label>
      </div>
    </div>
  );
};

export const AttachmentEditor = forwardRef(AttachmentEditorBase);
