// src/modules/progress/routes/progressRoutes.ts

/**
 * Express routing configuration for user progress tracking and gamification operations.
 * 
 * This module provides REST API route definitions for managing user learning progress, lesson
 * completion tracking, experience points, gamification features, and offline synchronization
 * capabilities. The routes support comprehensive progress monitoring, achievement tracking,
 * and learning analytics for both individual users and administrative oversight.
 * 
 * The module implements a factory function pattern that accepts a PrismaClient instance and
 * returns a configured Express router with all progress-related endpoints. This design supports
 * dependency injection and enables clean separation between route configuration and business
 * logic. All routes require authentication and implement role-based access control for
 * administrative functions.
 * 
 * Key architectural features include comprehensive user progress tracking with experience points
 * and streaks, lesson completion monitoring with timestamps and scoring, gamification elements
 * including lives system and bonus experience, offline progress synchronization for mobile
 * applications, administrative progress management and analytics, role-based access control
 * for sensitive operations, and comprehensive progress analytics for content creators and
 * administrators.
 * 
 * The routes integrate with the ProgressController for business logic execution and support both
 * individual user progress management and administrative oversight capabilities. This module
 * serves as a critical component of the learning experience, enabling personalized progress
 * tracking and motivation through gamification elements.
 * 
 * @module ProgressRoutes
 * @category Progress
 * @category Routes
 * @category Users
 * @category Content
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Mount progress routes in main application
 * import { createProgressRoutes } from '@/modules/progress/routes/progressRoutes';
 * import { prisma } from '@/shared/database/connection';
 * 
 * const API_BASE = '/api/v1';
 * app.use(API_BASE, createProgressRoutes(prisma));
 * 
 * @example
 * // Available user progress endpoints:
 * // GET /api/v1/progress - Get user progress overview
 * // GET /api/v1/progress/summary - Get progress summary with statistics
 * // PUT /api/v1/progress - Update user progress data
 * // GET /api/v1/progress/completions - Get user lesson completions
 * // PUT /api/v1/progress/sync - Sync offline progress data
 * // PUT /api/v1/progress/lives - Update user lives count
 * 
 * @example
 * // Available lesson completion endpoints:
 * // POST /api/v1/progress/lesson/:id - Mark lesson as completed
 * // GET /api/v1/progress/lesson/:id/completed - Check lesson completion status
 * // GET /api/v1/progress/lesson/:id/stats - Get lesson completion statistics (admin/content_creator)
 * 
 * @example
 * // Available administrative endpoints:
 * // POST /api/v1/progress/bonus - Award bonus experience (admin only)
 * // POST /api/v1/progress/reset - Reset user progress (admin only)
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProgressController } from '../controllers/progressController';
import { ProgressService } from '../services/progressService';
import { ProgressRepository } from '../repositories/progressRepository';
import { 
  UpdateUserProgressSchema,
  LessonIdParamSchema,
  LessonCompletionBodySchema,
  OfflineProgressSyncSchema,
  UpdateUserLivesSchema,
  AwardBonusSchema,
  ResetProgressSchema
} from '../types';
import { authenticateToken, requireRole } from '@/shared/middleware/auth';
import { validate } from '@/shared/middleware/validation';
import { PaginationSchema } from '@/shared/schemas';

/**
 * Creates and configures an Express router with progress tracking and gamification routes.
 * 
 * This factory function initializes a complete Express router configuration for progress-related operations,
 * including user progress tracking, lesson completion monitoring, gamification features, and administrative
 * analytics. The function instantiates the complete dependency chain (Repository → Service → Controller)
 * and configures all routes with appropriate middleware for authentication, authorization, and error handling.
 * 
 * The returned router includes comprehensive progress management capabilities supporting individual user
 * progress tracking, lesson completion monitoring, experience points and gamification, offline synchronization,
 * and administrative oversight. All routes require authentication, with additional role-based access control
 * for administrative functions.
 * 
 * @param {PrismaClient} prisma - Prisma database client instance for repository initialization and database operations
 * @returns {Router} Configured Express router with all progress tracking and gamification endpoints
 * @throws {Error} When PrismaClient initialization fails or database connection is unavailable
 * 
 * @example
 * // Basic usage in main application
 * import { createProgressRoutes } from '@/modules/progress/routes/progressRoutes';
 * import { prisma } from '@/shared/database/connection';
 * 
 * const progressRouter = createProgressRoutes(prisma);
 * app.use('/api/v1', progressRouter);
 * 
 * @example
 * // Usage with custom Prisma client
 * import { PrismaClient } from '@prisma/client';
 * 
 * const customPrisma = new PrismaClient({
 *   datasources: { db: { url: process.env.CUSTOM_DATABASE_URL } }
 * });
 * 
 * const progressRouter = createProgressRoutes(customPrisma);
 * app.use('/api/v1', progressRouter);
 */
