/**
 * Custom hook for managing hierarchical breadcrumb navigation
 * 
 * This hook provides intelligent breadcrumb management with entity validation,
 * loading states, and navigation handling. It integrates with the existing
 * CRUD hooks to validate entity existence and generate appropriate breadcrumbs.
 * 
 * Key features:
 * - Validates entity existence using actual query results
 * - Enforces hierarchical relationships (child entities only shown if parent exists)
 * - Provides auto-redirect functionality to nearest valid parent
 * - Implements proper loading states during validation
 * - Prevents navigation to non-existent entities
 * 
 * @module useBreadcrumbs
 * @category Hooks
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic usage in a component
 * const { breadcrumbs, isLoading, navigate } = useBreadcrumbs({
 *   courseId: 'course1',
 *   levelId: 'level1'
 * });
 * 
 * @example
 * // With auto-redirect to nearest valid parent
 * const { breadcrumbs, isValidPath } = useBreadcrumbs({
 *   courseId: 'invalid-course',
 *   levelId: 'level1'
 * }, { autoRedirect: true });
 */

import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCourseQuery } from './useCourses';
import { useLevelQuery } from './useLevels';
import { useSectionQuery } from './useSections';
import { useModuleQuery } from './useModules';
import { useLessonQuery } from './useLessons';
import {
  HierarchyPath,
  BreadcrumbItem,
  generateUrlPath,
  parseUrlPath,
  getNearestValidParent,
  EntityValidationService
} from '../utils/breadcrumbUtils';

/**
 * Configuration options for the breadcrumbs hook
 */
interface UseBreadcrumbsOptions {
  /** Whether to automatically redirect to nearest valid parent on invalid path */
  autoRedirect?: boolean;
  /** Whether to show loading states for breadcrumb items */
  showLoadingStates?: boolean;
  /** Custom navigation handler */
  onNavigate?: (path: HierarchyPath) => void;
}

/**
 * Return type for the useBreadcrumbs hook
 */
interface UseBreadcrumbsReturn {
  /** Array of breadcrumb items with validation state */
  breadcrumbs: BreadcrumbItem[];
  /** Whether any breadcrumb data is currently loading */
  isLoading: boolean;
  /** Whether the current path is valid */
  isValidPath: boolean;
  /** Navigate to a specific hierarchy path */
  navigate: (path: HierarchyPath) => void;
  /** Navigate to the nearest valid parent */
  navigateToValidParent: () => void;
  /** Current hierarchy path */
  currentPath: HierarchyPath;
  /** Generate URL for a given path */
  generateUrl: (path: HierarchyPath) => string;
}

/**
 * Custom hook for managing hierarchical breadcrumb navigation
 * 
 * @param hierarchyPath - Current position in the hierarchy
 * @param options - Configuration options
 * @returns Breadcrumb management utilities and state
 */
