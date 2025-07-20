/**
 * User Types Tests
 * Unit tests for user type definitions and validation schemas
 */

import {
  CreateUserSchema,
  UpdateUserSchema,
  UpdatePasswordSchema,
  UpdateRoleSchema,
  CreateUserSchemaType,
  UpdateUserSchemaType,
  UpdatePasswordSchemaType,
  UpdateRoleSchemaType
} from '../index';

describe('User Validation Schemas', () => {
  describe('CreateUserSchema', () => {
    it('should validate valid user creation data', () => {
      const validData = {
        email: 'test@example.com',
        username: 'testuser',
        country_code: 'US',
        profile_picture_url: 'https://example.com/avatar.jpg',
        role: 'student' as const
      };

      const result = CreateUserSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate minimal user creation data', () => {
      const minimalData = {
        email: 'test@example.com'
      };

      const result = CreateUserSchema.parse(minimalData);
      expect(result).toEqual({
        email: 'test@example.com',
        role: 'student'
      });
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        email: 'invalid-email'
      };

      expect(() => CreateUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject username that is too short', () => {
      const invalidData = {
        email: 'test@example.com',
        username: 'ab'
      };

      expect(() => CreateUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid country code length', () => {
      const invalidData = {
        email: 'test@example.com',
        country_code: 'USA'
      };

      expect(() => CreateUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid profile picture URL', () => {
      const invalidData = {
        email: 'test@example.com',
        profile_picture_url: 'not-a-url'
      };

      expect(() => CreateUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid role', () => {
      const invalidData = {
        email: 'test@example.com',
        role: 'invalid_role'
      };

      expect(() => CreateUserSchema.parse(invalidData)).toThrow();
    });

    it('should accept all valid roles', () => {
      const roles = ['student', 'content_creator', 'admin'] as const;
      
      roles.forEach(role => {
        const data = {
          email: 'test@example.com',
          role
        };
        
        const result = CreateUserSchema.parse(data);
        expect(result.role).toBe(role);
      });
    });
  });

  describe('UpdateUserSchema', () => {
    it('should validate valid user update data', () => {
      const validData = {
        username: 'newusername',
        country_code: 'CA',
        profile_picture_url: 'https://example.com/new-avatar.jpg'
      };

      const result = UpdateUserSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should validate empty update data', () => {
      const emptyData = {};

      const result = UpdateUserSchema.parse(emptyData);
      expect(result).toEqual({});
    });

    it('should validate partial update data', () => {
      const partialData = {
        username: 'newusername'
      };

      const result = UpdateUserSchema.parse(partialData);
      expect(result).toEqual(partialData);
    });

    it('should reject username that is too short', () => {
      const invalidData = {
        username: 'ab'
      };

      expect(() => UpdateUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid country code length', () => {
      const invalidData = {
        country_code: 'USA'
      };

      expect(() => UpdateUserSchema.parse(invalidData)).toThrow();
    });

    it('should reject invalid profile picture URL', () => {
      const invalidData = {
        profile_picture_url: 'not-a-url'
      };

      expect(() => UpdateUserSchema.parse(invalidData)).toThrow();
    });
  });

  describe('UpdatePasswordSchema', () => {
    it('should validate valid password update data', () => {
      const validData = {
        current_password: 'oldPassword123!',
        new_password: 'NewPassword456@'
      };

      const result = UpdatePasswordSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should reject empty current password', () => {
      const invalidData = {
        current_password: '',
        new_password: 'NewPassword456@'
      };

      expect(() => UpdatePasswordSchema.parse(invalidData)).toThrow();
    });

    it('should reject new password that is too short', () => {
      const invalidData = {
        current_password: 'oldPassword123!',
        new_password: 'short'
      };

      expect(() => UpdatePasswordSchema.parse(invalidData)).toThrow();
    });

    it('should reject new password without uppercase letter', () => {
      const invalidData = {
        current_password: 'oldPassword123!',
        new_password: 'newpassword123!'
      };

      expect(() => UpdatePasswordSchema.parse(invalidData)).toThrow();
    });

    it('should reject new password without lowercase letter', () => {
      const invalidData = {
        current_password: 'oldPassword123!',
        new_password: 'NEWPASSWORD123!'
      };

      expect(() => UpdatePasswordSchema.parse(invalidData)).toThrow();
    });

    it('should reject new password without number', () => {
      const invalidData = {
        current_password: 'oldPassword123!',
        new_password: 'NewPassword!'
      };

      expect(() => UpdatePasswordSchema.parse(invalidData)).toThrow();
    });

    it('should reject new password without special character', () => {
      const invalidData = {
        current_password: 'oldPassword123!',
        new_password: 'NewPassword123'
      };

      expect(() => UpdatePasswordSchema.parse(invalidData)).toThrow();
    });
  });

  describe('UpdateRoleSchema', () => {
    it('should validate valid role update data', () => {
      const validData = {
        role: 'admin' as const
      };

      const result = UpdateRoleSchema.parse(validData);
      expect(result).toEqual(validData);
    });

    it('should accept all valid roles', () => {
      const roles = ['student', 'content_creator', 'admin'] as const;
      
      roles.forEach(role => {
        const data = { role };
        const result = UpdateRoleSchema.parse(data);
        expect(result.role).toBe(role);
      });
    });

    it('should reject invalid role', () => {
      const invalidData = {
        role: 'invalid_role'
      };

      expect(() => UpdateRoleSchema.parse(invalidData)).toThrow();
    });
  });

  describe('Type Inference', () => {
    it('should infer correct types from schemas', () => {
      // This test ensures TypeScript type inference works correctly
      const createUserData: CreateUserSchemaType = {
        email: 'test@example.com',
        username: 'testuser',
        role: 'student'
      };

      const updateUserData: UpdateUserSchemaType = {
        username: 'newusername',
        country_code: 'US'
      };

      const updatePasswordData: UpdatePasswordSchemaType = {
        current_password: 'oldPassword123!',
        new_password: 'NewPassword456@'
      };

      const updateRoleData: UpdateRoleSchemaType = {
        role: 'admin'
      };

      // If these compile without errors, the type inference is working
      expect(createUserData.email).toBe('test@example.com');
      expect(updateUserData.username).toBe('newusername');
      expect(updatePasswordData.current_password).toBe('oldPassword123!');
      expect(updateRoleData.role).toBe('admin');
    });
  });
});