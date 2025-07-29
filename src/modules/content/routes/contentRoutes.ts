// src/modules/content/routes/contentRoutes.ts

/**
 * Comprehensive REST API routing configuration for hierarchical content management operations.
 * 
 * This module provides complete routing configuration for the WayrApp content management system,
 * implementing a hierarchical content structure (Course → Level → Section → Module) with full
 * CRUD operations, role-based access control, and comprehensive input validation. The routes
 * support both public content access and authenticated content management operations.
 * 
 * The routing structure follows RESTful conventions with nested resources reflecting the content
 * hierarchy. Each content type (courses, levels, sections, modules) has complete CRUD endpoints
 * with appropriate authentication and authorization middleware. The module implements sophisticated
 * middleware stacking including authentication, role-based authorization, input validation using
 * Zod schemas, and configurable pagination with sorting and filtering capabilities.
 * 
 * Key features include hierarchical nested routing structure, comprehensive CRUD operations for
 * all content types, role-based access control with content creator and admin permissions,
 * comprehensive input validation using Zod schemas, configurable pagination with sorting and
 * filtering, packaged content endpoints for offline support, and dependency injection pattern
 * for database access.
 * 
 * The routes are designed to support both content consumption (public access) and content
 * management (authenticated access with appropriate roles). Administrative operations require
 * admin role, while content creation and editing require content_creator or admin roles.
 * 
 * @module ContentRoutes
 * @category Content
 * @category Routes
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Mount content routes in main application
 * import { createContentRoutes } from '@/modules/content/routes';
 * import { prisma } from '@/shared/database/connection';
 * 
 * const API_BASE = '/api/v1';
 * app.use(API_BASE, createContentRoutes(prisma));
 * 
 * @example
 * // Available endpoints structure:
 * // GET /api/v1/courses - List courses with pagination
 * // POST /api/v1/courses - Create course (content_creator/admin)
 * // GET /api/v1/courses/:id - Get specific course
 * // GET /api/v1/courses/:id/package - Get packaged course for offline
 * // GET /api/v1/courses/:courseId/levels - List levels in course
 * // GET /api/v1/levels/:levelId/sections - List sections in level
 * // GET /api/v1/sections/:sectionId/modules - List modules in section
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ContentController } from '../controllers';
import { validate } from '../../../shared/middleware/validation';
import { authenticateToken, requireRole } from '../../../shared/middleware/auth';
import { paginationMiddleware } from '../../../shared/middleware/pagination';
import { SORT_FIELDS } from '../../../shared/utils/repositoryHelpers';
import {
  CreateCourseSchema,
  UpdateCourseSchema,
  CourseQuerySchema,
  CreateLevelSchema,
  UpdateLevelSchema,
  LevelQuerySchema,
  CreateSectionSchema,
  UpdateSectionSchema,
  SectionQuerySchema,
  CreateModuleSchema,
  UpdateModuleSchema,
  ModuleQuerySchema,
  CourseParamSchema,
  LevelParamSchema,
  SectionParamSchema,
  // ModuleParamSchema
} from '../schemas';
import { IdParamSchema } from '../../../shared/schemas/common';

/**
 * Creates and configures Express router with comprehensive content management routes.
 * 
 * This function sets up a complete REST API for hierarchical content management, including
 * courses, levels, sections, and modules. Each content type has full CRUD operations with
 * appropriate middleware for authentication, authorization, validation, and pagination.
 * 
 * @param {PrismaClient} prisma - Prisma database client for dependency injection
 * @returns {Router} Configured Express router with all content management routes
 * 
 * @example
 * // Create and mount content routes
 * const contentRoutes = createContentRoutes(prisma);
 * app.use('/api/v1', contentRoutes);
 */
