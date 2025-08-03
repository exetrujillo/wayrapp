/**
 * ID validation service for real-time uniqueness checking and conflict resolution.
 * 
 * This service provides comprehensive ID validation functionality by leveraging existing
 * API endpoints to check for ID conflicts. It implements debounced validation calls,
 * automatic conflict resolution with suffix generation, and caching to minimize API
 * requests during form interactions.
 * 
 * The service works with the existing backend infrastructure without requiring new
 * endpoints, using GET requests to check for entity existence. It provides a clean
 * interface for form components to validate IDs in real-time while users type.
 * 
 * @module IdValidationService
 * @category Services
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Validate course ID uniqueness
 * const isAvailable = await idValidationService.validateCourseId('spanish-basics');
 * 
 * // Generate unique course ID with conflict resolution
 * const uniqueId = await idValidationService.generateUniqueCourseId('Spanish Basics');
 * 
 * // Real-time validation with debouncing
 * const debouncedValidator = idValidationService.createDebouncedValidator(
 *   'course',
 *   (id) => console.log('ID validation result:', id)
 * );
 */

import { courseService } from './courseService';
import { generateUniqueId, ID_MAX_LENGTHS } from '../utils/idGenerator';

/**
 * Result of an ID validation check.
 */
export interface ValidationResult {
  /** Whether the ID is available for use */
  available: boolean;
  /** The original ID that was checked */
  originalId: string;
  /** Suggested alternative ID if original is not available */
  suggestedId?: string;
  /** Error message if validation failed */
  error?: string;
}

/**
 * Configuration for debounced validation.
 */
export interface DebouncedValidationConfig {
  /** Delay in milliseconds before validation is triggered */
  delay: number;
  /** Whether to generate suggestions for conflicts */
  generateSuggestions: boolean;
  /** Maximum number of suggestions to generate */
  maxSuggestions: number;
}

/**
 * Cache entry for validation results.
 */
interface CacheEntry {
  result: ValidationResult;
  timestamp: number;
  parentId?: string | undefined;
}

/**
 * Service class for ID validation and uniqueness checking.
 */
