// src/modules/users/controllers/userController.ts

/**
 * Comprehensive HTTP API controller for user profile management and administrative operations.
 * 
 * This controller provides a complete REST API for managing user profiles, password updates,
 * and administrative user operations in the WayrApp language learning platform. It handles
 * all HTTP request/response operations for user-related functionality, including profile
 * management, password changes, and administrative user listing and role management.
 * 
 * The controller implements proper authentication validation, comprehensive input validation
 * using Zod schemas, structured error handling with appropriate HTTP status codes, and
 * detailed logging for audit trails. It follows RESTful conventions and provides both
 * user-facing endpoints for profile management and administrative endpoints with role-based
 * access control.
 * 
 * Key features include automatic user authentication validation, comprehensive request/response
 * validation, structured JSON responses with consistent formatting, proper HTTP status code
 * usage, role-based authorization for administrative functions, and detailed logging for
 * monitoring and security auditing purposes.
 * 
 * The controller serves as the presentation layer in the clean architecture pattern, handling
 * HTTP concerns while delegating business logic to the UserService layer. All endpoints
 * require authentication, with administrative endpoints requiring elevated permissions.
 * 
 * The controller implements comprehensive security measures including role-based access control,
 * input validation, and defense-in-depth authorization checks to ensure system security.
 * 
 * @module UserController
 * @category Users
 * @category Controllers
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Initialize controller with service dependency
 * const userService = new UserService(userRepository);
 * const userController = new UserController(userService);
 * 
 * // Register routes with Express router
 * router.get('/profile', authenticateToken, userController.getProfile);
 * router.put('/profile', authenticateToken, userController.updateProfile);
 * router.get('/', authenticateToken, requireRole('admin'), userController.getAllUsers);
 */

import { NextFunction, Request, Response } from 'express';
import { AppError, asyncHandler } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus, ApiResponse, QueryOptions } from '@/shared/types';
import { UserQueryParams } from '@/shared/schemas';
import { logger } from '@/shared/utils/logger';
import { UserService } from '../services/userService';
import { UpdateUserSchema, UpdatePasswordSchema, AllowedProfileUpdateDto } from '../types';

/**
 * HTTP API controller for user profile management operations.
 * 
 * @class UserController
 */
export class UserController {
  /**
   * Creates an instance of UserController.
   * 
   * @param {UserService} userService - Service layer for user business logic
   */
  constructor(private userService: UserService) { }

