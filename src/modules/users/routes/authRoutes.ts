/**
 * Authentication Routes
 * Routes for user authentication: login, refresh, logout
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthController } from '../controllers/authController';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
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

const refreshTokenSchema = { // <- Nota: ya no es z.object()
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
};

// Initialize dependencies
const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const authController = new AuthController(userService);

const router = Router();

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