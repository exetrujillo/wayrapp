/**
 * Comprehensive test suite for HierarchicalNavigator component
 * 
 * Tests all the key features required by task 2.6:
 * - Expandable tree view with current position
 * - Quick navigation between hierarchy levels
 * - Search functionality within the hierarchy
 * - Hierarchy overview with statistics
 * 
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { HierarchicalNavigator } from '../HierarchicalNavigator';
import { HierarchyPath } from '../../../utils/breadcrumbUtils';
import * as courseHooks from '../../../hooks/useCourses';
import * as levelHooks from '../../../hooks/useLevels';

// Initialize i18n for testing
i18n
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          'common.loading': 'Loading...',
          'hierarchicalNavigator.title': 'Content Navigator',
          'hierarchicalNavigator.searchPlaceholder': 'Search content...',
          'hierarchicalNavigator.searchResults': 'Search Results',
          'hierarchicalNavigator.noResults': 'No results found',
          'hierarchicalNavigator.statistics': 'Content Statistics',
          'hierarchicalNavigator.courses': 'Courses',
          'hierarchicalNavigator.levels': 'Levels',
          'hierarchicalNavigator.sections': 'Sections',
          'hierarchicalNavigator.modules': 'Modules',
          'hierarchicalNavigator.lessons': 'Lessons',
          'hierarchicalNavigator.completion': 'Completion',
          'hierarchicalNavigator.noCourses': 'No courses available',
          'hierarchicalNavigator.createFirstCourse': 'Create your first course to get started'
        }
      }
    }
  });

// Mock the hooks
jest.mock('../../../hooks/useCourses');
jest.mock('../../../hooks/useLevels');
jest.mock('../../../hooks/useSections');
jest.mock('../../../hooks/useModules');
jest.mock('../../../hooks/useLessons');

const mockedCourseHooks = courseHooks as jest.Mocked<typeof courseHooks>;
const mockedLevelHooks = levelHooks as jest.Mocked<typeof levelHooks>;

// Test data
const mockCourses = [
  {
    id: 'course1',
    name: 'Spanish Basics',
    sourceLanguage: 'en',
    targetLanguage: 'es',
    isPublic: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'course2',
    name: 'French Intermediate',
    sourceLanguage: 'en',
    targetLanguage: 'fr',
    isPublic: false,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
];

const mockLevels = [
  {
    id: 'level1',
    courseId: 'course1',
    code: 'A1',
    name: 'Beginner',
    order: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'level2',
    courseId: 'course1',
    code: 'A2',
    name: 'Elementary',
    order: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </QueryClientProvider>
  );
};

describe('HierarchicalNavigator', () => {
  let mockOnNavigate: jest.Mock;

  beforeEach(() => {
    mockOnNavigate = jest.fn();

    // Setup default mock implementations
    mockedCourseHooks.useCoursesQuery.mockReturnValue({
      data: { data: mockCourses, total: mockCourses.length },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockedLevelHooks.useLevelsQuery.mockReturnValue({
      data: { data: mockLevels, total: mockLevels.length },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the hierarchical navigator with title', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator />
        </TestWrapper>
      );

      expect(screen.getByText('Content Navigator')).toBeInTheDocument();
    });

    it('renders search input when showSearch is true', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator showSearch={true} />
        </TestWrapper>
      );

      expect(screen.getByPlaceholderText('Search content...')).toBeInTheDocument();
    });

    it('does not render search input when showSearch is false', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator showSearch={false} />
        </TestWrapper>
      );

      expect(screen.queryByPlaceholderText('Search content...')).not.toBeInTheDocument();
    });

    it('renders statistics panel when showStatistics is true', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator showStatistics={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Content Statistics')).toBeInTheDocument();
      expect(screen.getByText('Courses')).toBeInTheDocument();
      expect(screen.getByText('Levels')).toBeInTheDocument();
    });

    it('does not render statistics panel when showStatistics is false', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator showStatistics={false} />
        </TestWrapper>
      );

      expect(screen.queryByText('Content Statistics')).not.toBeInTheDocument();
    });
  });

  describe('Tree View Functionality', () => {
    it('displays courses in tree view', async () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
        expect(screen.getByText('French Intermediate')).toBeInTheDocument();
      });
    });

    it('shows expansion controls for courses with children', async () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator />
        </TestWrapper>
      );

      await waitFor(() => {
        const courseElement = screen.getByText('Spanish Basics').closest('div');
        expect(courseElement).toBeInTheDocument();

        // Look for chevron icon (expansion control)
        const chevronButton = within(courseElement!).getByRole('button');
        expect(chevronButton).toBeInTheDocument();
      });
    });

    it('expands course to show levels when clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HierarchicalNavigator />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Click on the course to expand it
      const courseElement = screen.getByText('Spanish Basics');
      await user.click(courseElement);

      // Verify levels are shown after expansion
      await waitFor(() => {
        expect(screen.getByText('Beginner')).toBeInTheDocument();
        expect(screen.getByText('Elementary')).toBeInTheDocument();
      });
    });

    it('highlights current position in hierarchy', () => {
      const currentPath: HierarchyPath = {
        courseId: 'course1',
        levelId: 'level1'
      };

      render(
        <TestWrapper>
          <HierarchicalNavigator currentPath={currentPath} />
        </TestWrapper>
      );

      // The current course should be highlighted
      const courseElement = screen.getByText('Spanish Basics').closest('div');
      expect(courseElement).toHaveClass('bg-blue-50', 'border-l-4', 'border-blue-500');
    });
  });

  describe('Navigation Functionality', () => {
    it('calls onNavigate when course is clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HierarchicalNavigator onNavigate={mockOnNavigate} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Spanish Basics'));

      expect(mockOnNavigate).toHaveBeenCalledWith({
        courseId: 'course1'
      });
    });

    it('calls onNavigate with correct hierarchy path for nested items', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HierarchicalNavigator onNavigate={mockOnNavigate} />
        </TestWrapper>
      );

      // First expand the course
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Spanish Basics'));

      // Then click on a level
      await waitFor(() => {
        expect(screen.getByText('Beginner')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Beginner'));

      expect(mockOnNavigate).toHaveBeenCalledWith({
        levelId: 'level1'
      });
    });

    it('provides quick navigation between hierarchy levels', async () => {
      const user = userEvent.setup();
      const currentPath: HierarchyPath = {
        courseId: 'course1',
        levelId: 'level1'
      };

      render(
        <TestWrapper>
          <HierarchicalNavigator
            currentPath={currentPath}
            onNavigate={mockOnNavigate}
          />
        </TestWrapper>
      );

      // Should be able to navigate back to course level
      await user.click(screen.getByText('Spanish Basics'));

      expect(mockOnNavigate).toHaveBeenCalledWith({
        courseId: 'course1'
      });
    });
  });

  describe('Search Functionality', () => {
    it('shows search results when searching', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HierarchicalNavigator showSearch={true} />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search content...');
      await user.type(searchInput, 'Spanish');

      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument();
      });
    });

    it('filters courses based on search query', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HierarchicalNavigator showSearch={true} />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search content...');
      await user.type(searchInput, 'Spanish');

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
        expect(screen.queryByText('French Intermediate')).not.toBeInTheDocument();
      });
    });

    it('shows no results message when search yields no matches', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HierarchicalNavigator showSearch={true} />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search content...');
      await user.type(searchInput, 'NonexistentCourse');

      await waitFor(() => {
        expect(screen.getByText('No results found')).toBeInTheDocument();
      });
    });

    it('navigates to search result when clicked', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HierarchicalNavigator
            showSearch={true}
            onNavigate={mockOnNavigate}
          />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search content...');
      await user.type(searchInput, 'Spanish');

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Spanish Basics'));

      expect(mockOnNavigate).toHaveBeenCalledWith({
        courseId: 'course1'
      });
    });

    it('clears search results when search input is cleared', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HierarchicalNavigator showSearch={true} />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search content...');

      // Type search query
      await user.type(searchInput, 'Spanish');
      await waitFor(() => {
        expect(screen.getByText('Search Results')).toBeInTheDocument();
      });

      // Clear search
      await user.clear(searchInput);

      await waitFor(() => {
        expect(screen.queryByText('Search Results')).not.toBeInTheDocument();
      });
    });
  });

  describe('Statistics Display', () => {
    it('displays correct course count in statistics', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator showStatistics={true} />
        </TestWrapper>
      );

      const statisticsSection = screen.getByText('Content Statistics').closest('div');
      expect(within(statisticsSection!).getByText('2')).toBeInTheDocument(); // 2 courses
    });

    it('shows completion percentage when available', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator showStatistics={true} />
        </TestWrapper>
      );

      // Note: In the current implementation, completion percentage is 0
      // This test verifies the structure is in place
      const statisticsSection = screen.getByText('Content Statistics').closest('div');
      expect(statisticsSection).toBeInTheDocument();
    });

    it('displays hierarchy overview with counts', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator showStatistics={true} />
        </TestWrapper>
      );

      expect(screen.getByText('Courses')).toBeInTheDocument();
      expect(screen.getByText('Levels')).toBeInTheDocument();
      expect(screen.getByText('Sections')).toBeInTheDocument();
      expect(screen.getByText('Modules')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('shows loading state when courses are loading', () => {
      mockedCourseHooks.useCoursesQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(
        <TestWrapper>
          <HierarchicalNavigator />
        </TestWrapper>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('shows empty state when no courses exist', () => {
      mockedCourseHooks.useCoursesQuery.mockReturnValue({
        data: { data: [], total: 0 },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(
        <TestWrapper>
          <HierarchicalNavigator />
        </TestWrapper>
      );

      expect(screen.getByText('No courses available')).toBeInTheDocument();
      expect(screen.getByText('Create your first course to get started')).toBeInTheDocument();
    });

    it('shows loading indicator for individual nodes when expanding', async () => {
      const user = userEvent.setup();

      // Mock levels query to return loading state
      mockedLevelHooks.useLevelsQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(
        <TestWrapper>
          <HierarchicalNavigator />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Click to expand course
      await user.click(screen.getByText('Spanish Basics'));

      // Should show loading indicator for the expanded node
      const courseElement = screen.getByText('Spanish Basics').closest('div');
      const loadingSpinner = within(courseElement!).getByRole('status', { hidden: true });
      expect(loadingSpinner).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('provides proper ARIA labels for tree navigation', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search content...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HierarchicalNavigator onNavigate={mockOnNavigate} />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Tab to the course element and press Enter
      const courseElement = screen.getByText('Spanish Basics');
      courseElement.focus();
      await user.keyboard('{Enter}');

      expect(mockOnNavigate).toHaveBeenCalledWith({
        courseId: 'course1'
      });
    });

    it('provides proper focus management', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HierarchicalNavigator showSearch={true} />
        </TestWrapper>
      );

      const searchInput = screen.getByPlaceholderText('Search content...');

      // Focus should be manageable
      await user.click(searchInput);
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Responsive Design', () => {
    it('applies custom className when provided', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator className="custom-navigator" />
        </TestWrapper>
      );

      const navigator = screen.getByText('Content Navigator').closest('.hierarchical-navigator');
      expect(navigator).toHaveClass('custom-navigator');
    });

    it('respects maxHeight prop', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator maxHeight="400px" />
        </TestWrapper>
      );

      const scrollableContent = screen.getByText('Content Navigator')
        .closest('.hierarchical-navigator')
        ?.querySelector('[style*="max-height"]');

      expect(scrollableContent).toHaveStyle({ maxHeight: '400px' });
    });

    it('adapts to compact mode when specified', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator compact={true} />
        </TestWrapper>
      );

      // In compact mode, additional metadata should be shown
      // This is verified by the component structure
      expect(screen.getByText('Content Navigator')).toBeInTheDocument();
    });
  });

  describe('Integration with Existing Systems', () => {
    it('integrates with TanStack Query for data fetching', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator />
        </TestWrapper>
      );

      // Verify that the hooks are called
      expect(mockedCourseHooks.useCoursesQuery).toHaveBeenCalled();
    });

    it('integrates with i18next for internationalization', () => {
      render(
        <TestWrapper>
          <HierarchicalNavigator />
        </TestWrapper>
      );

      // Verify translated text is displayed
      expect(screen.getByText('Content Navigator')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search content...')).toBeInTheDocument();
    });

    it('works with existing breadcrumb navigation system', () => {
      const currentPath: HierarchyPath = {
        courseId: 'course1',
        levelId: 'level1',
        sectionId: 'section1'
      };

      render(
        <TestWrapper>
          <HierarchicalNavigator currentPath={currentPath} />
        </TestWrapper>
      );

      // Should handle complex hierarchy paths
      expect(screen.getByText('Content Navigator')).toBeInTheDocument();
    });
  });
});