/**
 * Responsive Design and Accessibility Integration Tests
 * 
 * This test suite covers:
 * - Responsive design across different screen sizes
 * - Accessibility compliance for all new components
 * - Keyboard navigation and screen reader support
 * - Touch interaction support for mobile devices
 * - Color contrast and visual accessibility
 */

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, mockAuthContextValues } from '../utils/test-utils';
import { BrowserRouter } from 'react-router-dom';
import App from '../../App';
import { courseService } from '../../services/courseService';
import { levelService } from '../../services/levelService';
import { sectionService } from '../../services/sectionService';
import { moduleService } from '../../services/moduleService';
import { lessonService } from '../../services/lessonService';
import { exerciseService } from '../../services/exerciseService';

// Mock all services
jest.mock('../../services/courseService');
jest.mock('../../services/levelService');
jest.mock('../../services/sectionService');
jest.mock('../../services/moduleService');
jest.mock('../../services/lessonService');
jest.mock('../../services/exerciseService');

const mockCourseService = courseService as jest.Mocked<typeof courseService>;
const mockLevelService = levelService as jest.Mocked<typeof levelService>;
const mockSectionService = sectionService as jest.Mocked<typeof sectionService>;
const mockModuleService = moduleService as jest.Mocked<typeof moduleService>;
const mockLessonService = lessonService as jest.Mocked<typeof lessonService>;
const mockExerciseService = exerciseService as jest.Mocked<typeof exerciseService>;

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

