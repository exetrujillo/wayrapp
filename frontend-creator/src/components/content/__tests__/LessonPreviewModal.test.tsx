import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../__tests__/i18n';
import { LessonPreviewModal } from '../LessonPreviewModal';
import { Lesson } from '../../../utils/types';

const mockLesson: Lesson = {
  id: 'lesson-1',
  moduleId: 'module-1',
  experiencePoints: 25,
  order: 3,
  createdAt: '2024-01-01T10:00:00Z',
  updatedAt: '2024-01-02T15:30:00Z',
};

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </BrowserRouter>
  );
};

describe('LessonPreviewModal', () => {
  const mockProps = {
    lesson: mockLesson,
    isOpen: true,
    onClose: jest.fn(),
    onEdit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders lesson preview modal when open', () => {
    renderWithProviders(<LessonPreviewModal {...mockProps} />);

    expect(screen.getByText('Lesson Preview')).toBeInTheDocument();
    expect(screen.getByText('Lesson #3')).toBeInTheDocument();
    expect(screen.getByText('25 XP')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    renderWithProviders(<LessonPreviewModal {...mockProps} isOpen={false} />);

    expect(screen.queryByText('Lesson Preview')).not.toBeInTheDocument();
  });

  it('does not render when lesson is null', () => {
    renderWithProviders(<LessonPreviewModal {...mockProps} lesson={null} />);

    expect(screen.queryByText('Lesson Preview')).not.toBeInTheDocument();
  });

  it('displays lesson basic information correctly', () => {
    renderWithProviders(<LessonPreviewModal {...mockProps} />);

    expect(screen.getByText('lesson-1')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
    expect(screen.getByText('25 XP')).toBeInTheDocument();
    expect(screen.getByText('module-1')).toBeInTheDocument();
  });

  it('displays lesson metadata correctly', () => {
    renderWithProviders(<LessonPreviewModal {...mockProps} />);

    // Check for formatted dates (will depend on locale)
    expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument(); // Created date
    expect(screen.getByText(/1\/2\/2024/)).toBeInTheDocument(); // Updated date
  });

  it('calls onClose when close button is clicked', () => {
    renderWithProviders(<LessonPreviewModal {...mockProps} />);

    fireEvent.click(screen.getByText('Close'));
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit and onClose when edit button is clicked', () => {
    renderWithProviders(<LessonPreviewModal {...mockProps} />);

    fireEvent.click(screen.getByText('Edit'));
    expect(mockProps.onEdit).toHaveBeenCalledWith(mockLesson);
    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render edit button when onEdit is not provided', () => {
    renderWithProviders(
      <LessonPreviewModal
        lesson={mockLesson}
        isOpen={true}
        onClose={mockProps.onClose}
      />
    );

    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('displays lesson ID in monospace font', () => {
    renderWithProviders(<LessonPreviewModal {...mockProps} />);

    const lessonIdElements = screen.getAllByText('lesson-1');
    // Find the one in the basic info section (should have font-mono class)
    const basicInfoLessonId = lessonIdElements.find(el => 
      el.classList.contains('font-mono')
    );
    expect(basicInfoLessonId).toBeInTheDocument();
  });

  it('displays module ID in monospace font', () => {
    renderWithProviders(<LessonPreviewModal {...mockProps} />);

    const moduleIdElements = screen.getAllByText('module-1');
    // Find the one in the metadata section (should have font-mono class)
    const metadataModuleId = moduleIdElements.find(el => 
      el.classList.contains('font-mono')
    );
    expect(metadataModuleId).toBeInTheDocument();
  });

  it('has proper modal structure with cards', () => {
    renderWithProviders(<LessonPreviewModal {...mockProps} />);

    expect(screen.getByText('Basic Information')).toBeInTheDocument();
    expect(screen.getByText('Metadata')).toBeInTheDocument();
  });

  it('displays experience points with primary color styling', () => {
    renderWithProviders(<LessonPreviewModal {...mockProps} />);

    const xpElement = screen.getByText('25 XP');
    expect(xpElement).toHaveClass('text-primary-600');
  });
});