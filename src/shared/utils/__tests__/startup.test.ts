// src/shared/utils/__tests__/startup.test.ts

/**
 * Test suite for the startup utility module, covering node initialization and health check functionality.
 * 
 * These tests verify that the StartupManager correctly orchestrates application initialization sequences,
 * handles database optimization, cache warming, health monitoring, and graceful shutdown procedures.
 * The test suite validates the complete startup lifecycle for WayrApp sovereign nodes, ensuring proper
 * error handling, resource management, and system health verification across different deployment scenarios.
 * Tests cover both the StartupManager class methods and the singleton instance behavior, including
 * process signal handlers and maintenance task scheduling.
 * 
 * @fileoverview Unit tests for startup.ts - node initialization and health check utilities
 * @author Exequiel Trujillo
  * 
 * @since 1.0.0
 */

// Mock dependencies
const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
};
jest.mock('../logger', () => ({
    logger: mockLogger,
}));

const mockCacheService = {
    warmUp: jest.fn(),
    cleanup: jest.fn(),
    clear: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
    getStats: jest.fn().mockReturnValue({
        size: 10,
        hitRate: 85,
        memoryUsage: 1024,
    }),
};
const mockCacheKeys = {
    POPULAR_COURSES: jest.fn().mockReturnValue('popular_courses'),
    HEALTH_CHECK: jest.fn().mockReturnValue('health_check'),
    DB_METRICS: jest.fn().mockReturnValue('db_metrics'),
};
jest.mock('../cache', () => ({
    cacheService: mockCacheService,
    CACHE_KEYS: mockCacheKeys,
}));

const mockDatabaseOptimizer = {
    createPerformanceIndexes: jest.fn(),
    optimizeConfiguration: jest.fn(),
    cleanupExpiredData: jest.fn(),
    getDatabaseInfo: jest.fn().mockResolvedValue({ info: 'test' }),
    runPerformanceAnalysis: jest.fn().mockResolvedValue({
        database_info: {
            database: [{ database_size: '100MB' }],
            tables: ['table1', 'table2'],
        },
    }),
};
jest.mock('@/shared/database/optimization', () => ({
    DatabaseOptimizer: jest.fn().mockImplementation(() => mockDatabaseOptimizer),
}));

const mockPrisma = {
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
    course: {
        findMany: jest.fn().mockResolvedValue([
            { id: '1', title: 'Test Course', isPublic: true },
        ]),
    },
};
jest.mock('@/shared/database/connection', () => ({
    prisma: mockPrisma,
}));

// Import the module after mocking
import { StartupManager, startupManager } from '../startup';

