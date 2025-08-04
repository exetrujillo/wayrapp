import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { ExerciseUsageDashboard } from '../ExerciseUsageDashboard';
import { exerciseService } from '../../../services/exerciseService';
import i18n from '../../../__tests__/i18n';

// Mock the exercise service
jest.mock('../../../services/exerciseService');
const mockExerciseService = exerciseService as jest.Mocked<typeof exerciseService>;

// Mock data
const mockUsage = {
  exerciseId: 'exercise-001',
  exercise: {
    id: 'exercise-001',
    exerciseType: 'translation' as const,
    data: { source_text: 'Hello', target_text: 'Hola' },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  totalLessons: 3,
  lessons: [
    {
      lessonId: 'lesson-001',
      lessonName: 'Basic Greetings',
      moduleId: 'module-001',
      moduleName: 'Introduction',
      sectionId: 'section-001',
      sectionName: 'Basics',
      levelId: 'level-001',
      levelName: 'Beginner',
      courseId: 'course-001',
      courseName: 'Spanish 101',
      order: 1
    }
  ],
  usageFrequency: 2.5,
  lastUsed: '2024-01-15T00:00:00Z',
  createdAt: '2024-01-01T00:00:00Z'
};

const mockAnalytics = {
  exerciseId: 'exercise-001',
  usageStats: {
    totalAssignments: 3,
    uniqueLessons: 3,
    uniqueCourses: 1,
    averagePosition: 1.5
  },
  performanceMetrics: {
    completionRate: 85,
    averageScore: 78,
    averageTimeSpent: 45
  },
  trends: {
    weeklyUsage: [
      { week: '2024-01-01', count: 5 },
      { week: '2024-01-08', count: 3 }
    ],
    monthlyUsage: [
      { month: '2024-01', count: 15 }
    ]
  }
};

const mockDeleteImpact = {
  exerciseId: 'exercise-001',
  canDelete: false,
  affectedLessons: 3,
  affectedCourses: 1,
  warnings: ['This exercise is currently used in 3 lesson(s)'],
  lessons: [
    {
      lessonId: 'lesson-001',
      lessonName: 'Basic Greetings',
      courseName: 'Spanish 101',
      studentCount: 25
    }
  ]
};

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </QueryClientProvider>
  );
};

