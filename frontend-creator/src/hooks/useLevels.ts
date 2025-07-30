import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { levelService } from '../services/levelService';
import { queryKeys } from './queryKeys';
import { 
  Level, 
  CreateLevelRequest, 
  UpdateLevelRequest, 
  PaginationParams 
} from '../utils/types';

/**
 * Hook for fetching levels by course
 * @param courseId Course ID
 * @param params Pagination and filtering parameters
 * @param enabled Whether the query should be enabled
 * @returns Query result with levels data, loading, and error states
 */
export const useLevelsQuery = (courseId: string, params?: PaginationParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.levels.list(courseId, params),
    queryFn: () => levelService.getLevelsByCourse(courseId, params),
    enabled: enabled && !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors except 401
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for fetching a single level by ID within a course
 * @param courseId Course ID
 * @param id Level ID
 * @param enabled Whether the query should be enabled
 * @returns Query result with level data, loading, and error states
 */
export const useLevelQuery = (courseId: string, id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.levels.detail(id),
    queryFn: () => levelService.getLevel(courseId, id),
    enabled: enabled && !!courseId && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors except 401
      if (error?.status >= 400 && error?.status < 500 && error?.status !== 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for creating a new level
 * @returns Mutation object with mutate function and states
 */
export const useCreateLevelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, levelData }: { courseId: string; levelData: CreateLevelRequest }) => 
      levelService.createLevel(courseId, levelData),
    onMutate: async ({ courseId, levelData }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: queryKeys.levels.list(courseId) });

      // Snapshot the previous value
      const previousLevels = queryClient.getQueryData(queryKeys.levels.list(courseId));

      // Optimistically update to the new value
      if (previousLevels) {
        queryClient.setQueryData(queryKeys.levels.list(courseId), (old: any) => ({
          ...old,
          data: [
            ...old.data,
            {
              // SECURITY_AUDIT_TODO: Potential information disclosure through predictable temporary IDs.
              // Using Date.now() for temporary IDs could potentially leak timing information and be predictable.
              // While this is only used for optimistic updates in the frontend cache and not sent to the server,
              // consider using a more secure random ID generation method like crypto.randomUUID() if available.
              // Recommendation: Replace with crypto.randomUUID() or a more secure random ID generator.
              courseId,
              ...levelData,
              id: levelData.id || `temp-${Date.now()}`, // Temporary ID
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          total: old.total + 1,
        }));
      }

      // Return a context object with the snapshotted value
      return { previousLevels, courseId };
    },
    onSuccess: (newLevel: Level, { courseId }) => {
      // Invalidate and refetch levels list for the course
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.list(courseId) });
      
      // Add the new level to the cache
      queryClient.setQueryData(queryKeys.levels.detail(newLevel.id), newLevel);
      
      // Invalidate course detail if it includes level count
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
    },
    onError: (error, { courseId }, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLevels) {
        queryClient.setQueryData(queryKeys.levels.list(courseId), context.previousLevels);
      }
      console.error('Failed to create level:', error);
    },
    onSettled: (_, __, { courseId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.list(courseId) });
    },
  });
};

/**
 * Hook for updating an existing level
 * @returns Mutation object with mutate function and states
 */
export const useUpdateLevelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, id, levelData }: { courseId: string; id: string; levelData: UpdateLevelRequest }) => 
      levelService.updateLevel(courseId, id, levelData),
    onMutate: async ({ courseId, id, levelData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.levels.detail(id) });

      // Snapshot the previous value
      const previousLevel = queryClient.getQueryData(queryKeys.levels.detail(id));

      // Optimistically update to the new value
      if (previousLevel) {
        queryClient.setQueryData(queryKeys.levels.detail(id), (old: any) => ({
          ...old,
          ...levelData,
          updatedAt: new Date().toISOString(),
        }));
      }

      return { previousLevel, courseId, id };
    },
    onSuccess: (updatedLevel: Level) => {
      // Update the specific level in cache
      queryClient.setQueryData(queryKeys.levels.detail(updatedLevel.id), updatedLevel);
      
      // Invalidate levels list to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.list(updatedLevel.courseId) });
      
      // Invalidate course detail if it includes level count
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(updatedLevel.courseId) });
    },
    onError: (error, { id }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousLevel) {
        queryClient.setQueryData(queryKeys.levels.detail(id), context.previousLevel);
      }
      console.error('Failed to update level:', error);
    },
    onSettled: (_, __, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.detail(id) });
    },
  });
};

