// src/modules/users/services/userService.ts

/**
 * User Service - Core business logic layer for user management and authentication operations
 * 
 * Provides comprehensive user management functionality including CRUD operations, authentication, and profile management.
 * 
 * This service acts as the primary business logic layer for all user-related operations in the application.
 * It handles user creation, authentication, profile management, password operations, and account lifecycle management.
 * The service implements proper validation, error handling, and security measures including password hashing and 
 * duplicate checking. It serves as the bridge between the UserController (presentation layer) and UserRepository 
 * (data access layer), ensuring business rules are enforced and providing a clean API for user operations.
 * 
 * @module userService
 * @category Services
 * @category Users
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { User, CreateUserDto, UpdateUserDto } from '../types';
import { UserRepository } from '../repositories/userRepository';

import { AppError } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus, QueryOptions, PaginatedResult } from '@/shared/types';
import { logger } from '@/shared/utils/logger';

/**
 * UserService - Core business logic service for user management operations
 * 
 * Provides comprehensive user management functionality including authentication,
 * profile management, and account lifecycle operations. Acts as the business logic layer
 * between controllers and the data repository.
 * 
 * @class UserService
 * @example
 * ```typescript
 * const userRepository = new UserRepository(prisma);
 * const userService = new UserService(userRepository);
 * 
 * // Create a new user
 * const newUser = await userService.createUser({
 *   email: 'user@example.com',
 *   username: 'johndoe',
 *   role: 'student'
 * });
 * 
 * // Authenticate user
 * const authenticatedUser = await userService.verifyUserByEmail(
 *   'user@example.com', 
 *   'password123'
 * );
 * ```
 */
export class UserService {
  /**
   * Creates a new UserService instance
   * 
   * @param {UserRepository} userRepository - Repository instance for data access operations
   */
  constructor(private userRepository: UserRepository) { }

