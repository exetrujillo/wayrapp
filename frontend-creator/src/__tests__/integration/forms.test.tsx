/**
 * Integration tests for form submissions and API interactions
 * Tests complete form workflows with mocked API responses
 */

import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { UnifiedCourseForm } from '../../components/forms/UnifiedEntityForm';
import { courseService } from '../../services/courseService';

// Mock the course service
jest.mock('../../services/courseService', () => ({
  courseService: {
    createCourse: jest.fn(),
    getCourses: jest.fn(),
    getCourse: jest.fn(),
    updateCourse: jest.fn(),
    deleteCourse: jest.fn(),
  },
}));

const mockCourseService = courseService as jest.Mocked<typeof courseService>;

describe('Form Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UnifiedCourseForm', () => {
    it('successfully submits course creation form', async () => {
      const mockCourse = {
        id: '1',
        name: 'Test Course',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        description: 'A test course',
        isPublic: true,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockCourseService.createCourse.mockResolvedValue(mockCourse);

      const onSuccess = jest.fn();
      const onSubmit = jest.fn().mockResolvedValue(mockCourse);
      render(<UnifiedCourseForm mode="create" onSubmit={onSubmit} onSuccess={onSuccess} />);

      // Fill out the form
      fireEvent.change(screen.getByLabelText(/course id/i), {
        target: { value: 'test-course' },
      });

      fireEvent.change(screen.getByLabelText(/course name/i), {
        target: { value: 'Test Course' },
      });

      fireEvent.change(screen.getByLabelText(/source language/i), {
        target: { value: 'en' },
      });

      fireEvent.change(screen.getByLabelText(/target language/i), {
        target: { value: 'es' },
      });

      fireEvent.change(screen.getByLabelText(/description/i), {
        target: { value: 'A test course' },
      });

      fireEvent.click(screen.getByLabelText(/make public/i));

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      // Wait for API call and success
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockCourse);
      });
    });

    it('displays validation errors for invalid form data', async () => {
      const onSubmit = jest.fn();
      render(<UnifiedCourseForm mode="create" onSubmit={onSubmit} />);

      // Submit form without filling required fields
      fireEvent.click(screen.getByRole('button', { name: /create/i }));

      // Wait for validation errors
      await waitFor(() => {
        // Check for validation error messages
        expect(screen.getByText(/required/i)).toBeInTheDocument();
      });

      // API should not be called
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});