import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { exerciseService } from '../services/exerciseService';
import { queryKeys } from './queryKeys';
import { 
  Exercise, 
  CreateExerciseRequest, 
  UpdateExerciseRequest, 
  PaginationParams,
  ExerciseDuplicationOptions
} from '../utils/types';

/**
 * Hook for fetching paginated exercises from the global exercise bank
 * @param params Pagination and filtering parameters
 * @returns Query result with exercises data, loading, and error states
 */
export const useExercisesQuery = (params?: PaginationParams) => {
  return useQuery({
    queryKey: queryKeys.exercises.list(params),
    queryFn: () => exerciseService.getExercises(params),
    staleTime: 15 * 60 * 1000, // 15 minutes (exercises change less frequently)
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors except 401
      if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for fetching a single exercise by ID
 * @param id Exercise ID
 * @param enabled Whether the query should be enabled
 * @returns Query result with exercise data, loading, and error states
 */
export const useExerciseQuery = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.exercises.detail(id),
    queryFn: () => exerciseService.getExercise(id),
    enabled: enabled && !!id,
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors except 401
      if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for searching exercises by query and type
 * @param query Search query
 * @param type Optional exercise type filter
 * @param enabled Whether the query should be enabled
 * @returns Query result with search results, loading, and error states
 */
export const useExerciseSearchQuery = (query: string, type?: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...queryKeys.exercises.lists(), 'search', query, type],
    queryFn: () => exerciseService.searchExercises(query, type),
    enabled: enabled && !!query.trim(),
    staleTime: 5 * 60 * 1000, // 5 minutes for search results
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors except 401
      if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for creating a new exercise in the global bank
 * @returns Mutation object with mutate function and states
 */
export const useCreateExerciseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (exerciseData: CreateExerciseRequest) => exerciseService.createExercise(exerciseData),
    onMutate: async (newExercise) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: queryKeys.exercises.lists() });

      // Snapshot the previous value
      const previousExercises = queryClient.getQueryData(queryKeys.exercises.list());

      // Optimistically update to the new value
      if (previousExercises) {
        queryClient.setQueryData(queryKeys.exercises.list(), (old: any) => ({
          ...old,
          data: [
            {
              ...newExercise,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            ...old.data,
          ],
          total: old.total + 1,
        }));
      }

      // Return a context object with the snapshotted value
      return { previousExercises };
    },
    onSuccess: (newExercise: Exercise) => {
      // Invalidate and refetch exercises list
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.lists() });
      
      // Add the new exercise to the cache with the real ID
      queryClient.setQueryData(queryKeys.exercises.detail(newExercise.id), newExercise);
    },
    onError: (error, _newExercise, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousExercises) {
        queryClient.setQueryData(queryKeys.exercises.list(), context.previousExercises);
      }
      console.error('Failed to create exercise:', error);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.lists() });
    },
  });
};

/**
 * Hook for updating an existing exercise
 * @returns Mutation object with mutate function and states
 */
export const useUpdateExerciseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, exerciseData }: { id: string; exerciseData: UpdateExerciseRequest }) => 
      exerciseService.updateExercise(id, exerciseData),
    onMutate: async ({ id, exerciseData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.exercises.detail(id) });

      // Snapshot the previous value
      const previousExercise = queryClient.getQueryData(queryKeys.exercises.detail(id));

      // Optimistically update to the new value
      if (previousExercise) {
        queryClient.setQueryData(queryKeys.exercises.detail(id), (old: any) => ({
          ...old,
          ...exerciseData,
          updatedAt: new Date().toISOString(),
        }));
      }

      return { previousExercise };
    },
    onSuccess: (updatedExercise: Exercise) => {
      // Update the specific exercise in cache
      queryClient.setQueryData(queryKeys.exercises.detail(updatedExercise.id), updatedExercise);
      
      // Invalidate exercises list to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.lists() });
      
      // Invalidate any lesson exercises that might include this exercise
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === 'lessons' && 
                 query.queryKey[2] === 'exercises';
        }
      });
    },
    onError: (error, { id }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousExercise) {
        queryClient.setQueryData(queryKeys.exercises.detail(id), context.previousExercise);
      }
      console.error('Failed to update exercise:', error);
    },
    onSettled: (_, __, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.detail(id) });
    },
  });
};

