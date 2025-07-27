// src/modules/users/routes/authRoutes.ts

/**
 * Authentication Routes Module for WayrApp Platform
 * 
 * This module defines and configures all authentication-related HTTP routes for the WayrApp
 * language learning platform. It serves as the primary entry point for user authentication
 * operations including registration, login, token refresh, logout, and user profile retrieval.
 * The module integrates comprehensive security measures, input validation, rate limiting, and
 * error handling to provide a robust authentication system.
 * 
 * The authentication routes follow RESTful conventions and implement security
 * practices including JWT token-based authentication, bcrypt password hashing, request validation
 * using Zod schemas, and rate limiting to prevent abuse. All routes are designed to work seamlessly
 * with the frontend applications and provide consistent API responses with proper error handling.
 * 
 * This module is a critical component of the application's security infrastructure, handling
 * sensitive operations like user registration and authentication. It integrates with the
 * AuthController for business logic, authentication middleware for security, validation
 * middleware for input sanitization, and rate limiting middleware for abuse prevention.
 * The routes are mounted at `/api/v1/auth` in the main application and serve both web and
 * mobile client applications.
 * 
 * Factory function that creates authentication routes.
 * 
 * Express router configuration for user authentication endpoints.
 * 
 * @module authRoutes
 * @category Routes
 * @category Auth
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Import and mount authentication routes in main application
 * import { createAuthRoutes } from '@/modules/users/routes/authRoutes';
 * import express from 'express';
 * 
 * const app = express();
 * // authController is created in the dependency injection container
 * app.use('/api/v1/auth', createAuthRoutes(authController));
 * 
 * @example
 * // Available authentication endpoints:
 * // POST /api/v1/auth/register - User registration
 * // POST /api/v1/auth/login - User login
 * // POST /api/v1/auth/refresh - Token refresh
 * // POST /api/v1/auth/logout - User logout (requires authentication)
 * // GET /api/v1/auth/me - Get current user info (requires authentication)
 * 
 * @example
 * // Client usage example for user registration
 * const response = await fetch('/api/v1/auth/register', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     email: 'user@example.com',
 *     password: 'SecurePass123!',
 *     username: 'learner123'
 *   })
 * });
 * const { user, tokens } = await response.json();
 */

import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken } from '@/shared/middleware/auth';
import { authRateLimiter } from '@/shared/middleware/security';
import { validate } from '@/shared/middleware/validation';
import { asyncHandler } from '@/shared/middleware/errorHandler';
import { z } from 'zod';

/**
 * User login request validation schema
 * 
 * Defines the validation rules for user login requests using Zod schema validation.
 * Ensures that login requests contain valid email addresses and non-empty passwords
 * before processing by the authentication controller.
 * 
 * @constant {Object} loginSchema - Zod validation schema for login requests
 * @property {Object} body - Request body validation rules
 * @property {string} body.email - Valid email address (required)
 * @property {string} body.password - Non-empty password string (required)
 */
const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  })
};

/**
 * Token refresh request validation schema
 * 
 * Defines the validation rules for token refresh requests using Zod schema validation.
 * Ensures that refresh requests contain a valid refresh token string before processing
 * by the authentication controller for token renewal operations.
 * 
 * @constant {Object} refreshTokenSchema - Zod validation schema for token refresh requests
 * @property {Object} body - Request body validation rules
 * @property {string} body.refreshToken - Non-empty refresh token string (required)
 */
const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
};

/**
 * User registration request validation schema
 * 
 * Defines comprehensive validation rules for user registration requests using Zod schema
 * validation. Implements strict password complexity requirements and validates optional
 * profile information to ensure data integrity and security compliance.
 * 
 * Password requirements enforce industry-standard security practices including minimum
 * length, character complexity, and the presence of uppercase, lowercase, numeric, and
 * special characters to ensure strong password security.
 * 
 * @constant {Object} registerSchema - Zod validation schema for user registration requests
 * @property {Object} body - Request body validation rules
 * @property {string} body.email - Valid email address (required)
 * @property {string} body.password - Complex password meeting security requirements (required)
 * @property {string} [body.username] - Username with minimum 3 characters (optional)
 * @property {string} [body.country_code] - ISO 3166-1 alpha-2 country code (optional)
 * @property {string} [body.profile_picture_url] - Valid URL for profile picture (optional)
 */
const registerSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    username: z.string().min(3, 'Username must be at least 3 characters').optional(),
    country_code: z.string().length(2, 'Country code must be 2 characters').optional(),
    profile_picture_url: z.string().url('Invalid URL format').optional()
  })
};

/**
 * Authentication Routes Factory Function
 * 
 * Creates and configures an Express router with authentication endpoints using the
 * provided AuthController instance. This factory function follows the composition
 * root pattern where dependencies are injected from a central location rather than
 * being instantiated within the route module.
 * 
 * @param {AuthController} authController - Configured AuthController instance with all dependencies
 * @returns {Router} Express router configured with authentication endpoints
 */