  /**
   * Retrieves the current authenticated user's profile information.
   * 
   * Handles GET /api/users/profile endpoint. Requires authentication.
   * 
   * @param {Request} req - Express request object containing user authentication data
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when response is sent
   * 
   * @example
   * // Response format:
   * {
   *   "success": true,
   *   "timestamp": "2025-01-01T10:00:00Z",
   *   "data": {
   *     "id": "user-123",
   *     "email": "user@example.com",
   *     "username": "johndoe",
   *     "role": "student",
   *     "is_active": true,
   *     "registration_date": "2025-01-01T09:00:00Z"
   *   }
   * }
   */
  getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTHENTICATION_ERROR
      );
    }

    const userId = req.user.sub;

    // Service will throw an error if user is not found
    const user = await this.userService.getUserProfile(userId);

    const response: ApiResponse<typeof user> = {
      success: true,
      timestamp: new Date().toISOString(),
      data: user
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * Updates the current authenticated user's profile information.
   * 
   * Handles PUT /api/users/profile endpoint. Requires authentication.
   * Implements whitelist pattern for security hardening.
   * 
   * @param {Request} req - Express request object with profile updates in body
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when response is sent
   * 
   * @example
   * // Request body:
   * {
   *   "username": "newusername",
   *   "country_code": "US",
   *   "profile_picture_url": "https://example.com/avatar.jpg"
   * }
   */
  updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTHENTICATION_ERROR
      );
    }

    const userId = req.user.sub;

    // Validate request body
    const validatedData = UpdateUserSchema.parse(req.body);

    // --- START OF REPLACEMENT BLOCK ---

    // Define the single source of truth for allowed fields
    const allowedKeys: (keyof AllowedProfileUpdateDto)[] = ['username', 'country_code', 'profile_picture_url'];

    // Create the clean DTO using a functional approach
    const allowedProfileUpdate = Object.keys(validatedData)
      .filter(key => allowedKeys.includes(key as keyof AllowedProfileUpdateDto))
      .reduce((obj, key) => {
        const typedKey = key as keyof AllowedProfileUpdateDto;
        // Ensure we don't copy over undefined values
        if (validatedData[typedKey] !== undefined) {
          obj[typedKey] = validatedData[typedKey];
        }
        return obj;
      }, {} as AllowedProfileUpdateDto);

    // Log any attempts to modify unauthorized fields by comparing key sets
    const validatedKeys = new Set(Object.keys(validatedData));
    const unauthorizedFields = [...validatedKeys].filter(key => !allowedKeys.includes(key as any));

    if (unauthorizedFields.length > 0) {
      logger.warn('Unauthorized field modification attempt detected in profile update', {
        userId,
        unauthorizedFields,
        timestamp: new Date().toISOString()
      });
    }

    // Service will throw an error if user is not found or update fails
    const updatedUser = await this.userService.updateUser(userId, allowedProfileUpdate);

    // --- END OF REPLACEMENT BLOCK ---

    logger.info('User profile updated', { userId });

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Profile updated successfully',
      data: updatedUser
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * Updates the current authenticated user's password.
   * 
   * Handles PUT /api/users/password endpoint. Requires authentication and current password verification.
   * 
   * @param {Request} req - Express request object with password change data in body
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when response is sent
   * 
   * @example
   * // Request body:
   * {
   *   "current_password": "OldPassword123!",
   *   "new_password": "NewPassword456!"
   * }
   */
  updatePassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTHENTICATION_ERROR
      );
    }

    const userId = req.user.sub;

    // Validate request body
    const validatedData = UpdatePasswordSchema.parse(req.body);
    const { current_password, new_password } = validatedData;

    // Service will throw an error if current password is incorrect or user is not found
    await this.userService.updatePassword(userId, current_password, new_password);

    logger.info('User password updated successfully', {
      userId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Password updated successfully',
      data: { message: 'Password updated successfully' }
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * Retrieves paginated list of all users with filtering and sorting options (administrative function).
   * 
   * Handles GET /api/users endpoint. Requires admin role.
   * Supports query parameters for pagination, filtering, and sorting.
   * 
   * @param {Request} req - Express request object with query parameters for filtering and pagination
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when response is sent
   * 
   * @example
   * // Query parameters:
   * // ?page=1&limit=20&role=student&is_active=true&search=john&sortBy=created_at&sortOrder=desc
   */
  getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Defense-in-depth: Explicit admin role check
    if (req.user?.role !== 'admin') {
      throw new AppError('Insufficient permissions', HttpStatus.FORBIDDEN, ErrorCodes.AUTHORIZATION_ERROR);
    }

    // The query is already validated, typed, and transformed by the middleware.
    // We just need to structure it for the service layer.
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      role,
      is_active,
      search
    } = req.query as unknown as UserQueryParams;

    const queryOptions: QueryOptions = {
      page,
      limit,
      sortBy,
      sortOrder,
      filters: {
        // Only add filters if they are not undefined
        ...(role !== undefined && { role }),
        ...(is_active !== undefined && { is_active }),
        ...(search !== undefined && { search }),
      }
    };

    const users = await this.userService.findAll(queryOptions);

    const response: ApiResponse<typeof users> = {
      success: true,
      timestamp: new Date().toISOString(),
      data: users
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * Retrieves detailed information for a specific user by ID (administrative function).
   * 
   * Handles GET /api/users/:id endpoint. Requires admin role.
   * 
   * @param {Request} req - Express request object with user ID in params
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when response is sent
   */
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Defense-in-depth: Explicit admin role check
    if (req.user?.role !== 'admin') {
      throw new AppError('Insufficient permissions', HttpStatus.FORBIDDEN, ErrorCodes.AUTHORIZATION_ERROR);
    }

    const userId = req.params['id'];
    if (!userId) {
      throw new AppError(
        'User ID is required',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }



    // Service will throw an error if user is not found
    const user = await this.userService.getUserProfile(userId);

    const response: ApiResponse<typeof user> = {
      success: true,
      timestamp: new Date().toISOString(),
      data: user
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * Updates a specific user's role (administrative function).
   * 
   * Handles PUT /api/users/:id/role endpoint. Requires admin role.
   * 
   * @param {Request} req - Express request object with user ID in params and role data in body
   * @param {Response} res - Express response object
   * @returns {Promise<void>} Promise that resolves when response is sent
   * 
   * @example
   * // Request body:
   * {
   *   "role": "content_creator"
   * }
   */
  updateUserRole = asyncHandler(async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    // Defense-in-depth: Explicit admin role check
    if (req.user?.role !== 'admin') {
      throw new AppError('Insufficient permissions', HttpStatus.FORBIDDEN, ErrorCodes.AUTHORIZATION_ERROR);
    }

    const { id: userId } = req.params;
    const { role } = req.body;

    if (!userId) {
      throw new AppError('User ID is required', HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR);
    }

    // Prevent admin from changing their own role
    if (req.user.sub === userId) {
      throw new AppError(
        'Administrators cannot change their own role to prevent self-lockout.',
        HttpStatus.FORBIDDEN,
        ErrorCodes.AUTHORIZATION_ERROR
      );
    }

    // TODO: Implement role hierarchy validation in the future.
    // For example, an admin should not be able to create another admin with higher privileges.

    // Service will throw an error if user is not found or update fails
    const updatedUser = await this.userService.updateUser(userId, { role });

    logger.info('User role updated', { userId, role });

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'User role updated successfully',
      data: updatedUser
    };

    res.status(HttpStatus.OK).json(response);
  });
}