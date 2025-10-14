import { Input } from '../../../ui';
import type { ChangeEvent, ForwardRefRenderFunction, KeyboardEvent, RefObject } from 'react';
import { useState, useRef, useImperativeHandle, forwardRef, useMemo } from 'react';
import { Key } from 'ts-keycode-enum';
import { GRID_DEFAULT } from '@/grid/configs';
import type { ILinkCell } from '@/grid/renderers';
import { CellType } from '@/grid/renderers';
import type { IEditorRef, IEditorProps } from '../editors/EditorContainer';

const { rowHeight: defaultRowHeight } = GRID_DEFAULT;

const LinkEditorBase: ForwardRefRenderFunction<
  IEditorRef<ILinkCell>,
  IEditorProps<ILinkCell>
> = (props, ref) => {
  const { cell, rect, style, theme, isEditing, onChange } = props;
  const { cellLineColorActived } = theme;
  const { width, height } = rect;
  const { displayData } = cell;
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValueInner] = useState(displayData);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    setValue: (value: string | null | undefined) => setValueInner(String(value ?? '')),
    saveValue,
  }));

  const saveValue = () => {
    if (value === displayData || !isEditing) return;
    // 验证 URL 格式
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (value && !urlPattern.test(value)) {
      // 如果不是有效 URL，添加 https:// 前缀
      const url = value.startsWith('http') ? value : `https://${value}`;
      onChange?.(url);
    } else {
      onChange?.(value);
    }
  };

  const onChangeInner = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValueInner(value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const { keyCode } = event;
    if (keyCode === Key.Enter) {
      event.preventDefault();
      saveValue();
    }
  };

  const attachStyle = useMemo(() => {
    const style: React.CSSProperties = {
      width: width,
      minHeight: height,
      height: height,
      boxSizing: 'border-box',
      textAlign: 'left',
    };
    if (height > defaultRowHeight) {
      style.paddingBottom = height - defaultRowHeight;
    }
    return style;
  }, [height, width]);

  return (
    <Input
      ref={inputRef as RefObject<HTMLInputElement>}
      style={{
        border: `2px solid ${cellLineColorActived}`,
        ...style,
        ...attachStyle,
      }}
      value={value}
      className="cursor-text border-2 px-2 text-[13px] shadow-none focus-visible:ring-transparent bg-background"
      onChange={onChangeInner}
      onBlur={saveValue}
      onKeyDown={onKeyDown}
      onMouseDown={(e) => e.stopPropagation()}
      placeholder="输入链接地址 (例如: example.com)"
    />
  );
};

export const LinkEditor = forwardRef(LinkEditorBase);
