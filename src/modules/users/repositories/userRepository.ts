// src/modules/users/repositories/userRepository.ts

/**
 * User Repository - Data access layer for user operations using Prisma ORM
 * 
 * Provides comprehensive data access operations for user management including CRUD operations, authentication queries, and pagination.
 * 
 * This repository serves as the data access layer for all user-related database operations in the application.
 * It encapsulates all Prisma database interactions for the User entity, providing a clean abstraction layer between
 * the business logic (UserService) and the database. The repository handles user creation, retrieval, updates, and
 * soft deletion operations, along with specialized methods for authentication workflows including password management
 * and login tracking. It implements proper error handling, logging, and data mapping between Prisma models and
 * application domain objects. The repository supports advanced querying capabilities including pagination, filtering,
 * and sorting for user management interfaces.
 * 
 * Security Features:
 * - Authentication methods return minimal data (UserAuthData) to reduce exposure of sensitive information
 * - Password hashes are only retrieved when explicitly needed for authentication
 * - Type-safe operations eliminate unsafe type assertions and improve code reliability
 * - Selective field querying using Prisma's select reduces database payload and improves performance
 * 
 * Main repository class providing all user data access operations. Minimal user object for secure authentication workflows.
 * Creates a new user without password authentication. Creates a new user with password hash for authentication.
 * Retrieves a user by their unique identifier. Retrieves minimal user auth data by ID for authentication.
 * Retrieves a user by their email address. Retrieves minimal user auth data by email for authentication.
 * Retrieves a user by their username. Updates existing user information with validation.
 * Performs soft delete by deactivating user account. Retrieves paginated list of users with filtering and sorting.
 * Updates user password hash securely. Updates user's last login timestamp for tracking.
 * 
 * @module  UserRepository
 * @category Users
 * @category Repositories
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { User, CreateUserDto, UpdateUserDto } from '../types';
import { AppError } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus, QueryOptions, PaginatedResult } from '@/shared/types';
import { logger } from '@/shared/utils/logger';

/**
 * Minimal user object for authentication purposes
 * 
 * @interface UserAuthData
 * Contains only essential fields needed for authentication workflows to minimize
 * data exposure and improve security. This interface is used by password-related methods
 * to ensure that sensitive operations only access the minimum required user data.
 * 
 * @property {string} id - User's unique identifier (UUID)
 * @property {string} email - User's email address for identification
 * @property {string | null} passwordHash - Hashed password for authentication (null if no password set)
 * @property {string} role - User's role in the system (student, content_creator, admin)
 * @property {boolean} isActive - Whether the user account is active and can authenticate
 * 
 * @example
 * ```typescript
 * const authData = await userRepository.findByEmailWithPassword('user@example.com');
 * if (authData && authData.isActive && authData.passwordHash) {
 *   // Proceed with password verification
 *   const isValid = await comparePassword(password, authData.passwordHash);
 * }
 * ```
 */
export interface UserAuthData {
  id: string;
  email: string;
  passwordHash: string | null;
  role: string;
  isActive: boolean;
}

/**
 * UserRepository - Data access layer for user operations using Prisma ORM
 * 
 * @class UserRepository
 * Provides comprehensive data access operations for user management including CRUD operations,
 * authentication queries, and pagination. Acts as the data access layer between the business logic service
 * and the PostgreSQL database through Prisma ORM.
 */
export class UserRepository {
  /**
   * Creates a new UserRepository instance
   * 
   * @param {PrismaClient} prisma - Prisma client instance for database operations
   */
  constructor(private prisma: PrismaClient) { }

