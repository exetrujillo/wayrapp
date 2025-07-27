// src/modules/content/services/ExerciseService.ts

/**
 * Exercise management service for the WayrApp language learning platform.
 * 
 * This service provides CRUD operations for exercises within the content management system,
 * handling exercise lifecycle management, type-specific validation, and data integrity enforcement.
 * It serves as the primary business logic layer for exercise-related operations, ensuring that all
 * exercise data conforms to type-specific schemas and maintaining consistency across the platform.
 * 
 * The service manages six distinct exercise types: translation (source-to-target language conversion),
 * fill-in-the-blank (text completion with multiple blanks), vof (true/false verification),
 * pairs (matching left-right associations), informative (content display), and ordering (sequence arrangement).
 * Each exercise type has its own validation rules and data structure requirements that are enforced
 * during creation and updates.
 * 
 * Key architectural responsibilities include exercise creation with type-specific validation,
 * exercise retrieval with pagination and filtering support, exercise updates with data consistency checks,
 * exercise deletion with dependency validation, bulk exercise retrieval by IDs, and comprehensive
 * data validation for all supported exercise types. The service integrates with the repository layer
 * for data persistence and provides detailed error handling for all business rule violations.
 * 
 * Exercise data validation is performed through private methods that ensure each exercise type
 * contains the required fields and follows the correct data structure. This includes validating
 * translation pairs, blank positions and answers, boolean statements, matching pairs, informative
 * content, and ordering sequences with proper numbering.
 * 
 * @module ExerciseService
 * @category Content
 * @category Services
 * @category Exercise
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Initialize service with Prisma client
 * import { PrismaClient } from '@prisma/client';
 * import { ExerciseService } from './ExerciseService';
 * 
 * const prisma = new PrismaClient();
 * const exerciseService = new ExerciseService(prisma);
 * 
 * // Create a translation exercise
 * const translationExercise = await exerciseService.createExercise({
 *   id: 'exercise-translate-hello',
 *   exercise_type: 'translation',
 *   data: {
 *     source_text: 'Hello',
 *     target_text: 'Hola',
 *     hints: ['greeting', 'common phrase']
 *   }
 * });
 * 
 * // Get exercises by type with pagination
 * const fillBlankExercises = await exerciseService.getExercisesByType('fill-in-the-blank', {
 *   page: 1,
 *   limit: 10,
 *   sortBy: 'created_at',
 *   sortOrder: 'desc'
 * });
 * 
 * // Bulk retrieve exercises by IDs
 * const exercises = await exerciseService.getExercisesByIds([
 *   'exercise-translate-hello',
 *   'exercise-fill-greeting',
 *   'exercise-vof-statement'
 * ]);
 */

import { PrismaClient } from '@prisma/client';
import { ExerciseRepository } from '../repositories';
import {
  Exercise,
  CreateExerciseDto
} from '../types';
import { PaginatedResult, QueryOptions } from '../../../shared/types';

/**
 * Service class for comprehensive exercise management operations within the WayrApp content system.
 * 
 * Provides complete CRUD functionality for exercises with type-specific validation, data integrity
 * enforcement, and comprehensive business logic for all supported exercise types in the platform.
 */
export class ExerciseService {
  private exerciseRepository: ExerciseRepository;

  /**
   * Initializes the ExerciseService with required repository dependencies.
   * 
   * @param {PrismaClient} prisma - Prisma database client for repository initialization
   */
  constructor(prisma: PrismaClient) {
    this.exerciseRepository = new ExerciseRepository(prisma);
  }

