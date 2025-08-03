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
import {
  Course,
  Level,
  Section,
  Module,
  Lesson,
  Exercise,
} from '../utils/types';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Base entity interface that all entities must implement
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generic CRUD hooks interface that all entity types will implement
 * @template T The entity type (Course, Level, Section, etc.)
 */
export interface CrudHooks<T extends BaseEntity> {
  // Query hooks
  useList: (params?: ListParams, options?: UseQueryOptions<PaginatedResponse<T>>) => UseQueryResult<PaginatedResponse<T>>;
  useGet: (id: string, options?: UseQueryOptions<ApiResponse<T>>) => UseQueryResult<ApiResponse<T>>;
  useListByParent: ((parentId: string, params?: ListParams, options?: UseQueryOptions<PaginatedResponse<T>>) => UseQueryResult<PaginatedResponse<T>>) | undefined;

  // Mutation hooks
  useCreate: (options?: UseMutationOptions<ApiResponse<T>, Error, Partial<T>, any>) => UseMutationResult<ApiResponse<T>, Error, Partial<T>>;
  useUpdate: (options?: UseMutationOptions<ApiResponse<T>, Error, { id: string; data: Partial<T> }, any>) => UseMutationResult<ApiResponse<T>, Error, { id: string; data: Partial<T> }>;
  useDelete: (options?: UseMutationOptions<ApiResponse<void>, Error, string, any>) => UseMutationResult<ApiResponse<void>, Error, string>;

