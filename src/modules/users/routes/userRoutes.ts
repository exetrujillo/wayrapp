// src/modules/users/routes/userRoutes.ts

/**
 * Comprehensive REST API routing configuration for user profile management and administrative operations.
 * 
 * This module provides complete routing configuration for the WayrApp user management system,
 * implementing user profile operations, password management, and administrative user management
 * functions. The routes support both user-facing profile management operations and administrative
 * functions with appropriate role-based access control.
 * 
 * The routing structure follows RESTful conventions with clear separation between user profile
 * operations (accessible to authenticated users for their own profiles) and administrative
 * operations (restricted to admin users). The module implements comprehensive middleware stacking
 * including authentication, role-based authorization, and input validation using Zod schemas.
 * 
 * Key features include user profile CRUD operations, secure password update functionality,
 * administrative user listing with pagination and filtering, role management capabilities,
 * comprehensive input validation using Zod schemas, role-based access control with proper
 * authorization checks, and dependency injection pattern for clean architecture.
 * 
 * The routes are designed with security as a primary concern, ensuring that users can only
 * access and modify their own profiles while providing administrators with comprehensive
 * user management capabilities. All sensitive operations require proper authentication and
 * authorization validation.
 * 
 * @module UserRoutes
 * @category Routes
 * @category Users
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Mount user routes in main application
 * import userRoutes from '@/modules/users/routes/userRoutes';
 * 
 * const API_BASE = '/api/v1';
 * app.use(`${API_BASE}/users`, userRoutes);
 * 
 * @example
 * // Available endpoints:
 * // GET /api/v1/users/profile - Get current user profile
 * // PUT /api/v1/users/profile - Update current user profile
 * // PUT /api/v1/users/password - Update user password
 * // GET /api/v1/users - List all users (admin only)
 * // GET /api/v1/users/:id - Get user by ID (admin only)
 * // PUT /api/v1/users/:id/role - Update user role (admin only)
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

/**
 * Initialize user management dependencies using dependency injection pattern.
 * 
 * Creates a clean dependency chain: PrismaClient → UserRepository → UserService → UserController
 * This pattern ensures proper separation of concerns and testability.
 */
const prisma = new PrismaClient();
const userRepository = new UserRepository(prisma);
const userService = new UserService(userRepository);
const userController = new UserController(userService);

/**
 * Express router configured with user management routes.
 * 
 * @type {Router}
 */
const router = Router();

/**
 * User Profile Management Routes
 * 
 * These routes allow authenticated users to manage their own profiles,
 * including viewing profile information, updating profile data, and changing passwords.
 */

/**
 * GET /profile - Get current authenticated user's profile information
 * Requires authentication - users can only access their own profile
 */
router.get(
  '/profile',
  authenticateToken,
  userController.getProfile
);

/**
 * PUT /profile - Update current authenticated user's profile
 * Requires authentication and validates profile update data
 * Users can update username, country_code, and profile_picture_url
 */
router.put(
  '/profile',
  authenticateToken,
  validate({ body: UpdateUserSchema }),
  userController.updateProfile
);

/**
 * PUT /password - Update current authenticated user's password
 * Requires authentication, current password verification, and new password validation
 * Implements secure password change workflow with current password confirmation
 */
router.put(
  '/password',
  authenticateToken,
  validate({ body: UpdatePasswordSchema }),
  userController.updatePassword
);

/**
 * Administrative User Management Routes
 * 
 * These routes provide administrative functions for user management,
 * including user listing, individual user access, and role management.
 * All routes require admin role authentication.
 */

/**
 * GET / - List all users with pagination, filtering, and search (admin only)
 * Supports query parameters: page, limit, sortBy, sortOrder, role, is_active, search
 * Provides comprehensive user listing with filtering and search capabilities
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
 * GET /:id - Get specific user by ID (admin only)
 * Requires valid UUID parameter and admin authentication
 * Provides detailed user information for administrative purposes
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
 * PUT /:id/role - Update user role (admin only)
 * Requires valid UUID parameter, admin authentication, and role validation
 * Allows administrators to change user roles (student, content_creator, admin)
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