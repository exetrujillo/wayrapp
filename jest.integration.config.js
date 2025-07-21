/**
 * Jest Configuration for Integration Tests
 * Separate configuration for integration tests with longer timeouts and specific setup
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: [
    '**/__tests__/integration/**/*.test.ts',
    '**/*.integration.test.ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.integration.test.ts',
    '!src/app.ts',
    '!src/__tests__/**/*'
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/shared/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testTimeout: 30000, // Longer timeout for integration tests
  forceExit: true,
  detectOpenHandles: true,
  maxWorkers: 1, // Run integration tests sequentially to avoid database conflicts
  verbose: true,
  bail: false, // Continue running tests even if some fail
  
  // Integration test specific settings
  
  // Test result processors
  reporters: [
    'default'
  ]
};