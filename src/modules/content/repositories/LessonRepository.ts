// src/modules/content/repositories/LessonRepository.ts

/**
 * Lesson data access repository providing comprehensive CRUD operations and exercise management
 * capabilities for the WayrApp language learning platform. This repository serves as the primary
 * data access layer for lesson management, handling all database interactions through Prisma ORM
 * with advanced querying patterns, exercise assignment operations, and robust relationship management.
 *
 * The repository implements sophisticated lesson-exercise relationship management through a many-to-many
 * association table, enabling flexible exercise assignment, reordering, and removal operations. It provides
 * comprehensive filtering capabilities including experience points range filtering, module-based querying,
 * and standardized pagination support. All queries are optimized for performance with proper relationship
 * loading and consistent data transformation patterns.
 *
 * Key architectural features include automatic data mapping between database schema and application models,
 * transactional exercise reordering operations, comprehensive exercise assignment management, and integration
 * with shared repository helper utilities for consistent query building. The repository supports both
 * individual lesson operations and bulk querying with advanced filtering capabilities essential for
 * lesson discovery and content management workflows.
 *
 * Exercise management capabilities include assignment and unassignment operations, order management for
 * exercise sequences within lessons, and atomic reordering operations using database transactions to
 * ensure data consistency. The repository maintains referential integrity across the lesson-exercise
 * relationship while providing flexible querying options for content delivery and management systems.
 *
 * @module LessonRepository
 * @category Content
 * @category Repositories
 * @category Lesson
 * @author Exequiel Trujillo
 * @since 1.0.0
 *
 * @example
 * // Initialize repository with Prisma client
 * const lessonRepository = new LessonRepository(prisma);
 * 
 * // Create a new lesson
 * const newLesson = await lessonRepository.create({
 *   id: 'lesson-basic-greetings',
 *   module_id: 'module-conversation-basics',
 *   experience_points: 15,
 *   order: 1
 * });
 * 
 * // Query lessons by module with filtering
 * const lessons = await lessonRepository.findByModuleId('module-conversation-basics', {
 *   filters: { experience_points_min: 10, experience_points_max: 50 },
 *   page: 1,
 *   limit: 10,
 *   sortBy: 'order',
 *   sortOrder: 'asc'
 * });
 * 
 * // Assign exercise to lesson
 * const assignment = await lessonRepository.assignExercise('lesson-basic-greetings', 'exercise-translate-hello', 1);
 * 
 * // Reorder exercises within a lesson
 * await lessonRepository.reorderExercises('lesson-basic-greetings', ['exercise-1', 'exercise-3', 'exercise-2']);
 */

import { PrismaClient, Lesson as PrismaLesson } from "@prisma/client";
import { Lesson, CreateLessonDto, LessonExercise } from "../types";
import { PaginatedResult, QueryOptions } from "../../../shared/types";
import {
  buildPrismaQueryParams,
  buildRangeFilterWhere,
  combineWhereConditions,
  createPaginationResult,
  COMMON_FIELD_MAPPINGS,
  SORT_FIELDS
} from "../../../shared/utils/repositoryHelpers";

/**
 * Lesson repository class providing comprehensive data access operations for lesson management
 * and exercise assignment operations. Implements standardized CRUD operations with advanced
 * querying, filtering, pagination, and sophisticated exercise relationship management.
 */
export class LessonRepository {
  /**
   * Creates a new LessonRepository instance
   * 
   * @param {PrismaClient} prisma - Initialized Prisma client for database operations
   */
  constructor(private prisma: PrismaClient) { }

  /**
   * Creates a new lesson in the database with automatic field mapping and default value assignment.
   * Transforms DTO field names to match database schema and applies default experience points value.
   * 
   * @param {CreateLessonDto} data - Lesson creation data with all required fields
   * @param {string} data.id - Unique identifier for the lesson
   * @param {string} data.module_id - Parent module identifier
   * @param {number} [data.experience_points=10] - Experience points awarded for lesson completion (defaults to 10)
   * @param {number} data.order - Order position within the parent module
   * @returns {Promise<Lesson>} Promise resolving to the created lesson with transformed field names
   * @throws {Error} When database operation fails or constraint violations occur
   */
  async create(data: CreateLessonDto): Promise<Lesson> {
    const lesson = await this.prisma.lesson.create({
      data: {
        id: data.id,
        moduleId: data.module_id,
        name: data.name,
        description: data.description ?? null,
        experiencePoints: data.experience_points ?? 10,
        order: data.order,
      },
    });

    return this.mapPrismaToModel(lesson);
  }

