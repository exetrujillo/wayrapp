import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseService } from '../services/courseService';
import { 
  Course, 
  CreateCourseRequest, 
  UpdateCourseRequest, 
  PaginationParams 
} from '../utils/types';

// Query keys for courses
export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params?: PaginationParams) => [...courseKeys.lists(), params] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (id: string) => [...courseKeys.details(), id] as const,
  packages: () => [...courseKeys.all, 'package'] as const,
  package: (id: string) => [...courseKeys.packages(), id] as const,
};

/**
 * Hook for fetching paginated courses
 * @param params Pagination and filtering parameters
 * @returns Query result with courses data, loading, and error states
 */
export const useCoursesQuery = (params?: PaginationParams) => {
  return useQuery({
    queryKey: courseKeys.list(params),
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
    queryKey: courseKeys.detail(id),
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
    queryKey: courseKeys.package(id),
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

  return useMutation({
    mutationFn: (courseData: CreateCourseRequest) => courseService.createCourse(courseData),
    onSuccess: (newCourse: Course) => {
      // Invalidate and refetch courses list
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      
      // Add the new course to the cache
      queryClient.setQueryData(courseKeys.detail(newCourse.id), newCourse);
    },
    onError: (error) => {
      console.error('Failed to create course:', error);
    },
  });
};

/**
 * Hook for updating an existing course
 * @returns Mutation object with mutate function and states
 */
export const useUpdateCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, courseData }: { id: string; courseData: UpdateCourseRequest }) => 
      courseService.updateCourse(id, courseData),
    onSuccess: (updatedCourse: Course) => {
      // Update the specific course in cache
      queryClient.setQueryData(courseKeys.detail(updatedCourse.id), updatedCourse);
      
      // Invalidate courses list to reflect changes
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to update course:', error);
    },
  });
};

/**
 * Hook for deleting a course
 * @returns Mutation object with mutate function and states
 */
export const useDeleteCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => courseService.deleteCourse(id),
    onSuccess: (_, deletedId: string) => {
      // Remove the course from cache
      queryClient.removeQueries({ queryKey: courseKeys.detail(deletedId) });
      
      // Invalidate courses list to reflect deletion
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
    onError: (error) => {
      console.error('Failed to delete course:', error);
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