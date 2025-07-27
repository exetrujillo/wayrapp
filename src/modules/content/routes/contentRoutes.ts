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
   * GET /courses - List courses with pagination, filtering, and search
   * Public access - no authentication required
   * Supports filtering by source_language, target_language, is_public
   * Supports search in name and description fields
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
   * POST /courses - Create new course
   * Requires authentication and content_creator or admin role
   */
  router.post('/courses',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({ body: CreateCourseSchema }),
    contentController.createCourse
  );

  /**
   * GET /courses/:id - Get specific course by ID
   * Public access - no authentication required
   */
  router.get('/courses/:id',
    validate({ params: IdParamSchema }),
    contentController.getCourse
  );

  /**
   * PUT /courses/:id - Update existing course
   * Requires authentication and content_creator or admin role
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
   * DELETE /courses/:id - Delete course
   * Requires authentication and admin role
   */
  router.delete('/courses/:id',
    authenticateToken,
    requireRole(['admin']),
    validate({ params: IdParamSchema }),
    contentController.deleteCourse
  );

  /**
   * GET /courses/:id/package - Get packaged course for offline use
   * Public access - returns complete course structure with all nested content
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

  router.post('/courses/:courseId/levels',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: CourseParamSchema,
      body: CreateLevelSchema.omit({ course_id: true })
    }),
    contentController.createLevel
  );

  router.get('/courses/:courseId/levels/:id',
    validate({
      params: CourseParamSchema.extend({ id: IdParamSchema.shape.id })
    }),
    contentController.getLevel
  );

  router.put('/courses/:courseId/levels/:id',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: CourseParamSchema.extend({ id: IdParamSchema.shape.id }),
      body: UpdateLevelSchema
    }),
    contentController.updateLevel
  );

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

  router.post('/levels/:levelId/sections',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: LevelParamSchema,
      body: CreateSectionSchema.omit({ level_id: true })
    }),
    contentController.createSection
  );

  router.get('/levels/:levelId/sections/:id',
    validate({
      params: LevelParamSchema.extend({ id: IdParamSchema.shape.id })
    }),
    contentController.getSection
  );

  router.put('/levels/:levelId/sections/:id',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: LevelParamSchema.extend({ id: IdParamSchema.shape.id }),
      body: UpdateSectionSchema
    }),
    contentController.updateSection
  );

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

  router.post('/sections/:sectionId/modules',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: SectionParamSchema,
      body: CreateModuleSchema.omit({ section_id: true })
    }),
    contentController.createModule
  );

  router.get('/sections/:sectionId/modules/:id',
    validate({
      params: SectionParamSchema.extend({ id: IdParamSchema.shape.id })
    }),
    contentController.getModule
  );

  router.put('/sections/:sectionId/modules/:id',
    authenticateToken,
    requireRole(['admin', 'content_creator']),
    validate({
      params: SectionParamSchema.extend({ id: IdParamSchema.shape.id }),
      body: UpdateModuleSchema
    }),
    contentController.updateModule
  );

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