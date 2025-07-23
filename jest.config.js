/**
 * Jest Configuration for Unit Tests (Backend)
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],

  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/integration/'
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