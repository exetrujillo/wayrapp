// src/modules/content/repositories/CourseRepository.ts

/**
 * Course data access repository providing comprehensive CRUD operations and advanced querying capabilities
 * for the WayrApp language learning platform. This repository serves as the primary data access layer for
 * course management, handling all database interactions through Prisma ORM with optimized query patterns,
 * pagination support, and robust error handling.
 *
 * The repository implements standardized patterns for data transformation between Prisma models and
 * application DTOs, ensuring consistent data structures across the application. It provides advanced
 * filtering capabilities including text search across course names and descriptions, boolean filtering
 * for public/private courses, and comprehensive sorting options. All queries are optimized for performance
 * with proper indexing strategies and include relationship counting for efficient data retrieval.
 *
 * Key architectural features include automatic data mapping between database schema and application models,
 * standardized pagination with configurable limits, comprehensive error handling for database operations,
 * and integration with the shared repository helper utilities for consistent query building patterns.
 * The repository supports both individual course operations and bulk querying with advanced filtering
 * capabilities essential for course discovery and management workflows.
 *
 * @module CourseRepository
 * @category Content
 * @category Repositories
 * @category Course
 * @author Exequiel Trujillo
 * @since 1.0.0
 *
 * @example
 * // Initialize repository with Prisma client
 * const courseRepository = new CourseRepository(prisma);
 * 
 * // Create a new course
 * const newCourse = await courseRepository.create({
 *   id: 'spanish-101',
 *   source_language: 'en',
 *   target_language: 'es',
 *   name: 'Spanish for Beginners',
 *   description: 'Learn basic Spanish vocabulary and grammar',
 *   is_public: true
 * });
 * 
 * // Query courses with filtering and pagination
 * const courses = await courseRepository.findAll({
 *   search: 'spanish',
 *   filters: { is_public: true },
 *   page: 1,
 *   limit: 10,
 *   sortBy: 'name',
 *   sortOrder: 'asc'
 * });
 */

import { PrismaClient, Prisma } from "@prisma/client";
import { Course, CreateCourseDto } from "../types";
import { PaginatedResult, QueryOptions } from "../../../shared/types";
import {
  buildPrismaQueryParams,
  buildTextSearchWhere,
  buildBooleanFilterWhere,
  combineWhereConditions,
  createPaginationResult,
  COMMON_FIELD_MAPPINGS,
  SORT_FIELDS,
} from "../../../shared/utils/repositoryHelpers";

/**
 * Prisma validator for course queries that include level counts
 * Defines the standard payload structure for course queries with relationship counting
 */
const courseWithCountsPayload = Prisma.validator<Prisma.CourseDefaultArgs>()({
  include: {
    _count: {
      select: { levels: true },
    },
  },
});

/**
 * Type definition for course data with included level counts
 * Represents the structure returned by Prisma queries with relationship counting
 */
type CourseWithCountsPayload = Prisma.CourseGetPayload<typeof courseWithCountsPayload>;

/**
 * Course repository class providing comprehensive data access operations for course management.
 * Implements standardized CRUD operations with advanced querying, filtering, and pagination capabilities.
 */
export class CourseRepository {
  /**
   * Creates a new CourseRepository instance
   * 
   * @param {PrismaClient} prisma - Initialized Prisma client for database operations
   */
  constructor(private prisma: PrismaClient) { }

  /**
   * Creates a new course in the database with automatic field mapping and validation.
   * Transforms DTO field names to match database schema and applies default values.
   * 
   * @param {CreateCourseDto} data - Course creation data with all required fields
   * @param {string} data.id - Unique identifier for the course
   * @param {string} data.source_language - Source language code (e.g., 'en', 'es')
   * @param {string} data.target_language - Target language code (e.g., 'en', 'es')
   * @param {string} data.name - Display name of the course
   * @param {string} [data.description] - Optional detailed description of the course
   * @param {boolean} [data.is_public] - Whether the course is publicly accessible (defaults to true)
   * @returns {Promise<Course>} Promise resolving to the created course with transformed field names
   * @throws {Error} When database operation fails or constraint violations occur
   */
  async create(data: CreateCourseDto): Promise<Course> {
    const course = await this.prisma.course.create({
      data: {
        id: data.id,
        sourceLanguage: data.source_language,
        targetLanguage: data.target_language,
        name: data.name,
        ...(data.description && { description: data.description }),
        isPublic: data.is_public ?? true,
      },
    });

    return {
      id: course.id,
      source_language: course.sourceLanguage,
      target_language: course.targetLanguage,
      name: course.name,
      is_public: course.isPublic,
      created_at: course.createdAt,
      updated_at: course.updatedAt,
      ...(course.description && { description: course.description }),
    };
  }

