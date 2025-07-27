// src/modules/content/services/ContentService.ts

/**
 * Business logic service for managing hierarchical educational content in WayrApp.
 * 
 * This service orchestrates the complete lifecycle of educational content through a four-tier hierarchy:
 * Courses → Levels → Sections → Modules → Lessons → Exercises. It serves as the primary business logic layer between REST API
 * controllers and data access repositories, implementing comprehensive validation, intelligent caching,
 * and complex operations like packaged course generation for offline mobile support.
 * 
 * The ContentService ensures data integrity through hierarchical validation, maintains referential
 * consistency across all content operations, and provides optimized caching strategies for performance.
 * It handles the complete CRUD lifecycle for all content entities while maintaining cache coherence
 * and providing specialized features like conditional content packaging with versioning support.
 * 
 * Key architectural responsibilities include hierarchical content validation (ensuring parent entities
 * exist before creating children), unique constraint enforcement (IDs, codes, ordering within parents),
 * intelligent cache invalidation (automatically clearing related caches on content changes), packaged
 * content generation for offline mobile apps with HTTP conditional request support, and comprehensive
 * error handling with detailed AppError responses.
 * 
 * The service integrates seamlessly with Prisma ORM for database operations, Redis caching for
 * performance optimization, and provides TypeScript-first APIs with full type safety across the
 * entire content management workflow.
 * 
 * @module ContentService
 * @category Content
 * @category Services
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic service initialization and course creation
 * import { ContentService } from '@/modules/content/services';
 * import { PrismaClient } from '@prisma/client';
 * 
 * const prisma = new PrismaClient();
 * const contentService = new ContentService(prisma);
 * 
 * // Create a complete course hierarchy
 * const course = await contentService.createCourse({
 *   id: 'spanish-101',
 *   source_language: 'en',
 *   target_language: 'es',
 *   name: 'Spanish for Beginners',
 *   description: 'Learn Spanish from scratch',
 *   is_public: true
 * });
 * 
 * @example
 * // Advanced usage with packaged content for offline support
 * // Get packaged course with all hierarchical content
 * const packagedCourse = await contentService.getPackagedCourse('spanish-101');
 * 
 * // Conditional request to check for updates (HTTP 304 support)
 * const updated = await contentService.getPackagedCourse('spanish-101', '2024-01-01T00:00:00Z');
 * if (updated === null) {
 *   console.log('Course not modified since specified date');
 * }
 * 
 * @example
 * // Hierarchical content creation with validation
 * const level = await contentService.createLevel({
 *   id: 'spanish-101-a1',
 *   course_id: 'spanish-101',
 *   code: 'A1',
 *   name: 'Beginner Level',
 *   order: 1
 * });
 * 
 * const section = await contentService.createSection({
 *   id: 'spanish-101-a1-intro',
 *   level_id: 'spanish-101-a1',
 *   name: 'Introduction',
 *   order: 1
 * });
 */

import { PrismaClient } from '@prisma/client';
import {
  CourseRepository,
  LevelRepository,
  SectionRepository,
  ModuleRepository
} from '../repositories';
import {
  Course,
  Level,
  Section,
  Module,
  CreateCourseDto,
  CreateLevelDto,
  CreateSectionDto,
  CreateModuleDto,
  PackagedCourse
} from '../types';
import { PaginatedResult, QueryOptions, ErrorCodes, HttpStatus } from '../../../shared/types';
import { cacheService, CACHE_KEYS, logger } from '../../../shared/utils';
import { AppError } from '../../../shared/middleware';

/**
 * Main service class implementing comprehensive educational content management operations.
 * 
 * This class provides the complete business logic layer for managing the four-tier content
 * hierarchy with built-in validation, intelligent caching, and specialized features like
 * packaged content generation. All operations maintain referential integrity and automatically
 * invalidate related caches when content is modified.
 * 
 * @class ContentService
 */
export class ContentService {
  private courseRepository: CourseRepository;
  private levelRepository: LevelRepository;
  private sectionRepository: SectionRepository;
  private moduleRepository: ModuleRepository;

