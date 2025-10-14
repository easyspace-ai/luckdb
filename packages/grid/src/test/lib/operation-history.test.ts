/**
 * Operation History Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OperationHistory } from '@/lib/operation-history';

describe('OperationHistory', () => {
  let history: OperationHistory;

  beforeEach(() => {
    history = new OperationHistory({ autoSave: false });
  });

  it('should add operations to history', () => {
    history.push({
      operation: {
        type: 'replace',
        path: ['field1'],
        value: 'new',
        oldValue: 'old',
      },
      description: 'Updated field1',
    });

    expect(history.getHistory()).toHaveLength(1);
  });

  it('should undo operations', () => {
    history.push({
      operation: {
        type: 'replace',
        path: ['field1'],
        value: 'new',
        oldValue: 'old',
      },
      description: 'Updated field1',
    });

    expect(history.canUndo()).toBe(true);
    const undone = history.undo();
    expect(undone).not.toBeNull();
    expect(history.canUndo()).toBe(false);
  });

  it('should redo operations', () => {
    history.push({
      operation: {
        type: 'replace',
        path: ['field1'],
        value: 'new',
        oldValue: 'old',
      },
      description: 'Updated field1',
    });

    history.undo();
    expect(history.canRedo()).toBe(true);
    
    const redone = history.redo();
    expect(redone).not.toBeNull();
    expect(history.canRedo()).toBe(false);
  });

  it('should clear history after new operation when not at end', () => {
    history.push({
      operation: {
        type: 'replace',
        path: ['field1'],
        value: 'v1',
        oldValue: 'v0',
      },
      description: 'Op 1',
    });

    history.push({
      operation: {
        type: 'replace',
        path: ['field1'],
        value: 'v2',
        oldValue: 'v1',
      },
      description: 'Op 2',
    });

    history.undo(); // Back to v1
    
    history.push({
      operation: {
        type: 'replace',
        path: ['field1'],
        value: 'v3',
        oldValue: 'v1',
      },
      description: 'Op 3',
    });

    expect(history.getHistory()).toHaveLength(2);
    expect(history.canRedo()).toBe(false);
  });

  it('should limit history size', () => {
    const limitedHistory = new OperationHistory({ maxSize: 3, autoSave: false });

    for (let i = 0; i < 5; i++) {
      limitedHistory.push({
        operation: {
          type: 'replace',
          path: ['field1'],
          value: `v${i}`,
          oldValue: `v${i - 1}`,
        },
        description: `Op ${i}`,
      });
    }

    expect(limitedHistory.getHistory()).toHaveLength(3);
  });

  it('should filter history by record', () => {
    history.push({
      operation: {
        type: 'replace',
        path: ['field1'],
        value: 'new',
        oldValue: 'old',
      },
      description: 'Op 1',
      recordId: 'record1',
    });

    history.push({
      operation: {
        type: 'replace',
        path: ['field1'],
        value: 'new',
        oldValue: 'old',
      },
      description: 'Op 2',
      recordId: 'record2',
    });

    const record1History = history.getRecordHistory('record1');
    expect(record1History).toHaveLength(1);
    expect(record1History[0].recordId).toBe('record1');
  });
});