export function createProgressRoutes(prisma: PrismaClient): Router {
  const router = Router();

  // Initialize dependencies
  const progressRepository = new ProgressRepository(prisma);
  const progressService = new ProgressService(progressRepository, prisma);
  const progressController = new ProgressController(progressService);

  // All progress routes require authentication
  router.use(authenticateToken);

  // User progress endpoints

  /**
   * @swagger
   * /api/v1/progress:
   *   get:
   *     tags:
   *       - Progress
   *       - User
   *     summary: Get user progress
   *     description: Retrieve comprehensive progress information for the authenticated user including experience points, current streak, lives, and last completed lesson
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User progress retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user_id:
   *                       type: string
   *                       format: uuid
   *                       example: "123e4567-e89b-12d3-a456-426614174000"
   *                     experience_points:
   *                       type: integer
   *                       minimum: 0
   *                       example: 1250
   *                     lives_current:
   *                       type: integer
   *                       minimum: 0
   *                       maximum: 5
   *                       example: 4
   *                     streak_current:
   *                       type: integer
   *                       minimum: 0
   *                       example: 7
   *                     last_completed_lesson_id:
   *                       type: string
   *                       nullable: true
   *                       example: "lesson-001"
   *                     last_activity_date:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-01-20T10:30:00.000Z"
   *                     updated_at:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-01-20T10:30:00.000Z"
   *       401:
   *         description: Invalid or missing authentication token
   *       404:
   *         description: User progress not found
   */
  router.get('/progress', progressController.getUserProgress);
  /**
   * @swagger
   * /api/v1/progress/summary:
   *   get:
   *     tags:
   *       - Progress
   *       - User
   *       - Analytics
   *     summary: Get progress summary
   *     description: Retrieve a comprehensive progress summary including statistics, achievements, and learning analytics for the authenticated user
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Progress summary retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     user_id:
   *                       type: string
   *                       format: uuid
   *                       example: "123e4567-e89b-12d3-a456-426614174000"
   *                     total_experience:
   *                       type: integer
   *                       example: 1250
   *                     current_streak:
   *                       type: integer
   *                       example: 7
   *                     longest_streak:
   *                       type: integer
   *                       example: 15
   *                     lessons_completed:
   *                       type: integer
   *                       example: 45
   *                     total_lessons:
   *                       type: integer
   *                       example: 120
   *                     completion_percentage:
   *                       type: number
   *                       format: float
   *                       example: 37.5
   *                     average_score:
   *                       type: number
   *                       format: float
   *                       example: 87.3
   *                     time_spent_minutes:
   *                       type: integer
   *                       example: 450
   *                     last_activity:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-01-20T10:30:00.000Z"
   *       401:
   *         description: Invalid or missing authentication token
   *       404:
   *         description: User progress not found
   */
  router.get('/progress/summary', progressController.getProgressSummary);
  /**
   * @swagger
   * /api/v1/progress:
   *   put:
   *     tags:
   *       - Progress
   *       - User
   *     summary: Update user progress
   *     description: Update user progress data including experience points, streak, and activity tracking
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               experience_points:
   *                 type: integer
   *                 minimum: 0
   *                 example: 1300
   *               streak_current:
   *                 type: integer
   *                 minimum: 0
   *                 example: 8
   *               last_completed_lesson_id:
   *                 type: string
   *                 nullable: true
   *                 example: "lesson-002"
   *               last_activity_date:
   *                 type: string
   *                 format: date-time
   *                 example: "2024-01-20T11:00:00.000Z"
   *     responses:
   *       200:
   *         description: User progress updated successfully
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
   *                   example: "User progress updated successfully"
   *                 data:
   *                   $ref: '#/components/schemas/UserProgress'
   *       400:
   *         description: Invalid input data
   *       401:
   *         description: Invalid or missing authentication token
   *       404:
   *         description: User progress not found
   */
  router.put('/progress', validate({ body: UpdateUserProgressSchema }), progressController.updateUserProgress);

  // Lesson completion endpoints

  /**
   * @swagger
   * /api/v1/progress/lesson/{id}:
   *   post:
   *     tags:
   *       - Progress
   *       - Lessons
   *       - Completion
   *     summary: Complete lesson
   *     description: Mark a lesson as completed and update user progress with experience points and completion tracking
   *     security:
   *       - bearerAuth: []
   *     parameters:
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
   *             required:
   *               - score
   *               - time_spent_seconds
   *             properties:
   *               score:
   *                 type: integer
   *                 minimum: 0
   *                 maximum: 100
   *                 example: 85
   *               time_spent_seconds:
   *                 type: integer
   *                 minimum: 0
   *                 example: 300
   *               completed_at:
   *                 type: string
   *                 format: date-time
   *                 example: "2024-01-20T10:30:00.000Z"
   *     responses:
   *       201:
   *         description: Lesson completed successfully
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
   *                   example: "Lesson completed successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     lesson_id:
   *                       type: string
   *                       example: "lesson-001"
   *                     user_id:
   *                       type: string
   *                       format: uuid
   *                       example: "123e4567-e89b-12d3-a456-426614174000"
   *                     score:
   *                       type: integer
   *                       example: 85
   *                     time_spent_seconds:
   *                       type: integer
   *                       example: 300
   *                     experience_gained:
   *                       type: integer
   *                       example: 15
   *                     completed_at:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-01-20T10:30:00.000Z"
   *       400:
   *         description: Invalid input data or lesson ID
   *       401:
   *         description: Invalid or missing authentication token
   *       404:
   *         description: Lesson not found
   *       409:
   *         description: Lesson already completed
   */
  router.post('/progress/lesson/:id', validate({ params: LessonIdParamSchema, body: LessonCompletionBodySchema }), progressController.completeLesson);
  /**
   * @swagger
   * /api/v1/progress/lesson/{id}/completed:
   *   get:
   *     tags:
   *       - Progress
   *       - Lessons
   *       - Completion
   *     summary: Check lesson completion
   *     description: Check if a specific lesson has been completed by the authenticated user
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Lesson ID
   *         example: "lesson-001"
   *     responses:
   *       200:
   *         description: Lesson completion status retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     lesson_id:
   *                       type: string
   *                       example: "lesson-001"
   *                     is_completed:
   *                       type: boolean
   *                       example: true
   *                     completion_data:
   *                       type: object
   *                       nullable: true
   *                       properties:
   *                         score:
   *                           type: integer
   *                           example: 85
   *                         time_spent_seconds:
   *                           type: integer
   *                           example: 300
   *                         completed_at:
   *                           type: string
   *                           format: date-time
   *                           example: "2024-01-20T10:30:00.000Z"
   *       400:
   *         description: Invalid lesson ID
   *       401:
   *         description: Invalid or missing authentication token
   *       404:
   *         description: Lesson not found
   */
  router.get('/progress/lesson/:id/completed', validate({ params: LessonIdParamSchema }), progressController.checkLessonCompletion);
  /**
   * @swagger
   * /api/v1/progress/completions:
   *   get:
   *     tags:
   *       - Progress
   *       - Lessons
   *       - Completion
   *     summary: Get user lesson completions
   *     description: Retrieve all lesson completions for the authenticated user with pagination and filtering options
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
   *         name: course_id
   *         schema:
   *           type: string
   *         description: Filter by course ID
   *         example: "qu-es-beginner"
   *     responses:
   *       200:
   *         description: User lesson completions retrieved successfully
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
   *                       lesson_id:
   *                         type: string
   *                         example: "lesson-001"
   *                       lesson_name:
   *                         type: string
   *                         example: "Introduction to Greetings"
   *                       score:
   *                         type: integer
   *                         example: 85
   *                       time_spent_seconds:
   *                         type: integer
   *                         example: 300
   *                       completed_at:
   *                         type: string
   *                         format: date-time
   *                         example: "2024-01-20T10:30:00.000Z"
   *                       experience_gained:
   *                         type: integer
   *                         example: 15
   *                 pagination:
   *                   $ref: '#/components/schemas/PaginationInfo'
   *       401:
   *         description: Invalid or missing authentication token
   */
  router.get('/progress/completions', validate({ query: PaginationSchema }), progressController.getUserLessonCompletions);

  // Offline synchronization

  /**
   * @swagger
   * /api/v1/progress/sync:
   *   put:
   *     tags:
   *       - Progress
   *       - Sync
   *       - Offline
   *     summary: Sync offline progress
   *     description: Synchronize offline progress data with the server, including lesson completions and progress updates
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - completions
   *               - last_activity
   *             properties:
   *               completions:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - lesson_id
   *                     - score
   *                     - time_spent_seconds
   *                     - completed_at
   *                   properties:
   *                     lesson_id:
   *                       type: string
   *                       example: "lesson-001"
   *                     score:
   *                       type: integer
   *                       minimum: 0
   *                       maximum: 100
   *                       example: 85
   *                     time_spent_seconds:
   *                       type: integer
   *                       minimum: 0
   *                       example: 300
   *                     completed_at:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-01-20T10:30:00.000Z"
   *               experience_gained:
   *                 type: integer
   *                 minimum: 0
   *                 example: 50
   *               last_activity:
   *                 type: string
   *                 format: date-time
   *                 example: "2024-01-20T10:35:00.000Z"
   *     responses:
   *       200:
   *         description: Offline progress synchronized successfully
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
   *                   example: "Offline progress synchronized successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     synced_completions:
   *                       type: integer
   *                       example: 3
   *                     total_experience_gained:
   *                       type: integer
   *                       example: 50
   *                     conflicts_resolved:
   *                       type: integer
   *                       example: 0
   *                     updated_progress:
   *                       $ref: '#/components/schemas/UserProgress'
   *       400:
   *         description: Invalid sync data
   *       401:
   *         description: Invalid or missing authentication token
   *       409:
   *         description: Sync conflicts detected
   */
  router.put('/progress/sync', validate({ body: OfflineProgressSyncSchema }), progressController.syncOfflineProgress);

  // Gamification features

  /**
   * @swagger
   * /api/v1/progress/lives:
   *   put:
   *     tags:
   *       - Progress
   *       - Gamification
   *       - Lives
   *     summary: Update user lives
   *     description: Update the user's current lives count for gamification purposes
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - lives_current
   *             properties:
   *               lives_current:
   *                 type: integer
   *                 minimum: 0
   *                 maximum: 5
   *                 example: 3
   *               reason:
   *                 type: string
   *                 enum: [lost, gained, reset]
   *                 example: "lost"
   *     responses:
   *       200:
   *         description: User lives updated successfully
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
   *                   example: "User lives updated successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     user_id:
   *                       type: string
   *                       format: uuid
   *                       example: "123e4567-e89b-12d3-a456-426614174000"
   *                     lives_current:
   *                       type: integer
   *                       example: 3
   *                     lives_max:
   *                       type: integer
   *                       example: 5
   *                     next_life_at:
   *                       type: string
   *                       format: date-time
   *                       nullable: true
   *                       example: "2024-01-20T11:30:00.000Z"
   *       400:
   *         description: Invalid lives count or reason
   *       401:
   *         description: Invalid or missing authentication token
   *       404:
   *         description: User progress not found
   */
  router.put('/progress/lives', validate({ body: UpdateUserLivesSchema }), progressController.updateUserLives);

  // Admin-only endpoints

  /**
   * @swagger
   * /api/v1/progress/bonus:
   *   post:
   *     tags:
   *       - Progress
   *       - Admin
   *       - Experience
   *     summary: Award bonus experience
   *     description: Award bonus experience points to a user (admin only)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *               - experience_points
   *               - reason
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *                 example: "123e4567-e89b-12d3-a456-426614174000"
   *               experience_points:
   *                 type: integer
   *                 minimum: 1
   *                 example: 100
   *               reason:
   *                 type: string
   *                 example: "Special achievement bonus"
   *     responses:
   *       200:
   *         description: Bonus experience awarded successfully
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
   *                   example: "Bonus experience awarded successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     user_id:
   *                       type: string
   *                       format: uuid
   *                       example: "123e4567-e89b-12d3-a456-426614174000"
   *                     experience_awarded:
   *                       type: integer
   *                       example: 100
   *                     total_experience:
   *                       type: integer
   *                       example: 1350
   *                     reason:
   *                       type: string
   *                       example: "Special achievement bonus"
   *                     awarded_at:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-01-20T10:30:00.000Z"
   *       400:
   *         description: Invalid input data
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (admin required)
   *       404:
   *         description: User not found
   */
  router.post('/progress/bonus', requireRole(['admin']), validate({ body: AwardBonusSchema }), progressController.awardBonusExperience);
  /**
   * @swagger
   * /api/v1/progress/reset:
   *   post:
   *     tags:
   *       - Progress
   *       - Admin
   *       - Management
   *     summary: Reset user progress
   *     description: Reset all progress data for a specific user (admin only)
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - user_id
   *             properties:
   *               user_id:
   *                 type: string
   *                 format: uuid
   *                 example: "123e4567-e89b-12d3-a456-426614174000"
   *               reason:
   *                 type: string
   *                 example: "User requested progress reset"
   *               reset_completions:
   *                 type: boolean
   *                 default: true
   *                 example: true
   *     responses:
   *       200:
   *         description: User progress reset successfully
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
   *                   example: "User progress reset successfully"
   *                 data:
   *                   type: object
   *                   properties:
   *                     user_id:
   *                       type: string
   *                       format: uuid
   *                       example: "123e4567-e89b-12d3-a456-426614174000"
   *                     reset_at:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-01-20T10:30:00.000Z"
   *                     completions_removed:
   *                       type: integer
   *                       example: 45
   *                     experience_reset:
   *                       type: integer
   *                       example: 1250
   *                     reason:
   *                       type: string
   *                       example: "User requested progress reset"
   *       400:
   *         description: Invalid input data
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (admin required)
   *       404:
   *         description: User not found
   */
  router.post('/progress/reset', requireRole(['admin']), validate({ body: ResetProgressSchema }), progressController.resetUserProgress);

  // Analytics endpoints (admin and content creators)

  /**
   * @swagger
   * /api/v1/progress/lesson/{id}/stats:
   *   get:
   *     tags:
   *       - Progress
   *       - Analytics
   *       - Lessons
   *       - Admin
   *     summary: Get lesson completion stats
   *     description: Retrieve comprehensive completion statistics for a specific lesson (admin and content_creator only)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Lesson ID
   *         example: "lesson-001"
   *       - in: query
   *         name: period
   *         schema:
   *           type: string
   *           enum: [day, week, month, all]
   *         description: Time period for statistics
   *         example: "week"
   *     responses:
   *       200:
   *         description: Lesson completion statistics retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   type: object
   *                   properties:
   *                     lesson_id:
   *                       type: string
   *                       example: "lesson-001"
   *                     lesson_name:
   *                       type: string
   *                       example: "Introduction to Greetings"
   *                     total_completions:
   *                       type: integer
   *                       example: 150
   *                     unique_users:
   *                       type: integer
   *                       example: 145
   *                     average_score:
   *                       type: number
   *                       format: float
   *                       example: 87.3
   *                     average_time_seconds:
   *                       type: number
   *                       format: float
   *                       example: 285.5
   *                     completion_rate:
   *                       type: number
   *                       format: float
   *                       example: 78.5
   *                     difficulty_rating:
   *                       type: string
   *                       enum: [easy, medium, hard]
   *                       example: "medium"
   *                     score_distribution:
   *                       type: object
   *                       properties:
   *                         "0-20":
   *                           type: integer
   *                           example: 5
   *                         "21-40":
   *                           type: integer
   *                           example: 8
   *                         "41-60":
   *                           type: integer
   *                           example: 15
   *                         "61-80":
   *                           type: integer
   *                           example: 45
   *                         "81-100":
   *                           type: integer
   *                           example: 77
   *                     recent_completions:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           user_id:
   *                             type: string
   *                             format: uuid
   *                             example: "123e4567-e89b-12d3-a456-426614174000"
   *                           score:
   *                             type: integer
   *                             example: 85
   *                           completed_at:
   *                             type: string
   *                             format: date-time
   *                             example: "2024-01-20T10:30:00.000Z"
   *       400:
   *         description: Invalid lesson ID or period
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (admin or content_creator required)
   *       404:
   *         description: Lesson not found
   */
  router.get(
    '/progress/lesson/:id/stats',
    requireRole(['admin', 'content_creator']),
    validate({ params: LessonIdParamSchema }),
    progressController.getLessonCompletionStats
  );

  return router;
}

export default createProgressRoutes;