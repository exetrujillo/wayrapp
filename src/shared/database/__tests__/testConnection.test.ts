/**
 * Database Connection Test Utility Test Suite
 * 
 * Comprehensive test coverage for the database connection testing utility
 * specifically designed for WayrApp Sovereign Node deployment verification.
 * 
 * ## Test Coverage Areas
 * 
 * **testDatabaseConnection Function:**
 * - Successful database connection and query execution
 * - Schema verification with existing tables
 * - Schema verification with missing tables (pre-migration state)
 * - Connection failure handling
 * - Query execution failure handling
 * - Proper resource cleanup (disconnect)
 * - Logging behavior for all scenarios
 * 
 * ## Testing Philosophy
 * 
 * These tests ensure that community administrators can rely on the database
 * connection testing utility for deployment verification and troubleshooting
 * without requiring deep database expertise. Each test validates both success
 * scenarios and error handling to maintain platform stability.
 * 
 * ## Mock Strategy
 * 
 * Uses comprehensive Prisma client mocking to simulate various database
 * states and failure conditions without requiring actual database connections,
 * enabling fast and reliable test execution in CI/CD environments.
 * 
 * @author Exequiel Trujillo
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * Mock Prisma Client for Database Connection Tests
 * 
 * Comprehensive mock implementation that simulates all Prisma client methods
 * used by the database connection testing utility. This mock enables testing
 * various database states and failure conditions.
 * 
 * **Mocked Methods:**
 * - `$connect`: For database connection testing
 * - `$disconnect`: For resource cleanup verification
 * - `$queryRaw`: For SQL query execution testing
 * - `user.count`: For schema verification testing
 */
const mockPrisma = {
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn(),
    user: {
        count: jest.fn(),
    },
};

/**
 * Mock Logger for Database Connection Tests
 * 
 * Mocks the logger to capture and verify logging behavior during
 * database connection testing without producing actual console output.
 */
const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};

// Mock the prisma connection
jest.mock('../connection', () => ({
    prisma: mockPrisma,
}));

// Mock the logger to prevent actual logging during tests
jest.mock('@/shared/utils/logger', () => ({
    logger: mockLogger,
}));

import { testDatabaseConnection } from '../testConnection';

/**
 * Database Connection Test Utility Test Suite
 * 
 * Tests the main database connection testing function that provides
 * comprehensive connectivity verification for community-owned educational
 * platforms. Each test validates specific functionality while ensuring
 * graceful error handling for production stability.
 */