/**
 * Hook for deleting an exercise from the global bank
 * @returns Mutation object with mutate function and states
 */
export const useDeleteExerciseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => exerciseService.deleteExercise(id),
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.exercises.lists() });

      // Snapshot the previous value
      const previousExercises = queryClient.getQueryData(queryKeys.exercises.list());

      // Optimistically update by removing the exercise
      if (previousExercises) {
        queryClient.setQueryData(queryKeys.exercises.list(), (old: any) => ({
          ...old,
          data: old.data.filter((exercise: Exercise) => exercise.id !== deletedId),
          total: old.total - 1,
        }));
      }

      return { previousExercises };
    },
    onSuccess: (_, deletedId: string) => {
      // Remove the exercise from cache
      queryClient.removeQueries({ queryKey: queryKeys.exercises.detail(deletedId) });
      
      // Invalidate exercises list to reflect deletion
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.lists() });
      
      // Invalidate any lesson exercises that might include this exercise
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          return query.queryKey[0] === 'lessons' && 
                 query.queryKey[2] === 'exercises';
        }
      });
    },
    onError: (error, _deletedId, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousExercises) {
        queryClient.setQueryData(queryKeys.exercises.list(), context.previousExercises);
      }
      console.error('Failed to delete exercise:', error);
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.lists() });
    },
  });
};

/**
 * Hook for fetching exercise usage statistics
 * @param id Exercise ID
 * @param enabled Whether the query should be enabled
 * @returns Query result with usage statistics, loading, and error states
 */
export const useExerciseUsageQuery = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...queryKeys.exercises.detail(id), 'usage'],
    queryFn: () => exerciseService.getExerciseUsage(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for fetching exercise deletion impact analysis
 * @param id Exercise ID
 * @param enabled Whether the query should be enabled
 * @returns Query result with deletion impact analysis, loading, and error states
 */
export const useExerciseDeleteImpactQuery = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...queryKeys.exercises.detail(id), 'delete-impact'],
    queryFn: () => exerciseService.getExerciseDeleteImpact(id),
    enabled: enabled && !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes (more dynamic data)
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for fetching exercise analytics
 * @param id Exercise ID
 * @param enabled Whether the query should be enabled
 * @returns Query result with analytics data, loading, and error states
 */
export const useExerciseAnalyticsQuery = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [...queryKeys.exercises.detail(id), 'analytics'],
    queryFn: () => exerciseService.getExerciseAnalytics(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for fetching batch exercise usage statistics
 * @param exerciseIds Array of exercise IDs
 * @param enabled Whether the query should be enabled
 * @returns Query result with batch usage statistics, loading, and error states
 */
export const useBatchExerciseUsageQuery = (exerciseIds: string[], enabled: boolean = true) => {
  return useQuery({
    queryKey: [...queryKeys.exercises.lists(), 'batch-usage', exerciseIds.sort().join(',')],
    queryFn: () => exerciseService.getBatchExerciseUsage(exerciseIds),
    enabled: enabled && exerciseIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status >= 400 && error?.response?.status < 500 && error?.response?.status !== 401) {
        return false;
      }
      return failureCount < 3;
    },
  });
};

/**
 * Hook for duplicating an exercise
 * @returns Mutation object with mutate function and states
 */
export const useDuplicateExerciseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, options }: { id: string; options: ExerciseDuplicationOptions }) => 
      exerciseService.duplicateExercise(id, options),
    onSuccess: (newExercise: Exercise) => {
      // Add the new exercise to the cache
      queryClient.setQueryData(queryKeys.exercises.detail(newExercise.id), newExercise);
      
      // Invalidate exercises list to show the new exercise
      queryClient.invalidateQueries({ queryKey: queryKeys.exercises.lists() });
    },
    onError: (error) => {
      console.error('Failed to duplicate exercise:', error);
    },
  });
};

// Export all hooks for easy importing
export default {
  useExercisesQuery,
  useExerciseQuery,
  useExerciseSearchQuery,
  useCreateExerciseMutation,
  useUpdateExerciseMutation,
  useDeleteExerciseMutation,
  useExerciseUsageQuery,
  useExerciseDeleteImpactQuery,
  useExerciseAnalyticsQuery,
  useBatchExerciseUsageQuery,
  useDuplicateExerciseMutation,
};