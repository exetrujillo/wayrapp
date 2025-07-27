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
 * Note: This controller contains several security audit comments (SECURITY_AUDIT_TODO) that
 * identify areas requiring security enhancements, including missing authorization checks,
 * input validation improvements, and rate limiting implementations.
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
import { ErrorCodes, HttpStatus, ApiResponse } from '@/shared/types';
import { logger } from '@/shared/utils/logger';
import { UserService } from '../services/userService';
import { UpdateUserSchema, UpdatePasswordSchema, UpdateUserDto } from '../types';

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

    // SECURITY_AUDIT_TODO: No validation of req.user.sub format or type.
    // Risk: Malformed user IDs from JWT could cause database errors or injection attacks.
    // Remediation: Validate userId format (UUID, length, allowed characters) before using in database queries.
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

    // SECURITY_AUDIT_TODO: No check to prevent users from updating sensitive fields they shouldn't modify.
    // Risk: If UpdateUserDto includes fields like 'role', 'is_active', or 'created_at', users could modify their own privileges.
    // Remediation: Filter validatedData to only include user-modifiable fields (name, email, preferences) before service call.

    // Service will throw an error if user is not found or update fails
    const updatedUser = await this.userService.updateUser(userId, validatedData as UpdateUserDto);

    // SECURITY_AUDIT_TODO: Logging user data without sanitization could expose sensitive information.
    // Risk: If updatedUser contains PII or sensitive data, it could be logged and stored insecurely.
    // Remediation: Log only non-sensitive identifiers and avoid logging full user objects.
    logger.info('User profile updated', { userId });

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      timestamp: new Date().toISOString(),
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

    // SECURITY_AUDIT_TODO: No rate limiting specifically for password change attempts.
    // Risk: Attackers could brute force current passwords or cause account lockout through repeated attempts.
    // Remediation: Implement stricter rate limiting for password change endpoints (e.g., 3 attempts per hour per user).

    // Service will throw an error if current password is incorrect or user is not found
    await this.userService.updatePassword(userId, current_password, new_password);

    // SECURITY_AUDIT_TODO: Password change events should be logged with more security context.
    // Risk: Insufficient audit trail for password changes makes it difficult to detect unauthorized access.
    // Remediation: Log additional context like IP address, user agent, and timestamp for security monitoring.
    logger.info('User password updated', { userId });

    const response: ApiResponse<{ message: string }> = {
      success: true,
      timestamp: new Date().toISOString(),
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
    // SECURITY_AUDIT_TODO: Missing authorization check for admin-only endpoint.
    // This endpoint is marked as "admin only" but lacks role-based access control validation.
    // Risk: Any authenticated user could access sensitive user data from all system users.
    // Remediation: Add middleware or check: if (req.user?.role !== 'admin') throw new AppError('Forbidden', 403);

    // Parse query parameters
    // SECURITY_AUDIT_TODO: No input validation on pagination parameters could lead to DoS attacks.
    // Risk: Malicious users could request extremely large page sizes or negative values causing system overload.
    // Remediation: Validate page >= 1, limit between 1-100, and sanitize all query parameters.
    const page = req.query['page'] ? parseInt(req.query['page'] as string) : 1;
    const limit = req.query['limit'] ? parseInt(req.query['limit'] as string) : 20;
    // SECURITY_AUDIT_TODO: sortBy parameter is not validated against allowed columns.
    // Risk: Could lead to information disclosure if internal column names are exposed or cause errors.
    // Remediation: Validate sortBy against whitelist of allowed columns: ['created_at', 'email', 'username', 'role'].
    const sortBy = req.query['sortBy'] as string || 'created_at';
    const sortOrder = (req.query['sortOrder'] as 'asc' | 'desc') || 'desc';

    // Parse filters
    // SECURITY_AUDIT_TODO: Search parameter is not sanitized and could lead to injection attacks.
    // Risk: Malicious search terms could be used for NoSQL injection or cause information disclosure.
    // Remediation: Sanitize search input, validate role against enum values, and escape special characters.
    const filters: Record<string, any> = {};
    if (req.query['role']) filters['role'] = req.query['role'];
    if (req.query['is_active'] !== undefined) {
      filters['is_active'] = req.query['is_active'] === 'true';
    }
    if (req.query['search']) filters['search'] = req.query['search'];

    // Service will handle any errors (e.g., database connection issues)
    const users = await this.userService.findAll({
      page,
      limit,
      sortBy,
      sortOrder,
      filters
    });

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
    // SECURITY_AUDIT_TODO: Missing authorization check for admin-only endpoint.
    // This endpoint is marked as "admin only" but lacks role-based access control validation.
    // Risk: Any authenticated user could access other users' detailed profile information.
    // Remediation: Add middleware or check: if (req.user?.role !== 'admin') throw new AppError('Forbidden', 403);

    const userId = req.params['id'];
    if (!userId) {
      throw new AppError(
        'User ID is required',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // SECURITY_AUDIT_TODO: User ID parameter is not validated for format/type.
    // Risk: Malformed IDs could cause database errors or be used for injection attacks.
    // Remediation: Validate userId format (UUID, length, allowed characters) before database query.

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
    // SECURITY_AUDIT_TODO: Missing authorization check for admin-only endpoint.
    // This endpoint allows role modification but lacks proper access control validation.
    // Risk: Any authenticated user could potentially escalate privileges or modify other users' roles.
    // Remediation: Add middleware or check: if (req.user?.role !== 'admin') throw new AppError('Forbidden', 403);

    const { id: userId } = req.params;
    const { role } = req.body;

    if (!userId) {
      throw new AppError('User ID is required', HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR);
    }

    // SECURITY_AUDIT_TODO: Role parameter is not validated against allowed role values.
    // Risk: Invalid or malicious role values could be stored in database causing authorization bypass.
    // Remediation: Validate role against enum/whitelist: ['student', 'instructor', 'admin'].

    // SECURITY_AUDIT_TODO: No prevention of self-role modification.
    // Risk: Admin users could accidentally lock themselves out by changing their own role.
    // Remediation: Add check: if (req.user?.sub === userId) throw new AppError('Cannot modify own role', 403).

    // SECURITY_AUDIT_TODO: No role hierarchy validation.
    // Risk: Lower-privilege admins could assign roles higher than their own authorization level.
    // Remediation: Implement role hierarchy checks before allowing role assignment.

    // Service will throw an error if user is not found or update fails
    const updatedUser = await this.userService.updateUser(userId, { role });

    logger.info('User role updated', { userId, role });

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      timestamp: new Date().toISOString(),
      data: updatedUser
    };

    res.status(HttpStatus.OK).json(response);
  });
}