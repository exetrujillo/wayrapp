// src/modules/content/repositories/ExerciseRepository.ts

/**
 * Exercise data access repository providing comprehensive CRUD operations and type-specific querying
 * capabilities for the WayrApp language learning platform. This repository serves as the primary
 * data access layer for exercise management, handling all database interactions through Prisma ORM
 * with advanced filtering patterns, type-based querying, and robust data transformation operations.
 *
 * The repository supports multiple exercise types including translation, fill-in-the-blank, true/false
 * (vof), pairs matching, informative content, and ordering exercises. Each exercise type maintains
 * flexible JSON data structures while providing consistent access patterns through standardized
 * repository methods. The system handles automatic type transformation between API format (dash-separated)
 * and database format (underscore-separated) for seamless integration.
 *
 * Key architectural features include automatic data mapping between database schema and application models,
 * type-specific filtering capabilities, bulk retrieval operations for lesson assembly, and comprehensive
 * pagination support. The repository integrates with shared repository helper utilities for consistent
 * query building patterns and provides optimized querying for exercise discovery and content management.
 *
 * Exercise data management includes flexible JSON storage for type-specific configurations, efficient
 * type-based filtering for content organization, bulk operations for lesson construction, and consistent
 * field name transformation for API compatibility. The repository maintains referential integrity while
 * providing flexible querying options essential for content delivery and management systems.
 *
 * @module ExerciseRepository
 * @category Content
 * @category Repositories
 * @category Exercise
 * @author Exequiel Trujillo
 * @since 1.0.0
 *
 * @example
 * // Initialize repository with Prisma client
 * const exerciseRepository = new ExerciseRepository(prisma);
 * 
 * // Create a new translation exercise
 * const newExercise = await exerciseRepository.create({
 *   id: 'exercise-translate-hello',
 *   exercise_type: 'translation',
 *   data: {
 *     source_text: 'Hello',
 *     target_text: 'Hola',
 *     hints: ['greeting', 'common phrase']
 *   }
 * });
 * 
 * // Query exercises by type with pagination
 * const fillBlankExercises = await exerciseRepository.findByType('fill-in-the-blank', {
 *   page: 1,
 *   limit: 10,
 *   sortBy: 'created_at',
 *   sortOrder: 'desc'
 * });
 * 
 * // Bulk retrieve exercises for lesson assembly
 * const lessonExercises = await exerciseRepository.findByIds([
 *   'exercise-translate-hello',
 *   'exercise-fill-greeting',
 *   'exercise-vof-statement'
 * ]);
 */

import { PrismaClient, Exercise as PrismaExercise } from "@prisma/client";
import { Exercise, CreateExerciseDto } from "../types";
import { PaginatedResult, QueryOptions } from "../../../shared/types";
import {
  buildPrismaQueryParams,
  buildEnumFilterWhere,
  combineWhereConditions,
  createPaginationResult,
  COMMON_FIELD_MAPPINGS,
  SORT_FIELDS
} from "../../../shared/utils/repositoryHelpers";

/**
 * Exercise repository class providing comprehensive data access operations for exercise management
 * across multiple exercise types. Implements standardized CRUD operations with type-specific
 * filtering, bulk operations, and advanced querying capabilities.
 */
export class ExerciseRepository {
  /**
   * Creates a new ExerciseRepository instance
   * 
   * @param {PrismaClient} prisma - Initialized Prisma client for database operations
   */
  constructor(private prisma: PrismaClient) {}

  /**
   * Creates a new exercise in the database with automatic type transformation and field mapping.
   * Transforms exercise type from API format (dash-separated) to database format (underscore-separated)
   * and stores flexible JSON data structure for type-specific configurations.
   * 
   * @param {CreateExerciseDto} data - Exercise creation data with all required fields
   * @param {string} data.id - Unique identifier for the exercise
   * @param {'translation' | 'fill-in-the-blank' | 'vof' | 'pairs' | 'informative' | 'ordering'} data.exercise_type - Type of exercise (API format with dashes)
   * @param {any} data.data - Type-specific exercise configuration data as JSON object
   * @returns {Promise<Exercise>} Promise resolving to the created exercise with transformed field names
   * @throws {Error} When database operation fails or constraint violations occur
   */
  async create(data: CreateExerciseDto): Promise<Exercise> {
    const exercise = await this.prisma.exercise.create({
      data: {
        id: data.id,
        exerciseType: data.exercise_type.replace('-', '_') as any,
        data: data.data,
      },
    });

    return this.mapPrismaToModel(exercise);
  }

  /**
   * Retrieves a single exercise by its unique identifier with complete type-specific data.
   * Returns the exercise with transformed field names and type formatting for API compatibility.
   * 
   * @param {string} id - Unique identifier of the exercise to retrieve
   * @returns {Promise<Exercise | null>} Promise resolving to exercise with type-specific data or null if not found
   */
  async findById(id: string): Promise<Exercise | null> {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) return null;

