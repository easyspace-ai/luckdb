/**
 * 编辑器覆盖层组件
 */

import React, { useEffect, useRef, useState } from 'react';
import type { IEditorState, IEditorCallbacks } from '../../core/editors/types';

export interface EditorOverlayProps {
  editorState: IEditorState | null;
  callbacks: IEditorCallbacks;
  editor?: React.ComponentType<EditorComponentProps>;
}

export interface EditorComponentProps {
  value: unknown;
  onChange: (value: unknown) => void;
  onSave: () => void;
  onCancel: () => void;
  autoFocus?: boolean;
  selectAllOnFocus?: boolean;
}

/**
 * 默认文本编辑器组件
 */
export const DefaultTextEditor: React.FC<EditorComponentProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  autoFocus = true,
  selectAllOnFocus = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      if (selectAllOnFocus) {
        inputRef.current.select();
      }
    }
  }, [autoFocus, selectAllOnFocus]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onSave}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        outline: 'none',
        padding: '0 8px',
        fontSize: '13px',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: 'transparent',
      }}
    />
  );
};

/**
 * 编辑器覆盖层
 */
export const EditorOverlay: React.FC<EditorOverlayProps> = ({
  editorState,
  callbacks,
  editor: CustomEditor = DefaultTextEditor,
}) => {
  const [value, setValue] = useState<unknown>(editorState?.value);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(editorState?.value);
  }, [editorState]);

  // 点击外部关闭
  useEffect(() => {
    if (!editorState?.isEditing) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        handleSave();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [editorState?.isEditing, value]);

  const handleChange = (newValue: unknown) => {
    setValue(newValue);
    callbacks.onChange?.(newValue);
  };

  const handleSave = () => {
    callbacks.onSave?.(value);
    callbacks.onClose?.();
  };

  const handleCancel = () => {
    callbacks.onCancel?.();
    callbacks.onClose?.();
  };

  if (!editorState || !editorState.isEditing) {
    return null;
  }

  const { position } = editorState;

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height,
        backgroundColor: '#ffffff',
        border: '2px solid #3b82f6',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        boxSizing: 'border-box',
      }}
      onKeyDown={(e) => {
        if (e.key === 'Tab') {
          e.preventDefault();
          const direction = e.shiftKey ? 'prev' : 'next';
          callbacks.onSave?.(value);
          callbacks.onClose?.();
          callbacks.onTabNavigate?.(direction);
        }
      }}
    >
      <CustomEditor
        value={value}
        onChange={handleChange}
        onSave={handleSave}
        onCancel={handleCancel}
        autoFocus={true}
        selectAllOnFocus={true}
      />
    </div>
  );
};
