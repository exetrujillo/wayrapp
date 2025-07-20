/**
 * User Routes
 * Routes for user profile management
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserController } from '../controllers/userController';
import { UserService } from '../services/userService';
import { UserRepository } from '../repositories/userRepository';
import { authenticateToken, requireRole } from '@/shared/middleware/auth';
import { validate } from '@/shared/middleware/validation';
import { z } from 'zod';
import { UpdateUserSchema, UpdatePasswordSchema, UpdateRoleSchema } from '../types';

// Initialize dependencies
const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

const router = Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticateToken,
  userController.getProfile
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticateToken,
  validate({ body: UpdateUserSchema }),
  userController.updateProfile
);

/**
 * @route   PUT /api/users/password
 * @desc    Update user password
 * @access  Private
 */
router.put(
  '/password',
  authenticateToken,
  validate({ body: UpdatePasswordSchema }),
  userController.updatePassword
);

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get(
  '/',
  authenticateToken,
  requireRole('admin'),
  validate({
    query: z.object({
      page: z.string().regex(/^\d+$/).optional(),
      limit: z.string().regex(/^\d+$/).optional(),
      sortBy: z.string().optional(),
      sortOrder: z.enum(['asc', 'desc']).optional(),
      role: z.enum(['student', 'content_creator', 'admin']).optional(),
      is_active: z.enum(['true', 'false']).optional(),
      search: z.string().optional()
    }).optional()
  }),
  userController.getAllUsers
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (admin only)
 * @access  Private/Admin
 */
router.get(
  '/:id',
  authenticateToken,
  requireRole('admin'),
  validate({
    params: z.object({
      id: z.string().uuid('Invalid user ID format')
    })
  }),
  userController.getUserById
);

/**
 * @route   PUT /api/users/:id/role
 * @desc    Update user role (admin only)
 * @access  Private/Admin
 */
router.put(
  '/:id/role',
  authenticateToken,
  requireRole('admin'),
  validate({
    params: z.object({
      id: z.string().uuid('Invalid user ID format')
    }),
    body: UpdateRoleSchema
  }),
  userController.updateUserRole
);

export default router;