// src/modules/content/services/LessonService.ts

/**
 * Lesson management service for the WayrApp language learning platform.
 * 
 * This service provides complete CRUD operations for lessons within the content management system,
 * handling lesson lifecycle management, exercise assignment, and ordering operations. It serves as
 * the primary business logic layer for lesson-related operations, ensuring data integrity through
 * comprehensive validation and maintaining referential consistency across the content hierarchy.
 * 
 * The service manages lessons as part of the content structure: Course → Level → Section → Module → Lesson → Exercise.
 * Each lesson belongs to a specific module and can contain multiple exercises in a defined order.
 * The service handles complex operations like exercise assignment, reordering, and validation of
 * hierarchical relationships while providing paginated results for efficient data retrieval.
 * 
 * Key architectural responsibilities include lesson creation with module validation, lesson retrieval
 * with pagination support, lesson updates with order conflict resolution, lesson deletion with
 * dependency checks, exercise-to-lesson assignment management, and exercise reordering within lessons.
 * The service integrates with repository layers for data persistence and provides comprehensive
 * error handling for all business rule violations.
 * 
 * @module LessonService
 * @category Content
 * @category Services
 * @category Lesson
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Initialize service with Prisma client
 * import { PrismaClient } from '@prisma/client';
 * import { LessonService } from './LessonService';
 * 
 * const prisma = new PrismaClient();
 * const lessonService = new LessonService(prisma);
 * 
 * // Create a new lesson
 * const newLesson = await lessonService.createLesson({
 *   id: 'lesson-basic-intro',
 *   module_id: 'module-greetings',
 *   experience_points: 50,
 *   order: 1
 * });
 * 
 * // Get lessons by module with pagination
 * const lessons = await lessonService.getLessonsByModule('module-greetings', {
 *   page: 1,
 *   limit: 10,
 *   sortBy: 'order',
 *   sortOrder: 'asc'
 * });
 * 
 * // Assign exercise to lesson
 * const assignment = await lessonService.assignExerciseToLesson('lesson-basic-intro', {
 *   exercise_id: 'exercise-translate-hello',
 *   order: 1
 * });
 */

import { PrismaClient } from '@prisma/client';
import { LessonRepository, ExerciseRepository, ModuleRepository } from '../repositories';
import {
  Lesson,
  CreateLessonDto,
  LessonExercise,
  AssignExerciseToLessonDto
} from '../types';
import { PaginatedResult, QueryOptions } from '../../../shared/types';
import { AppError } from '../../../shared/middleware/errorHandler';
import { HttpStatus, ErrorCodes } from '../../../shared/types';

/**
 * Service class for comprehensive lesson management operations within the WayrApp content system.
 * 
 * Provides complete CRUD functionality for lessons, exercise assignment management, and maintains
 * data integrity across the content hierarchy. Handles complex business logic including validation
 * of module relationships, order conflict resolution, and exercise reordering operations.
 */
export class LessonService {
  private lessonRepository: LessonRepository;
  private exerciseRepository: ExerciseRepository;
  private moduleRepository: ModuleRepository;

  /**
   * Initializes the LessonService with required repository dependencies.
   * 
   * @param {PrismaClient} prisma - Prisma database client for repository initialization
   */
  constructor(prisma: PrismaClient) {
    this.lessonRepository = new LessonRepository(prisma);
    this.exerciseRepository = new ExerciseRepository(prisma);
    this.moduleRepository = new ModuleRepository(prisma);
  }