  /**
   * Creates a new exercise with comprehensive validation and type-specific data verification.
   * 
   * Validates exercise ID uniqueness and performs type-specific data validation to ensure
   * the exercise data conforms to the expected schema for the specified exercise type.
   * 
   * @param {CreateExerciseDto} data - Exercise creation data including ID, type, and type-specific data
   * @param {string} data.id - Unique exercise identifier
   * @param {'translation' | 'fill-in-the-blank' | 'vof' | 'pairs' | 'informative' | 'ordering'} data.exercise_type - Type of exercise
   * @param {any} data.data - Type-specific exercise data object
   * @returns {Promise<Exercise>} The newly created exercise object
   * @throws {Error} When exercise ID already exists
   * @throws {Error} When exercise data validation fails for the specified type
   * 
   * @example
   * // Create a fill-in-the-blank exercise
   * const exercise = await exerciseService.createExercise({
   *   id: 'exercise-fill-greeting',
   *   exercise_type: 'fill-in-the-blank',
   *   data: {
   *     text: 'Hello, my name is _____ and I am from _____.',
   *     blanks: [
   *       { position: 18, correct_answers: ['John', 'Jane'], hints: ['common name'] },
   *       { position: 40, correct_answers: ['Spain', 'Mexico'], hints: ['country'] }
   *     ]
   *   }
   * });
   */
  async createExercise(data: CreateExerciseDto): Promise<Exercise> {
    // Check if exercise with same ID already exists
    const existingExercise = await this.exerciseRepository.exists(data.id);
    if (existingExercise) {
      throw new Error(`Exercise with ID '${data.id}' already exists`);
    }

    // Validate exercise data based on type
    this.validateExerciseData(data.exercise_type, data.data);

    return await this.exerciseRepository.create(data);
  }

  /**
   * Retrieves a single exercise by its unique identifier.
   * 
   * @param {string} id - The unique exercise identifier
   * @returns {Promise<Exercise>} The exercise object with all its properties and type-specific data
   * @throws {Error} When exercise with the specified ID is not found
   * 
   * @example
   * const exercise = await exerciseService.getExercise('exercise-translate-hello');
   * console.log(exercise.exercise_type); // 'translation'
   * console.log(exercise.data.source_text); // 'Hello'
   */
  async getExercise(id: string): Promise<Exercise> {
    const exercise = await this.exerciseRepository.findById(id);
    if (!exercise) {
      throw new Error(`Exercise with ID '${id}' not found`);
    }
    return exercise;
  }

  /**
   * Retrieves paginated exercises across all types in the system.
   * 
   * @param {QueryOptions} [options={}] - Query options for pagination, sorting, and filtering
   * @param {number} [options.page] - Page number for pagination
   * @param {number} [options.limit] - Number of items per page
   * @param {string} [options.sortBy] - Field to sort by
   * @param {'asc' | 'desc'} [options.sortOrder] - Sort direction
   * @param {Record<string, any>} [options.filters] - Additional filters to apply
   * @returns {Promise<PaginatedResult<Exercise>>} Paginated exercise results with metadata
   * 
   * @example
   * const allExercises = await exerciseService.getExercises({
   *   page: 1,
   *   limit: 20,
   *   sortBy: 'created_at',
   *   sortOrder: 'desc',
   *   filters: { exercise_type: 'translation' }
   * });
   */
  async getExercises(options: QueryOptions = {}): Promise<PaginatedResult<Exercise>> {
    return await this.exerciseRepository.findAll(options);
  }

  /**
   * Retrieves paginated exercises filtered by a specific exercise type.
   * 
   * Validates the exercise type against supported types before querying and returns
   * exercises matching the specified type with pagination support.
   * 
   * @param {string} exerciseType - The exercise type to filter by
   * @param {QueryOptions} [options={}] - Query options for pagination, sorting, and filtering
   * @param {number} [options.page] - Page number for pagination
   * @param {number} [options.limit] - Number of items per page
   * @param {string} [options.sortBy] - Field to sort by
   * @param {'asc' | 'desc'} [options.sortOrder] - Sort direction
   * @returns {Promise<PaginatedResult<Exercise>>} Paginated exercise results filtered by type
   * @throws {Error} When exercise type is not one of the valid supported types
   * 
   * @example
   * const translationExercises = await exerciseService.getExercisesByType('translation', {
   *   page: 1,
   *   limit: 10,
   *   sortBy: 'created_at',
   *   sortOrder: 'asc'
   * });
   * // Returns only translation exercises
   */
  async getExercisesByType(exerciseType: string, options: QueryOptions = {}): Promise<PaginatedResult<Exercise>> {
    // Validate exercise type
    const validTypes = ['translation', 'fill-in-the-blank', 'vof', 'pairs', 'informative', 'ordering'];
    if (!validTypes.includes(exerciseType)) {
      throw new Error(`Invalid exercise type '${exerciseType}'. Valid types: ${validTypes.join(', ')}`);
    }

    return await this.exerciseRepository.findByType(exerciseType, options);
  }

