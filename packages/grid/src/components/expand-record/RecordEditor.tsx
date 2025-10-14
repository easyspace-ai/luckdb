/**
 * Record Editor Component
 * 记录编辑器
 */

import { FC, useState, useCallback } from 'react';
import type { Record } from '@/model/record/Record';
import type { Field } from '@/model/field/Field';
import { TextEditor } from '@/grid/components/editors/basic/TextEditor';
import { BooleanEditor } from '@/grid/components/editors/basic/BooleanEditor';
import { SelectEditor } from '@/grid/components/editors/enhanced/SelectEditor';
import { DateEditor } from '@/grid/components/editors/enhanced/DateEditor';
import { NumberEditor } from '@/grid/components/editors/enhanced/NumberEditor';
import { RatingEditor } from '@/grid/components/editors/enhanced/RatingEditor';
import { AttachmentEditor } from '@/grid/components/editors/enhanced/AttachmentEditor';
import { LinkEditor } from '@/grid/components/editors/enhanced/LinkEditor';
import { UserEditor } from '@/grid/components/editors/enhanced/UserEditor';

export interface IRecordEditorProps {
  record: Record;
  fields: Field[];
  onUpdate: (recordId: string, updates: { [key: string]: unknown }) => Promise<void>;
  readOnly?: boolean;
}

export const RecordEditor: FC<IRecordEditorProps> = ({
  record,
  fields,
  onUpdate,
  readOnly = false,
}) => {
  const [pendingUpdates, setPendingUpdates] = useState<{ [key: string]: unknown }>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleFieldChange = useCallback((fieldId: string, value: unknown) => {
    setPendingUpdates(prev => ({
      ...prev,
      [fieldId]: value,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (Object.keys(pendingUpdates).length === 0) return;

    setIsSaving(true);
    try {
      await onUpdate(record.id, pendingUpdates);
      setPendingUpdates({});
    } catch (error) {
      console.error('Failed to save record:', error);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  }, [record.id, pendingUpdates, onUpdate]);

  const handleCancel = useCallback(() => {
    setPendingUpdates({});
  }, []);

  const renderFieldEditor = (field: Field) => {
    const value = pendingUpdates[field.id] ?? record.getCellValue(field.id);
    const isLocked = record.isLocked(field.id);
    const disabled = readOnly || isLocked;

    const onChange = (newValue: unknown) => handleFieldChange(field.id, newValue);

    switch (field.type) {
      case 'text':
      case 'longText':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <TextEditor
            value={String(value || '')}
            onChange={onChange}
            disabled={disabled}
          />
        );

      case 'number':
      case 'currency':
      case 'percent':
        return (
          <NumberEditor
            value={value as number}
            onChange={onChange}
            field={field}
            disabled={disabled}
          />
        );

      case 'boolean':
      case 'checkbox':
        return (
          <BooleanEditor
            value={Boolean(value)}
            onChange={onChange}
            disabled={disabled}
          />
        );

      case 'singleSelect':
      case 'multipleSelect':
        return (
          <SelectEditor
            value={value}
            onChange={onChange}
            field={field}
            disabled={disabled}
          />
        );

      case 'date':
      case 'dateTime':
        return (
          <DateEditor
            value={value as string}
            onChange={onChange}
            field={field}
            disabled={disabled}
          />
        );

      case 'rating':
        return (
          <RatingEditor
            value={value as number}
            onChange={onChange}
            field={field}
            disabled={disabled}
          />
        );

      case 'attachment':
        return (
          <AttachmentEditor
            value={value}
            onChange={onChange}
            field={field}
            disabled={disabled}
          />
        );

      case 'link':
        return (
          <LinkEditor
            value={value}
            onChange={onChange}
            field={field}
            disabled={disabled}
          />
        );

      case 'user':
      case 'createdBy':
      case 'lastModifiedBy':
        return (
          <UserEditor
            value={value}
            onChange={onChange}
            field={field}
            disabled={disabled}
          />
        );

      case 'formula':
      case 'rollup':
        return (
          <div className="text-gray-500">
            {String(value || '计算中...')}
          </div>
        );

      default:
        return (
          <TextEditor
            value={String(value || '')}
            onChange={onChange}
            disabled={disabled}
          />
        );
    }
  };

  const hasChanges = Object.keys(pendingUpdates).length > 0;

  return (
    <div className="space-y-4">
      {/* Fields */}
      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.name}
              {record.isLocked(field.id) && (
                <span className="ml-2 text-xs text-gray-500">(锁定)</span>
              )}
            </label>
            <div className="w-full">
              {renderFieldEditor(field)}
            </div>
            {field.description && (
              <p className="text-xs text-gray-500">{field.description}</p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      {!readOnly && hasChanges && (
        <div className="sticky bottom-0 bg-white border-t pt-4 mt-4 flex gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSaving ? '保存中...' : '保存更改'}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
};

