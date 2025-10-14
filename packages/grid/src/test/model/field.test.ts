/**
 * Field Model Tests
 */

import { describe, it, expect } from 'vitest';
import { TextField } from '@/model/field/TextField';
import { NumberField } from '@/model/field/NumberField';
import { SelectField } from '@/model/field/SelectField';
import { DateField } from '@/model/field/DateField';
import { RatingField } from '@/model/field/RatingField';

describe('Field Models', () => {
  describe('TextField', () => {
    it('should create a text field', () => {
      const field = new TextField({
        id: 'field1',
        name: 'Name',
        type: 'text',
      });

      expect(field.id).toBe('field1');
      expect(field.name).toBe('Name');
      expect(field.type).toBe('text');
    });

    it('should validate text values', () => {
      const field = new TextField({
        id: 'field1',
        name: 'Name',
        type: 'text',
      });

      expect(field.validate('test')).toBe(true);
      expect(field.validate('')).toBe(true);
      expect(field.validate(null)).toBe(true);
    });

    it('should format text values', () => {
      const field = new TextField({
        id: 'field1',
        name: 'Name',
        type: 'text',
      });

      expect(field.format('test')).toBe('test');
      expect(field.format(null)).toBe('');
    });
  });

  describe('NumberField', () => {
    it('should create a number field', () => {
      const field = new NumberField({
        id: 'field1',
        name: 'Price',
        type: 'number',
        options: {
          precision: 2,
        },
      });

      expect(field.id).toBe('field1');
      expect(field.type).toBe('number');
    });

    it('should validate number values', () => {
      const field = new NumberField({
        id: 'field1',
        name: 'Price',
        type: 'number',
      });

      expect(field.validate(10)).toBe(true);
      expect(field.validate(10.5)).toBe(true);
      expect(field.validate('not a number')).toBe(false);
    });

    it('should format number values', () => {
      const field = new NumberField({
        id: 'field1',
        name: 'Price',
        type: 'number',
        options: {
          precision: 2,
        },
      });

      expect(field.format(10)).toBe('10.00');
      expect(field.format(10.555)).toBe('10.56');
    });
  });

  describe('SelectField', () => {
    it('should create a select field', () => {
      const field = new SelectField({
        id: 'field1',
        name: 'Status',
        type: 'singleSelect',
        options: {
          choices: [
            { id: '1', name: 'Active', color: 'blue' },
            { id: '2', name: 'Inactive', color: 'gray' },
          ],
        },
      });

      expect(field.id).toBe('field1');
      expect(field.type).toBe('singleSelect');
      expect(field.getOptions().choices).toHaveLength(2);
    });

    it('should validate select values', () => {
      const field = new SelectField({
        id: 'field1',
        name: 'Status',
        type: 'singleSelect',
        options: {
          choices: [
            { id: '1', name: 'Active', color: 'blue' },
            { id: '2', name: 'Inactive', color: 'gray' },
          ],
        },
      });

      expect(field.validate('1')).toBe(true);
      expect(field.validate('invalid')).toBe(false);
    });
  });

  describe('DateField', () => {
    it('should create a date field', () => {
      const field = new DateField({
        id: 'field1',
        name: 'Created',
        type: 'date',
      });

      expect(field.id).toBe('field1');
      expect(field.type).toBe('date');
    });

    it('should validate date values', () => {
      const field = new DateField({
        id: 'field1',
        name: 'Created',
        type: 'date',
      });

      expect(field.validate('2024-01-01')).toBe(true);
      expect(field.validate(new Date().toISOString())).toBe(true);
      expect(field.validate('invalid')).toBe(false);
    });
  });

  describe('RatingField', () => {
    it('should create a rating field', () => {
      const field = new RatingField({
        id: 'field1',
        name: 'Rating',
        type: 'rating',
        options: {
          max: 5,
        },
      });

      expect(field.id).toBe('field1');
      expect(field.type).toBe('rating');
      expect(field.getOptions().max).toBe(5);
    });

    it('should validate rating values', () => {
      const field = new RatingField({
        id: 'field1',
        name: 'Rating',
        type: 'rating',
        options: {
          max: 5,
        },
      });

      expect(field.validate(3)).toBe(true);
      expect(field.validate(5)).toBe(true);
      expect(field.validate(0)).toBe(true);
      expect(field.validate(6)).toBe(false);
      expect(field.validate(-1)).toBe(false);
    });
  });
});

