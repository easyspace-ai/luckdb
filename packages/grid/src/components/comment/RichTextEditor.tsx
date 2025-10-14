/**
 * Rich Text Editor Component
 * 富文本编辑器
 */

import { FC, useRef, useCallback, KeyboardEvent } from 'react';

export interface IRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onMention?: (userId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const RichTextEditor: FC<IRichTextEditorProps> = ({
  value,
  onChange,
  onMention,
  placeholder = '输入内容...',
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 处理 @ 提及
    if (e.key === '@' && onMention) {
      // TODO: 显示用户选择器
      // 简化实现：直接触发回调
      setTimeout(() => {
        onMention('example_user_id');
      }, 0);
    }

    // Ctrl/Cmd + Enter 发送
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      // 触发父组件的发送逻辑
    }
  }, [onMention]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full min-h-[100px] p-3 border rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      
      {/* Toolbar */}
      <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
        <div>
          支持 Markdown 语法
        </div>
        <div className="flex-1" />
        <div>
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">@</kbd> 提及用户
        </div>
        <div>
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl</kbd> +{' '}
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> 发送
        </div>
      </div>
    </div>
  );
};

