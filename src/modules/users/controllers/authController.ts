/**
 * Authentication Controller
 * Handles user authentication endpoints: login, refresh, logout
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus, ApiResponse } from '@/shared/types';
import { 
  generateTokenPair, 
  verifyRefreshToken,
  TokenPayload 
} from '@/shared/utils/auth';
import { logger } from '@/shared/utils/logger';
import { UserService } from '../services/userService';

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username?: string | undefined;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export class AuthController {
  constructor(private userService: UserService) {}

  /**
   * User login endpoint
   * POST /api/auth/login
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const validatedData = LoginSchema.parse(req.body);
    const { email, password } = validatedData;

    logger.info('Login attempt', { email });

    // Find user by email
    const user = await this.userService.findByEmail(email);
    if (!user) {
      logger.warn('Login failed - user not found', { email });
      throw new AppError(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTHENTICATION_ERROR
      );
    }

    // Check if user is active
    if (!user.is_active) {
      logger.warn('Login failed - user inactive', { email, userId: user.id });
      throw new AppError(
        'Account is deactivated',
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTHENTICATION_ERROR
      );
    }

    // Verify password (assuming password is stored in user object for this implementation)
    // In a real implementation, you'd have a separate password field or service
    const isPasswordValid = await this.userService.verifyPassword(user.id, password);
    if (!isPasswordValid) {
      logger.warn('Login failed - invalid password', { email, userId: user.id });
      throw new AppError(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTHENTICATION_ERROR
      );
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const tokens = generateTokenPair(tokenPayload);

    // Update last login (optional)
    await this.userService.updateLastLogin(user.id);

    logger.info('Login successful', { 
      userId: user.id, 
      email: user.email,
      role: user.role 
    });

    const response: ApiResponse<AuthResponse> = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        user: {
          id: user.id,
          email: user.email,
          ...(user.username !== undefined && { username: user.username }),
          role: user.role
        },
        tokens
      }
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * Refresh token endpoint
   * POST /api/auth/refresh
   */
  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const validatedData = RefreshTokenSchema.parse(req.body);
    const { refreshToken } = validatedData;

    logger.debug('Token refresh attempt');

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Get user to ensure they still exist and are active
      const user = await this.userService.findById(decoded.sub);
      if (!user) {
        logger.warn('Token refresh failed - user not found', { userId: decoded.sub });
        throw new AppError(
          'Invalid refresh token',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      if (!user.is_active) {
        logger.warn('Token refresh failed - user inactive', { userId: user.id });
        throw new AppError(
          'Account is deactivated',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

      // Generate new token pair
      const tokenPayload: TokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role
      };

      const tokens = generateTokenPair(tokenPayload);

      logger.info('Token refresh successful', { userId: user.id });

      const response: ApiResponse<{ tokens: typeof tokens }> = {
        success: true,
        timestamp: new Date().toISOString(),
        data: { tokens }
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error: any) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        logger.warn('Token refresh failed - invalid token', { error: error.message });
        throw new AppError(
          'Invalid refresh token',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }
      throw error;
    }
  });

  /**
   * Logout endpoint
   * POST /api/auth/logout
   */
  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // In a stateless JWT implementation, logout is typically handled client-side
    // by removing the tokens from storage. However, we can log the event
    // and potentially implement token blacklisting if needed.

    const userId = req.user?.sub;
    
    if (userId) {
      logger.info('User logout', { userId });
      
      // Optional: Implement token blacklisting here
      // await this.tokenBlacklistService.blacklistToken(token);
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        message: 'Logged out successfully'
      }
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * Get current user info
   * GET /api/auth/me
   */
  me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      throw new AppError(
        'Authentication required',
        HttpStatus.UNAUTHORIZED,
        ErrorCodes.AUTHENTICATION_ERROR
      );
    }

    const user = await this.userService.findById(req.user.sub);
    if (!user) {
      throw new AppError(
        'User not found',
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );
    }

    const response: ApiResponse<{ 
      user: {
        id: string;
        email: string;
        username?: string | undefined;
        country_code?: string | undefined;
        registration_date: Date;
        profile_picture_url?: string | undefined;
        is_active: boolean;
        role: string;
        created_at: Date;
        updated_at: Date;
      }
    }> = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        user: {
          id: user.id,
          email: user.email,
          ...(user.username !== undefined && { username: user.username }),
          ...(user.country_code !== undefined && { country_code: user.country_code }),
          registration_date: user.registration_date,
          ...(user.profile_picture_url !== undefined && { profile_picture_url: user.profile_picture_url }),
          is_active: user.is_active,
          role: user.role,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    };

    res.status(HttpStatus.OK).json(response);
  });
}