describe('ExerciseUsageDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExerciseService.getExerciseUsage.mockResolvedValue(mockUsage);
    mockExerciseService.getExerciseAnalytics.mockResolvedValue(mockAnalytics);
    mockExerciseService.getExerciseDeleteImpact.mockResolvedValue(mockDeleteImpact);
  });

  it('renders usage statistics correctly', async () => {
    renderWithProviders(<ExerciseUsageDashboard exerciseId="exercise-001" />);

    await waitFor(() => {
      expect(screen.getByText('Exercise Usage Dashboard')).toBeInTheDocument();
    });

    // Check usage statistics
    expect(screen.getByText('Total Lessons')).toBeInTheDocument();
    expect(screen.getByText('Unique Courses')).toBeInTheDocument();
    expect(screen.getByText('Usage/Month')).toBeInTheDocument();
    expect(screen.getByText('Avg Position')).toBeInTheDocument();
  });

  it('displays performance metrics when available', async () => {
    renderWithProviders(<ExerciseUsageDashboard exerciseId="exercise-001" />);

    await waitFor(() => {
      expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    });

    expect(screen.getByText('85%')).toBeInTheDocument(); // Completion rate
    expect(screen.getByText('78%')).toBeInTheDocument(); // Average score
    expect(screen.getByText('45s')).toBeInTheDocument(); // Average time
  });

  it('shows lessons using the exercise', async () => {
    renderWithProviders(<ExerciseUsageDashboard exerciseId="exercise-001" />);

    await waitFor(() => {
      expect(screen.getByText('Lessons Using This Exercise')).toBeInTheDocument();
    });

    expect(screen.getByText('Basic Greetings')).toBeInTheDocument();
    expect(screen.getByText('Spanish 101 → Beginner → Basics → Introduction')).toBeInTheDocument();
    expect(screen.getByText('Position 1')).toBeInTheDocument();
  });

  it('opens delete impact analysis when button is clicked', async () => {
    renderWithProviders(<ExerciseUsageDashboard exerciseId="exercise-001" />);

    await waitFor(() => {
      expect(screen.getByText('Analyze Delete Impact')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Analyze Delete Impact'));

    await waitFor(() => {
      expect(screen.getByText('Delete Impact Analysis')).toBeInTheDocument();
    });

    expect(screen.getByText('Not recommended to delete')).toBeInTheDocument();
    expect(screen.getByText('Affected Lessons')).toBeInTheDocument();
    expect(screen.getByText('This exercise is currently used in 3 lesson(s)')).toBeInTheDocument();
  });

  it('opens duplicate exercise modal when button is clicked', async () => {
    renderWithProviders(<ExerciseUsageDashboard exerciseId="exercise-001" />);

    await waitFor(() => {
      expect(screen.getByText('Duplicate')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Duplicate'));

    await waitFor(() => {
      expect(screen.getByText('Duplicate Exercise')).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText('Enter new exercise ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('{"difficulty": "hard", "timeLimit": 30}')).toBeInTheDocument();
  });

  it('handles duplicate exercise submission', async () => {
    const mockDuplicate = {
      id: 'exercise-001-v2',
      exerciseType: 'translation' as const,
      data: { source_text: 'Hello', target_text: 'Hola', difficulty: 'hard' },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockExerciseService.duplicateExercise.mockResolvedValue(mockDuplicate);

    renderWithProviders(<ExerciseUsageDashboard exerciseId="exercise-001" />);

    await waitFor(() => {
      expect(screen.getByText('Exercise Usage Dashboard')).toBeInTheDocument();
    });

    // Open duplicate modal
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));

    await waitFor(() => {
      expect(screen.getByText('Duplicate Exercise')).toBeInTheDocument();
    });

    // Fill in form
    fireEvent.change(screen.getByPlaceholderText('Enter new exercise ID'), {
      target: { value: 'exercise-001-v2' }
    });

    fireEvent.change(screen.getByPlaceholderText('{"difficulty": "hard", "timeLimit": 30}'), {
      target: { value: '{"difficulty": "hard"}' }
    });

    // Submit form
    const duplicateButtons = screen.getAllByText('Duplicate');
    const submitButton = duplicateButtons.find(button => 
      button.closest('button')?.getAttribute('type') !== 'button' || 
      button.closest('.space-x-2')
    );
    
    if (submitButton) {
      fireEvent.click(submitButton);
    }

    await waitFor(() => {
      expect(mockExerciseService.duplicateExercise).toHaveBeenCalledWith('exercise-001', {
        id: 'exercise-001-v2',
        modifications: { difficulty: 'hard' },
        preserveUsage: false
      });
    });
  });

  it('displays usage trends', async () => {
    renderWithProviders(<ExerciseUsageDashboard exerciseId="exercise-001" />);

    await waitFor(() => {
      expect(screen.getByText('Usage Trends')).toBeInTheDocument();
    });

    expect(screen.getByText('Weekly Usage')).toBeInTheDocument();
    expect(screen.getByText('Monthly Usage')).toBeInTheDocument();
    expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('2024-01')).toBeInTheDocument();
  });

  it('handles loading states', () => {
    mockExerciseService.getExerciseUsage.mockImplementation(() => new Promise(() => {}));
    mockExerciseService.getExerciseAnalytics.mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<ExerciseUsageDashboard exerciseId="exercise-001" />);

    expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
  });

  it('handles error states', async () => {
    const error = new Error('Failed to load usage data');
    mockExerciseService.getExerciseUsage.mockRejectedValue(error);
    mockExerciseService.getExerciseAnalytics.mockRejectedValue(error);

    renderWithProviders(<ExerciseUsageDashboard exerciseId="exercise-001" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load usage data/)).toBeInTheDocument();
    });
  });

  it('shows empty state when no lessons use the exercise', async () => {
    const emptyUsage = {
      ...mockUsage,
      totalLessons: 0,
      lessons: []
    };

    mockExerciseService.getExerciseUsage.mockResolvedValue(emptyUsage);

    renderWithProviders(<ExerciseUsageDashboard exerciseId="exercise-001" />);

    await waitFor(() => {
      expect(screen.getByText('This exercise is not currently used in any lessons')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const mockOnClose = jest.fn();

    renderWithProviders(
      <ExerciseUsageDashboard exerciseId="exercise-001" onClose={mockOnClose} />
    );

    await waitFor(() => {
      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Close'));
    expect(mockOnClose).toHaveBeenCalled();
  });
});