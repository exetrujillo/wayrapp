/**
 * @jest-environment jsdom
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Import the mocked useAuth
import { useAuth } from '../../contexts/AuthContext';

// Mock console methods to avoid test output noise
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

describe('ProtectedRoute', () => {
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
  });

  it('renders children when authenticated with valid user data', () => {
    // Mock authenticated state with user data
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: mockUser,
      error: null,
    });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
  
  it('redirects to login when not authenticated', () => {
    // Mock unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
    });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });
  
  it('shows loading state while checking authentication', () => {
    // Mock loading state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      error: null,
    });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    // Should show loading spinner and validation message
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.getByText('Validating session...')).toBeInTheDocument();
  });

  it('redirects to login with error state when authentication error occurs', () => {
    // Mock error state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: 'Your session has expired. Please log in again.',
    });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirects to login when authenticated but no user data available', () => {
    // Mock invalid session state (authenticated but no user data)
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: null,
      error: null,
    });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div data-testid="protected-content">Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('uses custom redirect path when provided', () => {
    // Mock unauthenticated state
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
    });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute redirectTo="/custom-login">
                <div data-testid="protected-content">Protected Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/custom-login" element={<div>Custom Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
    expect(screen.getByText('Custom Login Page')).toBeInTheDocument();
  });
});