  /**
   * Retrieves a user by their unique identifier
   * 
   * @param {string} id - The unique user identifier
   * @returns {Promise<User | null>} Promise resolving to user object or null if not found
   * @throws {AppError} When database operation fails
   * 
   * @example
   * ```typescript
   * const user = await userService.findById('user-123');
   * if (user) {
   *   console.log(`Found user: ${user.email}`);
   * }
   * ```
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  /**
   * Retrieves a user by their email address
   * 
   * @param {string} email - The user's email address
   * @returns {Promise<User | null>} Promise resolving to user object or null if not found
   * @throws {AppError} When database operation fails
   * 
   * @example
   * ```typescript
   * const user = await userService.findByEmail('user@example.com');
   * ```
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Retrieves a user by their username
   * 
   * @param {string} username - The user's username
   * @returns {Promise<User | null>} Promise resolving to user object or null if not found
   * @throws {AppError} When database operation fails
   * 
   * @example
   * ```typescript
   * const user = await userService.findByUsername('johndoe');
   * ```
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findByUsername(username);
  }

  /**
   * Creates a new user account without password (for OAuth or external auth)
   * 
   * @param {CreateUserDto} userData - User data for account creation
   * @param {string} userData.email - User's email address (required)
   * @param {string} [userData.username] - User's username (optional)
   * @param {string} [userData.country_code] - User's country code (optional)
   * @param {string} [userData.profile_picture_url] - User's profile picture URL (optional)
   * @param {UserRole} [userData.role='student'] - User's role (defaults to 'student')
   * @returns {Promise<User>} Promise resolving to the created user object
   * @throws {AppError} When email or username already exists (409 CONFLICT)
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   * 
   * @example
   * ```typescript
   * const newUser = await userService.createUser({
   *   email: 'user@example.com',
   *   username: 'johndoe',
   *   country_code: 'US',
   *   role: 'student'
   * });
   * ```
   */
  async createUser(userData: CreateUserDto): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError(
        'Email already registered',
        HttpStatus.CONFLICT,
        ErrorCodes.CONFLICT
      );
    }

    // Check if username already exists (if provided)
    if (userData.username) {
      const existingUsername = await this.findByUsername(userData.username);
      if (existingUsername) {
        throw new AppError(
          'Username already taken',
          HttpStatus.CONFLICT,
          ErrorCodes.CONFLICT
        );
      }
    }

    const user = await this.userRepository.create(userData);

    logger.info('User created successfully', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return user;
  }

  /**
   * Updates existing user information
   * 
   * @param {string} id - The unique user identifier
   * @param {UpdateUserDto} updates - Object containing fields to update
   * @param {string} [updates.username] - New username (optional)
   * @param {string} [updates.country_code] - New country code (optional)
   * @param {string} [updates.profile_picture_url] - New profile picture URL (optional)
   * @param {boolean} [updates.is_active] - Account active status (optional)
   * @param {string} [updates.role] - User role (optional)
   * @returns {Promise<User>} Promise resolving to the updated user object
   * @throws {AppError} When user is not found (404 NOT_FOUND)
   * @throws {AppError} When username already taken (409 CONFLICT)
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   * 
   * @example
   * ```typescript
   * const updatedUser = await userService.updateUser('user-123', {
   *   username: 'newusername',
   *   country_code: 'CA'
   * });
   * ```
   */
  async updateUser(id: string, updates: UpdateUserDto): Promise<User> {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      throw new AppError(
        'User not found',
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );
    }

    // Check username uniqueness if being updated
    if (updates.username && updates.username !== existingUser.username) {
      const existingUsername = await this.findByUsername(updates.username);
      if (existingUsername && existingUsername.id !== id) {
        throw new AppError(
          'Username already taken',
          HttpStatus.CONFLICT,
          ErrorCodes.CONFLICT
        );
      }
    }

    const updatedUser = await this.userRepository.update(id, updates);

    logger.info('User updated successfully', { userId: id });

    return updatedUser;
  }

  /**
   * Creates a new user account with password hashing for standard registration
   * 
   * @param {CreateUserDto & { password: string }} userData - User data including password
   * @param {string} userData.email - User's email address (required)
   * @param {string} userData.password - User's plain text password (required)
   * @param {string} [userData.username] - User's username (optional)
   * @param {string} [userData.country_code] - User's country code (optional)
   * @param {string} [userData.profile_picture_url] - User's profile picture URL (optional)
   * @param {UserRole} [userData.role='student'] - User's role (defaults to 'student')
   * @returns {Promise<User>} Promise resolving to the created user object (without password hash)
   * @throws {AppError} When email or username already exists (409 CONFLICT)
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   * 
   * @example
   * ```typescript
   * const newUser = await userService.createUserWithPassword({
   *   email: 'user@example.com',
   *   password: 'SecurePass123!',
   *   username: 'johndoe',
   *   role: 'student'
   * });
   * ```
   */
  async createUserWithPassword(
    userData: CreateUserDto & { password: string }
  ): Promise<User> {
    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError(
        'Email already registered',
        HttpStatus.CONFLICT,
        ErrorCodes.CONFLICT
      );
    }

    // Check if username already exists (if provided)
    if (userData.username) {
      const existingUsername = await this.findByUsername(userData.username);
      if (existingUsername) {
        throw new AppError(
          'Username already taken',
          HttpStatus.CONFLICT,
          ErrorCodes.CONFLICT
        );
      }
    }

    // Hash password before storing
    const { hashPassword } = await import('@/shared/utils/auth');
    const passwordHash = await hashPassword(userData.password);

    const user = await this.userRepository.createWithPassword({
      ...userData,
      passwordHash
    });

    logger.info('User created successfully with hashed password', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return user;
  }

  /**
   * Verifies a user's password against the stored hash
   * 
   * @param {string} userId - The unique user identifier
   * @param {string} password - The plain text password to verify
   * @returns {Promise<boolean>} Promise resolving to true if password is valid, false otherwise
   * @throws {AppError} When database operation fails
   * 
   * @example
   * ```typescript
   * const isValid = await userService.verifyPassword('user-123', 'userPassword');
   * if (isValid) {
   *   console.log('Password is correct');
   * }
   * ```
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user || !user.passwordHash) {
      return false;
    }

    const { comparePassword } = await import('@/shared/utils/auth');
    return comparePassword(password, user.passwordHash);
  }

  /**
   * Authenticates a user by email and password combination
   * 
   * @param {string} email - The user's email address
   * @param {string} password - The user's plain text password
   * @returns {Promise<User | null>} Promise resolving to user object if credentials are valid, null otherwise
   * @throws {AppError} When database operation fails
   * 
   * @example
   * ```typescript
   * const authenticatedUser = await userService.verifyUserByEmail(
   *   'user@example.com', 
   *   'password123'
   * );
   * if (authenticatedUser) {
   *   // User is authenticated, proceed with login
   *   console.log(`Welcome ${authenticatedUser.email}`);
   * } else {
   *   // Invalid credentials
   *   console.log('Invalid email or password');
   * }
   * ```
   */
  async verifyUserByEmail(email: string, password: string): Promise<User | null> {
    const authUser = await this.userRepository.findByEmailWithPassword(email);
    if (!authUser || !authUser.passwordHash) {
      return null;
    }

    const { comparePassword } = await import('@/shared/utils/auth');
    const isPasswordValid = await comparePassword(password, authUser.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    // Return the full user object after successful authentication
    return this.userRepository.findById(authUser.id);
  }

  /**
   * Updates the user's last login timestamp to current time
   * 
   * @param {string} userId - The unique user identifier
   * @returns {Promise<void>} Promise that resolves when update is complete
   * This method is designed to be non-blocking and will not throw errors
   * if the update fails, only logging warnings to prevent login flow interruption
   * 
   * @example
   * ```typescript
   * // Called after successful authentication
   * await userService.updateLastLogin('user-123');
   * ```
   */
  async updateLastLogin(userId: string): Promise<void> {
    try {
      await this.userRepository.updateLastLogin(userId, new Date());
      logger.info('User last login updated', { userId });
    } catch (error) {
      // Don't throw an error if this fails, just log it
      logger.warn('Failed to update user last login', { userId, error });
    }
  }

  /**
   * Deactivates a user account by setting is_active to false
   * 
   * @param {string} id - The unique user identifier
   * @returns {Promise<User>} Promise resolving to the updated user object
   * @throws {AppError} When user is not found (404 NOT_FOUND)
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   * 
   * @example
   * ```typescript
   * const deactivatedUser = await userService.deactivateUser('user-123');
   * console.log(`User ${deactivatedUser.email} has been deactivated`);
   * ```
   */
  async deactivateUser(id: string): Promise<User> {
    const user = await this.updateUser(id, { is_active: false });

    logger.info('User account deactivated', { userId: id });

    return user;
  }

  /**
   * Activates a user account by setting is_active to true
   * 
   * @param {string} id - The unique user identifier
   * @returns {Promise<User>} Promise resolving to the updated user object
   * @throws {AppError} When user is not found (404 NOT_FOUND)
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   * 
   * @example
   * ```typescript
   * const activatedUser = await userService.activateUser('user-123');
   * console.log(`User ${activatedUser.email} has been activated`);
   * ```
   */
  async activateUser(id: string): Promise<User> {
    const user = await this.updateUser(id, { is_active: true });

    logger.info('User account activated', { userId: id });

    return user;
  }

  /**
   * Checks if a user exists by their unique identifier
   * 
   * @param {string} id - The unique user identifier
   * @returns {Promise<boolean>} Promise resolving to true if user exists, false otherwise
   * @throws {AppError} When database operation fails
   * 
   * @example
   * ```typescript
   * const exists = await userService.userExists('user-123');
   * if (exists) {
   *   console.log('User exists in the system');
   * }
   * ```
   */
  async userExists(id: string): Promise<boolean> {
    const user = await this.findById(id);
    return !!user;
  }

  /**
   * Retrieves a paginated list of users with optional filtering and sorting
   * 
   * @param {QueryOptions} [options={}] - Query options for pagination and filtering
   * @param {number} [options.page=1] - Page number for pagination
   * @param {number} [options.limit=20] - Number of items per page
   * @param {string} [options.sortBy='created_at'] - Field to sort by
   * @param {'asc' | 'desc'} [options.sortOrder='desc'] - Sort order
   * @param {Object} [options.filters={}] - Filters to apply
   * @param {string} [options.filters.role] - Filter by user role
   * @param {boolean} [options.filters.is_active] - Filter by active status
   * @param {string} [options.filters.search] - Search in email and username
   * @returns {Promise<PaginatedResult<User>>} Promise resolving to paginated user results
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   * 
   * @example
   * ```typescript
   * const users = await userService.findAll({
   *   page: 1,
   *   limit: 10,
   *   sortBy: 'created_at',
   *   sortOrder: 'desc',
   *   filters: {
   *     role: 'student',
   *     is_active: true,
   *     search: 'john'
   *   }
   * });
   * console.log(`Found ${users.data.length} users`);
   * ```
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll(options);
  }

  /**
   * Updates a user's password after verifying their current password
   * 
   * @param {string} userId - The unique user identifier
   * @param {string} currentPassword - The user's current plain text password
   * @param {string} newPassword - The new plain text password to set
   * @returns {Promise<boolean>} Promise resolving to true when password is successfully updated
   * @throws {AppError} When current password is incorrect (401 UNAUTHORIZED)
   * @throws {AppError} When user is not found (404 NOT_FOUND)
   * @throws {AppError} When database operation fails (500 INTERNAL_SERVER_ERROR)
   * 
   * @example
   * ```typescript
   * try {
   *   await userService.updatePassword(
   *     'user-123', 
   *     'oldPassword123', 
   *     'newSecurePassword456!'
   *   );
   *   console.log('Password updated successfully');
   * } catch (error) {
   *   if (error.statusCode === 401) {
   *     console.log('Current password is incorrect');
   *   }
   * }
   * ```
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(userId, currentPassword);
    if (!isCurrentPasswordValid) {
      logger.warn('Password update failed - invalid current password', { userId });
      throw new AppError(
        'Current password is incorrect',
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTHENTICATION_ERROR
      );
    }

    // Hash new password
    const { hashPassword } = await import('@/shared/utils/auth');
    const newPasswordHash = await hashPassword(newPassword);

    // Update password in database
    await this.userRepository.updatePassword(userId, newPasswordHash);

    logger.info('User password updated successfully', { userId });
    return true;
  }

  /**
   * Retrieves a user's profile information without sensitive data
   * 
   * @param {string} id - The unique user identifier
   * @returns {Promise<Omit<User, 'password_hash'> | null>} Promise resolving to user profile or null if not found
   * @throws {AppError} When database operation fails
   * Returns user data safe for client consumption, excluding password hash and
   * normalizing null values to empty strings for optional fields
   * 
   * @example
   * ```typescript
   * const profile = await userService.getUserProfile('user-123');
   * if (profile) {
   *   console.log(`Profile for: ${profile.email}`);
   *   console.log(`Username: ${profile.username || 'Not set'}`);
   *   console.log(`Active: ${profile.is_active}`);
   * }
   * ```
   */
  async getUserProfile(
    id: string
  ): Promise<Omit<User, 'password_hash'> | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    // Return user without sensitive fields
    const userProfile = {
      id: user.id,
      email: user.email,
      username: user.username ?? '', // if it's null, it becomes a void string.
      country_code: user.country_code ?? '', // Same here.
      registration_date: user.registration_date,
      profile_picture_url: user.profile_picture_url ?? '', // And here.
      is_active: user.is_active,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    // Add last_login_date only if it exists
    if (user.last_login_date) {
      (userProfile as any).last_login_date = user.last_login_date;
    }

    return userProfile;
  }
}