/**
 * Hook for deleting a level
 * @returns Mutation object with mutate function and states
 */
export const useDeleteLevelMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, id }: { courseId: string; id: string }) => levelService.deleteLevel(courseId, id),
    onMutate: async ({ courseId, id: deletedId }) => {
      // Get the level data before removing it to access courseId
      const levelData = queryClient.getQueryData(queryKeys.levels.detail(deletedId)) as Level;
      
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.levels.list(courseId) });

      // Snapshot the previous value
      const previousLevels = queryClient.getQueryData(queryKeys.levels.list(courseId));

      // Optimistically update by removing the level
      if (previousLevels) {
        queryClient.setQueryData(queryKeys.levels.list(courseId), (old: any) => ({
          ...old,
          data: old.data.filter((level: Level) => level.id !== deletedId),
          total: old.total - 1,
        }));
      }

      return { previousLevels, levelData, courseId };
    },
    onSuccess: (_, { courseId, id: deletedId }) => {
      // Remove the level from cache
      queryClient.removeQueries({ queryKey: queryKeys.levels.detail(deletedId) });
      
      // Invalidate levels list to reflect deletion
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.list(courseId) });
      // Invalidate course detail if it includes level count
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
    },
    onError: (error, { courseId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousLevels) {
        queryClient.setQueryData(queryKeys.levels.list(courseId), context.previousLevels);
      }
      console.error('Failed to delete level:', error);
    },
    onSettled: (_, __, { courseId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.list(courseId) });
    },
  });
};

/**
 * Hook for reordering levels within a course
 * @returns Mutation object with mutate function and states
 */
export const useReorderLevelsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ courseId, orderedIds }: { courseId: string; orderedIds: string[] }) => 
      levelService.reorderLevels(courseId, orderedIds),
    onMutate: async ({ courseId, orderedIds }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.levels.list(courseId) });

      // Snapshot the previous value
      const previousLevels = queryClient.getQueryData(queryKeys.levels.list(courseId));

      // Optimistically update the order
      if (previousLevels) {
        queryClient.setQueryData(queryKeys.levels.list(courseId), (old: any) => {
          const levelMap = new Map(old.data.map((level: Level) => [level.id, level]));
          const reorderedLevels = orderedIds.map((id, index) => {
            const level = levelMap.get(id);
            return level ? { ...level, order: index + 1 } : null;
          }).filter((level): level is Level => level !== null);

          return {
            ...old,
            data: reorderedLevels,
          };
        });
      }

      return { previousLevels, courseId };
    },
    onSuccess: (reorderedLevels, { courseId }) => {
      // Update the levels list cache with the new order
      queryClient.setQueryData(queryKeys.levels.list(courseId), (old: any) => ({
        ...old,
        data: reorderedLevels,
      }));

      // Update individual level caches
      reorderedLevels.forEach(level => {
        queryClient.setQueryData(queryKeys.levels.detail(level.id), level);
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(courseId) });
    },
    onError: (error, { courseId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousLevels) {
        queryClient.setQueryData(queryKeys.levels.list(courseId), context.previousLevels);
      }
      console.error('Failed to reorder levels:', error);
    },
    onSettled: (_, __, { courseId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.levels.list(courseId) });
    },
  });
};

// Export all hooks for easy importing
export default {
  useLevelsQuery,
  useLevelQuery,
  useCreateLevelMutation,
  useUpdateLevelMutation,
  useDeleteLevelMutation,
  useReorderLevelsMutation,
};