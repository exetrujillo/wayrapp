// frontend-creator/jest.config.js

module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // Use babel-jest to transform files
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  
  moduleNameMapper: {
    // Handle module aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    // Handle CSS module mocks
    '\\.css$': 'identity-obj-proxy',
  },
  
  // Clean up old or conflicting configurations
  preset: undefined,
};