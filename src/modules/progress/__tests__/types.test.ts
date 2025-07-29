/**
 * Progress Types Schema Tests
 * Unit tests for Zod schema validation logic
 */

import {
  UpdateUserLivesSchema,
  AwardBonusSchema,
  ResetProgressSchema,
} from '../types/index';

describe('Progress Types Schema Validation', () => {
  describe('UpdateUserLivesSchema', () => {
    it('should validate valid lives_change input', () => {
      const validInput = { lives_change: 5 };
      const result = UpdateUserLivesSchema.safeParse(validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lives_change).toBe(5);
      }
    });

    it('should validate negative lives_change input', () => {
      const validInput = { lives_change: -2 };
      const result = UpdateUserLivesSchema.safeParse(validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.lives_change).toBe(-2);
      }
    });

    it('should reject non-integer lives_change', () => {
      const invalidInput = { lives_change: 3.5 };
      const result = UpdateUserLivesSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
    });

    it('should reject string lives_change', () => {
      const invalidInput = { lives_change: "5" };
      const result = UpdateUserLivesSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
    });

    it('should reject missing lives_change', () => {
      const invalidInput = {};
      const result = UpdateUserLivesSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
    });
  });

  describe('AwardBonusSchema', () => {
    it('should validate valid bonus award input', () => {
      const validInput = {
        target_user_id: '123e4567-e89b-12d3-a456-426614174000',
        bonus_points: 100,
        reason: 'Excellent performance'
      };
      const result = AwardBonusSchema.safeParse(validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.target_user_id).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(result.data.bonus_points).toBe(100);
        expect(result.data.reason).toBe('Excellent performance');
      }
    });

    it('should reject invalid UUID format', () => {
      const invalidInput = {
        target_user_id: 'invalid-uuid',
        bonus_points: 100,
        reason: 'Test reason'
      };
      const result = AwardBonusSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Invalid user ID format');
      }
    });

    it('should reject zero bonus_points', () => {
      const invalidInput = {
        target_user_id: '123e4567-e89b-12d3-a456-426614174000',
        bonus_points: 0,
        reason: 'Test reason'
      };
      const result = AwardBonusSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Bonus points must be a positive integer');
      }
    });

    it('should reject negative bonus_points', () => {
      const invalidInput = {
        target_user_id: '123e4567-e89b-12d3-a456-426614174000',
        bonus_points: -50,
        reason: 'Test reason'
      };
      const result = AwardBonusSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Bonus points must be a positive integer');
      }
    });

    it('should reject non-integer bonus_points', () => {
      const invalidInput = {
        target_user_id: '123e4567-e89b-12d3-a456-426614174000',
        bonus_points: 50.5,
        reason: 'Test reason'
      };
      const result = AwardBonusSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
    });

    it('should reject empty reason', () => {
      const invalidInput = {
        target_user_id: '123e4567-e89b-12d3-a456-426614174000',
        bonus_points: 100,
        reason: ''
      };
      const result = AwardBonusSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Reason is required');
      }
    });

    it('should reject missing required fields', () => {
      const invalidInput = {};
      const result = AwardBonusSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
    });
  });

  describe('ResetProgressSchema', () => {
    it('should validate valid reset progress input with reason', () => {
      const validInput = {
        target_user_id: '123e4567-e89b-12d3-a456-426614174000',
        reason: 'User requested reset'
      };
      const result = ResetProgressSchema.safeParse(validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.target_user_id).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(result.data.reason).toBe('User requested reset');
      }
    });

    it('should validate valid reset progress input without reason', () => {
      const validInput = {
        target_user_id: '123e4567-e89b-12d3-a456-426614174000'
      };
      const result = ResetProgressSchema.safeParse(validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.target_user_id).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(result.data.reason).toBeUndefined();
      }
    });

    it('should validate valid reset progress input with empty reason', () => {
      const validInput = {
        target_user_id: '123e4567-e89b-12d3-a456-426614174000',
        reason: undefined
      };
      const result = ResetProgressSchema.safeParse(validInput);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.target_user_id).toBe('123e4567-e89b-12d3-a456-426614174000');
        expect(result.data.reason).toBeUndefined();
      }
    });

    it('should reject invalid UUID format', () => {
      const invalidInput = {
        target_user_id: 'invalid-uuid',
        reason: 'Test reason'
      };
      const result = ResetProgressSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('Invalid user ID format');
      }
    });

    it('should reject empty string reason', () => {
      const invalidInput = {
        target_user_id: '123e4567-e89b-12d3-a456-426614174000',
        reason: ''
      };
      const result = ResetProgressSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
    });

    it('should reject missing target_user_id', () => {
      const invalidInput = {
        reason: 'Test reason'
      };
      const result = ResetProgressSchema.safeParse(invalidInput);
      
      expect(result.success).toBe(false);
    });
  });
});