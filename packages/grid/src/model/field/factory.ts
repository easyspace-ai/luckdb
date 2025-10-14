/**
 * Field Factory
 * Creates field instances based on field type
 */

import type { IField } from '@/api/types';
import { Field, type IFieldConfig } from './Field';
import { TextField } from './TextField';
import { NumberField } from './NumberField';
import { BooleanField } from './BooleanField';
import { SelectField } from './SelectField';
import { DateField } from './DateField';
import { RatingField } from './RatingField';
import { LinkField } from './LinkField';
import { UserField } from './UserField';
import { AttachmentField } from './AttachmentField';
import { FormulaField } from './FormulaField';
import { RollupField } from './RollupField';

export type IFieldInstance = Field;

/**
 * Create a field instance from field data
 */
export function createFieldInstance(field: IField): IFieldInstance {
  const config: IFieldConfig = {
    id: field.id,
    name: field.name,
    type: field.type,
    tableId: field.tableId,
    options: field.options,
    description: field.description,
    isComputed: field.isComputed,
    isPrimary: field.isPrimary,
    createdTime: field.createdTime,
    lastModifiedTime: field.lastModifiedTime,
  };

  switch (field.type) {
    case 'singleLineText':
    case 'longText':
      return new TextField(config);
    
    case 'number':
      return new NumberField(config);
    
    case 'checkbox':
      return new BooleanField(config);
    
    case 'singleSelect':
    case 'multipleSelect':
      return new SelectField(config);
    
    case 'date':
      return new DateField(config);
    
    case 'rating':
      return new RatingField(config);
    
    case 'link':
      return new LinkField(config);
    
    case 'user':
      return new UserField(config);
    
    case 'attachment':
      return new AttachmentField(config);
    
    case 'formula':
      return new FormulaField(config);
    
    case 'rollup':
    case 'count':
      return new RollupField(config);
    
    // Auto number and system fields - treat as text
    case 'autoNumber':
    case 'createdTime':
    case 'lastModifiedTime':
    case 'createdBy':
    case 'lastModifiedBy':
      return new TextField(config);
    
    case 'button':
      // Button fields are special, treated as text for now
      return new TextField(config);

    default:
      // Fallback to TextField for unknown types
      console.warn(`Unknown field type: ${field.type}, using TextField`);
      return new TextField(config);
  }
}

/**
 * Create multiple field instances
 */
export function createFieldInstances(fields: IField[]): IFieldInstance[] {
  return fields.map(createFieldInstance);
}

