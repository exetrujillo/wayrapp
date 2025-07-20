/**
 * User Repository
 * Data access layer for user operations using Prisma
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { User, CreateUserDto, UpdateUserDto } from '../types';
import { AppError } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus, QueryOptions, PaginatedResult } from '@/shared/types';
import { logger } from '@/shared/utils/logger';

export class UserRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create a new user
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
   * Create a new user with password
   */
  async createWithPassword(userData: CreateUserDto & { passwordHash: string }): Promise<User> {
    try {
      // Create the data object with type safety
      const data: Prisma.UserCreateInput = {
        email: userData.email,
        username: userData.username ?? null,
        countryCode: userData.country_code ?? null,
        profilePictureUrl: userData.profile_picture_url ?? null,
        role: userData.role || 'student',
      };
      
      // Add passwordHash using type assertion
      const userDataWithPassword = {
        ...data,
        passwordHash: userData.passwordHash
      } as Prisma.UserCreateInput;

      const user = await this.prisma.user.create({
        data: userDataWithPassword
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
   * Find user by ID
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
   * Find user by ID with password hash
   */
  async findByIdWithPassword(id: string): Promise<(User & { password_hash: string | null }) | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!user) return null;

      // Use type assertion to access the passwordHash property
      const userWithPassword = user as unknown as { passwordHash: string | null };

      return {
        ...this.mapPrismaUserToUser(user),
        password_hash: userWithPassword.passwordHash,
      };
    } catch (error) {
      logger.error('Error finding user with password by ID', { error, userId: id });
      throw new AppError('Failed to find user', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Find user by email
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
   * Find user by email with password hash
   */
  async findByEmailWithPassword(email: string): Promise<(User & { password_hash: string | null }) | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;

      // Use type assertion to access the passwordHash property
      const userWithPassword = user as unknown as { passwordHash: string | null };

      return {
        ...this.mapPrismaUserToUser(user),
        password_hash: userWithPassword.passwordHash,
      };
    } catch (error) {
      logger.error('Error finding user with password by email', { error, email });
      throw new AppError('Failed to find user', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.DATABASE_ERROR);
    }
  }

  /**
   * Find user by username
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
   * Update user
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
   * Delete user (soft delete by deactivating)
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
   * Find all users with pagination
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<User>> {
    try {
      const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', filters = {} } = options;

      const skip = (page - 1) * limit;

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
        orderBy: { [sortBy]: sortOrder },
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
   * Update user password
   */
  async updatePassword(id: string, passwordHash: string): Promise<User> {
    try {
      // Use type assertion for the data object
      const updateData = { passwordHash } as unknown as Prisma.UserUpdateInput;
      
      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
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
   * Update user's last login timestamp
   */
  async updateLastLogin(id: string, date: Date = new Date()): Promise<User> {
    try {
      // Use type assertion for the data object
      const updateData = { lastLoginDate: date } as unknown as Prisma.UserUpdateInput;
      
      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
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
   * Map Prisma user object to User interface
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