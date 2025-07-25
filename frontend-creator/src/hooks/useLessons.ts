import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lessonService } from '../services/lessonService';
import { queryKeys } from './queryKeys';
import { 
  Lesson, 
  CreateLessonRequest, 
  UpdateLessonRequest, 
  PaginationParams,
  ExerciseAssignment,
  CreateExerciseAssignmentRequest,
  UpdateExerciseAssignmentRequest
} from '../utils/types';

/**
 * Hook for fetching lessons by module
 * @param moduleId Module ID
 * @param params Pagination and filtering parameters
 * @param enabled Whether the query should be enabled
 * @returns Query result with lessons data, loading, and error states
 */
export const useLessonsQuery = (moduleId: string, params?: PaginationParams, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.lessons.list(moduleId, params),
    queryFn: () => lessonService.getLessonsByModule(moduleId, params),
    enabled: enabled && !!moduleId,
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
 * Hook for fetching a single lesson by ID
 * @param id Lesson ID
 * @param enabled Whether the query should be enabled
 * @returns Query result with lesson data, loading, and error states
 */
export const useLessonQuery = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.lessons.detail(id),
    queryFn: () => lessonService.getLesson(id),
    enabled: enabled && !!id,
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
 * Hook for fetching exercises assigned to a lesson
 * @param lessonId Lesson ID
 * @param enabled Whether the query should be enabled
 * @returns Query result with lesson exercises data, loading, and error states
 */
export const useLessonExercisesQuery = (lessonId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.lessons.exercises(lessonId),
    queryFn: () => lessonService.getLessonExercises(lessonId),
    enabled: enabled && !!lessonId,
    staleTime: 2 * 60 * 1000, // 2 minutes (exercises change more frequently)
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
 * Hook for creating a new lesson
 * @returns Mutation object with mutate function and states
 */
export const useCreateLessonMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ moduleId, lessonData }: { moduleId: string; lessonData: CreateLessonRequest }) => 
      lessonService.createLesson(moduleId, lessonData),
    onMutate: async ({ moduleId, lessonData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lessons.list(moduleId) });

      // Snapshot the previous value
      const previousLessons = queryClient.getQueryData(queryKeys.lessons.list(moduleId));

      // Optimistically update to the new value
      if (previousLessons) {
        queryClient.setQueryData(queryKeys.lessons.list(moduleId), (old: any) => ({
          ...old,
          data: [
            ...old.data,
            {
              id: `temp-${Date.now()}`, // Temporary ID
              moduleId,
              ...lessonData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          total: old.total + 1,
        }));
      }

      return { previousLessons, moduleId };
    },
    onSuccess: (newLesson: Lesson, { moduleId }) => {
      // Invalidate and refetch lessons list for the module
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.list(moduleId) });
      
      // Add the new lesson to the cache
      queryClient.setQueryData(queryKeys.lessons.detail(newLesson.id), newLesson);
      
      // Invalidate module detail if it includes lesson count
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.detail(moduleId) });
    },
    onError: (error, { moduleId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousLessons) {
        queryClient.setQueryData(queryKeys.lessons.list(moduleId), context.previousLessons);
      }
      console.error('Failed to create lesson:', error);
    },
    onSettled: (_, __, { moduleId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.list(moduleId) });
    },
  });
};

/**
 * Hook for updating an existing lesson
 * @returns Mutation object with mutate function and states
 */
export const useUpdateLessonMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, lessonData }: { id: string; lessonData: UpdateLessonRequest }) => 
      lessonService.updateLesson(id, lessonData),
    onMutate: async ({ id, lessonData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lessons.detail(id) });

      // Snapshot the previous value
      const previousLesson = queryClient.getQueryData(queryKeys.lessons.detail(id));

      // Optimistically update to the new value
      if (previousLesson) {
        queryClient.setQueryData(queryKeys.lessons.detail(id), (old: any) => ({
          ...old,
          ...lessonData,
          updatedAt: new Date().toISOString(),
        }));
      }

      return { previousLesson, id };
    },
    onSuccess: (updatedLesson: Lesson) => {
      // Update the specific lesson in cache
      queryClient.setQueryData(queryKeys.lessons.detail(updatedLesson.id), updatedLesson);
      
      // Invalidate lessons list to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.list(updatedLesson.moduleId) });
      
      // Invalidate module detail if it includes lesson count
      queryClient.invalidateQueries({ queryKey: queryKeys.modules.detail(updatedLesson.moduleId) });
    },
    onError: (error, { id }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousLesson) {
        queryClient.setQueryData(queryKeys.lessons.detail(id), context.previousLesson);
      }
      console.error('Failed to update lesson:', error);
    },
    onSettled: (_, __, { id }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.detail(id) });
    },
  });
};

