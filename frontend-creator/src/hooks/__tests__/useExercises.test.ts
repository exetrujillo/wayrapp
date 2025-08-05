import React, { ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useExercisesQuery, useCreateExerciseMutation } from '../useExercises';
import { exerciseService } from '../../services/exerciseService';

// Mock the exercise service
jest.mock('../../services/exerciseService');
const mockExerciseService = exerciseService as jest.Mocked<typeof exerciseService>;

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

describe('useExercises hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useExercisesQuery', () => {
    it('should fetch exercises successfully', async () => {
      const mockExercises = {
        data: [
          {
            id: '1',
            exerciseType: 'translation' as const,
            data: { sourceText: 'Hello', targetText: 'Hola' },
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

      mockExerciseService.getExercises.mockResolvedValue(mockExercises);

      const { result } = renderHook(() => useExercisesQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockExercises);
      expect(mockExerciseService.getExercises).toHaveBeenCalledWith(undefined);
    });

    it('should handle errors correctly', async () => {
      const mockError = new Error('Failed to fetch exercises');
      mockExerciseService.getExercises.mockRejectedValue(mockError);

      const { result } = renderHook(() => useExercisesQuery(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });

  describe('useCreateExerciseMutation', () => {
    it('should create exercise successfully', async () => {
      const newExercise = {
        id: '2',
        exerciseType: 'translation' as const,
        data: { sourceText: 'Good morning', targetText: 'Buenos días' },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const exerciseData = {
        id: 'test-exercise-1',
        exercise_type: 'translation' as const,
        data: { sourceText: 'Good morning', targetText: 'Buenos días' },
      };

      mockExerciseService.createExercise.mockResolvedValue(newExercise);

      const { result } = renderHook(() => useCreateExerciseMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(exerciseData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(newExercise);
      expect(mockExerciseService.createExercise).toHaveBeenCalledWith(exerciseData);
    });

    it('should handle creation errors correctly', async () => {
      const mockError = new Error('Failed to create exercise');
      mockExerciseService.createExercise.mockRejectedValue(mockError);

      const exerciseData = {
        id: 'test-exercise-2',
        exercise_type: 'translation' as const,
        data: { sourceText: 'Good morning', targetText: 'Buenos días' },
      };

      const { result } = renderHook(() => useCreateExerciseMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(exerciseData);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });
  });
});