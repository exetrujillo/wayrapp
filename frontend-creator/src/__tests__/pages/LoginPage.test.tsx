import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from '../../pages/LoginPage';
import { AuthProvider } from '../../contexts/AuthContext';

// Mock the auth context
jest.mock('../../contexts/AuthContext', () => {
  const originalModule = jest.requireActual('../../contexts/AuthContext');
  return {
    ...originalModule,
    useAuth: () => ({
      login: jest.fn(),
      isAuthenticated: false,
      isLoading: false,
      error: null,
    }),
  };
});

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('LoginPage', () => {
  it('renders login form correctly', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    expect(screen.getByLabelText(/creator.auth.email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/creator.auth.password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /creator.auth.signIn/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/creator.auth.rememberMe/i)).toBeInTheDocument();
  });
  
  it('validates form inputs', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    // Submit with empty fields
    fireEvent.click(screen.getByRole('button', { name: /creator.auth.signIn/i }));
    
    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
    });
    
    // Fill in invalid email
    fireEvent.change(screen.getByLabelText(/creator.auth.email/i), {
      target: { value: 'invalid-email' },
    });
    
    // Fill in short password
    fireEvent.change(screen.getByLabelText(/creator.auth.password/i), {
      target: { value: '12345' },
    });
    
    // Submit with invalid data
    fireEvent.click(screen.getByRole('button', { name: /creator.auth.signIn/i }));
    
    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
    });
    
    // Fill in valid data
    fireEvent.change(screen.getByLabelText(/creator.auth.email/i), {
      target: { value: 'test@example.com' },
    });
    
    fireEvent.change(screen.getByLabelText(/creator.auth.password/i), {
      target: { value: 'password123' },
    });
    
    // Submit with valid data
    fireEvent.click(screen.getByRole('button', { name: /creator.auth.signIn/i }));
    
    // No validation errors should be visible
    await waitFor(() => {
      expect(screen.queryByText(/Please enter a valid email address/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Password must be at least 6 characters/i)).not.toBeInTheDocument();
    });
  });
  
  it('handles remember me checkbox', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );
    
    const rememberMeCheckbox = screen.getByLabelText(/creator.auth.rememberMe/i);
    
    // Initially unchecked
    expect(rememberMeCheckbox).not.toBeChecked();
    
    // Check the box
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).toBeChecked();
    
    // Uncheck the box
    fireEvent.click(rememberMeCheckbox);
    expect(rememberMeCheckbox).not.toBeChecked();
  });
});