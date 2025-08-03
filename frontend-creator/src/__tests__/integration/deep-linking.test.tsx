/**
 * Deep Linking and URL State Synchronization Tests
 * 
 * This test suite focuses on:
 * - Deep linking to specific course hierarchy levels
 * - URL parameter synchronization with component state
 * - Browser navigation (back/forward) support
 * - Bookmarkable URLs for specific contexts
 * - URL state persistence across page refreshes
 */

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockAuthContextValues } from '../utils/test-utils';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { User } from '../../utils/types';
import { courseService } from '../../services/courseService';
import { levelService } from '../../services/levelService';
import { sectionService } from '../../services/sectionService';
import { moduleService } from '../../services/moduleService';
import { lessonService } from '../../services/lessonService';

// Mock all services
jest.mock('../../services/courseService');
jest.mock('../../services/levelService');
jest.mock('../../services/sectionService');
jest.mock('../../services/moduleService');
jest.mock('../../services/lessonService');

const mockCourseService = courseService as jest.Mocked<typeof courseService>;
const mockLevelService = levelService as jest.Mocked<typeof levelService>;
const mockSectionService = sectionService as jest.Mocked<typeof sectionService>;
const mockModuleService = moduleService as jest.Mocked<typeof moduleService>;
const mockLessonService = lessonService as jest.Mocked<typeof lessonService>;

// Mock react-router-dom for navigation testing
const mockNavigate = jest.fn();
const mockLocation = {
  pathname: '/courses/spanish-basics',
  search: '',
  hash: '',
  state: null,
  key: 'default',
};

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => mockLocation,
}));

