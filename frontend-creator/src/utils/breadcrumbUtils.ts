/**
 * Breadcrumb generation utilities for hierarchical navigation
 * 
 * This module provides utility functions for generating breadcrumb navigation
 * that works with the WayrApp content hierarchy. It includes validation,
 * path generation, and entity existence checking.
 * 
 * @module BreadcrumbUtils
 * @category Utils
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Generate breadcrumbs for a lesson
 * const breadcrumbs = await generateBreadcrumbs({
 *   courseId: 'course1',
 *   levelId: 'level1',
 *   sectionId: 'section1',
 *   moduleId: 'module1',
 *   lessonId: 'lesson1'
 * });
 */

/**
 * Represents the current location in the content hierarchy
 */
export interface HierarchyPath {
  courseId?: string | undefined;
  levelId?: string | undefined;
  sectionId?: string | undefined;
  moduleId?: string | undefined;
  lessonId?: string | undefined;
}

/**
 * Individual breadcrumb item with validation state
 */
export interface BreadcrumbItem {
  id: string;
  label: string;
  path: string;
  isClickable: boolean;
  isLoading: boolean;
  entityType: 'course' | 'level' | 'section' | 'module' | 'lesson';
  exists: boolean;
}

/**
 * Validation result for a hierarchy path
 */
export interface ValidationResult {
  isValid: boolean;
  invalidSegments: string[];
  validPath: HierarchyPath;
  errors: ValidationError[];
}

/**
 * Validation error details
 */
export interface ValidationError {
  entityType: string;
  entityId: string;
  message: string;
  code: 'NOT_FOUND' | 'INVALID_PARENT' | 'INVALID_FORMAT';
}

/**
 * Entity validation service interface
 */
export interface EntityValidationService {
  validateCourse: (id: string) => Promise<boolean>;
  validateLevel: (id: string, courseId: string) => Promise<boolean>;
  validateSection: (id: string, levelId: string) => Promise<boolean>;
  validateModule: (id: string, sectionId: string) => Promise<boolean>;
  validateLesson: (id: string, moduleId: string) => Promise<boolean>;
}

/**
 * Generate URL path for a given hierarchy path
 * 
 * @param hierarchyPath - The hierarchy path to convert to URL
 * @returns URL string for the given path
 * 
 * @example
 * const url = generateUrlPath({ courseId: 'course1', levelId: 'level1' });
 * // Returns: '/courses/course1/levels/level1'
 */
export const generateUrlPath = (hierarchyPath: HierarchyPath): string => {
  const segments: string[] = ['/courses'];

  if (hierarchyPath.courseId) {
    // SECURITY_AUDIT_TODO: Path traversal vulnerability - courseId is not sanitized before being added to URL path.
    // An attacker could inject path traversal sequences like '../../../admin' or URL-encoded sequences.
    // Recommendation: Add input validation to ensure IDs only contain alphanumeric characters, hyphens, and underscores.
    // Example: if (!/^[a-zA-Z0-9_-]+$/.test(hierarchyPath.courseId)) throw new Error('Invalid courseId format');
    segments.push(hierarchyPath.courseId);
    
    if (hierarchyPath.levelId) {
      // SECURITY_AUDIT_TODO: Path traversal vulnerability - levelId is not sanitized before being added to URL path.
      // Same risk as courseId above. Validate format before use.
      segments.push('levels', hierarchyPath.levelId);
      
      if (hierarchyPath.sectionId) {
        // SECURITY_AUDIT_TODO: Path traversal vulnerability - sectionId is not sanitized before being added to URL path.
        // Same risk as courseId above. Validate format before use.
        segments.push('sections', hierarchyPath.sectionId);
        
        if (hierarchyPath.moduleId) {
          // SECURITY_AUDIT_TODO: Path traversal vulnerability - moduleId is not sanitized before being added to URL path.
          // Same risk as courseId above. Validate format before use.
          segments.push('modules', hierarchyPath.moduleId);
          
          if (hierarchyPath.lessonId) {
            // SECURITY_AUDIT_TODO: Path traversal vulnerability - lessonId is not sanitized before being added to URL path.
            // Same risk as courseId above. Validate format before use.
            segments.push('lessons', hierarchyPath.lessonId);
          }
        }
      }
    }
  }

  return segments.join('/');
};

