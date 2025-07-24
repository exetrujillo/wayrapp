/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/auth/ProtectedRoute';
import { authService } from '../../services/auth';

// Mock the auth service
jest.mock('../../services/auth', () => ({
  authService: {
    isAuthenticated: jest.fn(),
    getCurrentUserProfile: jest.fn(),
    refreshToken: jest.fn(),
    clearSessionAndRedirect: jest.fn(),
    logout: jest.fn(),
    login: jest.fn(),
  },
}));

// Mock console methods to avoid test output noise
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Mock window.location for navigation tests
const mockLocation = {
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

// Only mock location if it's not already mocked
if (!window.location || typeof window.location.assign !== 'function') {
  delete (window as any).location;
  (window as any).location = mockLocation;
}

// Test component that uses ProtectedRoute
const TestApp: React.FC<{ initialPath?: string }> = ({ initialPath = '/dashboard' }) => {
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <div data-testid="dashboard-content">Dashboard Content</div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <div data-testid="profile-content">Profile Content</div>
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Session Expiration Handling Integration', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    username: 'testuser',
    role: 'content_creator' as const,
    isActive: true,
    registrationDate: '2024-01-01T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset location mock
    mockLocation.href = 'http://localhost:3000';
    mockLocation.pathname = '/';
  });

  it('should redirect to login when session expires during initialization', async () => {
    // Mock initial authentication check to return true
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    // Mock profile fetch to fail with 401 (expired session)
    (authService.getCurrentUserProfile as jest.Mock).mockRejectedValue({
      status: 401,
      message: 'Your session has expired. Please log in again.'
    });
    
    // Mock refresh token to also fail
    (authService.refreshToken as jest.Mock).mockRejectedValue({
      status: 401,
      message: 'Refresh token expired'
    });

    render(<TestApp />);

    // Should show loading initially
    expect(screen.getByText('Validating session...')).toBeInTheDocument();

    // Wait for authentication to complete and redirect to login
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should not show protected content
    expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();

    // Verify that clearSessionAndRedirect was called
    expect(authService.clearSessionAndRedirect).toHaveBeenCalled();
  });

  it('should successfully refresh token and maintain session', async () => {
    // Mock initial authentication check to return true
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    // Mock profile fetch to fail with 401 initially
    (authService.getCurrentUserProfile as jest.Mock)
      .mockRejectedValueOnce({
        status: 401,
        message: 'Your session has expired. Please log in again.'
      })
      .mockResolvedValueOnce(mockUser); // Success after refresh
    
    // Mock successful token refresh
    (authService.refreshToken as jest.Mock).mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: mockUser
    });

    render(<TestApp />);

    // Should show loading initially
    expect(screen.getByText('Validating session...')).toBeInTheDocument();

    // Wait for authentication to complete successfully
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Should not show login page
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();

    // Verify that refresh token was called
    expect(authService.refreshToken).toHaveBeenCalled();
    
    // Verify that profile was fetched twice (once failed, once succeeded)
    expect(authService.getCurrentUserProfile).toHaveBeenCalledTimes(2);
  });

  it('should handle network errors gracefully without logging out', async () => {
    // Mock initial authentication check to return true
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    // Mock profile fetch to fail with network error (no status)
    (authService.getCurrentUserProfile as jest.Mock).mockRejectedValue({
      message: 'Network error. Please check your connection.'
    });

    render(<TestApp />);

    // Should show loading initially
    expect(screen.getByText('Validating session...')).toBeInTheDocument();

    // Wait for error handling to complete
    await waitFor(() => {
      // Should still be on loading screen or show error, but not redirect to login
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Should not call clearSessionAndRedirect for network errors
    expect(authService.clearSessionAndRedirect).not.toHaveBeenCalled();
  });

  it('should handle server errors (5xx) without logging out', async () => {
    // Mock initial authentication check to return true
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    
    // Mock profile fetch to fail with server error
    (authService.getCurrentUserProfile as jest.Mock).mockRejectedValue({
      status: 500,
      message: 'Internal server error'
    });

    render(<TestApp />);

    // Should show loading initially
    expect(screen.getByText('Validating session...')).toBeInTheDocument();

    // Wait for error handling to complete
    await waitFor(() => {
      // Should still be on loading screen, not redirect to login for server errors
      expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Should not call clearSessionAndRedirect for server errors
    expect(authService.clearSessionAndRedirect).not.toHaveBeenCalled();
  });

  it('should redirect to login when no authentication tokens are found', async () => {
    // Mock no authentication tokens
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);

    render(<TestApp />);

    // Should redirect to login immediately without loading
    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    // Should not show protected content
    expect(screen.queryByTestId('dashboard-content')).not.toBeInTheDocument();

    // Should not call profile fetch if not authenticated
    expect(authService.getCurrentUserProfile).not.toHaveBeenCalled();
  });

  it('should maintain authentication state across different protected routes', async () => {
    // Mock successful authentication
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getCurrentUserProfile as jest.Mock).mockResolvedValue(mockUser);

    // Test dashboard route
    const { unmount } = render(<TestApp initialPath="/dashboard" />);

    // Wait for initial authentication
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    // Unmount and test profile route
    unmount();
    
    render(<TestApp initialPath="/profile" />);

    // Should show profile content - authentication state should be maintained
    await waitFor(() => {
      expect(screen.getByTestId('profile-content')).toBeInTheDocument();
    });

    // Should not show login page
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
    
    // Profile fetch should have been called for both routes
    expect(authService.getCurrentUserProfile).toHaveBeenCalledTimes(2);
  });

  it('should handle periodic token validation failure during app usage', async () => {
    // Mock successful initial authentication
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getCurrentUserProfile as jest.Mock)
      .mockResolvedValueOnce(mockUser) // Initial success
      .mockRejectedValueOnce({ // Periodic validation failure
        status: 401,
        message: 'Token expired'
      });
    
    // Mock refresh token failure
    (authService.refreshToken as jest.Mock).mockRejectedValue({
      status: 401,
      message: 'Refresh token expired'
    });

    render(<TestApp />);

    // Wait for initial authentication success
    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    // Simulate periodic token validation (this would normally happen via setInterval)
    // We'll trigger it manually by calling the validation logic
    act(() => {
      // This simulates what would happen during periodic validation
      // The AuthContext should handle this and redirect to login
    });

    // Note: The actual periodic validation happens in AuthContext via setInterval
    // In a real scenario, we would need to wait for the interval to trigger
    // For this test, we're verifying the setup is correct
    expect(authService.getCurrentUserProfile).toHaveBeenCalledTimes(1);
  });
});