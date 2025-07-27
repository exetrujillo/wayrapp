/**
 * # Testing Guide for WayrApp
 * 
 * This file contains **critical** documentation about testing in WayrApp, including setup,
 * best practices, and troubleshooting information.
 * 
 * @module TestInfo
 * @category Testing
 * @category .Wayrapp
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * ```javascript
 * // Quick setup for testing
 * // 1. Create test database
 * // 2. Configure .env.test
 * // 3. Run: npm run test:db:setup
 * // 4. Run: npm run test:integration:safe
 * ```
 * 
 * # Testing Guide
 * 
 * This document provides information about testing in WayrApp, including setup, 
 * best practices, and troubleshooting.
 * 
 * ## 🛡️ Test Database Safety
 * 
 * **CRITICAL**: WayrApp uses a separate test database to prevent production data loss. 
 * Tests perform complete database cleanup after each test, which would 
 * **delete all production data** if run against the production database.
 * 
 * **ARCHITECTURAL DECISION**: ALL tests (unit and integration) require a test database 
 * configuration via `.env.test`. This is intentional to enforce security and prevent 
 * accidental production data loss across the entire development team.
 * 
 * ### Safety Measures
 * - ✅ **Mandatory test database** - ALL tests require `.env.test` configuration
 * - ✅ **Automatic validation** prevents accidental use of production database
 * - ✅ **Safe test commands** that setup test database before running tests
 * - ✅ **Database isolation** with complete cleanup after each test
 * - ✅ **Team consistency** - All developers must follow the same setup process
 * 
 * ## 🚀 Quick Setup
 * **REQUIRED FOR ALL TESTS** - You cannot run any tests without this setup.
 * 
 * ### 1. Create Test Database
 * Create a separate database for testing (never use your production database):
 * 
 * **Option A: Using Neon (Recommended)**
 * 1. Go to Neon Console (https://console.neon.tech/)
 * 2. Create a new database or project for testing
 * 3. Copy the connection URL
 * 
 * **Option B: Local PostgreSQL**
 * ```bash
 * createdb wayrapp_test
 * ```
 * 
 * ### 2. Configure Test Environment
 * ```bash
 * # Copy example configuration
 * cp .env.example .env.test
 * # Edit .env.test with your test database URL
 * # IMPORTANT: Use a DIFFERENT database than production
 * ```
 * 
 * Example `.env.test`:
 * ```
 * NODE_ENV="test"
 * DATABASE_URL="postgresql://user:pass@host/wayrapp_test?sslmode=require"
 * JWT_SECRET="your-jwt-secret"
 * JWT_REFRESH_SECRET="your-refresh-secret"
 * PORT=3001
 * LOG_LEVEL="error"
 * BCRYPT_ROUNDS=4
 * ```
 * 
 * ### 3. Verify Configuration
 * ```bash
 * # Check that test and production databases are separate
 * npm run test:db:check
 * ```
 * 
 * ### 4. Setup Test Database
 * ```bash
 * # Initialize test database schema
 * npm run test:db:setup
 * ```
 * 
 * ## 🧪 Running Tests
 * 
 * ### Safe Commands (Recommended)
 * ```bash
 * # Setup test DB and run integration tests safely
 * npm run test:integration:safe
 * 
 * # Run all backend tests (unit + integration)
 * npm run test:backend
 * 
 * # Check test database configuration
 * npm run test:db:check
 * ```
 * 
 * ### Individual Test Commands
 * **NOTE**: All commands require test database configuration via `.env.test`
 * ```bash
 * # Unit tests (requires test database configuration)
 * npm test
 * 
 * # Integration tests (requires test database)
 * npm run test:integration
 * 
 * # Setup test database schema
 * npm run test:db:setup
 * ```
 * 
 * ### Watch Mode
 * **NOTE**: Requires test database configuration via `.env.test`
 * ```bash
 * # Run unit tests in watch mode (requires test database)
 * npm run test:watch
 * ```
 * 
 * ## 📁 Test Structure
 * 
 * ### Test Types
 * 
 * **IMPORTANT**: All test types require test database configuration for security.
 * 
 * 1. **Unit Tests** (`.test.ts`)
 *    - Fast, isolated tests
 *    - Mock external dependencies when possible
 *    - **Requires test database configuration** (architectural decision)
 * 
 * 2. **Integration Tests** (`.integration.test.ts`)
 *    - Full API endpoint testing
 *    - Uses test database extensively
 *    - Tests complete request/response cycle
 *    - **Requires test database configuration**
 * 
 * ### Test Organization
 * ```
 * src/
 * ├── __tests__/                      # Integration tests
 * │   └── integration/                # Cross-module integration tests
 * │       ├── auth.integration.test.ts
 * │       ├── content.integration.test.ts
 * │       ├── database.integration.test.ts
 * │       ├── crossModule.integration.test.ts
 * │       └── errorHandling.integration.test.ts
 * ├── modules/                        # Feature modules (domain-driven design)
 * │   ├── users/                      # User management & authentication
 * │   │   ├── controllers/
 * │   │   │   └── __tests__/          # Controller unit tests
 * │   │   │       ├── userController.test.ts
 * │   │   │       └── authController.test.ts
 * │   │   ├── services/
 * │   │   │   └── userService.test.ts # Service unit tests
 * │   │   ├── routes/
 * │   │   │   └── __tests__/          # Route unit tests
 * │   │   │       ├── userRoutes.test.ts
 * │   │   │       └── authRoutes.test.ts
 * │   │   └── __tests__/              # Module integration tests
 * │   ├── content/                    # Course content management
 * │   │   ├── controllers/
 * │   │   │   └── __tests__/          # Content controller tests
 * │   │   ├── services/
 * │   │   │   └── __tests__/          # Content service tests
 * │   │   │       └── ContentService.test.ts
 * │   │   └── __tests__/              # Content module tests
 * │   │       ├── packagedContent.test.ts
 * │   │       ├── packagedContentController.test.ts
 * │   │       └── contentService.integration.test.ts
 * │   └── progress/                   # Progress tracking & gamification
 * │       ├── controllers/
 * │       ├── services/
 * │       │   └── __tests__/          # Progress service tests
 * │       │       └── progressService.test.ts
 * │       └── __tests__/              # Progress module tests
 * │           └── progressController.integration.test.ts
 * └── shared/                         # Shared utilities and infrastructure
 *     ├── database/
 *     │   └── __tests__/              # Database utility tests
 *     │       └── optimization.test.ts
 *     ├── middleware/
 *     │   └── __tests__/              # Middleware tests
 *     │       ├── integration.test.ts
 *     │       ├── index.test.ts
 *     │       └── errorHandler.test.ts
 *     ├── schemas/
 *     │   └── __tests__/              # Schema validation tests
 *     │       ├── validation.test.ts
 *     │       └── common.test.ts
 *     ├── utils/
 *     │   └── __tests__/              # Utility function tests
 *     └── test/                       # Test utilities and setup
 *         ├── factories/              # Test data factories
 *         │   ├── userFactory.ts
 *         │   └── contentFactory.ts
 *         ├── fixtures/               # Test fixtures
 *         ├── utils/                  # Test helper functions
 *         │   └── __tests__/
 *         │       └── setupServiceTest.test.ts
 *         ├── setup.ts                # Global test configuration
 *         ├── testDb.ts               # Test database utilities
 *         └── mocks.ts                # Global mocks
 * ```
 * 
 * ## 🔧 Test Configuration
 * 
 * ### Jest Configuration
 * - **Unit Tests**: `jest.config.js`
 * - **Integration Tests**: `jest.integration.config.js`
 * 
 * ### Key Configuration Features
 * - **Separate test environment** with `NODE_ENV=test`
 * - **Database isolation** with automatic cleanup
 * - **Longer timeouts** for integration tests (30s)
 * - **Sequential execution** to avoid database conflicts
 * - **TypeScript support** with path mapping
 * 
 * ## 🏭 Test Data Factories
 * 
 * Use factories to create consistent test data:
 * 
 * ```typescript
 * import { UserFactory } from '@/shared/test/factories/userFactory';
 * import { CourseFactory } from '@/shared/test/factories/contentFactory';
 * 
 * // Create test user
 * const testUser = await prisma.user.create({
 *   data: UserFactory.build({
 *     email: 'test@example.com'
 *   })
 * });
 * 
 * // Create test course
 * const testCourse = await prisma.course.create({
 *   data: CourseFactory.build({
 *     name: 'Test Course'
 *   })
 * });
 * ```
 * 
 * ## 🛠️ Writing Tests
 * 
 * ### Unit Test Example
 * ```typescript
 * // src/modules/users/services/userService.test.ts
 * import { UserService } from './userService';
 * import { prisma } from '@/shared/database/connection';
 * 
 * // Mock Prisma
 * jest.mock('@/shared/database/connection', () => ({
 *   prisma: {
 *     user: {
 *       findUnique: jest.fn(),
 *       create: jest.fn(),
 *     }
 *   }
 * }));
 * 
 * describe('UserService', () => {
 *   beforeEach(() => {
 *     jest.clearAllMocks();
 *   });
 * 
 *   it('should find user by email', async () => {
 *     const mockUser = { id: '1', email: 'test@example.com' };
 *     (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
 * 
 *     const result = await UserService.findByEmail('test@example.com');
 *     
 *     expect(result).toEqual(mockUser);
 *     expect(prisma.user.findUnique).toHaveBeenCalledWith({
 *       where: { email: 'test@example.com' }
 *     });
 *   });
 * });
 * ```
 * 
 * ### Integration Test Example
 * ```typescript
 * // src/__tests__/integration/auth.integration.test.ts
 * import request from 'supertest';
 * import app from '../../app';
 * import { prisma } from '../../shared/database/connection';
 * 
 * describe('Authentication Integration Tests', () => {
 *   afterEach(async () => {
 *     // Clean up test data
 *     await prisma.user.deleteMany();
 *     await prisma.revokedToken.deleteMany();
 *   });
 * 
 *   afterAll(async () => {
 *     await prisma.$disconnect();
 *   });
 * 
 *   it('should register a new user', async () => {
 *     const userData = {
 *       email: 'test@example.com',
 *       password: 'SecurePass123!',
 *       username: 'testuser'
 *     };
 * 
 *     const response = await request(app)
 *       .post('/api/v1/auth/register')
 *       .send(userData)
 *       .expect(201);
 * 
 *     expect(response.body.success).toBe(true);
 *     expect(response.body.data.user.email).toBe(userData.email);
 *   });
 * });
 * ```
 * 
 * ## 🚨 Troubleshooting
 * 
 * ### Common Issues
 * 
 * #### 1. "No test database configured" Error
 * **Problem**: ALL tests fail with database configuration error.
 * **Cause**: This is intentional - our architectural decision requires test database for all tests.
 * **Solution**:
 * ```bash
 * # Check configuration
 * npm run test:db:check
 * 
 * # Create .env.test file (REQUIRED for all tests)
 * cp .env.example .env.test
 * # Edit .env.test with test database URL
 * 
 * # Setup test database
 * npm run test:db:setup
 * ```
 * 
 * #### 2. "Test and production databases are the same" Error
 * **Problem**: Safety check prevents using production database for tests.
 * **Solution**:
 * - Create a separate test database
 * - Update `.env.test` with the test database URL
 * - Ensure the test database URL is different from production
 * 
 * #### 3. Database Connection Errors
 * **Problem**: Tests fail to connect to test database.
 * **Solution**:
 * - Verify test database exists and is accessible
 * - Check connection string format in `.env.test`
 * - Ensure database permissions are correct
 * 
 * #### 4. Schema Sync Issues
 * **Problem**: Tests fail due to outdated database schema.
 * **Solution**:
 * ```bash
 * # Reset and update test database schema
 * npm run test:db:setup
 * ```
 * 
 * #### 5. Rate Limiting in Tests
 * **Problem**: Authentication tests fail due to rate limiting.
 * **Solution**: Tests include automatic rate limit handling with retries and graceful skipping.
 * 
 * ### Debug Mode
 * Run tests with verbose output:
 * ```bash
 * # Verbose test output
 * npm run test:integration -- --verbose
 * 
 * # Debug specific test file
 * npm run test:integration -- --testNamePattern="Authentication"
 * ```
 * 
 * ## 📊 Test Coverage
 * Generate test coverage reports:
 * ```bash
 * # Generate coverage report
 * npm run test:coverage
 * 
 * # View coverage report
 * open coverage/lcov-report/index.html
 * ```
 * 
 * ## 🔄 Continuous Integration
 * Tests run automatically in CI/CD pipelines:
 * ```yaml
 * # .github/workflows/test.yml
 * - name: Setup Test Database
 *   run: npm run test:db:setup
 * 
 * - name: Run Tests
 *   run: npm run test:backend
 * ```
 * 
 * ## 📝 Best Practices
 * 
 * ### Test Writing
 * 1. **Use descriptive test names** that explain what is being tested
 * 2. **Follow AAA pattern**: Arrange, Act, Assert
 * 3. **Clean up test data** in `afterEach` hooks
 * 4. **Use factories** for consistent test data creation
 * 5. **Mock external dependencies** in unit tests
 * 6. **Test error cases** as well as success cases
 * 
 * ### Database Testing
 * 1. **Always use test database** - never test against production
 * 2. **Clean up after each test** to ensure test isolation
 * 3. **Use transactions** for faster test cleanup when possible
 * 4. **Test database constraints** and relationships
 * 5. **Verify cascading deletes** work correctly
 * 
 * ### Performance
 * 1. **Keep unit tests fast** (< 100ms each)
 * 2. **Limit integration test scope** to essential functionality
 * 3. **Use `beforeAll`/`afterAll`** for expensive setup/teardown
 * 4. **Run integration tests sequentially** to avoid conflicts
 * 
 * ## 🔗 Related Documentation
 * - Backend & Ecosystem Documentation: https://exetrujillo.github.io/wayrapp/
 * - Database Schema: See README.md#database-schema
 * - Contributing Guidelines: See README.md#contributing
 */

