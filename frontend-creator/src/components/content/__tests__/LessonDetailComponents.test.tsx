import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AssignedExercisesList } from '../AssignedExercisesList';
import { ExerciseAssignmentModal } from '../ExerciseAssignmentModal';
import { ExerciseAssignment } from '../../../utils/types';

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: any) => <div data-testid="drag-drop-context">{children}</div>,
  Droppable: ({ children }: any) => children({ innerRef: jest.fn(), droppableProps: {}, placeholder: null }, {}),
  Draggable: ({ children }: any) => children({ innerRef: jest.fn(), draggableProps: {}, dragHandleProps: {} }, {}),
}));

// Mock hooks
jest.mock('../../../hooks/useLessons', () => ({
  useReorderExercisesMutation: () => ({
    mutate: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
    reset: jest.fn(),
  }),
  useRemoveExerciseAssignmentMutation: () => ({
    mutate: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
    reset: jest.fn(),
  }),
  useAssignExerciseMutation: () => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
  useLessonExercisesQuery: () => ({
    data: [],
    isLoading: false,
  }),
}));

jest.mock('../../../hooks/useExercises', () => ({
  useExercisesQuery: () => ({
    data: { data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 1 } },
    isLoading: false,
    error: null,
  }),
  useExerciseQuery: () => ({
    data: {
      id: 'test-exercise',
      exerciseType: 'translation',
      data: { source_text: 'Hello', target_text: 'Hola' },
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    },
    isLoading: false,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Lesson Detail Components', () => {
  describe('AssignedExercisesList', () => {
    it('renders empty state when no exercises are provided', () => {
      const Wrapper = createWrapper();
      
      render(
        <AssignedExercisesList
          lessonId="test-lesson"
          exercises={[]}
        />,
        { wrapper: Wrapper }
      );

      expect(screen.getByText('No exercises assigned')).toBeInTheDocument();
      expect(screen.getByText('Start building your lesson by assigning exercises from the global exercise bank.')).toBeInTheDocument();
    });

    it('renders exercises when provided', () => {
      const Wrapper = createWrapper();
      const mockExercises: ExerciseAssignment[] = [
        {
          id: 'assignment-1',
          lessonId: 'test-lesson',
          exercise_id: 'exercise-1',
          order: 1,
          createdAt: '2023-01-01',
          updatedAt: '2023-01-01',
        },
      ];

      render(
        <AssignedExercisesList
          lessonId="test-lesson"
          exercises={mockExercises}
        />,
        { wrapper: Wrapper }
      );

      expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
      expect(screen.getByText('How to manage exercises')).toBeInTheDocument();
    });
  });

  describe('ExerciseAssignmentModal', () => {
    it('renders modal when open', () => {
      const Wrapper = createWrapper();
      
      render(
        <ExerciseAssignmentModal
          lessonId="test-lesson"
          isOpen={true}
          onClose={jest.fn()}
        />,
        { wrapper: Wrapper }
      );

      expect(screen.getByText('Assign Exercises')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search exercises...')).toBeInTheDocument();
      expect(screen.getByText('All Types')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      const Wrapper = createWrapper();
      
      render(
        <ExerciseAssignmentModal
          lessonId="test-lesson"
          isOpen={false}
          onClose={jest.fn()}
        />,
        { wrapper: Wrapper }
      );

      expect(screen.queryByText('Assign Exercises')).not.toBeInTheDocument();
    });
  });
});