  // Specialized hooks
  useReorder: ((options?: UseMutationOptions<ApiResponse<void>, Error, { parentId: string; orderedIds: string[] }, any>) => UseMutationResult<ApiResponse<void>, Error, { parentId: string; orderedIds: string[] }>) | undefined;
  useAssign: ((options?: UseMutationOptions<ApiResponse<void>, Error, AssignParams, any>) => UseMutationResult<ApiResponse<void>, Error, AssignParams>) | undefined;
  useUnassign: ((options?: UseMutationOptions<ApiResponse<void>, Error, UnassignParams, any>) => UseMutationResult<ApiResponse<void>, Error, UnassignParams>) | undefined;
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
export function createCrudHooks<T extends BaseEntity>(config: CrudHooksConfig): CrudHooks<T> {
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
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 401 (unauthorized)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 401) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
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
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 401 (unauthorized)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 401) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
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
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors except 401 (unauthorized)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 401) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
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
    options?: UseMutationOptions<ApiResponse<T>, Error, Partial<T>, { previousData: PaginatedResponse<T> | undefined }>
  ): UseMutationResult<ApiResponse<T>, Error, Partial<T>> => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<T>, Error, Partial<T>, { previousData: PaginatedResponse<T> | undefined }>({
      mutationFn: (data: Partial<T>) => apiClient.create<T>(config.endpoint, data),
      onMutate: async (newData) => {
        // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
        await queryClient.cancelQueries({ queryKey: queryKeys.lists() });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData<PaginatedResponse<T>>(queryKeys.list());

        // Optimistically update to the new value
        if (previousData) {
          const optimisticItem = {
            ...newData,
            id: `temp-${Date.now()}`, // Temporary ID for optimistic update
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as T;

          queryClient.setQueryData<PaginatedResponse<T>>(
            queryKeys.list(),
            {
              ...previousData,
              data: [optimisticItem, ...previousData.data],
              pagination: {
                ...previousData.pagination,
                total: previousData.pagination.total + 1,
              },
            }
          );
        }

        // Return a context object with the snapshotted value
        return { previousData };
      },
      onSuccess: (data, _variables, _context) => {
        // Invalidate and refetch related queries
        const invalidationTargets = config.cacheInvalidation?.onCreate || [config.endpoint];
        invalidationTargets.forEach(target => {
          queryClient.invalidateQueries({ queryKey: [target] });
        });

        // Update the specific entity cache with real data
        queryClient.setQueryData(queryKeys.detail(data.data.id), data);
      },
      onError: (_error, _variables, context) => {
        // If the mutation fails, use the context returned from onMutate to roll back
        if (context?.previousData) {
          queryClient.setQueryData(queryKeys.list(), context.previousData);
        }
      },
      onSettled: () => {
        // Always refetch after error or success
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      },
      ...options,
    });
  };

  /**
   * Hook for updating existing entities
   */
  const useUpdate = (
    options?: UseMutationOptions<ApiResponse<T>, Error, { id: string; data: Partial<T> }, { previousEntity: ApiResponse<T> | undefined; previousList: PaginatedResponse<T> | undefined }>
  ): UseMutationResult<ApiResponse<T>, Error, { id: string; data: Partial<T> }> => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<T>, Error, { id: string; data: Partial<T> }, { previousEntity: ApiResponse<T> | undefined; previousList: PaginatedResponse<T> | undefined }>({
      mutationFn: ({ id, data }) => apiClient.update<T>(config.endpoint, id, data),
      onMutate: async ({ id, data }) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: queryKeys.detail(id) });
        await queryClient.cancelQueries({ queryKey: queryKeys.lists() });

        // Snapshot the previous values
        const previousEntity = queryClient.getQueryData<ApiResponse<T>>(queryKeys.detail(id));
        const previousList = queryClient.getQueryData<PaginatedResponse<T>>(queryKeys.list());

        // Optimistically update the entity
        if (previousEntity) {
          const optimisticEntity = {
            ...previousEntity,
            data: {
              ...previousEntity.data,
              ...data,
              updatedAt: new Date().toISOString(),
            },
          };
          queryClient.setQueryData(queryKeys.detail(id), optimisticEntity);
        }

        // Optimistically update list caches
        if (previousList) {
          queryClient.setQueryData<PaginatedResponse<T>>(
            queryKeys.list(),
            {
              ...previousList,
              data: previousList.data.map(item =>
                item.id === id
                  ? { ...item, ...data, updatedAt: new Date().toISOString() }
                  : item
              ),
            }
          );
        }

        return { previousEntity, previousList };
      },
      onSuccess: (data, variables, _context) => {
        // Update the specific entity cache with real data
        queryClient.setQueryData(queryKeys.detail(variables.id), data);

        // Invalidate related queries
        const invalidationTargets = config.cacheInvalidation?.onUpdate || [config.endpoint];
        invalidationTargets.forEach(target => {
          queryClient.invalidateQueries({ queryKey: [target] });
        });
      },
      onError: (_error, variables, context) => {
        // If the mutation fails, use the context to roll back
        if (context?.previousEntity) {
          queryClient.setQueryData(queryKeys.detail(variables.id), context.previousEntity);
        }
        if (context?.previousList) {
          queryClient.setQueryData(queryKeys.list(), context.previousList);
        }
      },
      onSettled: (_data, _error, variables) => {
        // Always refetch after error or success
        queryClient.invalidateQueries({ queryKey: queryKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      },
      ...options,
    });
  };

  /**
   * Hook for deleting entities
   */
  const useDelete = (
    options?: UseMutationOptions<ApiResponse<void>, Error, string, { previousEntity: ApiResponse<T> | undefined; previousList: PaginatedResponse<T> | undefined }>
  ): UseMutationResult<ApiResponse<void>, Error, string> => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<void>, Error, string, { previousEntity: ApiResponse<T> | undefined; previousList: PaginatedResponse<T> | undefined }>({
      mutationFn: (id: string) => apiClient.delete(config.endpoint, id),
      onMutate: async (deletedId) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: queryKeys.lists() });

        // Snapshot the previous values
        const previousEntity = queryClient.getQueryData<ApiResponse<T>>(queryKeys.detail(deletedId));
        const previousList = queryClient.getQueryData<PaginatedResponse<T>>(queryKeys.list());

        // Optimistically update by removing the entity
        if (previousList) {
          queryClient.setQueryData<PaginatedResponse<T>>(
            queryKeys.list(),
            {
              ...previousList,
              data: previousList.data.filter(item => item.id !== deletedId),
              pagination: {
                ...previousList.pagination,
                total: Math.max(0, previousList.pagination.total - 1),
              },
            }
          );
        }

        return { previousEntity, previousList };
      },
      onSuccess: (_data, id, _context) => {
        // Remove from cache
        queryClient.removeQueries({ queryKey: queryKeys.detail(id) });

        // Invalidate related queries
        const invalidationTargets = config.cacheInvalidation?.onDelete || [config.endpoint];
        invalidationTargets.forEach(target => {
          queryClient.invalidateQueries({ queryKey: [target] });
        });
      },
      onError: (_error, deletedId, context) => {
        // If the mutation fails, use the context to roll back
        if (context?.previousList) {
          queryClient.setQueryData(queryKeys.list(), context.previousList);
        }
        if (context?.previousEntity) {
          queryClient.setQueryData(queryKeys.detail(deletedId), context.previousEntity);
        }
      },
      onSettled: () => {
        // Always refetch after error or success
        queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
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
    options?: UseMutationOptions<ApiResponse<void>, Error, { parentId: string; orderedIds: string[] }, { previousData: PaginatedResponse<T> | undefined; queryKey: readonly [string, "byParent", string, ListParams | undefined] | readonly [string, "list", ListParams | undefined] }>
  ): UseMutationResult<ApiResponse<void>, Error, { parentId: string; orderedIds: string[] }> => {
    const queryClient = useQueryClient();

    return useMutation<ApiResponse<void>, Error, { parentId: string; orderedIds: string[] }, { previousData: PaginatedResponse<T> | undefined; queryKey: readonly [string, "byParent", string, ListParams | undefined] | readonly [string, "list", ListParams | undefined] }>({
      mutationFn: ({ parentId, orderedIds }) => apiClient.reorder(config.endpoint, parentId, orderedIds),
      onMutate: async ({ parentId, orderedIds }) => {
        // Cancel any outgoing refetches
        const queryKey = config.parentEndpoint
          ? queryKeys.byParent(parentId)
          : queryKeys.list();

        await queryClient.cancelQueries({ queryKey });

        // Snapshot the previous value
        const previousData = queryClient.getQueryData<PaginatedResponse<T>>(queryKey);

        // Optimistically update the order
        if (previousData) {
          const itemMap = new Map(previousData.data.map(item => [item.id, item]));
          const reorderedItems = orderedIds.map((id, index) => {
            const item = itemMap.get(id);
            return item ? { ...item, order: index + 1 } as T : null;
          }).filter((item): item is T => item !== null);

          queryClient.setQueryData<PaginatedResponse<T>>(queryKey, {
            ...previousData,
            data: reorderedItems,
          });
        }

        return { previousData, queryKey };
      },
      onSuccess: (_data, variables, _context) => {
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
      onError: (_error, _variables, context) => {
        // If the mutation fails, use the context to roll back
        if (context?.previousData && context?.queryKey) {
          queryClient.setQueryData(context.queryKey, context.previousData);
        }
      },
      onSettled: (_data, _error, variables) => {
        // Always refetch after error or success
        const queryKey = config.parentEndpoint
          ? queryKeys.byParent(variables.parentId)
          : queryKeys.list();
        queryClient.invalidateQueries({ queryKey });
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
      onSuccess: (_data, variables, _context) => {
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
      onSuccess: (_data, variables, _context) => {
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

// ============================================================================
// Predefined Entity Hook Factories
// ============================================================================

/**
 * CRUD hooks factory for Course entities
 * @returns Complete CRUD hooks interface for courses
 * 
 * @example
 * const courseHooks = useCourseHooks();
 * const { data: courses, isLoading } = courseHooks.useList();
 * const createMutation = courseHooks.useCreate();
 */
export const useCourseHooks = () => createCrudHooks<Course>({
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
 * CRUD hooks factory for Level entities
 * @returns Complete CRUD hooks interface for levels with hierarchical support
 * 
 * @example
 * const levelHooks = useLevelHooks();
 * const { data: levels } = levelHooks.useListByParent('course-id');
 * const reorderMutation = levelHooks.useReorder();
 */
export const useLevelHooks = () => createCrudHooks<Level>({
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
 * CRUD hooks factory for Section entities
 * @returns Complete CRUD hooks interface for sections with hierarchical support
 * 
 * @example
 * const sectionHooks = useSectionHooks();
 * const { data: sections } = sectionHooks.useListByParent('level-id');
 * const reorderMutation = sectionHooks.useReorder();
 */
export const useSectionHooks = () => createCrudHooks<Section>({
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
 * CRUD hooks factory for Module entities
 * @returns Complete CRUD hooks interface for modules with hierarchical support
 * 
 * @example
 * const moduleHooks = useModuleHooks();
 * const { data: modules } = moduleHooks.useListByParent('section-id');
 * const reorderMutation = moduleHooks.useReorder();
 */
export const useModuleHooks = () => createCrudHooks<Module>({
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
 * CRUD hooks factory for Lesson entities
 * @returns Complete CRUD hooks interface for lessons with hierarchical and assignment support
 * 
 * @example
 * const lessonHooks = useLessonHooks();
 * const { data: lessons } = lessonHooks.useListByParent('module-id');
 * const assignMutation = lessonHooks.useAssign();
 * const reorderMutation = lessonHooks.useReorder();
 */
export const useLessonHooks = () => createCrudHooks<Lesson>({
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
 * CRUD hooks factory for Exercise entities
 * @returns Complete CRUD hooks interface for exercises
 * 
 * @example
 * const exerciseHooks = useExerciseHooks();
 * const { data: exercises, isLoading } = exerciseHooks.useList();
 * const createMutation = exerciseHooks.useCreate();
 */
export const useExerciseHooks = () => createCrudHooks<Exercise>({
  endpoint: 'exercises',
  supportsReorder: false,
  supportsAssignment: false,
  cacheInvalidation: {
    onCreate: ['exercises'],
    onUpdate: ['exercises', 'lessons'],
    onDelete: ['exercises', 'lessons'],
  },
});

// ============================================================================
// Convenience Hooks for Common Patterns
// ============================================================================

/**
 * Hook that provides all CRUD operations for a specific entity type
 * This is a convenience wrapper that returns individual hooks for easier usage
 * 
 * @template T The entity type
 * @param config Configuration for the CRUD hooks
 * @returns Object with individual hook functions
 * 
 * @example
 * const { useList, useCreate, useUpdate, useDelete } = useEntityCrud<Course>({
 *   endpoint: 'courses',
 *   cacheInvalidation: { onCreate: ['courses'] }
 * });
 */
export function useEntityCrud<T extends BaseEntity>(config: CrudHooksConfig) {
  const hooks = createCrudHooks<T>(config);

  return {
    useList: hooks.useList,
    useGet: hooks.useGet,
    useListByParent: hooks.useListByParent,
    useCreate: hooks.useCreate,
    useUpdate: hooks.useUpdate,
    useDelete: hooks.useDelete,
    useReorder: hooks.useReorder,
    useAssign: hooks.useAssign,
    useUnassign: hooks.useUnassign,
  };
}

/**
 * Hook for hierarchical entities that need parent-child relationships
 * 
 * @template T The entity type
 * @param endpoint The API endpoint
 * @param parentEndpoint The parent entity endpoint
 * @returns Hooks optimized for hierarchical operations
 * 
 * @example
 * const levelHooks = useHierarchicalEntity<Level>('levels', 'courses');
 * const { data: levels } = levelHooks.useListByParent('course-id');
 */
export function useHierarchicalEntity<T extends BaseEntity>(
  endpoint: string,
  parentEndpoint: string,
  additionalConfig?: Partial<CrudHooksConfig>
) {
  return createCrudHooks<T>({
    endpoint,
    parentEndpoint,
    supportsReorder: true,
    supportsAssignment: false,
    cacheInvalidation: {
      onCreate: [endpoint, parentEndpoint],
      onUpdate: [endpoint, parentEndpoint],
      onDelete: [endpoint, parentEndpoint],
      onReorder: [endpoint],
    },
    ...additionalConfig,
  });
}

export default createCrudHooks;