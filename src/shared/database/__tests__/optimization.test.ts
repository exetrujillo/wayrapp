/**
 * Database Optimization Tests
 * Test suite for database optimization utilities
 */

import { DatabaseOptimizer, BatchOperations, monitorQuery } from '../optimization';
import { PrismaClient } from '@prisma/client';

// Mock Prisma client
const mockPrisma = {
  $executeRawUnsafe: jest.fn(),
  $queryRaw: jest.fn(),
  $transaction: jest.fn(),
  course: {
    create: jest.fn(),
    update: jest.fn(),
  },
} as unknown as PrismaClient;

jest.mock('@/shared/utils/logger');

describe('DatabaseOptimizer', () => {
  let optimizer: DatabaseOptimizer;

  beforeEach(() => {
    optimizer = new DatabaseOptimizer(mockPrisma);
    jest.clearAllMocks();
  });

  describe('createPerformanceIndexes', () => {
    it('should create performance indexes', async () => {
      (mockPrisma.$executeRawUnsafe as jest.Mock).mockResolvedValue(undefined);

      await optimizer.createPerformanceIndexes();

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(8); // Number of indexes defined
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX CONCURRENTLY')
      );
    });

    it('should handle index creation failures gracefully', async () => {
      (mockPrisma.$executeRawUnsafe as jest.Mock)
        .mockResolvedValueOnce(undefined) // First index succeeds
        .mockRejectedValueOnce(new Error('Index already exists')) // Second fails
        .mockResolvedValue(undefined); // Rest succeed

      await expect(optimizer.createPerformanceIndexes()).resolves.not.toThrow();
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(8);
    });
  });

  describe('analyzeTableStatistics', () => {
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

    it('should handle analysis failures', async () => {
      (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Analysis failed'));

      const result = await optimizer.analyzeTableStatistics();

      expect(result).toEqual([]);
    });
  });

  describe('getSlowQueries', () => {
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

    it('should handle missing pg_stat_statements extension', async () => {
      (mockPrisma.$queryRaw as jest.Mock).mockRejectedValue(
        new Error('relation "pg_stat_statements" does not exist')
      );

      const result = await optimizer.getSlowQueries();

      expect(result).toEqual([]);
    });
  });

  describe('optimizeConfiguration', () => {
    it('should apply database optimizations', async () => {
      (mockPrisma.$executeRawUnsafe as jest.Mock).mockResolvedValue(undefined);

      await optimizer.optimizeConfiguration();

      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledTimes(4); // Number of optimizations
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith('ANALYZE;');
      expect(mockPrisma.$executeRawUnsafe).toHaveBeenCalledWith('VACUUM ANALYZE;');
    });
  });

  describe('getDatabaseInfo', () => {
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

  describe('getConnectionInfo', () => {
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

  describe('runPerformanceAnalysis', () => {
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

describe('BatchOperations', () => {
  let batchOps: BatchOperations;

  beforeEach(() => {
    batchOps = new BatchOperations(mockPrisma);
    jest.clearAllMocks();
  });

  describe('batchCreate', () => {
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

    it('should handle batch creation failures', async () => {
      const testData = [{ name: 'Course 1' }];

      (mockPrisma.$transaction as jest.Mock).mockRejectedValue(new Error('Batch failed'));

      await expect(batchOps.batchCreate('course', testData)).rejects.toThrow('Batch failed');
    });
  });

  describe('batchUpdate', () => {
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
  });
});

describe('monitorQuery decorator', () => {
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