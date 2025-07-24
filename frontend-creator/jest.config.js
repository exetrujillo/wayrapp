/**
 * Jest Configuration for Frontend Creator
 * Updated to work with current Vite setup without vite-jest
 */
module.exports = {
  // Browser environment simulation
  testEnvironment: 'jsdom',

  // Load our setup file before each test
  setupFiles: ['<rootDir>/src/__tests__/jest-setup.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // Transform TypeScript and JSX files
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },

  // Module name mappers for CSS and other assets
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/config/environment$': '<rootDir>/src/__tests__/mocks/environment.mock.ts',
    '^\\.\\./config/environment$': '<rootDir>/src/__tests__/mocks/environment.mock.ts',
    '^\\.\\./\\.\\./config/environment$': '<rootDir>/src/__tests__/mocks/environment.mock.ts',
    '^\\.\\./\\.\\./\\.\\./config/environment$': '<rootDir>/src/__tests__/mocks/environment.mock.ts',
    '^\\.\\./config/environment$': '<rootDir>/src/__tests__/mocks/environment.mock.ts',
    '^\\.\\./\\.\\./mocks/handlers$': '<rootDir>/src/__tests__/mocks/handlers.mock.ts',
    '^\\.\\./\\.\\./\\.\\./mocks/handlers$': '<rootDir>/src/__tests__/mocks/handlers.mock.ts',
    '^\\./config/environment$': '<rootDir>/src/__tests__/mocks/environment.mock.ts',
  },

  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test match patterns - only match actual test files
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx|js)',
    '<rootDir>/src/**/__tests__/**/*.spec.(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
  ],
};