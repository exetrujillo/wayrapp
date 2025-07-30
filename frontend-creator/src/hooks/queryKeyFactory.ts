/**
 * Centralized Query Key Factory for WayrApp Creator
 * 
 * This module provides a comprehensive query key management system that ensures consistent
 * caching patterns across all entity types. It implements hierarchical cache invalidation,
 * handles many-to-many relationships, and provides utilities for selective cache updates.
 * 
 * The factory pattern ensures that all query keys follow consistent naming conventions
 * and hierarchical structures, making cache invalidation predictable and efficient.
 * 
 * Key features:
 * - Consistent query key patterns for all entity types
 * - Hierarchical cache invalidation (parent changes invalidate children)
 * - Many-to-many relationship cache management
 * - Selective cache update utilities
 * - Type-safe query key generation
 * - Cache dependency mapping
 * 
 * @module QueryKeyFactory
 * @category Hooks
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Use predefined query keys
 * const courseKeys = queryKeyFactory.courses.list({ page: 1 });
 * const levelKeys = queryKeyFactory.levels.byParent('course-id');
 * 
 * // Invalidate hierarchical caches
 * await cacheManager.invalidateHierarchy('courses', 'course-id');
 * 
 * // Handle many-to-many relationships
 * await cacheManager.invalidateManyToMany('lessons', 'lesson-id', 'exercises');
 */

import { useQueryClient } from '@tanstack/react-query';
import { ListParams } from '../services/apiClient';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Base query key structure for consistent patterns
 */
export type BaseQueryKey = readonly unknown[];

/**
 * Entity types supported by the query key factory
 */
export type EntityType = 'courses' | 'levels' | 'sections' | 'modules' | 'lessons' | 'exercises';

/**
 * Hierarchical relationship mapping
 */
export interface HierarchyMap {
  courses: {
    children: ['levels'];
    parent: null;
  };
  levels: {
    children: ['sections'];
    parent: 'courses';
  };
  sections: {
    children: ['modules'];
    parent: 'levels';
  };
  modules: {
    children: ['lessons'];
    parent: 'sections';
  };
  lessons: {
    children: ['exercises'];
    parent: 'modules';
  };
  exercises: {
    children: [];
    parent: null; // Many-to-many with lessons
  };
}

/**
 * Many-to-many relationship configuration
 */
export interface ManyToManyRelation {
  entity1: EntityType;
  entity2: EntityType;
  relationshipType: 'assignment' | 'reference';
}

// ============================================================================
// Query Key Factory Implementation
// ============================================================================

/**
 * Centralized query key factory that provides consistent key generation
 * for all entity types and relationship patterns.
 */
