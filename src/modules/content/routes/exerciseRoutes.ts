// src/modules/content/routes/exerciseRoutes.ts

/**
 * Express routing configuration for exercise management operations within the WayrApp content management system.
 * 
 * This module provides REST API route definitions for managing exercises, which are the fundamental
 * interactive learning components within the WayrApp platform. Exercises represent individual
 * learning activities that can be assigned to lessons and support multiple types including
 * translation, fill-in-the-blank, true/false, pairs matching, informative content, and ordering tasks.
 * The routes support full CRUD operations with comprehensive validation and role-based access control.
 * 
 * The module implements a factory function pattern that accepts a PrismaClient instance and returns
 * a configured Express router with all exercise-related endpoints. This design supports dependency
 * injection and enables clean separation between route configuration and business logic. All routes
 * include comprehensive input validation using Zod schemas, role-based authentication middleware,
 * and standardized error handling.
 * 
 * Key architectural features include comprehensive CRUD operations for exercise management,
 * type-specific exercise filtering and retrieval, comprehensive input validation with exercise
 * type enumeration, role-based access control (admin for deletion, content_creator for management),
 * standardized API response formatting with proper HTTP status codes, and support for six different
 * exercise types with type-specific data structures.
 * 
 * The routes are mounted at the API base path in the main application and integrate with the
 * ExerciseController for business logic execution. This module serves as a critical component of the
 * content management system, enabling content creators and administrators to create and manage
 * interactive learning activities that form the core educational experience within the platform.
 * 
 * @module ExerciseRoutes
 * @category Routes
 * @category Content
 * @category Lesson
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Mount exercise routes in main application
 * import { createExerciseRoutes } from '@/modules/content/routes/exerciseRoutes';
 * import { prisma } from '@/shared/database/connection';
 * 
 * const API_BASE = '/api/v1';
 * app.use(API_BASE, createExerciseRoutes(prisma));
 * 
 * @example
 * // Available exercise management endpoints:
 * // GET /api/v1/exercises - List all exercises with filtering
 * // POST /api/v1/exercises - Create exercise (content_creator/admin)
 * // GET /api/v1/exercises/:id - Get exercise by ID
 * // PUT /api/v1/exercises/:id - Update exercise (content_creator/admin)
 * // DELETE /api/v1/exercises/:id - Delete exercise (admin only)
 * // GET /api/v1/exercises/type/:type - Get exercises by type
 * 
 * @example
 * // Supported exercise types:
 * // - translation: Language translation exercises
 * // - fill-in-the-blank: Complete missing words or phrases
 * // - vof: True/false or verification exercises
 * // - pairs: Match related items or concepts
 * // - informative: Educational content presentation
 * // - ordering: Arrange items in correct sequence
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ExerciseController } from '../controllers';
import { validate } from '../../../shared/middleware/validation';
import { authenticateToken, requireRole } from '../../../shared/middleware/auth';
import {
  CreateExerciseSchema,
  UpdateExerciseSchema,
  ExerciseQuerySchema,
} from '../schemas';
import { IdParamSchema } from '../../../shared/schemas/common';
import { z } from 'zod';

/**
 * Creates and configures an Express router with exercise management routes.
 * 
 * This factory function initializes a complete Express router configuration for exercise-related operations,
 * including full CRUD operations for exercises and specialized endpoints for type-specific exercise filtering.
 * The function instantiates an ExerciseController with the provided PrismaClient and configures all routes
 * with appropriate middleware for authentication, authorization, validation, and error handling.
 * 
 * The returned router includes comprehensive exercise management capabilities supporting six different exercise
 * types (translation, fill-in-the-blank, true/false, pairs, informative, ordering) with type-specific data
 * validation and filtering. All routes implement comprehensive input validation using Zod schemas and
 * role-based access control to ensure proper content management permissions.
 * 
 * @param {PrismaClient} prisma - Prisma database client instance for controller initialization and database operations
 * @returns {Router} Configured Express router with all exercise management endpoints
 * @throws {Error} When PrismaClient initialization fails or database connection is unavailable
 * 
 * @example
 * // Basic usage in main application
 * import { createExerciseRoutes } from '@/modules/content/routes/exerciseRoutes';
 * import { prisma } from '@/shared/database/connection';
 * 
 * const exerciseRouter = createExerciseRoutes(prisma);
 * app.use('/api/v1', exerciseRouter);
 * 
 * @example
 * // Usage with custom Prisma client
 * import { PrismaClient } from '@prisma/client';
 * 
 * const customPrisma = new PrismaClient({
 *   datasources: { db: { url: process.env.CUSTOM_DATABASE_URL } }
 * });
 * 
 * const exerciseRouter = createExerciseRoutes(customPrisma);
 * app.use('/api/v1', exerciseRouter);
 */
