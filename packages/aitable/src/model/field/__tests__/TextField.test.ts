/**
 * TextField 单元测试
 */
// @ts-nocheck
import { describe, it, expect, beforeEach } from 'vitest';
import { TextField } from '../TextField';
import { FIELD_TYPES } from '../../../types/core/field-types';

describe('TextField', () => {
  let field: TextField;

  beforeEach(() => {
    field = new TextField({
      id: 'fld1',
      name: 'Title',
      type: FIELD_TYPES.SingleLineText as any,
      tableId: 'tbl1',
      options: {},
      isComputed: false,
      isPrimary: false,
    });
  });

  describe('验证', () => {
    it('应该接受字符串值', () => {
      const result = field.validate('Hello');
      expect(result).toBe(true);
    });

    it('应该接受空字符串', () => {
      const result = field.validate('');
      expect(result).toBe(true);
    });
  });

  describe('格式化', () => {
    it('应该格式化字符串', () => {
      const formatted = field.format('Test');
      expect(formatted).toBe('Test');
    });

    it('应该处理null值', () => {
      const formatted = field.format(null as any);
      expect(formatted).toBe('');
    });
  });

  describe('单元格值转换', () => {
    it('应该转换为单元格值', () => {
      const cellValue = field.toCellValue('Hello');
      expect(cellValue).toBe('Hello');
    });

    it('应该转换null为null', () => {
      const cellValue = field.toCellValue(null);
      expect(cellValue).toBe(null);
    });

    it('应该从单元格值转换', () => {
      const value = field.fromCellValue('World');
      expect(value).toBe('World');
    });
  });
});