export const queryKeyFactory = {
  // ============================================================================
  // Course Query Keys
  // ============================================================================
  courses: {
    /** All course-related queries */
    all: ['courses'] as const,
    
    /** All course list queries */
    lists: () => [...queryKeyFactory.courses.all, 'list'] as const,
    
    /** Specific course list with parameters */
    list: (params?: ListParams) => [...queryKeyFactory.courses.lists(), params] as const,
    
    /** All course detail queries */
    details: () => [...queryKeyFactory.courses.all, 'detail'] as const,
    
    /** Specific course detail */
    detail: (id: string) => [...queryKeyFactory.courses.details(), id] as const,
    
    /** Course package queries */
    packages: () => [...queryKeyFactory.courses.all, 'package'] as const,
    
    /** Specific course package */
    package: (id: string) => [...queryKeyFactory.courses.packages(), id] as const,
    
    /** Course analytics */
    analytics: (id: string) => [...queryKeyFactory.courses.detail(id), 'analytics'] as const,
  },

  // ============================================================================
  // Level Query Keys
  // ============================================================================
  levels: {
    /** All level-related queries */
    all: ['levels'] as const,
    
    /** All level list queries */
    lists: () => [...queryKeyFactory.levels.all, 'list'] as const,
    
    /** Levels by parent course */
    byParent: (courseId: string, params?: ListParams) => 
      [...queryKeyFactory.levels.lists(), 'byParent', courseId, params] as const,
    
    /** All level detail queries */
    details: () => [...queryKeyFactory.levels.all, 'detail'] as const,
    
    /** Specific level detail */
    detail: (id: string) => [...queryKeyFactory.levels.details(), id] as const,
    
    /** Level reorder operations */
    reorder: (courseId: string) => [...queryKeyFactory.levels.byParent(courseId), 'reorder'] as const,
  },

  // ============================================================================
  // Section Query Keys
  // ============================================================================
  sections: {
    /** All section-related queries */
    all: ['sections'] as const,
    
    /** All section list queries */
    lists: () => [...queryKeyFactory.sections.all, 'list'] as const,
    
    /** Sections by parent level */
    byParent: (levelId: string, params?: ListParams) => 
      [...queryKeyFactory.sections.lists(), 'byParent', levelId, params] as const,
    
    /** All section detail queries */
    details: () => [...queryKeyFactory.sections.all, 'detail'] as const,
    
    /** Specific section detail */
    detail: (id: string) => [...queryKeyFactory.sections.details(), id] as const,
    
    /** Section reorder operations */
    reorder: (levelId: string) => [...queryKeyFactory.sections.byParent(levelId), 'reorder'] as const,
  },

  // ============================================================================
  // Module Query Keys
  // ============================================================================
  modules: {
    /** All module-related queries */
    all: ['modules'] as const,
    
    /** All module list queries */
    lists: () => [...queryKeyFactory.modules.all, 'list'] as const,
    
    /** Modules by parent section */
    byParent: (sectionId: string, params?: ListParams) => 
      [...queryKeyFactory.modules.lists(), 'byParent', sectionId, params] as const,
    
    /** All module detail queries */
    details: () => [...queryKeyFactory.modules.all, 'detail'] as const,
    
    /** Specific module detail */
    detail: (id: string) => [...queryKeyFactory.modules.details(), id] as const,
    
    /** Module reorder operations */
    reorder: (sectionId: string) => [...queryKeyFactory.modules.byParent(sectionId), 'reorder'] as const,
    
    /** Modules by type */
    byType: (moduleType: string, params?: ListParams) => 
      [...queryKeyFactory.modules.lists(), 'byType', moduleType, params] as const,
  },

  // ============================================================================
  // Lesson Query Keys
  // ============================================================================
  lessons: {
    /** All lesson-related queries */
    all: ['lessons'] as const,
    
    /** All lesson list queries */
    lists: () => [...queryKeyFactory.lessons.all, 'list'] as const,
    
    /** Lessons by parent module */
    byParent: (moduleId: string, params?: ListParams) => 
      [...queryKeyFactory.lessons.lists(), 'byParent', moduleId, params] as const,
    
    /** All lesson detail queries */
    details: () => [...queryKeyFactory.lessons.all, 'detail'] as const,
    
    /** Specific lesson detail */
    detail: (id: string) => [...queryKeyFactory.lessons.details(), id] as const,
    
    /** Lesson reorder operations */
    reorder: (moduleId: string) => [...queryKeyFactory.lessons.byParent(moduleId), 'reorder'] as const,
    
    /** Lesson exercises (many-to-many) */
    exercises: (id: string, params?: ListParams) => 
      [...queryKeyFactory.lessons.detail(id), 'exercises', params] as const,
    
    /** Exercise assignment in lesson */
    exerciseAssignment: (lessonId: string, exerciseId: string) => 
      [...queryKeyFactory.lessons.exercises(lessonId), 'assignment', exerciseId] as const,
  },

  // ============================================================================
  // Exercise Query Keys
  // ============================================================================
  exercises: {
    /** All exercise-related queries */
    all: ['exercises'] as const,
    
    /** All exercise list queries */
    lists: () => [...queryKeyFactory.exercises.all, 'list'] as const,
    
    /** Exercise list with parameters */
    list: (params?: ListParams) => [...queryKeyFactory.exercises.lists(), params] as const,
    
    /** All exercise detail queries */
    details: () => [...queryKeyFactory.exercises.all, 'detail'] as const,
    
    /** Specific exercise detail */
    detail: (id: string) => [...queryKeyFactory.exercises.details(), id] as const,
    
    /** Exercises by type */
    byType: (exerciseType: string, params?: ListParams) => 
      [...queryKeyFactory.exercises.lists(), 'byType', exerciseType, params] as const,
    
    /** Exercise usage tracking */
    usage: (id: string) => [...queryKeyFactory.exercises.detail(id), 'usage'] as const,
    
    /** Exercise lessons (reverse many-to-many) */
    lessons: (id: string, params?: ListParams) => 
      [...queryKeyFactory.exercises.detail(id), 'lessons', params] as const,
  },

  // ============================================================================
  // Analytics Query Keys
  // ============================================================================
  analytics: {
    /** All analytics queries */
    all: ['analytics'] as const,
    
    /** Dashboard analytics */
    dashboard: (params?: Record<string, any>) => 
      [...queryKeyFactory.analytics.all, 'dashboard', params] as const,
    
    /** Course analytics */
    course: (courseId: string, params?: Record<string, any>) => 
      [...queryKeyFactory.analytics.all, 'course', courseId, params] as const,
    
    /** Exercise analytics */
    exercise: (exerciseId: string, params?: Record<string, any>) => 
      [...queryKeyFactory.analytics.all, 'exercise', exerciseId, params] as const,
    
    /** Usage statistics */
    usage: (entityType: EntityType, entityId: string, params?: Record<string, any>) => 
      [...queryKeyFactory.analytics.all, 'usage', entityType, entityId, params] as const,
  },

  // ============================================================================
  // User and Auth Query Keys
  // ============================================================================
  auth: {
    /** All auth queries */
    all: ['auth'] as const,
    
    /** Current user */
    me: () => [...queryKeyFactory.auth.all, 'me'] as const,
    
    /** User profile */
    profile: () => [...queryKeyFactory.auth.all, 'profile'] as const,
    
    /** User permissions */
    permissions: () => [...queryKeyFactory.auth.all, 'permissions'] as const,
  },
} as const;

