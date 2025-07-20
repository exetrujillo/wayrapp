/**
 * User Service
 * Business logic for user management and authentication
 */

import { User, CreateUserDto, UpdateUserDto } from '../types';
import { UserRepository } from '../repositories/userRepository';

import { AppError } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus, QueryOptions, PaginatedResult } from '@/shared/types';
import { logger } from '@/shared/utils/logger';

export class UserService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findByUsername(username);
  }

  /**
   * Create new user
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
   * Update user
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
   * Create new user with password hashing
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
   * Verify user password against stored hash
   */
  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user || !user.password_hash) {
      return false;
    }

    const { comparePassword } = await import('@/shared/utils/auth');
    return comparePassword(password, user.password_hash);
  }
  
  /**
   * Verify user by email and password
   * Returns the user if credentials are valid, null otherwise
   */
  async verifyUserByEmail(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user || !user.password_hash) {
      return null;
    }

    const { comparePassword } = await import('@/shared/utils/auth');
    const isPasswordValid = await comparePassword(password, user.password_hash);
    
    if (!isPasswordValid) {
      return null;
    }
    
    return user;
  }

  /**
   * Update user's last login timestamp
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
   * Deactivate user account
   */
  async deactivateUser(id: string): Promise<User> {
    const user = await this.updateUser(id, { is_active: false });

    logger.info('User account deactivated', { userId: id });

    return user;
  }

  /**
   * Activate user account
   */
  async activateUser(id: string): Promise<User> {
    const user = await this.updateUser(id, { is_active: true });

    logger.info('User account activated', { userId: id });

    return user;
  }

  /**
   * Check if user exists
   */
  async userExists(id: string): Promise<boolean> {
    const user = await this.findById(id);
    return !!user;
  }

  /**
   * Find all users with pagination and filtering
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<User>> {
    return this.userRepository.findAll(options);
  }

  /**
   * Update user password
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
   * Get user profile (safe version without sensitive data)
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