/**
 * Generic CRUD Hooks Factory for WayrApp Creator
 * 
 * This module provides a hook factory system that generates consistent
 * CRUD hooks for all entity types using TanStack Query. It implements automatic cache
 * invalidation, optimistic updates, and specialized operations for hierarchical content.
 * 
 * The factory pattern ensures DRY principles by providing the same interface for all
 * entity types (courses, levels, sections, modules, lessons, exercises) while allowing
 * for entity-specific customizations when needed.
 * 
 * Key features:
 * - Generic CRUD hooks (useList, useGet, useCreate, useUpdate, useDelete)
 * - Automatic cache invalidation strategies
 * - Optimistic updates for better UX
 * - Hierarchical operations (listByParent, reorder)
 * - Many-to-many relationship support (assign, unassign)
 * - Type-safe interfaces with comprehensive TypeScript support
 * 
 * @module CrudHooks
 * @category Hooks
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Create hooks for a specific entity type
 * const courseHooks = createCrudHooks<Course>('courses');
 * 
 * // Use in components
 * const { data: courses, isLoading } = courseHooks.useList();
 * const { data: course } = courseHooks.useGet('course-id');
 * const createMutation = courseHooks.useCreate();
 * const updateMutation = courseHooks.useUpdate();
 * const deleteMutation = courseHooks.useDelete();
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { apiClient, ApiResponse, PaginatedResponse, ListParams, AssignmentData, UnassignmentData } from '../services/apiClient';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Generic CRUD hooks interface that all entity types will implement
 * @template T The entity type (Course, Level, Section, etc.)
 */
export interface CrudHooks<T> {
  // Query hooks
  useList: (params?: ListParams, options?: UseQueryOptions<PaginatedResponse<T>>) => UseQueryResult<PaginatedResponse<T>>;
  useGet: (id: string, options?: UseQueryOptions<ApiResponse<T>>) => UseQueryResult<ApiResponse<T>>;
  useListByParent: ((parentId: string, params?: ListParams, options?: UseQueryOptions<PaginatedResponse<T>>) => UseQueryResult<PaginatedResponse<T>>) | undefined;
  
  // Mutation hooks
  useCreate: (options?: UseMutationOptions<ApiResponse<T>, Error, Partial<T>>) => UseMutationResult<ApiResponse<T>, Error, Partial<T>>;
  useUpdate: (options?: UseMutationOptions<ApiResponse<T>, Error, { id: string; data: Partial<T> }>) => UseMutationResult<ApiResponse<T>, Error, { id: string; data: Partial<T> }>;
  useDelete: (options?: UseMutationOptions<ApiResponse<void>, Error, string>) => UseMutationResult<ApiResponse<void>, Error, string>;
  
  // Specialized hooks
  useReorder: ((options?: UseMutationOptions<ApiResponse<void>, Error, { parentId: string; orderedIds: string[] }>) => UseMutationResult<ApiResponse<void>, Error, { parentId: string; orderedIds: string[] }>) | undefined;
  useAssign: ((options?: UseMutationOptions<ApiResponse<void>, Error, AssignParams>) => UseMutationResult<ApiResponse<void>, Error, AssignParams>) | undefined;
  useUnassign: ((options?: UseMutationOptions<ApiResponse<void>, Error, UnassignParams>) => UseMutationResult<ApiResponse<void>, Error, UnassignParams>) | undefined;
}

/**
 * Parameters for assignment operations
 */
export interface AssignParams {
  parentId: string;
  childId: string;
  data?: AssignmentData;
}

/**
 * Parameters for unassignment operations
 */
export interface UnassignParams {
  parentId: string;
  childId: string;
  data?: UnassignmentData;
}

/**
 * Configuration for creating CRUD hooks
 */
export interface CrudHooksConfig {
  /** The API endpoint for this entity type */
  endpoint: string;
  /** Parent endpoint for hierarchical entities */
  parentEndpoint?: string;
  /** Child endpoint for many-to-many relationships */
  childEndpoint?: string;
  /** Whether this entity supports reordering */
  supportsReorder?: boolean;
  /** Whether this entity supports assignment operations */
  supportsAssignment?: boolean;
  /** Custom cache invalidation strategy */
  cacheInvalidation?: CacheInvalidationStrategy;
}