  /**
   * Retrieves a single lesson by its unique identifier and module ID with complete exercise information.
   * Includes all assigned exercises with their details, ordered by exercise sequence within the lesson.
   * Uses composite key lookup to prevent horizontal access vulnerabilities.
   * 
   * @param {string} id - Unique identifier of the lesson to retrieve
   * @param {string} moduleId - Module identifier to ensure lesson belongs to the correct module
   * @returns {Promise<Lesson | null>} Promise resolving to lesson with exercises or null if not found
   */
  async findById(id: string, moduleId: string): Promise<Lesson | null> {
    const lesson = await this.prisma.lesson.findUnique({
      where: {
        id,
        moduleId
      },
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!lesson) return null;

    return {
      ...this.mapPrismaToModel(lesson),
      exercises: lesson.exercises.map((le) => this.mapLessonExercise(le)),
    };
  }

  /**
   * Retrieves a paginated list of lessons within a specific module with advanced filtering capabilities.
   * Supports experience points range filtering, comprehensive sorting options, and includes complete
   * exercise information for each lesson ordered by sequence within lessons.
   * 
   * @param {string} moduleId - Parent module identifier to filter lessons
   * @param {QueryOptions} [options={}] - Query configuration options for filtering, pagination, and sorting
   * @param {number} [options.page=1] - Page number for pagination (1-based)
   * @param {number} [options.limit=20] - Maximum number of lessons per page
   * @param {Record<string, any>} [options.filters] - Filter conditions (supports 'experience_points_min' and 'experience_points_max')
   * @param {string} [options.sortBy='order'] - Field to sort by (must be in allowed sort fields)
   * @param {'asc' | 'desc'} [options.sortOrder='asc'] - Sort direction
   * @returns {Promise<PaginatedResult<Lesson>>} Promise resolving to paginated lesson results with exercises
   */
  async findByModuleId(
    moduleId: string,
    options: QueryOptions = {},
  ): Promise<PaginatedResult<Lesson>> {
    const { filters = {} } = options;

    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.LESSON,
      'order',
      COMMON_FIELD_MAPPINGS
    );

    // Build where conditions
    const moduleWhere = { moduleId };
    const experiencePointsWhere = buildRangeFilterWhere(
      filters["experience_points_min"] ? parseInt(filters["experience_points_min"]) : undefined,
      filters["experience_points_max"] ? parseInt(filters["experience_points_max"]) : undefined,
      'experiencePoints'
    );

    const where = combineWhereConditions(
      moduleWhere,
      experiencePointsWhere
    );

    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        ...queryParams,
        where,
        include: {
          exercises: {
            include: {
              exercise: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    const mappedLessons = lessons.map((lesson) => ({
      ...this.mapPrismaToModel(lesson),
      exercises: lesson.exercises.map((le) => this.mapLessonExercise(le)),
    }));

    return createPaginationResult(mappedLessons, total, options.page || 1, options.limit || 20);
  }

  /**
   * Retrieves a paginated list of all lessons with optional module filtering and comprehensive sorting.
   * Supports cross-module lesson querying with module-based filtering and includes complete exercise
   * information for each lesson ordered by sequence within lessons.
   * 
   * @param {QueryOptions} [options={}] - Query configuration options for filtering, pagination, and sorting
   * @param {number} [options.page=1] - Page number for pagination (1-based)
   * @param {number} [options.limit=20] - Maximum number of lessons per page
   * @param {Record<string, any>} [options.filters] - Filter conditions (supports 'module_id' filter)
   * @param {string} [options.sortBy='created_at'] - Field to sort by (must be in allowed sort fields)
   * @param {'asc' | 'desc'} [options.sortOrder='desc'] - Sort direction
   * @returns {Promise<PaginatedResult<Lesson>>} Promise resolving to paginated lesson results with exercises
   */
  async findAll(options: QueryOptions = {}): Promise<PaginatedResult<Lesson>> {
    const { filters = {} } = options;

    // Build query parameters using standardized helpers
    const queryParams = buildPrismaQueryParams(
      options,
      SORT_FIELDS.LESSON,
      'created_at',
      COMMON_FIELD_MAPPINGS
    );

    // Build where conditions
    const moduleWhere = filters["module_id"] ? { moduleId: filters["module_id"] } : {};

    const where = combineWhereConditions(moduleWhere);

    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        ...queryParams,
        where,
        include: {
          exercises: {
            include: {
              exercise: true,
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      }),
      this.prisma.lesson.count({ where }),
    ]);

    const mappedLessons = lessons.map((lesson) => ({
      ...this.mapPrismaToModel(lesson),
      exercises: lesson.exercises.map((le) => this.mapLessonExercise(le)),
    }));

    return createPaginationResult(mappedLessons, total, options.page || 1, options.limit || 20);
  }

  /**
   * Updates an existing lesson with partial data and field mapping transformation.
   * Supports updating experience points and order position with complete exercise information
   * returned in the updated lesson object. Uses composite key lookup to prevent horizontal access vulnerabilities.
   * 
   * @param {string} id - Unique identifier of the lesson to update
   * @param {string} moduleId - Module identifier to ensure lesson belongs to the correct module
   * @param {Partial<CreateLessonDto>} data - Partial lesson data with fields to update
   * @param {number} [data.experience_points] - Updated experience points value
   * @param {number} [data.order] - Updated order position within the module
   * @returns {Promise<Lesson>} Promise resolving to updated lesson with complete exercise information
   * @throws {Error} When lesson is not found or database operation fails
   */
  async update(id: string, moduleId: string, data: Partial<CreateLessonDto>): Promise<Lesson> {
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.experience_points !== undefined)
      updateData.experiencePoints = data.experience_points;
    if (data.order !== undefined) updateData.order = data.order;

    const lesson = await this.prisma.lesson.update({
      where: {
        id,
        moduleId
      },
      data: updateData,
      include: {
        exercises: {
          include: {
            exercise: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    return {
      ...this.mapPrismaToModel(lesson),
      exercises: lesson.exercises.map((le) => this.mapLessonExercise(le)),
    };
  }

  /**
   * Deletes a lesson from the database by its unique identifier and module ID.
   * Handles deletion gracefully with error catching to prevent application crashes.
   * Cascade deletion will automatically remove associated lesson-exercise relationships.
   * Uses composite key lookup to prevent horizontal access vulnerabilities.
   * 
   * @param {string} id - Unique identifier of the lesson to delete
   * @param {string} moduleId - Module identifier to ensure lesson belongs to the correct module
   * @returns {Promise<boolean>} Promise resolving to true if deletion succeeded, false if failed or lesson not found
   */
  async delete(id: string, moduleId: string): Promise<boolean> {
    try {
      await this.prisma.lesson.delete({
        where: {
          id,
          moduleId
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }



  /**
   * Checks if a lesson exists in the database by its unique identifier.
   * Uses efficient count query to determine existence without retrieving full lesson data.
   * 
   * @param {string} id - Unique identifier of the lesson to check
   * @returns {Promise<boolean>} Promise resolving to true if lesson exists, false otherwise
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.prisma.lesson.count({
      where: { id },
    });
    return count > 0;
  }

  /**
   * Assigns an exercise to a lesson at a specific order position.
   * Creates a new lesson-exercise relationship with the specified order for exercise sequencing.
   * 
   * @param {string} lessonId - Unique identifier of the lesson
   * @param {string} exerciseId - Unique identifier of the exercise to assign
   * @param {number} order - Order position of the exercise within the lesson sequence
   * @returns {Promise<LessonExercise>} Promise resolving to the created lesson-exercise assignment with exercise details
   * @throws {Error} When lesson or exercise doesn't exist, or database operation fails
   */
  async assignExercise(
    lessonId: string,
    exerciseId: string,
    order: number,
  ): Promise<LessonExercise> {
    const lessonExercise = await this.prisma.lessonExercise.create({
      data: {
        lessonId,
        exerciseId,
        order,
      },
      include: {
        exercise: true,
      },
    });

    return this.mapLessonExercise(lessonExercise);
  }

  /**
   * Removes an exercise assignment from a lesson.
   * Deletes the lesson-exercise relationship while preserving both the lesson and exercise entities.
   * 
   * @param {string} lessonId - Unique identifier of the lesson
   * @param {string} exerciseId - Unique identifier of the exercise to unassign
   * @returns {Promise<boolean>} Promise resolving to true if unassignment succeeded, false if failed or assignment not found
   */
  async unassignExercise(
    lessonId: string,
    exerciseId: string,
  ): Promise<boolean> {
    try {
      await this.prisma.lessonExercise.delete({
        where: {
          lessonId_exerciseId: {
            lessonId,
            exerciseId,
          },
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Retrieves all exercises assigned to a specific lesson ordered by their sequence.
   * Returns complete exercise information with assignment details for lesson content delivery.
   * 
   * @param {string} lessonId - Unique identifier of the lesson
   * @returns {Promise<LessonExercise[]>} Promise resolving to array of lesson-exercise assignments with exercise details, ordered by sequence
   */
  async getLessonExercises(lessonId: string): Promise<LessonExercise[]> {
    const lessonExercises = await this.prisma.lessonExercise.findMany({
      where: { lessonId },
      include: {
        exercise: true,
      },
      orderBy: {
        order: "asc",
      },
    });

    return lessonExercises.map((le) => this.mapLessonExercise(le));
  }

  /**
   * Reorders exercises within a lesson using atomic transaction operations.
   * Updates the order positions of all specified exercises to match the provided sequence,
   * ensuring data consistency through database transaction isolation.
   * 
   * @param {string} lessonId - Unique identifier of the lesson
   * @param {string[]} exerciseIds - Array of exercise IDs in the desired order sequence
   * @returns {Promise<boolean>} Promise resolving to true if reordering succeeded, false if failed
   * @throws {Error} When transaction fails or exercise assignments don't exist
   */
  async reorderExercises(
    lessonId: string,
    exerciseIds: string[],
  ): Promise<boolean> {
    try {
      // Use a transaction to ensure atomicity
      await this.prisma.$transaction(async (tx) => {
        // Update each exercise with its new order
        for (let i = 0; i < exerciseIds.length; i++) {
          const exerciseId = exerciseIds[i];
          if (exerciseId) {
            await tx.lessonExercise.update({
              where: {
                lessonId_exerciseId: {
                  lessonId,
                  exerciseId,
                },
              },
              data: {
                order: i + 1,
              },
            });
          }
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Maps Prisma lesson model to application Lesson interface with field name transformation.
   * Converts database field names (camelCase) to application field names (snake_case) for
   * consistent API response formatting.
   * 
   * @param {PrismaLesson} lesson - Prisma lesson object from database query
   * @returns {Lesson} Transformed lesson object with application field names
   * @private
   */
  private mapPrismaToModel(lesson: PrismaLesson): Lesson {
    const result: Lesson = {
      id: lesson.id,
      module_id: lesson.moduleId,
      name: lesson.name,
      description: lesson.description,
      experience_points: lesson.experiencePoints,
      order: lesson.order,
      created_at: lesson.createdAt,
      updated_at: lesson.updatedAt,
    };

    return result;
  }

  /**
   * Maps Prisma lesson-exercise relationship to application LessonExercise interface.
   * Transforms database field names and exercise type formatting while preserving complete
   * exercise information when included in the query results.
   * 
   * @param {any} le - Prisma lesson-exercise relationship object with optional exercise details
   * @returns {LessonExercise} Transformed lesson-exercise object with application field names and exercise details
   * @private
   */
  private mapLessonExercise(le: any): LessonExercise {
    const lessonExercise: LessonExercise = {
      lesson_id: le.lessonId,
      exercise_id: le.exerciseId,
      order: le.order,
    };

    if (le.exercise) {
      lessonExercise.exercise = {
        id: le.exercise.id,
        exercise_type: le.exercise.exerciseType.replace("_", "-") as any,
        data: le.exercise.data,
        created_at: le.exercise.createdAt,
        updated_at: le.exercise.updatedAt,
      };
    }

    return lessonExercise;
  }
}
