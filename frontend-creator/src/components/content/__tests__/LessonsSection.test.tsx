import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../__tests__/i18n';
import { LessonsSection } from '../LessonsSection';
import { Lesson } from '../../../utils/types';

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: any) => children,
  Droppable: ({ children }: any) => children({ 
    provided: { droppableProps: {}, innerRef: jest.fn(), placeholder: null }, 
    snapshot: { isDraggingOver: false } 
  }),
  Draggable: ({ children }: any) => children({ 
    provided: { draggableProps: {}, dragHandleProps: {}, innerRef: jest.fn() }, 
    snapshot: { isDragging: false } 
  }),
}));

// Mock hooks
jest.mock('../../../hooks/useLessons', () => ({
  useLessonsQuery: jest.fn(),
  useReorderLessonsMutation: jest.fn(),
}));

const mockLessons: Lesson[] = [
  {
    id: 'lesson-1',
    name: 'Lesson 1',
    description: 'First lesson description',
    moduleId: 'module-1',
    experiencePoints: 10,
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'lesson-2',
    name: 'Lesson 2',
    description: 'Second lesson description',
    moduleId: 'module-1',
    experiencePoints: 15,
    order: 2,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <I18nextProvider i18n={i18n}>
          {component}
        </I18nextProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('LessonsSection', () => {
  const mockProps = {
    moduleId: 'module-1',
    onLessonClick: jest.fn(),
    onCreateLesson: jest.fn(),
    onEditLesson: jest.fn(),
    onDeleteLesson: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    const { useLessonsQuery, useReorderLessonsMutation } = require('../../../hooks/useLessons');
    
    useLessonsQuery.mockReturnValue({
      data: { data: mockLessons, total: 2 },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    useReorderLessonsMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('renders lessons section with lessons', () => {
    renderWithProviders(<LessonsSection {...mockProps} />);

    expect(screen.getByText('Module Lessons')).toBeInTheDocument();
    expect(screen.getByText('Add Lesson')).toBeInTheDocument();
    expect(screen.getByText('Lesson #1')).toBeInTheDocument();
    expect(screen.getByText('Lesson #2')).toBeInTheDocument();
  });

  it('renders empty state when no lessons', () => {
    const { useLessonsQuery } = require('../../../hooks/useLessons');
    useLessonsQuery.mockReturnValue({
      data: { data: [], total: 0 },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<LessonsSection {...mockProps} />);

    expect(screen.getByText('No lessons found. Create your first lesson!')).toBeInTheDocument();
    expect(screen.getByText('Create First Lesson')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const { useLessonsQuery } = require('../../../hooks/useLessons');
    useLessonsQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<LessonsSection {...mockProps} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const { useLessonsQuery } = require('../../../hooks/useLessons');
    useLessonsQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'Failed to load lessons' },
      refetch: jest.fn(),
    });

    renderWithProviders(<LessonsSection {...mockProps} />);

    expect(screen.getByText('Failed to load lessons')).toBeInTheDocument();
  });

  it('calls onCreateLesson when add lesson button is clicked', () => {
    renderWithProviders(<LessonsSection {...mockProps} />);

    fireEvent.click(screen.getByText('Add Lesson'));
    expect(mockProps.onCreateLesson).toHaveBeenCalledTimes(1);
  });

  it('calls onLessonClick when lesson view button is clicked', () => {
    renderWithProviders(<LessonsSection {...mockProps} />);

    const viewButtons = screen.getAllByTitle('View');
    fireEvent.click(viewButtons[0]);
    expect(mockProps.onLessonClick).toHaveBeenCalledWith('lesson-1');
  });

  it('opens preview modal when preview button is clicked', async () => {
    renderWithProviders(<LessonsSection {...mockProps} />);

    const previewButtons = screen.getAllByTitle('Preview');
    fireEvent.click(previewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Lesson Preview')).toBeInTheDocument();
    });
  });

  it('calls onEditLesson when edit button is clicked', () => {
    renderWithProviders(<LessonsSection {...mockProps} />);

    const editButtons = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons[0]);
    expect(mockProps.onEditLesson).toHaveBeenCalledWith(mockLessons[0]);
  });

  it('calls onDeleteLesson when delete button is clicked', () => {
    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = jest.fn().mockReturnValue(true);

    renderWithProviders(<LessonsSection {...mockProps} />);

    const deleteButtons = screen.getAllByTitle('Delete');
    fireEvent.click(deleteButtons[0]);
    expect(mockProps.onDeleteLesson).toHaveBeenCalledWith(mockLessons[0]);

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('renders drag handles when drag and drop is enabled', () => {
    renderWithProviders(<LessonsSection {...mockProps} enableDragDrop={true} />);

    const dragHandles = screen.getAllByTitle('Drag to reorder');
    expect(dragHandles).toHaveLength(2);
  });

  it('does not render drag handles when drag and drop is disabled', () => {
    renderWithProviders(<LessonsSection {...mockProps} enableDragDrop={false} />);

    const dragHandles = screen.queryAllByTitle('Drag to reorder');
    expect(dragHandles).toHaveLength(0);
  });

  it('displays lesson experience points correctly', () => {
    renderWithProviders(<LessonsSection {...mockProps} />);

    expect(screen.getByText('XP: 10')).toBeInTheDocument();
    expect(screen.getByText('XP: 15')).toBeInTheDocument();
  });

  it('displays lesson order correctly', () => {
    renderWithProviders(<LessonsSection {...mockProps} />);

    expect(screen.getByText('Order: 1')).toBeInTheDocument();
    expect(screen.getByText('Order: 2')).toBeInTheDocument();
  });
});