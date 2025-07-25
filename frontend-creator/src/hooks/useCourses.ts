import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseService } from '../services/courseService';
import { queryKeys } from './queryKeys';
import { useApiErrorHandler } from '../contexts/ErrorContext';
import { 
  Course, 
  CreateCourseRequest, 
  UpdateCourseRequest, 
  PaginationParams 
} from '../utils/types';

/**
 * Hook for fetching paginated courses
 * @param params Pagination and filtering parameters
 * @returns Query result with courses data, loading, and error states
 */
export const useCoursesQuery = (params?: PaginationParams) => {
  return useQuery({
    queryKey: queryKeys.courses.list(params),
    queryFn: () => courseService.getCourses(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
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
 * Hook for fetching a single course by ID
 * @param id Course ID
 * @param enabled Whether the query should be enabled
 * @returns Query result with course data, loading, and error states
 */
export const useCourseQuery = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.courses.detail(id),
    queryFn: () => courseService.getCourse(id),
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
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
 * Hook for fetching course package data
 * @param id Course ID
 * @param enabled Whether the query should be enabled
 * @returns Query result with course package data, loading, and error states
 */
export const useCoursePackageQuery = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: queryKeys.courses.package(id),
    queryFn: () => courseService.getCoursePackage(id),
    enabled: enabled && !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes (packages change less frequently)
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
 * Hook for creating a new course
 * @returns Mutation object with mutate function and states
 */
export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();
  const { handleError, handleSuccess } = useApiErrorHandler();

  return useMutation({
    mutationFn: (courseData: CreateCourseRequest) => courseService.createCourse(courseData),
    onSuccess: (newCourse: Course) => {
      // Invalidate and refetch courses list (both specific and general keys)
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
      
      // Add the new course to the cache
      queryClient.setQueryData(queryKeys.courses.detail(newCourse.id), newCourse);
      
      // Show success message
      handleSuccess('Course created successfully!');
    },
    onError: (error) => {
      console.error('Failed to create course:', error);
      handleError(error, () => {
        // Retry logic would be handled by the component
      });
    },
  });
};

/**
 * Hook for updating an existing course
 * @returns Mutation object with mutate function and states
 */
export const useUpdateCourseMutation = () => {
  const queryClient = useQueryClient();
  const { handleError, handleSuccess } = useApiErrorHandler();

  return useMutation({
    mutationFn: ({ id, courseData }: { id: string; courseData: UpdateCourseRequest }) => 
      courseService.updateCourse(id, courseData),
    onSuccess: (updatedCourse: Course) => {
      // Update the specific course in cache
      queryClient.setQueryData(queryKeys.courses.detail(updatedCourse.id), updatedCourse);
      
      // Invalidate courses list to reflect changes
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
      
      // Show success message
      handleSuccess('Course updated successfully!');
    },
    onError: (error) => {
      console.error('Failed to update course:', error);
      handleError(error);
    },
  });
};

/**
 * Hook for deleting a course
 * @returns Mutation object with mutate function and states
 */
export const useDeleteCourseMutation = () => {
  const queryClient = useQueryClient();
  const { handleError, handleSuccess } = useApiErrorHandler();

  return useMutation({
    mutationFn: (id: string) => courseService.deleteCourse(id),
    onSuccess: (_, deletedId: string) => {
      // Remove the course from cache
      queryClient.removeQueries({ queryKey: queryKeys.courses.detail(deletedId) });
      
      // Invalidate courses list to reflect deletion
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() });
      
      // Show success message
      handleSuccess('Course deleted successfully!');
    },
    onError: (error) => {
      console.error('Failed to delete course:', error);
      handleError(error);
    },
  });
};

// Export all hooks for easy importing
export default {
  useCoursesQuery,
  useCourseQuery,
  useCoursePackageQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
};