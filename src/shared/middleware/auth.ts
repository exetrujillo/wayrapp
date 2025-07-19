/**
 * Authentication and Authorization Middleware
 * JWT token verification and role-based access control
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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
 * JWT Authentication Middleware
 * Verifies JWT token and attaches user info to request
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
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Attach user info to request
    req.user = decoded;
    
    logger.debug('Token verified successfully', { 
      userId: decoded.sub,
      role: decoded.role 
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
 * Role-based Access Control Middleware
 * Checks if user has required role(s)
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
 * Permission-based Access Control
 * More granular permission checking
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
 * Permission checking middleware
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
 * Optional authentication middleware
 * Attaches user info if token is present, but doesn't require it
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
      const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
      req.user = decoded;
      logger.debug('Optional auth - token verified', { userId: decoded.sub });
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
 * Resource ownership middleware
 * Ensures user can only access their own resources
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