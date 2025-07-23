/**
 * Jest Configuration for Unit Tests (Backend)
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],

  testMatch: [
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.spec.ts'
  ],

  testPathIgnorePatterns: [
    '/node_modules/',
    '/src/__tests__/integration/',
    '\\.integration\\.test\\.ts$'
  ],

  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },

  setupFilesAfterEnv: ['<rootDir>/src/shared/test/setup.ts'],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};