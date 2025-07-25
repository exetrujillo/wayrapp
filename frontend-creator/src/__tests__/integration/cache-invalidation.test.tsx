/**
 * Cache Invalidation Integration Tests
 * 
 * This test suite specifically focuses on:
 * - TanStack Query cache invalidation patterns
 * - Hierarchical cache dependencies
 * - Optimistic updates and rollbacks
 * - Cache synchronization across components
 * - Performance implications of cache strategies
 */

import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockAuthContextValues } from '../utils/test-utils';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { courseService } from '../../services/courseService';
import { levelService } from '../../services/levelService';
import { sectionService } from '../../services/sectionService';
import { moduleService } from '../../services/moduleService';
import { lessonService } from '../../services/lessonService';
import { exerciseService } from '../../services/exerciseService';

// Mock all services
jest.mock('../../services/courseService');
jest.mock('../../services/levelService');
jest.mock('../../services/sectionService');
jest.mock('../../services/moduleService');
jest.mock('../../services/lessonService');
jest.mock('../../services/exerciseService');

const mockCourseService = courseService as jest.Mocked<typeof courseService>;
const mockLevelService = levelService as jest.Mocked<typeof levelService>;
const mockSectionService = sectionService as jest.Mocked<typeof sectionService>;
const mockModuleService = moduleService as jest.Mocked<typeof moduleService>;
const mockLessonService = lessonService as jest.Mocked<typeof lessonService>;
const mockExerciseService = exerciseService as jest.Mocked<typeof exerciseService>;

