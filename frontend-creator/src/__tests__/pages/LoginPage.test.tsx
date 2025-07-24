import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '../utils/test-utils'; // Use custom render with providers
import LoginPage from '../../pages/LoginPage';

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

describe('LoginPage', () => {
  it('renders login form correctly', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
  });

  it('validates form inputs', async () => {
    render(<LoginPage />);

    // Get form elements
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Verify form elements are present
    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();

    // Fill in invalid email and short password to trigger validation
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput); // Trigger validation on blur

    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.blur(passwordInput); // Trigger validation on blur

    // Wait for validation errors
    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      expect(screen.getByText(/Password must be at least 8 characters/i)).toBeInTheDocument();
    });

    // Fill in valid data
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });

    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    // Submit with valid data
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // No validation errors should be visible
    await waitFor(() => {
      expect(screen.queryByText(/Please enter a valid email address/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Password must be at least 8 characters/i)).not.toBeInTheDocument();
    });
  });

  it('handles remember me checkbox', () => {
    render(<LoginPage />);

    const rememberMeCheckbox = screen.getByLabelText(/remember me/i);

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