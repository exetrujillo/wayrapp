/**
 * Tests for HierarchicalBreadcrumb component
 * 
 * This test suite validates the intelligent breadcrumb navigation system,
 * including entity validation, loading states, and navigation prevention
 * for non-existent entities.
 * 
 * @module HierarchicalBreadcrumb.test
 * @category Tests
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HierarchicalBreadcrumb } from '../HierarchicalBreadcrumb';
import { HierarchyPath } from '../../../utils/breadcrumbUtils';

// Mock the hooks
// Mock the useBreadcrumbs hook
jest.mock('../../../hooks/useBreadcrumbs', () => ({
  useBreadcrumbs: jest.fn()
}));

const mockUseBreadcrumbs = require('../../../hooks/useBreadcrumbs').useBreadcrumbs;

/**
 * Test wrapper component with required providers
 */
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('HierarchicalBreadcrumb', () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test basic breadcrumb rendering
   */
  it('renders breadcrumbs correctly for valid hierarchy path', async () => {
    const currentPath: HierarchyPath = {
      courseId: 'course1',
      levelId: 'level1',
      sectionId: 'section1'
    };

    const mockBreadcrumbs = [
      {
        id: 'course1',
        label: 'Test Course',
        path: '/courses/course1',
        isClickable: true,
        isLoading: false,
        entityType: 'course',
        exists: true
      },
      {
        id: 'level1',
        label: 'Test Level',
        path: '/courses/course1/levels/level1',
        isClickable: true,
        isLoading: false,
        entityType: 'level',
        exists: true
      },
      {
        id: 'section1',
        label: 'Test Section',
        path: '/courses/course1/levels/level1/sections/section1',
        isClickable: false, // Current page, not clickable
        isLoading: false,
        entityType: 'section',
        exists: true
      }
    ];

    mockUseBreadcrumbs.mockReturnValue({
      breadcrumbs: mockBreadcrumbs,
      navigate: mockNavigate
    });

    render(
      <TestWrapper>
        <HierarchicalBreadcrumb currentPath={currentPath} />
      </TestWrapper>
    );

    // Check that all breadcrumb items are rendered
    expect(screen.getByText('Test Course')).toBeInTheDocument();
    expect(screen.getByText('Test Level')).toBeInTheDocument();
    expect(screen.getByText('Test Section')).toBeInTheDocument();

    // Check that home icon is rendered
    expect(screen.getByLabelText('Go to courses home')).toBeInTheDocument();
  });

  /**
   * Test loading states
   */
  it('shows loading states for breadcrumb items', () => {
    const currentPath: HierarchyPath = {
      courseId: 'course1',
      levelId: 'level1'
    };

    const mockBreadcrumbs = [
      {
        id: 'course1',
        label: 'Test Course',
        path: '/courses/course1',
        isClickable: true,
        isLoading: false,
        entityType: 'course',
        exists: true
      },
      {
        id: 'level1',
        label: 'Loading...',
        path: '/courses/course1/levels/level1',
        isClickable: false,
        isLoading: true,
        entityType: 'level',
        exists: false
      }
    ];

    mockUseBreadcrumbs.mockReturnValue({
      breadcrumbs: mockBreadcrumbs,
      navigate: mockNavigate
    });

    render(
      <TestWrapper>
        <HierarchicalBreadcrumb currentPath={currentPath} />
      </TestWrapper>
    );

    // Check loading state is displayed
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    // Check that loading spinner is present
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  /**
   * Test navigation functionality
   */
  it('handles navigation correctly for clickable items', async () => {
    const currentPath: HierarchyPath = {
      courseId: 'course1',
      levelId: 'level1',
      sectionId: 'section1'
    };

    const mockBreadcrumbs = [
      {
        id: 'course1',
        label: 'Test Course',
        path: '/courses/course1',
        isClickable: true,
        isLoading: false,
        entityType: 'course',
        exists: true
      },
      {
        id: 'level1',
        label: 'Test Level',
        path: '/courses/course1/levels/level1',
        isClickable: true,
        isLoading: false,
        entityType: 'level',
        exists: true
      }
    ];

    mockUseBreadcrumbs.mockReturnValue({
      breadcrumbs: mockBreadcrumbs,
      navigate: mockNavigate
    });

    render(
      <TestWrapper>
        <HierarchicalBreadcrumb currentPath={currentPath} />
      </TestWrapper>
    );

    // Click on the course breadcrumb
    const courseButton = screen.getByText('Test Course');
    fireEvent.click(courseButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        courseId: 'course1'
      });
    });
  });

  /**
   * Test non-clickable items
   */
  it('prevents navigation for non-clickable items', () => {
    const currentPath: HierarchyPath = {
      courseId: 'course1',
      levelId: 'level1'
    };

    const mockBreadcrumbs = [
      {
        id: 'course1',
        label: 'Test Course',
        path: '/courses/course1',
        isClickable: true,
        isLoading: false,
        entityType: 'course',
        exists: true
      },
      {
        id: 'level1',
        label: 'Unknown Level',
        path: '/courses/course1/levels/level1',
        isClickable: false,
        isLoading: false,
        entityType: 'level',
        exists: false
      }
    ];

    mockUseBreadcrumbs.mockReturnValue({
      breadcrumbs: mockBreadcrumbs,
      navigate: mockNavigate
    });

    render(
      <TestWrapper>
        <HierarchicalBreadcrumb currentPath={currentPath} />
      </TestWrapper>
    );

    // Check that non-clickable item is rendered as span, not button
    const nonClickableItem = screen.getByText('Unknown Level');
    expect(nonClickableItem.tagName).toBe('SPAN');
    expect(nonClickableItem).toHaveClass('cursor-not-allowed');
  });

  /**
   * Test custom navigation handler
   */
  it('uses custom navigation handler when provided', async () => {
    const customNavigate = jest.fn();
    const currentPath: HierarchyPath = {
      courseId: 'course1',
      levelId: 'level1'
    };

    const mockBreadcrumbs = [
      {
        id: 'course1',
        label: 'Test Course',
        path: '/courses/course1',
        isClickable: true,
        isLoading: false,
        entityType: 'course',
        exists: true
      }
    ];

    mockUseBreadcrumbs.mockReturnValue({
      breadcrumbs: mockBreadcrumbs,
      navigate: mockNavigate
    });

    render(
      <TestWrapper>
        <HierarchicalBreadcrumb 
          currentPath={currentPath} 
          onNavigate={customNavigate}
        />
      </TestWrapper>
    );

    const courseButton = screen.getByText('Test Course');
    fireEvent.click(courseButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        courseId: 'course1'
      });
    });
  });

  /**
   * Test home icon functionality
   */
  it('renders home icon when showHomeIcon is true', () => {
    const currentPath: HierarchyPath = {
      courseId: 'course1'
    };

    mockUseBreadcrumbs.mockReturnValue({
      breadcrumbs: [],
      navigate: mockNavigate
    });

    render(
      <TestWrapper>
        <HierarchicalBreadcrumb 
          currentPath={currentPath} 
          showHomeIcon={true}
        />
      </TestWrapper>
    );

    expect(screen.getByLabelText('Go to courses home')).toBeInTheDocument();
  });

  /**
   * Test hiding home icon
   */
  it('hides home icon when showHomeIcon is false', () => {
    const currentPath: HierarchyPath = {
      courseId: 'course1'
    };

    mockUseBreadcrumbs.mockReturnValue({
      breadcrumbs: [],
      navigate: mockNavigate
    });

    render(
      <TestWrapper>
        <HierarchicalBreadcrumb 
          currentPath={currentPath} 
          showHomeIcon={false}
        />
      </TestWrapper>
    );

    expect(screen.queryByLabelText('Go to courses home')).not.toBeInTheDocument();
  });

  /**
   * Test empty path handling
   */
  it('returns null for empty hierarchy path', () => {
    const currentPath: HierarchyPath = {};

    mockUseBreadcrumbs.mockReturnValue({
      breadcrumbs: [],
      navigate: mockNavigate
    });

    const { container } = render(
      <TestWrapper>
        <HierarchicalBreadcrumb currentPath={currentPath} />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });
});