/**
 * Parse URL path into hierarchy path components
 * 
 * @param urlPath - URL path to parse
 * @returns Hierarchy path object
 * 
 * @example
 * const path = parseUrlPath('/courses/course1/levels/level1/sections/section1');
 * // Returns: { courseId: 'course1', levelId: 'level1', sectionId: 'section1' }
 */
export const parseUrlPath = (urlPath: string): HierarchyPath => {
  const segments = urlPath.split('/').filter(Boolean);
  const hierarchyPath: HierarchyPath = {};

  // Special routes that should not be treated as entity IDs
  const specialRoutes = ['create', 'edit', 'new', 'add'];

  for (let i = 0; i < segments.length; i += 2) {
    const entityType = segments[i];
    const entityId = segments[i + 1];

    if (!entityId) continue;

    // Skip special routes that are not actual entity IDs
    if (specialRoutes.includes(entityId)) {
      continue;
    }

    switch (entityType) {
      case 'courses':
        hierarchyPath.courseId = entityId;
        break;
      case 'levels':
        hierarchyPath.levelId = entityId;
        break;
      case 'sections':
        hierarchyPath.sectionId = entityId;
        break;
      case 'modules':
        hierarchyPath.moduleId = entityId;
        break;
      case 'lessons':
        hierarchyPath.lessonId = entityId;
        break;
    }
  }

  return hierarchyPath;
};

/**
 * Validate a hierarchy path by checking entity existence and relationships
 * 
 * @param hierarchyPath - Path to validate
 * @param validationService - Service for entity validation
 * @returns Promise resolving to validation result
 * 
 * @example
 * const result = await validateHierarchyPath(path, validationService);
 * if (!result.isValid) {
 *   console.log('Invalid segments:', result.invalidSegments);
 * }
 */
export const validateHierarchyPath = async (
  hierarchyPath: HierarchyPath,
  validationService: EntityValidationService
): Promise<ValidationResult> => {
  const errors: ValidationError[] = [];
  const invalidSegments: string[] = [];
  let validPath: HierarchyPath = {};

  // Validate course
  if (hierarchyPath.courseId) {
    const courseExists = await validationService.validateCourse(hierarchyPath.courseId);
    if (courseExists) {
      validPath.courseId = hierarchyPath.courseId;
    } else {
      errors.push({
        entityType: 'course',
        entityId: hierarchyPath.courseId,
        message: 'Course not found',
        code: 'NOT_FOUND'
      });
      invalidSegments.push('course');
      // If course doesn't exist, no point validating children
      return {
        isValid: false,
        invalidSegments,
        validPath,
        errors
      };
    }
  }

  // Validate level
  if (hierarchyPath.levelId && validPath.courseId) {
    const levelExists = await validationService.validateLevel(
      hierarchyPath.levelId,
      validPath.courseId
    );
    if (levelExists) {
      validPath.levelId = hierarchyPath.levelId;
    } else {
      errors.push({
        entityType: 'level',
        entityId: hierarchyPath.levelId,
        message: 'Level not found or does not belong to course',
        code: 'NOT_FOUND'
      });
      invalidSegments.push('level');
      // If level doesn't exist, no point validating children
      return {
        isValid: false,
        invalidSegments,
        validPath,
        errors
      };
    }
  }

  // Validate section
  if (hierarchyPath.sectionId && validPath.levelId) {
    const sectionExists = await validationService.validateSection(
      hierarchyPath.sectionId,
      validPath.levelId
    );
    if (sectionExists) {
      validPath.sectionId = hierarchyPath.sectionId;
    } else {
      errors.push({
        entityType: 'section',
        entityId: hierarchyPath.sectionId,
        message: 'Section not found or does not belong to level',
        code: 'NOT_FOUND'
      });
      invalidSegments.push('section');
      return {
        isValid: false,
        invalidSegments,
        validPath,
        errors
      };
    }
  }

  // Validate module
  if (hierarchyPath.moduleId && validPath.sectionId) {
    const moduleExists = await validationService.validateModule(
      hierarchyPath.moduleId,
      validPath.sectionId
    );
    if (moduleExists) {
      validPath.moduleId = hierarchyPath.moduleId;
    } else {
      errors.push({
        entityType: 'module',
        entityId: hierarchyPath.moduleId,
        message: 'Module not found or does not belong to section',
        code: 'NOT_FOUND'
      });
      invalidSegments.push('module');
      return {
        isValid: false,
        invalidSegments,
        validPath,
        errors
      };
    }
  }

  // Validate lesson
  if (hierarchyPath.lessonId && validPath.moduleId) {
    const lessonExists = await validationService.validateLesson(
      hierarchyPath.lessonId,
      validPath.moduleId
    );
    if (lessonExists) {
      validPath.lessonId = hierarchyPath.lessonId;
    } else {
      errors.push({
        entityType: 'lesson',
        entityId: hierarchyPath.lessonId,
        message: 'Lesson not found or does not belong to module',
        code: 'NOT_FOUND'
      });
      invalidSegments.push('lesson');
      return {
        isValid: false,
        invalidSegments,
        validPath,
        errors
      };
    }
  }

  return {
    isValid: errors.length === 0,
    invalidSegments,
    validPath,
    errors
  };
};

