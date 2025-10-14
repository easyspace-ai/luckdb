/**
 * Expand Record Component
 * 记录展开视图
 */

import { FC, useState, useCallback } from 'react';
import type { Record } from '@/model/record/Record';
import type { Field } from '@/model/field/Field';
import { RecordEditor } from './RecordEditor';
import { RecordHistory } from './RecordHistory';
import { CommentPanel } from '../comment/CommentPanel';

export interface IExpandRecordProps {
  record: Record;
  fields: Field[];
  onClose: () => void;
  onUpdate: (recordId: string, updates: { [key: string]: unknown }) => Promise<void>;
  onDelete?: (recordId: string) => Promise<void>;
  readOnly?: boolean;
}

type TabType = 'edit' | 'history' | 'comments';

export const ExpandRecord: FC<IExpandRecordProps> = ({
  record,
  fields,
  onClose,
  onUpdate,
  onDelete,
  readOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('edit');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    
    const confirmed = window.confirm('确定要删除此记录吗？');
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(record.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert('删除记录失败');
    } finally {
      setIsDeleting(false);
    }
  }, [record.id, onDelete, onClose]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">记录详情</h2>
          <div className="flex items-center gap-2">
            {!readOnly && onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                {isDeleting ? '删除中...' : '删除'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-2 ${
              activeTab === 'edit'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            编辑
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 ${
              activeTab === 'history'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            历史
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`px-4 py-2 ${
              activeTab === 'comments'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            评论
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'edit' && (
            <RecordEditor
              record={record}
              fields={fields}
              onUpdate={onUpdate}
              readOnly={readOnly}
            />
          )}
          {activeTab === 'history' && (
            <RecordHistory recordId={record.id} />
          )}
          {activeTab === 'comments' && (
            <CommentPanel recordId={record.id} />
          )}
        </div>
      </div>
    </div>
  );
};

