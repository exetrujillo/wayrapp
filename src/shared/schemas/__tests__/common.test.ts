/**
 * Common Schemas Tests
 */
import {
  BasePaginationSchema,
  PaginationSchema,
  IdParamSchema,
  UuidParamSchema,
  LanguageCodeSchema,
  CountryCodeSchema,
  EmailSchema,
  UsernameSchema,
  UrlSchema,
  ExperiencePointsSchema,
  OrderSchema,
  ScoreSchema,
  TimeSecondsSchema,
  BooleanStringSchema,
  RoleSchema,
  ModuleTypeSchema,
  ExerciseTypeSchema,
  TextFieldSchema,
  OptionalTextFieldSchema,
  JsonSchema,
} from '../common';

describe('Common Schemas', () => {
  describe('BasePaginationSchema', () => {
    it('should transform string values to numbers', () => {
      const result = BasePaginationSchema.parse({ page: '2', limit: '30' });
      expect(result).toEqual({ page: 2, limit: 30, sortOrder: 'asc' });
    });

    it('should use default values when not provided', () => {
      const result = BasePaginationSchema.parse({});
      expect(result).toEqual({ page: 1, limit: 20, sortOrder: 'asc' });
    });

    it('should accept sortBy and sortOrder', () => {
      const result = BasePaginationSchema.parse({ sortBy: 'name', sortOrder: 'desc' });
      expect(result).toEqual({ page: 1, limit: 20, sortBy: 'name', sortOrder: 'desc' });
    });
  });

  describe('PaginationSchema', () => {
    it('should validate pagination parameters', () => {
      const result = PaginationSchema.parse({ page: '2', limit: '30' });
      expect(result).toEqual({ page: 2, limit: 30, sortOrder: 'asc' });
    });

    it('should reject invalid pagination values', () => {
      expect(() => PaginationSchema.parse({ page: '0', limit: '30' })).toThrow();
      expect(() => PaginationSchema.parse({ page: '1', limit: '0' })).toThrow();
      expect(() => PaginationSchema.parse({ page: '1', limit: '101' })).toThrow();
    });
  });

  describe('IdParamSchema', () => {
    it('should validate ID parameter', () => {
      const result = IdParamSchema.parse({ id: 'test-id' });
      expect(result).toEqual({ id: 'test-id' });
    });

    it('should reject empty ID', () => {
      expect(() => IdParamSchema.parse({ id: '' })).toThrow();
    });
  });

  describe('UuidParamSchema', () => {
    it('should validate UUID parameter', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const result = UuidParamSchema.parse({ id: uuid });
      expect(result).toEqual({ id: uuid });
    });

    it('should reject invalid UUID', () => {
      expect(() => UuidParamSchema.parse({ id: 'not-a-uuid' })).toThrow();
    });
  });

  describe('LanguageCodeSchema', () => {
    it('should validate language code', () => {
      const result = LanguageCodeSchema.parse('en');
      expect(result).toBe('en');
    });

    it('should reject invalid language code', () => {
      expect(() => LanguageCodeSchema.parse('eng')).toThrow();
      expect(() => LanguageCodeSchema.parse('E')).toThrow();
      expect(() => LanguageCodeSchema.parse('EN')).toThrow();
    });
  });

  describe('CountryCodeSchema', () => {
    it('should validate country code', () => {
      const result = CountryCodeSchema.parse('US');
      expect(result).toBe('US');
    });

    it('should reject invalid country code', () => {
      expect(() => CountryCodeSchema.parse('usa')).toThrow();
      expect(() => CountryCodeSchema.parse('us')).toThrow();
      expect(() => CountryCodeSchema.parse('U')).toThrow();
    });
  });

  describe('EmailSchema', () => {
    it('should validate email', () => {
      const result = EmailSchema.parse('test@example.com');
      expect(result).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      expect(() => EmailSchema.parse('not-an-email')).toThrow();
      expect(() => EmailSchema.parse('test@')).toThrow();
      expect(() => EmailSchema.parse('@example.com')).toThrow();
    });
  });

  describe('UsernameSchema', () => {
    it('should validate username', () => {
      const result = UsernameSchema.parse('test_user-123');
      expect(result).toBe('test_user-123');
    });

    it('should reject invalid username', () => {
      expect(() => UsernameSchema.parse('ab')).toThrow(); // Too short
      expect(() => UsernameSchema.parse('user@name')).toThrow(); // Invalid character
      expect(() => UsernameSchema.parse('a'.repeat(51))).toThrow(); // Too long
    });
  });

  describe('UrlSchema', () => {
    it('should validate URL', () => {
      const result = UrlSchema.parse('https://example.com/path');
      expect(result).toBe('https://example.com/path');
    });

    it('should reject invalid URL', () => {
      expect(() => UrlSchema.parse('not-a-url')).toThrow();
      expect(() => UrlSchema.parse('http:/example.com')).toThrow();
    });
  });

  describe('ExperiencePointsSchema', () => {
    it('should validate experience points', () => {
      const result = ExperiencePointsSchema.parse(100);
      expect(result).toBe(100);
    });

    it('should reject invalid experience points', () => {
      expect(() => ExperiencePointsSchema.parse(-10)).toThrow();
      expect(() => ExperiencePointsSchema.parse(10.5)).toThrow();
    });
  });

  describe('OrderSchema', () => {
    it('should validate order', () => {
      const result = OrderSchema.parse(5);
      expect(result).toBe(5);
    });

    it('should reject invalid order', () => {
      expect(() => OrderSchema.parse(0)).toThrow();
      expect(() => OrderSchema.parse(-1)).toThrow();
      expect(() => OrderSchema.parse(1.5)).toThrow();
    });
  });

  describe('ScoreSchema', () => {
    it('should validate score', () => {
      const result = ScoreSchema.parse(85);
      expect(result).toBe(85);
    });

    it('should reject invalid score', () => {
      expect(() => ScoreSchema.parse(-10)).toThrow();
      expect(() => ScoreSchema.parse(101)).toThrow();
      expect(() => ScoreSchema.parse(85.5)).toThrow();
    });
  });

  describe('TimeSecondsSchema', () => {
    it('should validate time in seconds', () => {
      const result = TimeSecondsSchema.parse(120);
      expect(result).toBe(120);
    });

    it('should reject invalid time', () => {
      expect(() => TimeSecondsSchema.parse(-10)).toThrow();
      expect(() => TimeSecondsSchema.parse(10.5)).toThrow();
    });
  });

  describe('BooleanStringSchema', () => {
    it('should transform string to boolean', () => {
      expect(BooleanStringSchema.parse('true')).toBe(true);
      expect(BooleanStringSchema.parse('1')).toBe(true);
      expect(BooleanStringSchema.parse('false')).toBe(false);
      expect(BooleanStringSchema.parse('0')).toBe(false);
    });

    it('should handle undefined', () => {
      expect(BooleanStringSchema.parse(undefined)).toBeUndefined();
    });
  });

  describe('RoleSchema', () => {
    it('should validate role', () => {
      expect(RoleSchema.parse('student')).toBe('student');
      expect(RoleSchema.parse('content_creator')).toBe('content_creator');
      expect(RoleSchema.parse('admin')).toBe('admin');
    });

    it('should reject invalid role', () => {
      expect(() => RoleSchema.parse('guest')).toThrow();
    });
  });

  describe('ModuleTypeSchema', () => {
    it('should validate module type', () => {
      expect(ModuleTypeSchema.parse('informative')).toBe('informative');
      expect(ModuleTypeSchema.parse('basic_lesson')).toBe('basic_lesson');
      expect(ModuleTypeSchema.parse('reading')).toBe('reading');
      expect(ModuleTypeSchema.parse('dialogue')).toBe('dialogue');
      expect(ModuleTypeSchema.parse('exam')).toBe('exam');
    });

    it('should reject invalid module type', () => {
      expect(() => ModuleTypeSchema.parse('invalid_type')).toThrow();
    });
  });

  describe('ExerciseTypeSchema', () => {
    it('should validate exercise type', () => {
      expect(ExerciseTypeSchema.parse('translation')).toBe('translation');
      expect(ExerciseTypeSchema.parse('fill_in_the_blank')).toBe('fill_in_the_blank');
      expect(ExerciseTypeSchema.parse('vof')).toBe('vof');
      expect(ExerciseTypeSchema.parse('pairs')).toBe('pairs');
      expect(ExerciseTypeSchema.parse('informative')).toBe('informative');
      expect(ExerciseTypeSchema.parse('ordering')).toBe('ordering');
    });

    it('should reject invalid exercise type', () => {
      expect(() => ExerciseTypeSchema.parse('invalid_type')).toThrow();
    });
  });

  describe('TextFieldSchema', () => {
    it('should validate text field with default parameters', () => {
      const schema = TextFieldSchema();
      expect(schema.parse('Hello')).toBe('Hello');
      expect(() => schema.parse('')).toThrow();
    });

    it('should validate text field with custom parameters', () => {
      const schema = TextFieldSchema(3, 10);
      expect(schema.parse('Hello')).toBe('Hello');
      expect(() => schema.parse('Hi')).toThrow();
      expect(() => schema.parse('Hello World!')).toThrow();
    });
  });

  describe('OptionalTextFieldSchema', () => {
    it('should validate optional text field', () => {
      const schema = OptionalTextFieldSchema();
      expect(schema.parse('Hello')).toBe('Hello');
      expect(schema.parse(undefined)).toBeUndefined();
    });

    it('should validate optional text field with custom max length', () => {
      const schema = OptionalTextFieldSchema(10);
      expect(schema.parse('Hello')).toBe('Hello');
      expect(() => schema.parse('Hello World!')).toThrow();
    });
  });

  describe('JsonSchema', () => {
    it('should validate object JSON', () => {
      const result = JsonSchema.parse({ key: 'value', nested: { key: 'value' } });
      expect(result).toEqual({ key: 'value', nested: { key: 'value' } });
    });

    it('should validate array JSON', () => {
      const result = JsonSchema.parse([1, 2, { key: 'value' }]);
      expect(result).toEqual([1, 2, { key: 'value' }]);
    });

    it('should reject non-JSON values', () => {
      expect(() => JsonSchema.parse('string')).toThrow();
      expect(() => JsonSchema.parse(123)).toThrow();
    });
  });
});