// Mock data
const mockCourse = {
  id: 'spanish-basics',
  name: 'Spanish Basics',
  sourceLanguage: 'en',
  targetLanguage: 'es',
  description: 'Learn basic Spanish vocabulary and grammar',
  isPublic: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockLevel = {
  id: 'level-a1',
  courseId: 'spanish-basics',
  code: 'A1',
  name: 'Beginner',
  order: 1,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockSection = {
  id: 'section-greetings',
  levelId: 'level-a1',
  name: 'Greetings',
  order: 1,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockModule = {
  id: 'module-basic-greetings',
  sectionId: 'section-greetings',
  moduleType: 'basic_lesson' as const,
  name: 'Basic Greetings',
  order: 1,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

const mockLesson = {
  id: 'lesson-hello',
  name: 'Hello Lesson',
  description: 'Learn basic greetings',
  moduleId: 'module-basic-greetings',
  experiencePoints: 10,
  order: 1,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

describe('Deep Linking and URL State Synchronization Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Setup default mock responses
    mockCourseService.getCourse.mockResolvedValue(mockCourse);
    mockLevelService.getLevelsByCourse.mockResolvedValue({
      data: [mockLevel],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    mockSectionService.getSectionsByLevel.mockResolvedValue({
      data: [mockSection],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    mockModuleService.getModulesBySection.mockResolvedValue({
      data: [mockModule],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    mockLessonService.getLessonsByModule.mockResolvedValue({
      data: [mockLesson],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  });

  describe('Direct Deep Link Navigation', () => {
    it('should handle direct navigation to course detail page', async () => {
      const initialEntries = ['/courses/spanish-basics'];

      render(
        <MemoryRouter initialEntries={initialEntries}>
          <App />
        </MemoryRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Verify course is loaded
      await waitFor(() => {
        expect(mockCourseService.getCourse).toHaveBeenCalledWith('spanish-basics');
      });

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Verify levels are loaded
      await waitFor(() => {
        expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledWith('spanish-basics', expect.any(Object));
      });

      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });
    });

    it('should handle deep links with level selection', async () => {
      const initialEntries = ['/courses/spanish-basics?level=level-a1'];

      render(
        <MemoryRouter initialEntries={initialEntries}>
          <App />
        </MemoryRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Verify course and level data are loaded
      await waitFor(() => {
        expect(mockCourseService.getCourse).toHaveBeenCalledWith('spanish-basics');
        expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledWith('spanish-basics', expect.any(Object));
      });

      // Verify sections are loaded for the selected level
      await waitFor(() => {
        expect(mockSectionService.getSectionsByLevel).toHaveBeenCalledWith('level-a1', expect.any(Object));
      });

      // Verify UI reflects the selected level
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
        expect(screen.getByText('Greetings')).toBeInTheDocument();
      });

      // Verify level is visually selected
      const levelCard = screen.getByText('A1 - Beginner').closest('[data-testid="level-card"]');
      expect(levelCard).toHaveClass('selected'); // Assuming selected class exists
    });

    it('should handle deep links with full hierarchy selection', async () => {
      const initialEntries = ['/courses/spanish-basics?level=level-a1&section=section-greetings&module=module-basic-greetings'];

      render(
        <MemoryRouter initialEntries={initialEntries}>
          <App />
        </MemoryRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Verify all hierarchical data is loaded
      await waitFor(() => {
        expect(mockCourseService.getCourse).toHaveBeenCalledWith('spanish-basics');
        expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledWith('spanish-basics', expect.any(Object));
        expect(mockSectionService.getSectionsByLevel).toHaveBeenCalledWith('level-a1', expect.any(Object));
        expect(mockModuleService.getModulesBySection).toHaveBeenCalledWith('section-greetings', expect.any(Object));
        expect(mockLessonService.getLessonsByModule).toHaveBeenCalledWith('module-basic-greetings', expect.any(Object));
      });

      // Verify UI reflects the full hierarchy selection
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
        expect(screen.getByText('Greetings')).toBeInTheDocument();
        expect(screen.getByText('Basic Greetings')).toBeInTheDocument();
        expect(screen.getByText('Lesson Hello')).toBeInTheDocument();
      });

      // Verify breadcrumb navigation reflects the selection
      const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
      expect(breadcrumb).toBeInTheDocument();

      const breadcrumbItems = within(breadcrumb).getAllByRole('listitem');
      expect(breadcrumbItems).toHaveLength(4); // Course > Level > Section > Module
    });

    it('should handle invalid deep link parameters gracefully', async () => {
      const initialEntries = ['/courses/spanish-basics?level=invalid-level&section=invalid-section'];

      render(
        <MemoryRouter initialEntries={initialEntries}>
          <App />
        </MemoryRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Verify course is still loaded
      await waitFor(() => {
        expect(mockCourseService.getCourse).toHaveBeenCalledWith('spanish-basics');
      });

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Verify that invalid parameters are ignored and default state is shown
      await waitFor(() => {
        expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledWith('spanish-basics', expect.any(Object));
      });

      // Should show levels but not attempt to load invalid sections
      expect(mockSectionService.getSectionsByLevel).not.toHaveBeenCalledWith('invalid-level', expect.any(Object));

      // Should show error message or fallback to default view
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });

  describe('URL State Synchronization During Navigation', () => {
    it('should update URL when navigating through hierarchy', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Navigate to course detail page
      mockCourseService.getCourses.mockResolvedValue({
        data: [mockCourse],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await user.click(courseCard);
      }

      // Verify navigation to course detail
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/courses/spanish-basics');
      });

      // Select a level
      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      const levelCard = screen.getByText('A1 - Beginner');
      await user.click(levelCard);

      // Verify URL is updated with level parameter
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/courses/spanish-basics?level=level-a1');
      });

      // Select a section
      await waitFor(() => {
        expect(screen.getByText('Greetings')).toBeInTheDocument();
      });

      const sectionCard = screen.getByText('Greetings');
      await user.click(sectionCard);

      // Verify URL is updated with section parameter
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/courses/spanish-basics?level=level-a1&section=section-greetings');
      });

      // Select a module
      await waitFor(() => {
        expect(screen.getByText('Basic Greetings')).toBeInTheDocument();
      });

      const moduleCard = screen.getByText('Basic Greetings');
      await user.click(moduleCard);

      // Verify URL is updated with module parameter
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/courses/spanish-basics?level=level-a1&section=section-greetings&module=module-basic-greetings');
      });
    });

    it('should clear child parameters when parent selection changes', async () => {
      const user = userEvent.setup();

      // Start with full hierarchy selected
      const initialEntries = ['/courses/spanish-basics?level=level-a1&section=section-greetings&module=module-basic-greetings'];

      render(
        <MemoryRouter initialEntries={initialEntries}>
          <App />
        </MemoryRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
        expect(screen.getByText('Basic Greetings')).toBeInTheDocument();
      });

      // Add another level for testing
      const anotherLevel = {
        ...mockLevel,
        id: 'level-a2',
        code: 'A2',
        name: 'Elementary',
        order: 2,
      };

      mockLevelService.getLevelsByCourse.mockResolvedValue({
        data: [mockLevel, anotherLevel],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      });

      // Select a different level
      const newLevelCard = screen.getByText('A2 - Elementary');
      await user.click(newLevelCard);

      // Verify URL is updated and child parameters are cleared
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/courses/spanish-basics?level=level-a2');
      });

      // Verify that section and module parameters are removed
      expect(mockNavigate).not.toHaveBeenCalledWith(
        expect.stringContaining('section=section-greetings')
      );
      expect(mockNavigate).not.toHaveBeenCalledWith(
        expect.stringContaining('module=module-basic-greetings')
      );
    });

    it('should maintain URL state during page operations', async () => {
      const user = userEvent.setup();

      const initialEntries = ['/courses/spanish-basics?level=level-a1&section=section-greetings'];

      render(
        <MemoryRouter initialEntries={initialEntries}>
          <App />
        </MemoryRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
        expect(screen.getByText('Greetings')).toBeInTheDocument();
      });

      // Open a modal (should not affect URL)
      const addModuleButton = screen.getByText(/Add Module/i);
      await user.click(addModuleButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // URL should remain unchanged during modal operations
      expect(mockNavigate).not.toHaveBeenCalledWith(
        expect.not.stringContaining('level=level-a1&section=section-greetings')
      );

      // Close modal
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // URL should still be preserved
      expect(mockNavigate).not.toHaveBeenCalledWith(
        expect.not.stringContaining('level=level-a1&section=section-greetings')
      );
    });
  });

  describe('Browser Navigation Support', () => {
    it('should support browser back/forward navigation', async () => {
      const user = userEvent.setup();

      // Mock browser history
      const mockHistory = {
        back: jest.fn(),
        forward: jest.fn(),
        go: jest.fn(),
      };

      Object.defineProperty(window, 'history', {
        value: mockHistory,
        writable: true,
      });

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Navigate through hierarchy
      mockCourseService.getCourses.mockResolvedValue({
        data: [mockCourse],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await user.click(courseCard);
      }

      // Select level
      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      const levelCard = screen.getByText('A1 - Beginner');
      await user.click(levelCard);

      // Select section
      await waitFor(() => {
        expect(screen.getByText('Greetings')).toBeInTheDocument();
      });

      const sectionCard = screen.getByText('Greetings');
      await user.click(sectionCard);

      // Simulate browser back button
      window.dispatchEvent(new PopStateEvent('popstate', {
        state: { pathname: '/courses/spanish-basics', search: '?level=level-a1' }
      }));

      // Verify that the UI updates to reflect the previous state
      await waitFor(() => {
        // Should show level selected but not section
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
        // Section content should be hidden or deselected
      });

      // Simulate browser forward button
      window.dispatchEvent(new PopStateEvent('popstate', {
        state: { pathname: '/courses/spanish-basics', search: '?level=level-a1&section=section-greetings' }
      }));

      // Verify that the UI updates to reflect the forward state
      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
        expect(screen.getByText('Greetings')).toBeInTheDocument();
      });
    });

    it('should handle browser refresh with URL state preservation', async () => {
      // Simulate page refresh with URL parameters
      const initialEntries = ['/courses/spanish-basics?level=level-a1&section=section-greetings'];

      render(
        <MemoryRouter initialEntries={initialEntries}>
          <App />
        </MemoryRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Verify that the state is restored from URL after refresh
      await waitFor(() => {
        expect(mockCourseService.getCourse).toHaveBeenCalledWith('spanish-basics');
        expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledWith('spanish-basics', expect.any(Object));
        expect(mockSectionService.getSectionsByLevel).toHaveBeenCalledWith('level-a1', expect.any(Object));
      });

      // Verify UI reflects the restored state
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
        expect(screen.getByText('Greetings')).toBeInTheDocument();
      });

      // Verify that the correct elements are selected
      const levelCard = screen.getByText('A1 - Beginner').closest('[data-testid="level-card"]');
      const sectionCard = screen.getByText('Greetings').closest('[data-testid="section-card"]');

      expect(levelCard).toHaveClass('selected');
      expect(sectionCard).toHaveClass('selected');
    });
  });

  describe('Bookmarkable URLs', () => {
    it('should generate shareable URLs for specific course contexts', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Navigate to specific context
      mockCourseService.getCourses.mockResolvedValue({
        data: [mockCourse],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await user.click(courseCard);
      }

      // Navigate through hierarchy
      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      const levelCard = screen.getByText('A1 - Beginner');
      await user.click(levelCard);

      await waitFor(() => {
        expect(screen.getByText('Greetings')).toBeInTheDocument();
      });

      const sectionCard = screen.getByText('Greetings');
      await user.click(sectionCard);

      // Verify that the URL is bookmarkable
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/courses/spanish-basics?level=level-a1&section=section-greetings');
      });

      // Test that this URL can be used as a bookmark
      const bookmarkUrl = '/courses/spanish-basics?level=level-a1&section=section-greetings';

      // Simulate navigating to bookmarked URL
      render(
        <MemoryRouter initialEntries={[bookmarkUrl]}>
          <App />
        </MemoryRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Verify that the bookmarked state is restored
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
        expect(screen.getByText('Greetings')).toBeInTheDocument();
      });
    });

    it('should handle URL sharing across different users', async () => {
      // Test that shared URLs work for different users (assuming they have access)
      const sharedUrl = '/courses/spanish-basics?level=level-a1&section=section-greetings';

      // Simulate different user accessing shared URL
      const differentUser: User = {
        ...mockAuthContextValues.authenticated.user,
        id: '2',
        email: 'different@example.com',
        username: 'Different User',
        registrationDate: new Date().toISOString(),
        isActive: true,
        role: 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(
        <MemoryRouter initialEntries={[sharedUrl]}>
          <App />
        </MemoryRouter>,
        { 
          authContextValue: {
            ...mockAuthContextValues.authenticated,
            user: differentUser,
          }
        }
      );

      // Verify that the shared URL works for different user
      await waitFor(() => {
        expect(mockCourseService.getCourse).toHaveBeenCalledWith('spanish-basics');
      });

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
        expect(screen.getByText('Greetings')).toBeInTheDocument();
      });
    });
  });

  describe('URL Parameter Validation and Sanitization', () => {
    it('should validate URL parameters and handle malformed values', async () => {
      // Test with malformed URL parameters
      const malformedUrl = '/courses/spanish-basics?level=<script>alert("xss")</script>&section=../../../etc/passwd';

      render(
        <MemoryRouter initialEntries={[malformedUrl]}>
          <App />
        </MemoryRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Verify that malformed parameters are sanitized or ignored
      await waitFor(() => {
        expect(mockCourseService.getCourse).toHaveBeenCalledWith('spanish-basics');
      });

      // Should not attempt to load data with malformed parameters
      expect(mockSectionService.getSectionsByLevel).not.toHaveBeenCalledWith(
        expect.stringContaining('<script>'),
        expect.any(Object)
      );

      expect(mockSectionService.getSectionsByLevel).not.toHaveBeenCalledWith(
        expect.stringContaining('../../../'),
        expect.any(Object)
      );

      // Should show course but not attempt invalid selections
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });
    });

    it('should handle URL parameters with special characters', async () => {
      // Test with URL-encoded special characters
      const encodedUrl = '/courses/spanish-basics?level=level%2Da1&section=section%2Dgreetings';

      render(
        <MemoryRouter initialEntries={[encodedUrl]}>
          <App />
        </MemoryRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Verify that encoded parameters are properly decoded
      await waitFor(() => {
        expect(mockCourseService.getCourse).toHaveBeenCalledWith('spanish-basics');
        expect(mockLevelService.getLevelsByCourse).toHaveBeenCalledWith('spanish-basics', expect.any(Object));
        expect(mockSectionService.getSectionsByLevel).toHaveBeenCalledWith('level-a1', expect.any(Object));
      });

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
        expect(screen.getByText('Greetings')).toBeInTheDocument();
      });
    });
  });
});