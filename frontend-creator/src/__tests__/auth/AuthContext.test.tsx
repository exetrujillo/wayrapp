import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';

// Mock the auth service
jest.mock('../../services/auth', () => ({
  authService: {
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: jest.fn(),
    getCurrentUser: jest.fn(),
    getCurrentUserProfile: jest.fn(),
    refreshToken: jest.fn(),
    clearSessionAndRedirect: jest.fn(),
  },
}));

// Create a typed mock for easier use in tests
const mockedAuthService = authService as jest.Mocked<typeof authService>;

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email: 'test@example.com', password: 'password123' });
    } catch (error) {
      // Handle login error silently in test
    }
  };

  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>
      {user && <div data-testid="user-email">{user.email}</div>}
      {user && <div data-testid="user-username">{user.username}</div>}
      <button
        data-testid="login-button"
        onClick={handleLogin}
      >
        Login
      </button>
      <button data-testid="logout-button" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides authentication status', () => {
    mockedAuthService.isAuthenticated.mockReturnValue(false);

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
  });

  it('handles login successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      countryCode: 'US',
      registrationDate: '2024-01-01T00:00:00Z',
      lastLoginDate: '2024-01-01T00:00:00Z',
      isActive: true,
      role: 'student' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };
    const mockAuthResponse = {
      accessToken: 'valid-access-token',
      refreshToken: 'valid-refresh-token',
      user: mockUser,
    };

    mockedAuthService.login.mockResolvedValue(mockAuthResponse);

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockedAuthService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('initializes with user if token is valid', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      countryCode: 'US',
      registrationDate: '2024-01-01T00:00:00Z',
      lastLoginDate: '2024-01-01T00:00:00Z',
      isActive: true,
      role: 'student' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockedAuthService.isAuthenticated.mockReturnValue(true);
    mockedAuthService.getCurrentUserProfile.mockResolvedValue(mockUser);

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      expect(screen.getByTestId('user-username')).toHaveTextContent('testuser');
    });
  });

  it('handles logout successfully', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      countryCode: 'US',
      registrationDate: '2024-01-01T00:00:00Z',
      lastLoginDate: '2024-01-01T00:00:00Z',
      isActive: true,
      role: 'student' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    // Mock initial authenticated state
    mockedAuthService.isAuthenticated.mockReturnValue(true);
    mockedAuthService.getCurrentUserProfile.mockResolvedValue(mockUser);
    mockedAuthService.logout.mockResolvedValue();

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for initial authentication to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });

    fireEvent.click(screen.getByTestId('logout-button'));

    await waitFor(() => {
      expect(mockedAuthService.logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('handles login errors', async () => {
    // Suppress console.error for this test since we expect an error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    mockedAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(mockedAuthService.login).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
    });

    // Restore console.error
    consoleSpy.mockRestore();
  });

  it('handles session validation failure during initialization', async () => {
    mockedAuthService.isAuthenticated.mockReturnValue(true);
    mockedAuthService.getCurrentUserProfile.mockRejectedValue(new Error('Your session has expired. Please log in again.'));
    mockedAuthService.refreshToken.mockRejectedValue(new Error('Refresh failed'));
    mockedAuthService.clearSessionAndRedirect.mockImplementation(() => { });

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockedAuthService.getCurrentUserProfile).toHaveBeenCalled();
      expect(mockedAuthService.refreshToken).toHaveBeenCalled();
      expect(mockedAuthService.clearSessionAndRedirect).toHaveBeenCalled();
    });
  });

  it('handles successful token refresh during initialization', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      username: 'testuser',
      countryCode: 'US',
      registrationDate: '2024-01-01T00:00:00Z',
      lastLoginDate: '2024-01-01T00:00:00Z',
      isActive: true,
      role: 'student' as const,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    };

    mockedAuthService.isAuthenticated.mockReturnValue(true);
    mockedAuthService.getCurrentUserProfile
      .mockRejectedValueOnce(new Error('Your session has expired. Please log in again.'))
      .mockResolvedValueOnce(mockUser);
    mockedAuthService.refreshToken.mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: mockUser,
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockedAuthService.refreshToken).toHaveBeenCalled();
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    });
  });
});