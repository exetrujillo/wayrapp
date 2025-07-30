// src/modules/content/routes/lessonRoutes.ts

/**
 * Express routing configuration for lesson management and lesson-exercise assignment
 * operations within the WayrApp content management system.
 * 
 * This module provides REST API route definitions for managing lessons within the hierarchical
 * content structure (Course → Level → Section → Module → Lesson) and handling the many-to-many
 * relationship between lessons and exercises. The routes support full CRUD operations for lessons
 * nested under modules, as well as specialized endpoints for assigning, unassigning, and
 * reordering exercises within lessons.
 * 
 * The module implements a factory function pattern that accepts a PrismaClient instance and
 * returns a configured Express router with all lesson-related endpoints. This design supports
 * dependency injection and enables clean separation between route configuration and business logic.
 * All routes include comprehensive input validation using Zod schemas, role-based authentication
 * middleware, and standardized error handling.
 * 
 * Key architectural features include hierarchical lesson management within modules, many-to-many
 * lesson-exercise relationship management with ordering support, comprehensive input validation
 * and authentication middleware, role-based access control (admin for deletion, content_creator
 * for management), and standardized API response formatting with proper HTTP status codes.
 * 
 * The routes are mounted at the API base path in the main application and integrate with the
 * LessonController for business logic execution. This module serves as a critical component of
 * the content management system, enabling content creators and administrators to structure
 * learning materials effectively within the platform's educational hierarchy.
 * 
 * @module LessonRoutes
 * @category Lesson
 * @category Routes
 * @category Content
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Mount lesson routes in main application
 * import { createLessonRoutes } from '@/modules/content/routes/lessonRoutes';
 * import { prisma } from '@/shared/database/connection';
 * 
 * const API_BASE = '/api/v1';
 * app.use(API_BASE, createLessonRoutes(prisma));
 * 
 * @example
 * // Available lesson management endpoints:
 * // GET /api/v1/modules/:moduleId/lessons - List lessons in module
 * // POST /api/v1/modules/:moduleId/lessons - Create lesson (content_creator/admin)
 * // GET /api/v1/modules/:moduleId/lessons/:id - Get lesson by ID
 * // PUT /api/v1/modules/:moduleId/lessons/:id - Update lesson (content_creator/admin)
 * // DELETE /api/v1/modules/:moduleId/lessons/:id - Delete lesson (admin only)
 * 
 * @example
 * // Available lesson-exercise assignment endpoints:
 * // GET /api/v1/lessons/:lessonId/exercises - Get lesson exercises
 * // POST /api/v1/lessons/:lessonId/exercises - Assign exercise to lesson
 * // DELETE /api/v1/lessons/:lessonId/exercises/:exerciseId - Unassign exercise
 * // PUT /api/v1/lessons/:lessonId/exercises/reorder - Reorder exercises
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { LessonController } from '../controllers';
import { validate } from '../../../shared/middleware/validation';
import { authenticateToken, requireRole } from '../../../shared/middleware/auth';
import {
  CreateLessonSchema,
  UpdateLessonSchema,
  LessonQuerySchema,
  AssignExerciseToLessonSchema,
  ReorderExercisesSchema,
  ReorderLessonsSchema,
  ModuleParamSchema,
  LessonParamSchema,
  ExerciseParamSchema,
} from '../schemas';
import { IdParamSchema } from '../../../shared/schemas/common';

/**
 * Creates and configures an Express router with lesson management and lesson-exercise assignment routes.
 * 
 * This factory function initializes a complete Express router configuration for lesson-related operations,
 * including full CRUD operations for lessons within modules and specialized endpoints for managing the
 * many-to-many relationship between lessons and exercises. The function instantiates a LessonController
 * with the provided PrismaClient and configures all routes with appropriate middleware for authentication,
 * authorization, validation, and error handling.
 * 
 * The returned router includes two main categories of endpoints: lesson management routes (nested under
 * modules) for creating, reading, updating, and deleting lessons, and lesson-exercise assignment routes
 * for managing exercise assignments, ordering, and reordering within lessons. All routes implement
 * comprehensive input validation using Zod schemas and role-based access control.
 * 
 * @param {PrismaClient} prisma - Prisma database client instance for controller initialization and database operations
 * @returns {Router} Configured Express router with all lesson management and exercise assignment endpoints
 * @throws {Error} When PrismaClient initialization fails or database connection is unavailable
 * 
 * @example
 * // Basic usage in main application
 * import { createLessonRoutes } from '@/modules/content/routes/lessonRoutes';
 * import { prisma } from '@/shared/database/connection';
 * 
 * const lessonRouter = createLessonRoutes(prisma);
 * app.use('/api/v1', lessonRouter);
 * 
 * @example
 * // Usage with custom Prisma client
 * import { PrismaClient } from '@prisma/client';
 * 
 * const customPrisma = new PrismaClient({
 *   datasources: { db: { url: process.env.CUSTOM_DATABASE_URL } }
 * });
 * 
 * const lessonRouter = createLessonRoutes(customPrisma);
 * app.use('/api/v1', lessonRouter);
 */