/**
 * Test Information and Configuration
 * 
 * This object contains metadata about the testing setup and configuration
 * for the WayrApp project.
 */
export const testInfo = {
    /** Current testing framework version */
    framework: 'Jest',

    /** Test database safety status */
    databaseSafety: 'ENABLED',

    /** Available test commands - ALL require test database configuration */
    commands: {
        unit: 'npm test (requires .env.test)',
        integration: 'npm run test:integration (requires .env.test)',
        integrationSafe: 'npm run test:integration:safe (sets up DB + runs tests)',
        backend: 'npm run test:backend (requires .env.test)',
        setup: 'npm run test:db:setup (initializes test database)',
        check: 'npm run test:db:check (validates test configuration)',
        watch: 'npm run test:watch (requires .env.test)',
        coverage: 'npm run test:coverage (requires .env.test)'
    },

    /** Test environment requirements */
    requirements: {
        nodeVersion: '18+',
        testDatabase: 'MANDATORY (separate from production)',
        envFile: '.env.test (required for all tests)',
        jestConfig: ['jest.config.js', 'jest.integration.config.js'],
        architecturalDecision: 'All tests require test DB - intentional for security'
    },

    /** Safety measures implemented */
    safetyMeasures: [
        'Mandatory test database for all tests',
        'Separate test database validation',
        'Automatic database cleanup after tests',
        'Production database protection',
        'Test environment isolation',
        'Team consistency enforcement'
    ]
} as const;
