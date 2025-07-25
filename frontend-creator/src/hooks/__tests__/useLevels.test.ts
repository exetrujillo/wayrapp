import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useLevelsQuery, useCreateLevelMutation, useUpdateLevelMutation, useDeleteLevelMutation } from '../useLevels';
import { levelService } from '../../services/levelService';

// Mock the level service
jest.mock('../../services/levelService');
const mockLevelService = levelService as jest.Mocked<typeof levelService>;

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useLevels hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useLevelsQuery', () => {
    it('should fetch levels successfully', async () => {
      const mockLevels = {
        data: [
          {
            id: '1',
            courseId: 'course-1',
            code: 'A1',
            name: 'Beginner',
            order: 1,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      };

      mockLevelService.getLevelsByCourse.mockResolvedValue(mockLevels);

      const { result } = renderHook(() => useLevelsQuery('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockLevels);
      expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledWith('course-1', undefined);
    });

    it('should handle errors correctly', async () => {
      const mockError = new Error('Failed to fetch levels');
      mockLevelService.getLevelsByCourse.mockRejectedValue(mockError);

      const { result } = renderHook(() => useLevelsQuery('course-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should pass pagination parameters', async () => {
      const mockLevels = {
        data: [],
        meta: { total: 0, page: 2, limit: 5, totalPages: 0 },
      };

      mockLevelService.getLevelsByCourse.mockResolvedValue(mockLevels);

      const { result } = renderHook(() => useLevelsQuery('course-1', { page: 2, limit: 5 }), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledWith('course-1', { page: 2, limit: 5 });
    });
  });

  describe('useCreateLevelMutation', () => {
    it('should create level successfully', async () => {
      const newLevel = {
        id: '2',
        courseId: 'course-1',
        code: 'A2',
        name: 'Elementary',
        order: 2,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const levelData = {
        code: 'A2',
        name: 'Elementary',
        order: 2,
      };

      mockLevelService.createLevel.mockResolvedValue(newLevel);

      const { result } = renderHook(() => useCreateLevelMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ courseId: 'course-1', levelData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(newLevel);
      expect(mockLevelService.createLevel).toHaveBeenCalledWith('course-1', levelData);
    });

    it('should handle creation errors correctly', async () => {
      const mockError = new Error('Failed to create level');
      mockLevelService.createLevel.mockRejectedValue(mockError);

      const levelData = {
        code: 'A2',
        name: 'Elementary',
        order: 2,
      };

      const { result } = renderHook(() => useCreateLevelMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ courseId: 'course-1', levelData });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useUpdateLevelMutation', () => {
    it('should update level successfully', async () => {
      const updatedLevel = {
        id: '1',
        courseId: 'course-1',
        code: 'A1',
        name: 'Updated Beginner',
        order: 1,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
      };

      const updateData = {
        name: 'Updated Beginner',
      };

      mockLevelService.updateLevel.mockResolvedValue(updatedLevel);

      const { result } = renderHook(() => useUpdateLevelMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '1', levelData: updateData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(updatedLevel);
      expect(mockLevelService.updateLevel).toHaveBeenCalledWith('1', updateData);
    });

    it('should handle update errors correctly', async () => {
      const mockError = new Error('Failed to update level');
      mockLevelService.updateLevel.mockRejectedValue(mockError);

      const updateData = { name: 'Updated Beginner' };

      const { result } = renderHook(() => useUpdateLevelMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: '1', levelData: updateData });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useDeleteLevelMutation', () => {
    it('should delete level successfully', async () => {
      mockLevelService.deleteLevel.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteLevelMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockLevelService.deleteLevel).toHaveBeenCalledWith('1');
    });

    it('should handle deletion errors correctly', async () => {
      const mockError = new Error('Failed to delete level');
      mockLevelService.deleteLevel.mockRejectedValue(mockError);

      const { result } = renderHook(() => useDeleteLevelMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });
});