export const useBreadcrumbs = (
  hierarchyPath: HierarchyPath,
  options: UseBreadcrumbsOptions = {}
): UseBreadcrumbsReturn => {
  const {
    showLoadingStates = true,
    onNavigate
  } = options;

  const routerNavigate = useNavigate();

  // SECURITY_AUDIT_TODO: Insecure Direct Object Reference - Entity IDs from hierarchyPath are used directly in queries without validation.
  // An attacker could manipulate URL parameters to access unauthorized entities. While the backend should enforce authorization,
  // the frontend should validate that the user has permission to access these entities before making queries.
  // Recommendation: Add authorization checks or validate entity ownership before querying.
  // Example: if (!userCanAccessCourse(hierarchyPath.courseId)) return { breadcrumbs: [], isLoading: false, ... };
  
  // Fetch entity data with conditional queries
  const courseQuery = useCourseQuery(
    hierarchyPath.courseId || '', 
    !!hierarchyPath.courseId
  );
  
  // Only enable level query if course exists and is not in error state
  const levelQuery = useLevelQuery(
    hierarchyPath.courseId || '',
    hierarchyPath.levelId || '', 
    !!hierarchyPath.levelId && 
    !!hierarchyPath.courseId && 
    !!courseQuery.data && 
    !courseQuery.isError
  );
  
  // Only enable section query if level exists and is not in error state
  const sectionQuery = useSectionQuery(
    hierarchyPath.sectionId || '', 
    !!hierarchyPath.sectionId && 
    !!levelQuery.data && 
    !levelQuery.isError
  );
  
  // Only enable module query if section exists and is not in error state
  const moduleQuery = useModuleQuery(
    hierarchyPath.moduleId || '', 
    !!hierarchyPath.moduleId && 
    !!sectionQuery.data && 
    !sectionQuery.isError
  );
  
  // Only enable lesson query if module exists and is not in error state
  const lessonQuery = useLessonQuery(
    hierarchyPath.lessonId || '', 
    !!hierarchyPath.lessonId && 
    !!moduleQuery.data && 
    !moduleQuery.isError
  );

  // Create validation service using the existing hooks
  const validationService: EntityValidationService = useMemo(() => ({
    validateCourse: async (id: string) => {
      try {
        // If we're already querying this course, use the result
        if (hierarchyPath.courseId === id) {
          return !!courseQuery.data && !courseQuery.isError;
        }
        // For other courses, we'd need to make a separate query
        // For now, assume valid if we have the ID (could be enhanced)
        return !!id;
      } catch {
        return false;
      }
    },
    validateLevel: async (id: string, courseId: string) => {
      try {
        // If we're already querying this level in this course, use the result
        if (hierarchyPath.levelId === id && hierarchyPath.courseId === courseId) {
          return !!levelQuery.data && !levelQuery.isError;
        }
        // For other levels, we'd need to make a separate query
        // For now, assume valid if we have both IDs (could be enhanced)
        return !!id && !!courseId;
      } catch {
        return false;
      }
    },
    validateSection: async (id: string, levelId: string) => {
      try {
        // If we're already querying this section, use the result
        if (hierarchyPath.sectionId === id) {
          return !!sectionQuery.data && !sectionQuery.isError;
        }
        // For other sections, we'd need to make a separate query
        return !!id && !!levelId;
      } catch {
        return false;
      }
    },
    validateModule: async (id: string, sectionId: string) => {
      try {
        // If we're already querying this module, use the result
        if (hierarchyPath.moduleId === id) {
          return !!moduleQuery.data && !moduleQuery.isError;
        }
        // For other modules, we'd need to make a separate query
        return !!id && !!sectionId;
      } catch {
        return false;
      }
    },
    validateLesson: async (id: string, moduleId: string) => {
      try {
        // If we're already querying this lesson, use the result
        if (hierarchyPath.lessonId === id) {
          return !!lessonQuery.data && !lessonQuery.isError;
        }
        // For other lessons, we'd need to make a separate query
        return !!id && !!moduleId;
      } catch {
        return false;
      }
    }
  }), [hierarchyPath, courseQuery, levelQuery, sectionQuery, moduleQuery, lessonQuery]);

  // Check if any data is loading
  const isLoading = useMemo(() => {
    return (
      (courseQuery?.isLoading || false) ||
      (levelQuery?.isLoading || false) ||
      (sectionQuery?.isLoading || false) ||
      (moduleQuery?.isLoading || false) ||
      (lessonQuery?.isLoading || false)
    );
  }, [courseQuery?.isLoading, levelQuery?.isLoading, sectionQuery?.isLoading, moduleQuery?.isLoading, lessonQuery?.isLoading]);

  // Helper function to create safe hierarchy path
  const createSafeHierarchyPath = (path: Partial<HierarchyPath>): HierarchyPath => {
    const safePath: HierarchyPath = {};
    if (path.courseId) safePath.courseId = path.courseId;
    if (path.levelId) safePath.levelId = path.levelId;
    if (path.sectionId) safePath.sectionId = path.sectionId;
    if (path.moduleId) safePath.moduleId = path.moduleId;
    if (path.lessonId) safePath.lessonId = path.lessonId;
    return safePath;
  };

  // Generate breadcrumb items
  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];

    // Course breadcrumb
    if (hierarchyPath.courseId) {
      const course = courseQuery.data;
      const isLoadingCourse = courseQuery.isLoading;
      const hasError = courseQuery.isError;
      const exists = !!course && !hasError && !isLoadingCourse;

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Course Breadcrumb Debug:', {
          courseId: hierarchyPath.courseId,
          hasData: !!course,
          isLoading: isLoadingCourse,
          hasError,
          exists,
          isClickable: exists
        });
      }

      items.push({
        id: hierarchyPath.courseId,
        label: course?.name || (isLoadingCourse ? 'Loading...' : 'Unknown Course'),
        path: generateUrlPath(createSafeHierarchyPath({ courseId: hierarchyPath.courseId })),
        isClickable: exists,
        isLoading: showLoadingStates && isLoadingCourse,
        entityType: 'course',
        exists
      });
    }

    // Level breadcrumb - only show if course exists
    if (hierarchyPath.levelId && items[0]?.exists) {
      const level = levelQuery.data;
      const isLoadingLevel = levelQuery.isLoading;
      const hasError = levelQuery.isError;
      const exists = !!level && !hasError && !isLoadingLevel;

      // Debug logging
      if (process.env.NODE_ENV === 'development') {
        console.log('Level Breadcrumb Debug:', {
          levelId: hierarchyPath.levelId,
          courseExists: items[0]?.exists,
          hasData: !!level,
          isLoading: isLoadingLevel,
          hasError,
          exists,
          isClickable: exists
        });
      }

      items.push({
        id: hierarchyPath.levelId,
        label: level?.name || (isLoadingLevel ? 'Loading...' : 'Unknown Level'),
        path: generateUrlPath(createSafeHierarchyPath({ 
          courseId: hierarchyPath.courseId, 
          levelId: hierarchyPath.levelId 
        })),
        isClickable: exists,
        isLoading: showLoadingStates && isLoadingLevel,
        entityType: 'level',
        exists
      });
    } else if (hierarchyPath.levelId && !items[0]?.exists) {
      // Show "Niveles" as non-clickable if course doesn't exist
      if (process.env.NODE_ENV === 'development') {
        console.log('Level Placeholder Debug:', {
          levelId: hierarchyPath.levelId,
          courseExists: items[0]?.exists,
          showingPlaceholder: true
        });
      }
      
      items.push({
        id: 'levels-placeholder',
        label: 'Niveles',
        path: '',
        isClickable: false,
        isLoading: false,
        entityType: 'level',
        exists: false
      });
    }

    // Section breadcrumb - only show if level exists
    if (hierarchyPath.sectionId && items[1]?.exists) {
      const section = sectionQuery.data;
      const isLoadingSection = sectionQuery.isLoading;
      const hasError = sectionQuery.isError;
      const exists = !!section && !hasError && !isLoadingSection;

      items.push({
        id: hierarchyPath.sectionId,
        label: section?.name || (isLoadingSection ? 'Loading...' : 'Unknown Section'),
        path: generateUrlPath(createSafeHierarchyPath({ 
          courseId: hierarchyPath.courseId, 
          levelId: hierarchyPath.levelId,
          sectionId: hierarchyPath.sectionId
        })),
        isClickable: exists,
        isLoading: showLoadingStates && isLoadingSection,
        entityType: 'section',
        exists
      });
    }

    // Module breadcrumb - only show if section exists
    if (hierarchyPath.moduleId && items[2]?.exists) {
      const module = moduleQuery.data;
      const isLoadingModule = moduleQuery.isLoading;
      const hasError = moduleQuery.isError;
      const exists = !!module && !hasError && !isLoadingModule;

      items.push({
        id: hierarchyPath.moduleId,
        label: module?.name || (isLoadingModule ? 'Loading...' : 'Unknown Module'),
        path: generateUrlPath(createSafeHierarchyPath({ 
          courseId: hierarchyPath.courseId, 
          levelId: hierarchyPath.levelId,
          sectionId: hierarchyPath.sectionId,
          moduleId: hierarchyPath.moduleId
        })),
        isClickable: exists,
        isLoading: showLoadingStates && isLoadingModule,
        entityType: 'module',
        exists
      });
    }

    // Lesson breadcrumb - only show if module exists
    if (hierarchyPath.lessonId && items[3]?.exists) {
      const lesson = lessonQuery.data;
      const isLoadingLesson = lessonQuery.isLoading;
      const hasError = lessonQuery.isError;
      const exists = !!lesson && !hasError && !isLoadingLesson;

      items.push({
        id: hierarchyPath.lessonId,
        label: lesson ? `Lesson ${lesson.id}` : (isLoadingLesson ? 'Loading...' : 'Unknown Lesson'),
        path: generateUrlPath(createSafeHierarchyPath(hierarchyPath)),
        isClickable: exists,
        isLoading: showLoadingStates && isLoadingLesson,
        entityType: 'lesson',
        exists
      });
    }

    return items;
  }, [
    hierarchyPath,
    courseQuery.data,
    courseQuery.isLoading,
    courseQuery.isError,
    levelQuery.data,
    levelQuery.isLoading,
    levelQuery.isError,
    sectionQuery.data,
    sectionQuery.isLoading,
    sectionQuery.isError,
    moduleQuery.data,
    moduleQuery.isLoading,
    moduleQuery.isError,
    lessonQuery.data,
    lessonQuery.isLoading,
    lessonQuery.isError,
    showLoadingStates
  ]);

  // Check if current path is valid
  const isValidPath = useMemo(() => {
    return breadcrumbs.every(item => item.exists);
  }, [breadcrumbs]);

  // Navigation handler
  const navigate = useCallback((path: HierarchyPath) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      const url = generateUrlPath(path);
      routerNavigate(url);
    }
  }, [onNavigate, routerNavigate]);

  // Navigate to nearest valid parent
  const navigateToValidParent = useCallback(async () => {
    try {
      const validParent = await getNearestValidParent(hierarchyPath, validationService);
      navigate(validParent);
    } catch (error) {
      console.error('Failed to find valid parent path:', error);
      // Fallback to courses list
      navigate({});
    }
  }, [hierarchyPath, validationService, navigate]);

  // Auto-redirect to nearest valid parent when path is invalid
  const { autoRedirect = false } = options;
  
  // Effect to handle auto-redirect
  React.useEffect(() => {
    if (autoRedirect && !isLoading && !isValidPath && breadcrumbs.length > 0) {
      // Find the last valid breadcrumb
      const lastValidIndex = breadcrumbs.findLastIndex(item => item.exists);
      if (lastValidIndex >= 0) {
        // Navigate to the nearest valid parent
        navigateToValidParent();
      } else {
        // No valid breadcrumbs, navigate to courses
        navigate({});
      }
    }
  }, [autoRedirect, isLoading, isValidPath, breadcrumbs, navigateToValidParent, navigate]);

  // Generate URL utility
  const generateUrl = useCallback((path: HierarchyPath) => {
    return generateUrlPath(path);
  }, []);

  return {
    breadcrumbs,
    isLoading,
    isValidPath,
    navigate,
    navigateToValidParent,
    currentPath: hierarchyPath,
    generateUrl
  };
};

/**
 * Hook for parsing current URL into hierarchy path
 * 
 * @param pathname - Current URL pathname
 * @returns Parsed hierarchy path
 * 
 * @example
 * const hierarchyPath = useHierarchyPathFromUrl(location.pathname);
 */
export const useHierarchyPathFromUrl = (pathname: string): HierarchyPath => {
  return useMemo(() => {
    return parseUrlPath(pathname);
  }, [pathname]);
};