/**
 * Get the nearest valid parent path from a potentially invalid hierarchy path
 * 
 * @param hierarchyPath - Path to find valid parent for
 * @param validationService - Service for entity validation
 * @returns Promise resolving to nearest valid parent path
 * 
 * @example
 * // If lesson doesn't exist, returns path to module
 * const parentPath = await getNearestValidParent(invalidPath, service);
 */
export const getNearestValidParent = async (
  hierarchyPath: HierarchyPath,
  validationService: EntityValidationService
): Promise<HierarchyPath> => {
  const validationResult = await validateHierarchyPath(hierarchyPath, validationService);
  return validationResult.validPath;
};

/**
 * Helper function to create safe hierarchy path without undefined values
 */
const createSafeHierarchyPath = (path: HierarchyPath): HierarchyPath => {
  const safePath: HierarchyPath = {};
  if (path.courseId) safePath.courseId = path.courseId;
  if (path.levelId) safePath.levelId = path.levelId;
  if (path.sectionId) safePath.sectionId = path.sectionId;
  if (path.moduleId) safePath.moduleId = path.moduleId;
  if (path.lessonId) safePath.lessonId = path.lessonId;
  return safePath;
};

/**
 * Generate breadcrumb items for a hierarchy path with entity labels
 * 
 * @param hierarchyPath - Path to generate breadcrumbs for
 * @param entityLabels - Map of entity IDs to their display labels
 * @param validationService - Service for entity validation
 * @returns Promise resolving to array of breadcrumb items
 * 
 * @example
 * const breadcrumbs = await generateBreadcrumbItems(path, labels, service);
 */
