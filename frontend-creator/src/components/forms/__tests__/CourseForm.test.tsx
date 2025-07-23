import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CourseForm } from '../CourseForm';
import { courseService } from '../../../services/courseService';

// Mock dependencies
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback: string) => fallback,
  }),
}));

jest.mock('../../../services/courseService', () => ({
  courseService: {
    createCourse: jest.fn(),
  },
}));

describe('CourseForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with all required fields', () => {
    render(<CourseForm />);
    
    // Check for form elements
    expect(screen.getByLabelText(/Course ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Course Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Source Language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Make this course public/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Course/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<CourseForm />);
    
    // Submit the form without filling required fields
    fireEvent.click(screen.getByRole('button', { name: /Create Course/i }));
    
    // Check for validation errors - be specific about which field has the error
    await waitFor(() => {
      expect(screen.getByText(/Course name must be at least 3 characters/i)).toBeInTheDocument();
      
      // Find each language input field and check for associated error messages
      const sourceLangInput = screen.getByLabelText(/source language/i);
      const targetLangInput = screen.getByLabelText(/target language/i);
      
      // Check that error messages exist near each field
      expect(sourceLangInput.closest('div')).toHaveTextContent(/Please enter a valid BCP 47 language code/i);
      expect(targetLangInput.closest('div')).toHaveTextContent(/Please enter a valid BCP 47 language code/i);
    });
  });

  it('submits the form with valid data', async () => {
    const mockOnSuccess = jest.fn();
    const mockCourse = {
      id: 'test-course',
      name: 'Test Course',
      source_language: 'en',
      target_language: 'es',
      description: 'Test description',
      is_public: true,
    };
    
    (courseService.createCourse as jest.Mock).mockResolvedValue(mockCourse);
    
    render(<CourseForm onSuccess={mockOnSuccess} />);
    
    // Fill in the form - including the Course ID field
    fireEvent.change(screen.getByLabelText(/Course ID/i), { target: { value: 'test-course' } });
    fireEvent.change(screen.getByLabelText(/Course Name/i), { target: { value: 'Test Course' } });
    fireEvent.change(screen.getByLabelText(/Source Language/i), { target: { value: 'en' } });
    fireEvent.change(screen.getByLabelText(/Target Language/i), { target: { value: 'es' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Test description' } });
    fireEvent.click(screen.getByLabelText(/Make this course public/i));
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Course/i }));
    
    // Check if the service was called with correct data
    await waitFor(() => {
      expect(courseService.createCourse).toHaveBeenCalledWith({
        id: 'test-course',
        name: 'Test Course',
        source_language: 'en',
        target_language: 'es',
        description: 'Test description',
        is_public: true,
      });
      expect(mockOnSuccess).toHaveBeenCalledWith(mockCourse);
    });
    
    // Check for success message
    expect(screen.getByText(/Course created successfully!/i)).toBeInTheDocument();
  });

  it('shows error message when API call fails', async () => {
    const errorMessage = 'API Error';
    (courseService.createCourse as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    render(<CourseForm />);
    
    // Fill in the form with valid data
    fireEvent.change(screen.getByLabelText(/Course ID/i), { target: { value: 'test-course' } });
    fireEvent.change(screen.getByLabelText(/Course Name/i), { target: { value: 'Test Course' } });
    fireEvent.change(screen.getByLabelText(/Source Language/i), { target: { value: 'en' } });
    fireEvent.change(screen.getByLabelText(/Target Language/i), { target: { value: 'es' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Create Course/i }));
    
    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('resets the form when cancel button is clicked', () => {
    const mockOnCancel = jest.fn();
    render(<CourseForm onCancel={mockOnCancel} />);
    
    // Fill in a field
    fireEvent.change(screen.getByLabelText(/Course Name/i), { target: { value: 'Test Course' } });
    
    // Click cancel
    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
    
    // Check if onCancel was called
    expect(mockOnCancel).toHaveBeenCalled();
  });
});