// ============================================================================
// Cache Management Utilities
// ============================================================================

/**
 * Cache management utilities for handling complex invalidation scenarios
 */
export class CacheManager {
  constructor(private queryClient: ReturnType<typeof useQueryClient>) {}

  /**
   * Invalidates all queries for a specific entity type
   * @param entityType - The entity type to invalidate
   */
  async invalidateEntity(entityType: EntityType): Promise<void> {
    await this.queryClient.invalidateQueries({
      queryKey: queryKeyFactory[entityType].all,
    });
  }

  /**
   * Invalidates hierarchical cache when a parent entity changes
   * @param entityType - The parent entity type
   * @param entityId - The parent entity ID
   */
  async invalidateHierarchy(entityType: EntityType, entityId: string): Promise<void> {
    // Invalidate the specific entity
    await this.queryClient.invalidateQueries({
      queryKey: queryKeyFactory[entityType].detail(entityId),
    });

    // Invalidate all list queries for this entity type
    await this.queryClient.invalidateQueries({
      queryKey: queryKeyFactory[entityType].lists(),
    });

    // Invalidate child entities based on hierarchy
    const hierarchyMap: Record<EntityType, EntityType[]> = {
      courses: ['levels'],
      levels: ['sections'],
      sections: ['modules'],
      modules: ['lessons'],
      lessons: ['exercises'],
      exercises: [],
    };

    const childTypes = hierarchyMap[entityType] || [];
    for (const childType of childTypes) {
      await this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory[childType].all,
      });
    }
  }

  /**
   * Handles cache invalidation for many-to-many relationships
   * @param parentType - The parent entity type
   * @param parentId - The parent entity ID
   * @param childType - The child entity type
   * @param childId - Optional child entity ID
   */
  async invalidateManyToMany(
    parentType: EntityType,
    parentId: string,
    childType: EntityType,
    childId?: string
  ): Promise<void> {
    // Invalidate parent entity
    await this.queryClient.invalidateQueries({
      queryKey: queryKeyFactory[parentType].detail(parentId),
    });

    // Invalidate child entity if specified
    if (childId) {
      await this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory[childType].detail(childId),
      });
    }

    // Invalidate relationship queries
    if (parentType === 'lessons' && childType === 'exercises') {
      await this.queryClient.invalidateQueries({
        queryKey: queryKeyFactory.lessons.exercises(parentId),
      });
      
      if (childId) {
        await this.queryClient.invalidateQueries({
          queryKey: queryKeyFactory.exercises.lessons(childId),
        });
      }
    }
  }

  /**
   * Selectively updates cache data without full invalidation
   * @param queryKey - The query key to update
   * @param updater - Function to update the cached data
   */
  updateCache<T>(queryKey: BaseQueryKey, updater: (oldData: T | undefined) => T | undefined): void {
    this.queryClient.setQueryData<T>(queryKey, updater);
  }

  /**
   * Optimistically updates multiple related caches
   * @param updates - Array of cache updates to perform
   */
  batchUpdateCache(updates: Array<{
    queryKey: BaseQueryKey;
    updater: (oldData: any) => any;
  }>): void {
    updates.forEach(({ queryKey, updater }) => {
      this.queryClient.setQueryData(queryKey, updater);
    });
  }

  /**
   * Removes specific queries from cache
   * @param entityType - The entity type
   * @param entityId - The entity ID to remove
   */
  removeFromCache(entityType: EntityType, entityId: string): void {
    this.queryClient.removeQueries({
      queryKey: queryKeyFactory[entityType].detail(entityId),
    });
  }

  /**
   * Prefetches related data for better user experience
   * @param entityType - The entity type to prefetch
   * @param entityId - The entity ID
   * @param relations - Related entities to prefetch
   */
  async prefetchRelated(
    _entityType: EntityType,
    _entityId: string,
    relations: EntityType[]
  ): Promise<void> {
    const prefetchPromises = relations.map(relationType => {
      // This would need to be implemented based on specific API endpoints
      // For now, we'll just prefetch the related entity lists
      return this.queryClient.prefetchQuery({
        queryKey: queryKeyFactory[relationType].all,
        queryFn: () => Promise.resolve([]), // Placeholder
        staleTime: 5 * 60 * 1000,
      });
    });

    await Promise.all(prefetchPromises);
  }
}

