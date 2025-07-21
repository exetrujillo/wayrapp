/**
 * User Factory for Test Data Generation
 * Creates test user data with customizable properties
 */
import { User, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

export class UserFactory {
  /**
   * Build a test user object with default or custom properties
   */
  static build(overrides: Partial<User> = {}): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
    const defaultUser = {
      email: `test-${Math.floor(Math.random() * 10000)}@example.com`,
      username: `testuser${Math.floor(Math.random() * 10000)}`,
      passwordHash: bcrypt.hashSync('Password123!', 10),
      countryCode: 'US',
      registrationDate: new Date(),
      lastLoginDate: null,
      profilePictureUrl: null,
      isActive: true,
      role: 'student' as Role,
    };

    return {
      ...defaultUser,
      ...overrides,
    };
  }

  /**
   * Build an admin user for testing
   */
  static buildAdmin(overrides: Partial<User> = {}): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
    return this.build({
      role: 'admin' as Role,
      ...overrides,
    });
  }

  /**
   * Build a content creator user for testing
   */
  static buildContentCreator(overrides: Partial<User> = {}): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
    return this.build({
      role: 'content_creator' as Role,
      ...overrides,
    });
  }
}