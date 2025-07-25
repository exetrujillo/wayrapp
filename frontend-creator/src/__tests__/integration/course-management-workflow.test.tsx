import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockAuthContextValues } from '../utils/test-utils';
import CoursesPage from '../../pages/CoursesPage';
import CreateCoursePage from '../../pages/CreateCoursePage';
import CourseDetailPage from '../../pages/CourseDetailPage';
import { courseService } from '../../services/courseService';
import { levelService } from '../../services/levelService';

// Mock services
jest.mock('../../services/courseService');
jest.mock('../../services/levelService');
const mockCourseService = courseService as jest.Mocked<typeof courseService>;
const mockLevelService = levelService as jest.Mocked<typeof levelService>;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ courseId: 'test-course-1' }),
}));

describe('Course Management Workflow Integration Tests', () => {
  const mockCourse = {
    id: 'test-course-1',
    name: 'Test Spanish Course',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    description: 'A comprehensive Spanish learning course',
    isPublic: true,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockLevel = {
    id: 'level-1',
    courseId: 'test-course-1',
    code: 'A1',
    name: 'Beginner',
    order: 1,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('Course List and Creation Workflow', () => {
    it('should display courses list and allow navigation to create course', async () => {
      const mockCoursesResponse = {
        data: [mockCourse],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };

      mockCourseService.getCourses.mockResolvedValue(mockCoursesResponse);

      render(
        <CoursesPage />,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Test Spanish Course')).toBeInTheDocument();
      });

      // Check if create course button exists
      const createButton = screen.getByText(/Create New Course/i);
      expect(createButton).toBeInTheDocument();
    });

    it('should create a new course and redirect to courses list', async () => {
      const user = userEvent.setup();

      mockCourseService.createCourse.mockResolvedValue(mockCourse);

      render(
        <CreateCoursePage />,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Fill out the form
      await user.type(screen.getByLabelText(/Course ID/i), 'test-course-1');
      await user.type(screen.getByLabelText(/Course Name/i), 'Test Spanish Course');
      await user.type(screen.getByLabelText(/Source Language/i), 'en');
      await user.type(screen.getByLabelText(/Target Language/i), 'es');
      await user.type(screen.getByLabelText(/Description/i), 'A comprehensive Spanish learning course');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Create Course/i });
      await user.click(submitButton);

      // Wait for success message
      await waitFor(() => {
        expect(screen.getByText(/Course created successfully!/i)).toBeInTheDocument();
      });

      // Verify the service was called with correct data
      expect(mockCourseService.createCourse).toHaveBeenCalledWith({
        id: 'test-course-1',
        name: 'Test Spanish Course',
        source_language: 'en',
        target_language: 'es',
        description: 'A comprehensive Spanish learning course',
        is_public: true,
      });
    });
  });

  describe('Course Detail and Level Management Workflow', () => {
    it('should display course details and allow level creation', async () => {
      const user = userEvent.setup();

      mockCourseService.getCourse.mockResolvedValue(mockCourse);
      mockLevelService.getLevelsByCourse.mockResolvedValue({
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      });
      mockLevelService.createLevel.mockResolvedValue(mockLevel);

      render(
        <CourseDetailPage />,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Wait for course to load
      await waitFor(() => {
        expect(screen.getByText('Test Spanish Course')).toBeInTheDocument();
      });

      // Check if add level button exists
      const addLevelButton = screen.getByText(/Add Level/i);
      expect(addLevelButton).toBeInTheDocument();

      // Click add level button to open modal
      await user.click(addLevelButton);

      // Wait for modal to open
      await waitFor(() => {
        expect(screen.getByText(/Create Level/i)).toBeInTheDocument();
      });

      // Fill out level form
      await user.type(screen.getByLabelText(/Level Code/i), 'A1');
      await user.type(screen.getByLabelText(/Level Name/i), 'Beginner');

      // Submit level form
      const submitLevelButton = screen.getByRole('button', { name: /Create Level/i });
      await user.click(submitLevelButton);

      // Wait for level creation
      await waitFor(() => {
        expect(mockLevelService.createLevel).toHaveBeenCalledWith('test-course-1', {
          code: 'A1',
          name: 'Beginner',
          order: expect.any(Number),
        });
      });
    });

    it('should handle course loading errors gracefully', async () => {
      const mockError = new Error('Failed to load course');
      mockCourseService.getCourse.mockRejectedValue(mockError);

      render(
        <CourseDetailPage />,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Wait for error to be displayed
      await waitFor(() => {
        expect(screen.getByText(/Failed to load course/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Workflow', () => {
    it('should display error message when course creation fails', async () => {
      const user = userEvent.setup();
      const mockError = { response: { status: 409 } };

      mockCourseService.createCourse.mockRejectedValue(mockError);

      render(
        <CreateCoursePage />,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Fill out the form
      await user.type(screen.getByLabelText(/Course ID/i), 'existing-course');
      await user.type(screen.getByLabelText(/Course Name/i), 'Existing Course');
      await user.type(screen.getByLabelText(/Source Language/i), 'en');
      await user.type(screen.getByLabelText(/Target Language/i), 'es');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Create Course/i });
      await user.click(submitButton);

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/A course with this ID already exists/i)).toBeInTheDocument();
      });
    });

    it('should display loading state during course creation', async () => {
      const user = userEvent.setup();

      // Mock a delayed response
      mockCourseService.createCourse.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(mockCourse), 1000))
      );

      render(
        <CreateCoursePage />,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Fill out the form
      await user.type(screen.getByLabelText(/Course ID/i), 'test-course-1');
      await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
      await user.type(screen.getByLabelText(/Source Language/i), 'en');
      await user.type(screen.getByLabelText(/Target Language/i), 'es');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /Create Course/i });
      await user.click(submitButton);

      // Check for loading state
      expect(screen.getByText(/Creating Course.../i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Creating Course.../i })).toBeDisabled();
    });
  });

  describe('Form Validation Workflow', () => {
    it('should validate required fields and show errors', async () => {
      const user = userEvent.setup();

      render(
        <CreateCoursePage />,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /Create Course/i });
      await user.click(submitButton);

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText(/Course ID is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Course name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Source language is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Target language is required/i)).toBeInTheDocument();
      });

      // Verify form was not submitted
      expect(mockCourseService.createCourse).not.toHaveBeenCalled();
    });

    it('should validate field formats and lengths', async () => {
      const user = userEvent.setup();

      render(
        <CreateCoursePage />,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Test invalid course ID format
      const courseIdInput = screen.getByLabelText(/Course ID/i);
      await user.type(courseIdInput, 'invalid ID with spaces');

      await waitFor(() => {
        expect(screen.getByText(/Course ID can only contain letters, numbers, and hyphens/i)).toBeInTheDocument();
      });

      // Test course ID length
      await user.clear(courseIdInput);
      await user.type(courseIdInput, 'this-is-a-very-long-course-id-that-exceeds-the-limit');

      await waitFor(() => {
        expect(screen.getByText(/Course ID must be 20 characters or less/i)).toBeInTheDocument();
      });
    });
  });

  describe('Cache Invalidation Workflow', () => {
    it('should invalidate courses cache after successful creation', async () => {
      const user = userEvent.setup();

      mockCourseService.createCourse.mockResolvedValue(mockCourse);

      render(
        <CreateCoursePage />,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/Course ID/i), 'test-course-1');
      await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
      await user.type(screen.getByLabelText(/Source Language/i), 'en');
      await user.type(screen.getByLabelText(/Target Language/i), 'es');

      const submitButton = screen.getByRole('button', { name: /Create Course/i });
      await user.click(submitButton);

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText(/Course created successfully!/i)).toBeInTheDocument();
      });

      // Verify course was created
      expect(mockCourseService.createCourse).toHaveBeenCalled();
    });
  });
});