export function createContentRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const contentController = new ContentController(prisma);

  /**
   * Course management routes
   * 
   * Provides complete CRUD operations for courses with public access for reading
   * and authenticated access for content management operations.
   */

  /**
   * @swagger
   * /api/v1/courses:
   *   get:
   *     tags:
   *       - Courses
   *     summary: List courses with pagination and filtering
   *     description: Retrieve a paginated list of courses with optional filtering by language and search capabilities. Public access - no authentication required.
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
   *         description: Number of items per page (max 100)
   *         example: "20"
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [name, created_at, updated_at, source_language, target_language]
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
   *         name: source_language
   *         schema:
   *           type: string
   *           maxLength: 5
   *         description: Filter by source language code
   *         example: "en"
   *       - in: query
   *         name: target_language
   *         schema:
   *           type: string
   *           maxLength: 5
   *         description: Filter by target language code
   *         example: "es-ES"
   *       - in: query
   *         name: is_public
   *         schema:
   *           type: string
   *           enum: ["true", "false"]
   *         description: Filter by public visibility
   *         example: "true"
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for course name and description
   *         example: "spanish"
   *     responses:
   *       200:
   *         description: Courses retrieved successfully
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
   *                     $ref: '#/components/schemas/Course'
   *                 pagination:
   *                   type: object
   *                   properties:
   *                     page:
   *                       type: integer
   *                       example: 1
   *                     limit:
   *                       type: integer
   *                       example: 20
   *                     total:
   *                       type: integer
   *                       example: 45
   *                     totalPages:
   *                       type: integer
   *                       example: 3
   *                     hasNext:
   *                       type: boolean
   *                       example: true
   *                     hasPrev:
   *                       type: boolean
   *                       example: false
   *       400:
   *         description: Invalid query parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/courses',
    validate({ query: CourseQuerySchema }),
    paginationMiddleware({
      allowedSortFields: SORT_FIELDS.COURSE,
      defaultSortField: 'created_at',
      allowedFilters: ['source_language', 'target_language', 'is_public'],
      searchFields: ['name', 'description']
    }),
    contentController.getCourses
  );

  /**
   * @swagger
   * /api/v1/courses:
   *   post:
   *     tags:
   *       - Courses
   *     summary: Create a new course
   *     description: Create a new language learning course with hierarchical content structure. Requires authentication and content_creator or admin role.
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
   *               - source_language
   *               - target_language
   *               - name
   *             properties:
   *               id:
   *                 type: string
   *                 maxLength: 20
   *                 pattern: '^[a-z0-9-]+$'
   *                 description: Unique course identifier (lowercase, numbers, hyphens only)
   *                 example: "qu-es-beginner"
   *               source_language:
   *                 type: string
   *                 maxLength: 5
   *                 description: Source language code (ISO 639-1 or locale)
   *                 example: "qu"
   *               target_language:
   *                 type: string
   *                 maxLength: 5
   *                 description: Target language code (ISO 639-1 or locale)
   *                 example: "es-ES"
   *               name:
   *                 type: string
   *                 maxLength: 100
   *                 description: Course display name
   *                 example: "Quechua for Spanish Speakers"
   *               description:
   *                 type: string
   *                 nullable: true
   *                 description: Course description and learning objectives
   *                 example: "Learn basic Quechua vocabulary and grammar structures"
   *               is_public:
   *                 type: boolean
   *                 default: true
   *                 description: Whether the course is publicly accessible
   *                 example: true
   *           example:
   *             id: "qu-es-beginner"
   *             source_language: "qu"
   *             target_language: "es-ES"
   *             name: "Quechua for Spanish Speakers"
   *             description: "Learn basic Quechua vocabulary and grammar structures"
   *             is_public: true
   *     responses:
   *       201:
   *         description: Course created successfully
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
   *                   example: Course created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Course'
   *       400:
   *         description: Invalid input data or course ID already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Invalid or missing authentication token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: Course with this ID already exists
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.post('/courses',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ body: CreateCourseSchema }),
    contentController.createCourse
  );

  /**
   * @swagger
   * /api/v1/courses/{id}:
   *   get:
   *     tags:
   *       - Courses
   *     summary: Get course by ID
   *     description: Retrieve detailed information for a specific course including metadata and structure overview. Public access - no authentication required.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           maxLength: 20
   *         description: Course ID (unique identifier)
   *         example: "qu-es-beginner"
   *     responses:
   *       200:
   *         description: Course retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Course'
   *             example:
   *               success: true
   *               data:
   *                 id: "qu-es-beginner"
   *                 source_language: "qu"
   *                 target_language: "es-ES"
   *                 name: "Quechua for Spanish Speakers"
   *                 description: "Learn basic Quechua vocabulary and grammar structures"
   *                 is_public: true
   *                 levels_count: 3
   *                 created_at: "2024-01-15T08:00:00.000Z"
   *                 updated_at: "2024-01-20T10:30:00.000Z"
   *       400:
   *         description: Invalid course ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Course not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/courses/:id',
    validate({ params: IdParamSchema }),
    contentController.getCourse
  );

  /**
   * @swagger
   * /api/v1/courses/{id}:
   *   put:
   *     tags:
   *       - Courses
   *     summary: Update existing course
   *     description: Update course information including name, description, language settings, and visibility. Requires authentication and content_creator or admin role.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           maxLength: 20
   *         description: Course ID (unique identifier)
   *         example: "qu-es-beginner"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               source_language:
   *                 type: string
   *                 maxLength: 5
   *                 description: Source language code (ISO 639-1 or locale)
   *                 example: "qu"
   *               target_language:
   *                 type: string
   *                 maxLength: 5
   *                 description: Target language code (ISO 639-1 or locale)
   *                 example: "es-ES"
   *               name:
   *                 type: string
   *                 maxLength: 100
   *                 description: Course display name
   *                 example: "Advanced Quechua for Spanish Speakers"
   *               description:
   *                 type: string
   *                 nullable: true
   *                 description: Course description and learning objectives
   *                 example: "Advanced Quechua vocabulary and complex grammar structures"
   *               is_public:
   *                 type: boolean
   *                 description: Whether the course is publicly accessible
   *                 example: true
   *           example:
   *             name: "Advanced Quechua for Spanish Speakers"
   *             description: "Advanced Quechua vocabulary and complex grammar structures"
   *             is_public: true
   *     responses:
   *       200:
   *         description: Course updated successfully
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
   *                   example: Course updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Course'
   *       400:
   *         description: Invalid input data or course ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Invalid or missing authentication token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Course not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.put('/courses/:id',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: IdParamSchema,
      body: UpdateCourseSchema
    }),
    contentController.updateCourse
  );

  /**
   * @swagger
   * /api/v1/courses/{id}:
   *   delete:
   *     tags:
   *       - Courses
   *     summary: Delete course
   *     description: Permanently delete a course and all its associated content (levels, sections, modules, lessons). This action cannot be undone. Requires authentication and admin role.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           maxLength: 20
   *         description: Course ID (unique identifier)
   *         example: "qu-es-beginner"
   *     responses:
   *       200:
   *         description: Course deleted successfully
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
   *                   example: Course deleted successfully
   *                 data:
   *                   type: object
   *                   properties:
   *                     deletedCourseId:
   *                       type: string
   *                       example: "qu-es-beginner"
   *                     deletedAt:
   *                       type: string
   *                       format: date-time
   *                       example: "2024-01-20T10:30:00.000Z"
   *       400:
   *         description: Invalid course ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: Invalid or missing authentication token
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       403:
   *         description: Insufficient permissions (admin required)
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Course not found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       409:
   *         description: Cannot delete course with active enrollments or dependencies
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.delete('/courses/:id',
    authenticateToken,
    requireRole(['admin']),
    validate({ params: IdParamSchema }),
    contentController.deleteCourse
  );

  /**
   * @swagger
   * /api/v1/courses/{id}/package:
   *   get:
   *     tags:
   *       - Courses
   *     summary: Get packaged course for offline use
   *     description: Retrieve complete course structure with all nested content (levels, sections, modules, lessons, exercises) optimized for offline learning. Public access - no authentication required.
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           maxLength: 20
   *         description: Course ID (unique identifier)
   *         example: "qu-es-beginner"
   *     responses:
   *       200:
   *         description: Packaged course retrieved successfully
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
   *                     course:
   *                       $ref: '#/components/schemas/Course'
   *                     levels:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           id:
   *                             type: string
   *                           name:
   *                             type: string
   *                           code:
   *                             type: string
   *                           order:
   *                             type: integer
   *                           sections:
   *                             type: array
   *                             items:
   *                               type: object
   *                               properties:
   *                                 id:
   *                                   type: string
   *                                 name:
   *                                   type: string
   *                                 order:
   *                                   type: integer
   *                                 modules:
   *                                   type: array
   *                                   items:
   *                                     type: object
   *                                     properties:
   *                                       id:
   *                                         type: string
   *                                       name:
   *                                         type: string
   *                                       module_type:
   *                                         type: string
   *                                       order:
   *                                         type: integer
   *                                       lessons:
   *                                         type: array
   *                                         items:
   *                                           type: object
   *                                           properties:
   *                                             id:
   *                                               type: string
   *                                             name:
   *                                               type: string
   *                                             exercises:
   *                                               type: array
   *                                               items:
   *                                                 $ref: '#/components/schemas/Exercise'
   *                     packageInfo:
   *                       type: object
   *                       properties:
   *                         version:
   *                           type: string
   *                           example: "1.0.0"
   *                         packagedAt:
   *                           type: string
   *                           format: date-time
   *                           example: "2024-01-20T10:30:00.000Z"
   *                         totalLessons:
   *                           type: integer
   *                           example: 45
   *                         totalExercises:
   *                           type: integer
   *                           example: 180
   *       400:
   *         description: Invalid course ID format
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: Course not found or not available for packaging
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  router.get('/courses/:id/package',
    validate({ params: IdParamSchema }),
    contentController.getPackagedCourse
  );

  /**
   * Level management routes (nested under courses)
   * 
   * Provides CRUD operations for levels within courses, following the hierarchical
   * content structure. Levels represent difficulty or progression stages within courses.
   */

  /**
   * GET /courses/:courseId/levels - List levels within a specific course
   * Public access with pagination, filtering by code, and search in name field
   */

  /**
   * @swagger
   * /api/v1/courses/{courseId}/levels:
   *   get:
   *     tags:
   *       - Content
   *       - Levels
   *     summary: List levels in a course
   *     description: Retrieve a paginated list of levels within a specific course
   *     parameters:
   *       - in: path
   *         name: courseId
   *         required: true
   *         schema:
   *           type: string
   *           maxLength: 20
   *         description: Course ID
   *         example: "qu-es-beginner"
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
   *           enum: [order, name, code, created_at, updated_at]
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
   *         name: code
   *         schema:
   *           type: string
   *         description: Filter by level code
   *         example: "A1"
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for level name
   *         example: "beginner"
   *     responses:
   *       200:
   *         description: Levels retrieved successfully
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
   *                     $ref: '#/components/schemas/Level'
   *                 pagination:
   *                   $ref: '#/components/schemas/PaginationInfo'
   *       400:
   *         description: Invalid course ID or query parameters
   *       404:
   *         description: Course not found
   */
  router.get('/courses/:courseId/levels',
    validate({
      params: CourseParamSchema,
      query: LevelQuerySchema
    }),
    paginationMiddleware({
      allowedSortFields: SORT_FIELDS.LEVEL,
      defaultSortField: 'order',
      allowedFilters: ['code'],
      searchFields: ['name']
    }),
    contentController.getLevelsByCourse
  );

  /**
   * @swagger
   * /api/v1/courses/{courseId}/levels:
   *   post:
   *     tags:
   *       - Content
   *       - Levels
   *     summary: Create a new level in a course
   *     description: Create a new level within a specific course (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: courseId
   *         required: true
   *         schema:
   *           type: string
   *           maxLength: 20
   *         description: Course ID
   *         example: "qu-es-beginner"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *               - name
   *               - order
   *             properties:
   *               code:
   *                 type: string
   *                 maxLength: 10
   *                 example: "A1"
   *               name:
   *                 type: string
   *                 maxLength: 100
   *                 example: "Beginner Level"
   *               description:
   *                 type: string
   *                 nullable: true
   *                 example: "Introduction to basic vocabulary and grammar"
   *               order:
   *                 type: integer
   *                 minimum: 1
   *                 example: 1
   *               is_active:
   *                 type: boolean
   *                 default: true
   *                 example: true
   *     responses:
   *       201:
   *         description: Level created successfully
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
   *                   example: Level created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Level'
   *       400:
   *         description: Invalid input data or course ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       404:
   *         description: Course not found
   *       409:
   *         description: Level with this code already exists in the course
   */
  router.post('/courses/:courseId/levels',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: CourseParamSchema,
      body: CreateLevelSchema.omit({ course_id: true })
    }),
    contentController.createLevel
  );

  /**
   * @swagger
   * /api/v1/courses/{courseId}/levels/{id}:
   *   get:
   *     tags:
   *       - Content
   *       - Levels
   *     summary: Get level by ID
   *     description: Retrieve detailed information for a specific level within a course
   *     parameters:
   *       - in: path
   *         name: courseId
   *         required: true
   *         schema:
   *           type: string
   *           maxLength: 20
   *         description: Course ID
   *         example: "qu-es-beginner"
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Level ID
   *         example: "level-001"
   *     responses:
   *       200:
   *         description: Level retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Level'
   *       400:
   *         description: Invalid course ID or level ID
   *       404:
   *         description: Course or level not found
   */
  router.get('/courses/:courseId/levels/:id',
    validate({
      params: CourseParamSchema.extend({ id: IdParamSchema.shape.id })
    }),
    contentController.getLevel
  );

  /**
   * @swagger
   * /api/v1/courses/{courseId}/levels/{id}:
   *   put:
   *     tags:
   *       - Content
   *       - Levels
   *     summary: Update level
   *     description: Update an existing level within a course (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: courseId
   *         required: true
   *         schema:
   *           type: string
   *           maxLength: 20
   *         description: Course ID
   *         example: "qu-es-beginner"
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Level ID
   *         example: "level-001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               code:
   *                 type: string
   *                 maxLength: 10
   *                 example: "A1"
   *               name:
   *                 type: string
   *                 maxLength: 100
   *                 example: "Updated Beginner Level"
   *               description:
   *                 type: string
   *                 nullable: true
   *                 example: "Updated introduction to basic vocabulary and grammar"
   *               order:
   *                 type: integer
   *                 minimum: 1
   *                 example: 1
   *               is_active:
   *                 type: boolean
   *                 example: true
   *     responses:
   *       200:
   *         description: Level updated successfully
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
   *                   example: Level updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Level'
   *       400:
   *         description: Invalid input data, course ID, or level ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       404:
   *         description: Course or level not found
   *       409:
   *         description: Level with this code already exists in the course
   */
  router.put('/courses/:courseId/levels/:id',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: CourseParamSchema.extend({ id: IdParamSchema.shape.id }),
      body: UpdateLevelSchema
    }),
    contentController.updateLevel
  );

  /**
   * @swagger
   * /api/v1/courses/{courseId}/levels/{id}:
   *   delete:
   *     tags:
   *       - Content
   *       - Levels
   *     summary: Delete level
   *     description: Delete a level from a course (requires admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: courseId
   *         required: true
   *         schema:
   *           type: string
   *           maxLength: 20
   *         description: Course ID
   *         example: "qu-es-beginner"
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Level ID
   *         example: "level-001"
   *     responses:
   *       200:
   *         description: Level deleted successfully
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
   *                   example: Level deleted successfully
   *       400:
   *         description: Invalid course ID or level ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (admin required)
   *       404:
   *         description: Course or level not found
   *       409:
   *         description: Cannot delete level with existing sections
   */
  router.delete('/courses/:courseId/levels/:id',
    authenticateToken,
    requireRole(['admin']),
    validate({
      params: CourseParamSchema.extend({ id: IdParamSchema.shape.id })
    }),
    contentController.deleteLevel
  );

  /**
   * Section management routes (nested under levels)
   * 
   * Provides CRUD operations for sections within levels. Sections group related
   * modules together within a level for better content organization.
   */

  /**
   * GET /levels/:levelId/sections - List sections within a specific level
   * Public access with pagination and search in name field
   */

  /**
   * @swagger
   * /api/v1/levels/{levelId}/sections:
   *   get:
   *     tags:
   *       - Content
   *       - Sections
   *     summary: List sections in a level
   *     description: Retrieve a paginated list of sections within a specific level
   *     parameters:
   *       - in: path
   *         name: levelId
   *         required: true
   *         schema:
   *           type: string
   *         description: Level ID
   *         example: "level-001"
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
   *         description: Search term for section name
   *         example: "grammar"
   *     responses:
   *       200:
   *         description: Sections retrieved successfully
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
   *                     $ref: '#/components/schemas/Section'
   *                 pagination:
   *                   $ref: '#/components/schemas/PaginationInfo'
   *       400:
   *         description: Invalid level ID or query parameters
   *       404:
   *         description: Level not found
   */
  router.get('/levels/:levelId/sections',
    validate({
      params: LevelParamSchema,
      query: SectionQuerySchema
    }),
    paginationMiddleware({
      allowedSortFields: SORT_FIELDS.SECTION,
      defaultSortField: 'order',
      allowedFilters: [],
      searchFields: ['name']
    }),
    contentController.getSectionsByLevel
  );

  /**
   * @swagger
   * /api/v1/levels/{levelId}/sections:
   *   post:
   *     tags:
   *       - Content
   *       - Sections
   *     summary: Create a new section in a level
   *     description: Create a new section within a specific level (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: levelId
   *         required: true
   *         schema:
   *           type: string
   *         description: Level ID
   *         example: "level-001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - order
   *             properties:
   *               name:
   *                 type: string
   *                 maxLength: 100
   *                 example: "Grammar Basics"
   *               description:
   *                 type: string
   *                 nullable: true
   *                 example: "Introduction to basic grammar concepts"
   *               order:
   *                 type: integer
   *                 minimum: 1
   *                 example: 1
   *               is_active:
   *                 type: boolean
   *                 default: true
   *                 example: true
   *     responses:
   *       201:
   *         description: Section created successfully
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
   *                   example: Section created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Section'
   *       400:
   *         description: Invalid input data or level ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       404:
   *         description: Level not found
   */
  router.post('/levels/:levelId/sections',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: LevelParamSchema,
      body: CreateSectionSchema.omit({ level_id: true })
    }),
    contentController.createSection
  );

  /**
   * @swagger
   * /api/v1/levels/{levelId}/sections/{id}:
   *   get:
   *     tags:
   *       - Content
   *       - Sections
   *     summary: Get section by ID
   *     description: Retrieve detailed information for a specific section within a level
   *     parameters:
   *       - in: path
   *         name: levelId
   *         required: true
   *         schema:
   *           type: string
   *         description: Level ID
   *         example: "level-001"
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Section ID
   *         example: "section-001"
   *     responses:
   *       200:
   *         description: Section retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Section'
   *       400:
   *         description: Invalid level ID or section ID
   *       404:
   *         description: Level or section not found
   */
  router.get('/levels/:levelId/sections/:id',
    validate({
      params: LevelParamSchema.extend({ id: IdParamSchema.shape.id })
    }),
    contentController.getSection
  );

  /**
   * @swagger
   * /api/v1/levels/{levelId}/sections/{id}:
   *   put:
   *     tags:
   *       - Content
   *       - Sections
   *     summary: Update section
   *     description: Update an existing section within a level (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: levelId
   *         required: true
   *         schema:
   *           type: string
   *         description: Level ID
   *         example: "level-001"
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Section ID
   *         example: "section-001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 maxLength: 100
   *                 example: "Updated Grammar Basics"
   *               description:
   *                 type: string
   *                 nullable: true
   *                 example: "Updated introduction to basic grammar concepts"
   *               order:
   *                 type: integer
   *                 minimum: 1
   *                 example: 1
   *               is_active:
   *                 type: boolean
   *                 example: true
   *     responses:
   *       200:
   *         description: Section updated successfully
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
   *                   example: Section updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Section'
   *       400:
   *         description: Invalid input data, level ID, or section ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       404:
   *         description: Level or section not found
   */
  router.put('/levels/:levelId/sections/:id',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: LevelParamSchema.extend({ id: IdParamSchema.shape.id }),
      body: UpdateSectionSchema
    }),
    contentController.updateSection
  );

  /**
   * @swagger
   * /api/v1/levels/{levelId}/sections/{id}:
   *   delete:
   *     tags:
   *       - Content
   *       - Sections
   *     summary: Delete section
   *     description: Delete a section from a level (requires admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: levelId
   *         required: true
   *         schema:
   *           type: string
   *         description: Level ID
   *         example: "level-001"
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Section ID
   *         example: "section-001"
   *     responses:
   *       200:
   *         description: Section deleted successfully
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
   *                   example: Section deleted successfully
   *       400:
   *         description: Invalid level ID or section ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (admin required)
   *       404:
   *         description: Level or section not found
   *       409:
   *         description: Cannot delete section with existing modules
   */
  router.delete('/levels/:levelId/sections/:id',
    authenticateToken,
    requireRole(['admin']),
    validate({
      params: LevelParamSchema.extend({ id: IdParamSchema.shape.id })
    }),
    contentController.deleteSection
  );

  /**
   * Module management routes (nested under sections)
   * 
   * Provides CRUD operations for modules within sections. Modules are the core
   * learning units that contain lessons and represent specific learning objectives.
   */

  /**
   * GET /sections/:sectionId/modules - List modules within a specific section
   * Public access with pagination, filtering by module_type, and search in name field
   */

  /**
   * @swagger
   * /api/v1/sections/{sectionId}/modules:
   *   get:
   *     tags:
   *       - Content
   *       - Modules
   *     summary: List modules in a section
   *     description: Retrieve a paginated list of modules within a specific section
   *     parameters:
   *       - in: path
   *         name: sectionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Section ID
   *         example: "section-001"
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
   *           enum: [order, name, module_type, created_at, updated_at]
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
   *         name: module_type
   *         schema:
   *           type: string
   *           enum: [lesson, practice, assessment, review]
   *         description: Filter by module type
   *         example: "lesson"
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term for module name
   *         example: "vocabulary"
   *     responses:
   *       200:
   *         description: Modules retrieved successfully
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
   *                     $ref: '#/components/schemas/Module'
   *                 pagination:
   *                   $ref: '#/components/schemas/PaginationInfo'
   *       400:
   *         description: Invalid section ID or query parameters
   *       404:
   *         description: Section not found
   */
  router.get('/sections/:sectionId/modules',
    validate({
      params: SectionParamSchema,
      query: ModuleQuerySchema
    }),
    paginationMiddleware({
      allowedSortFields: SORT_FIELDS.MODULE,
      defaultSortField: 'order',
      allowedFilters: ['module_type'],
      searchFields: ['name']
    }),
    contentController.getModulesBySection
  );

  /**
   * @swagger
   * /api/v1/sections/{sectionId}/modules:
   *   post:
   *     tags:
   *       - Content
   *       - Modules
   *     summary: Create a new module in a section
   *     description: Create a new module within a specific section (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sectionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Section ID
   *         example: "section-001"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - module_type
   *               - order
   *             properties:
   *               name:
   *                 type: string
   *                 maxLength: 100
   *                 example: "Basic Vocabulary"
   *               description:
   *                 type: string
   *                 nullable: true
   *                 example: "Learn essential vocabulary words"
   *               module_type:
   *                 type: string
   *                 enum: [lesson, practice, assessment, review]
   *                 example: "lesson"
   *               order:
   *                 type: integer
   *                 minimum: 1
   *                 example: 1
   *               is_active:
   *                 type: boolean
   *                 default: true
   *                 example: true
   *               estimated_duration_minutes:
   *                 type: integer
   *                 minimum: 1
   *                 nullable: true
   *                 example: 15
   *     responses:
   *       201:
   *         description: Module created successfully
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
   *                   example: Module created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Module'
   *       400:
   *         description: Invalid input data or section ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       404:
   *         description: Section not found
   */
  router.post('/sections/:sectionId/modules',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: SectionParamSchema,
      body: CreateModuleSchema.omit({ section_id: true })
    }),
    contentController.createModule
  );

  /**
   * @swagger
   * /api/v1/sections/{sectionId}/modules/{id}:
   *   get:
   *     tags:
   *       - Content
   *       - Modules
   *     summary: Get module by ID
   *     description: Retrieve detailed information for a specific module within a section
   *     parameters:
   *       - in: path
   *         name: sectionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Section ID
   *         example: "section-001"
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Module ID
   *         example: "module-001"
   *     responses:
   *       200:
   *         description: Module retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 data:
   *                   $ref: '#/components/schemas/Module'
   *       400:
   *         description: Invalid section ID or module ID
   *       404:
   *         description: Section or module not found
   */
  router.get('/sections/:sectionId/modules/:id',
    validate({
      params: SectionParamSchema.extend({ id: IdParamSchema.shape.id })
    }),
    contentController.getModule
  );

  /**
   * @swagger
   * /api/v1/sections/{sectionId}/modules/{id}:
   *   put:
   *     tags:
   *       - Content
   *       - Modules
   *     summary: Update module
   *     description: Update an existing module within a section (requires content_creator or admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sectionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Section ID
   *         example: "section-001"
   *       - in: path
   *         name: id
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
   *               name:
   *                 type: string
   *                 maxLength: 100
   *                 example: "Updated Basic Vocabulary"
   *               description:
   *                 type: string
   *                 nullable: true
   *                 example: "Updated essential vocabulary words"
   *               module_type:
   *                 type: string
   *                 enum: [lesson, practice, assessment, review]
   *                 example: "lesson"
   *               order:
   *                 type: integer
   *                 minimum: 1
   *                 example: 1
   *               is_active:
   *                 type: boolean
   *                 example: true
   *               estimated_duration_minutes:
   *                 type: integer
   *                 minimum: 1
   *                 nullable: true
   *                 example: 20
   *     responses:
   *       200:
   *         description: Module updated successfully
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
   *                   example: Module updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Module'
   *       400:
   *         description: Invalid input data, section ID, or module ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (content_creator or admin required)
   *       404:
   *         description: Section or module not found
   */
  router.put('/sections/:sectionId/modules/:id',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: SectionParamSchema.extend({ id: IdParamSchema.shape.id }),
      body: UpdateModuleSchema
    }),
    contentController.updateModule
  );

  /**
   * @swagger
   * /api/v1/sections/{sectionId}/modules/{id}:
   *   delete:
   *     tags:
   *       - Content
   *       - Modules
   *     summary: Delete module
   *     description: Delete a module from a section (requires admin role)
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: sectionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Section ID
   *         example: "section-001"
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Module ID
   *         example: "module-001"
   *     responses:
   *       200:
   *         description: Module deleted successfully
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
   *                   example: Module deleted successfully
   *       400:
   *         description: Invalid section ID or module ID
   *       401:
   *         description: Invalid or missing authentication token
   *       403:
   *         description: Insufficient permissions (admin required)
   *       404:
   *         description: Section or module not found
   *       409:
   *         description: Cannot delete module with existing lessons
   */
  router.delete('/sections/:sectionId/modules/:id',
    authenticateToken,
    requireRole(['admin']),
    validate({
      params: SectionParamSchema.extend({ id: IdParamSchema.shape.id })
    }),
    contentController.deleteModule
  );

  return router;
}