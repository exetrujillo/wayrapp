/**
 * Test utilities for common testing patterns
 * Provides custom render functions with providers and mocks
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { AuthProvider } from '../../contexts/AuthContext';
import i18n from '../i18n'; // Import the test i18n instance

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
  authContextValue?: any;
}

const AllTheProviders = ({
  children,
  initialEntries = ['/']
}: {
  children: React.ReactNode;
  initialEntries?: string[];
  authContextValue?: any;
}) => {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </I18nextProvider>
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

// Import mock API responses from the main mocks directory
import { mockApiResponses } from '../../mocks/handlers';

// Mock auth context values
export const mockAuthContextValues = {
  authenticated: {
    user: mockApiResponses.login.success.user,
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