describe('StartupManager', () => {
    let startupManagerInstance: StartupManager;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.clearAllTimers();
        jest.useFakeTimers();
        startupManagerInstance = new StartupManager();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('constructor', () => {
        it('should create a new StartupManager instance', () => {
            expect(startupManagerInstance).toBeInstanceOf(StartupManager);
        });

        it('should initialize DatabaseOptimizer with prisma client', () => {
            const { DatabaseOptimizer } = require('@/shared/database/optimization');
            expect(DatabaseOptimizer).toHaveBeenCalledWith(mockPrisma);
        });
    });

    describe('initialize', () => {
        it('should complete initialization successfully', async () => {
            mockDatabaseOptimizer.createPerformanceIndexes.mockResolvedValue(undefined);
            mockDatabaseOptimizer.optimizeConfiguration.mockResolvedValue(undefined);
            mockDatabaseOptimizer.cleanupExpiredData.mockResolvedValue(undefined);
            mockCacheService.warmUp.mockResolvedValue(undefined);

            await startupManagerInstance.initialize();

            expect(mockLogger.info).toHaveBeenCalledWith('Starting application initialization...');
            expect(mockLogger.info).toHaveBeenCalledWith('Application initialization completed successfully');
        });

        it('should handle database optimization errors gracefully', async () => {
            const error = new Error('Database optimization failed');
            mockDatabaseOptimizer.createPerformanceIndexes.mockRejectedValue(error);
            mockCacheService.warmUp.mockResolvedValue(undefined);

            await startupManagerInstance.initialize();

            expect(mockLogger.warn).toHaveBeenCalledWith('Database optimization partially failed', { error });
            expect(mockLogger.info).toHaveBeenCalledWith('Application initialization completed successfully');
        });

        it('should handle cache warm-up errors gracefully', async () => {
            mockDatabaseOptimizer.createPerformanceIndexes.mockResolvedValue(undefined);
            mockDatabaseOptimizer.optimizeConfiguration.mockResolvedValue(undefined);
            mockDatabaseOptimizer.cleanupExpiredData.mockResolvedValue(undefined);

            const error = new Error('Cache warm-up failed');
            mockCacheService.warmUp.mockRejectedValue(error);

            await startupManagerInstance.initialize();

            expect(mockLogger.warn).toHaveBeenCalledWith('Cache warm-up partially failed', { error });
            expect(mockLogger.info).toHaveBeenCalledWith('Application initialization completed successfully');
        });

        it('should throw error if critical initialization fails', async () => {
            const error = new Error('Critical initialization failure');
            mockDatabaseOptimizer.createPerformanceIndexes.mockResolvedValue(undefined);
            mockDatabaseOptimizer.optimizeConfiguration.mockResolvedValue(undefined);
            mockDatabaseOptimizer.cleanupExpiredData.mockResolvedValue(undefined);
            mockCacheService.warmUp.mockRejectedValue(error);

            // Mock a critical failure by making the entire initialization throw
            jest.spyOn(startupManagerInstance as any, 'warmUpCache').mockRejectedValue(error);

            await expect(startupManagerInstance.initialize()).rejects.toThrow('Critical initialization failure');
            expect(mockLogger.error).toHaveBeenCalledWith('Application initialization failed', { error });
        });

        it('should set up maintenance tasks', async () => {
            mockDatabaseOptimizer.createPerformanceIndexes.mockResolvedValue(undefined);
            mockDatabaseOptimizer.optimizeConfiguration.mockResolvedValue(undefined);
            mockDatabaseOptimizer.cleanupExpiredData.mockResolvedValue(undefined);
            mockCacheService.warmUp.mockResolvedValue(undefined);

            await startupManagerInstance.initialize();

            expect(mockLogger.info).toHaveBeenCalledWith('Setting up maintenance tasks...');
            expect(mockLogger.info).toHaveBeenCalledWith('Maintenance tasks configured');
        });
    });

    describe('shutdown', () => {
        it('should complete shutdown successfully', async () => {
            mockCacheService.clear.mockResolvedValue(undefined);
            mockPrisma.$disconnect.mockResolvedValue(undefined);

            await startupManagerInstance.shutdown();

            expect(mockLogger.info).toHaveBeenCalledWith('Starting graceful shutdown...');
            expect(mockCacheService.clear).toHaveBeenCalled();
            expect(mockPrisma.$disconnect).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Graceful shutdown completed');
        });

        it('should handle shutdown errors gracefully', async () => {
            const error = new Error('Shutdown failed');
            mockCacheService.clear.mockRejectedValue(error);

            await startupManagerInstance.shutdown();

            expect(mockLogger.error).toHaveBeenCalledWith('Graceful shutdown failed', { error });
        });
    });

    describe('healthCheck', () => {
        it('should return true when all health checks pass', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
            mockCacheService.set.mockResolvedValue(undefined);
            mockCacheService.get.mockResolvedValue('ok');
            mockCacheService.delete.mockResolvedValue(undefined);

            const result = await startupManagerInstance.healthCheck();

            expect(result).toBe(true);
            expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(expect.arrayContaining(['SELECT 1']));
            expect(mockCacheService.set).toHaveBeenCalledWith('startup_test', 'ok', 1000);
            expect(mockCacheService.get).toHaveBeenCalledWith('startup_test');
            expect(mockCacheService.delete).toHaveBeenCalledWith('startup_test');
        });

        it('should return false when database check fails', async () => {
            const error = new Error('Database connection failed');
            mockPrisma.$queryRaw.mockRejectedValue(error);

            const result = await startupManagerInstance.healthCheck();

            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith('Startup health check failed', { error });
        });

        it('should return false when cache test fails', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
            mockCacheService.set.mockResolvedValue(undefined);
            mockCacheService.get.mockResolvedValue('wrong_value');

            const result = await startupManagerInstance.healthCheck();

            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith('Startup health check failed', {
                error: expect.objectContaining({ message: 'Cache test failed' })
            });
        });

        it('should return false when cache operations fail', async () => {
            mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
            const error = new Error('Cache operation failed');
            mockCacheService.set.mockRejectedValue(error);

            const result = await startupManagerInstance.healthCheck();

            expect(result).toBe(false);
            expect(mockLogger.error).toHaveBeenCalledWith('Startup health check failed', { error });
        });
    });

    describe('maintenance tasks', () => {
        beforeEach(async () => {
            mockDatabaseOptimizer.createPerformanceIndexes.mockResolvedValue(undefined);
            mockDatabaseOptimizer.optimizeConfiguration.mockResolvedValue(undefined);
            mockDatabaseOptimizer.cleanupExpiredData.mockResolvedValue(undefined);
            mockCacheService.warmUp.mockResolvedValue(undefined);

            await startupManagerInstance.initialize();
        });

        it('should run cache cleanup periodically', () => {
            mockCacheService.cleanup.mockImplementation(() => { });

            // Fast-forward 10 minutes
            jest.advanceTimersByTime(10 * 60 * 1000);

            expect(mockCacheService.cleanup).toHaveBeenCalled();
            expect(mockLogger.debug).toHaveBeenCalledWith('Periodic cache cleanup completed');
        });

        it('should handle cache cleanup errors', () => {
            const error = new Error('Cache cleanup failed');
            mockCacheService.cleanup.mockImplementation(() => {
                throw error;
            });

            jest.advanceTimersByTime(10 * 60 * 1000);

            expect(mockLogger.warn).toHaveBeenCalledWith('Periodic cache cleanup failed', { error });
        });

        it('should run database cleanup periodically', () => {
            mockDatabaseOptimizer.cleanupExpiredData.mockResolvedValue(undefined);

            // Fast-forward 1 hour
            jest.advanceTimersByTime(60 * 60 * 1000);

            expect(mockDatabaseOptimizer.cleanupExpiredData).toHaveBeenCalled();
        });

        it('should handle database cleanup errors', () => {
            const error = new Error('Database cleanup failed');
            mockDatabaseOptimizer.cleanupExpiredData.mockRejectedValue(error);

            jest.advanceTimersByTime(60 * 60 * 1000);

            expect(mockDatabaseOptimizer.cleanupExpiredData).toHaveBeenCalled();
        });

        it('should run performance analysis periodically', () => {
            mockDatabaseOptimizer.runPerformanceAnalysis.mockResolvedValue({
                database_info: {
                    database: [{ database_size: '100MB' }],
                    tables: ['table1', 'table2'],
                },
            });

            // Fast-forward 6 hours
            jest.advanceTimersByTime(6 * 60 * 60 * 1000);

            expect(mockDatabaseOptimizer.runPerformanceAnalysis).toHaveBeenCalled();
        });

        it('should handle performance analysis errors', () => {
            const error = new Error('Performance analysis failed');
            mockDatabaseOptimizer.runPerformanceAnalysis.mockRejectedValue(error);

            jest.advanceTimersByTime(6 * 60 * 60 * 1000);

            expect(mockDatabaseOptimizer.runPerformanceAnalysis).toHaveBeenCalled();
        });

        it('should log cache statistics periodically', () => {
            mockCacheService.getStats.mockReturnValue({
                size: 15,
                hitRate: 92,
                memoryUsage: 2048,
            });

            // Fast-forward 30 minutes
            jest.advanceTimersByTime(30 * 60 * 1000);

            expect(mockCacheService.getStats).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Cache statistics', {
                size: 15,
                hitRate: '92%',
                memoryUsage: '2 KB',
            });
        });
    });
});

