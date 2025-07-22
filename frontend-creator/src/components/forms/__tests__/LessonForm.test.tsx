import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LessonForm } from '../LessonForm';
import { moduleService } from '../../../services/moduleService';
import { lessonService } from '../../../services/lessonService';

// Mock the services
jest.mock('../../../services/moduleService', () => ({
  moduleService: {
    getModules: jest.fn(),
  },
}));

jest.mock('../../../services/lessonService', () => ({
  lessonService: {
    createLesson: jest.fn(),
  },
}));

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

describe('LessonForm', () => {
  const mockModules = {
    data: [
      { id: 'module-1', name: 'Module 1' },
      { id: 'module-2', name: 'Module 2' },
    ],
    meta: {
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    },
  };

  const mockLesson = {
    id: 'lesson-1',
    name: 'Test Lesson',
    experience_points: 15,
    order: 1,
    moduleId: 'module-1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (moduleService.getModules as jest.Mock).mockResolvedValue(mockModules);
    (lessonService.createLesson as jest.Mock).mockResolvedValue(mockLesson);
  });

  it('renders the form correctly', async () => {
    render(<LessonForm />);
    
    // Wait for modules to load
    await waitFor(() => {
      expect(moduleService.getModules).toHaveBeenCalled();
    });
    
    // Check if form elements are rendered
    expect(screen.getByLabelText(/Lesson Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Module/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Experience Points/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Order/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Lesson/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<LessonForm />);
    
    // Wait for modules to load
    await waitFor(() => {
      expect(moduleService.getModules).toHaveBeenCalled();
    });
    
    // Submit the form without filling required fields
    fireEvent.click(screen.getByText('Create Lesson'));
    
    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/Lesson name must be at least 3 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/Module ID is required/i)).toBeInTheDocument();
    });
  });

  it('submits the form with valid data', async () => {
    const onSuccessMock = jest.fn();
    render(<LessonForm onSuccess={onSuccessMock} />);
    
    // Wait for modules to load
    await waitFor(() => {
      expect(moduleService.getModules).toHaveBeenCalled();
    });
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/Lesson Name/i), {
      target: { value: 'Test Lesson' },
    });
    
    fireEvent.change(screen.getByLabelText(/Module/i), {
      target: { value: 'module-1' },
    });
    
    fireEvent.change(screen.getByLabelText(/Experience Points/i), {
      target: { value: '15' },
    });
    
    fireEvent.change(screen.getByLabelText(/Order/i), {
      target: { value: '1' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Lesson'));
    
    // Check if the service was called with correct data
    await waitFor(() => {
      expect(lessonService.createLesson).toHaveBeenCalledWith('module-1', {
        name: 'Test Lesson',
        experience_points: 15,
        order: 1,
        moduleId: 'module-1',
      });
      expect(onSuccessMock).toHaveBeenCalledWith(mockLesson);
    });
  });

  it('handles API errors', async () => {
    const errorMessage = 'Failed to create lesson';
    (lessonService.createLesson as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    render(<LessonForm />);
    
    // Wait for modules to load
    await waitFor(() => {
      expect(moduleService.getModules).toHaveBeenCalled();
    });
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/Lesson Name/i), {
      target: { value: 'Test Lesson' },
    });
    
    fireEvent.change(screen.getByLabelText(/Module/i), {
      target: { value: 'module-1' },
    });
    
    fireEvent.change(screen.getByLabelText(/Experience Points/i), {
      target: { value: '15' },
    });
    
    fireEvent.change(screen.getByLabelText(/Order/i), {
      target: { value: '1' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Create Lesson'));
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('handles module loading errors', async () => {
    const errorMessage = 'Failed to load modules';
    (moduleService.getModules as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    render(<LessonForm />);
    
    // Check if error message is displayed
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});