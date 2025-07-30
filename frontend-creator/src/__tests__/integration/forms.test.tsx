/**
 * Integration tests for form submissions and API interactions
 * Tests complete form workflows with mocked API responses
 */

import { render, screen, fireEvent, waitFor } from '../utils/test-utils';
import { EnhancedCourseForm } from '../../components/forms';
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

  describe('EnhancedCourseForm', () => {
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
      render(<EnhancedCourseForm onSubmit={onSubmit} onSuccess={onSuccess} />);

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
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      // Wait for API call and success
      await waitFor(() => {
        expect(mockCourseService.createCourse).toHaveBeenCalledWith({
          id: 'test-course',
          name: 'Test Course',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          description: 'A test course',
          isPublic: true,
        });
      });

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(mockCourse);
      });

      // Check for success message
      expect(screen.getByText(/course created successfully/i)).toBeInTheDocument();
    });

    it('displays validation errors for invalid form data', async () => {
      const onSubmit = jest.fn();
      render(<EnhancedCourseForm onSubmit={onSubmit} />);

      // Submit form without filling required fields
      fireEvent.click(screen.getByRole('button', { name: /create course/i }));

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText(/course name must be at least 3 characters/i)).toBeInTheDocument();
        const errorMessages = screen.getAllByText(/please enter a valid bcp 47 language code/i);
        expect(errorMessages).toHaveLength(2);
      });

      // API should not be called
      expect(mockCourseService.createCourse).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
      mockCourseService.createCourse.mockRejectedValue(
        new Error('Course name already exists')
      );

      const onSubmit = jest.fn();
      render(<EnhancedCourseForm onSubmit={onSubmit} />);

      // Fill out valid form data
      fireEvent.change(screen.getByLabelText(/course name/i), {
        target: { value: 'Existing Course' },
      });

      fireEvent.change(screen.getByLabelText(/source language/i), {
        target: { value: 'en' },
      });

      fireEvent.change(screen.getByLabelText(/target language/i), {
        target: { value: 'es' },
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /create course/i }));

      // Wait for API call and error
      await waitFor(() => {
        expect(mockCourseService.createCourse).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText(/course name already exists/i)).toBeInTheDocument();
      });
    });

    it('shows loading state during form submission', async () => {
      // Mock a delayed response
      mockCourseService.createCourse.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          id: '1',
          name: 'Test Course',
          sourceLanguage: 'en',
          targetLanguage: 'es',
          isPublic: false,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        }), 100))
      );

      const onSubmit = jest.fn();
      render(<EnhancedCourseForm onSubmit={onSubmit} />);

      // Fill out form
      fireEvent.change(screen.getByLabelText(/course name/i), {
        target: { value: 'Test Course' },
      });

      fireEvent.change(screen.getByLabelText(/source language/i), {
        target: { value: 'en' },
      });

      fireEvent.change(screen.getByLabelText(/target language/i), {
        target: { value: 'es' },
      });

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create course/i }));

      // Wait for and check loading state
      const submitButton = screen.getByRole('button', { name: /create course/i });
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
        expect(submitButton.querySelector('.animate-spin')).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('resets form after successful submission', async () => {
      const mockCourse = {
        id: '1',
        name: 'Test Course',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        isPublic: false,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      mockCourseService.createCourse.mockResolvedValue(mockCourse);

      const onSubmit = jest.fn();
      render(<EnhancedCourseForm onSubmit={onSubmit} />);

      const nameInput = screen.getByLabelText(/course name/i) as HTMLInputElement;
      const sourceInput = screen.getByLabelText(/source language/i) as HTMLInputElement;
      const targetInput = screen.getByLabelText(/target language/i) as HTMLInputElement;

      // Fill out form
      fireEvent.change(nameInput, { target: { value: 'Test Course' } });
      fireEvent.change(sourceInput, { target: { value: 'en' } });
      fireEvent.change(targetInput, { target: { value: 'es' } });

      // Verify form has values
      expect(nameInput.value).toBe('Test Course');
      expect(sourceInput.value).toBe('en');
      expect(targetInput.value).toBe('es');

      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /create course/i }));

      // Wait for success and form reset
      await waitFor(() => {
        expect(nameInput.value).toBe('');
        expect(sourceInput.value).toBe('');
        expect(targetInput.value).toBe('');
      });
    });

    it('handles cancel action correctly', () => {
      const onCancel = jest.fn();
      const onSubmit = jest.fn();
      render(<EnhancedCourseForm onSubmit={onSubmit} onCancel={onCancel} />);

      // Fill out some form data
      fireEvent.change(screen.getByLabelText(/course name/i), {
        target: { value: 'Test Course' },
      });

      // Click cancel
      fireEvent.click(screen.getByText(/cancel/i));

      // Should call onCancel and reset form
      expect(onCancel).toHaveBeenCalledTimes(1);
      
      const nameInput = screen.getByLabelText(/course name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });

    it('validates BCP 47 language codes correctly', async () => {
      const onSubmit = jest.fn();
      render(<EnhancedCourseForm onSubmit={onSubmit} />);

      // Test invalid language codes
      fireEvent.change(screen.getByLabelText(/source language/i), {
        target: { value: 'invalid-code' },
      });

      fireEvent.change(screen.getByLabelText(/target language/i), {
        target: { value: '123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create course/i }));

      await waitFor(() => {
        const errorMessages = screen.getAllByText(/please enter a valid bcp 47 language code/i);
        expect(errorMessages).toHaveLength(2);
      });

      // Test valid language codes
      fireEvent.change(screen.getByLabelText(/source language/i), {
        target: { value: 'en-US' },
      });

      fireEvent.change(screen.getByLabelText(/target language/i), {
        target: { value: 'es-MX' },
      });

      // Errors should disappear
      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid bcp 47 language code/i)).not.toBeInTheDocument();
      });
    });

    it('provides language suggestions from datalist', () => {
      const onSubmit = jest.fn();
      render(<EnhancedCourseForm onSubmit={onSubmit} />);

      // Check that datalist elements exist
      expect(document.getElementById('source_languages')).toBeInTheDocument();
      expect(document.getElementById('target_languages')).toBeInTheDocument();

      // Check that inputs are associated with datalists
      const sourceInput = screen.getByLabelText(/source language/i);
      const targetInput = screen.getByLabelText(/target language/i);

      expect(sourceInput).toHaveAttribute('list', 'source_languages');
      expect(targetInput).toHaveAttribute('list', 'target_languages');
    });
  });
});