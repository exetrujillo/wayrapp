/**
 * User Controller
 * Handles user profile management endpoints
 */

import { NextFunction, Request, Response } from 'express';
import { AppError, asyncHandler } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus, ApiResponse } from '@/shared/types';
import { logger } from '@/shared/utils/logger';
import { UserService } from '../services/userService';
import { UpdateUserSchema, UpdatePasswordSchema, UpdateUserDto } from '../types';

export class UserController {
  constructor(private userService: UserService) { }

  /**
   * Get user profile
   * GET /api/users/profile
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
    const user = await this.userService.getUserProfile(userId);

    if (!user) {
      throw new AppError(
        'User not found',
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );
    }

    const response: ApiResponse<typeof user> = {
      success: true,
      timestamp: new Date().toISOString(),
      data: user
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * Update user profile
   * PUT /api/users/profile
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
   * Update user password
   * PUT /api/users/password
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
   * Get all users (admin only)
   * GET /api/users
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
   * Get user by ID (admin only)
   * GET /api/users/:id
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
    const user = await this.userService.getUserProfile(userId);

    if (!user) {
      throw new AppError(
        'User not found',
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );
    }

    const response: ApiResponse<typeof user> = {
      success: true,
      timestamp: new Date().toISOString(),
      data: user
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * Update user role (admin only)
   * PUT /api/users/:id/role
   */
  updateUserRole = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // SECURITY_AUDIT_TODO: Missing authorization check for admin-only endpoint.
    // This endpoint allows role modification but lacks proper access control validation.
    // Risk: Any authenticated user could potentially escalate privileges or modify other users' roles.
    // Remediation: Add middleware or check: if (req.user?.role !== 'admin') throw new AppError('Forbidden', 403);

    const { id: userId } = req.params; // Saca el id de los parámetros
    const { role } = req.body; // Saca el rol del body

    if (!userId) {
      // Usamos return next() para asegurar que la función se detiene aquí
      return next(new AppError('User ID is required', HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR));
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

    // Llama a updateUser directamente. El servicio updateUser ya debería
    // comprobar si el usuario existe y lanzar un error si no.
    // Esto simplifica el controlador y evita llamar a la DB dos veces.
    const updatedUser = await this.userService.updateUser(userId, { role });

    // La comprobación de si el usuario existe se delega al servicio,
    // que es donde pertenece la lógica de negocio. Si updateUser falla,
    // el asyncHandler lo atrapará y lo pasará a next().

    logger.info('User role updated', { userId, role });

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      timestamp: new Date().toISOString(),
      data: updatedUser
    };

    res.status(HttpStatus.OK).json(response);
  });
}