export const generateBreadcrumbItems = async (
  hierarchyPath: HierarchyPath,
  entityLabels: Map<string, string>,
  validationService: EntityValidationService
): Promise<BreadcrumbItem[]> => {
  const items: BreadcrumbItem[] = [];
  const validationResult = await validateHierarchyPath(hierarchyPath, validationService);

  // Course breadcrumb
  if (hierarchyPath.courseId) {
    const exists = !validationResult.invalidSegments.includes('course');
    items.push({
      id: hierarchyPath.courseId,
      label: entityLabels.get(hierarchyPath.courseId) || 'Unknown Course',
      path: generateUrlPath(createSafeHierarchyPath({ courseId: hierarchyPath.courseId })),
      isClickable: exists,
      isLoading: false,
      entityType: 'course',
      exists
    });
  }

  // Level breadcrumb
  if (hierarchyPath.levelId) {
    const exists = !validationResult.invalidSegments.includes('level');
    items.push({
      id: hierarchyPath.levelId,
      label: entityLabels.get(hierarchyPath.levelId) || 'Unknown Level',
      path: generateUrlPath(createSafeHierarchyPath({ 
        courseId: hierarchyPath.courseId, 
        levelId: hierarchyPath.levelId 
      })),
      isClickable: exists && items[0]?.exists,
      isLoading: false,
      entityType: 'level',
      exists
    });
  }

  // Section breadcrumb
  if (hierarchyPath.sectionId) {
    const exists = !validationResult.invalidSegments.includes('section');
    items.push({
      id: hierarchyPath.sectionId,
      label: entityLabels.get(hierarchyPath.sectionId) || 'Unknown Section',
      path: generateUrlPath(createSafeHierarchyPath({ 
        courseId: hierarchyPath.courseId, 
        levelId: hierarchyPath.levelId,
        sectionId: hierarchyPath.sectionId
      })),
      isClickable: exists && items[1]?.exists,
      isLoading: false,
      entityType: 'section',
      exists
    });
  }

  // Module breadcrumb
  if (hierarchyPath.moduleId) {
    const exists = !validationResult.invalidSegments.includes('module');
    items.push({
      id: hierarchyPath.moduleId,
      label: entityLabels.get(hierarchyPath.moduleId) || 'Unknown Module',
      path: generateUrlPath(createSafeHierarchyPath({ 
        courseId: hierarchyPath.courseId, 
        levelId: hierarchyPath.levelId,
        sectionId: hierarchyPath.sectionId,
        moduleId: hierarchyPath.moduleId
      })),
      isClickable: exists && items[2]?.exists,
      isLoading: false,
      entityType: 'module',
      exists
    });
  }

  // Lesson breadcrumb
  if (hierarchyPath.lessonId) {
    const exists = !validationResult.invalidSegments.includes('lesson');
    items.push({
      id: hierarchyPath.lessonId,
      label: entityLabels.get(hierarchyPath.lessonId) || 'Unknown Lesson',
      path: generateUrlPath(createSafeHierarchyPath(hierarchyPath)),
      isClickable: exists && items[3]?.exists,
      isLoading: false,
      entityType: 'lesson',
      exists
    });
  }

  return items;
};

/**
 * Create a hierarchy path from individual components
 * 
 * @param components - Individual path components
 * @returns Complete hierarchy path object
 * 
 * @example
 * const path = createHierarchyPath({
 *   course: 'course1',
 *   level: 'level1',
 *   section: 'section1'
 * });
 */
export const createHierarchyPath = (components: {
  course?: string;
  level?: string;
  section?: string;
  module?: string;
  lesson?: string;
}): HierarchyPath => {
  const result: HierarchyPath = {};
  if (components.course) result.courseId = components.course;
  if (components.level) result.levelId = components.level;
  if (components.section) result.sectionId = components.section;
  if (components.module) result.moduleId = components.module;
  if (components.lesson) result.lessonId = components.lesson;
  return result;
};

/**
 * Check if two hierarchy paths are equal
 * 
 * @param path1 - First path to compare
 * @param path2 - Second path to compare
 * @returns True if paths are equal
 * 
 * @example
 * const isEqual = arePathsEqual(currentPath, targetPath);
 */
export const arePathsEqual = (path1: HierarchyPath, path2: HierarchyPath): boolean => {
  return (
    path1.courseId === path2.courseId &&
    path1.levelId === path2.levelId &&
    path1.sectionId === path2.sectionId &&
    path1.moduleId === path2.moduleId &&
    path1.lessonId === path2.lessonId
  );
};

/**
 * Get the depth of a hierarchy path (how many levels deep)
 * 
 * @param hierarchyPath - Path to measure depth of
 * @returns Number representing the depth (1 for course only, 5 for full path)
 * 
 * @example
 * const depth = getPathDepth({ courseId: 'course1', levelId: 'level1' });
 * // Returns: 2
 */
export const getPathDepth = (hierarchyPath: HierarchyPath): number => {
  let depth = 0;
  if (hierarchyPath.courseId) depth++;
  if (hierarchyPath.levelId) depth++;
  if (hierarchyPath.sectionId) depth++;
  if (hierarchyPath.moduleId) depth++;
  if (hierarchyPath.lessonId) depth++;
  return depth;
};