/**
 * Cache invalidation strategy configuration
 */
export interface CacheInvalidationStrategy {
  /** Entities to invalidate when this entity is created */
  onCreate?: string[];
  /** Entities to invalidate when this entity is updated */
  onUpdate?: string[];
  /** Entities to invalidate when this entity is deleted */
  onDelete?: string[];
  /** Entities to invalidate when this entity is reordered */
  onReorder?: string[];
}

// ============================================================================
// Query Key Factory
// ============================================================================

/**
 * Creates consistent query keys for an entity type
 * @param endpoint - The API endpoint for the entity
 * @returns Object with query key generators
 */
export function createQueryKeys(endpoint: string) {
  return {
    all: [endpoint] as const,
    lists: () => [endpoint, 'list'] as const,
    list: (params?: ListParams) => [endpoint, 'list', params] as const,
    details: () => [endpoint, 'detail'] as const,
    detail: (id: string) => [endpoint, 'detail', id] as const,
    byParent: (parentId: string, params?: ListParams) => [endpoint, 'byParent', parentId, params] as const,
  };
}

// ============================================================================
// Generic CRUD Hooks Factory
// ============================================================================

/**
 * Creates a complete set of CRUD hooks for a specific entity type
 * @template T The entity type
 * @param config - Configuration for the CRUD hooks
 * @returns Complete CRUD hooks interface for the entity type
 * 
 * @example
 * // Create hooks for courses
 * const courseHooks = createCrudHooks<Course>({
 *   endpoint: 'courses',
 *   supportsReorder: false,
 *   supportsAssignment: false,
 *   cacheInvalidation: {
 *     onCreate: ['courses'],
 *     onUpdate: ['courses'],
 *     onDelete: ['courses', 'levels', 'sections', 'modules', 'lessons']
 *   }
 * });
 * 
 * // Create hooks for lessons with assignment support
 * const lessonHooks = createCrudHooks<Lesson>({
 *   endpoint: 'lessons',
 *   parentEndpoint: 'modules',
 *   childEndpoint: 'exercises',
 *   supportsReorder: true,
 *   supportsAssignment: true,
 *   cacheInvalidation: {
 *     onCreate: ['lessons'],
 *     onUpdate: ['lessons'],
 *     onDelete: ['lessons'],
 *     onReorder: ['lessons']
 *   }
 * });
 */
