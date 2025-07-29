// src/modules/users/controllers/authController.ts

/**
 * Authentication Controller Module
 * 
 * This module provides user authentication functionality for the WayrApp platform.
 * It serves as the primary controller layer for all authentication-related HTTP endpoints,
 * handling user registration, login, token refresh, logout, and user profile retrieval operations.
 * The controller integrates with the UserService for user management, TokenBlacklistService for
 * security token management, and implements robust validation, error handling, and security measures.
 * 
 * Main authentication controller class with all endpoint handlers. Type definition for login request payload.
 * Type definition for refresh token request payload. Type definition for user registration request payload.
 * Type definition for authentication response structure.
 * 
 * Handles all authentication endpoints including registration, login, token refresh, logout, and user profile retrieval.
 * 
 * @module AuthController
 * @category Controllers
 * @category Users
 * @category Auth
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { Request, Response } from 'express';
import { AppError, asyncHandler } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus, ApiResponse, UserRole } from '@/shared/types';
import {
  generateTokenPair,
  verifyRefreshToken,
  TokenPayload
} from '@/shared/utils/auth';
import { logger } from '@/shared/utils/logger';
import { UserService } from '../services/userService';
import { CreateUserDto } from '../types';
import { 
  LoginSchema, 
  RegisterSchema, 
  RefreshTokenBodySchema 
} from '@/shared/schemas/auth.schemas';



/**
 * Login request payload interface
 * @interface LoginRequest
 * @property {string} email - User's email address (must be valid email format)
 * @property {string} password - User's password (minimum 1 character required)
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Refresh token request payload interface
 * @interface RefreshTokenRequest
 * @property {string} refreshToken - JWT refresh token for generating new access tokens
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * User registration request payload interface
 * @interface RegisterRequest
 * @property {string} email - User's email address (must be valid email format)
 * @property {string} password - User's password (must meet security requirements: 8+ chars, uppercase, lowercase, number, special char)
 * @property {string} [username] - Optional username (minimum 3 characters)
 * @property {string} [country_code] - Optional ISO 3166-1 alpha-2 country code (exactly 2 characters)
 * @property {string} [profile_picture_url] - Optional profile picture URL (must be valid URL format)
 */
export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  country_code?: string;
  profile_picture_url?: string;
}

/**
 * Authentication response interface containing user data and JWT tokens
 * @interface AuthResponse
 * @property {Object} user - User information object
 * @property {string} user.id - Unique user identifier (UUID)
 * @property {string} user.email - User's email address
 * @property {string} [user.username] - User's display name (optional)
 * @property {string} user.role - User's role in the system (e.g., 'student', 'instructor', 'admin')
 * @property {Object} tokens - JWT token pair for authentication
 * @property {string} tokens.accessToken - Short-lived JWT access token for API requests
 * @property {string} tokens.refreshToken - Long-lived JWT refresh token for token renewal
 */
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

/**
 * Authentication Controller Class
 * 
 * Handles all authentication-related HTTP endpoints for the WayrApp platform.
 * This controller manages user registration, login, token refresh, logout, and profile retrieval.
 * It integrates with UserService for user operations and TokenBlacklistService for security.
 * 
 * @class AuthController
 * @example
 * // Initialize controller with dependencies
 * const userService = new UserService(userRepository);
 * const tokenBlacklistService = new TokenBlacklistService(prisma);
 * const authController = new AuthController(userService, tokenBlacklistService);
 * 
 * // Use in Express routes
 * router.post('/login', authController.login);
 * router.post('/register', authController.register);
 */
export class AuthController {

  /**
   * Creates an instance of AuthController
   * @param {UserService} userService - Service for user-related operations
   * @param {TokenBlacklistService} tokenBlacklistService - Service for token blacklist management (required)
   */
  constructor(
    private userService: UserService,
    private tokenBlacklistService: TokenBlacklistService
  ) { }

  /**
   * User login endpoint handler
   * 
   * Authenticates a user with email and password credentials, validates account status,
   * generates JWT token pair, and updates last login timestamp. Implements security
   * measures including input validation and comprehensive logging.
   * @param {Request} req - Express request object containing login credentials in body
   * @param {Response} res - Express response object for sending authentication response
   * @returns {Promise<void>} Resolves when login process completes successfully
   * @throws {AppError} When credentials are invalid, user not found, or account is inactive
   * 
   * @example
   * // POST /api/auth/login
   * // Request body: { email: "user@example.com", password: "SecurePass123!" }
   * // Response: { success: true, data: { user: {...}, tokens: {...} } }
   */
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const validatedData = LoginSchema.parse(req.body);
    const { email, password } = validatedData;