describe('startupManager singleton', () => {
    it('should export a singleton instance', () => {
        expect(startupManager).toBeInstanceOf(StartupManager);
    });

    it('should be the same instance when imported multiple times', () => {
        // Re-import to test singleton behavior
        const { startupManager: secondImport } = require('../startup');
        expect(startupManager).toBe(secondImport);
    });
});

describe('process signal handlers', () => {
    let originalProcessOn: typeof process.on;
    let mockProcessOn: jest.Mock;

    beforeEach(() => {
        originalProcessOn = process.on;
        mockProcessOn = jest.fn();
        process.on = mockProcessOn;

        // Clear the module cache to re-register handlers
        jest.resetModules();
    });

    afterEach(() => {
        process.on = originalProcessOn;
    });

    it('should register SIGINT handler', () => {
        require('../startup');

        expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });

    it('should register SIGTERM handler', () => {
        require('../startup');

        expect(mockProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });

    it('should register unhandledRejection handler', () => {
        require('../startup');

        expect(mockProcessOn).toHaveBeenCalledWith('unhandledRejection', expect.any(Function));
    });

    it('should register uncaughtException handler', () => {
        require('../startup');

        expect(mockProcessOn).toHaveBeenCalledWith('uncaughtException', expect.any(Function));
    });
});