// Jest setup file for global test configuration
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
// import { logger } from "@/shared/utils/logger";
// import { prisma } from "@/shared/database/connection";
// import { cleanupTestDb } from "./testDb";

// Load test environment variables from .env.test file
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Ensure we're in test environment
process.env["NODE_ENV"] = "test";

// ARCHITECTURAL DECISION: Validate that we have a test database URL
// We intentionally require test database configuration for ALL tests (unit + integration)
// This enforces security and prevents accidental production data loss
const testDbUrl = process.env["DATABASE_URL"];
if (!testDbUrl) {
  console.error('⚠️  ERROR: No DATABASE_URL configured for tests!');
  console.error('Please check your .env.test file.');
  console.error('');
  console.error('ARCHITECTURAL DECISION: All tests require test database configuration');
  console.error('This is intentional to enforce security and team consistency.');
  console.error('');
  console.error('Quick setup:');
  console.error('1. cp .env.example .env.test');
  console.error('2. Edit .env.test with your TEST database URL');
  console.error('3. npm run test:db:setup');
  process.exit(1);
}

// Check if it's different from production database
let prodDbUrl = '';
try {
  const prodEnvPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(prodEnvPath)) {
    const prodEnv = fs.readFileSync(prodEnvPath, 'utf8');
    const match = prodEnv.match(/DATABASE_URL="([^"]+)"/);
    if (match && match[1]) {
      prodDbUrl = match[1];
    }
  }
} catch (error) {
  // Production .env not found, continue
}

if (prodDbUrl && testDbUrl === prodDbUrl) {
  console.error('🚨 CRITICAL ERROR: Test and production databases are THE SAME!');
  console.error('This means tests will DELETE your production data!');
  console.error('Please create a separate test database.');
  process.exit(1);
}

// Log confirmation that we're using a separate test database
if (prodDbUrl && testDbUrl !== prodDbUrl) {
  console.log('✅ Using separate test database - safe to run tests');
} else if (!testDbUrl.includes('test')) {
  console.log('⚠️  Note: Database URL does not contain "test" but appears to be configured for testing');
}

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