    return this.mapPrismaToModel(exercise);
  }

  /**
   * Retrieves a paginated list of all exercises with advanced filtering and sorting capabilities.
   * Supports exercise type filtering with automatic format transformation and comprehensive
   * sorting options for exercise discovery and management workflows.
   * 
   * @param {QueryOptions} [options={}] - Query configuration options for filtering, pagination, and sorting
   * @param {number} [options.page=1] - Page number for pagination (1-based)
   * @param {number} [options.limit=20] - Maximum number of exercises per page
   * @param {Record<string, any>} [options.filters] - Filter conditions (supports 'exercise_type' filter)
   * @param {string} [options.sortBy='created_at'] - Field to sort by (must be in allowed sort fields)
   * @param {'asc' | 'desc'} [options.sortOrder='desc'] - Sort direction
   * @returns {Promise<PaginatedResult<Exercise>>} Promise resolving to paginated exercise results with type-specific data
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Exercise>> {
    const { filters = {} } = options;

    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.EXERCISE,
      'created_at',
      COMMON_FIELD_MAPPINGS
    );

    // Build where conditions
    const exerciseTypeWhere = filters["exercise_type"] 
      ? buildEnumFilterWhere(filters["exercise_type"].replace('-', '_'), 'exerciseType')
      : {};

    const where = combineWhereConditions(exerciseTypeWhere);

    const [exercises, total] = await Promise.all([
      this.prisma.exercise.findMany({
        ...queryParams,
        where,
      }),
      this.prisma.exercise.count({ where }),
    ]);

    const mappedExercises = exercises.map((exercise) => 
      this.mapPrismaToModel(exercise)
    );

    return createPaginationResult(mappedExercises, total, options.page || 1, options.limit || 20);
  }

  /**
   * Updates an existing exercise with partial data and automatic type transformation.
   * Supports updating exercise type and data with proper format conversion and field mapping.
   * Handles undefined data values appropriately for JSON field updates.
   * 
   * @param {string} id - Unique identifier of the exercise to update
   * @param {Partial<CreateExerciseDto>} data - Partial exercise data with fields to update
   * @param {'translation' | 'fill-in-the-blank' | 'vof' | 'pairs' | 'informative' | 'ordering'} [data.exercise_type] - Updated exercise type (API format)
   * @param {any} [data.data] - Updated type-specific exercise configuration data
   * @returns {Promise<Exercise>} Promise resolving to updated exercise with transformed field names
   * @throws {Error} When exercise is not found or database operation fails
   */
  async update(id: string, data: Partial<CreateExerciseDto>): Promise<Exercise> {
    const updateData: any = {};

    if (data.exercise_type) updateData.exerciseType = data.exercise_type.replace('-', '_') as any;
    if (data.data !== undefined) updateData.data = data.data;

    const exercise = await this.prisma.exercise.update({
      where: { id },
      data: updateData,
    });

    return this.mapPrismaToModel(exercise);
  }

  /**
   * Deletes an exercise from the database by its unique identifier.
   * Handles deletion gracefully with error catching to prevent application crashes.
   * Cascade deletion will automatically remove associated lesson-exercise relationships.
   * 
   * @param {string} id - Unique identifier of the exercise to delete
   * @returns {Promise<boolean>} Promise resolving to true if deletion succeeded, false if failed or exercise not found
   */
  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.exercise.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if an exercise exists in the database by its unique identifier.
   * Uses efficient count query to determine existence without retrieving full exercise data.
   * 
   * @param {string} id - Unique identifier of the exercise to check
   * @returns {Promise<boolean>} Promise resolving to true if exercise exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.exercise.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Retrieves a paginated list of exercises filtered by specific exercise type.
   * Automatically transforms exercise type from API format to database format and provides
   * comprehensive pagination and sorting capabilities for type-specific exercise discovery.
   * 
   * @param {string} exerciseType - Exercise type to filter by (API format with dashes: 'fill-in-the-blank', 'translation', etc.)
   * @param {QueryOptions} [options={}] - Query configuration options for pagination and sorting
   * @param {number} [options.page=1] - Page number for pagination (1-based)
   * @param {number} [options.limit=20] - Maximum number of exercises per page
   * @param {string} [options.sortBy='created_at'] - Field to sort by (must be in allowed sort fields)
   * @param {'asc' | 'desc'} [options.sortOrder='desc'] - Sort direction
   * @returns {Promise<PaginatedResult<Exercise>>} Promise resolving to paginated exercises of the specified type
   */
  async findByType(exerciseType: string, options: QueryOptions = {}): Promise<PaginatedResult<Exercise>> {
    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.EXERCISE,
      'created_at',
      COMMON_FIELD_MAPPINGS
    );

    const prismaExerciseType = exerciseType.replace('-', '_') as any;
    const where = { exerciseType: prismaExerciseType };

    const [exercises, total] = await Promise.all([
      this.prisma.exercise.findMany({
        ...queryParams,
        where,
      }),
      this.prisma.exercise.count({ where }),
    ]);

    const mappedExercises = exercises.map((exercise) => 
      this.mapPrismaToModel(exercise)
    );

    return createPaginationResult(mappedExercises, total, options.page || 1, options.limit || 20);
  }

  /**
   * Retrieves multiple exercises by their unique identifiers in a single database query.
   * Optimized for bulk operations such as lesson assembly where multiple exercises need
   * to be fetched efficiently. Results maintain the same order as input IDs when possible.
   * 
   * @param {string[]} ids - Array of unique exercise identifiers to retrieve
   * @returns {Promise<Exercise[]>} Promise resolving to array of exercises with complete type-specific data
   */
  async findByIds(ids: string[]): Promise<Exercise[]> {
    const exercises = await this.prisma.exercise.findMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return exercises.map((exercise) => this.mapPrismaToModel(exercise));
  }

  /**
   * Maps Prisma exercise model to application Exercise interface with field name and type transformation.
   * Converts database field names (camelCase) to application field names (snake_case) and transforms
   * exercise type from database format (underscore-separated) to API format (dash-separated).
   * 
   * @param {PrismaExercise} exercise - Prisma exercise object from database query
   * @returns {Exercise} Transformed exercise object with application field names and API-compatible type format
   * @private
   */
  private mapPrismaToModel(exercise: PrismaExercise): Exercise {
    return {
      id: exercise.id,
      exercise_type: exercise.exerciseType.replace('_', '-') as any,
      data: exercise.data,
      created_at: exercise.createdAt,
      updated_at: exercise.updatedAt,
    };
  }
}