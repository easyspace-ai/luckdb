/**
 * Filter System Tests
 */

import { describe, it, expect } from 'vitest';
import { FilterManager } from '@/model/filter/FilterManager';
import { TextField } from '@/model/field/TextField';
import { NumberField } from '@/model/field/NumberField';
import { SelectField } from '@/model/field/SelectField';
import { Record } from '@/model/record/Record';

describe('Filter System', () => {
  const fields = [
    new TextField({ id: 'name', name: 'Name', type: 'text' }),
    new NumberField({ id: 'age', name: 'Age', type: 'number' }),
    new SelectField({
      id: 'status',
      name: 'Status',
      type: 'singleSelect',
      options: {
        choices: [
          { id: 'active', name: 'Active', color: 'green' },
          { id: 'inactive', name: 'Inactive', color: 'gray' },
        ],
      },
    }),
  ];

  const records = [
    new Record({
      id: '1',
      fields: { name: 'Alice', age: 25, status: 'active' },
      createdTime: new Date().toISOString(),
    }),
    new Record({
      id: '2',
      fields: { name: 'Bob', age: 30, status: 'inactive' },
      createdTime: new Date().toISOString(),
    }),
    new Record({
      id: '3',
      fields: { name: 'Charlie', age: 35, status: 'active' },
      createdTime: new Date().toISOString(),
    }),
  ];

  it('should filter by text contains', () => {
    const manager = new FilterManager(
      {
        conjunction: 'and',
        filters: [
          {
            id: 'filter1',
            fieldId: 'name',
            config: { operator: 'contains', value: 'ali' },
          },
        ],
      },
      fields
    );

    const filtered = manager.filter(records);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('1');
  });

  it('should filter by number greater than', () => {
    const manager = new FilterManager(
      {
        conjunction: 'and',
        filters: [
          {
            id: 'filter1',
            fieldId: 'age',
            config: { operator: 'greaterThan', value: 28 },
          },
        ],
      },
      fields
    );

    const filtered = manager.filter(records);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(r => r.id)).toEqual(['2', '3']);
  });

  it('should filter by select value', () => {
    const manager = new FilterManager(
      {
        conjunction: 'and',
        filters: [
          {
            id: 'filter1',
            fieldId: 'status',
            config: { operator: 'is', value: 'active' },
          },
        ],
      },
      fields
    );

    const filtered = manager.filter(records);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(r => r.id)).toEqual(['1', '3']);
  });

  it('should combine filters with AND', () => {
    const manager = new FilterManager(
      {
        conjunction: 'and',
        filters: [
          {
            id: 'filter1',
            fieldId: 'status',
            config: { operator: 'is', value: 'active' },
          },
          {
            id: 'filter2',
            fieldId: 'age',
            config: { operator: 'greaterThan', value: 30 },
          },
        ],
      },
      fields
    );

    const filtered = manager.filter(records);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('3');
  });

  it('should combine filters with OR', () => {
    const manager = new FilterManager(
      {
        conjunction: 'or',
        filters: [
          {
            id: 'filter1',
            fieldId: 'name',
            config: { operator: 'is', value: 'Alice' },
          },
          {
            id: 'filter2',
            fieldId: 'name',
            config: { operator: 'is', value: 'Charlie' },
          },
        ],
      },
      fields
    );

    const filtered = manager.filter(records);
    expect(filtered).toHaveLength(2);
    expect(filtered.map(r => r.id)).toEqual(['1', '3']);
  });
});

