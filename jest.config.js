/**
 * Root Jest Configuration for Monorepo
 * This configuration serves as the base for all workspaces
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/app.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/shared/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 10000,
  forceExit: true,
  detectOpenHandles: true,
  
  // Monorepo specific settings
  projects: [
    '<rootDir>',
    '<rootDir>/frontend-creator',
    '<rootDir>/frontend-mobile',
    '<rootDir>/frontend-shared'
  ],
  
  // Global settings for all projects
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  
  // Shared settings that can be extended by workspace configs
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node']
};