export function createExerciseRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const exerciseController = new ExerciseController(prisma);

  // Exercise routes

  /**
   * @swagger
   * /api/v1/exercises:
   *   get:
   *     tags:
   *       - Content
   *       - Exercises
   *     summary: List exercises
   *     description: Retrieve a paginated list of exercises with optional filtering by type
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
   *           enum: [id, exercise_type, created_at, updated_at]
   *         description: Field to sort by
   *         example: "created_at"
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *         description: Sort order
   *         example: "desc"
   *       - in: query
   *         name: exercise_type
   *         schema:
   *           type: string
   *           enum: [translation, fill-in-the-blank, vof, pairs, informative, ordering]
   *         description: Filter by exercise type
   *         example: "translation"
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for exercise content
   *         example: "greeting"
   *     responses:
   *       200:
   *         description: Exercises retrieved successfully
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
   *                   example: Exercises retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Exercise'
   *                 pagination:
   *                   $ref: '#/components/schemas/PaginationInfo'
   *       400:
   *         description: Invalid query parameters
   */
  router.get('/exercises',
    validate({ query: ExerciseQuerySchema }),
    exerciseController.getExercises
  );

  /**
   * @swagger
   * /api/v1/exercises:
   *   post:
   *     tags:
   *       - Content
   *       - Exercises
   *     summary: Create a new exercise
   *     description: Create a new exercise with type-specific data structure (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - id
   *               - exercise_type
   *               - data
   *             properties:
   *               id:
   *                 type: string
   *                 maxLength: 15
   *                 example: "exercise-001"
   *               exercise_type:
   *                 type: string
   *                 enum: [translation, fill-in-the-blank, vof, pairs, informative, ordering]
   *                 example: "translation"
   *               data:
   *                 type: object
   *                 description: Exercise-specific data structure that varies by exercise type
   *                 example:
   *                   question: "Translate 'Hello' to Spanish"
   *                   correct_answer: "Hola"
   *                   options: ["Hola", "Adiós", "Gracias", "Por favor"]
   *     responses:
   *       201:
   *         description: Exercise created successfully
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
   *                   example: Exercise created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Exercise'
   *       400:
   *         description: Invalid input data or exercise type
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       409:
   *         description: Exercise with this ID already exists
   */
  router.post('/exercises',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ body: CreateExerciseSchema }),
    exerciseController.createExercise
  );

  /**
   * @swagger
   * /api/v1/exercises/{id}:
   *   get:
   *     tags:
   *       - Content
   *       - Exercises
   *     summary: Get exercise by ID
   *     description: Retrieve detailed information for a specific exercise including type-specific data
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           maxLength: 15
   *         description: Exercise ID
   *         example: "exercise-001"
   *     responses:
   *       200:
   *         description: Exercise retrieved successfully
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
   *                   example: Exercise retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/Exercise'
   *       400:
   *         description: Invalid exercise ID format
   *       404:
   *         description: Exercise not found
   */
  router.get('/exercises/:id',
    validate({ params: IdParamSchema }),
    exerciseController.getExercise
  );

  /**
   * @swagger
   * /api/v1/exercises/{id}:
   *   put:
   *     tags:
   *       - Content
   *       - Exercises
   *     summary: Update exercise
   *     description: Update an existing exercise with partial data (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           maxLength: 15
   *         description: Exercise ID
   *         example: "exercise-001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               exercise_type:
   *                 type: string
   *                 enum: [translation, fill-in-the-blank, vof, pairs, informative, ordering]
   *                 example: "translation"
   *               data:
   *                 type: object
   *                 description: Exercise-specific data structure that varies by exercise type
   *                 example:
   *                   question: "Updated: Translate 'Hello' to Spanish"
   *                   correct_answer: "Hola"
   *                   options: ["Hola", "Adiós", "Gracias", "Por favor"]
   *     responses:
   *       200:
   *         description: Exercise updated successfully
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
   *                   example: Exercise updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Exercise'
   *       400:
   *         description: Invalid input data or exercise ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       404:
   *         description: Exercise not found
   */
  router.put('/exercises/:id',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: IdParamSchema,
      body: UpdateExerciseSchema
    }),
    exerciseController.updateExercise
  );

  /**
   * @swagger
   * /api/v1/exercises/{id}:
   *   delete:
   *     tags:
   *       - Content
   *       - Exercises
   *     summary: Delete exercise
   *     description: Delete an exercise from the system (requires admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           maxLength: 15
   *         description: Exercise ID
   *         example: "exercise-001"
   *     responses:
   *       200:
   *         description: Exercise deleted successfully
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
   *                   example: Exercise deleted successfully
   *       400:
   *         description: Invalid exercise ID format
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (admin required)
   *       404:
   *         description: Exercise not found
   *       409:
   *         description: Cannot delete exercise that is assigned to lessons
   */
  router.delete('/exercises/:id',
    authenticateToken,
    requireRole(['admin']),
    validate({ params: IdParamSchema }),
    exerciseController.deleteExercise
  );

  // Exercise by type routes

  /**
   * @swagger
   * /api/v1/exercises/type/{type}:
   *   get:
   *     tags:
   *       - Content
   *       - Exercises
   *     summary: Get exercises by type
   *     description: Retrieve a paginated list of exercises filtered by specific exercise type
   *     parameters:
   *       - in: path
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [translation, fill-in-the-blank, vof, pairs, informative, ordering]
   *         description: Exercise type to filter by
   *         example: "translation"
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
   *           enum: [id, created_at, updated_at]
   *         description: Field to sort by
   *         example: "created_at"
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *         description: Sort order
   *         example: "desc"
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for exercise content
   *         example: "greeting"
   *     responses:
   *       200:
   *         description: Exercises retrieved successfully
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
   *                   example: Exercises retrieved successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Exercise'
   *                 pagination:
   *                   $ref: '#/components/schemas/PaginationInfo'
   *       400:
   *         description: Invalid exercise type or query parameters
   *       404:
   *         description: No exercises found for the specified type
   */
  router.get('/exercises/type/:type',
    validate({
      params: z.object({
        type: z.enum(['translation', 'fill-in-the-blank', 'vof', 'pairs', 'informative', 'ordering'])
      }),
      query: ExerciseQuerySchema
    }),
    exerciseController.getExercisesByType
  );

  return router;
}