/**
 * Hook for deleting a lesson
 * @returns Mutation object with mutate function and states
 */
export const useDeleteLessonMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => lessonService.deleteLesson(id),
    onMutate: async (deletedId) => {
      // Get the lesson data before removing it to access moduleId
      const lessonData = queryClient.getQueryData(queryKeys.lessons.detail(deletedId)) as Lesson;
      
      if (lessonData?.moduleId) {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: queryKeys.lessons.list(lessonData.moduleId) });

        // Snapshot the previous value
        const previousLessons = queryClient.getQueryData(queryKeys.lessons.list(lessonData.moduleId));

        // Optimistically update by removing the lesson
        if (previousLessons) {
          queryClient.setQueryData(queryKeys.lessons.list(lessonData.moduleId), (old: any) => ({
            ...old,
            data: old.data.filter((lesson: Lesson) => lesson.id !== deletedId),
            total: old.total - 1,
          }));
        }

        return { previousLessons, lessonData };
      }

      return { lessonData };
    },
    onSuccess: (_, deletedId: string) => {
      // Get the lesson data before removing it to access moduleId
      const lessonData = queryClient.getQueryData(queryKeys.lessons.detail(deletedId)) as Lesson;
      
      // Remove the lesson from cache
      queryClient.removeQueries({ queryKey: queryKeys.lessons.detail(deletedId) });
      queryClient.removeQueries({ queryKey: queryKeys.lessons.exercises(deletedId) });
      
      // Invalidate lessons list to reflect deletion
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.lists() });
      if (lessonData?.moduleId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.lessons.list(lessonData.moduleId) });
        // Invalidate module detail if it includes lesson count
        queryClient.invalidateQueries({ queryKey: queryKeys.modules.detail(lessonData.moduleId) });
      }
    },
    onError: (error, _deletedId, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousLessons && context?.lessonData?.moduleId) {
        queryClient.setQueryData(queryKeys.lessons.list(context.lessonData.moduleId), context.previousLessons);
      }
      console.error('Failed to delete lesson:', error);
    },
    onSettled: (_, __, deletedId) => {
      // Always refetch after error or success
      const lessonData = queryClient.getQueryData(queryKeys.lessons.detail(deletedId)) as Lesson;
      if (lessonData?.moduleId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.lessons.list(lessonData.moduleId) });
      }
    },
  });
};

/**
 * Hook for assigning an exercise to a lesson
 * @returns Mutation object with mutate function and states
 */
export const useAssignExerciseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, assignmentData }: { lessonId: string; assignmentData: CreateExerciseAssignmentRequest }) => 
      lessonService.assignExerciseToLesson(lessonId, assignmentData),
    onMutate: async ({ lessonId, assignmentData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lessons.exercises(lessonId) });

      // Snapshot the previous value
      const previousExercises = queryClient.getQueryData(queryKeys.lessons.exercises(lessonId));

      // Optimistically update to the new value
      if (previousExercises) {
        queryClient.setQueryData(queryKeys.lessons.exercises(lessonId), (old: any) => [
          ...old,
          {
            id: `temp-${Date.now()}`, // Temporary ID
            lessonId,
            exerciseId: assignmentData.exercise_id,
            order: assignmentData.order,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]);
      }

      return { previousExercises, lessonId };
    },
    onSuccess: (_newAssignment: ExerciseAssignment, { lessonId }) => {
      // Invalidate lesson exercises to reflect the new assignment
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.exercises(lessonId) });
      
      // Invalidate lesson detail if it includes exercise count
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.detail(lessonId) });
    },
    onError: (error, { lessonId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousExercises) {
        queryClient.setQueryData(queryKeys.lessons.exercises(lessonId), context.previousExercises);
      }
      console.error('Failed to assign exercise to lesson:', error);
    },
    onSettled: (_, __, { lessonId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.exercises(lessonId) });
    },
  });
};

/**
 * Hook for removing an exercise assignment from a lesson
 * @returns Mutation object with mutate function and states
 */
export const useRemoveExerciseAssignmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, assignmentId }: { lessonId: string; assignmentId: string }) => 
      lessonService.removeExerciseFromLesson(lessonId, assignmentId),
    onMutate: async ({ lessonId, assignmentId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lessons.exercises(lessonId) });

      // Snapshot the previous value
      const previousExercises = queryClient.getQueryData(queryKeys.lessons.exercises(lessonId));

      // Optimistically update by removing the assignment
      if (previousExercises) {
        queryClient.setQueryData(queryKeys.lessons.exercises(lessonId), (old: any) => 
          old.filter((assignment: ExerciseAssignment) => assignment.id !== assignmentId)
        );
      }

      return { previousExercises, lessonId };
    },
    onSuccess: (_, { lessonId }) => {
      // Invalidate lesson exercises to reflect the removal
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.exercises(lessonId) });
      
      // Invalidate lesson detail if it includes exercise count
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.detail(lessonId) });
    },
    onError: (error, { lessonId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousExercises) {
        queryClient.setQueryData(queryKeys.lessons.exercises(lessonId), context.previousExercises);
      }
      console.error('Failed to remove exercise assignment:', error);
    },
    onSettled: (_, __, { lessonId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.exercises(lessonId) });
    },
  });
};

/**
 * Hook for updating an exercise assignment (e.g., reordering)
 * @returns Mutation object with mutate function and states
 */
export const useUpdateExerciseAssignmentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, assignmentId, updateData }: { 
      lessonId: string; 
      assignmentId: string; 
      updateData: UpdateExerciseAssignmentRequest 
    }) => 
      lessonService.updateExerciseAssignment(lessonId, assignmentId, updateData),
    onMutate: async ({ lessonId, assignmentId, updateData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lessons.exercises(lessonId) });

      // Snapshot the previous value
      const previousExercises = queryClient.getQueryData(queryKeys.lessons.exercises(lessonId));

      // Optimistically update the assignment
      if (previousExercises) {
        queryClient.setQueryData(queryKeys.lessons.exercises(lessonId), (old: any) => 
          old.map((assignment: ExerciseAssignment) => 
            assignment.id === assignmentId 
              ? { ...assignment, ...updateData, updatedAt: new Date().toISOString() }
              : assignment
          )
        );
      }

      return { previousExercises, lessonId };
    },
    onSuccess: (_updatedAssignment: ExerciseAssignment, { lessonId }) => {
      // Invalidate lesson exercises to reflect the update
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.exercises(lessonId) });
    },
    onError: (error, { lessonId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousExercises) {
        queryClient.setQueryData(queryKeys.lessons.exercises(lessonId), context.previousExercises);
      }
      console.error('Failed to update exercise assignment:', error);
    },
    onSettled: (_, __, { lessonId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.exercises(lessonId) });
    },
  });
};

/**
 * Hook for reordering multiple exercise assignments (e.g., drag-and-drop)
 * @returns Mutation object with mutate function and states
 */
export const useReorderExercisesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ lessonId, exerciseIds }: { lessonId: string; exerciseIds: string[] }) => 
      lessonService.reorderLessonExercises(lessonId, exerciseIds),
    onMutate: async ({ lessonId, exerciseIds }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.lessons.exercises(lessonId) });

      // Snapshot the previous value
      const previousExercises = queryClient.getQueryData(queryKeys.lessons.exercises(lessonId));

      // Optimistically update the order
      if (previousExercises) {
        queryClient.setQueryData(queryKeys.lessons.exercises(lessonId), (old: any) => {
          // Create a map for quick lookup
          const exerciseMap = new Map(old.map((ex: ExerciseAssignment) => [ex.exercise_id, ex]));
          
          // Reorder based on the new exerciseIds array
          return exerciseIds.map((exerciseId, index) => {
            const assignment = exerciseMap.get(exerciseId);
            return assignment ? {
              ...assignment,
              order: index + 1,
              updatedAt: new Date().toISOString(),
            } : null;
          }).filter(Boolean); // Remove any null entries
        });
      }

      return { previousExercises, lessonId };
    },
    onSuccess: (_, { lessonId }) => {
      // Invalidate lesson exercises to reflect the reorder
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.exercises(lessonId) });
    },
    onError: (error, { lessonId }, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousExercises) {
        queryClient.setQueryData(queryKeys.lessons.exercises(lessonId), context.previousExercises);
      }
      console.error('Failed to reorder exercises:', error);
    },
    onSettled: (_, __, { lessonId }) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.lessons.exercises(lessonId) });
    },
  });
};

// Export all hooks for easy importing
export default {
  useLessonsQuery,
  useLessonQuery,
  useLessonExercisesQuery,
  useCreateLessonMutation,
  useUpdateLessonMutation,
  useDeleteLessonMutation,
  useAssignExerciseMutation,
  useRemoveExerciseAssignmentMutation,
  useUpdateExerciseAssignmentMutation,
  useReorderExercisesMutation,
};