import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockAuthContextValues } from '../../../__tests__/utils/test-utils';
import { CourseForm } from '../CourseForm';
import { useCreateCourseMutation } from '../../../hooks/useCourses';

// Mock the hooks
jest.mock('../../../hooks/useCourses');
const mockUseCreateCourseMutation = useCreateCourseMutation as jest.MockedFunction<typeof useCreateCourseMutation>;

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('CourseForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  const mockMutate = jest.fn();

  const mockMutation = {
    mutate: mockMutate,
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: null,
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCreateCourseMutation.mockReturnValue(mockMutation as any);
  });

  it('renders all form fields correctly', () => {
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByLabelText(/Course ID/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Course Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Source Language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Target Language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Make this course public/i)).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const submitButton = screen.getByRole('button', { name: /Create Course/i });
    
    // Try to submit without filling required fields
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Course ID is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Course name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Source language is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Target language is required/i)).toBeInTheDocument();
    });
  });

  it('validates course ID format', async () => {
    const user = userEvent.setup();
    
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const courseIdInput = screen.getByLabelText(/Course ID/i);
    
    // Test invalid characters
    await user.type(courseIdInput, 'invalid ID with spaces');
    
    await waitFor(() => {
      expect(screen.getByText(/Course ID can only contain letters, numbers, and hyphens/i)).toBeInTheDocument();
    });
  });

  it('validates course ID length', async () => {
    const user = userEvent.setup();
    
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const courseIdInput = screen.getByLabelText(/Course ID/i);
    
    // Test too long ID
    await user.type(courseIdInput, 'this-is-a-very-long-course-id-that-exceeds-limit');
    
    await waitFor(() => {
      expect(screen.getByText(/Course ID must be 20 characters or less/i)).toBeInTheDocument();
    });
  });

  it('validates course name length', async () => {
    const user = userEvent.setup();
    
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const courseNameInput = screen.getByLabelText(/Course Name/i);
    
    // Test too long name
    const longName = 'A'.repeat(101);
    await user.type(courseNameInput, longName);
    
    await waitFor(() => {
      expect(screen.getByText(/Course name must be 100 characters or less/i)).toBeInTheDocument();
    });
  });

  it('validates language codes format', async () => {
    const user = userEvent.setup();
    
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const sourceLanguageInput = screen.getByLabelText(/Source Language/i);
    
    // Test invalid language code
    await user.type(sourceLanguageInput, 'invalid-lang-code');
    
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid BCP 47 language code/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    // Fill in all required fields
    await user.type(screen.getByLabelText(/Course ID/i), 'test-course');
    await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
    await user.type(screen.getByLabelText(/Source Language/i), 'en');
    await user.type(screen.getByLabelText(/Target Language/i), 'es');
    await user.type(screen.getByLabelText(/Description/i), 'Test description');

    const submitButton = screen.getByRole('button', { name: /Create Course/i });
    await user.click(submitButton);

    expect(mockMutate).toHaveBeenCalledWith(
      {
        id: 'test-course',
        name: 'Test Course',
        source_language: 'en',
        target_language: 'es',
        description: 'Test description',
        is_public: true,
      },
      expect.any(Object)
    );
  });

  it('handles successful form submission', async () => {
    const user = userEvent.setup();
    const mockCourse = { id: 'test-course', name: 'Test Course' };
    
    // Mock successful mutation
    const successMutation = {
      ...mockMutation,
      mutate: jest.fn((_data, options) => {
        options.onSuccess(mockCourse);
      }),
    };
    mockUseCreateCourseMutation.mockReturnValue(successMutation as any);
    
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    // Fill and submit form
    await user.type(screen.getByLabelText(/Course ID/i), 'test-course');
    await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
    await user.type(screen.getByLabelText(/Source Language/i), 'en');
    await user.type(screen.getByLabelText(/Target Language/i), 'es');

    const submitButton = screen.getByRole('button', { name: /Create Course/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Course created successfully!/i)).toBeInTheDocument();
      expect(mockOnSuccess).toHaveBeenCalledWith(mockCourse);
    });
  });

  it('handles form submission errors', async () => {
    const user = userEvent.setup();
    const mockError = { response: { status: 409 } };
    
    // Mock error mutation
    const errorMutation = {
      ...mockMutation,
      mutate: jest.fn((_data, options) => {
        options.onError(mockError);
      }),
    };
    mockUseCreateCourseMutation.mockReturnValue(errorMutation as any);
    
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    // Fill and submit form
    await user.type(screen.getByLabelText(/Course ID/i), 'test-course');
    await user.type(screen.getByLabelText(/Course Name/i), 'Test Course');
    await user.type(screen.getByLabelText(/Source Language/i), 'en');
    await user.type(screen.getByLabelText(/Target Language/i), 'es');

    const submitButton = screen.getByRole('button', { name: /Create Course/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/A course with this ID already exists/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', () => {
    const loadingMutation = {
      ...mockMutation,
      isPending: true,
    };
    mockUseCreateCourseMutation.mockReturnValue(loadingMutation as any);
    
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByText(/Creating Course.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Creating Course.../i })).toBeDisabled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('toggles public/private checkbox correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const publicCheckbox = screen.getByLabelText(/Make this course public/i);
    
    // Should be checked by default
    expect(publicCheckbox).toBeChecked();
    
    // Uncheck it
    await user.click(publicCheckbox);
    expect(publicCheckbox).not.toBeChecked();
    
    // Check it again
    await user.click(publicCheckbox);
    expect(publicCheckbox).toBeChecked();
  });

  it('shows character count for description field', async () => {
    const user = userEvent.setup();
    
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const descriptionField = screen.getByLabelText(/Description/i);
    await user.type(descriptionField, 'Test description');

    expect(screen.getByText(/16 \/ 255/)).toBeInTheDocument();
  });

  it('validates description length', async () => {
    const user = userEvent.setup();
    
    render(
      <CourseForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const descriptionField = screen.getByLabelText(/Description/i);
    const longDescription = 'A'.repeat(256);
    await user.type(descriptionField, longDescription);

    await waitFor(() => {
      expect(screen.getByText(/Description must be 255 characters or less/i)).toBeInTheDocument();
    });
  });
});