// src/shared/middleware/auth.ts

/**
 * Authentication and Authorization Middleware for Single Node Operations
 * 
 * This module provides comprehensive authentication and authorization middleware components
 * for securing Express.js routes within a single node deployment. It implements JWT token
 * verification, role-based access control (RBAC), permission-based authorization, and
 * resource ownership validation to protect API endpoints and enforce security policies.
 * 
 * The authentication system supports multiple authorization patterns including mandatory
 * authentication, optional authentication for public/private content, role-based restrictions,
 * granular permission checking, and resource ownership validation. This flexible approach
 * allows different endpoints to implement appropriate security levels based on their
 * sensitivity and access requirements.
 * 
 * The middleware integrates seamlessly with the WayrApp backend architecture and is used
 * extensively across authentication routes, user management, content management, and other
 * protected API endpoints. It extends the Express Request interface to include user
 * information and provides comprehensive error handling with security logging.
 * 
 * All authentication middleware functions follow the standard Express middleware pattern
 * and can be composed with other middleware for complex authorization scenarios. The
 * system is designed to be secure by default while providing flexibility for different
 * access control requirements.
 * 
 * @module authMiddleware
 * @category Middleware
 * @category Auth
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic authentication for protected routes
 * import { authenticateToken } from '@/shared/middleware/auth';
 * 
 * router.get('/profile', authenticateToken, userController.getProfile);
 * 
 * @example
 * // Role-based access control for admin functions
 * import { authenticateToken, requireRole } from '@/shared/middleware/auth';
 * 
 * router.get('/users', 
 *   authenticateToken, 
 *   requireRole('admin'), 
 *   userController.getAllUsers
 * );
 * 
 * @example
 * // Multiple roles allowed for content management
 * router.post('/courses', 
 *   authenticateToken,
 *   requireRole(['admin', 'content_creator']),
 *   contentController.createCourse
 * );
 * 
 * @example
 * // Permission-based authorization for granular control
 * import { authenticateToken, requirePermission } from '@/shared/middleware/auth';
 * 
 * router.post('/content', 
 *   authenticateToken,
 *   requirePermission('create:content'),
 *   contentController.create
 * );
 * 
 * @example
 * // Optional authentication for public/private content
 * import { optionalAuth } from '@/shared/middleware/auth';
 * 
 * router.get('/courses', optionalAuth, contentController.getCourses);
 * 
 * @example
 * // Resource ownership validation
 * import { authenticateToken, requireOwnership } from '@/shared/middleware/auth';
 * 
 * router.get('/users/:userId/progress', 
 *   authenticateToken,
 *   requireOwnership('userId'),
 *   progressController.getUserProgress
 * );
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { AppError } from './errorHandler';
import { JWTPayload, UserRole, ErrorCodes, HttpStatus } from '@/shared/types';
import { logger } from '@/shared/utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * JWT Payload Validation Schema
 * 
 * Zod schema for validating the structure and content of JWT payloads to ensure
 * tokens contain properly formatted and valid data. This schema validates that:
 * - sub (user ID) is a valid UUID string
 * - email is a properly formatted email address
 * - role is one of the expected UserRole enum values
 * - iat (issued at) is a positive number representing Unix timestamp
 * - exp (expiration) is a positive number representing Unix timestamp
 * 
 * This validation prevents malformed or malicious JWT payloads from being processed
 * by the application, providing defense-in-depth security for authentication.
 */
const JWTPayloadSchema = z.object({
  sub: z.string().uuid('Invalid user ID format in token'),
  email: z.string().email('Invalid email format in token'),
  role: z.enum(['student', 'content_creator', 'admin'], {
    errorMap: () => ({ message: 'Invalid role in token' })
  }),
  iat: z.number().positive('Invalid issued at timestamp in token'),
  exp: z.number().positive('Invalid expiration timestamp in token')
});

