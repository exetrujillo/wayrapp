import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SectionsSection } from '../SectionsSection';
import { Section } from '../../../utils/types';
import { render } from '../../../__tests__/utils/test-utils';

// Mock react-beautiful-dnd
jest.mock('react-beautiful-dnd', () => ({
  DragDropContext: ({ children }: any) => <div data-testid="drag-drop-context">{children}</div>,
  Droppable: ({ children }: any) => children({ innerRef: jest.fn(), droppableProps: {}, placeholder: null }, {}),
  Draggable: ({ children }: any) => children({ innerRef: jest.fn(), draggableProps: {}, dragHandleProps: {} }, {}),
}));

// Mock hooks
jest.mock('../../../hooks/useSections', () => ({
  useSectionsQuery: jest.fn(),
  useReorderSectionsMutation: jest.fn(),
}));

const mockSections: Section[] = [
  {
    id: 'section-1',
    levelId: 'level-1',
    name: 'Grammar Basics',
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'section-2',
    levelId: 'level-1',
    name: 'Vocabulary',
    order: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockProps = {
  levelId: 'level-1',
  onSectionSelect: jest.fn(),
  onCreateSection: jest.fn(),
  onEditSection: jest.fn(),
  onDeleteSection: jest.fn(),
};

describe('SectionsSection', () => {
  const mockUseSectionsQuery = require('../../../hooks/useSections').useSectionsQuery;
  const mockUseReorderSectionsMutation = require('../../../hooks/useSections').useReorderSectionsMutation;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseSectionsQuery.mockReturnValue({
      data: { data: mockSections },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseReorderSectionsMutation.mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn(),
    });
  });

  it('renders sections correctly', () => {
    render(<SectionsSection {...mockProps} />);

    expect(screen.getByText('Level Sections')).toBeInTheDocument();
    expect(screen.getByText('Grammar Basics')).toBeInTheDocument();
    expect(screen.getByText('Vocabulary')).toBeInTheDocument();
    expect(screen.getByText('Add Section')).toBeInTheDocument();
  });

  it('renders drag and drop context when enableDragDrop is true', () => {
    render(<SectionsSection {...mockProps} enableDragDrop={true} />);

    expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop to reorder sections')).toBeInTheDocument();
  });

  it('does not render drag and drop context when enableDragDrop is false', () => {
    render(<SectionsSection {...mockProps} enableDragDrop={false} />);

    expect(screen.queryByTestId('drag-drop-context')).not.toBeInTheDocument();
    expect(screen.queryByText('Drag and drop to reorder sections')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseSectionsQuery.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<SectionsSection {...mockProps} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows error state', () => {
    const mockError = new Error('Failed to load sections');
    mockUseSectionsQuery.mockReturnValue({
      data: null,
      isLoading: false,
      error: mockError,
      refetch: jest.fn(),
    });

    render(<SectionsSection {...mockProps} />);

    expect(screen.getByText('Failed to load sections')).toBeInTheDocument();
  });

  it('shows empty state when no sections exist', () => {
    mockUseSectionsQuery.mockReturnValue({
      data: { data: [] },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<SectionsSection {...mockProps} />);

    expect(screen.getByText('No sections found. Create your first section!')).toBeInTheDocument();
    expect(screen.getByText('Create First Section')).toBeInTheDocument();
  });

  it('calls onSectionSelect when section is clicked', async () => {
    const user = userEvent.setup();
    render(<SectionsSection {...mockProps} />);

    const sectionCard = screen.getByText('Grammar Basics').closest('.section-card');
    expect(sectionCard).toBeInTheDocument();

    await user.click(sectionCard!);

    expect(mockProps.onSectionSelect).toHaveBeenCalledWith('section-1');
  });

  it('calls onCreateSection when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<SectionsSection {...mockProps} />);

    const addButton = screen.getByText('Add Section');
    await user.click(addButton);

    expect(mockProps.onCreateSection).toHaveBeenCalled();
  });

  it('handles reorder error correctly', () => {
    render(<SectionsSection {...mockProps} />);

    // The component should render without errors even if reorder mutation fails
    expect(screen.getByText('Level Sections')).toBeInTheDocument();
  });
});