export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  /**
   * User Registration Endpoint
   * 
   * Handles new user account creation with comprehensive validation, security measures,
   * and automatic authentication. This endpoint creates a new user account, hashes the
   * password securely, and returns both user information and authentication tokens for
   * immediate login after successful registration.
   * 
   * The endpoint implements multiple layers of security including rate limiting to prevent
   * abuse, input validation using Zod schemas, password complexity requirements, and
   * duplicate email detection. Upon successful registration, the user is automatically
   * authenticated and receives JWT tokens for immediate access to protected resources.
   * 
   * @route POST /api/v1/auth/register
   * @access Public - No authentication required
   * @ratelimit 5 requests per 15 minutes per IP address
   * 
   * @middleware authRateLimiter - Rate limiting for authentication endpoints
   * @middleware validate(registerSchema) - Request body validation using Zod schema
   * @controller authController.register - Handles user registration business logic
   * 
   * @example
   * // Client request example
   * const response = await fetch('/api/v1/auth/register', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({
   *     email: 'newuser@example.com',
   *     password: 'SecurePass123!',
   *     username: 'learner123',
   *     country_code: 'US'
   *   })
   * });
   * 
   * @example
   * // Successful response (201 Created)
   * {
   *   "success": true,
   *   "timestamp": "2024-01-20T10:30:00.000Z",
   *   "data": {
   *     "user": {
   *       "id": "uuid-string",
   *       "email": "newuser@example.com",
   *       "username": "learner123",
   *       "role": "student"
   *     },
   *     "tokens": {
   *       "accessToken": "jwt-access-token",
   *       "refreshToken": "jwt-refresh-token"
   *     }
   *   }
   * }
   */
  
  /**
   * @swagger
   * /api/v1/auth/register:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: Register a new user
   *     description: Creates a new user account with email, password, and optional profile information
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *               - firstName
   *               - lastName
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 example: SecurePassword123!
   *               firstName:
   *                 type: string
   *                 example: John
   *               lastName:
   *                 type: string
   *                 example: Doe
   *               role:
   *                 type: string
   *                 enum: [student, teacher, admin]
   *                 default: student
   *     responses:
   *       201:
   *         description: User successfully registered
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: User registered successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     tokens:
   *                       $ref: '#/components/schemas/AuthTokens'
   *       400:
   *         description: Invalid input data
   *       409:
   *         description: User already exists
   *       429:
   *         description: Too many registration attempts
   */
  router.post(
    '/register',
    authRateLimiter,
    validate(registerSchema),
    asyncHandler(authController.register)
  );

  /**
   * User Login Endpoint
   * 
   * Authenticates users with email and password credentials, validates account status,
   * and returns JWT tokens for accessing protected resources. This endpoint implements
   * secure authentication using bcrypt password verification and generates fresh JWT
   * tokens with configurable expiration times.
   * 
   * The endpoint includes comprehensive security measures such as rate limiting to prevent
   * brute force attacks, input validation, account status verification, and secure password
   * comparison. Failed login attempts are logged for security monitoring, and successful
   * logins update the user's last login timestamp.
   * 
   * @route POST /api/v1/auth/login
   * @access Public - No authentication required
   * @ratelimit 5 requests per 15 minutes per IP address
   * 
   * @middleware authRateLimiter - Rate limiting for authentication endpoints
   * @middleware validate(loginSchema) - Request body validation using Zod schema
   * @controller authController.login - Handles user authentication business logic
   * 
   * @example
   * // Client request example
   * const response = await fetch('/api/v1/auth/login', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({
   *     email: 'user@example.com',
   *     password: 'SecurePass123!'
   *   })
   * });
   * 
   * @example
   * // Successful response (200 OK)
   * {
   *   "success": true,
   *   "timestamp": "2024-01-20T10:30:00.000Z",
   *   "data": {
   *     "user": {
   *       "id": "uuid-string",
   *       "email": "user@example.com",
   *       "username": "learner123",
   *       "role": "student"
   *     },
   *     "tokens": {
   *       "accessToken": "jwt-access-token",
   *       "refreshToken": "jwt-refresh-token"
   *     }
   *   }
   * }
   */
  
  /**
   * @swagger
   * /api/v1/auth/login:
   *   post:
   *     tags:
   *       - Authentication
   *     summary: User login
   *     description: Authenticates user with email and password, returns JWT tokens
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *                 example: user@example.com
   *               password:
   *                 type: string
   *                 example: SecurePassword123!
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: Login successful
   *                 data:
   *                   type: object
   *                   properties:
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                     tokens:
   *                       $ref: '#/components/schemas/AuthTokens'
   *       400:
   *         description: Invalid credentials
   *       429:
   *         description: Too many login attempts
   */
  router.post(
    '/login',
    authRateLimiter,
    validate(loginSchema),
    asyncHandler(authController.login)
  );

  /**
   * Token Refresh Endpoint
   * 
   * Generates new JWT token pairs using valid refresh tokens, enabling seamless token
   * renewal without requiring user re-authentication. This endpoint validates refresh
   * tokens, checks token blacklist status, verifies user account status, and issues
   * new access and refresh tokens with updated expiration times.
   * 
   * The endpoint implements security measures including refresh token validation,
   * blacklist checking to prevent token reuse after logout, user account status
   * verification, and rate limiting. This allows clients to maintain authentication
   * state without storing long-lived credentials.
   * 
   * @route POST /api/v1/auth/refresh
   * @access Public - No authentication required (uses refresh token)
   * @ratelimit 5 requests per 15 minutes per IP address
   * 
   * @middleware authRateLimiter - Rate limiting for authentication endpoints
   * @middleware validate(refreshTokenSchema) - Request body validation using Zod schema
   * @controller authController.refresh - Handles token refresh business logic
   * 
   * @example
   * // Client request example
   * const response = await fetch('/api/v1/auth/refresh', {
   *   method: 'POST',
   *   headers: { 'Content-Type': 'application/json' },
   *   body: JSON.stringify({
   *     refreshToken: 'valid-jwt-refresh-token'
   *   })
   * });
   * 
   * @example
   * // Successful response (200 OK)
   * {
   *   "success": true,
   *   "timestamp": "2024-01-20T10:30:00.000Z",
   *   "data": {
   *     "tokens": {
   *       "accessToken": "new-jwt-access-token",
   *       "refreshToken": "new-jwt-refresh-token"
   *     }
   *   }
   * }
   */
  router.post(
    '/refresh',
    authRateLimiter,
    validate(refreshTokenSchema),
    asyncHandler(authController.refresh)
  );

  /**
   * User Logout Endpoint
   * 
   * Securely logs out authenticated users by invalidating their refresh tokens and
   * adding them to the token blacklist. This endpoint requires authentication via
   * access token and accepts a refresh token in the request body for revocation.
   * 
   * The logout process ensures that refresh tokens cannot be reused after logout,
   * preventing unauthorized access even if tokens are compromised. The endpoint
   * provides graceful handling when refresh tokens are not provided and logs
   * security events for monitoring purposes.
   * 
   * @route POST /api/v1/auth/logout
   * @access Private - Requires valid JWT access token
   * @authentication Bearer token in Authorization header
   * 
   * @middleware authenticateToken - JWT access token validation and user extraction
   * @middleware validate - Request body validation for refresh token
   * @controller authController.logout - Handles user logout business logic
   * 
   * @example
   * // Client request example
   * const response = await fetch('/api/v1/auth/logout', {
   *   method: 'POST',
   *   headers: {
   *     'Content-Type': 'application/json',
   *     'Authorization': 'Bearer jwt-access-token'
   *   },
   *   body: JSON.stringify({
   *     refreshToken: 'jwt-refresh-token-to-revoke'
   *   })
   * });
   * 
   * @example
   * // Successful response (200 OK)
   * {
   *   "success": true,
   *   "timestamp": "2024-01-20T10:30:00.000Z",
   *   "data": {
   *     "message": "Logged out successfully. Please remove tokens from client storage."
   *   }
   * }
   */
  router.post(
    '/logout',
    authenticateToken,
    validate({
      body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required')
      })
    }),
    asyncHandler(authController.logout)
  );

  /**
   * Current User Information Endpoint
   * 
   * Retrieves comprehensive profile information for the currently authenticated user.
   * This endpoint requires valid authentication via JWT access token and returns
   * detailed user data including profile information, registration details, account
   * status, and role information.
   * 
   * The endpoint provides a secure way for clients to obtain current user information
   * for profile display, authorization decisions, and user interface customization.
   * All sensitive information is properly filtered and only user-owned data is returned.
   * 
   * @route GET /api/v1/auth/me
   * @access Private - Requires valid JWT access token
   * @authentication Bearer token in Authorization header
   * 
   * @middleware authenticateToken - JWT access token validation and user extraction
   * @controller authController.me - Handles current user information retrieval
   * 
   * @example
   * // Client request example
   * const response = await fetch('/api/v1/auth/me', {
   *   method: 'GET',
   *   headers: {
   *     'Authorization': 'Bearer jwt-access-token'
   *   }
   * });
   * 
   * @example
   * // Successful response (200 OK)
   * {
   *   "success": true,
   *   "timestamp": "2024-01-20T10:30:00.000Z",
   *   "data": {
   *     "user": {
   *       "id": "uuid-string",
   *       "email": "user@example.com",
   *       "username": "learner123",
   *       "country_code": "US",
   *       "registration_date": "2024-01-15T08:00:00.000Z",
   *       "last_login_date": "2024-01-20T10:25:00.000Z",
   *       "profile_picture_url": "https://example.com/avatar.jpg",
   *       "is_active": true,
   *       "role": "student",
   *       "created_at": "2024-01-15T08:00:00.000Z",
   *       "updated_at": "2024-01-20T10:25:00.000Z"
   *     }
   *   }
   * }
   */
  router.get(
    '/me',
    authenticateToken,
    asyncHandler(authController.me)
  );

  /**
   * Return the configured Express router
   * 
   * Returns the Express router containing all authentication routes with
   * their associated middleware, validation, and controller handlers.
   * 
   * @returns {Router} Configured Express router for authentication endpoints
   */
  return router;
}