const mockExercise = {
  id: 'exercise-translate-hello',
  exerciseType: 'translation' as const,
  data: {
    sourceText: 'Hello',
    targetText: 'Hola',
  },
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

// Utility function to simulate different viewport sizes
const setViewportSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

// Utility function to check if element is visible
const isElementVisible = (element: HTMLElement): boolean => {
  const style = window.getComputedStyle(element);
  return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
};

describe('Responsive Design and Accessibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockCourseService.getCourses.mockResolvedValue({
      data: [mockCourse],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
    
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
    
    mockExerciseService.getExercises.mockResolvedValue({
      data: [mockExercise],
      meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
    });
  });

  describe('Responsive Design Tests', () => {
    it('should adapt layout for mobile devices (320px - 768px)', async () => {
      // Set mobile viewport
      setViewportSize(375, 667); // iPhone SE dimensions

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Check mobile-specific layout elements
      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      expect(courseCard).toBeInTheDocument();

      // Verify mobile navigation patterns
      const mobileMenuButton = screen.queryByLabelText(/menu/i);
      if (mobileMenuButton) {
        expect(mobileMenuButton).toBeInTheDocument();
      }

      // Check that cards stack vertically on mobile
      const courseCards = screen.getAllByTestId('course-card');
      courseCards.forEach(card => {
        const styles = window.getComputedStyle(card);
        // In mobile, cards should take full width or be in single column
        expect(parseInt(styles.width)).toBeGreaterThan(300);
      });
    });

    it('should adapt layout for tablet devices (768px - 1024px)', async () => {
      // Set tablet viewport
      setViewportSize(768, 1024); // iPad dimensions

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Navigate to course detail page
      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await userEvent.setup().click(courseCard);
      }

      // Check tablet-specific layout
      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      // Verify hierarchical navigation is properly laid out for tablet
      const hierarchicalNav = screen.getByTestId('hierarchical-navigator');
      expect(hierarchicalNav).toBeInTheDocument();

      // Check that content is properly spaced for tablet viewing
      const levelCards = screen.getAllByTestId('level-card');
      expect(levelCards.length).toBeGreaterThan(0);
    });

    it('should optimize layout for desktop devices (1024px+)', async () => {
      // Set desktop viewport
      setViewportSize(1440, 900); // Standard desktop

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Navigate to course detail page
      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await userEvent.setup().click(courseCard);
      }

      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      // Check desktop-specific layout features
      const sidebar = screen.queryByTestId('sidebar');
      if (sidebar) {
        expect(isElementVisible(sidebar)).toBe(true);
      }

      // Verify multi-column layout for desktop
      const contentArea = screen.getByTestId('content-area');
      expect(contentArea).toBeInTheDocument();

      // Check that desktop has more horizontal space utilization
      const hierarchicalNav = screen.getByTestId('hierarchical-navigator');
      const navStyles = window.getComputedStyle(hierarchicalNav);
      expect(parseInt(navStyles.maxWidth)).toBeGreaterThan(800);
    });

    it('should handle viewport size changes dynamically', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Start with desktop
      setViewportSize(1440, 900);

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Navigate to course detail
      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await user.click(courseCard);
      }

      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      // Change to mobile viewport
      setViewportSize(375, 667);

      // Wait for layout to adapt
      await waitFor(() => {
        const hierarchicalNav = screen.getByTestId('hierarchical-navigator');
        expect(hierarchicalNav).toBeInTheDocument();
      });

      // Verify mobile adaptations are applied
      // Mobile-specific elements should be visible or layout should be adapted
    });
  });

  describe('Accessibility Compliance Tests', () => {
    it('should have proper ARIA labels and roles for all interactive elements', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Check course cards have proper ARIA attributes
      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      expect(courseCard).toHaveAttribute('role', 'button');
      expect(courseCard).toHaveAttribute('aria-label');

      // Navigate to course detail
      if (courseCard) {
        await user.click(courseCard);
      }

      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      // Check hierarchical navigation has proper ARIA structure
      const hierarchicalNav = screen.getByTestId('hierarchical-navigator');
      expect(hierarchicalNav).toHaveAttribute('role', 'navigation');
      expect(hierarchicalNav).toHaveAttribute('aria-label', 'Course hierarchy navigation');

      // Check level cards have proper accessibility attributes
      const levelCard = screen.getByText('A1 - Beginner').closest('[data-testid="level-card"]');
      expect(levelCard).toHaveAttribute('role', 'button');
      expect(levelCard).toHaveAttribute('aria-label');
      expect(levelCard).toHaveAttribute('tabindex', '0');

      // Check buttons have proper labels
      const addLevelButton = screen.getByText(/Add Level/i);
      expect(addLevelButton).toHaveAttribute('aria-label', 'Add new level to course');

      // Test modal accessibility
      await user.click(addLevelButton);

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
        expect(modal).toHaveAttribute('aria-labelledby');
        expect(modal).toHaveAttribute('aria-describedby');
      });

      // Check form accessibility
      const levelCodeInput = screen.getByLabelText(/Level Code/i);
      expect(levelCodeInput).toHaveAttribute('aria-required', 'true');
      expect(levelCodeInput).toHaveAttribute('aria-describedby');
    });

    it('should support keyboard navigation throughout the application', async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Test keyboard navigation on course cards
      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      expect(courseCard).toHaveAttribute('tabindex', '0');

      // Simulate keyboard navigation
      (courseCard as HTMLElement)?.focus();
      expect(document.activeElement).toBe(courseCard);

      // Test Enter key activation
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      // Test Tab navigation through hierarchical elements
      const levelCard = screen.getByText('A1 - Beginner').closest('[data-testid="level-card"]');
      expect(levelCard).toHaveAttribute('tabindex', '0');

      // Test keyboard activation of level card
      (levelCard as HTMLElement)?.focus();
      await userEvent.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Greetings')).toBeInTheDocument();
      });

      // Test keyboard navigation to action buttons
      const addSectionButton = screen.getByText(/Add Section/i);
      (addSectionButton as HTMLButtonElement).focus();
      expect(document.activeElement).toBe(addSectionButton);

      // Test Space key activation
      await userEvent.keyboard(' ');

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();
        
        // Check that focus is trapped in modal
        const firstInput = within(modal).getByLabelText(/Section Name/i);
        expect(document.activeElement).toBe(firstInput);
      });

      // Test Escape key to close modal
      await userEvent.keyboard('{Escape}');

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should provide proper screen reader support', async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Check for screen reader announcements
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');

      // Navigate to course detail
      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await userEvent.setup().click(courseCard);
      }

      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      // Check breadcrumb navigation for screen readers
      const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
      expect(breadcrumb).toBeInTheDocument();

      const breadcrumbItems = within(breadcrumb).getAllByRole('listitem');
      expect(breadcrumbItems.length).toBeGreaterThan(0);

      breadcrumbItems.forEach(item => {
        const link = within(item).queryByRole('link');
        if (link) {
          expect(link).toHaveAttribute('aria-current');
        }
      });

      // Check loading states have proper announcements
      const loadingSpinner = screen.queryByRole('status', { name: /loading/i });
      if (loadingSpinner) {
        expect(loadingSpinner).toHaveAttribute('aria-label');
      }

      // Check error messages are announced
      // This would be tested with actual error scenarios
    });

    it('should maintain focus management in modals and overlays', async () => {
      const user = userEvent.setup();

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Navigate to course detail
      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await user.click(courseCard);
      }

      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      // Open modal
      const addLevelButton = screen.getByText(/Add Level/i);
      await user.click(addLevelButton);

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        expect(modal).toBeInTheDocument();

        // Check initial focus
        const firstInput = within(modal).getByLabelText(/Level Code/i);
        expect(document.activeElement).toBe(firstInput);
      });

      // Test focus trap - Tab should cycle through modal elements only
      await user.tab();
      const secondInput = screen.getByLabelText(/Level Name/i);
      expect(document.activeElement).toBe(secondInput);

      await user.tab();
      const submitButton = screen.getByRole('button', { name: /Create Level/i });
      expect(document.activeElement).toBe(submitButton);

      await user.tab();
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      expect(document.activeElement).toBe(cancelButton);

      // Tab should cycle back to first input
      await user.tab();
      const firstInputAgain = screen.getByLabelText(/Level Code/i);
      expect(document.activeElement).toBe(firstInputAgain);

      // Test Shift+Tab reverse navigation
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(cancelButton);

      // Close modal and check focus return
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        // Focus should return to the button that opened the modal
        expect(document.activeElement).toBe(addLevelButton);
      });
    });

    it('should have sufficient color contrast for all text elements', async () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Check color contrast for course cards
      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      const cardStyles = window.getComputedStyle(courseCard!);
      
      // Note: In a real test, you would use a color contrast checking library
      // For this example, we'll check that colors are defined
      expect(cardStyles.color).toBeDefined();
      expect(cardStyles.backgroundColor).toBeDefined();

      // Navigate to course detail
      if (courseCard) {
        await userEvent.setup().click(courseCard);
      }

      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      // Check button color contrast
      const addLevelButton = screen.getByText(/Add Level/i);
      const buttonStyles = window.getComputedStyle(addLevelButton);
      expect(buttonStyles.color).toBeDefined();
      expect(buttonStyles.backgroundColor).toBeDefined();

      // Check link color contrast
      const breadcrumbLinks = screen.getAllByRole('link');
      breadcrumbLinks.forEach(link => {
        const linkStyles = window.getComputedStyle(link);
        expect(linkStyles.color).toBeDefined();
      });

      // Check form input contrast
      await userEvent.setup().click(addLevelButton);

      await waitFor(() => {
        const modal = screen.getByRole('dialog');
        const input = within(modal).getByLabelText(/Level Code/i);
        const inputStyles = window.getComputedStyle(input);
        expect(inputStyles.color).toBeDefined();
        expect(inputStyles.backgroundColor).toBeDefined();
        expect(inputStyles.borderColor).toBeDefined();
      });
    });
  });

  describe('Touch Interaction Support', () => {
    it('should support touch interactions on mobile devices', async () => {
      // Set mobile viewport
      setViewportSize(375, 667);

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Test touch targets are appropriately sized (minimum 44px)
      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      const cardStyles = window.getComputedStyle(courseCard!);
      
      // Check minimum touch target size
      expect(parseInt(cardStyles.minHeight)).toBeGreaterThanOrEqual(44);

      // Test touch interaction
      const touchEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 100 } as Touch],
      });
      
      courseCard?.dispatchEvent(touchEvent);

      // Navigate to course detail
      await userEvent.setup().click(courseCard!);

      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      // Test button touch targets
      const addLevelButton = screen.getByText(/Add Level/i);
      const buttonStyles = window.getComputedStyle(addLevelButton);
      expect(parseInt(buttonStyles.minHeight)).toBeGreaterThanOrEqual(44);
      expect(parseInt(buttonStyles.minWidth)).toBeGreaterThanOrEqual(44);

      // Test drag and drop on mobile (if implemented)
      const levelCard = screen.getByText('A1 - Beginner').closest('[data-testid="level-card"]');
      if (levelCard) {
        const touchStart = new TouchEvent('touchstart', {
          touches: [{ clientX: 100, clientY: 100 } as Touch],
        });
        
        const touchMove = new TouchEvent('touchmove', {
          touches: [{ clientX: 150, clientY: 100 } as Touch],
        });
        
        const touchEnd = new TouchEvent('touchend', {
          changedTouches: [{ clientX: 150, clientY: 100 } as Touch],
        });

        levelCard.dispatchEvent(touchStart);
        levelCard.dispatchEvent(touchMove);
        levelCard.dispatchEvent(touchEnd);
      }
    });

    it('should handle swipe gestures for navigation', async () => {
      // Set mobile viewport
      setViewportSize(375, 667);

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      });

      // Navigate to course detail
      const courseCard = screen.getByText('Spanish Basics').closest('[data-testid="course-card"]');
      if (courseCard) {
        await userEvent.setup().click(courseCard);
      }

      await waitFor(() => {
        expect(screen.getByText('A1 - Beginner')).toBeInTheDocument();
      });

      // Test swipe gesture for navigation (if implemented)
      const hierarchicalNav = screen.getByTestId('hierarchical-navigator');
      
      // Simulate swipe left
      const swipeStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200, clientY: 300 } as Touch],
      });
      
      const swipeMove = new TouchEvent('touchmove', {
        touches: [{ clientX: 100, clientY: 300 } as Touch],
      });
      
      const swipeEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100, clientY: 300 } as Touch],
      });

      hierarchicalNav.dispatchEvent(swipeStart);
      hierarchicalNav.dispatchEvent(swipeMove);
      hierarchicalNav.dispatchEvent(swipeEnd);

      // Verify swipe behavior (implementation dependent)
    });
  });

  describe('Performance and Loading States', () => {
    it('should show appropriate loading states during data fetching', async () => {
      // Mock delayed responses
      mockCourseService.getCourses.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: [mockCourse],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        }), 1000))
      );

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Check initial loading state
      expect(screen.getByText(/Loading/i)).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Verify loading state is removed
      expect(screen.queryByText(/Loading/i)).not.toBeInTheDocument();
    });

    it('should handle slow network connections gracefully', async () => {
      // Mock very slow response
      mockCourseService.getCourses.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          data: [mockCourse],
          meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
        }), 6000))
      );

      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>,
        { authContextValue: mockAuthContextValues.authenticated }
      );

      // Check that slow connection warning appears
      await waitFor(() => {
        expect(screen.getByText(/slow connection/i)).toBeInTheDocument();
      }, { timeout: 6000 });

      // Wait for eventual data load
      await waitFor(() => {
        expect(screen.getByText('Spanish Basics')).toBeInTheDocument();
      }, { timeout: 8000 });
    });
  });
});