  /**
   * Retrieves a single course by its unique identifier with level count information.
   * Includes relationship counting for associated levels to provide comprehensive course data.
   * 
   * @param {string} id - Unique identifier of the course to retrieve
   * @returns {Promise<(Course & { levels_count: number }) | null>} Promise resolving to course with level count or null if not found
   */
  async findById(id: string): Promise<(Course & { levels_count: number }) | null> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { levels: true },
        },
      },
    });

    if (!course) return null;

    return this.mapPrismaToModel(course);
  }

  /**
   * Retrieves a paginated list of courses with advanced filtering, searching, and sorting capabilities.
   * Supports text search across course names and descriptions, boolean filtering for public/private courses,
   * and comprehensive sorting options with level count information included for each course.
   * 
   * @param {QueryOptions} [options={}] - Query configuration options for filtering, pagination, and sorting
   * @param {number} [options.page=1] - Page number for pagination (1-based)
   * @param {number} [options.limit=20] - Maximum number of courses per page
   * @param {string} [options.search] - Text search query applied to course names and descriptions
   * @param {Record<string, any>} [options.filters] - Filter conditions (supports 'is_public' boolean filter)
   * @param {string} [options.sortBy='created_at'] - Field to sort by (must be in allowed sort fields)
   * @param {'asc' | 'desc'} [options.sortOrder='desc'] - Sort direction
   * @returns {Promise<PaginatedResult<Course & { levels_count: number }>>} Promise resolving to paginated course results with level counts
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Course & { levels_count: number }>> {
    const { filters = {}, search } = options;
    const queryParams = buildPrismaQueryParams(options, SORT_FIELDS.COURSE, 'created_at', COMMON_FIELD_MAPPINGS);
    const searchWhere = buildTextSearchWhere(search, ['name', 'description']);
    const isPublicWhere = buildBooleanFilterWhere(filters["is_public"], 'isPublic');

    const where = combineWhereConditions(searchWhere, isPublicWhere);

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        ...queryParams,
        where,
        include: {
          _count: {
            select: { levels: true },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    const mappedCourses = courses.map((course) => this.mapPrismaToModel(course));

    return createPaginationResult(mappedCourses, total, options.page || 1, options.limit || 20);
  }

  /**
   * Updates an existing course with partial data and field mapping transformation.
   * Supports updating any combination of course fields with proper null/undefined handling
   * for optional fields like description.
   * 
   * @param {string} id - Unique identifier of the course to update
   * @param {Partial<CreateCourseDto>} data - Partial course data with fields to update
   * @param {string} [data.source_language] - Updated source language code
   * @param {string} [data.target_language] - Updated target language code
   * @param {string} [data.name] - Updated course name
   * @param {string | undefined} [data.description] - Updated description (undefined to remove)
   * @param {boolean} [data.is_public] - Updated public visibility status
   * @returns {Promise<Course & { levels_count: number }>} Promise resolving to updated course with level count
   * @throws {Error} When course is not found or database operation fails
   */
  async update(id: string, data: Partial<CreateCourseDto>): Promise<Course & { levels_count: number }> {
    const updateData: Prisma.CourseUpdateInput = {}; // Usar el tipo correcto de Prisma

    if (data.source_language) updateData.sourceLanguage = data.source_language;
    if (data.target_language) updateData.targetLanguage = data.target_language;
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.is_public !== undefined) updateData.isPublic = data.is_public;

    const course = await this.prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { levels: true },
        },
      },
    });

    return this.mapPrismaToModel(course);
  }

  /**
   * Deletes a course from the database by its unique identifier.
   * Handles deletion gracefully with error catching to prevent application crashes.
   * 
   * @param {string} id - Unique identifier of the course to delete
   * @returns {Promise<boolean>} Promise resolving to true if deletion succeeded, false if failed or course not found
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.course.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if a course exists in the database by its unique identifier.
   * Uses efficient count query to determine existence without retrieving full course data.
   * 
   * @param {string} id - Unique identifier of the course to check
   * @returns {Promise<boolean>} Promise resolving to true if course exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.course.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Maps Prisma course model to application Course interface with field name transformation.
   * Converts database field names (camelCase) to application field names (snake_case) and
   * extracts relationship counts from Prisma's _count structure.
   * 
   * @param {CourseWithCountsPayload} course - Prisma course object with included level counts
   * @returns {Course & { levels_count: number }} Transformed course object with application field names and level count
   * @private
   */
  private mapPrismaToModel(course: CourseWithCountsPayload): Course & { levels_count: number } {
    return {
      id: course.id,
      source_language: course.sourceLanguage,
      target_language: course.targetLanguage,
      name: course.name,
      is_public: course.isPublic,
      created_at: course.createdAt,
      updated_at: course.updatedAt,
      ...(course.description && { description: course.description }),
      levels_count: course._count.levels,
    };
  }
}