/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT access tokens and attaches authenticated user information to the Express
 * request object. This middleware extracts Bearer tokens from the Authorization header,
 * validates them against the JWT secret, and populates req.user with the decoded payload.
 * 
 * The middleware handles various JWT validation scenarios including missing tokens,
 * invalid tokens, expired tokens, and configuration errors. All authentication failures
 * are logged for security monitoring and result in appropriate HTTP error responses.
 * 
 * This middleware is used extensively across protected routes in authentication,
 * user management, and content management endpoints. It serves as the foundation
 * for all authenticated operations in the application.
 * 
 * @param {Request} req - Express request object containing Authorization header
 * @param {Response} _res - Express response object (unused)
 * @param {NextFunction} next - Express next function to continue middleware chain
 * @returns {Promise<void>} Promise that resolves when authentication is complete
 * 
 * @throws {AppError} UNAUTHORIZED (401) - When token is missing, invalid, or expired
 * @throws {AppError} INTERNAL_SERVER_ERROR (500) - When JWT_SECRET is not configured
 * 
 * @example
 * // Protect user profile endpoint
 * router.get('/profile', authenticateToken, userController.getProfile);
 * 
 * @example
 * // Protect logout endpoint
 * router.post('/logout', authenticateToken, authController.logout);
 * 
 * @example
 * // Chain with other middleware for complex authorization
 * router.put('/users/:id/role',
 *   authenticateToken,
 *   requireRole('admin'),
 *   userController.updateUserRole
 * );
 * 
 * @example
 * // Access user information in route handler
 * const protectedHandler = (req: Request, res: Response) => {
 *   const userId = req.user?.sub; // Available after authenticateToken
 *   const userRole = req.user?.role;
 *   // ... handle authenticated request
 * };
 */
export const authenticateToken = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new AppError(
        'Access token required',
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTHENTICATION_ERROR
      );
    }

    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      logger.error('JWT_SECRET environment variable not set');
      throw new AppError(
        'Authentication configuration error',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.INTERNAL_ERROR
      );
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret);

    // Validate JWT payload structure and content
    const validationResult = JWTPayloadSchema.safeParse(decoded);
    
    if (!validationResult.success) {
      logger.warn('Invalid JWT payload structure', {
        error: validationResult.error.flatten(),
        tokenId: (decoded as any)?.jti || 'unknown'
      });
      throw new AppError(
        'Invalid token payload',
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTHENTICATION_ERROR
      );
    }

    // Attach validated user info to request
    req.user = validationResult.data;

    logger.debug('Token verified successfully', {
      userId: validationResult.data.sub,
      role: validationResult.data.role
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid JWT token', { error: error.message });
      next(new AppError(
        'Invalid access token',
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTHENTICATION_ERROR
      ));
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Expired JWT token', { error: error.message });
      next(new AppError(
        'Access token expired',
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTHENTICATION_ERROR
      ));
    } else {
      next(error);
    }
  }
};

/**
 * Role-Based Access Control Middleware Factory
 * 
 * Creates middleware that enforces role-based access control by validating that the
 * authenticated user has one of the required roles. This middleware must be used after
 * authenticateToken as it depends on req.user being populated with user information.
 * 
 * The middleware supports both single role and multiple role authorization patterns,
 * allowing flexible access control for different endpoint requirements. Failed
 * authorization attempts are logged with user and role information for security auditing.
 * 
 * This middleware is used extensively in admin-only endpoints and content management
 * routes where different user roles have different levels of access to functionality.
 * 
 * @param {UserRole | UserRole[]} allowedRoles - Single role or array of roles that can access the endpoint
 * @returns {Function} Express middleware function that validates user roles
 * 
 * @throws {AppError} UNAUTHORIZED (401) - When user is not authenticated
 * @throws {AppError} FORBIDDEN (403) - When user role is not in allowed roles
 * 
 * @example
 * // Admin-only endpoint
 * router.get('/users', 
 *   authenticateToken,
 *   requireRole('admin'),
 *   userController.getAllUsers
 * );
 * 
 * @example
 * // Multiple roles allowed for content creation
 * router.post('/courses',
 *   authenticateToken,
 *   requireRole(['admin', 'content_creator']),
 *   contentController.createCourse
 * );
 * 
 * @example
 * // Content creator and admin can update content
 * router.put('/courses/:id',
 *   authenticateToken,
 *   requireRole(['admin', 'content_creator']),
 *   contentController.updateCourse
 * );
 * 
 * @example
 * // Role hierarchy in practice
 * // student: basic access
 * // content_creator: can create/edit content
 * // admin: full system access
 * router.delete('/courses/:id',
 *   authenticateToken,
 *   requireRole('admin'), // Only admins can delete
 *   contentController.deleteCourse
 * );
 */