  /**
   * Creates a new user without password authentication
   * 
   * @param {CreateUserDto} userData - User data for creation
   * @param {string} userData.email - User's email address (required, unique)
   * @param {string} [userData.username] - User's username (optional, unique if provided)
   * @param {string} [userData.country_code] - Two-letter country code (optional)
   * @param {string} [userData.profile_picture_url] - URL to user's profile picture (optional)
   * @param {UserRole} [userData.role='student'] - User's role in the system (defaults to 'student')
   * @returns {Promise<User>} Promise resolving to the created user object
   * @throws {AppError} Throws CONFLICT error if email or username already exists
   * @throws {AppError} Throws DATABASE_ERROR for other database-related failures
   * 
   * @example
   * const userData = {
   *   email: 'user@example.com',
   *   username: 'johndoe',
   *   country_code: 'US',
   *   role: 'student'
   * };
   * const user = await userRepository.create(userData);
   */
  async create(userData: CreateUserDto): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username ?? null,
          countryCode: userData.country_code ?? null,
          profilePictureUrl: userData.profile_picture_url ?? null,
          role: userData.role || 'student',
        },
      });

      return this.mapPrismaUserToUser(user);
    } catch (error) {
      logger.error('Error creating user', { error, userData: { email: userData.email } });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          throw new AppError('Email or username already exists', HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
        }
      }

      throw new AppError('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Creates a new user with password hash for authentication
   * 
   * @param {CreateUserDto & { passwordHash: string }} userData - User data including password hash
   * @param {string} userData.email - User's email address (required, unique)
   * @param {string} [userData.username] - User's username (optional, unique if provided)
   * @param {string} [userData.country_code] - Two-letter country code (optional)
   * @param {string} [userData.profile_picture_url] - URL to user's profile picture (optional)
   * @param {UserRole} [userData.role='student'] - User's role in the system (defaults to 'student')
   * @param {string} userData.passwordHash - Hashed password for authentication
   * @returns {Promise<User>} Promise resolving to the created user object
   * @throws {AppError} Throws CONFLICT error if email or username already exists
   * @throws {AppError} Throws DATABASE_ERROR for other database-related failures
   * 
   * Uses type-safe Prisma operations without unsafe type assertions, ensuring
   * data integrity and compile-time type checking for all user creation operations.
   */
  async createWithPassword(userData: CreateUserDto & { passwordHash: string }): Promise<User> {
    try {
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username ?? null,
          countryCode: userData.country_code ?? null,
          profilePictureUrl: userData.profile_picture_url ?? null,
          role: userData.role || 'student',
          passwordHash: userData.passwordHash,
        },
      });

      return this.mapPrismaUserToUser(user);
    } catch (error) {
      logger.error('Error creating user with password', { error, userData: { email: userData.email } });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation
          throw new AppError('Email or username already exists', HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
        }
      }

      throw new AppError('Failed to create user', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Retrieves a user by their unique identifier
   * 
   * @param {string} id - User's unique identifier (UUID)
   * @returns {Promise<User | null>} Promise resolving to user object or null if not found
   * @throws {AppError} Throws DATABASE_ERROR for database-related failures
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      return user ? this.mapPrismaUserToUser(user) : null;
    } catch (error) {
      logger.error('Error finding user by ID', { error, userId: id });
      throw new AppError('Failed to find user', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Retrieves minimal user data with password hash by their unique identifier for authentication
   * 
   * @param {string} id - User's unique identifier (UUID)
   * @returns {Promise<UserAuthData | null>} Promise resolving to minimal user auth data or null if not found
   * @throws {AppError} Throws DATABASE_ERROR for database-related failures
   * 
   * This method uses Prisma's select to fetch only essential authentication fields,
   * reducing data exposure and improving performance. The returned UserAuthData contains only
   * the minimum information needed for password verification workflows.
   * 
   * @example
   * ```typescript
   * const authData = await userRepository.findByIdWithPassword('user-123');
   * if (authData && authData.passwordHash) {
   *   const isValid = await comparePassword(plainPassword, authData.passwordHash);
   * }
   * ```
   */
  async findByIdWithPassword(id: string): Promise<UserAuthData | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
          isActive: true,
        },
      });

      return user;
    } catch (error) {
      logger.error('Error finding user with password by ID', { error, userId: id });
      throw new AppError('Failed to find user', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Retrieves a user by their email address
   * 
   * @param {string} email - User's email address
   * @returns {Promise<User | null>} Promise resolving to user object or null if not found
   * @throws {AppError} Throws DATABASE_ERROR for database-related failures
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      return user ? this.mapPrismaUserToUser(user) : null;
    } catch (error) {
      logger.error('Error finding user by email', { error, email });
      throw new AppError('Failed to find user', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Retrieves minimal user data with password hash by their email address for authentication
   * 
   * @param {string} email - User's email address
   * @returns {Promise<UserAuthData | null>} Promise resolving to minimal user auth data or null if not found
   * @throws {AppError} Throws DATABASE_ERROR for database-related failures
   * 
   * This method uses Prisma's select to fetch only essential authentication fields,
   * reducing data exposure and improving performance. The returned UserAuthData contains only
   * the minimum information needed for login workflows.
   * 
   * @example
   * ```typescript
   * const authData = await userRepository.findByEmailWithPassword('user@example.com');
   * if (authData && authData.isActive && authData.passwordHash) {
   *   const isValid = await comparePassword(plainPassword, authData.passwordHash);
   *   if (isValid) {
   *     // Authentication successful, fetch full user data if needed
   *     const fullUser = await userRepository.findById(authData.id);
   *   }
   * }
   * ```
   */
  async findByEmailWithPassword(email: string): Promise<UserAuthData | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          passwordHash: true,
          role: true,
          isActive: true,
        },
      });

      return user;
    } catch (error) {
      logger.error('Error finding user with password by email', { error, email });
      throw new AppError('Failed to find user', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Retrieves a user by their username
   * 
   * @param {string} username - User's username
   * @returns {Promise<User | null>} Promise resolving to user object or null if not found
   * @throws {AppError} Throws DATABASE_ERROR for database-related failures
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { username },
      });

      return user ? this.mapPrismaUserToUser(user) : null;
    } catch (error) {
      logger.error('Error finding user by username', { error, username });
      throw new AppError('Failed to find user', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Updates existing user information with validation
   * 
   * @param {string} id - User's unique identifier (UUID)
   * @param {UpdateUserDto} updates - Object containing fields to update
   * @param {string} [updates.username] - New username (optional, must be unique if provided)
   * @param {string} [updates.country_code] - New country code (optional)
   * @param {string} [updates.profile_picture_url] - New profile picture URL (optional)
   * @param {boolean} [updates.is_active] - New active status (optional)
   * @returns {Promise<User>} Promise resolving to the updated user object
   * @throws {AppError} Throws NOT_FOUND error if user doesn't exist
   * @throws {AppError} Throws CONFLICT error if username already exists
   * @throws {AppError} Throws DATABASE_ERROR for other database-related failures
   */
  async update(id: string, updates: UpdateUserDto): Promise<User> {
    const dataToUpdate: Prisma.UserUpdateInput = {};

    if (updates.username !== undefined) {
      dataToUpdate.username = updates.username === '' ? null : updates.username;
    }
    if (updates.country_code !== undefined) {
      dataToUpdate.countryCode = updates.country_code;
    }
    if (updates.profile_picture_url !== undefined) {
      dataToUpdate.profilePictureUrl = updates.profile_picture_url;
    }
    if (updates.is_active !== undefined) {
      dataToUpdate.isActive = updates.is_active;
    }
    if (updates.role !== undefined) {
      dataToUpdate.role = updates.role as any;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      logger.warn('Update called with no data to update for user', { userId: id });
      const currentUser = await this.findById(id);
      if (!currentUser) {
        throw new AppError('User not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
      }
      return currentUser;
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: dataToUpdate,
      });

      return this.mapPrismaUserToUser(user);
    } catch (error) {
      logger.error('Error updating user', { error, userId: id });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          throw new AppError('User not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
        }

        if (error.code === 'P2002') {
          // Unique constraint violation (probablemente en el username)
          throw new AppError('Username already exists', HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
        }
      }
      throw new AppError('Failed to update user', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Performs soft delete by deactivating user account
   * 
   * @param {string} id - User's unique identifier (UUID)
   * @returns {Promise<boolean>} Promise resolving to true if successful, false if user not found
   * @throws {AppError} Throws DATABASE_ERROR for database-related failures
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
      });

      return true;
    } catch (error) {
      logger.error('Error deleting user', { error, userId: id });
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return false; // User not found
        }
      }
      throw new AppError('Failed to delete user', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Retrieves paginated list of users with filtering and sorting capabilities
   * 
   * @param {QueryOptions} [options={}] - Query options for pagination, filtering, and sorting
   * @param {number} [options.page=1] - Page number for pagination
   * @param {number} [options.limit=20] - Number of items per page
   * @param {string} [options.sortBy='created_at'] - Field to sort by
   * @param {'asc' | 'desc'} [options.sortOrder='desc'] - Sort order
   * @param {object} [options.filters={}] - Filters to apply
   * @param {string} [options.filters.role] - Filter by user role
   * @param {boolean} [options.filters.is_active] - Filter by active status
   * @param {string} [options.filters.search] - Search in email and username fields
   * @returns {Promise<PaginatedResult<User>>} Promise resolving to paginated result with users and pagination metadata
   * @throws {AppError} Throws DATABASE_ERROR for database-related failures
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<User>> {
    try {
      const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', filters = {} } = options;

      const skip = (page - 1) * limit;

      // Map API field names to Prisma field names
      const sortFieldMap: Record<string, string> = {
        'created_at': 'createdAt',
        'updated_at': 'updatedAt',
        'registration_date': 'registrationDate',
        'last_login_date': 'lastLoginDate',
        'country_code': 'countryCode',
        'profile_picture_url': 'profilePictureUrl',
        'is_active': 'isActive',
      };

      const prismaSort = sortFieldMap[sortBy] || sortBy;

      // Build where clause from filters
      const where: any = {};
      if (filters['role']) {
        where.role = filters['role'];
      }
      if (filters['is_active'] !== undefined) {
        where.isActive = filters['is_active'];
      }
      if (filters['search']) {
        where.OR = [
          { email: { contains: filters['search'], mode: 'insensitive' } },
          { username: { contains: filters['search'], mode: 'insensitive' } },
        ];
      }

      // Get total count
      const total = await this.prisma.user.count({ where });

      // Get users
      const users = await this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [prismaSort]: sortOrder },
      });

      const mappedUsers = users.map((user) => this.mapPrismaUserToUser(user));

      return {
        data: mappedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error finding all users', { error, options });
      throw new AppError('Failed to retrieve users', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Updates user password hash securely
   * 
   * @param {string} id - User's unique identifier (UUID)
   * @param {string} passwordHash - New hashed password
   * @returns {Promise<User>} Promise resolving to the updated user object
   * @throws {AppError} Throws NOT_FOUND error if user doesn't exist
   * @throws {AppError} Throws DATABASE_ERROR for other database-related failures
   * 
   * Uses type-safe Prisma operations without unsafe type assertions,
   * ensuring secure password updates with proper type checking and validation.
   */
  async updatePassword(id: string, passwordHash: string): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { passwordHash },
      });

      return this.mapPrismaUserToUser(user);
    } catch (error) {
      logger.error('Error updating user password', { error, userId: id });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          throw new AppError('User not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
        }
      }

      throw new AppError('Failed to update password', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Updates user's last login timestamp for tracking purposes
   * 
   * @param {string} id - User's unique identifier (UUID)
   * @param {Date} [date=new Date()] - Login timestamp (defaults to current date/time)
   * @returns {Promise<User>} Promise resolving to the updated user object
   * @throws {AppError} Throws NOT_FOUND error if user doesn't exist
   * @throws {AppError} Throws DATABASE_ERROR for other database-related failures
   * 
   * Uses type-safe Prisma operations without unsafe type assertions,
   * ensuring reliable timestamp updates with proper type validation.
   */
  async updateLastLogin(id: string, date: Date = new Date()): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: { lastLoginDate: date },
      });

      return this.mapPrismaUserToUser(user);
    } catch (error) {
      logger.error('Error updating user last login', { error, userId: id });

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          // Record not found
          throw new AppError('User not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
        }
      }

      throw new AppError('Failed to update last login', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Maps Prisma user object to application User interface
   * 
   * @private
   * @param {any} prismaUser - Prisma user object from database
   * @returns {User} Mapped user object conforming to application interface
   */
  private mapPrismaUserToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      username: prismaUser.username,
      country_code: prismaUser.countryCode,
      registration_date: prismaUser.registrationDate,
      last_login_date: prismaUser.lastLoginDate,
      profile_picture_url: prismaUser.profilePictureUrl,
      is_active: prismaUser.isActive,
      role: prismaUser.role,
      created_at: prismaUser.createdAt,
      updated_at: prismaUser.updatedAt,
    };
  }
}