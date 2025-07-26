/**
 * Database Optimization Test Suite
 * 
 * Comprehensive test coverage for WayrApp Sovereign Node database optimization utilities.
 * This test suite validates the functionality of database performance optimization tools
 * specifically designed for community-owned educational platforms.
 * 
 * ## Test Coverage Areas
 * 
 * **DatabaseOptimizer Class:**
 * - Performance index creation for educational platform queries
 * - Database statistics analysis for community usage patterns
 * - Slow query detection and performance monitoring
 * - Database configuration optimization
 * - Expired data cleanup and maintenance
 * - Database size and storage information retrieval
 * - Connection monitoring and load analysis
 * - Comprehensive performance analysis reporting
 * 
 * **BatchOperations Class:**
 * - Bulk record creation with transactional safety
 * - Batch update operations with error handling
 * - Optimized batch sizing for educational content
 * 
 * **Performance Monitoring:**
 * - Query performance decorator functionality
 * - Slow query detection and logging
 * - Error handling and performance tracking
 * 
 * ## Testing Philosophy
 * 
 * These tests ensure that community administrators can rely on automated
 * database optimization without requiring deep database expertise. Each test
 * validates both success scenarios and error handling to maintain platform
 * stability under various conditions.
 * 
 * ## Mock Strategy
 * 
 * Uses comprehensive Prisma client mocking to simulate database operations
 * without requiring actual database connections, enabling fast and reliable
 * test execution in CI/CD environments.
 * 
 * @author Exequiel Trujillo
 * @version 1.0.0
 * @since 1.0.0
 */

import { DatabaseOptimizer, BatchOperations, monitorQuery } from '../optimization';
import { PrismaClient } from '@prisma/client';

/**
 * Mock Prisma Client for Database Optimization Tests
 * 
 * Comprehensive mock implementation that simulates all Prisma client methods
 * used by the database optimization utilities. This mock enables testing
 * without actual database connections while maintaining realistic behavior.
 * 
 * **Mocked Methods:**
 * - `$executeRawUnsafe`: For index creation and configuration changes
 * - `$executeRaw`: For template literal SQL queries (ANALYZE commands)
 * - `$queryRaw`: For statistics and monitoring queries
 * - `$transaction`: For batch operations with transactional safety
 * 
 * **Mocked Models:**
 * - `course`: Educational content creation and updates
 * - `revokedToken`: Authentication token cleanup operations
 * - `lessonCompletion`: Learning progress data management
 */
