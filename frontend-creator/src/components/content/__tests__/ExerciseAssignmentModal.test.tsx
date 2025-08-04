
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ExerciseAssignmentModal } from '../ExerciseAssignmentModal';
import { useAssignExerciseMutation, useLessonExercisesQuery } from '../../../hooks/useLessons';
import { useExercisesQuery } from '../../../hooks/useExercises';

// Mock the hooks
jest.mock('../../../hooks/useExercises');
jest.mock('../../../hooks/useLessons');

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock drag and drop
jest.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', () => ({
  monitorForElements: jest.fn(() => jest.fn()),
  draggable: jest.fn(() => jest.fn()),
  dropTargetForElements: jest.fn(() => jest.fn()),
}));

const mockExercises = [
  {
    id: 'exercise-1',
    exerciseType: 'translation' as const,
    data: { source_text: 'Hello', target_text: 'Hola' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'exercise-2',
    exerciseType: 'vof' as const,
    data: { question: 'Is this correct?', answer: true },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockAssignedExercises = [
  {
    id: 'assignment-1',
    lessonId: 'lesson-1',
    exercise_id: 'exercise-1',
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('ExerciseAssignmentModal', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock the hooks
    (useExercisesQuery as jest.Mock).mockReturnValue({
      data: {
        data: mockExercises,
        meta: { total: 2, page: 1, limit: 20, totalPages: 1 },
      },
      isLoading: false,
      error: null,
    });

    (useLessonExercisesQuery as jest.Mock).mockReturnValue({
      data: mockAssignedExercises,
      isLoading: false,
      error: null,
    });

    (useAssignExerciseMutation as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
      isError: false,
      error: null,
    });
  });

  const renderModal = (props = {}) => {
    const defaultProps = {
      lessonId: 'lesson-1',
      isOpen: true,
      onClose: jest.fn(),
      ...props,
    };

    return render(
      <QueryClientProvider client={queryClient}>
        <ExerciseAssignmentModal {...defaultProps} />
      </QueryClientProvider>
    );
  };

  it('renders the modal with enhanced features', () => {
    renderModal();

    expect(screen.getByText('Assign Exercises')).toBeInTheDocument();
    expect(screen.getByText('Exercise Bank')).toBeInTheDocument();
    expect(screen.getByText('Assignment Queue')).toBeInTheDocument();
    expect(screen.getByText('Show already assigned exercises')).toBeInTheDocument();
    expect(screen.getByText('When exercise is already assigned:')).toBeInTheDocument();
  });

  it('shows conflict resolution options', () => {
    renderModal();

    const conflictSelect = screen.getByDisplayValue('Ask me');
    expect(conflictSelect).toBeInTheDocument();

    fireEvent.change(conflictSelect, { target: { value: 'skip' } });
    expect(conflictSelect).toHaveValue('skip');
  });

  it('toggles showing assigned exercises', () => {
    renderModal();

    const checkbox = screen.getByLabelText('Show already assigned exercises');
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('displays assignment queue when empty', () => {
    renderModal();

    expect(screen.getByText('No exercises queued')).toBeInTheDocument();
    expect(screen.getByText('Drag exercises here to queue them for assignment')).toBeInTheDocument();
  });

  it('shows visual indicators for assigned exercises', () => {
    renderModal();

    expect(screen.getByText('Already Assigned to This Lesson')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
  });

  it('displays conflict dialog when needed', async () => {
    const mockMutateAsync = jest.fn();
    (useAssignExerciseMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });

    renderModal();

    // Try to select an already assigned exercise
    const exerciseCheckbox = screen.getAllByRole('checkbox')[1]; // First is the show assigned checkbox
    fireEvent.click(exerciseCheckbox);

    // Should show conflict dialog
    await waitFor(() => {
      expect(screen.getByText('Assignment Conflict')).toBeInTheDocument();
    });
  });

  it('handles assignment with queue and selected exercises', async () => {
    const mockMutateAsync = jest.fn();
    (useAssignExerciseMutation as jest.Mock).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      isError: false,
      error: null,
    });

    renderModal();

    // Select an unassigned exercise
    const exerciseCheckbox = screen.getAllByRole('checkbox')[2]; // Skip show assigned and assigned exercise
    fireEvent.click(exerciseCheckbox);

    // Click assign button
    const assignButton = screen.getByText(/Assign \d+ Exercise\(s\)/);
    fireEvent.click(assignButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });
});