  /**
   * Updates an existing exercise with partial data and comprehensive validation.
   * 
   * Validates exercise existence and performs type-specific data validation when exercise
   * data is updated. If only data is provided without type, validates against the current
   * exercise type to maintain data consistency.
   * 
   * @param {string} id - The unique exercise identifier
   * @param {Partial<CreateExerciseDto>} data - Partial exercise data for update
   * @param {'translation' | 'fill-in-the-blank' | 'vof' | 'pairs' | 'informative' | 'ordering'} [data.exercise_type] - Updated exercise type
   * @param {any} [data.data] - Updated type-specific exercise data
   * @returns {Promise<Exercise>} The updated exercise object
   * @throws {Error} When exercise with the specified ID is not found
   * @throws {Error} When exercise data validation fails for the specified or current type
   * 
   * @example
   * const updatedExercise = await exerciseService.updateExercise('exercise-translate-hello', {
   *   data: {
   *     source_text: 'Hello world',
   *     target_text: 'Hola mundo',
   *     hints: ['greeting', 'common phrase', 'world']
   *   }
   * });
   */
  async updateExercise(id: string, data: Partial<CreateExerciseDto>): Promise<Exercise> {
    // Check if exercise exists
    const existingExercise = await this.exerciseRepository.exists(id);
    if (!existingExercise) {
      throw new Error(`Exercise with ID '${id}' not found`);
    }

    // Validate exercise data if provided
    if (data.exercise_type && data.data) {
      this.validateExerciseData(data.exercise_type, data.data);
    } else if (data.data) {
      // If only data is provided, get current exercise to validate against its type
      const currentExercise = await this.exerciseRepository.findById(id);
      if (currentExercise) {
        this.validateExerciseData(currentExercise.exercise_type, data.data);
      }
    }

    return await this.exerciseRepository.update(id, data);
  }

  /**
   * Permanently deletes an exercise and removes it from all lesson assignments.
   * 
   * Validates exercise existence before deletion and ensures the operation completes successfully.
   * This operation may cascade to remove exercise assignments from lessons.
   * 
   * @param {string} id - The unique exercise identifier
   * @returns {Promise<void>} Resolves when deletion is complete
   * @throws {Error} When exercise with the specified ID is not found
   * @throws {Error} When deletion operation fails
   * 
   * @example
   * await exerciseService.deleteExercise('exercise-translate-hello');
   * // Exercise is now permanently deleted from the system
   */
  async deleteExercise(id: string): Promise<void> {
    const existingExercise = await this.exerciseRepository.exists(id);
    if (!existingExercise) {
      throw new Error(`Exercise with ID '${id}' not found`);
    }

    const success = await this.exerciseRepository.delete(id);
    if (!success) {
      throw new Error(`Failed to delete exercise with ID '${id}'`);
    }
  }

  /**
   * Retrieves multiple exercises by their unique identifiers in a single query.
   * 
   * Efficiently fetches multiple exercises by their IDs, returning them in the order
   * found in the database. Returns an empty array if no IDs are provided.
   * 
   * @param {string[]} ids - Array of unique exercise identifiers
   * @returns {Promise<Exercise[]>} Array of exercise objects matching the provided IDs
   * 
   * @example
   * const exercises = await exerciseService.getExercisesByIds([
   *   'exercise-translate-hello',
   *   'exercise-fill-greeting',
   *   'exercise-vof-statement'
   * ]);
   * console.log(exercises.length); // Number of found exercises (may be less than requested)
   */
  async getExercisesByIds(ids: string[]): Promise<Exercise[]> {
    if (ids.length === 0) {
      return [];
    }

    return await this.exerciseRepository.findByIds(ids);
  }