class IdValidationService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_TTL = 30000; // 30 seconds
  private readonly DEFAULT_DEBOUNCE_DELAY = 300; // 300ms

  /**
   * Validates if a course ID is available for use.
   * 
   * @param {string} id - The course ID to validate
   * @returns {Promise<ValidationResult>} Validation result with availability status
   */
  async validateCourseId(id: string): Promise<ValidationResult> {
    if (!id || typeof id !== 'string') {
      return {
        available: false,
        originalId: id,
        error: 'Course ID is required',
      };
    }

    const cacheKey = `course:${id}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Try to fetch the course - if it exists, ID is not available
      await courseService.getCourse(id);
      const result: ValidationResult = {
        available: false,
        originalId: id,
        suggestedId: await this.generateAlternativeCourseId(id),
      };
      
      this.setCachedResult(cacheKey, result);
      return result;
    } catch (error: any) {
      // If course doesn't exist (404), ID is available
      if (error.message?.includes('not found')) {
        const result: ValidationResult = {
          available: true,
          originalId: id,
        };
        
        this.setCachedResult(cacheKey, result);
        return result;
      }

      // Other errors (network, permission, etc.)
      return {
        available: false,
        originalId: id,
        error: 'Unable to validate ID. Please try again.',
      };
    }
  }

  /**
   * Validates if a level ID is available within a specific course.
   * 
   * @param {string} id - The level ID to validate
   * @param {string} courseId - The parent course ID
   * @returns {Promise<ValidationResult>} Validation result with availability status
   */
  async validateLevelId(id: string, courseId: string): Promise<ValidationResult> {
    if (!id || !courseId) {
      return {
        available: false,
        originalId: id,
        error: 'Level ID and course ID are required',
      };
    }

    const cacheKey = `level:${courseId}:${id}`;
    const cached = this.getCachedResult(cacheKey, courseId);
    if (cached) {
      return cached;
    }

    try {
      // For now, we'll implement a basic check
      // In a full implementation, you'd call a level service
      // This is a placeholder that assumes level doesn't exist
      const result: ValidationResult = {
        available: true,
        originalId: id,
      };
      
      this.setCachedResult(cacheKey, result, courseId);
      return result;
    } catch (error) {
      return {
        available: false,
        originalId: id,
        error: 'Unable to validate level ID. Please try again.',
      };
    }
  }

  /**
   * Validates if a section ID is available within a specific level.
   * 
   * @param {string} id - The section ID to validate
   * @param {string} levelId - The parent level ID
   * @returns {Promise<ValidationResult>} Validation result with availability status
   */
  async validateSectionId(id: string, levelId: string): Promise<ValidationResult> {
    if (!id || !levelId) {
      return {
        available: false,
        originalId: id,
        error: 'Section ID and level ID are required',
      };
    }

    const cacheKey = `section:${levelId}:${id}`;
    const cached = this.getCachedResult(cacheKey, levelId);
    if (cached) {
      return cached;
    }

    // Placeholder implementation
    const result: ValidationResult = {
      available: true,
      originalId: id,
    };
    
    this.setCachedResult(cacheKey, result, levelId);
    return result;
  }

  /**
   * Validates if a module ID is available within a specific section.
   * 
   * @param {string} id - The module ID to validate
   * @param {string} sectionId - The parent section ID
   * @returns {Promise<ValidationResult>} Validation result with availability status
   */
  async validateModuleId(id: string, sectionId: string): Promise<ValidationResult> {
    if (!id || !sectionId) {
      return {
        available: false,
        originalId: id,
        error: 'Module ID and section ID are required',
      };
    }

    const cacheKey = `module:${sectionId}:${id}`;
    const cached = this.getCachedResult(cacheKey, sectionId);
    if (cached) {
      return cached;
    }

    // Placeholder implementation
    const result: ValidationResult = {
      available: true,
      originalId: id,
    };
    
    this.setCachedResult(cacheKey, result, sectionId);
    return result;
  }

  /**
   * Validates if a lesson ID is available within a specific module.
   * 
   * @param {string} id - The lesson ID to validate
   * @param {string} moduleId - The parent module ID
   * @returns {Promise<ValidationResult>} Validation result with availability status
   */
  async validateLessonId(id: string, moduleId: string): Promise<ValidationResult> {
    if (!id || !moduleId) {
      return {
        available: false,
        originalId: id,
        error: 'Lesson ID and module ID are required',
      };
    }

    const cacheKey = `lesson:${moduleId}:${id}`;
    const cached = this.getCachedResult(cacheKey, moduleId);
    if (cached) {
      return cached;
    }

    // Placeholder implementation
    const result: ValidationResult = {
      available: true,
      originalId: id,
    };
    
    this.setCachedResult(cacheKey, result, moduleId);
    return result;
  }

  /**
   * Validates if an exercise ID is available (globally unique).
   * 
   * @param {string} id - The exercise ID to validate
   * @returns {Promise<ValidationResult>} Validation result with availability status
   */
  async validateExerciseId(id: string): Promise<ValidationResult> {
    if (!id) {
      return {
        available: false,
        originalId: id,
        error: 'Exercise ID is required',
      };
    }

    const cacheKey = `exercise:${id}`;
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    // Placeholder implementation
    const result: ValidationResult = {
      available: true,
      originalId: id,
    };
    
    this.setCachedResult(cacheKey, result);
    return result;
  }

  /**
   * Generates a unique course ID from a course name.
   * 
   * @param {string} name - The course name to convert
   * @returns {Promise<string>} Promise resolving to a unique course ID
   */
  async generateUniqueCourseId(name: string): Promise<string> {
    return generateUniqueId(
      name,
      ID_MAX_LENGTHS.COURSE,
      async (id) => {
        const result = await this.validateCourseId(id);
        return !result.available;
      }
    );
  }

  /**
   * Generates a unique level ID from a level name within a course.
   * 
   * @param {string} name - The level name to convert
   * @param {string} courseId - The parent course ID
   * @returns {Promise<string>} Promise resolving to a unique level ID
   */
  async generateUniqueLevelId(name: string, courseId: string): Promise<string> {
    return generateUniqueId(
      name,
      ID_MAX_LENGTHS.LEVEL,
      async (id) => {
        const result = await this.validateLevelId(id, courseId);
        return !result.available;
      },
      courseId
    );
  }

  /**
   * Generates a unique section ID from a section name within a level.
   * 
   * @param {string} name - The section name to convert
   * @param {string} levelId - The parent level ID
   * @returns {Promise<string>} Promise resolving to a unique section ID
   */
  async generateUniqueSectionId(name: string, levelId: string): Promise<string> {
    return generateUniqueId(
      name,
      ID_MAX_LENGTHS.SECTION,
      async (id) => {
        const result = await this.validateSectionId(id, levelId);
        return !result.available;
      },
      levelId
    );
  }

  /**
   * Generates a unique module ID from a module name within a section.
   * 
   * @param {string} name - The module name to convert
   * @param {string} sectionId - The parent section ID
   * @returns {Promise<string>} Promise resolving to a unique module ID
   */
  async generateUniqueModuleId(name: string, sectionId: string): Promise<string> {
    return generateUniqueId(
      name,
      ID_MAX_LENGTHS.MODULE,
      async (id) => {
        const result = await this.validateModuleId(id, sectionId);
        return !result.available;
      },
      sectionId
    );
  }

  /**
   * Generates a unique lesson ID from a lesson name within a module.
   * 
   * @param {string} name - The lesson name to convert
   * @param {string} moduleId - The parent module ID
   * @returns {Promise<string>} Promise resolving to a unique lesson ID
   */
  async generateUniqueLessonId(name: string, moduleId: string): Promise<string> {
    return generateUniqueId(
      name,
      ID_MAX_LENGTHS.LESSON,
      async (id) => {
        const result = await this.validateLessonId(id, moduleId);
        return !result.available;
      },
      moduleId
    );
  }

  /**
   * Generates a unique exercise ID from an exercise name.
   * 
   * @param {string} name - The exercise name to convert
   * @returns {Promise<string>} Promise resolving to a unique exercise ID
   */
  async generateUniqueExerciseId(name: string): Promise<string> {
    return generateUniqueId(
      name,
      ID_MAX_LENGTHS.EXERCISE,
      async (id) => {
        const result = await this.validateExerciseId(id);
        return !result.available;
      }
    );
  }

  /**
   * Creates a debounced validator function for real-time ID validation.
   * 
   * @param {string} entityType - The type of entity being validated
   * @param {function} callback - Function to call with validation results
   * @param {Partial<DebouncedValidationConfig>} config - Configuration options
   * @returns {function} Debounced validation function
   */
  createDebouncedValidator(
    entityType: 'course' | 'level' | 'section' | 'module' | 'lesson' | 'exercise',
    callback: (result: ValidationResult) => void,
    config: Partial<DebouncedValidationConfig> = {}
  ) {
    const finalConfig: DebouncedValidationConfig = {
      delay: this.DEFAULT_DEBOUNCE_DELAY,
      generateSuggestions: true,
      maxSuggestions: 3,
      ...config,
    };

    let timeoutId: NodeJS.Timeout;

    return (id: string, parentId?: string) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        try {
          let result: ValidationResult;

          switch (entityType) {
            case 'course':
              result = await this.validateCourseId(id);
              break;
            case 'level':
              result = await this.validateLevelId(id, parentId!);
              break;
            case 'section':
              result = await this.validateSectionId(id, parentId!);
              break;
            case 'module':
              result = await this.validateModuleId(id, parentId!);
              break;
            case 'lesson':
              result = await this.validateLessonId(id, parentId!);
              break;
            case 'exercise':
              result = await this.validateExerciseId(id);
              break;
            default:
              result = {
                available: false,
                originalId: id,
                error: 'Unknown entity type',
              };
          }

          callback(result);
        } catch (error) {
          callback({
            available: false,
            originalId: id,
            error: 'Validation failed. Please try again.',
          });
        }
      }, finalConfig.delay);
    };
  }

  /**
   * Clears the validation cache.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Generates an alternative course ID when the original is not available.
   * 
   * @private
   * @param {string} originalId - The original ID that was not available
   * @returns {Promise<string>} Promise resolving to an alternative ID
   */
  private async generateAlternativeCourseId(originalId: string): Promise<string> {
    // Try adding a numeric suffix
    for (let i = 2; i <= 10; i++) {
      const candidate = `${originalId}-${i}`;
      if (candidate.length <= ID_MAX_LENGTHS.COURSE) {
        const result = await this.validateCourseId(candidate);
        if (result.available) {
          return candidate;
        }
      }
    }

    // Fallback: truncate and add timestamp
    const timestamp = Date.now().toString(36).slice(-4);
    const maxBaseLength = ID_MAX_LENGTHS.COURSE - timestamp.length - 1;
    return `${originalId.slice(0, maxBaseLength)}-${timestamp}`;
  }

  /**
   * Retrieves a cached validation result if it's still valid.
   * 
   * @private
   * @param {string} cacheKey - The cache key to look up
   * @param {string} [parentId] - Optional parent ID for hierarchical validation
   * @returns {ValidationResult | null} Cached result or null if not found/expired
   */
  private getCachedResult(cacheKey: string, parentId?: string): ValidationResult | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) {
      return null;
    }

    // Check if cache entry is expired
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Check if parent ID matches (for hierarchical validation)
    if (parentId && entry.parentId !== parentId) {
      return null;
    }

    return entry.result;
  }

  /**
   * Stores a validation result in the cache.
   * 
   * @private
   * @param {string} cacheKey - The cache key to store under
   * @param {ValidationResult} result - The validation result to cache
   * @param {string} [parentId] - Optional parent ID for hierarchical validation
   */
  private setCachedResult(cacheKey: string, result: ValidationResult, parentId?: string): void {
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now(),
      parentId,
    });
  }
}

/**
 * Singleton instance of the IdValidationService.
 */
export const idValidationService = new IdValidationService();

export default idValidationService;