  /**
   * Creates a new ContentService instance with initialized repositories for all content entities.
   * 
   * Initializes all repository instances (CourseRepository, LevelRepository, SectionRepository,
   * ModuleRepository) with the provided Prisma client, establishing the foundation for all
   * content management operations with consistent database access patterns.
   * 
   * @param {PrismaClient} prisma - Prisma database client for data access operations across all repositories
   */
  constructor(private prisma: PrismaClient) {
    this.courseRepository = new CourseRepository(prisma);
    this.levelRepository = new LevelRepository(prisma);
    this.sectionRepository = new SectionRepository(prisma);
    this.moduleRepository = new ModuleRepository(prisma);
  }

  // Course operations
  /**
   * Creates a new course with validation to prevent duplicate IDs.
   * 
   * @param {CreateCourseDto} data - Course creation data including ID, languages, name, and optional description
   * @param {string} data.id - Unique identifier for the course
   * @param {string} data.source_language - Source language code (e.g., 'en')
   * @param {string} data.target_language - Target language code (e.g., 'es')
   * @param {string} data.name - Display name of the course
   * @param {string} [data.description] - Optional course description
   * @param {boolean} [data.is_public] - Whether the course is publicly accessible
   * @returns {Promise<Course>} The created course object with timestamps
   * @throws {AppError} When a course with the same ID already exists
   */
  async createCourse(data: CreateCourseDto): Promise<Course> {
    // Check if course with same ID already exists
    const existingCourse = await this.courseRepository.exists(data.id);
    if (existingCourse) {
      throw new AppError(`Course with ID '${data.id}' already exists`, HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
    }

    return await this.courseRepository.create(data);
  }

  /**
   * Retrieves a single course by its unique identifier.
   * 
   * @param {string} id - The unique identifier of the course to retrieve
   * @returns {Promise<Course>} The course object with all its properties
   * @throws {AppError} When no course is found with the specified ID
   */
  async getCourse(id: string): Promise<Course> {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new AppError(`Course with ID '${id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }
    return course;
  }

  /**
   * Retrieves a paginated list of courses with optional filtering and sorting.
   * 
   * @param {QueryOptions} [options={}] - Query options for pagination, sorting, and filtering
   * @param {number} [options.page=1] - Page number for pagination
   * @param {number} [options.limit=20] - Number of items per page
   * @param {string} [options.sortBy] - Field to sort by
   * @param {'asc'|'desc'} [options.sortOrder='desc'] - Sort order
   * @param {Record<string, any>} [options.filters] - Additional filters to apply
   * @param {string} [options.search] - Search term for text-based filtering
   * @returns {Promise<PaginatedResult<Course>>} Paginated result containing courses and pagination metadata
   */
  async getCourses(options: QueryOptions = {}): Promise<PaginatedResult<Course>> {
    return await this.courseRepository.findAll(options);
  }

  /**
   * Updates an existing course with partial data and invalidates related caches.
   * 
   * @param {string} id - The unique identifier of the course to update
   * @param {Partial<CreateCourseDto>} data - Partial course data to update
   * @param {string} [data.source_language] - Updated source language code
   * @param {string} [data.target_language] - Updated target language code
   * @param {string} [data.name] - Updated course name
   * @param {string} [data.description] - Updated course description
   * @param {boolean} [data.is_public] - Updated public visibility status
   * @returns {Promise<Course>} The updated course object
   * @throws {AppError} When no course is found with the specified ID
   */
  async updateCourse(id: string, data: Partial<CreateCourseDto>): Promise<Course> {
    // Check if course exists
    const existingCourse = await this.courseRepository.exists(id);
    if (!existingCourse) {
      throw new AppError(`Course with ID '${id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    const result = await this.courseRepository.update(id, data);

    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(id);

    return result;
  }

  /**
   * Deletes a course and all its associated content, with cache invalidation.
   * 
   * @param {string} id - The unique identifier of the course to delete
   * @returns {Promise<void>} Resolves when the course is successfully deleted
   * @throws {AppError} When no course is found with the specified ID or deletion fails
   */
  async deleteCourse(id: string): Promise<void> {
    const existingCourse = await this.courseRepository.exists(id);
    if (!existingCourse) {
      throw new AppError(`Course with ID '${id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    const success = await this.courseRepository.delete(id);
    if (!success) {
      throw new AppError(`Failed to delete course with ID '${id}'`, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
    }

    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(id);
  }

  // Level operations
  /**
   * Creates a new level within a course with comprehensive validation.
   * 
   * Validates parent course existence, unique level ID, unique code within course,
   * and unique order within course before creation.
   * 
   * @param {CreateLevelDto} data - Level creation data
   * @param {string} data.id - Unique identifier for the level
   * @param {string} data.course_id - ID of the parent course
   * @param {string} data.code - Unique code within the course (e.g., 'A1', 'B2')
   * @param {string} data.name - Display name of the level
   * @param {number} data.order - Ordering position within the course
   * @returns {Promise<Level>} The created level object with timestamps
   * @throws {AppError} When parent course doesn't exist, level ID/code/order conflicts exist
   */
  async createLevel(data: CreateLevelDto): Promise<Level> {
    // Check if parent course exists
    const courseExists = await this.courseRepository.exists(data.course_id);
    if (!courseExists) {
      throw new AppError(`Course with ID '${data.course_id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    // Check if level with same ID already exists
    const existingLevel = await this.levelRepository.exists(data.id);
    if (existingLevel) {
      throw new AppError(`Level with ID '${data.id}' already exists`, HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
    }

    // Check if level code already exists in the course
    const codeExists = await this.levelRepository.existsInCourse(data.course_id, data.code);
    if (codeExists) {
      throw new AppError(`Level with code '${data.code}' already exists in course '${data.course_id}'`, HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
    }

    // Check if order already exists in the course
    const orderExists = await this.levelRepository.existsOrderInCourse(data.course_id, data.order);
    if (orderExists) {
      throw new AppError(`Level with order '${data.order}' already exists in course '${data.course_id}'`, HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
    }

    const result = await this.levelRepository.create(data);

    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(data.course_id);

    return result;
  }

  /**
   * Retrieves a single level by its unique identifier.
   * 
   * @param {string} id - The unique identifier of the level to retrieve
   * @returns {Promise<Level>} The level object with all its properties
   * @throws {AppError} When no level is found with the specified ID
   */
  async getLevel(id: string): Promise<Level> {
    const level = await this.levelRepository.findById(id);
    if (!level) {
      throw new AppError(`Level with ID '${id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }
    return level;
  }

  /**
   * Retrieves all levels belonging to a specific course with pagination support.
   * 
   * @param {string} courseId - The unique identifier of the parent course
   * @param {QueryOptions} [options={}] - Query options for pagination and sorting
   * @param {number} [options.page=1] - Page number for pagination
   * @param {number} [options.limit=20] - Number of items per page
   * @param {string} [options.sortBy='order'] - Field to sort by (typically 'order')
   * @param {'asc'|'desc'} [options.sortOrder='asc'] - Sort order
   * @returns {Promise<PaginatedResult<Level>>} Paginated result containing levels and pagination metadata
   * @throws {AppError} When the parent course doesn't exist
   */
  async getLevelsByCourse(courseId: string, options: QueryOptions = {}): Promise<PaginatedResult<Level>> {
    // Check if course exists
    const courseExists = await this.courseRepository.exists(courseId);
    if (!courseExists) {
      throw new AppError(`Course with ID '${courseId}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    return await this.levelRepository.findByCourseId(courseId, options);
  }

  /**
   * Updates an existing level with validation for code and order uniqueness within the course.
   * 
   * @param {string} id - The unique identifier of the level to update
   * @param {Partial<Omit<CreateLevelDto, 'id' | 'course_id'>>} data - Partial level data to update
   * @param {string} [data.code] - Updated level code (must be unique within course)
   * @param {string} [data.name] - Updated level name
   * @param {number} [data.order] - Updated order position (must be unique within course)
   * @returns {Promise<Level>} The updated level object
   * @throws {AppError} When level doesn't exist or code/order conflicts occur
   */
  async updateLevel(id: string, data: Partial<Omit<CreateLevelDto, 'id' | 'course_id'>>): Promise<Level> {
    // Check if level exists
    const existingLevel = await this.levelRepository.findById(id);
    if (!existingLevel) {
      throw new AppError(`Level with ID '${id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    // Check if new code conflicts with existing levels in the same course
    if (data.code) {
      const codeExists = await this.levelRepository.existsInCourse(existingLevel.course_id, data.code, id);
      if (codeExists) {
        throw new AppError(`Level with code '${data.code}' already exists in course '${existingLevel.course_id}'`, HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
      }
    }

    // Check if new order conflicts with existing levels in the same course
    if (data.order !== undefined) {
      const orderExists = await this.levelRepository.existsOrderInCourse(existingLevel.course_id, data.order, id);
      if (orderExists) {
        throw new AppError(`Level with order '${data.order}' already exists in course '${existingLevel.course_id}'`, HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
      }
    }

    const result = await this.levelRepository.update(id, data);

    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(existingLevel.course_id);

    return result;
  }

  /**
   * Deletes a level and all its associated content with cache invalidation.
   * 
   * @param {string} id - The unique identifier of the level to delete
   * @returns {Promise<void>} Resolves when the level is successfully deleted
   * @throws {AppError} When no level is found with the specified ID or deletion fails
   */
  async deleteLevel(id: string): Promise<void> {
    // Get the level to find the course ID for cache invalidation
    const existingLevel = await this.levelRepository.findById(id);
    if (!existingLevel) {
      throw new AppError(`Level with ID '${id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    const success = await this.levelRepository.delete(id);
    if (!success) {
      throw new AppError(`Failed to delete level with ID '${id}'`, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
    }

    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(existingLevel.course_id);
  }

  // Section operations
  /**
   * Creates a new section within a level with validation for parent existence and order uniqueness.
   * 
   * @param {CreateSectionDto} data - Section creation data
   * @param {string} data.id - Unique identifier for the section
   * @param {string} data.level_id - ID of the parent level
   * @param {string} data.name - Display name of the section
   * @param {number} data.order - Ordering position within the level
   * @returns {Promise<Section>} The created section object with timestamps
   * @throws {AppError} When parent level doesn't exist, section ID conflicts, or order conflicts within level
   */
  async createSection(data: CreateSectionDto): Promise<Section> {
    // Check if parent level exists
    const level = await this.levelRepository.findById(data.level_id);
    if (!level) {
      throw new AppError(`Level with ID '${data.level_id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    // Check if section with same ID already exists
    const existingSection = await this.sectionRepository.exists(data.id);
    if (existingSection) {
      throw new AppError(`Section with ID '${data.id}' already exists`, HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
    }

    // Check if order already exists in the level
    const orderExists = await this.sectionRepository.existsOrderInLevel(data.level_id, data.order);
    if (orderExists) {
      throw new AppError(`Section with order '${data.order}' already exists in level '${data.level_id}'`, HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
    }

    const result = await this.sectionRepository.create(data);

    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(level.course_id);

    return result;
  }

  /**
   * Retrieves a single section by its unique identifier.
   * 
   * @param {string} id - The unique identifier of the section to retrieve
   * @returns {Promise<Section>} The section object with all its properties
   * @throws {AppError} When no section is found with the specified ID
   */
  async getSection(id: string): Promise<Section> {
    const section = await this.sectionRepository.findById(id);
    if (!section) {
      throw new AppError(`Section with ID '${id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }
    return section;
  }

  /**
   * Retrieves all sections belonging to a specific level with pagination support.
   * 
   * @param {string} levelId - The unique identifier of the parent level
   * @param {QueryOptions} [options={}] - Query options for pagination and sorting
   * @param {number} [options.page=1] - Page number for pagination
   * @param {number} [options.limit=20] - Number of items per page
   * @param {string} [options.sortBy='order'] - Field to sort by (typically 'order')
   * @param {'asc'|'desc'} [options.sortOrder='asc'] - Sort order
   * @returns {Promise<PaginatedResult<Section>>} Paginated result containing sections and pagination metadata
   * @throws {AppError} When the parent level doesn't exist
   */
  async getSectionsByLevel(levelId: string, options: QueryOptions = {}): Promise<PaginatedResult<Section>> {
    // Check if level exists
    const levelExists = await this.levelRepository.exists(levelId);
    if (!levelExists) {
      throw new AppError(`Level with ID '${levelId}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    return await this.sectionRepository.findByLevelId(levelId, options);
  }

  /**
   * Updates an existing section with validation for order uniqueness within the level.
   * 
   * @param {string} id - The unique identifier of the section to update
   * @param {Partial<Omit<CreateSectionDto, 'id' | 'level_id'>>} data - Partial section data to update
   * @param {string} [data.name] - Updated section name
   * @param {number} [data.order] - Updated order position (must be unique within level)
   * @returns {Promise<Section>} The updated section object
   * @throws {AppError} When section doesn't exist, parent level doesn't exist, or order conflicts occur
   */
  async updateSection(id: string, data: Partial<Omit<CreateSectionDto, 'id' | 'level_id'>>): Promise<Section> {
    // Check if section exists
    const existingSection = await this.sectionRepository.findById(id);
    if (!existingSection) {
      throw new AppError(`Section with ID '${id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    // Get the level to find the course ID for cache invalidation
    const level = await this.levelRepository.findById(existingSection.level_id);
    if (!level) {
      throw new AppError(`Level with ID '${existingSection.level_id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    // Check if new order conflicts with existing sections in the same level
    if (data.order !== undefined) {
      const orderExists = await this.sectionRepository.existsOrderInLevel(existingSection.level_id, data.order, id);
      if (orderExists) {
        throw new AppError(`Section with order '${data.order}' already exists in level '${existingSection.level_id}'`, HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
      }
    }

    const result = await this.sectionRepository.update(id, data);

    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(level.course_id);

    return result;
  }

  /**
   * Deletes a section and all its associated content with cache invalidation.
   * 
   * @param {string} id - The unique identifier of the section to delete
   * @returns {Promise<void>} Resolves when the section is successfully deleted
   * @throws {AppError} When no section is found, parent level doesn't exist, or deletion fails
   */
  async deleteSection(id: string): Promise<void> {
    // Get the section to find the level and course ID for cache invalidation
    const existingSection = await this.sectionRepository.findById(id);
    if (!existingSection) {
      throw new AppError(`Section with ID '${id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    // Get the level to find the course ID for cache invalidation
    const level = await this.levelRepository.findById(existingSection.level_id);
    if (!level) {
      throw new AppError(`Level with ID '${existingSection.level_id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    const success = await this.sectionRepository.delete(id);
    if (!success) {
      throw new AppError(`Failed to delete section with ID '${id}'`, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
    }

    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(level.course_id);
  }

  // Module operations
  /**
   * Creates a new module within a section with comprehensive validation.
   * 
   * @param {CreateModuleDto} data - Module creation data
   * @param {string} data.id - Unique identifier for the module
   * @param {string} data.section_id - ID of the parent section
   * @param {'informative'|'basic_lesson'|'reading'|'dialogue'|'exam'} data.module_type - Type of module content
   * @param {string} data.name - Display name of the module
   * @param {number} data.order - Ordering position within the section
   * @returns {Promise<Module>} The created module object with timestamps
   * @throws {AppError} When parent section/level doesn't exist, module ID conflicts, or order conflicts within section
   */
  async createModule(data: CreateModuleDto): Promise<Module> {
    // Check if parent section exists and get its level info for cache invalidation
    const section = await this.sectionRepository.findById(data.section_id);
    if (!section) {
      throw new AppError(`Section with ID '${data.section_id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    // Get the level to find the course ID for cache invalidation
    const level = await this.levelRepository.findById(section.level_id);
    if (!level) {
      throw new AppError(`Level with ID '${section.level_id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    // Check if module with same ID already exists
    const existingModule = await this.moduleRepository.exists(data.id);
    if (existingModule) {
      throw new AppError(`Module with ID '${data.id}' already exists`, HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
    }

    // Check if order already exists in the section
    const orderExists = await this.moduleRepository.existsOrderInSection(data.section_id, data.order);
    if (orderExists) {
      throw new AppError(`Module with order '${data.order}' already exists in section '${data.section_id}'`, HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
    }

    const result = await this.moduleRepository.create(data);

    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(level.course_id);

    return result;
  }

  /**
   * Retrieves a single module by its unique identifier.
   * 
   * @param {string} id - The unique identifier of the module to retrieve
   * @returns {Promise<Module>} The module object with all its properties
   * @throws {AppError} When no module is found with the specified ID
   */
  async getModule(id: string): Promise<Module> {
    const module = await this.moduleRepository.findById(id);
    if (!module) {
      throw new AppError(`Module with ID '${id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }
    return module;
  }

  /**
   * Retrieves all modules belonging to a specific section with pagination support.
   * 
   * @param {string} sectionId - The unique identifier of the parent section
   * @param {QueryOptions} [options={}] - Query options for pagination, sorting, and filtering
   * @param {number} [options.page=1] - Page number for pagination
   * @param {number} [options.limit=20] - Number of items per page
   * @param {string} [options.sortBy='order'] - Field to sort by (typically 'order')
   * @param {'asc'|'desc'} [options.sortOrder='asc'] - Sort order
   * @param {Record<string, any>} [options.filters] - Additional filters (e.g., module_type)
   * @returns {Promise<PaginatedResult<Module>>} Paginated result containing modules and pagination metadata
   * @throws {AppError} When the parent section doesn't exist
   */
  async getModulesBySection(sectionId: string, options: QueryOptions = {}): Promise<PaginatedResult<Module>> {
    // Check if section exists
    const sectionExists = await this.sectionRepository.exists(sectionId);
    if (!sectionExists) {
      throw new AppError(`Section with ID '${sectionId}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    return await this.moduleRepository.findBySectionId(sectionId, options);
  }

  /**
   * Updates an existing module with validation for order uniqueness within the section.
   * 
   * @param {string} id - The unique identifier of the module to update
   * @param {Partial<Omit<CreateModuleDto, 'id' | 'section_id'>>} data - Partial module data to update
   * @param {'informative'|'basic_lesson'|'reading'|'dialogue'|'exam'} [data.module_type] - Updated module type
   * @param {string} [data.name] - Updated module name
   * @param {number} [data.order] - Updated order position (must be unique within section)
   * @returns {Promise<Module>} The updated module object
   * @throws {AppError} When module doesn't exist, parent section/level doesn't exist, or order conflicts occur
   */
  async updateModule(id: string, data: Partial<Omit<CreateModuleDto, 'id' | 'section_id'>>): Promise<Module> {
    // Check if module exists
    const existingModule = await this.moduleRepository.findById(id);
    if (!existingModule) {
      throw new AppError(`Module with ID '${id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    // Get the section and level to find the course ID for cache invalidation
    const section = await this.sectionRepository.findById(existingModule.section_id);
    if (!section) {
      throw new AppError(`Section with ID '${existingModule.section_id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    const level = await this.levelRepository.findById(section.level_id);
    if (!level) {
      throw new AppError(`Level with ID '${section.level_id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    // Check if new order conflicts with existing modules in the same section
    if (data.order !== undefined) {
      const orderExists = await this.moduleRepository.existsOrderInSection(existingModule.section_id, data.order, id);
      if (orderExists) {
        throw new AppError(`Module with order '${data.order}' already exists in section '${existingModule.section_id}'`, HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
      }
    }

    const result = await this.moduleRepository.update(id, data);

    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(level.course_id);

    return result;
  }

  /**
   * Deletes a module and all its associated content with cache invalidation.
   * 
   * @param {string} id - The unique identifier of the module to delete
   * @returns {Promise<void>} Resolves when the module is successfully deleted
   * @throws {AppError} When no module is found, parent section/level doesn't exist, or deletion fails
   */
  async deleteModule(id: string): Promise<void> {
    // Get the module to find the section and course ID for cache invalidation
    const existingModule = await this.moduleRepository.findById(id);
    if (!existingModule) {
      throw new AppError(`Module with ID '${id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    // Get the section and level to find the course ID for cache invalidation
    const section = await this.sectionRepository.findById(existingModule.section_id);
    if (!section) {
      throw new AppError(`Section with ID '${existingModule.section_id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    const level = await this.levelRepository.findById(section.level_id);
    if (!level) {
      throw new AppError(`Level with ID '${section.level_id}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
    }

    const success = await this.moduleRepository.delete(id);
    if (!success) {
      throw new AppError(`Failed to delete module with ID '${id}'`, HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);
    }

    // Invalidate packaged course cache
    await this.invalidatePackagedCourseCache(level.course_id);
  }

  // Packaged content for offline support with caching and versioning
  /**
   * Generates a complete packaged course with all hierarchical content for offline support.
   * 
   * This method creates a comprehensive package containing the entire course hierarchy
   * (course → levels → sections → modules → lessons → exercises) optimized for offline use.
   * Implements intelligent caching with 15-minute TTL and supports conditional requests
   * via If-Modified-Since headers for efficient bandwidth usage.
   * 
   * @param {string} courseId - The unique identifier of the course to package
   * @param {string} [ifModifiedSince] - Optional If-Modified-Since header value for conditional requests
   * @returns {Promise<PackagedCourse | null>} Complete packaged course or null if not modified since specified date
   * @throws {AppError} When course doesn't exist or packaging fails
   * 
   * @example
   * ```typescript
   * // Get full packaged course
   * const packagedCourse = await contentService.getPackagedCourse('spanish-101');
   * 
   * // Conditional request to check for updates
   * const updated = await contentService.getPackagedCourse('spanish-101', '2024-01-01T00:00:00Z');
   * if (updated === null) {
   *   console.log('Course not modified since specified date');
   * }
   * ```
   */
  async getPackagedCourse(courseId: string, ifModifiedSince?: string): Promise<PackagedCourse | null> {
    const cacheKey = CACHE_KEYS.PACKAGED_COURSE(courseId);

    try {
      // Check cache first
      const cachedResult = await cacheService.get<PackagedCourse>(cacheKey);
      if (cachedResult) {
        logger.debug(`Returning cached packaged course: ${courseId}`);

        // If client provided If-Modified-Since header, check if content has been modified
        if (ifModifiedSince) {
          const clientVersion = new Date(ifModifiedSince);
          const packageVersion = new Date(cachedResult.package_version);

          if (packageVersion <= clientVersion) {
            logger.debug(`Course ${courseId} not modified since ${ifModifiedSince}`);
            return null; // Return null to indicate 304 Not Modified
          }
        }

        return cachedResult;
      }

      // Get the latest updated timestamp for the entire course hierarchy
      const courseWithTimestamp = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          updatedAt: true,
          levels: {
            select: {
              updatedAt: true,
              sections: {
                select: {
                  updatedAt: true,
                  modules: {
                    select: {
                      updatedAt: true,
                      lessons: {
                        select: {
                          updatedAt: true,
                          exercises: {
                            select: {
                              exercise: {
                                select: {
                                  updatedAt: true
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!courseWithTimestamp) {
        throw new AppError(`Course with ID '${courseId}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
      }

      // Calculate the most recent update timestamp across the entire hierarchy
      const allTimestamps = [
        courseWithTimestamp.updatedAt,
        ...courseWithTimestamp.levels.flatMap(level => [
          level.updatedAt,
          ...level.sections.flatMap(section => [
            section.updatedAt,
            ...section.modules.flatMap(module => [
              module.updatedAt,
              ...module.lessons.flatMap(lesson => [
                lesson.updatedAt,
                ...lesson.exercises.map(le => le.exercise.updatedAt)
              ])
            ])
          ])
        ])
      ];

      const latestUpdateTime = new Date(Math.max(...allTimestamps.map(t => t.getTime())));

      // Check if client's version is up to date
      if (ifModifiedSince) {
        const clientVersion = new Date(ifModifiedSince);
        if (latestUpdateTime <= clientVersion) {
          logger.debug(`Course ${courseId} not modified since ${ifModifiedSince}`);
          return null; // Return null to indicate 304 Not Modified
        }
      }

      // Fetch the complete packaged course data with optimized query
      const packagedCourse = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          levels: {
            orderBy: { order: 'asc' },
            include: {
              sections: {
                orderBy: { order: 'asc' },
                include: {
                  modules: {
                    orderBy: { order: 'asc' },
                    include: {
                      lessons: {
                        orderBy: { order: 'asc' },
                        include: {
                          exercises: {
                            orderBy: { order: 'asc' },
                            include: {
                              exercise: true
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!packagedCourse) {
        throw new AppError(`Course with ID '${courseId}' not found`, HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
      }

      // Transform the data to match the PackagedCourse interface
      const result: PackagedCourse = {
        course: {
          id: packagedCourse.id,
          source_language: packagedCourse.sourceLanguage,
          target_language: packagedCourse.targetLanguage,
          name: packagedCourse.name,
          description: packagedCourse.description ?? '',
          is_public: packagedCourse.isPublic,
          created_at: packagedCourse.createdAt,
          updated_at: packagedCourse.updatedAt
        },
        levels: packagedCourse.levels.map(level => ({
          id: level.id,
          course_id: level.courseId,
          code: level.code,
          name: level.name,
          order: level.order,
          created_at: level.createdAt,
          updated_at: level.updatedAt,
          sections: level.sections.map(section => ({
            id: section.id,
            level_id: section.levelId,
            name: section.name,
            order: section.order,
            created_at: section.createdAt,
            updated_at: section.updatedAt,
            modules: section.modules.map(module => ({
              id: module.id,
              section_id: module.sectionId,
              module_type: module.moduleType as 'informative' | 'basic_lesson' | 'reading' | 'dialogue' | 'exam',
              name: module.name,
              order: module.order,
              created_at: module.createdAt,
              updated_at: module.updatedAt,
              lessons: module.lessons.map(lesson => ({
                id: lesson.id,
                module_id: lesson.moduleId,
                experience_points: lesson.experiencePoints,
                order: lesson.order,
                created_at: lesson.createdAt,
                updated_at: lesson.updatedAt,
                exercises: lesson.exercises.map(lessonExercise => ({
                  lesson_id: lessonExercise.lessonId,
                  exercise_id: lessonExercise.exerciseId,
                  order: lessonExercise.order,
                  exercise: {
                    id: lessonExercise.exercise.id,
                    exercise_type: lessonExercise.exercise.exerciseType as 'translation' | 'fill-in-the-blank' | 'vof' | 'pairs' | 'informative' | 'ordering',
                    data: lessonExercise.exercise.data,
                    created_at: lessonExercise.exercise.createdAt,
                    updated_at: lessonExercise.exercise.updatedAt
                  }
                }))
              }))
            }))
          }))
        })),
        package_version: latestUpdateTime.toISOString()
      };

      // Cache the result for 15 minutes (packaged courses are large and expensive to generate)
      await cacheService.set(cacheKey, result, 15 * 60 * 1000);

      logger.info(`Generated and cached packaged course: ${courseId}, version: ${result.package_version}`);
      return result;

    } catch (error) {
      logger.error(`Error generating packaged course ${courseId}:`, error);
      throw error;
    }
  }

  /**
   * Invalidates the packaged course cache when content is updated.
   * 
   * This method is automatically called by all content modification operations
   * (create, update, delete) to ensure cache consistency across the content hierarchy.
   * 
   * @param {string} courseId - The unique identifier of the course whose cache should be invalidated
   * @returns {Promise<void>} Resolves when cache invalidation is complete
   */
  async invalidatePackagedCourseCache(courseId: string): Promise<void> {
    const cacheKey = CACHE_KEYS.PACKAGED_COURSE(courseId);
    await cacheService.delete(cacheKey);
    logger.debug(`Invalidated packaged course cache: ${courseId}`);
  }
}