export function createCrudHooks<T>(config: CrudHooksConfig): CrudHooks<T> {
  const queryKeys = createQueryKeys(config.endpoint);

  // ============================================================================
  // Query Hooks
  // ============================================================================

  /**
   * Hook for fetching a paginated list of entities
   */
  const useList = (
    params?: ListParams,
    options?: UseQueryOptions<PaginatedResponse<T>>
  ): UseQueryResult<PaginatedResponse<T>> => {
    return useQuery({
      queryKey: queryKeys.list(params),
      queryFn: () => apiClient.list<T>(config.endpoint, params),
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options,
    });
  };

  /**
   * Hook for fetching a single entity by ID
   */
  const useGet = (
    id: string,
    options?: UseQueryOptions<ApiResponse<T>>
  ): UseQueryResult<ApiResponse<T>> => {
    return useQuery({
      queryKey: queryKeys.detail(id),
      queryFn: () => apiClient.get<T>(config.endpoint, id),
      enabled: !!id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options,
    });
  };

  /**
   * Hook for fetching entities by parent (hierarchical relationships)
   */
  const useListByParent = config.parentEndpoint ? (
    parentId: string,
    params?: ListParams,
    options?: UseQueryOptions<PaginatedResponse<T>>
  ): UseQueryResult<PaginatedResponse<T>> => {
    return useQuery({
      queryKey: queryKeys.byParent(parentId, params),
      queryFn: () => apiClient.listByParent<T>(config.parentEndpoint!, parentId, config.endpoint, params),
      enabled: !!parentId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      ...options,
    });
  } : undefined;

  // ============================================================================
  // Mutation Hooks
  // ============================================================================

  /**
   * Hook for creating new entities
   */
  const useCreate = (
    options?: UseMutationOptions<ApiResponse<T>, Error, Partial<T>>
  ): UseMutationResult<ApiResponse<T>, Error, Partial<T>> => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (data: Partial<T>) => apiClient.create<T>(config.endpoint, data),
      onSuccess: (data) => {
        // Invalidate and refetch related queries
        const invalidationTargets = config.cacheInvalidation?.onCreate || [config.endpoint];
        invalidationTargets.forEach(target => {
          queryClient.invalidateQueries({ queryKey: [target] });
        });

        // Optimistically update the list cache
        queryClient.setQueryData<PaginatedResponse<T>>(
          queryKeys.list(),
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: [data.data, ...oldData.data],
              pagination: {
                ...oldData.pagination,
                total: oldData.pagination.total + 1,
              },
            };
          }
        );
      },
      ...options,
    });
  };

  /**
   * Hook for updating existing entities
   */
  const useUpdate = (
    options?: UseMutationOptions<ApiResponse<T>, Error, { id: string; data: Partial<T> }>
  ): UseMutationResult<ApiResponse<T>, Error, { id: string; data: Partial<T> }> => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ id, data }) => apiClient.update<T>(config.endpoint, id, data),
      onSuccess: (data, variables) => {
        // Update the specific entity cache
        queryClient.setQueryData(queryKeys.detail(variables.id), data);

        // Invalidate related queries
        const invalidationTargets = config.cacheInvalidation?.onUpdate || [config.endpoint];
        invalidationTargets.forEach(target => {
          queryClient.invalidateQueries({ queryKey: [target] });
        });

        // Optimistically update list caches
        queryClient.setQueriesData<PaginatedResponse<T>>(
          { queryKey: queryKeys.lists() },
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: oldData.data.map(item => 
                (item as any).id === variables.id ? data.data : item
              ),
            };
          }
        );
      },
      ...options,
    });
  };

  /**
   * Hook for deleting entities
   */
  const useDelete = (
    options?: UseMutationOptions<ApiResponse<void>, Error, string>
  ): UseMutationResult<ApiResponse<void>, Error, string> => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => apiClient.delete(config.endpoint, id),
      onSuccess: (_, id) => {
        // Remove from cache
        queryClient.removeQueries({ queryKey: queryKeys.detail(id) });

        // Invalidate related queries
        const invalidationTargets = config.cacheInvalidation?.onDelete || [config.endpoint];
        invalidationTargets.forEach(target => {
          queryClient.invalidateQueries({ queryKey: [target] });
        });

        // Optimistically update list caches
        queryClient.setQueriesData<PaginatedResponse<T>>(
          { queryKey: queryKeys.lists() },
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              data: oldData.data.filter(item => (item as any).id !== id),
              pagination: {
                ...oldData.pagination,
                total: Math.max(0, oldData.pagination.total - 1),
              },
            };
          }
        );
      },
      ...options,
    });
  };

  // ============================================================================
  // Specialized Hooks
  // ============================================================================

  /**
   * Hook for reordering entities (if supported)
   */
  const useReorder = config.supportsReorder ? (
    options?: UseMutationOptions<ApiResponse<void>, Error, { parentId: string; orderedIds: string[] }>
  ): UseMutationResult<ApiResponse<void>, Error, { parentId: string; orderedIds: string[] }> => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ parentId, orderedIds }) => apiClient.reorder(config.endpoint, parentId, orderedIds),
      onSuccess: (_, variables) => {
        // Invalidate related queries
        const invalidationTargets = config.cacheInvalidation?.onReorder || [config.endpoint];
        invalidationTargets.forEach(target => {
          queryClient.invalidateQueries({ queryKey: [target] });
        });

        // Invalidate parent-specific queries
        if (config.parentEndpoint) {
          queryClient.invalidateQueries({ 
            queryKey: queryKeys.byParent(variables.parentId) 
          });
        }
      },
      ...options,
    });
  } : undefined;

  /**
   * Hook for assigning entities (many-to-many relationships)
   */
  const useAssign = config.supportsAssignment && config.childEndpoint ? (
    options?: UseMutationOptions<ApiResponse<void>, Error, AssignParams>
  ): UseMutationResult<ApiResponse<void>, Error, AssignParams> => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ parentId, childId, data }) => 
        apiClient.assign(config.endpoint, parentId, config.childEndpoint!, childId, data),
      onSuccess: (_, variables) => {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: [config.endpoint] });
        queryClient.invalidateQueries({ queryKey: [config.childEndpoint!] });
        
        // Invalidate specific parent-child relationships
        queryClient.invalidateQueries({ 
          queryKey: [config.endpoint, variables.parentId, config.childEndpoint!] 
        });
      },
      ...options,
    });
  } : undefined;

  /**
   * Hook for unassigning entities (many-to-many relationships)
   */
  const useUnassign = config.supportsAssignment && config.childEndpoint ? (
    options?: UseMutationOptions<ApiResponse<void>, Error, UnassignParams>
  ): UseMutationResult<ApiResponse<void>, Error, UnassignParams> => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({ parentId, childId, data }) => 
        apiClient.unassign(config.endpoint, parentId, config.childEndpoint!, childId, data),
      onSuccess: (_, variables) => {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: [config.endpoint] });
        queryClient.invalidateQueries({ queryKey: [config.childEndpoint!] });
        
        // Invalidate specific parent-child relationships
        queryClient.invalidateQueries({ 
          queryKey: [config.endpoint, variables.parentId, config.childEndpoint!] 
        });
      },
      ...options,
    });
  } : undefined;

  // ============================================================================
  // Return Complete Interface
  // ============================================================================

  return {
    useList,
    useGet,
    useListByParent,
    useCreate,
    useUpdate,
    useDelete,
    useReorder,
    useAssign,
    useUnassign,
  };
}