// ============================================================================
// Hook for Cache Management
// ============================================================================

/**
 * Hook that provides cache management utilities
 * @returns CacheManager instance with query client
 * 
 * @example
 * const cacheManager = useCacheManager();
 * 
 * // Invalidate hierarchy when course is updated
 * await cacheManager.invalidateHierarchy('courses', 'course-id');
 * 
 * // Handle many-to-many relationship changes
 * await cacheManager.invalidateManyToMany('lessons', 'lesson-id', 'exercises', 'exercise-id');
 */
export function useCacheManager(): CacheManager {
  const queryClient = useQueryClient();
  return new CacheManager(queryClient);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generates a query key for any entity type and operation
 * @param entityType - The entity type
 * @param operation - The operation type
 * @param params - Additional parameters
 * @returns Generated query key
 */
export function generateQueryKey(
  entityType: EntityType,
  operation: 'list' | 'detail' | 'byParent',
  params?: Record<string, any>
): BaseQueryKey {
  const factory = queryKeyFactory[entityType];
  
  switch (operation) {
    case 'list':
      return factory.lists();
    case 'detail':
      return params?.id ? factory.detail(params.id) : factory.details();
    case 'byParent':
      return 'byParent' in factory 
        ? (factory as any).byParent(params?.parentId, params?.listParams)
        : factory.lists();
    default:
      return factory.all;
  }
}

/**
 * Checks if two query keys are related (for cache invalidation)
 * @param key1 - First query key
 * @param key2 - Second query key
 * @returns Whether the keys are related
 */
export function areQueryKeysRelated(key1: BaseQueryKey, key2: BaseQueryKey): boolean {
  // Simple implementation - check if one key is a prefix of another
  const minLength = Math.min(key1.length, key2.length);
  
  for (let i = 0; i < minLength; i++) {
    if (key1[i] !== key2[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Gets all related query keys for a given entity
 * @param entityType - The entity type
 * @param entityId - The entity ID
 * @returns Array of related query keys
 */
export function getRelatedQueryKeys(entityType: EntityType, entityId: string): BaseQueryKey[] {
  const keys: BaseQueryKey[] = [];
  const factory = queryKeyFactory[entityType];
  
  // Add main entity keys
  keys.push(factory.all);
  keys.push(factory.lists());
  keys.push(factory.detail(entityId));
  
  // Add hierarchical keys based on entity type
  const hierarchyMap: Record<EntityType, EntityType[]> = {
    courses: ['levels'],
    levels: ['sections'],
    sections: ['modules'],
    modules: ['lessons'],
    lessons: ['exercises'],
    exercises: [],
  };
  
  const childTypes = hierarchyMap[entityType] || [];
  childTypes.forEach(childType => {
    keys.push(queryKeyFactory[childType].all);
  });
  
  return keys;
}

export default queryKeyFactory;