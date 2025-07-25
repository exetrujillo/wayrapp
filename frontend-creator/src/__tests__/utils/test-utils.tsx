/**
 * Test utilities for common testing patterns
 * Provides custom render functions with providers and mocks
 */

import React, { ReactElement, createContext } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from '../i18n'; // Import the test i18n instance

// Create a mock AuthContext for testing
const AuthContext = createContext<any>(undefined);

// Create a test query client for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  authContextValue?: any;
}

const AllTheProviders = ({
  children,
  initialEntries = ['/'],
  authContextValue
}: {
  children: React.ReactNode;
  initialEntries?: string[];
  authContextValue?: any;
}) => {
  // Create a complete default mock value for the AuthContext
  const defaultAuthContextValue = {
    isAuthenticated: false,
    user: null, // Provide a safe default value for user
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
  };

  // Merge the defaults with any values passed from the test
  const mergedAuthContextValue = {
    ...defaultAuthContextValue,
    ...authContextValue,
  };

  const testQueryClient = createTestQueryClient();

  return (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={testQueryClient}>
        <I18nextProvider i18n={i18n}>
          <AuthContext.Provider value={mergedAuthContextValue}>
            {children}
          </AuthContext.Provider>
        </I18nextProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { initialEntries, authContextValue, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders
        initialEntries={initialEntries ?? ['/']}
        authContextValue={authContextValue}
      >
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Mock user object for testing
const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'Test User',
  countryCode: 'US',
  registrationDate: '2023-01-01T00:00:00Z',
  lastLoginDate: '2023-01-01T00:00:00Z',
  isActive: true,
  role: 'admin' as const,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
};

// Mock auth context values
export const mockAuthContextValues = {
  authenticated: {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
  },
  unauthenticated: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
  },
  loading: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
  },
  error: {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: 'Authentication failed',
    login: jest.fn(),
    logout: jest.fn(),
  },
};

// Helper function to create mock form event
export const createMockFormEvent = (formData: Record<string, any>) => ({
  preventDefault: jest.fn(),
  target: {
    elements: Object.keys(formData).reduce((acc, key) => {
      acc[key] = { value: formData[key] };
      return acc;
    }, {} as any),
  },
});

// Helper function to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };