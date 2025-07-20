/**
 * Authentication Controller
 * Handles user authentication endpoints: login, refresh, logout
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { AppError, asyncHandler } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus, ApiResponse, UserRole } from '@/shared/types';
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

const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  country_code: z.string().length(2, 'Country code must be 2 characters').optional(),
  profile_picture_url: z.string().url('Invalid URL format').optional()
});

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  country_code?: string;
  profile_picture_url?: string;
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

import { TokenBlacklistService } from '../services/tokenBlacklistService';
import { PrismaClient } from '@prisma/client';

export class AuthController {
  private tokenBlacklistService: TokenBlacklistService;

  constructor(
    private userService: UserService,
    tokenBlacklistService?: TokenBlacklistService
  ) {
    // If tokenBlacklistService is not provided, create a new instance
    this.tokenBlacklistService = tokenBlacklistService || new TokenBlacklistService(new PrismaClient());
  }

  /**
   * User login endpoint
   * POST /api/auth/login
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // SECURITY_AUDIT_TODO: Consider implementing rate limiting for login attempts to prevent brute force attacks.
    // Risk: Attackers could attempt multiple login combinations rapidly without throttling.
    // Suggestion: Add rate limiting middleware (e.g., express-rate-limit) to limit login attempts per IP/user.
    
    // Validate request body
    const validatedData = LoginSchema.parse(req.body);
    const { email, password } = validatedData;

    logger.info('Login attempt', { email });

    // SECURITY_AUDIT_TODO: Consider implementing account lockout after multiple failed attempts to prevent brute force attacks.
    // Risk: Attackers could continuously attempt login with different passwords for the same email.
    // Suggestion: Lock account temporarily after N failed attempts within a time window.
    
    // Verify user credentials
    const user = await this.userService.verifyUserByEmail(email, password);
    if (!user) {
      // SECURITY_AUDIT_TODO: Consider using constant-time comparison and generic error messages to prevent user enumeration.
      // Risk: Different response times or messages could reveal whether an email exists in the system.
      // Suggestion: Use the same response time and message for both invalid email and invalid password.
      logger.warn('Login failed - invalid credentials', { email });
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

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole
    };

    const tokens = generateTokenPair(tokenPayload);

    // Update last login (optional)
    await this.userService.updateLastLogin(user.id);

    logger.info('Login successful', {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole
    });

    const response: ApiResponse<AuthResponse> = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username ?? undefined, // Convierte null a undefined
          role: user.role as UserRole
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
    // SECURITY_AUDIT_TODO: Consider implementing rate limiting for token refresh to prevent token abuse.
    // Risk: Attackers could rapidly refresh tokens to maintain persistent access or overwhelm the system.
    // Suggestion: Add rate limiting specific to refresh token endpoints.
    
    // Validate request body
    const validatedData = RefreshTokenSchema.parse(req.body);
    const { refreshToken } = validatedData;

    logger.debug('Token refresh attempt');

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Check if token is blacklisted
      const isRevoked = await this.tokenBlacklistService.isTokenRevoked(refreshToken);
      if (isRevoked) {
        logger.warn('Token refresh failed - token revoked', { userId: decoded.sub });
        throw new AppError(
          'Invalid refresh token',
          HttpStatus.UNAUTHORIZED,
          ErrorCodes.AUTHENTICATION_ERROR
        );
      }

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
        role: user.role as UserRole
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
    const userId = req.user?.sub;
    const refreshToken = req.body.refreshToken;

    if (userId) {
      logger.info('User logout', { userId });

      // Revoke refresh token if provided
      if (refreshToken) {
        await this.tokenBlacklistService.revokeToken(refreshToken, userId);
        logger.info('Refresh token revoked', { userId });
      } else {
        logger.warn('Logout without refresh token', { userId });
      }
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        message: 'Logged out successfully. Please remove tokens from client storage.'
      }
    };

    res.status(HttpStatus.OK).json(response);
  });

  /**
   * User registration endpoint
   * POST /api/auth/register
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // SECURITY_AUDIT_TODO: Consider implementing rate limiting for registration to prevent spam account creation.
    // Risk: Attackers could create numerous fake accounts to overwhelm the system or for malicious purposes.
    // Suggestion: Add rate limiting and consider email verification for new registrations.
    
    // Validate request body
    const validatedData = RegisterSchema.parse(req.body);
    const { email, password, username, country_code, profile_picture_url } = validatedData;

    logger.info('Registration attempt', { email });

    // SECURITY_AUDIT_TODO: Using 'any' type bypasses TypeScript safety checks for user data.
    // Risk: Could allow unexpected properties to be passed to user creation, potentially causing data corruption.
    // Suggestion: Define a proper interface for user creation data instead of using 'any'.
    
    // Create user with hashed password
    const userData: any = {
      email,
      password,
      role: 'student' as const
    };

    // Only add optional fields if they are defined
    if (username !== undefined) userData.username = username;
    if (country_code !== undefined) userData.country_code = country_code;
    if (profile_picture_url !== undefined) userData.profile_picture_url = profile_picture_url;

    const user = await this.userService.createUserWithPassword(userData);

    // Generate tokens for automatic login
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole
    };

    const tokens = generateTokenPair(tokenPayload);

    logger.info('Registration successful', {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole
    });

    const response: ApiResponse<AuthResponse> = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username ?? undefined, // Convierte null a undefined
          role: user.role as UserRole
        },
        tokens
      }
    };

    res.status(HttpStatus.CREATED).json(response);
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
        last_login_date?: Date | undefined;
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
          username: user.username ?? undefined, // Convierte null a undefined
          country_code: user.country_code ?? undefined,
          registration_date: user.registration_date,
          last_login_date: user.last_login_date ?? undefined,
          profile_picture_url: user.profile_picture_url ?? undefined,
          is_active: user.is_active,
          role: user.role as UserRole,
          created_at: user.created_at,
          updated_at: user.updated_at
        }
      }
    };

    res.status(HttpStatus.OK).json(response);
  });
}