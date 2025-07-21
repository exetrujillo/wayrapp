/**
 * User Test Fixtures
 * Standard user objects for different roles and states
 */

import { User, Role } from "@prisma/client";
import { JWTPayload, UserRole } from "@/shared/types";

/**
 * Base user fixture with common properties
 */
const baseUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: '$2b$10$hashedPasswordExample123456789',
  countryCode: 'US',
  registrationDate: new Date('2024-01-01T00:00:00Z'),
  lastLoginDate: new Date('2024-01-15T10:30:00Z'),
  profilePictureUrl: null,
  isActive: true,
  role: Role.student,
};

/**
 * Complete user fixtures with all properties
 */
export const userFixtures = {
  /**
   * Standard active student user
   */
  validStudent: {
    id: 'student-123',
    ...baseUser,
    email: 'student@example.com',
    username: 'student123',
    role: Role.student,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as User,

  /**
   * Content creator user
   */
  contentCreator: {
    id: 'creator-123',
    ...baseUser,
    email: 'creator@example.com',
    username: 'creator123',
    role: Role.content_creator,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as User,

  /**
   * Admin user
   */
  admin: {
    id: 'admin-123',
    ...baseUser,
    email: 'admin@example.com',
    username: 'admin123',
    role: Role.admin,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as User,

  /**
   * Inactive user (deactivated account)
   */
  inactiveUser: {
    id: 'inactive-123',
    ...baseUser,
    email: 'inactive@example.com',
    username: 'inactive123',
    isActive: false,
    lastLoginDate: new Date('2023-12-01T10:30:00Z'),
    createdAt: new Date('2023-11-01T00:00:00Z'),
    updatedAt: new Date('2023-12-01T00:00:00Z'),
  } as User,

  /**
   * User without username (email-only registration)
   */
  emailOnlyUser: {
    id: 'email-only-123',
    ...baseUser,
    email: 'emailonly@example.com',
    username: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as User,

  /**
   * User without profile picture
   */
  userWithoutPicture: {
    id: 'no-pic-123',
    ...baseUser,
    email: 'nopic@example.com',
    username: 'nopic123',
    profilePictureUrl: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as User,

  /**
   * User with profile picture
   */
  userWithPicture: {
    id: 'with-pic-123',
    ...baseUser,
    email: 'withpic@example.com',
    username: 'withpic123',
    profilePictureUrl: 'https://example.com/profile/withpic123.jpg',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as User,

  /**
   * Recently registered user (no login yet)
   */
  newUser: {
    id: 'new-user-123',
    ...baseUser,
    email: 'newuser@example.com',
    username: 'newuser123',
    registrationDate: new Date('2024-01-20T00:00:00Z'),
    lastLoginDate: null,
    createdAt: new Date('2024-01-20T00:00:00Z'),
    updatedAt: new Date('2024-01-20T00:00:00Z'),
  } as User,

  /**
   * User from different country
   */
  internationalUser: {
    id: 'intl-user-123',
    ...baseUser,
    email: 'international@example.com',
    username: 'intluser123',
    countryCode: 'ES',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as User,

  /**
   * User without country code
   */
  userWithoutCountry: {
    id: 'no-country-123',
    ...baseUser,
    email: 'nocountry@example.com',
    username: 'nocountry123',
    countryCode: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  } as User,
};

/**
 * JWT Payload fixtures for authentication testing
 */
export const jwtPayloadFixtures = {
  /**
   * Valid student JWT payload
   */
  validStudent: {
    sub: userFixtures.validStudent.id,
    email: userFixtures.validStudent.email,
    role: 'student' as UserRole,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  } as JWTPayload,

  /**
   * Content creator JWT payload
   */
  contentCreator: {
    sub: userFixtures.contentCreator.id,
    email: userFixtures.contentCreator.email,
    role: 'content_creator' as UserRole,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  } as JWTPayload,

  /**
   * Admin JWT payload
   */
  admin: {
    sub: userFixtures.admin.id,
    email: userFixtures.admin.email,
    role: 'admin' as UserRole,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  } as JWTPayload,

  /**
   * Expired JWT payload
   */
  expired: {
    sub: userFixtures.validStudent.id,
    email: userFixtures.validStudent.email,
    role: 'student' as UserRole,
    iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
    exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
  } as JWTPayload,

  /**
   * JWT payload for inactive user
   */
  inactiveUser: {
    sub: userFixtures.inactiveUser.id,
    email: userFixtures.inactiveUser.email,
    role: 'student' as UserRole,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  } as JWTPayload,
};

/**
 * User creation data fixtures (for testing user creation)
 */
export const userCreationFixtures = {
  /**
   * Valid user creation data
   */
  validUserData: {
    email: 'newuser@example.com',
    username: 'newuser123',
    password: 'SecurePassword123!',
    countryCode: 'US',
  },

  /**
   * User creation data without username
   */
  emailOnlyData: {
    email: 'emailonly@example.com',
    password: 'SecurePassword123!',
    countryCode: 'US',
  },

  /**
   * User creation data without country
   */
  noCountryData: {
    email: 'nocountry@example.com',
    username: 'nocountry123',
    password: 'SecurePassword123!',
  },

  /**
   * Invalid user creation data (missing required fields)
   */
  invalidUserData: {
    username: 'invaliduser',
    // Missing email and password
  },

  /**
   * User creation data with invalid email
   */
  invalidEmailData: {
    email: 'invalid-email',
    username: 'testuser',
    password: 'SecurePassword123!',
  },

  /**
   * User creation data with weak password
   */
  weakPasswordData: {
    email: 'weakpass@example.com',
    username: 'weakpass123',
    password: '123',
  },
};

/**
 * User update data fixtures (for testing user updates)
 */
export const userUpdateFixtures = {
  /**
   * Valid profile update data
   */
  validProfileUpdate: {
    username: 'updatedusername',
    countryCode: 'CA',
    profilePictureUrl: 'https://example.com/new-profile.jpg',
  },

  /**
   * Email update data
   */
  emailUpdate: {
    email: 'newemail@example.com',
  },

  /**
   * Password update data
   */
  passwordUpdate: {
    currentPassword: 'OldPassword123!',
    newPassword: 'NewPassword123!',
  },

  /**
   * Deactivation data
   */
  deactivationUpdate: {
    isActive: false,
  },

  /**
   * Role update data (admin only)
   */
  roleUpdate: {
    role: Role.content_creator,
  },
};

/**
 * Helper functions for creating user fixtures with variations
 */
export const userFixtureHelpers = {
  /**
   * Create a user fixture with custom properties
   */
  createUser: (overrides: Partial<User> = {}): User => ({
    ...userFixtures.validStudent,
    ...overrides,
  }),

  /**
   * Create a JWT payload fixture with custom properties
   */
  createJwtPayload: (overrides: Partial<JWTPayload> = {}): JWTPayload => ({
    ...jwtPayloadFixtures.validStudent,
    ...overrides,
  }),

  /**
   * Create multiple users with different roles
   */
  createUsersWithRoles: (count: number = 3): User[] => [
    userFixtureHelpers.createUser({ 
      id: `student-${count}-1`, 
      email: `student${count}@example.com`,
      role: Role.student 
    }),
    userFixtureHelpers.createUser({ 
      id: `creator-${count}-1`, 
      email: `creator${count}@example.com`,
      role: Role.content_creator 
    }),
    userFixtureHelpers.createUser({ 
      id: `admin-${count}-1`, 
      email: `admin${count}@example.com`,
      role: Role.admin 
    }),
  ],

  /**
   * Create a batch of users for testing pagination
   */
  createUserBatch: (count: number = 10): User[] => 
    Array.from({ length: count }, (_, index) => 
      userFixtureHelpers.createUser({
        id: `batch-user-${index + 1}`,
        email: `batchuser${index + 1}@example.com`,
        username: `batchuser${index + 1}`,
      })
    ),

  /**
   * Create users with different activity states
   */
  createUsersWithActivityStates: (): User[] => [
    userFixtureHelpers.createUser({ 
      id: 'active-user-1', 
      isActive: true,
      lastLoginDate: new Date(),
    }),
    userFixtureHelpers.createUser({ 
      id: 'inactive-user-1', 
      isActive: false,
      lastLoginDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    }),
    userFixtureHelpers.createUser({ 
      id: 'new-user-1', 
      isActive: true,
      lastLoginDate: null,
      registrationDate: new Date(),
    }),
  ],
};