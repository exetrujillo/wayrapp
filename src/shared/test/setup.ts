// Jest setup file for global test configuration
import { logger } from '@/shared/utils/logger';

// Suppress logs during testing
logger.silent = true;

// Global test setup
beforeAll(async () => {
  // Global setup before all tests
});

afterAll(async () => {
  // Global cleanup after all tests
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/wayrapp_test';