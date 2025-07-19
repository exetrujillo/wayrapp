/**
 * User Service
 * Business logic for user management and authentication
 */

import { User, CreateUserDto, UpdateUserDto } from '../types';
import { UserRepository } from '../repositories/userRepository';

import { AppError } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus } from '@/shared/types';
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
   * Verify user password
   * Note: This is a placeholder implementation
   * In a real app, you'd store password hashes and compare them
   */
  async verifyPassword(userId: string, _password: string): Promise<boolean> {
    // This is a placeholder implementation
    // In a real application, you would:
    // 1. Retrieve the password hash from the database
    // 2. Compare the provided password with the hash using bcrypt
    
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return false;
    }

    // For now, we'll assume password verification is handled elsewhere
    // or that the user object contains the password hash
    // This would typically be: return comparePassword(password, user.password_hash);
    
    logger.warn('Password verification not fully implemented - using placeholder');
    return true; // Placeholder - always returns true for now
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: string): Promise<void> {
    // This would typically update a last_login field in the database
    // For now, we'll just log it
    logger.info('User last login updated', { userId });
    
    // Placeholder implementation
    // await this.userRepository.updateLastLogin(userId, new Date());
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
   * Get user profile (safe version without sensitive data)
   */
  async getUserProfile(id: string): Promise<Omit<User, 'password_hash'> | null> {
    const user = await this.findById(id);
    if (!user) {
      return null;
    }

    // Return user without sensitive fields
    return {
      id: user.id,
      email: user.email,
      username: user.username ?? '', // if it's null, it becomes a void string.
      country_code: user.country_code ?? '', // Same here.
      registration_date: user.registration_date,
      profile_picture_url: user.profile_picture_url ?? '', // And here.
      is_active: user.is_active,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }
}