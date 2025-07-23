// Jest setup file for global test configuration
import dotenv from "dotenv";
// import { logger } from "@/shared/utils/logger";
// import { prisma } from "@/shared/database/connection";
// import { cleanupTestDb } from "./testDb";

// Load environment variables from .env file
dotenv.config();

// Mock environment variables for testing (only if not already set)
process.env["NODE_ENV"] = "test";
process.env["JWT_SECRET"] = process.env["JWT_SECRET"] || "test-jwt-secret";
// Don't override DATABASE_URL if it's already set from .env file

// // Suppress logs during testing
// logger.silent = true;

// Set default test timeout
jest.setTimeout(30000);

// // Global test setup
// beforeAll(async () => {
//   // Global setup before all tests
// });

// afterAll(async () => {
//   // Global cleanup after all tests
//   await cleanupTestDb();
//   await prisma.$disconnect();
// });

// Add global test utilities
global.beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});