export const requireRole = (allowedRoles: UserRole | UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError(
          'Authentication required',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      const userRole = req.user.role;
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!roles.includes(userRole)) {
        logger.warn('Access denied - insufficient permissions', {
          userId: req.user.sub,
          userRole,
          requiredRoles: roles
        });

        throw new AppError(
          'Insufficient permissions',
          HttpStatus.FORBIDDEN,
          ErrorCodes.AUTHORIZATION_ERROR
        );
      }

      logger.debug('Role authorization successful', {
        userId: req.user.sub,
        userRole,
        requiredRoles: roles
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Permission-Based Access Control System
 * 
 * Defines granular permissions for each user role, enabling fine-grained access control
 * beyond simple role-based authorization. This system allows for more precise security
 * policies where specific actions can be controlled independently of user roles.
 * 
 * The permission system follows a hierarchical structure where higher-level roles
 * inherit permissions from lower-level roles and add additional capabilities:
 * - Students: Basic read access to courses and own data
 * - Content Creators: Student permissions plus content creation and analytics
 * - Admins: All permissions including user management and system administration
 * 
 * Permission mappings for each user role
 * @property {string[]} student - Basic permissions for student users
 * @property {string[]} content_creator - Extended permissions for content creators
 * @property {string[]} admin - Full permissions for administrators
 * 
 * @example
 * // Check if a role has a specific permission
 * const userPermissions = PERMISSIONS[userRole];
 * const canCreateContent = userPermissions.includes('create:content');
 * 
 * @example
 * // Permission naming convention: action:resource
 * // read:courses - Can read course information
 * // create:content - Can create new content
 * // manage:users - Can manage user accounts
 * // update:own_profile - Can update own profile only
 */
export const PERMISSIONS = {
  'student': [
    'read:courses',
    'read:own_progress',
    'update:own_progress',
    'update:own_profile'
  ],
  'content_creator': [
    'read:courses',
    'read:own_progress',
    'update:own_progress',
    'update:own_profile',
    'create:content',
    'update:content',
    'read:analytics'
  ],
  'admin': [
    'read:courses',
    'read:own_progress',
    'update:own_progress',
    'update:own_profile',
    'create:content',
    'update:content',
    'read:analytics',
    'delete:content',
    'manage:users',
    'read:all_progress'
  ]
} as const;

export type Permission = typeof PERMISSIONS[UserRole][number];

/**
 * Permission-Based Authorization Middleware Factory
 * 
 * Creates middleware that enforces granular permission-based access control by validating
 * that the authenticated user's role includes the required permission. This provides more
 * fine-grained authorization than role-based access control alone.
 * 
 * The middleware checks the user's role against the PERMISSIONS mapping to determine if
 * the specific permission is granted. This allows for precise control over individual
 * actions while maintaining the role-based hierarchy.
 * 
 * This middleware is ideal for scenarios where different aspects of functionality need
 * different access levels, such as separating read and write permissions or controlling
 * access to specific features within a role.
 * 
 * @param {Permission} permission - Specific permission required to access the endpoint
 * @returns {Function} Express middleware function that validates user permissions
 * 
 * @throws {AppError} UNAUTHORIZED (401) - When user is not authenticated
 * @throws {AppError} FORBIDDEN (403) - When user role does not include required permission
 * 
 * @example
 * // Require specific permission for content creation
 * router.post('/content',
 *   authenticateToken,
 *   requirePermission('create:content'),
 *   contentController.create
 * );
 * 
 * @example
 * // Separate read and write permissions
 * router.get('/analytics',
 *   authenticateToken,
 *   requirePermission('read:analytics'),
 *   analyticsController.getAnalytics
 * );
 * 
 * @example
 * // User management requires specific permission
 * router.post('/users',
 *   authenticateToken,
 *   requirePermission('manage:users'),
 *   userController.createUser
 * );
 * 
 * @example
 * // Fine-grained content permissions
 * router.delete('/content/:id',
 *   authenticateToken,
 *   requirePermission('delete:content'),
 *   contentController.deleteContent
 * );
 */
export const requirePermission = (permission: Permission) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError(
          'Authentication required',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      const userRole = req.user.role;
      const userPermissions = PERMISSIONS[userRole];

      if (!userPermissions.includes(permission as any)) {
        logger.warn('Access denied - missing permission', {
          userId: req.user.sub,
          userRole,
          requiredPermission: permission
        });

        throw new AppError(
          `Permission '${permission}' required`,
          HttpStatus.FORBIDDEN,
          ErrorCodes.AUTHORIZATION_ERROR
        );
      }

      logger.debug('Permission check successful', {
        userId: req.user.sub,
        userRole,
        permission
      });

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Optional Authentication Middleware
 * 
 * Provides optional authentication that attaches user information to the request if a
 * valid JWT token is present, but allows the request to continue even without authentication.
 * This middleware is useful for endpoints that provide different content or functionality
 * based on whether a user is authenticated.
 * 
 * Unlike authenticateToken, this middleware does not throw errors for missing or invalid
 * tokens. Instead, it silently ignores authentication failures and continues processing.
 * This allows endpoints to serve both public and personalized content based on authentication status.
 * 
 * The middleware is ideal for public endpoints that can provide enhanced functionality
 * for authenticated users, such as personalized course recommendations or user-specific
 * progress information while still serving basic content to anonymous users.
 * 
 * @param {Request} req - Express request object that may contain Authorization header
 * @param {Response} _res - Express response object (unused)
 * @param {NextFunction} next - Express next function to continue middleware chain
 * @returns {Promise<void>} Promise that resolves when optional authentication is complete
 * 
 * @example
 * // Public endpoint with optional personalization
 * router.get('/courses', optionalAuth, (req, res) => {
 *   if (req.user) {
 *     // Return personalized course recommendations
 *     return res.json(getPersonalizedCourses(req.user.sub));
 *   }
 *   // Return public course list
 *   return res.json(getPublicCourses());
 * });
 * 
 * @example
 * // Content that shows different information for authenticated users
 * router.get('/lessons/:id', optionalAuth, (req, res) => {
 *   const lesson = getLessonById(req.params.id);
 *   if (req.user) {
 *     // Include user progress and personalized hints
 *     lesson.progress = getUserProgress(req.user.sub, req.params.id);
 *     lesson.hints = getPersonalizedHints(req.user.sub);
 *   }
 *   res.json(lesson);
 * });
 * 
 * @example
 * // API endpoint that works for both public and authenticated access
 * router.get('/search', optionalAuth, (req, res) => {
 *   const results = searchContent(req.query.q);
 *   if (req.user) {
 *     // Add user-specific ranking and filtering
 *     results.forEach(result => {
 *       result.relevanceScore = calculatePersonalizedScore(result, req.user);
 *     });
 *   }
 *   res.json(results);
 * });
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const jwtSecret = process.env['JWT_SECRET'];
    if (!jwtSecret) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      
      // Validate JWT payload structure for optional auth as well
      const validationResult = JWTPayloadSchema.safeParse(decoded);
      
      if (validationResult.success) {
        req.user = validationResult.data;
        logger.debug('Optional auth - token verified', { userId: validationResult.data.sub });
      } else {
        logger.debug('Optional auth - invalid token payload ignored', { 
          error: validationResult.error.flatten() 
        });
      }
    } catch (error: any) {
      // Ignore token errors for optional auth
      logger.debug('Optional auth - invalid token ignored', { error: error.message });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Resource Ownership Validation Middleware Factory
 * 
 * Creates middleware that enforces resource ownership by ensuring users can only access
 * resources that belong to them. This middleware compares the authenticated user's ID
 * with a user ID parameter in the request URL to validate ownership.
 * 
 * The middleware includes an admin override that allows administrators to access any
 * resource regardless of ownership, providing necessary administrative capabilities
 * while maintaining security for regular users.
 * 
 * This middleware is essential for protecting user-specific data such as progress
 * tracking, personal profiles, and private content. It prevents users from accessing
 * other users' sensitive information through URL manipulation.
 * 
 * @param {string} [userIdParam='userId'] - Name of the URL parameter containing the resource owner's user ID
 * @returns {Function} Express middleware function that validates resource ownership
 * 
 * @throws {AppError} UNAUTHORIZED (401) - When user is not authenticated
 * @throws {AppError} FORBIDDEN (403) - When user tries to access another user's resources
 * 
 * @example
 * // Protect user progress data
 * router.get('/users/:userId/progress',
 *   authenticateToken,
 *   requireOwnership('userId'),
 *   progressController.getUserProgress
 * );
 * 
 * @example
 * // Protect user profile updates
 * router.put('/users/:id/profile',
 *   authenticateToken,
 *   requireOwnership('id'),
 *   userController.updateProfile
 * );
 * 
 * @example
 * // Custom parameter name for ownership validation
 * router.get('/profiles/:profileUserId/settings',
 *   authenticateToken,
 *   requireOwnership('profileUserId'),
 *   profileController.getSettings
 * );
 * 
 * @example
 * // Admin override allows access to any resource
 * router.get('/users/:userId/progress',
 *   authenticateToken,
 *   requireOwnership('userId'), // Admins can access any user's progress
 *   progressController.getUserProgress
 * );
 * 
 * @example
 * // Typical usage pattern for user-specific endpoints
 * router.delete('/users/:userId/data',
 *   authenticateToken,
 *   requireOwnership('userId'),
 *   (req, res) => {
 *     // User can only delete their own data
 *     // Admins can delete any user's data
 *     deleteUserData(req.params.userId);
 *     res.json({ success: true });
 *   }
 * );
 */
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError(
          'Authentication required',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      const resourceUserId = req.params[userIdParam];
      const currentUserId = req.user.sub;

      // Admins can access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      if (resourceUserId !== currentUserId) {
        logger.warn('Access denied - resource ownership violation', {
          userId: currentUserId,
          resourceUserId,
          userRole: req.user.role
        });

        throw new AppError(
          'Access denied - you can only access your own resources',
          HttpStatus.FORBIDDEN,
          ErrorCodes.AUTHORIZATION_ERROR
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};