describe('testDatabaseConnection', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    /**
     * Successful Connection Tests
     * 
     * Validates the complete success path where database connection,
     * query execution, and schema verification all succeed.
     */
    describe('successful connection scenarios', () => {
        /**
         * Test complete success path with schema verification.
         * Verifies that all three phases of testing pass and appropriate
         * success messages are logged.
         */
        it('should return true when all database tests pass successfully', async () => {
            // Mock successful connection
            mockPrisma.$connect.mockResolvedValue(undefined);

            // Mock successful query execution
            const mockQueryResult = [{ test: 1 }];
            mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

            // Mock successful schema verification
            const mockUserCount = 5;
            mockPrisma.user.count.mockResolvedValue(mockUserCount);

            // Mock successful disconnect
            mockPrisma.$disconnect.mockResolvedValue(undefined);

            const result = await testDatabaseConnection();

            expect(result).toBe(true);

            // Verify all phases were executed
            expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
            expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
            expect(mockPrisma.user.count).toHaveBeenCalledTimes(1);
            expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);

            // Verify success logging
            expect(mockLogger.info).toHaveBeenCalledWith('Testing database connection...');
            expect(mockLogger.info).toHaveBeenCalledWith('✅ Database connection successful');
            expect(mockLogger.info).toHaveBeenCalledWith('✅ Database query test successful', { result: mockQueryResult });
            expect(mockLogger.info).toHaveBeenCalledWith('✅ Database schema verified', { userCount: mockUserCount });

            // Verify no error logging
            expect(mockLogger.error).not.toHaveBeenCalled();
        });

        /**
         * Test success path with missing schema (pre-migration state).
         * Verifies that schema verification failure is treated as a warning,
         * not an error, and the overall test still passes.
         */
        it('should return true and log warning when schema is not migrated', async () => {
            // Mock successful connection
            mockPrisma.$connect.mockResolvedValue(undefined);

            // Mock successful query execution
            const mockQueryResult = [{ test: 1 }];
            mockPrisma.$queryRaw.mockResolvedValue(mockQueryResult);

            // Mock schema verification failure (table doesn't exist)
            mockPrisma.user.count.mockRejectedValue(new Error('relation "users" does not exist'));

            // Mock successful disconnect
            mockPrisma.$disconnect.mockResolvedValue(undefined);

            const result = await testDatabaseConnection();

            expect(result).toBe(true);

            // Verify connection and query phases succeeded
            expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
            expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);
            expect(mockPrisma.user.count).toHaveBeenCalledTimes(1);
            expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);

            // Verify success logging for connection and query
            expect(mockLogger.info).toHaveBeenCalledWith('Testing database connection...');
            expect(mockLogger.info).toHaveBeenCalledWith('✅ Database connection successful');
            expect(mockLogger.info).toHaveBeenCalledWith('✅ Database query test successful', { result: mockQueryResult });

            // Verify warning for missing schema
            expect(mockLogger.warn).toHaveBeenCalledWith('⚠️  Database schema not yet migrated', {
                message: 'Run migrations to create tables'
            });

            // Verify no error logging
            expect(mockLogger.error).not.toHaveBeenCalled();
        });
    });

    /**
     * Connection Failure Tests
     * 
     * Validates error handling when database connection fails,
     * ensuring graceful degradation and proper error reporting.
     */
    describe('connection failure scenarios', () => {
        /**
         * Test connection failure handling.
         * Verifies that connection failures are properly caught, logged,
         * and result in a false return value.
         */
        it('should return false and log error when database connection fails', async () => {
            const connectionError = new Error('Connection refused');

            // Mock connection failure
            mockPrisma.$connect.mockRejectedValue(connectionError);

            // Mock successful disconnect (cleanup should still happen)
            mockPrisma.$disconnect.mockResolvedValue(undefined);

            const result = await testDatabaseConnection();

            expect(result).toBe(false);

            // Verify connection was attempted
            expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);

            // Verify query and schema verification were not attempted
            expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
            expect(mockPrisma.user.count).not.toHaveBeenCalled();

            // Verify cleanup still happened
            expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);

            // Verify error logging
            expect(mockLogger.info).toHaveBeenCalledWith('Testing database connection...');
            expect(mockLogger.error).toHaveBeenCalledWith('❌ Database connection failed', {
                error: connectionError.message
            });
        });

        /**
         * Test query execution failure handling.
         * Verifies that query failures are properly caught, logged,
         * and result in a false return value.
         */
        it('should return false and log error when database query fails', async () => {
            const queryError = new Error('Query execution failed');

            // Mock successful connection
            mockPrisma.$connect.mockResolvedValue(undefined);

            // Mock query failure
            mockPrisma.$queryRaw.mockRejectedValue(queryError);

            // Mock successful disconnect
            mockPrisma.$disconnect.mockResolvedValue(undefined);

            const result = await testDatabaseConnection();

            expect(result).toBe(false);

            // Verify connection and query were attempted
            expect(mockPrisma.$connect).toHaveBeenCalledTimes(1);
            expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);

            // Verify schema verification was not attempted
            expect(mockPrisma.user.count).not.toHaveBeenCalled();

            // Verify cleanup still happened
            expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);

            // Verify error logging
            expect(mockLogger.info).toHaveBeenCalledWith('Testing database connection...');
            expect(mockLogger.info).toHaveBeenCalledWith('✅ Database connection successful');
            expect(mockLogger.error).toHaveBeenCalledWith('❌ Database connection failed', {
                error: queryError.message
            });
        });

        /**
         * Test handling of non-Error exceptions.
         * Verifies that non-Error objects thrown during testing are
         * properly handled and logged as unknown errors.
         */
        it('should handle non-Error exceptions gracefully', async () => {
            const nonErrorException = 'String error';

            // Mock connection failure with non-Error object
            mockPrisma.$connect.mockRejectedValue(nonErrorException);

            // Mock successful disconnect
            mockPrisma.$disconnect.mockResolvedValue(undefined);

            const result = await testDatabaseConnection();

            expect(result).toBe(false);

            // Verify cleanup still happened
            expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);

            // Verify error logging with unknown error message
            expect(mockLogger.error).toHaveBeenCalledWith('❌ Database connection failed', {
                error: 'Unknown error'
            });
        });
    });

    /**
     * Resource Management Tests
     * 
     * Validates that database connections are properly cleaned up
     * regardless of test outcomes, preventing connection leaks.
     */
    describe('resource management', () => {
        /**
         * Test that disconnect is called even when connection fails.
         * Verifies that resource cleanup happens in the finally block
         * regardless of success or failure.
         */
        it('should always disconnect from database even on connection failure', async () => {
            // Mock connection failure
            mockPrisma.$connect.mockRejectedValue(new Error('Connection failed'));

            // Mock successful disconnect
            mockPrisma.$disconnect.mockResolvedValue(undefined);

            await testDatabaseConnection();

            // Verify disconnect was called despite connection failure
            expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
        });

        /**
         * Test that disconnect is called even when query fails.
         * Verifies that resource cleanup happens even when intermediate
         * operations fail.
         */
        it('should always disconnect from database even on query failure', async () => {
            // Mock successful connection
            mockPrisma.$connect.mockResolvedValue(undefined);

            // Mock query failure
            mockPrisma.$queryRaw.mockRejectedValue(new Error('Query failed'));

            // Mock successful disconnect
            mockPrisma.$disconnect.mockResolvedValue(undefined);

            await testDatabaseConnection();

            // Verify disconnect was called despite query failure
            expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
        });

        /**
         * Test that disconnect failures are propagated as errors.
         * Verifies that disconnect errors in the finally block are not caught
         * and will cause the function to throw. This reflects the current
         * implementation behavior.
         */
        it('should propagate disconnect failures as unhandled errors', async () => {
            // Mock successful connection and query
            mockPrisma.$connect.mockResolvedValue(undefined);
            mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
            mockPrisma.user.count.mockResolvedValue(5);

            // Mock disconnect failure
            const disconnectError = new Error('Disconnect failed');
            mockPrisma.$disconnect.mockRejectedValue(disconnectError);

            // Should throw the disconnect error
            await expect(testDatabaseConnection()).rejects.toThrow('Disconnect failed');
            expect(mockPrisma.$disconnect).toHaveBeenCalledTimes(1);
        });
    });

    /**
     * Logging Behavior Tests
     * 
     * Validates that appropriate log messages are generated for
     * different scenarios to help community administrators troubleshoot
     * database connectivity issues.
     */
    describe('logging behavior', () => {
        /**
         * Test that all success phases generate appropriate log messages.
         * Verifies that community administrators get clear feedback
         * about each phase of the database testing process.
         */
        it('should log appropriate messages for each testing phase', async () => {
            // Mock all successful operations
            mockPrisma.$connect.mockResolvedValue(undefined);
            mockPrisma.$queryRaw.mockResolvedValue([{ test: 1 }]);
            mockPrisma.user.count.mockResolvedValue(3);
            mockPrisma.$disconnect.mockResolvedValue(undefined);

            await testDatabaseConnection();

            // Verify logging sequence
            expect(mockLogger.info).toHaveBeenNthCalledWith(1, 'Testing database connection...');
            expect(mockLogger.info).toHaveBeenNthCalledWith(2, '✅ Database connection successful');
            expect(mockLogger.info).toHaveBeenNthCalledWith(3, '✅ Database query test successful', { result: [{ test: 1 }] });
            expect(mockLogger.info).toHaveBeenNthCalledWith(4, '✅ Database schema verified', { userCount: 3 });
        });

        /**
         * Test that error scenarios generate appropriate error messages.
         * Verifies that connection failures provide actionable information
         * for troubleshooting.
         */
        it('should log detailed error information for troubleshooting', async () => {
            const detailedError = new Error('ECONNREFUSED: Connection refused at localhost:5432');

            mockPrisma.$connect.mockRejectedValue(detailedError);
            mockPrisma.$disconnect.mockResolvedValue(undefined);

            await testDatabaseConnection();

            expect(mockLogger.error).toHaveBeenCalledWith('❌ Database connection failed', {
                error: detailedError.message
            });
        });
    });
});
