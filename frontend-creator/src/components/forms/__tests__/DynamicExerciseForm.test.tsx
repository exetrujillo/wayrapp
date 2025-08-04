/**
 * DynamicExerciseForm Component Tests
 * 
 * @module DynamicExerciseFormTests
 * @category Tests
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DynamicExerciseForm } from '../DynamicExerciseForm';
import { Exercise } from '../../../utils/types';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

// Mock the UI components
jest.mock('../../ui/Button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('../../ui/Card', () => ({
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

jest.mock('../../ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size, className }: any) => (
    <div className={className} data-testid="loading-spinner">
      Loading {size}
    </div>
  ),
}));

describe('DynamicExerciseForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onSuccess: mockOnSuccess,
    onCancel: mockOnCancel,
    onError: mockOnError,
  };

  it('renders the form with default exercise type', () => {
    render(<DynamicExerciseForm {...defaultProps} />);
    
    expect(screen.getByRole('heading', { name: /Create Exercise/ })).toBeInTheDocument();
    const exerciseTypeSelect = screen.getByLabelText(/Exercise Type/);
    expect(exerciseTypeSelect).toBeInTheDocument();
    expect(exerciseTypeSelect).toHaveValue('translation');
  });

  it('renders edit mode when initialData is provided', () => {
    const initialData: Exercise = {
      id: 'test-exercise',
      exerciseType: 'translation',
      data: {
        source_text: 'Hello',
        target_text: 'Hola',
        hints: [],
      },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    render(<DynamicExerciseForm {...defaultProps} initialData={initialData} />);
    
    expect(screen.getByText('Edit Exercise')).toBeInTheDocument();
  });

  it('changes exercise type when selected', async () => {
    render(<DynamicExerciseForm {...defaultProps} />);
    
    const typeSelect = screen.getByLabelText(/Exercise Type/);
    fireEvent.change(typeSelect, { target: { value: 'vof' } });
    
    await waitFor(() => {
      expect(typeSelect).toHaveValue('vof');
    });
  });

  it('shows preview when preview button is clicked', async () => {
    render(<DynamicExerciseForm {...defaultProps} enablePreview={true} />);
    
    const previewButton = screen.getByText('Show Preview');
    fireEvent.click(previewButton);
    
    await waitFor(() => {
      expect(screen.getByText('Live Preview')).toBeInTheDocument();
      expect(screen.getByText('Hide Preview')).toBeInTheDocument();
    });
  });

  it('calls onSubmit when form is submitted', async () => {
    const mockExercise: Exercise = {
      id: 'new-exercise',
      exerciseType: 'translation',
      data: { source_text: 'Test', target_text: 'Prueba' },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    mockOnSubmit.mockResolvedValue(mockExercise);

    render(<DynamicExerciseForm {...defaultProps} />);
    
    // Fill in some basic data
    const sourceTextInput = screen.getByPlaceholderText(/Enter text in source language/);
    const targetTextInput = screen.getByPlaceholderText(/Enter expected translation/);
    
    fireEvent.change(sourceTextInput, { target: { value: 'Hello' } });
    fireEvent.change(targetTextInput, { target: { value: 'Hola' } });
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /Create Exercise/ });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        exerciseType: 'translation',
        data: {
          source_text: 'Hello',
          target_text: 'Hola',
          hints: [],
        },
      });
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(<DynamicExerciseForm {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('shows unsaved changes indicator when data is modified', async () => {
    render(<DynamicExerciseForm {...defaultProps} />);
    
    const sourceTextInput = screen.getByPlaceholderText(/Enter text in source language/);
    fireEvent.change(sourceTextInput, { target: { value: 'Hello' } });
    
    await waitFor(() => {
      expect(screen.getByText('You have unsaved changes')).toBeInTheDocument();
    });
  });

  it('disables exercise type selection in edit mode', () => {
    const initialData: Exercise = {
      id: 'test-exercise',
      exerciseType: 'translation',
      data: { source_text: 'Hello', target_text: 'Hola' },
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z',
    };

    render(<DynamicExerciseForm {...defaultProps} initialData={initialData} />);
    
    const typeSelect = screen.getByLabelText(/Exercise Type/);
    expect(typeSelect).toBeDisabled();
  });

  it('renders different form components based on exercise type', async () => {
    render(<DynamicExerciseForm {...defaultProps} />);
    
    // Start with translation
    expect(screen.getByPlaceholderText(/Enter text in source language/)).toBeInTheDocument();
    
    // Change to VOF
    const typeSelect = screen.getByLabelText(/Exercise Type/);
    fireEvent.change(typeSelect, { target: { value: 'vof' } });
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Enter the statement to be evaluated/)).toBeInTheDocument();
    });
  });
});