// ============================================================================
// Predefined Entity Hooks
// ============================================================================

/**
 * CRUD hooks for Course entities
 */
export const useCourseHooks = () => createCrudHooks<any>({
  endpoint: 'courses',
  supportsReorder: false,
  supportsAssignment: false,
  cacheInvalidation: {
    onCreate: ['courses'],
    onUpdate: ['courses'],
    onDelete: ['courses', 'levels', 'sections', 'modules', 'lessons'],
  },
});

/**
 * CRUD hooks for Level entities
 */
export const useLevelHooks = () => createCrudHooks<any>({
  endpoint: 'levels',
  parentEndpoint: 'courses',
  supportsReorder: true,
  supportsAssignment: false,
  cacheInvalidation: {
    onCreate: ['levels', 'courses'],
    onUpdate: ['levels', 'courses'],
    onDelete: ['levels', 'courses', 'sections', 'modules', 'lessons'],
    onReorder: ['levels'],
  },
});

/**
 * CRUD hooks for Section entities
 */
export const useSectionHooks = () => createCrudHooks<any>({
  endpoint: 'sections',
  parentEndpoint: 'levels',
  supportsReorder: true,
  supportsAssignment: false,
  cacheInvalidation: {
    onCreate: ['sections', 'levels'],
    onUpdate: ['sections', 'levels'],
    onDelete: ['sections', 'levels', 'modules', 'lessons'],
    onReorder: ['sections'],
  },
});

/**
 * CRUD hooks for Module entities
 */
export const useModuleHooks = () => createCrudHooks<any>({
  endpoint: 'modules',
  parentEndpoint: 'sections',
  supportsReorder: true,
  supportsAssignment: false,
  cacheInvalidation: {
    onCreate: ['modules', 'sections'],
    onUpdate: ['modules', 'sections'],
    onDelete: ['modules', 'sections', 'lessons'],
    onReorder: ['modules'],
  },
});

/**
 * CRUD hooks for Lesson entities
 */
export const useLessonHooks = () => createCrudHooks<any>({
  endpoint: 'lessons',
  parentEndpoint: 'modules',
  childEndpoint: 'exercises',
  supportsReorder: true,
  supportsAssignment: true,
  cacheInvalidation: {
    onCreate: ['lessons', 'modules'],
    onUpdate: ['lessons', 'modules'],
    onDelete: ['lessons', 'modules'],
    onReorder: ['lessons'],
  },
});

/**
 * CRUD hooks for Exercise entities
 */
export const useExerciseHooks = () => createCrudHooks<any>({
  endpoint: 'exercises',
  supportsReorder: false,
  supportsAssignment: false,
  cacheInvalidation: {
    onCreate: ['exercises'],
    onUpdate: ['exercises', 'lessons'],
    onDelete: ['exercises', 'lessons'],
  },
});

export default createCrudHooks;