import { screen, fireEvent } from '@testing-library/react';
import { render, mockAuthContextValues } from '../../../__tests__/utils/test-utils';
import { CourseCard } from '../CourseCard';
import { Course } from '../../../utils/types';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

const mockCourse: Course = {
  id: 'test-course-1',
  name: 'Test Spanish Course',
  sourceLanguage: 'en',
  targetLanguage: 'es',
  description: 'A comprehensive Spanish learning course',
  isPublic: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('CourseCard', () => {
  const mockOnSelect = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnView = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm for delete tests
    global.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders course information correctly', () => {
    render(
      <CourseCard course={mockCourse} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByText('Test Spanish Course')).toBeInTheDocument();
    expect(screen.getByText(/English.*→.*Spanish/)).toBeInTheDocument();
    expect(screen.getByText('Public')).toBeInTheDocument();
    expect(screen.getByText('A comprehensive Spanish learning course')).toBeInTheDocument();
    expect(screen.getByText('ID: test-course-1')).toBeInTheDocument();
    expect(screen.getByText(/Created: \d{1,2}\/\d{1,2}\/\d{4}/)).toBeInTheDocument();
  });

  it('renders private course correctly', () => {
    const privateCourse = { ...mockCourse, isPublic: false };
    render(
      <CourseCard course={privateCourse} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('shows selection checkbox when showSelection is true', () => {
    render(
      <CourseCard 
        course={mockCourse} 
        showSelection={true}
        onSelect={mockOnSelect}
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('shows selected state when isSelected is true', () => {
    render(
      <CourseCard 
        course={mockCourse} 
        showSelection={true}
        isSelected={true}
        onSelect={mockOnSelect}
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onSelect when checkbox is clicked', () => {
    render(
      <CourseCard 
        course={mockCourse} 
        showSelection={true}
        onSelect={mockOnSelect}
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnSelect).toHaveBeenCalledWith(mockCourse);
  });

  it('calls onView when view button is clicked', () => {
    render(
      <CourseCard 
        course={mockCourse} 
        onView={mockOnView}
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const viewButton = screen.getByTitle('View');
    fireEvent.click(viewButton);

    expect(mockOnView).toHaveBeenCalledWith(mockCourse);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <CourseCard 
        course={mockCourse} 
        onEdit={mockOnEdit}
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const editButton = screen.getByTitle('Edit');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCourse);
  });

  it('calls onDelete when delete button is clicked and confirmed', () => {
    render(
      <CourseCard 
        course={mockCourse} 
        onDelete={mockOnDelete}
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockOnDelete).toHaveBeenCalledWith(mockCourse);
  });

  it('does not call onDelete when delete is cancelled', () => {
    global.confirm = jest.fn(() => false);

    render(
      <CourseCard 
        course={mockCourse} 
        onDelete={mockOnDelete}
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const deleteButton = screen.getByTitle('Delete');
    fireEvent.click(deleteButton);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('hides actions when showActions is false', () => {
    render(
      <CourseCard 
        course={mockCourse} 
        showActions={false}
        onView={mockOnView}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.queryByTitle('View')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
  });

  it('calls onView when card is clicked and onView is provided', () => {
    render(
      <CourseCard 
        course={mockCourse} 
        onView={mockOnView}
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const card = screen.getByText('Test Spanish Course').closest('.course-card');
    fireEvent.click(card!);

    expect(mockOnView).toHaveBeenCalledWith(mockCourse);
  });

  it('calls onSelect when card is clicked with showSelection enabled', () => {
    render(
      <CourseCard 
        course={mockCourse} 
        showSelection={true}
        onSelect={mockOnSelect}
      />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const card = screen.getByText('Test Spanish Course').closest('.course-card');
    fireEvent.click(card!);

    expect(mockOnSelect).toHaveBeenCalledWith(mockCourse);
  });

  it('renders manage content link correctly', () => {
    render(
      <CourseCard course={mockCourse} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const manageLink = screen.getByText('Manage Content');
    expect(manageLink).toBeInTheDocument();
    expect(manageLink.closest('a')).toHaveAttribute('href', '/courses/test-course-1');
  });

  it('handles course without description', () => {
    const { description, ...courseWithoutDescription } = mockCourse;
    render(
      <CourseCard course={courseWithoutDescription as Course} />,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    expect(screen.getByText('Test Spanish Course')).toBeInTheDocument();
    expect(screen.queryByText('A comprehensive Spanish learning course')).not.toBeInTheDocument();
  });

  it('stops event propagation when action buttons are clicked', () => {
    const mockCardClick = jest.fn();
    
    render(
      <div onClick={mockCardClick}>
        <CourseCard 
          course={mockCourse} 
          onEdit={mockOnEdit}
          onView={mockOnView}
        />
      </div>,
      { authContextValue: mockAuthContextValues.authenticated }
    );

    const editButton = screen.getByTitle('Edit');
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockCourse);
    expect(mockCardClick).not.toHaveBeenCalled();
  });
});