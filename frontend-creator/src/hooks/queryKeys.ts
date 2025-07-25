import { PaginationParams } from '../utils/types';

/**
 * Centralized query key factory for TanStack Query
 * Provides consistent and hierarchical query key structure for cache management
 */
export const queryKeys = {
  // Courses
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (params?: PaginationParams) => [...queryKeys.courses.lists(), params] as const,
    details: () => [...queryKeys.courses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.courses.details(), id] as const,
    packages: () => [...queryKeys.courses.all, 'package'] as const,
    package: (id: string) => [...queryKeys.courses.packages(), id] as const,
  },
  
  // Levels
  levels: {
    all: ['levels'] as const,
    lists: () => [...queryKeys.levels.all, 'list'] as const,
    list: (courseId: string, params?: PaginationParams) => 
      [...queryKeys.levels.lists(), courseId, params] as const,
    details: () => [...queryKeys.levels.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.levels.details(), id] as const,
  },
  
  // Sections
  sections: {
    all: ['sections'] as const,
    lists: () => [...queryKeys.sections.all, 'list'] as const,
    list: (levelId: string, params?: PaginationParams) => 
      [...queryKeys.sections.lists(), levelId, params] as const,
    details: () => [...queryKeys.sections.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.sections.details(), id] as const,
  },
  
  // Modules
  modules: {
    all: ['modules'] as const,
    lists: () => [...queryKeys.modules.all, 'list'] as const,
    list: (sectionId: string, params?: PaginationParams) => 
      [...queryKeys.modules.lists(), sectionId, params] as const,
    details: () => [...queryKeys.modules.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.modules.details(), id] as const,
  },
  
  // Lessons
  lessons: {
    all: ['lessons'] as const,
    lists: () => [...queryKeys.lessons.all, 'list'] as const,
    list: (moduleId: string, params?: PaginationParams) => 
      [...queryKeys.lessons.lists(), moduleId, params] as const,
    details: () => [...queryKeys.lessons.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.lessons.details(), id] as const,
    exercises: (id: string) => [...queryKeys.lessons.detail(id), 'exercises'] as const,
  },
  
  // Exercises
  exercises: {
    all: ['exercises'] as const,
    lists: () => [...queryKeys.exercises.all, 'list'] as const,
    list: (params?: PaginationParams) => [...queryKeys.exercises.lists(), params] as const,
    details: () => [...queryKeys.exercises.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.exercises.details(), id] as const,
  },
};

export default queryKeys;