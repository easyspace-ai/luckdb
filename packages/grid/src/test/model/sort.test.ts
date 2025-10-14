/**
 * Sort System Tests
 */

import { describe, it, expect } from 'vitest';
import { SortManager } from '@/model/sort/SortManager';
import { TextField } from '@/model/field/TextField';
import { NumberField } from '@/model/field/NumberField';
import { Record } from '@/model/record/Record';

describe('Sort System', () => {
  const fields = [
    new TextField({ id: 'name', name: 'Name', type: 'text' }),
    new NumberField({ id: 'age', name: 'Age', type: 'number' }),
  ];

  const records = [
    new Record({
      id: '1',
      fields: { name: 'Charlie', age: 35 },
      createdTime: new Date().toISOString(),
    }),
    new Record({
      id: '2',
      fields: { name: 'Alice', age: 25 },
      createdTime: new Date().toISOString(),
    }),
    new Record({
      id: '3',
      fields: { name: 'Bob', age: 30 },
      createdTime: new Date().toISOString(),
    }),
  ];

  it('should sort by text ascending', () => {
    const manager = new SortManager(
      [{ fieldId: 'name', direction: 'asc' }],
      fields
    );

    const sorted = manager.sort(records);
    expect(sorted.map(r => r.getCellValue('name'))).toEqual([
      'Alice',
      'Bob',
      'Charlie',
    ]);
  });

  it('should sort by text descending', () => {
    const manager = new SortManager(
      [{ fieldId: 'name', direction: 'desc' }],
      fields
    );

    const sorted = manager.sort(records);
    expect(sorted.map(r => r.getCellValue('name'))).toEqual([
      'Charlie',
      'Bob',
      'Alice',
    ]);
  });

  it('should sort by number ascending', () => {
    const manager = new SortManager(
      [{ fieldId: 'age', direction: 'asc' }],
      fields
    );

    const sorted = manager.sort(records);
    expect(sorted.map(r => r.getCellValue('age'))).toEqual([25, 30, 35]);
  });

  it('should sort by number descending', () => {
    const manager = new SortManager(
      [{ fieldId: 'age', direction: 'desc' }],
      fields
    );

    const sorted = manager.sort(records);
    expect(sorted.map(r => r.getCellValue('age'))).toEqual([35, 30, 25]);
  });

  it('should sort by multiple fields', () => {
    const recordsWithDuplicates = [
      new Record({
        id: '1',
        fields: { name: 'Alice', age: 30 },
        createdTime: new Date().toISOString(),
      }),
      new Record({
        id: '2',
        fields: { name: 'Alice', age: 25 },
        createdTime: new Date().toISOString(),
      }),
      new Record({
        id: '3',
        fields: { name: 'Bob', age: 35 },
        createdTime: new Date().toISOString(),
      }),
    ];

    const manager = new SortManager(
      [
        { fieldId: 'name', direction: 'asc' },
        { fieldId: 'age', direction: 'asc' },
      ],
      fields
    );

    const sorted = manager.sort(recordsWithDuplicates);
    expect(sorted.map(r => r.id)).toEqual(['2', '1', '3']);
  });
});

