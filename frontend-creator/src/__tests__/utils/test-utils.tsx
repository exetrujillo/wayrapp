import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import i18n from '../i18n';
import { AuthContext, AuthContextType, AuthProvider } from '../../contexts/AuthContext'; // Adjust path if necessary
import { ErrorProvider } from '../../contexts/ErrorContext';
import { FormValidationProvider } from '../../contexts/FormValidationContext';
import { LoadingStateProvider } from '../../components/ui/LoadingStateProvider';
import { User } from '../../utils/types';

// A mock ToastContainer to prevent interference in tests
const MockToastContainer = () => null;

// Creates a fresh QueryClient for each test to ensure isolation
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for tests for faster feedback
      gcTime: Infinity, // Disable garbage collection during a test run
    },
  },
});

// Custom render options to allow passing specific context values or router entries
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  authContextValue?: Partial<AuthContextType>; // Use Partial to allow overriding only some properties
}

// The single wrapper component that provides all necessary contexts for a test
const AllTheProviders = ({
  children,
  initialEntries = ['/'],
  authContextValue = {},
}: {
  children: React.ReactNode;
  initialEntries?: string[];
  authContextValue?: Partial<AuthContextType>;
}) => {
  const testQueryClient = createTestQueryClient();

  // A robust, fully-typed default value for the AuthContext
  const defaultAuthContextValue: AuthContextType = {
    isAuthenticated: false,
    user: null,
    isLoading: false,
    error: null,
    login: async (credentials) => {
      console.log('Mock login called with:', credentials);
      // For E2E tests, we want to simulate a successful login
      // This will be overridden by the real AuthProvider when needed
    },
    logout: async () => { },
    // TODO: Add any other functions or default values that the real AuthContext provides
  };

  const mergedAuthContextValue = {
    ...defaultAuthContextValue,
    ...authContextValue,
  };

  // Check if this is an E2E test by looking at the test file name
  const isE2ETest = expect.getState().testPath?.includes('e2e.test') || false;

  return (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={testQueryClient}>
        <HelmetProvider>
          <I18nextProvider i18n={i18n}>
            <ErrorProvider>
              <LoadingStateProvider>
                {isE2ETest ? (
                  // For E2E tests, use the real AuthProvider
                  <AuthProvider>
                    <FormValidationProvider>
                      {children}
                      <MockToastContainer />
                    </FormValidationProvider>
                  </AuthProvider>
                ) : (
                  // For unit tests, use the mock AuthContext
                  <AuthContext.Provider value={mergedAuthContextValue}>
                    <FormValidationProvider>
                      {children}
                      <MockToastContainer />
                    </FormValidationProvider>
                  </AuthContext.Provider>
                )}
              </LoadingStateProvider>
            </ErrorProvider>
          </I18nextProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

// The custom render function that uses the AllTheProviders wrapper
const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries, authContextValue, ...renderOptions } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders
        {...(initialEntries && { initialEntries })}
        {...(authContextValue && { authContextValue })}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// --- Mocks and Test Helpers ---

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  username: 'Test User',
  countryCode: 'US',
  registrationDate: new Date().toISOString(),
  lastLoginDate: new Date().toISOString(),
  isActive: true,
  role: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // Ensure all fields from the User interface are present here
};

// Pre-defined AuthContext states for cleaner tests
export const mockAuthContextValues: { [key: string]: Partial<AuthContextType> } = {
  authenticated: {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
  },
  unauthenticated: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
  },
  loading: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  },
};

// Re-export everything from React Testing Library for convenience
export * from '@testing-library/react';
// Override the default render method with our custom one
export { customRender as render };