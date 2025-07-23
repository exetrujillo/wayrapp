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
  },
}));

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button 
        data-testid="login-button" 
        onClick={() => login({ email: 'test@example.com', password: 'password123' })}
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
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
    
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
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User', role: 'admin', createdAt: '', updatedAt: '' };
    (authService.login as jest.Mock).mockResolvedValue({ user: mockUser, token: 'token123', refreshToken: 'refresh123' });
    
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByTestId('login-button'));
    
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });
  
  it('handles logout successfully', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getCurrentUser as jest.Mock).mockReturnValue({
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'admin',
      createdAt: '',
      updatedAt: '',
    });
    
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );
    
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
    
    fireEvent.click(screen.getByTestId('logout-button'));
    
    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
    });
  });
  
  it('handles login errors', async () => {
    (authService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));
    
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );
    
    fireEvent.click(screen.getByTestId('login-button'));
    
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});