  /**
   * Validates exercise data against type-specific schema requirements.
   * 
   * Performs comprehensive validation of exercise data based on the exercise type,
   * ensuring all required fields are present and properly formatted.
   * 
   * @private
   * @param {string} exerciseType - The exercise type to validate against
   * @param {any} data - The exercise data object to validate
   * @returns {void}
   * @throws {Error} When data is not a valid object
   * @throws {Error} When exercise type is unknown
   * @throws {Error} When data validation fails for the specific exercise type
   */
  private validateExerciseData(exerciseType: string, data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Exercise data must be a valid object');
    }

    switch (exerciseType) {
      case 'translation':
        this.validateTranslationData(data);
        break;
      case 'fill-in-the-blank':
        this.validateFillInTheBlankData(data);
        break;
      case 'vof':
        this.validateVofData(data);
        break;
      case 'pairs':
        this.validatePairsData(data);
        break;
      case 'informative':
        this.validateInformativeData(data);
        break;
      case 'ordering':
        this.validateOrderingData(data);
        break;
      default:
        throw new Error(`Unknown exercise type: ${exerciseType}`);
    }
  }

  /**
   * Validates translation exercise data structure and required fields.
   * 
   * @private
   * @param {any} data - Translation exercise data to validate
   * @param {string} data.source_text - Source language text to translate
   * @param {string} data.target_text - Target language translation
   * @param {string[]} [data.hints] - Optional hints array
   * @returns {void}
   * @throws {Error} When source_text is missing or invalid
   * @throws {Error} When target_text is missing or invalid
   * @throws {Error} When hints is provided but not an array
   */
  private validateTranslationData(data: any): void {
    if (!data.source_text || typeof data.source_text !== 'string') {
      throw new Error('Translation exercise must have a valid source_text');
    }
    if (!data.target_text || typeof data.target_text !== 'string') {
      throw new Error('Translation exercise must have a valid target_text');
    }
    if (data.hints && !Array.isArray(data.hints)) {
      throw new Error('Translation exercise hints must be an array');
    }
  }

  /**
   * Validates fill-in-the-blank exercise data structure and blank configurations.
   * 
   * @private
   * @param {any} data - Fill-in-the-blank exercise data to validate
   * @param {string} data.text - Text with blank positions
   * @param {Array} data.blanks - Array of blank configurations
   * @param {number} data.blanks[].position - Character position of the blank
   * @param {string[]} data.blanks[].correct_answers - Array of correct answers for the blank
   * @param {string[]} [data.blanks[].hints] - Optional hints for the blank
   * @returns {void}
   * @throws {Error} When text is missing or invalid
   * @throws {Error} When blanks array is missing or invalid
   * @throws {Error} When blank position is not a number
   * @throws {Error} When blank has no correct answers
   * @throws {Error} When blank hints is not an array
   */
  private validateFillInTheBlankData(data: any): void {
    if (!data.text || typeof data.text !== 'string') {
      throw new Error('Fill-in-the-blank exercise must have a valid text');
    }
    if (!data.blanks || !Array.isArray(data.blanks)) {
      throw new Error('Fill-in-the-blank exercise must have a valid blanks array');
    }

    data.blanks.forEach((blank: any, index: number) => {
      if (typeof blank.position !== 'number') {
        throw new Error(`Blank at index ${index} must have a valid position number`);
      }
      if (!blank.correct_answers || !Array.isArray(blank.correct_answers) || blank.correct_answers.length === 0) {
        throw new Error(`Blank at index ${index} must have at least one correct answer`);
      }
      if (blank.hints && !Array.isArray(blank.hints)) {
        throw new Error(`Blank at index ${index} hints must be an array`);
      }
    });
  }

  /**
   * Validates true/false (VOF) exercise data structure and required fields.
   * 
   * @private
   * @param {any} data - VOF exercise data to validate
   * @param {string} data.statement - Statement to evaluate as true or false
   * @param {boolean} data.is_true - Whether the statement is true or false
   * @param {string} [data.explanation] - Optional explanation for the answer
   * @returns {void}
   * @throws {Error} When statement is missing or invalid
   * @throws {Error} When is_true is not a boolean value
   * @throws {Error} When explanation is provided but not a string
   */
  private validateVofData(data: any): void {
    if (!data.statement || typeof data.statement !== 'string') {
      throw new Error('VOF exercise must have a valid statement');
    }
    if (typeof data.is_true !== 'boolean') {
      throw new Error('VOF exercise must have a valid is_true boolean value');
    }
    if (data.explanation && typeof data.explanation !== 'string') {
      throw new Error('VOF exercise explanation must be a string');
    }
  }

  /**
   * Validates pairs matching exercise data structure and pair configurations.
   * 
   * @private
   * @param {any} data - Pairs exercise data to validate
   * @param {Array} data.pairs - Array of left-right pair objects
   * @param {string} data.pairs[].left - Left side of the pair to match
   * @param {string} data.pairs[].right - Right side of the pair to match
   * @returns {void}
   * @throws {Error} When pairs array is missing or invalid
   * @throws {Error} When pairs array is empty
   * @throws {Error} When pair left value is missing or invalid
   * @throws {Error} When pair right value is missing or invalid
   */
  private validatePairsData(data: any): void {
    if (!data.pairs || !Array.isArray(data.pairs)) {
      throw new Error('Pairs exercise must have a valid pairs array');
    }
    if (data.pairs.length === 0) {
      throw new Error('Pairs exercise must have at least one pair');
    }

    data.pairs.forEach((pair: any, index: number) => {
      if (!pair.left || typeof pair.left !== 'string') {
        throw new Error(`Pair at index ${index} must have a valid left value`);
      }
      if (!pair.right || typeof pair.right !== 'string') {
        throw new Error(`Pair at index ${index} must have a valid right value`);
      }
    });
  }

  /**
   * Validates informative exercise data structure and content requirements.
   * 
   * @private
   * @param {any} data - Informative exercise data to validate
   * @param {string} data.content - Main content to display to the user
   * @param {string} [data.title] - Optional title for the informative content
   * @returns {void}
   * @throws {Error} When content is missing or invalid
   * @throws {Error} When title is provided but not a string
   */
  private validateInformativeData(data: any): void {
    if (!data.content || typeof data.content !== 'string') {
      throw new Error('Informative exercise must have valid content');
    }
    if (data.title && typeof data.title !== 'string') {
      throw new Error('Informative exercise title must be a string');
    }
  }

  /**
   * Validates ordering exercise data structure and sequence requirements.
   * 
   * @private
   * @param {any} data - Ordering exercise data to validate
   * @param {Array} data.items - Array of items to be ordered
   * @param {string} data.items[].text - Text content of the item
   * @param {number} data.items[].correct_order - Correct position in the sequence (starting from 1)
   * @returns {void}
   * @throws {Error} When items array is missing or invalid
   * @throws {Error} When items array has fewer than 2 items
   * @throws {Error} When item text is missing or invalid
   * @throws {Error} When item correct_order is not a number
   * @throws {Error} When correct_order values don't form a valid sequence starting from 1
   */
  private validateOrderingData(data: any): void {
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Ordering exercise must have a valid items array');
    }
    if (data.items.length < 2) {
      throw new Error('Ordering exercise must have at least 2 items');
    }

    data.items.forEach((item: any, index: number) => {
      if (!item.text || typeof item.text !== 'string') {
        throw new Error(`Item at index ${index} must have valid text`);
      }
      if (typeof item.correct_order !== 'number') {
        throw new Error(`Item at index ${index} must have a valid correct_order number`);
      }
    });

    // Validate that correct_order values form a valid sequence
    const orders = data.items.map((item: any) => item.correct_order).sort((a: number, b: number) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i + 1) {
        throw new Error('Ordering exercise correct_order values must form a sequence starting from 1');
      }
    }
  }
}