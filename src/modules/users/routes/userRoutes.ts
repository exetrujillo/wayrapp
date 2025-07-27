// src/modules/users/routes/userRoutes.ts

/**
 * # Profile management and administrative operations REST API routing configuration
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

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                   example: Profile retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid or missing authentication token
 *       404:
 *         description: User not found
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

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update current user profile
 *     description: Update the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 example: newusername123
 *               country_code:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 2
 *                 example: US
 *               profile_picture_url:
 *                 type: string
 *                 format: uri
 *                 example: https://example.com/new-avatar.jpg
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: Profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Invalid or missing authentication token
 *       404:
 *         description: User not found
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

/**
 * @swagger
 * /api/v1/users/password:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update user password
 *     description: Change the authenticated user's password with current password verification
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 example: CurrentPassword123!
 *               new_password:
 *                 type: string
 *                 minLength: 8
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$'
 *                 description: Must contain uppercase, lowercase, number, and special character
 *                 example: NewSecurePassword456!
 *     responses:
 *       200:
 *         description: Password updated successfully
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
 *                   example: Password updated successfully
 *       400:
 *         description: Invalid input data or incorrect current password
 *       401:
 *         description: Invalid or missing authentication token
 *       404:
 *         description: User not found
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

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags:
 *       - Users
 *       - Admin
 *     summary: List all users (Admin only)
 *     description: Retrieve a paginated list of all users with filtering options
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *           pattern: '^\d+$'
 *         description: Page number for pagination
 *         example: "1"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           pattern: '^\d+$'
 *         description: Number of items per page
 *         example: "20"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Field to sort by
 *         example: "email"
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *         example: "asc"
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, content_creator, admin]
 *         description: Filter by user role
 *         example: "student"
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: ["true", "false"]
 *         description: Filter by active status
 *         example: "true"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for email or username
 *         example: "john"
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid or missing authentication token
 *       403:
 *         description: Insufficient permissions (admin required)
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

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags:
 *       - Users
 *       - Admin
 *     summary: Get user by ID (Admin only)
 *     description: Retrieve detailed information for a specific user by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID format)
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                   example: User retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID format
 *       401:
 *         description: Invalid or missing authentication token
 *       403:
 *         description: Insufficient permissions (admin required)
 *       404:
 *         description: User not found
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

/**
 * @swagger
 * /api/v1/users/{id}/role:
 *   put:
 *     tags:
 *       - Users
 *       - Admin
 *     summary: Update user role (Admin only)
 *     description: Change a user's role (requires admin privileges)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID (UUID format)
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [student, content_creator, admin]
 *                 example: content_creator
 *     responses:
 *       200:
 *         description: User role updated successfully
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
 *                   example: User role updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid user ID format or role value
 *       401:
 *         description: Invalid or missing authentication token
 *       403:
 *         description: Insufficient permissions (admin required)
 *       404:
 *         description: User not found
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