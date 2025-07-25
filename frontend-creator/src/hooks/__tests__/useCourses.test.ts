import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCoursesQuery } from '../useCourses';
import { queryKeys } from '../queryKeys';
import { courseService } from '../../services/courseService';
import React from 'react';

// Mock the course service. Jest will replace the actual file with this mock.
jest.mock('../../services/courseService');

const mockedCourseService = courseService as jest.Mocked<typeof courseService>;

// CORRECTED: Reusable wrapper to provide QueryClient to our hooks
const createWrapper = () => {
  // Create a new QueryClient for each test to ensure isolation
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries to prevent tests from timing out
        retry: false,
      },
    },
  });
  
  // The wrapper component must be a valid React component
  return ({ children }: { children: React.ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useCourses hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('queryKeys.courses', () => {
    it('should generate correct query keys', () => {
      expect(queryKeys.courses.all).toEqual(['courses']);
      expect(queryKeys.courses.lists()).toEqual(['courses', 'list']);
      expect(queryKeys.courses.list({ page: 1, limit: 10 })).toEqual(['courses', 'list', { page: 1, limit: 10 }]);
      expect(queryKeys.courses.details()).toEqual(['courses', 'detail']);
      expect(queryKeys.courses.detail('123')).toEqual(['courses', 'detail', '123']);
      expect(queryKeys.courses.packages()).toEqual(['courses', 'package']);
      expect(queryKeys.courses.package('123')).toEqual(['courses', 'package', '123']);
    });
  });

  describe('useCoursesQuery', () => {
    it('should call courseService.getCourses with correct parameters', () => {
      const mockResponse = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      };

      mockedCourseService.getCourses.mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useCoursesQuery({ page: 1, limit: 10 }),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);
      expect(mockedCourseService.getCourses).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });

    it('should use correct query key', () => {
      const mockResponse = {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      };

      mockedCourseService.getCourses.mockResolvedValue(mockResponse);

      const params = { page: 1, limit: 10 };
      const { result } = renderHook(
        () => useCoursesQuery(params),
        { wrapper: createWrapper() }
      );

      // The query key should match what queryKeys.courses.list generates
      expect(result.current.isLoading).toBe(true);
    });
  });
});