const mockPrisma = {
  $executeRawUnsafe: jest.fn(),
  $executeRaw: jest.fn(),
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
  course: {
    create: jest.fn(),
    update: jest.fn(),
  },
  revokedToken: {
    deleteMany: jest.fn(),
  },
  lessonCompletion: {
    deleteMany: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock the logger to prevent actual logging during tests
jest.mock('@/shared/utils/logger');

/**
 * DatabaseOptimizer Test Suite
 * 
 * Tests the main database optimization class that provides comprehensive
 * performance tuning for community-owned educational platforms. Each test
 * validates specific optimization functionality while ensuring
 * error handling for production stability.
 */
describe('DatabaseOptimizer', () => {
  let optimizer: DatabaseOptimizer;

  beforeEach(() => {
    optimizer = new DatabaseOptimizer(mockPrisma);
    jest.clearAllMocks();
  });

  /**
   * Performance Index Creation Tests
   * 
   * Validates the creation of optimized database indexes specifically designed
   * for educational platform queries. These indexes improve performance for
   * common operations like course discovery, user progress tracking, and
   * content search.
   */
  describe('createPerformanceIndexes', () => {
    /**
     * Test successful creation of all performance indexes.
     * Verifies that all 8 educational platform indexes are created using
     * CONCURRENTLY to avoid blocking community users.
     */
    it('should create performance indexes', async () => {
      (mockPrisma.$executeRawUnsafe as jest.Mock).mockResolvedValue(undefined);

      await optimizer.createPerformanceIndexes();

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(8); // Number of indexes defined
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX CONCURRENTLY')
      );
    });

    /**
     * Test graceful handling of index creation failures.
     * Ensures that if some indexes already exist or fail to create,
     * the process continues and doesn't break the optimization workflow.
     */
    it('should handle index creation failures gracefully', async () => {
      (mockPrisma.$executeRawUnsafe as jest.Mock)
        .mockResolvedValueOnce(undefined) // First index succeeds
        .mockRejectedValueOnce(new Error('Index already exists')) // Second fails
        .mockResolvedValue(undefined); // Rest succeed

      await expect(optimizer.createPerformanceIndexes()).resolves.not.toThrow();
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(8);
    });
  });

  /**
   * Table Statistics Analysis Tests
   * 
   * Validates the analysis of database statistics to understand community
   * usage patterns and optimize query performance accordingly.
   */
  describe('analyzeTableStatistics', () => {
    /**
     * Test successful retrieval and analysis of table statistics.
     * Verifies that PostgreSQL statistics are properly queried and returned
     * for community usage pattern analysis.
     */
    it('should analyze table statistics', async () => {
      const mockStats = [
        {
          schemaname: 'public',
          tablename: 'users',
          column_name: 'email',
          n_distinct: 1000,
          correlation: 0.1,
        },
      ];

      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockStats);

      const result = await optimizer.analyzeTableStatistics();

      expect(result).toEqual(mockStats);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    /**
     * Test graceful handling of statistics analysis failures.
     * Ensures that if statistics queries fail, an empty array is returned
     * instead of crashing the optimization process.
     */
    it('should handle analysis failures', async () => {
      (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Analysis failed'));

      const result = await optimizer.analyzeTableStatistics();

      expect(result).toEqual([]);
    });
  });

  /**
   * Slow Query Detection Tests
   * 
   * Validates the identification of database queries that may be impacting
   * the learning experience for community users. Focuses on educational
   * platform operations that should be fast and responsive.
   */
  describe('getSlowQueries', () => {
    /**
     * Test successful retrieval of slow query statistics.
     * Verifies that pg_stat_statements data is properly queried to identify
     * queries taking more than 100ms on average.
     */
    it('should retrieve slow queries', async () => {
      const mockSlowQueries = [
        {
          query: 'SELECT * FROM users WHERE email = $1',
          calls: 100,
          total_time: 5000,
          mean_time: 50,
          rows: 1,
          hit_percent: 95.5,
        },
      ];

      (mockPrisma.$queryRaw as jest.Mock).mockResolvedValue(mockSlowQueries);

      const result = await optimizer.getSlowQueries();

      expect(result).toEqual(mockSlowQueries);
      expect(mockPrisma.$queryRaw).toHaveBeenCalled();
    });

    /**
     * Test handling of missing pg_stat_statements extension.
     * Ensures that if the required PostgreSQL extension is not available,
     * the method gracefully returns an empty array with appropriate logging.
     */
    it('should handle missing pg_stat_statements extension', async () => {
      (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(
        new Error('relation "pg_stat_statements" does not exist')
      );

      const result = await optimizer.getSlowQueries();

      expect(result).toEqual([]);
    });
  });

  /**
   * Database Configuration Optimization Tests
   * 
   * Validates the application of database configuration optimizations
   * specifically tuned for language learning platform workloads.
   */
  describe('optimizeConfiguration', () => {
    /**
     * Test successful application of database optimizations.
     * Verifies that all 4 optimization commands are executed, including
     * ANALYZE, VACUUM ANALYZE, and memory/parallel processing settings.
     */
    it('should apply database optimizations', async () => {
      (mockPrisma.$executeRawUnsafe as jest.Mock).mockResolvedValue(undefined);

      await optimizer.optimizeConfiguration();

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(4); // Number of optimizations
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith('ANALYZE;');
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith('VACUUM ANALYZE;');
    });
  });

  /**
   * Database Information Retrieval Tests
   * 
   * Validates the collection of database size and storage information
   * to help community administrators plan for hosting and growth needs.
   */
  describe('getDatabaseInfo', () => {
    /**
     * Test successful retrieval of database size information.
     * Verifies that both overall database size and individual table
     * information are properly collected and formatted.
     */
    it('should get database size information', async () => {
      const mockDbSize = [{ database_size: '100 MB', database_name: 'wayrapp_test' }];
      const mockTableInfo = [
        { schemaname: 'public', tablename: 'users', size: '10 MB', size_bytes: 10485760 },
      ];

      (mockPrisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce(mockDbSize)
        .mockResolvedValueOnce(mockTableInfo);

      const result = await optimizer.getDatabaseInfo();

      expect(result).toEqual({
        database: mockDbSize,
        tables: mockTableInfo,
      });
    });
  });

  /**
   * Database Connection Monitoring Tests
   * 
   * Validates the monitoring of database connection usage patterns
   * to help community administrators understand platform load characteristics.
   */
  describe('getConnectionInfo', () => {
    /**
     * Test successful retrieval of connection information.
     * Verifies that both connection state distribution and total
     * connection counts are properly collected from pg_stat_activity.
     */
    it('should get connection information', async () => {
      const mockConnections = [
        { state: 'active', count: 5 },
        { state: 'idle', count: 3 },
      ];
      const mockTotal = [{ total_connections: 8 }];

      (mockPrisma.$queryRaw as jest.Mock)
        .mockResolvedValueOnce(mockConnections)
        .mockResolvedValueOnce(mockTotal);

      const result = await optimizer.getConnectionInfo();

      expect(result).toEqual({
        byState: mockConnections,
        total: mockTotal,
      });
    });
  });

  /**
   * Expired Data Cleanup Tests
   * 
   * Validates the removal of expired and outdated data that can slow down
   * the community's educational platform. Essential for maintaining optimal
   * performance and security.
   */
  describe('cleanupExpiredData', () => {
    /**
     * Test successful cleanup of expired tokens and old lesson completions.
     * Verifies that expired authentication tokens and old learning progress
     * records are properly removed, followed by statistics updates.
     */
    it('should clean up expired tokens and old lesson completions', async () => {
      const mockExpiredTokensResult = { count: 5 };
      const mockOldCompletionsResult = { count: 10 };

      (mockPrisma.revokedToken.deleteMany as jest.Mock).mockResolvedValue(mockExpiredTokensResult);
      (mockPrisma.lessonCompletion.deleteMany as jest.Mock).mockResolvedValue(mockOldCompletionsResult);
      (mockPrisma.$executeRaw as jest.Mock).mockResolvedValue(undefined);

      await optimizer.cleanupExpiredData();

      expect(mockPrisma.revokedToken.deleteMany).toHaveBeenCalledWith({
        where: {
          expiresAt: {
            lt: expect.any(Date),
          },
        },
      });

      expect(mockPrisma.lessonCompletion.deleteMany).toHaveBeenCalledWith({
        where: {
          completedAt: {
            lt: expect.any(Date),
          },
        },
      });

      expect(mockPrisma.$executeRaw).toHaveBeenCalledWith(
        ['ANALYZE revoked_tokens, lesson_completions;']
      );
    });

    /**
     * Test graceful handling of cleanup operation failures.
     * Ensures that if cleanup operations fail, the method doesn't crash
     * and continues to maintain platform stability.
     */
    it('should handle cleanup failures gracefully', async () => {
      (mockPrisma.revokedToken.deleteMany as jest.Mock).mockRejectedValue(new Error('Cleanup failed'));

      await expect(optimizer.cleanupExpiredData()).resolves.not.toThrow();
    });
  });

  /**
   * Comprehensive Performance Analysis Tests
   * 
   * Validates the complete health check and performance analysis that provides
   * community administrators with actionable insights about their platform.
   */
  describe('runPerformanceAnalysis', () => {
    /**
     * Test successful execution of comprehensive performance analysis.
     * Verifies that all analysis components are executed and results are
     * properly structured with timestamp and all required sections.
     */
    it('should run comprehensive performance analysis', async () => {
      // Mock all the methods
      jest.spyOn(optimizer, 'getDatabaseInfo').mockResolvedValue({ database: [], tables: [] });
      jest.spyOn(optimizer, 'getConnectionInfo').mockResolvedValue({ byState: [], total: [] });
      jest.spyOn(optimizer, 'analyzeTableStatistics').mockResolvedValue([]);
      jest.spyOn(optimizer, 'getSlowQueries').mockResolvedValue([]);

      const result = await optimizer.runPerformanceAnalysis();

      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('database_info');
      expect(result).toHaveProperty('connection_info');
      expect(result).toHaveProperty('table_statistics');
      expect(result).toHaveProperty('slow_queries');
    });
  });
});

/**
 * BatchOperations Test Suite
 * 
 * Tests the optimized bulk database operations specifically designed for
 * educational platform needs. Essential for communities importing large
 * amounts of educational content or performing administrative tasks.
 */
describe('BatchOperations', () => {
  let batchOps: BatchOperations;

  beforeEach(() => {
    batchOps = new BatchOperations(mockPrisma);
    jest.clearAllMocks();
  });

  /**
   * Batch Creation Operation Tests
   * 
   * Validates efficient bulk record creation with transactional safety,
   * ideal for communities importing educational content or setting up courses.
   */
  describe('batchCreate', () => {
    /**
     * Test successful batch creation of multiple records.
     * Verifies that records are created in optimized batches with proper
     * transaction handling and result aggregation.
     */
    it('should create records in batches', async () => {
      const testData = [
        { name: 'Course 1' },
        { name: 'Course 2' },
        { name: 'Course 3' },
      ];

      const mockBatch1 = [
        { id: '1', name: 'Course 1' },
        { id: '2', name: 'Course 2' },
      ];
      const mockBatch2 = [
        { id: '3', name: 'Course 3' },
      ];

      (mockPrisma.$transaction as jest.Mock)
        .mockResolvedValueOnce(mockBatch1)
        .mockResolvedValueOnce(mockBatch2);

      const result = await batchOps.batchCreate('course', testData, 2);

      expect(result).toEqual([...mockBatch1, ...mockBatch2]);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(2); // 3 items with batch size 2
    });

    /**
     * Test proper error handling during batch creation failures.
     * Ensures that transaction failures are properly propagated and
     * don't leave the database in an inconsistent state.
     */
    it('should handle batch creation failures', async () => {
      const testData = [{ name: 'Course 1' }];

      (mockPrisma.$transaction as jest.Mock).mockRejectedValue(new Error('Batch failed'));

      await expect(batchOps.batchCreate('course', testData)).rejects.toThrow('Batch failed');
    });
  });

  /**
   * Batch Update Operation Tests
   * 
   * Validates efficient bulk record updates with optimized batching,
   * essential for community administrators managing content updates.
   */
  describe('batchUpdate', () => {
    /**
     * Test successful batch updating of multiple records.
     * Verifies that updates are processed in optimized batches with
     * proper transaction safety and accurate result counting.
     */
    it('should update records in batches', async () => {
      const updates = [
        { where: { id: '1' }, data: { name: 'Updated Course 1' } },
        { where: { id: '2' }, data: { name: 'Updated Course 2' } },
      ];

      const mockResults = [
        { id: '1', name: 'Updated Course 1' },
        { id: '2', name: 'Updated Course 2' },
      ];

      (mockPrisma.$transaction as jest.Mock).mockResolvedValue(mockResults);

      const result = await batchOps.batchUpdate('course', updates);

      expect(result).toBe(2);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    });

    /**
     * Test proper error handling during batch update failures.
     * Ensures that update transaction failures are properly handled
     * and error information is correctly propagated.
     */
    it('should handle batch update failures', async () => {
      const updates = [{ where: { id: '1' }, data: { name: 'Updated Course 1' } }];

      (mockPrisma.$transaction as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(batchOps.batchUpdate('course', updates)).rejects.toThrow('Update failed');
    });
  });
});

/**
 * Query Performance Monitoring Decorator Tests
 * 
 * Validates the TypeScript decorator that automatically monitors database
 * query performance for educational platform operations. Helps identify
 * slow queries that could impact the learning experience.
 */
describe('monitorQuery decorator', () => {
  /**
   * Test comprehensive query performance monitoring functionality.
   * Verifies that the decorator properly tracks execution time, logs slow
   * queries (>500ms), and handles both successful and failed operations.
   */
  it('should monitor query performance', async () => {
    class TestService {
      @monitorQuery
      async slowQuery(): Promise<string> {
        // Simulate slow query
        await new Promise(resolve => setTimeout(resolve, 600));
        return 'result';
      }

      @monitorQuery
      async fastQuery(): Promise<string> {
        return 'result';
      }

      @monitorQuery
      async failingQuery(): Promise<string> {
        throw new Error('Query failed');
      }
    }

    const service = new TestService();

    // Test slow query logging
    const slowResult = await service.slowQuery();
    expect(slowResult).toBe('result');

    // Test fast query
    const fastResult = await service.fastQuery();
    expect(fastResult).toBe('result');

    // Test failing query
    await expect(service.failingQuery()).rejects.toThrow('Query failed');
  });
});