  /**
   * Creates a new lesson within a specified module with comprehensive validation.
   * 
   * Validates module existence, ensures lesson ID uniqueness, and prevents order conflicts
   * within the parent module before creating the lesson record.
   * 
   * @param {CreateLessonDto} data - Lesson creation data including ID, module_id, experience_points, and order
   * @returns {Promise<Lesson>} The newly created lesson object
   * @throws {Error} When parent module doesn't exist
   * @throws {Error} When lesson ID already exists
   * @throws {Error} When lesson order conflicts with existing lessons in the module
   * 
   * @example
   * const lesson = await lessonService.createLesson({
   *   id: 'lesson-intro-greetings',
   *   module_id: 'module-basic-conversation',
   *   experience_points: 25,
   *   order: 1
   * });
   */
  async createLesson(data: CreateLessonDto): Promise<Lesson> {
    // Check if parent module exists
    const moduleExists = await this.moduleRepository.exists(data.module_id);
    if (!moduleExists) {
      throw new AppError(
        `Module with ID '${data.module_id}' not found`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Check if lesson with same ID already exists
    const existingLesson = await this.lessonRepository.exists(data.id);
    if (existingLesson) {
      throw new AppError(
        `Lesson with ID '${data.id}' already exists`,
        HttpStatus.CONFLICT,
        ErrorCodes.CONFLICT
      );
    }

    // Check if order already exists in the module
    const orderExists = await this.moduleRepository.existsLessonOrderInModule(data.module_id, data.order);
    if (orderExists) {
      throw new AppError(
        `Lesson with order '${data.order}' already exists in module '${data.module_id}'`,
        HttpStatus.CONFLICT,
        ErrorCodes.CONFLICT
      );
    }

    return await this.lessonRepository.create(data);
  }

  /**
   * Retrieves a single lesson by its unique identifier and module ID.
   * Uses composite key lookup to prevent horizontal access vulnerabilities.
   * 
   * @param {string} id - The unique lesson identifier
   * @param {string} moduleId - The module identifier to ensure lesson belongs to the correct module
   * @returns {Promise<Lesson>} The lesson object with all its properties
   * @throws {Error} When lesson with the specified ID is not found or doesn't belong to the module
   * 
   * @example
   * const lesson = await lessonService.getLesson('lesson-intro-greetings', 'module-basic-conversation');
   * console.log(lesson.experience_points); // 25
   */
  async getLesson(id: string, moduleId: string): Promise<Lesson> {
    const lesson = await this.lessonRepository.findById(id, moduleId);
    if (!lesson) {
      throw new AppError(
        `Lesson with ID '${id}' not found`,
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );
    }
    return lesson;
  }

  /**
   * Retrieves paginated lessons belonging to a specific module.
   * 
   * Validates module existence before fetching lessons with support for pagination,
   * sorting, and filtering options.
   * 
   * @param {string} moduleId - The unique module identifier
   * @param {QueryOptions} [options={}] - Query options for pagination, sorting, and filtering
   * @param {number} [options.page] - Page number for pagination
   * @param {number} [options.limit] - Number of items per page
   * @param {string} [options.sortBy] - Field to sort by
   * @param {'asc' | 'desc'} [options.sortOrder] - Sort direction
   * @returns {Promise<PaginatedResult<Lesson>>} Paginated lesson results with metadata
   * @throws {Error} When module with the specified ID is not found
   * 
   * @example
   * const result = await lessonService.getLessonsByModule('module-basic-conversation', {
   *   page: 1,
   *   limit: 5,
   *   sortBy: 'order',
   *   sortOrder: 'asc'
   * });
   * console.log(result.data.length); // Up to 5 lessons
   * console.log(result.pagination.total); // Total lesson count
   */
  async getLessonsByModule(moduleId: string, options: QueryOptions = {}): Promise<PaginatedResult<Lesson>> {
    // Check if module exists
    const moduleExists = await this.moduleRepository.exists(moduleId);
    if (!moduleExists) {
      throw new AppError(
        `Module with ID '${moduleId}' not found`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    return await this.lessonRepository.findByModuleId(moduleId, options);
  }

  /**
   * Retrieves paginated lessons across all modules in the system.
   * 
   * @param {QueryOptions} [options={}] - Query options for pagination, sorting, and filtering
   * @param {number} [options.page] - Page number for pagination
   * @param {number} [options.limit] - Number of items per page
   * @param {string} [options.sortBy] - Field to sort by
   * @param {'asc' | 'desc'} [options.sortOrder] - Sort direction
   * @param {Record<string, any>} [options.filters] - Additional filters to apply
   * @returns {Promise<PaginatedResult<Lesson>>} Paginated lesson results with metadata
   * 
   * @example
   * const allLessons = await lessonService.getLessons({
   *   page: 1,
   *   limit: 20,
   *   sortBy: 'created_at',
   *   sortOrder: 'desc'
   * });
   */
  async getLessons(options: QueryOptions = {}): Promise<PaginatedResult<Lesson>> {
    return await this.lessonRepository.findAll(options);
  }

  /**
   * Updates an existing lesson with partial data and order conflict validation.
   * Uses composite key lookup to prevent horizontal access vulnerabilities.
   * 
   * Validates lesson existence and prevents order conflicts within the same module
   * when updating lesson properties. ID and module_id cannot be modified.
   * 
   * @param {string} id - The unique lesson identifier
   * @param {string} moduleId - The module identifier to ensure lesson belongs to the correct module
   * @param {Partial<Omit<CreateLessonDto, 'id' | 'module_id'>>} data - Partial lesson data for update
   * @param {number} [data.experience_points] - Updated experience points value
   * @param {number} [data.order] - Updated lesson order within the module
   * @returns {Promise<Lesson>} The updated lesson object
   * @throws {Error} When lesson with the specified ID is not found or doesn't belong to the module
   * @throws {Error} When new order conflicts with existing lessons in the module
   * 
   * @example
   * const updatedLesson = await lessonService.updateLesson('lesson-intro-greetings', 'module-basic-conversation', {
   *   experience_points: 30,
   *   order: 2
   * });
   */
  async updateLesson(id: string, moduleId: string, data: Partial<Omit<CreateLessonDto, 'id' | 'module_id'>>): Promise<Lesson> {
    // Check if lesson exists and belongs to the specified module
    const existingLesson = await this.lessonRepository.findById(id, moduleId);
    if (!existingLesson) {
      throw new AppError(
        `Lesson with ID '${id}' not found`,
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );
    }

    // Check if new order conflicts with existing lessons in the same module
    if (data.order !== undefined) {
      const orderExists = await this.moduleRepository.existsLessonOrderInModule(moduleId, data.order, id);
      if (orderExists) {
        throw new AppError(
          `Lesson with order '${data.order}' already exists in module '${moduleId}'`,
          HttpStatus.CONFLICT,
          ErrorCodes.CONFLICT
        );
      }
    }

    return await this.lessonRepository.update(id, moduleId, data);
  }

  /**
   * Permanently deletes a lesson and all its associated exercise assignments.
   * Uses composite key lookup to prevent horizontal access vulnerabilities.
   * 
   * Validates lesson existence before deletion and ensures the operation completes successfully.
   * This operation cascades to remove all lesson-exercise relationships.
   * 
   * @param {string} id - The unique lesson identifier
   * @param {string} moduleId - The module identifier to ensure lesson belongs to the correct module
   * @returns {Promise<void>} Resolves when deletion is complete
   * @throws {Error} When lesson with the specified ID is not found or doesn't belong to the module
   * @throws {Error} When deletion operation fails
   * 
   * @example
   * await lessonService.deleteLesson('lesson-intro-greetings', 'module-basic-conversation');
   * // Lesson and all its exercise assignments are now deleted
   */
  async deleteLesson(id: string, moduleId: string): Promise<void> {
    // Check if lesson exists and belongs to the specified module
    const existingLesson = await this.lessonRepository.findById(id, moduleId);
    if (!existingLesson) {
      throw new AppError(
        `Lesson with ID '${id}' not found`,
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );
    }

    const success = await this.lessonRepository.delete(id, moduleId);
    if (!success) {
      throw new AppError(
        `Failed to delete lesson with ID '${id}'`,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR
      );
    }
  }

  /**
   * Assigns an exercise to a lesson at a specific order position with comprehensive validation.
   * 
   * Validates both lesson and exercise existence, prevents duplicate assignments, and ensures
   * order uniqueness within the lesson before creating the assignment relationship.
   * 
   * @param {string} lessonId - The unique lesson identifier
   * @param {AssignExerciseToLessonDto} data - Exercise assignment data
   * @param {string} data.exercise_id - The unique exercise identifier to assign
   * @param {number} data.order - The order position of the exercise within the lesson
   * @returns {Promise<LessonExercise>} The created lesson-exercise assignment relationship
   * @throws {Error} When lesson with the specified ID is not found
   * @throws {Error} When exercise with the specified ID is not found
   * @throws {Error} When exercise is already assigned to the lesson
   * @throws {Error} When order position is already occupied in the lesson
   * 
   * @example
   * const assignment = await lessonService.assignExerciseToLesson('lesson-intro-greetings', {
   *   exercise_id: 'exercise-translate-hello',
   *   order: 1
   * });
   * console.log(assignment.lesson_id); // 'lesson-intro-greetings'
   * console.log(assignment.exercise_id); // 'exercise-translate-hello'
   */
  async assignExerciseToLesson(lessonId: string, data: AssignExerciseToLessonDto): Promise<LessonExercise> {
    // Check if lesson exists
    const lessonExists = await this.lessonRepository.exists(lessonId);
    if (!lessonExists) {
      throw new AppError(
        `Lesson with ID '${lessonId}' not found`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Check if exercise exists
    const exerciseExists = await this.exerciseRepository.exists(data.exercise_id);
    if (!exerciseExists) {
      throw new AppError(
        `Exercise with ID '${data.exercise_id}' not found`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Check if exercise is already assigned to this lesson
    const existingAssignment = await this.lessonRepository.getLessonExercises(lessonId);
    const alreadyAssigned = existingAssignment.some(le => le.exercise_id === data.exercise_id);
    if (alreadyAssigned) {
      throw new AppError(
        `Exercise '${data.exercise_id}' is already assigned to lesson '${lessonId}'`,
        HttpStatus.CONFLICT,
        ErrorCodes.CONFLICT
      );
    }

    // Check if order already exists for this lesson
    const orderExists = existingAssignment.some(le => le.order === data.order);
    if (orderExists) {
      throw new AppError(
        `Exercise with order '${data.order}' already exists in lesson '${lessonId}'`,
        HttpStatus.CONFLICT,
        ErrorCodes.CONFLICT
      );
    }

    return await this.lessonRepository.assignExercise(lessonId, data.exercise_id, data.order);
  }

  /**
   * Removes an exercise assignment from a lesson with validation.
   * 
   * Validates lesson and exercise existence, confirms the assignment relationship exists,
   * and removes the lesson-exercise association.
   * 
   * @param {string} lessonId - The unique lesson identifier
   * @param {string} exerciseId - The unique exercise identifier to unassign
   * @returns {Promise<void>} Resolves when unassignment is complete
   * @throws {Error} When lesson with the specified ID is not found
   * @throws {Error} When exercise with the specified ID is not found
   * @throws {Error} When exercise is not assigned to the lesson
   * @throws {Error} When unassignment operation fails
   * 
   * @example
   * await lessonService.unassignExerciseFromLesson('lesson-intro-greetings', 'exercise-translate-hello');
   * // Exercise is now removed from the lesson
   */
  async unassignExerciseFromLesson(lessonId: string, exerciseId: string): Promise<void> {
    // Check if lesson exists
    const lessonExists = await this.lessonRepository.exists(lessonId);
    if (!lessonExists) {
      throw new AppError(
        `Lesson with ID '${lessonId}' not found`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Check if exercise exists
    const exerciseExists = await this.exerciseRepository.exists(exerciseId);
    if (!exerciseExists) {
      throw new AppError(
        `Exercise with ID '${exerciseId}' not found`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Check if exercise is assigned to this lesson
    const existingAssignment = await this.lessonRepository.getLessonExercises(lessonId);
    const isAssigned = existingAssignment.some(le => le.exercise_id === exerciseId);
    if (!isAssigned) {
      throw new AppError(
        `Exercise '${exerciseId}' is not assigned to lesson '${lessonId}'`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    const success = await this.lessonRepository.unassignExercise(lessonId, exerciseId);
    if (!success) {
      throw new AppError(
        `Failed to unassign exercise '${exerciseId}' from lesson '${lessonId}'`,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR
      );
    }
  }

  /**
   * Retrieves all exercises assigned to a specific lesson in their defined order.
   * 
   * Validates lesson existence and returns all lesson-exercise relationships
   * sorted by their order position within the lesson.
   * 
   * @param {string} lessonId - The unique lesson identifier
   * @returns {Promise<LessonExercise[]>} Array of lesson-exercise assignments ordered by position
   * @throws {Error} When lesson with the specified ID is not found
   * 
   * @example
   * const exercises = await lessonService.getLessonExercises('lesson-intro-greetings');
   * exercises.forEach(ex => {
   *   console.log(`Exercise ${ex.exercise_id} at position ${ex.order}`);
   * });
   */
  async getLessonExercises(lessonId: string): Promise<LessonExercise[]> {
    // Check if lesson exists
    const lessonExists = await this.lessonRepository.exists(lessonId);
    if (!lessonExists) {
      throw new AppError(
        `Lesson with ID '${lessonId}' not found`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    return await this.lessonRepository.getLessonExercises(lessonId);
  }

  /**
   * Reorders exercises within a lesson by updating their position sequence.
   * 
   * Validates lesson existence, ensures all provided exercise IDs are currently assigned
   * to the lesson, validates completeness of the reorder list, and prevents duplicates
   * before applying the new exercise order.
   * 
   * @param {string} lessonId - The unique lesson identifier
   * @param {string[]} exerciseIds - Array of exercise IDs in their new desired order
   * @returns {Promise<void>} Resolves when reordering is complete
   * @throws {Error} When lesson with the specified ID is not found
   * @throws {Error} When provided exercise IDs are not assigned to the lesson
   * @throws {Error} When reorder list is incomplete (missing currently assigned exercises)
   * @throws {Error} When duplicate exercise IDs are provided in the reorder list
   * @throws {Error} When reordering operation fails
   * 
   * @example
   * // Reorder exercises in a lesson
   * await lessonService.reorderLessonExercises('lesson-intro-greetings', [
   *   'exercise-translate-hello',
   *   'exercise-fill-blank-greeting',
   *   'exercise-match-responses'
   * ]);
   * // Exercises are now in the specified order
   */
  async reorderLessonExercises(lessonId: string, exerciseIds: string[]): Promise<void> {
    // Check if lesson exists
    const lessonExists = await this.lessonRepository.exists(lessonId);
    if (!lessonExists) {
      throw new AppError(
        `Lesson with ID '${lessonId}' not found`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Get current lesson exercises
    const currentExercises = await this.lessonRepository.getLessonExercises(lessonId);

    // Validate that all provided exercise IDs are currently assigned to this lesson
    const currentExerciseIds = currentExercises.map(le => le.exercise_id);
    const missingExercises = exerciseIds.filter(id => !currentExerciseIds.includes(id));
    if (missingExercises.length > 0) {
      throw new AppError(
        `Exercises not assigned to lesson '${lessonId}': ${missingExercises.join(', ')}`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Validate that all currently assigned exercises are included in the reorder
    const extraExercises = currentExerciseIds.filter(id => !exerciseIds.includes(id));
    if (extraExercises.length > 0) {
      throw new AppError(
        `Missing exercises in reorder for lesson '${lessonId}': ${extraExercises.join(', ')}`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Validate no duplicates in the provided list
    const uniqueIds = new Set(exerciseIds);
    if (uniqueIds.size !== exerciseIds.length) {
      throw new AppError(
        'Duplicate exercise IDs provided in reorder list',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    const success = await this.lessonRepository.reorderExercises(lessonId, exerciseIds);
    if (!success) {
      throw new AppError(
        `Failed to reorder exercises for lesson '${lessonId}'`,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR
      );
    }
  }

  /**
   * Reorders lessons within a module by updating their position sequence.
   * 
   * Validates module existence, ensures all provided lesson IDs are currently assigned
   * to the module, validates completeness of the reorder list, and prevents duplicates
   * before applying the new lesson order.
   * 
   * @param {string} moduleId - The unique module identifier
   * @param {string[]} lessonIds - Array of lesson IDs in their new desired order
   * @returns {Promise<void>} Resolves when reordering is complete
   * @throws {Error} When module with the specified ID is not found
   * @throws {Error} When provided lesson IDs are not assigned to the module
   * @throws {Error} When reorder list is incomplete (missing currently assigned lessons)
   * @throws {Error} When duplicate lesson IDs are provided in the reorder list
   * @throws {Error} When reordering operation fails
   * 
   * @example
   * // Reorder lessons in a module
   * await lessonService.reorderLessons('module-basic-conversation', [
   *   'lesson-greetings',
   *   'lesson-introductions',
   *   'lesson-farewells'
   * ]);
   * // Lessons are now in the specified order
   */
  async reorderLessons(moduleId: string, lessonIds: string[]): Promise<void> {
    // Check if module exists
    const moduleExists = await this.moduleRepository.exists(moduleId);
    if (!moduleExists) {
      throw new AppError(
        `Module with ID '${moduleId}' not found`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Get current lessons in the module
    const currentLessons = await this.lessonRepository.findByModuleId(moduleId, {
      page: 1,
      limit: 1000, // Get all lessons
      sortBy: 'order',
      sortOrder: 'asc'
    });

    // Validate that all provided lesson IDs are currently assigned to this module
    const currentLessonIds = currentLessons.data.map(lesson => lesson.id);
    const missingLessons = lessonIds.filter(id => !currentLessonIds.includes(id));
    if (missingLessons.length > 0) {
      throw new AppError(
        `Lessons not assigned to module '${moduleId}': ${missingLessons.join(', ')}`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Validate that all currently assigned lessons are included in the reorder
    const extraLessons = currentLessonIds.filter(id => !lessonIds.includes(id));
    if (extraLessons.length > 0) {
      throw new AppError(
        `Missing lessons in reorder for module '${moduleId}': ${extraLessons.join(', ')}`,
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    // Validate no duplicates in the provided list
    const uniqueIds = new Set(lessonIds);
    if (uniqueIds.size !== lessonIds.length) {
      throw new AppError(
        'Duplicate lesson IDs provided in reorder list',
        HttpStatus.BAD_REQUEST,
        ErrorCodes.VALIDATION_ERROR
      );
    }

    const success = await this.lessonRepository.reorderLessons(moduleId, lessonIds);
    if (!success) {
      throw new AppError(
        `Failed to reorder lessons for module '${moduleId}'`,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCodes.DATABASE_ERROR
      );
    }
  }
}