export function createLessonRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const lessonController = new LessonController(prisma);

  // Lesson routes (nested under modules)

  /**
   * @swagger
   * /api/v1/modules/{moduleId}/lessons:
   *   get:
   *     tags:
   *       - Content
   *       - Lessons
   *     summary: List lessons in a module
   *     description: Retrieve a paginated list of lessons within a specific module
   *     parameters:
   *       - in: path
   *         name: moduleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Module ID
   *         example: "module-001"
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
   *           enum: [order, name, created_at, updated_at]
   *         description: Field to sort by
   *         example: "order"
   *       - in: query
   *         name: sortOrder
   *         schema:
   *           type: string
   *           enum: [asc, desc]
   *         description: Sort order
   *         example: "asc"
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for lesson name
   *         example: "introduction"
   *     responses:
   *       200:
   *         description: Lessons retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Lesson'
   *                 pagination:
   *                   $ref: '#/components/schemas/PaginationInfo'
   *       400:
   *         description: Invalid module ID or query parameters
   *       404:
   *         description: Module not found
   */
  router.get('/modules/:moduleId/lessons',
    validate({
      params: ModuleParamSchema,
      query: LessonQuerySchema
    }),
    lessonController.getLessonsByModule
  );

  /**
   * @swagger
   * /api/v1/modules/{moduleId}/lessons:
   *   post:
   *     tags:
   *       - Content
   *       - Lessons
   *     summary: Create a new lesson in a module
   *     description: Create a new lesson within a specific module (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: moduleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Module ID
   *         example: "module-001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - id
   *               - name
   *               - order
   *             properties:
   *               id:
   *                 type: string
   *                 maxLength: 60
   *                 example: "lesson-intro-greetings"
   *               name:
   *                 type: string
   *                 maxLength: 150
   *                 example: "Introduction to Greetings"
   *               description:
   *                 type: string
   *                 nullable: true
   *                 example: "Learn basic greeting phrases and expressions"
   *               order:
   *                 type: integer
   *                 minimum: 1
   *                 example: 1
   *               experience_points:
   *                 type: integer
   *                 minimum: 0
   *                 default: 10
   *                 example: 15
   *     responses:
   *       201:
   *         description: Lesson created successfully
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
   *                   example: Lesson created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Lesson'
   *       400:
   *         description: Invalid input data or module ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       404:
   *         description: Module not found
   */
  router.post('/modules/:moduleId/lessons',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: ModuleParamSchema,
      body: CreateLessonSchema.omit({ module_id: true })
    }),
    lessonController.createLesson
  );

  /**
   * @swagger
   * /api/v1/modules/{moduleId}/lessons/reorder:
   *   put:
   *     tags:
   *       - Content
   *       - Modules
   *       - Lessons
   *     summary: Reorder module lessons
   *     description: Update the order of lessons within a module (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: moduleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Module ID
   *         example: "module-001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               lesson_ids:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Array of lesson IDs in desired order
   *                 example: ["lesson-001", "lesson-003", "lesson-002"]
   *             required:
   *               - lesson_ids
   *     responses:
   *       200:
   *         description: Module lessons reordered successfully
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
   *                   example: Module lessons reordered successfully
   *                 timestamp:
   *                   type: string
   *                   format: date-time
   *                   example: "2024-01-01T00:00:00.000Z"
   *       400:
   *         description: Invalid module ID or lesson order data
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       404:
   *         description: Module not found or lessons not found
   *       422:
   *         description: Duplicate order values or missing lessons
   */
  router.put('/modules/:moduleId/lessons/reorder',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: ModuleParamSchema,
      body: ReorderLessonsSchema
    }),
    lessonController.reorderModuleLessons
  );

  /**
   * @swagger
   * /api/v1/modules/{moduleId}/lessons/{id}:
   *   get:
   *     tags:
   *       - Content
   *       - Lessons
   *     summary: Get lesson by ID
   *     description: Retrieve detailed information for a specific lesson within a module
   *     parameters:
   *       - in: path
   *         name: moduleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Module ID
   *         example: "module-001"
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Lesson ID
   *         example: "lesson-001"
   *     responses:
   *       200:
   *         description: Lesson retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Lesson'
   *       400:
   *         description: Invalid module ID or lesson ID
   *       404:
   *         description: Module or lesson not found
   */
  router.get('/modules/:moduleId/lessons/:id',
    validate({
      params: ModuleParamSchema.extend({ id: IdParamSchema.shape.id })
    }),
    lessonController.getLesson
  );

  /**
   * @swagger
   * /api/v1/modules/{moduleId}/lessons/{id}:
   *   put:
   *     tags:
   *       - Content
   *       - Lessons
   *     summary: Update lesson
   *     description: Update an existing lesson within a module (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: moduleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Module ID
   *         example: "module-001"
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Lesson ID
   *         example: "lesson-001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 maxLength: 150
   *                 example: "Updated Introduction to Greetings"
   *               description:
   *                 type: string
   *                 nullable: true
   *                 example: "Updated lesson on basic greeting phrases and expressions"
   *               order:
   *                 type: integer
   *                 minimum: 1
   *                 example: 1
   *               experience_points:
   *                 type: integer
   *                 minimum: 0
   *                 example: 20
   *     responses:
   *       200:
   *         description: Lesson updated successfully
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
   *                   example: Lesson updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Lesson'
   *       400:
   *         description: Invalid input data, module ID, or lesson ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       404:
   *         description: Module or lesson not found
   */
  router.put('/modules/:moduleId/lessons/:id',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: ModuleParamSchema.extend({ id: IdParamSchema.shape.id }),
      body: UpdateLessonSchema
    }),
    lessonController.updateLesson
  );

  /**
   * @swagger
   * /api/v1/modules/{moduleId}/lessons/{id}:
   *   delete:
   *     tags:
   *       - Content
   *       - Lessons
   *     summary: Delete lesson
   *     description: Delete a lesson from a module (requires admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: moduleId
   *         required: true
   *         schema:
   *           type: string
   *         description: Module ID
   *         example: "module-001"
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Lesson ID
   *         example: "lesson-001"
   *     responses:
   *       200:
   *         description: Lesson deleted successfully
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
   *                   example: Lesson deleted successfully
   *       400:
   *         description: Invalid module ID or lesson ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (admin required)
   *       404:
   *         description: Module or lesson not found
   *       409:
   *         description: Cannot delete lesson with existing exercise assignments
   */
  router.delete('/modules/:moduleId/lessons/:id',
    authenticateToken,
    requireRole(['admin']),
    validate({
      params: ModuleParamSchema.extend({ id: IdParamSchema.shape.id })
    }),
    lessonController.deleteLesson
  );



  // Lesson-Exercise assignment routes

  /**
   * @swagger
   * /api/v1/lessons/{lessonId}/exercises:
   *   get:
   *     tags:
   *       - Content
   *       - Lessons
   *       - Exercises
   *     summary: Get lesson exercises
   *     description: Retrieve all exercises assigned to a specific lesson in order
   *     parameters:
   *       - in: path
   *         name: lessonId
   *         required: true
   *         schema:
   *           type: string
   *         description: Lesson ID
   *         example: "lesson-001"
   *     responses:
   *       200:
   *         description: Lesson exercises retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       exercise:
   *                         $ref: '#/components/schemas/Exercise'
   *                       order:
   *                         type: integer
   *                         example: 1
   *                       assigned_at:
   *                         type: string
   *                         format: date-time
   *                         example: "2024-01-20T10:30:00.000Z"
   *       400:
   *         description: Invalid lesson ID
   *       404:
   *         description: Lesson not found
   */
  router.get('/lessons/:lessonId/exercises',
    validate({ params: LessonParamSchema }),
    lessonController.getLessonExercises
  );

  /**
   * @swagger
   * /api/v1/lessons/{lessonId}/exercises:
   *   post:
   *     tags:
   *       - Content
   *       - Lessons
   *       - Exercises
   *     summary: Assign exercise to lesson
   *     description: Assign an existing exercise to a lesson with a specific order (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: lessonId
   *         required: true
   *         schema:
   *           type: string
   *         description: Lesson ID
   *         example: "lesson-001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - exercise_id
   *               - order
   *             properties:
   *               exercise_id:
   *                 type: string
   *                 maxLength: 15
   *                 example: "exercise-001"
   *               order:
   *                 type: integer
   *                 minimum: 1
   *                 example: 1
   *     responses:
   *       201:
   *         description: Exercise assigned to lesson successfully
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
   *                   example: Exercise assigned to lesson successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     lesson_id:
   *                       type: string
   *                       example: "lesson-001"
   *                     exercise_id:
   *                       type: string
   *                       example: "exercise-001"
   *                     order:
   *                       type: integer
   *                       example: 1
   *                     assigned_at:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-01-20T10:30:00.000Z"
   *       400:
   *         description: Invalid input data or lesson ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       404:
   *         description: Lesson or exercise not found
   *       409:
   *         description: Exercise already assigned to this lesson or order conflict
   */
  router.post('/lessons/:lessonId/exercises',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: LessonParamSchema,
      body: AssignExerciseToLessonSchema
    }),
    lessonController.assignExerciseToLesson
  );

  /**
   * @swagger
   * /api/v1/lessons/{lessonId}/exercises/{exerciseId}:
   *   delete:
   *     tags:
   *       - Content
   *       - Lessons
   *       - Exercises
   *     summary: Unassign exercise from lesson
   *     description: Remove an exercise assignment from a lesson (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: lessonId
   *         required: true
   *         schema:
   *           type: string
   *         description: Lesson ID
   *         example: "lesson-001"
   *       - in: path
   *         name: exerciseId
   *         required: true
   *         schema:
   *           type: string
   *         description: Exercise ID
   *         example: "exercise-001"
   *     responses:
   *       200:
   *         description: Exercise unassigned from lesson successfully
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
   *                   example: Exercise unassigned from lesson successfully
   *       400:
   *         description: Invalid lesson ID or exercise ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       404:
   *         description: Lesson, exercise, or assignment not found
   */
  router.delete('/lessons/:lessonId/exercises/:exerciseId',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: LessonParamSchema.extend({
        exerciseId: ExerciseParamSchema.shape.exerciseId
      })
    }),
    lessonController.unassignExerciseFromLesson
  );

  /**
   * @swagger
   * /api/v1/lessons/{lessonId}/exercises/reorder:
   *   put:
   *     tags:
   *       - Content
   *       - Lessons
   *       - Exercises
   *     summary: Reorder lesson exercises
   *     description: Update the order of exercises within a lesson (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: lessonId
   *         required: true
   *         schema:
   *           type: string
   *         description: Lesson ID
   *         example: "lesson-001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - exercise_ids
   *             properties:
   *               exercise_ids:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["exercise-001", "exercise-002", "exercise-003"]
   *     responses:
   *       200:
   *         description: Lesson exercises reordered successfully
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
   *                   example: Lesson exercises reordered successfully
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       exercise_id:
   *                         type: string
   *                         example: "exercise-001"
   *                       order:
   *                         type: integer
   *                         example: 1
   *       400:
   *         description: Invalid input data or lesson ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       404:
   *         description: Lesson not found or some exercises not assigned to lesson
   *       409:
   *         description: Duplicate order values or missing exercises
   */
  router.put('/lessons/:lessonId/exercises/reorder',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: LessonParamSchema,
      body: ReorderExercisesSchema
    }),
    lessonController.reorderLessonExercises
  );

  return router;
}