    logger.info('Login attempt', { email });

    // Verify user credentials
    const user = await this.userService.verifyUserByEmail(email, password);
    if (!user) {
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
      message: 'Login successful',
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
   * Token refresh endpoint handler
   * 
   * Validates and refreshes JWT tokens using a valid refresh token. Checks token blacklist,
   * verifies user account status, and generates a new token pair. Implements security
   * measures to prevent token reuse and unauthorized access.
   * @param {Request} req - Express request object containing refresh token in body
   * @param {Response} res - Express response object for sending new tokens
   * @returns {Promise<void>} Resolves when token refresh completes successfully
   * @throws {AppError} When refresh token is invalid, expired, revoked, or user is inactive
   * 
   * @example
   * // POST /api/auth/refresh
   * // Request body: { refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
   * // Response: { success: true, data: { tokens: { accessToken: "...", refreshToken: "..." } } }
   */
  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const validatedData = RefreshTokenBodySchema.parse(req.body);
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
        message: 'Token refresh successful',
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
   * User logout endpoint handler
   * 
   * Securely logs out a user by revoking their refresh token and adding it to the blacklist.
   * Requires authentication via access token. Provides graceful handling when refresh token
   * is not provided in the request body.
   * @param {Request} req - Express request object with authenticated user and optional refresh token in body
   * @param {Response} res - Express response object for sending logout confirmation
   * @returns {Promise<void>} Resolves when logout process completes
   * 
   * @example
   * // POST /api/auth/logout
   * // Headers: { Authorization: "Bearer <access_token>" }
   * // Request body: { refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
   * // Response: { success: true, data: { message: "Logged out successfully..." } }
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
   * User registration endpoint handler
   * 
   * Creates a new user account with email, password, and optional profile information.
   * Validates input data, creates user with hashed password, assigns default role,
   * and automatically logs in the user by generating JWT tokens.
   * @param {Request} req - Express request object containing registration data in body
   * @param {Response} res - Express response object for sending registration response
   * @returns {Promise<void>} Resolves when registration and auto-login complete successfully
   * @throws {AppError} When email already exists, validation fails, or user creation fails
   * 
   * @example
   * // POST /api/auth/register
   * // Request body: { 
   * //   email: "newuser@example.com", 
   * //   password: "SecurePass123!", 
   * //   username: "newuser",
   * //   country_code: "US"
   * // }
   * // Response: { success: true, data: { user: {...}, tokens: {...} } }
   */
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const validatedData = RegisterSchema.parse(req.body);
    const { email, password, username, country_code, profile_picture_url } = validatedData;

    logger.info('Registration attempt', { email });

    // Create user with hashed password using strongly typed interface
    const userData: CreateUserDto & { password: string } = {
      email,
      password,
      role: 'student' as const,
      ...(username !== undefined && { username }),
      ...(country_code !== undefined && { country_code }),
      ...(profile_picture_url !== undefined && { profile_picture_url })
    };

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
      message: 'Registration successful',
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
   * Get current authenticated user information endpoint handler
   * 
   * Retrieves comprehensive profile information for the currently authenticated user.
   * Requires valid authentication via access token. Returns detailed user data including
   * profile information, registration details, and account status.
   * @param {Request} req - Express request object with authenticated user information
   * @param {Response} res - Express response object for sending user profile data
   * @returns {Promise<void>} Resolves when user information is successfully retrieved and sent
   * @throws {AppError} When user is not authenticated or user record is not found
   * 
   * @example
   * // GET /api/auth/me
   * // Headers: { Authorization: "Bearer <access_token>" }
   * // Response: { 
   * //   success: true, 
   * //   data: { 
   * //     user: { 
   * //       id: "uuid", email: "user@example.com", username: "user", 
   * //       role: "student", is_active: true, created_at: "2024-01-01T00:00:00Z" 
   * //     } 
   * //   } 
   * // }
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