/**
 * Authentication Routes
 * Routes for user authentication: login, refresh, logout
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from '../controllers/authController';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
import { TokenBlacklistService } from '../services/tokenBlacklistService';
import { authenticateToken } from '@/shared/middleware/auth';
import { authRateLimiter } from '@/shared/middleware/security';
import { validate } from '@/shared/middleware/validation';
import { z } from 'zod';

// Validation schemas
const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  })
};

const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
};

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

// Initialize dependencies
const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const tokenBlacklistService = new TokenBlacklistService(prisma);
const authController = new AuthController(userService, tokenBlacklistService);

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  authRateLimiter,
  validate(registerSchema),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    User login
 * @access  Public
 */
router.post(
  '/login',
  authRateLimiter, // Apply rate limiting to auth endpoints
  validate(loginSchema),
  authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  authRateLimiter,
  validate(refreshTokenSchema),
  authController.refresh
);

/**
 * @route   POST /api/auth/logout
 * @desc    User logout
 * @access  Private
 */
router.post(
  '/logout',
  authenticateToken,
  validate({
    body: z.object({
      refreshToken: z.string().min(1, 'Refresh token is required')
    })
  }),
  authController.logout
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get(
  '/me',
  authenticateToken,
  authController.me
);

export default router;