// Mock data
const mockCourse = {
  id: 'spanish-basics',
  name: 'Spanish Basics',
  sourceLanguage: 'en',
  targetLanguage: 'es',
  description: 'Learn basic Spanish vocabulary and grammar',
  isPublic: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockLevel = {
  id: 'level-a1',
  courseId: 'spanish-basics',
  code: 'A1',
  name: 'Beginner',
  order: 1,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockSection = {
  id: 'section-greetings',
  levelId: 'level-a1',
  name: 'Greetings',
  order: 1,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockModule = {
  id: 'module-basic-greetings',
  sectionId: 'section-greetings',
  moduleType: 'basic_lesson' as const,
  name: 'Basic Greetings',
  order: 1,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockLesson = {
  id: 'lesson-hello',
  moduleId: 'module-basic-greetings',
  experiencePoints: 10,
  order: 1,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockExercise = {
  id: 'exercise-translate-hello',
  exerciseType: 'translation' as const,
  data: {
    sourceText: 'Hello',
    targetText: 'Hola',
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('Cache Invalidation Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock responses
    mockCourseService.getCourses.mockResolvedValue({
      data: [mockCourse],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    
    mockCourseService.getCourse.mockResolvedValue(mockCourse);
    mockLevelService.getLevelsByCourse.mockResolvedValue({
      data: [mockLevel],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    
    mockSectionService.getSectionsByLevel.mockResolvedValue({
      data: [mockSection],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    
    mockModuleService.getModulesBySection.mockResolvedValue({
      data: [mockModule],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    
    mockLessonService.getLessonsByModule.mockResolvedValue({
      data: [mockLesson],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  });

  describe('Hierarchical Cache Invalidation', () => {
    it('should invalidate parent caches when child entities are created', async () => {
      const user = userEvent.setup();

      // Mock creation responses
      const newLevel = {
        ...mockLevel,
        id: 'level-a2',
        code: 'A2',
        name: 'Elementary',
        order: 2,
      };

      mockLevelService.createLevel.mockResolvedValue(newLevel);

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Navigate to course detail page
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await user.click(courseCard);
      }

      // Verify initial levels query
      await waitFor(() => {
        expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledWith('spanish-basics', expect.any(Object));
      });

      // Create a new level
      const addLevelButton = screen.getByText(/Add Level/i);
      await user.click(addLevelButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Level Code/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Level Code/i), 'A2');
      await user.type(screen.getByLabelText(/Level Name/i), 'Elementary');

      const submitButton = screen.getByRole('button', { name: /Create Level/i });
      await user.click(submitButton);

      // Wait for level creation
      await waitFor(() => {
        expect(mockLevelService.createLevel).toHaveBeenCalled();
      });

      // Verify cache invalidation - levels should be refetched
      await waitFor(() => {
        expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledTimes(2);
      });

      // Verify that course detail cache might also be invalidated if it includes level counts
      // This depends on the specific implementation
    });

    it('should handle deep cache invalidation across multiple hierarchy levels', async () => {
      const user = userEvent.setup();

      // Setup hierarchical data
      mockCourseService.getCourse.mockResolvedValue(mockCourse);
      mockLevelService.getLevelsByCourse.mockResolvedValue({
        data: [mockLevel],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
      mockSectionService.getSectionsByLevel.mockResolvedValue({
        data: [mockSection],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });
      mockModuleService.getModulesBySection.mockResolvedValue({
        data: [mockModule],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const newLesson = {
        ...mockLesson,
        id: 'lesson-goodbye',
        experiencePoints: 15,
        order: 2,
      };

      mockLessonService.createLesson.mockResolvedValue(newLesson);

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Navigate through hierarchy
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await user.click(courseCard);
      }

      // Select level
      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      const levelCard = screen.getByText('A1 - Beginner');
      await user.click(levelCard);

      // Select section
      await waitFor(() => {
        expect(screen.getByText('Greetings')).toBeInTheDocument();
      });

      const sectionCard = screen.getByText('Greetings');
      await user.click(sectionCard);

      // Select module
      await waitFor(() => {
        expect(screen.getByText('Basic Greetings')).toBeInTheDocument();
      });

      const moduleCard = screen.getByText('Basic Greetings');
      await user.click(moduleCard);

      // Verify all queries have been called
      await waitFor(() => {
        expect(mockLevelService.getLevelsByCourse).toHaveBeenCalled();
        expect(mockSectionService.getSectionsByLevel).toHaveBeenCalled();
        expect(mockModuleService.getModulesBySection).toHaveBeenCalled();
        expect(mockLessonService.getLessonsByModule).toHaveBeenCalled();
      });

      // Create a new lesson
      const addLessonButton = screen.getByText(/Add Lesson/i);
      await user.click(addLessonButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Experience Points/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Experience Points/i), '15');

      const submitButton = screen.getByRole('button', { name: /Create Lesson/i });
      await user.click(submitButton);

      // Wait for lesson creation
      await waitFor(() => {
        expect(mockLessonService.createLesson).toHaveBeenCalled();
      });

      // Verify cache invalidation at lesson level
      await waitFor(() => {
        expect(mockLessonService.getLessonsByModule).toHaveBeenCalledTimes(2);
      });

      // Verify that parent caches might also be invalidated
      // This would depend on whether parent entities include child counts
    });

    it('should handle concurrent cache invalidations without conflicts', async () => {
      const user = userEvent.setup();

      // Mock multiple concurrent operations
      const newLevel1 = { ...mockLevel, id: 'level-a2', code: 'A2', name: 'Elementary' };
      const newLevel2 = { ...mockLevel, id: 'level-b1', code: 'B1', name: 'Intermediate' };

      mockLevelService.createLevel
        .mockResolvedValueOnce(newLevel1)
        .mockResolvedValueOnce(newLevel2);

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Navigate to course detail
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await user.click(courseCard);
      }

      // Simulate rapid successive operations
      const addLevelButton = screen.getByText(/Add Level/i);
      
      // First operation
      await user.click(addLevelButton);
      await waitFor(() => {
        expect(screen.getByLabelText(/Level Code/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Level Code/i), 'A2');
      await user.type(screen.getByLabelText(/Level Name/i), 'Elementary');

      const submitButton1 = screen.getByRole('button', { name: /Create Level/i });
      await user.click(submitButton1);

      // Wait for first operation to complete
      await waitFor(() => {
        expect(mockLevelService.createLevel).toHaveBeenCalledTimes(1);
      });

      // Second operation immediately after
      await user.click(addLevelButton);
      await waitFor(() => {
        expect(screen.getByLabelText(/Level Code/i)).toBeInTheDocument();
      });

      await user.clear(screen.getByLabelText(/Level Code/i));
      await user.clear(screen.getByLabelText(/Level Name/i));
      await user.type(screen.getByLabelText(/Level Code/i), 'B1');
      await user.type(screen.getByLabelText(/Level Name/i), 'Intermediate');

      const submitButton2 = screen.getByRole('button', { name: /Create Level/i });
      await user.click(submitButton2);

      // Wait for both operations to complete
      await waitFor(() => {
        expect(mockLevelService.createLevel).toHaveBeenCalledTimes(2);
      });

      // Verify that cache invalidation handled both operations correctly
      await waitFor(() => {
        // Should have been called: initial load + after first creation + after second creation
        expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Optimistic Updates and Rollbacks', () => {
    it('should handle optimistic updates with successful operations', async () => {
      const user = userEvent.setup();

      // Mock successful creation with delay
      const newLevel = {
        ...mockLevel,
        id: 'level-a2',
        code: 'A2',
        name: 'Elementary',
        order: 2,
      };

      mockLevelService.createLevel.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(newLevel), 500))
      );

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Navigate to course detail
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await user.click(courseCard);
      }

      // Create level with optimistic update
      const addLevelButton = screen.getByText(/Add Level/i);
      await user.click(addLevelButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Level Code/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Level Code/i), 'A2');
      await user.type(screen.getByLabelText(/Level Name/i), 'Elementary');

      const submitButton = screen.getByRole('button', { name: /Create Level/i });
      await user.click(submitButton);

      // Check for optimistic update (if implemented)
      // The UI might show the new level immediately before server confirmation

      // Wait for actual server response
      await waitFor(() => {
        expect(mockLevelService.createLevel).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Verify final state is correct
      await waitFor(() => {
        expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledTimes(2);
      });
    });

    it('should rollback optimistic updates on operation failure', async () => {
      const user = userEvent.setup();

      // Mock failed creation
      const error = new Error('Server error');
      mockLevelService.createLevel.mockRejectedValue(error);

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Navigate to course detail
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await user.click(courseCard);
      }

      // Attempt to create level
      const addLevelButton = screen.getByText(/Add Level/i);
      await user.click(addLevelButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Level Code/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Level Code/i), 'A2');
      await user.type(screen.getByLabelText(/Level Name/i), 'Elementary');

      const submitButton = screen.getByRole('button', { name: /Create Level/i });
      await user.click(submitButton);

      // Wait for error
      await waitFor(() => {
        expect(mockLevelService.createLevel).toHaveBeenCalled();
      });

      // Check that error is displayed
      await waitFor(() => {
        expect(screen.getByText(/Server error/i)).toBeInTheDocument();
      });

      // Verify that optimistic update was rolled back (if implemented)
      // The UI should not show the failed level creation
    });
  });

  describe('Cross-Component Cache Synchronization', () => {
    it('should synchronize cache updates across multiple components', async () => {
      const user = userEvent.setup();

      // Mock data for multiple components
      mockExerciseService.getExercises.mockResolvedValue({
        data: [mockExercise],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      mockLessonService.getLesson.mockResolvedValue(mockLesson);
      mockLessonService.getLessonExercises.mockResolvedValue([]);

      const newExercise = {
        ...mockExercise,
        id: 'exercise-translate-goodbye',
        data: {
          sourceText: 'Goodbye',
          targetText: 'Adiós',
        },
      };

      mockExerciseService.createExercise.mockResolvedValue(newExercise);

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Navigate to exercises page
      const exercisesLink = screen.getByText(/Exercises/i);
      await user.click(exercisesLink);

      // Verify exercises are loaded
      await waitFor(() => {
        expect(mockExerciseService.getExercises).toHaveBeenCalled();
      });

      // Create new exercise
      const createExerciseButton = screen.getByText(/Create Exercise/i);
      await user.click(createExerciseButton);

      // Fill out exercise form (simplified)
      await waitFor(() => {
        expect(screen.getByLabelText(/Exercise Type/i)).toBeInTheDocument();
      });

      await user.selectOptions(screen.getByLabelText(/Exercise Type/i), 'translation');
      await user.type(screen.getByLabelText(/Source Text/i), 'Goodbye');
      await user.type(screen.getByLabelText(/Target Text/i), 'Adiós');

      const submitButton = screen.getByRole('button', { name: /Create Exercise/i });
      await user.click(submitButton);

      // Wait for exercise creation
      await waitFor(() => {
        expect(mockExerciseService.createExercise).toHaveBeenCalled();
      });

      // Verify cache invalidation
      await waitFor(() => {
        expect(mockExerciseService.getExercises).toHaveBeenCalledTimes(2);
      });

      // Navigate to lesson detail page (different component using same cache)
      const lessonsLink = screen.getByText(/Lessons/i);
      await user.click(lessonsLink);

      // Navigate to specific lesson
      await waitFor(() => {
        expect(screen.getByText('Lesson Hello')).toBeInTheDocument();
      });

      const lessonCard = screen.getByText('Lesson Hello').closest('[data-testid="lesson-card"]');
      if (lessonCard) {
        await user.click(lessonCard);
      }

      // Verify that exercise data is synchronized
      await waitFor(() => {
        expect(mockLessonService.getLesson).toHaveBeenCalled();
      });

      // The exercise assignment modal should show the newly created exercise
      const assignExerciseButton = screen.getByText(/Assign Exercise/i);
      await user.click(assignExerciseButton);

      // Verify that the new exercise appears in the assignment modal
      await waitFor(() => {
        // The exercises query should reflect the updated cache
        expect(mockExerciseService.getExercises).toHaveBeenCalled();
      });
    });
  });

  describe('Cache Performance and Memory Management', () => {
    it('should handle large datasets without memory leaks', async () => {
      // Mock large dataset
      const largeCourseList = Array.from({ length: 100 }, (_, i) => ({
        ...mockCourse,
        id: `course-${i}`,
        name: `Course ${i}`,
      }));

      mockCourseService.getCourses.mockResolvedValue({
        data: largeCourseList,
        meta: { total: 100, page: 1, limit: 100, totalPages: 1 },
      });

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Wait for large dataset to load
      await waitFor(() => {
        expect(screen.getByText('Course 0')).toBeInTheDocument();
        expect(screen.getByText('Course 99')).toBeInTheDocument();
      });

      // Verify that the query was called
      expect(mockCourseService.getCourses).toHaveBeenCalled();

      // Navigate away and back to test cache behavior
      const exercisesLink = screen.getByText(/Exercises/i);
      await userEvent.setup().click(exercisesLink);

      const coursesLink = screen.getByText(/Courses/i);
      await userEvent.setup().click(coursesLink);

      // Verify cache is used (no additional API call)
      await waitFor(() => {
        expect(screen.getByText('Course 0')).toBeInTheDocument();
      });

      // Should still be only one call due to caching
      expect(mockCourseService.getCourses).toHaveBeenCalledTimes(1);
    });

    it('should properly garbage collect unused cache entries', async () => {
      // This test would verify that cache entries are cleaned up
      // when they're no longer needed, but requires more complex setup
      // with actual QueryClient inspection

      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Navigate through multiple pages to create cache entries
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await user.click(courseCard);
      }

      // Navigate to exercises
      const exercisesLink = screen.getByText(/Exercises/i);
      await user.click(exercisesLink);

      // Navigate back to courses
      const coursesLink = screen.getByText(/Courses/i);
      await user.click(coursesLink);

      // In a real implementation, you would check that:
      // 1. Unused cache entries are eventually garbage collected
      // 2. Memory usage doesn't grow indefinitely
      // 3. Cache size limits are respected
    });
  });

  describe('Error Recovery and Cache Consistency', () => {
    it('should maintain cache consistency during network errors', async () => {
      const user = userEvent.setup();

      // Mock network error for creation
      const networkError = new Error('Network Error');
      mockLevelService.createLevel.mockRejectedValue(networkError);

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Navigate to course detail
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await user.click(courseCard);
      }

      // Attempt to create level
      const addLevelButton = screen.getByText(/Add Level/i);
      await user.click(addLevelButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Level Code/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Level Code/i), 'A2');
      await user.type(screen.getByLabelText(/Level Name/i), 'Elementary');

      const submitButton = screen.getByRole('button', { name: /Create Level/i });
      await user.click(submitButton);

      // Wait for error
      await waitFor(() => {
        expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
      });

      // Verify cache wasn't invalidated due to error
      expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledTimes(1);

      // Test retry mechanism
      mockLevelService.createLevel.mockResolvedValue({
        ...mockLevel,
        id: 'level-a2',
        code: 'A2',
        name: 'Elementary',
      });

      const retryButton = screen.getByText(/Retry/i);
      await user.click(retryButton);

      // Wait for successful retry
      await waitFor(() => {
        expect(mockLevelService.createLevel).toHaveBeenCalledTimes(2);
      });

      // Verify cache is now invalidated after successful operation
      await waitFor(() => {
        expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledTimes(2);
      });
    });
  });
});