/**
 * Performance Monitoring Tests
 * Test suite for performance monitoring utilities
 */

import { performanceMonitor, healthChecks, QueryOptimizer } from '../performance';
import { cacheService } from '../cache';
import { prisma } from '@/shared/database/connection';

// Mock dependencies
jest.mock('@/shared/database/connection', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));
jest.mock('../logger');

describe('Performance Monitoring', () => {
  beforeEach(() => {
    performanceMonitor.resetMetrics();
    jest.clearAllMocks();
  });

  describe('PerformanceMonitor', () => {
    it('should track request metrics correctly', () => {
      // Track some requests
      performanceMonitor.trackRequest(100, false);
      performanceMonitor.trackRequest(200, false);
      performanceMonitor.trackRequest(1500, false); // Slow request
      performanceMonitor.trackRequest(50, true); // Error request

      const metrics = performanceMonitor.getRequestMetrics();

      expect(metrics.totalRequests).toBe(4);
      expect(metrics.averageResponseTime).toBe(462.5); // (100+200+1500+50)/4
      expect(metrics.slowRequests).toBe(1);
      expect(metrics.errorRate).toBe(25); // 1 error out of 4 requests
      expect(metrics.peakResponseTime).toBe(1500);
      expect(metrics.fastestResponseTime).toBe(50);
    });

    it('should generate system metrics', () => {
      const metrics = performanceMonitor.getSystemMetrics();

      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('timestamp');
      expect(typeof metrics.uptime).toBe('number');
    });

    it('should generate performance report', async () => {
      // Mock prisma query
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const report = await performanceMonitor.generateReport();

      expect(report).toHaveProperty('system');
      expect(report).toHaveProperty('requests');
      expect(report).toHaveProperty('database');
      expect(report).toHaveProperty('cache');
      expect(report).toHaveProperty('recommendations');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should generate recommendations based on metrics', async () => {
      // Track slow requests to trigger recommendations
      for (let i = 0; i < 10; i++) {
        performanceMonitor.trackRequest(1500, false); // Slow requests
      }

      const report = await performanceMonitor.generateReport();

      expect(report.recommendations.some(r => r.includes('Average response time is high'))).toBe(true);
      expect(report.recommendations.some(r => r.includes('High number of slow requests'))).toBe(true);
    });
  });

  describe('Health Checks', () => {
    it('should check database health', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const health = await healthChecks.database();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('latency');
      expect(health).toHaveProperty('timestamp');
      expect(health.status).toBe('healthy');
      expect(typeof health.latency).toBe('number');
    });

    it('should handle database health check failure', async () => {
      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Connection failed'));

      const health = await healthChecks.database();

      expect(health.status).toBe('unhealthy');
      expect(health).toHaveProperty('error');
    });

    it('should check cache health', async () => {
      const health = await healthChecks.cache();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('stats');
      expect(health).toHaveProperty('timestamp');
    });

    it('should check memory health', async () => {
      const health = await healthChecks.memory();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('usage');
      expect(health).toHaveProperty('timestamp');
      expect(health.usage).toHaveProperty('heapUsedMB');
      expect(health.usage).toHaveProperty('heapTotalMB');
    });

    it('should check overall system health', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const health = await healthChecks.system();

      expect(health).toHaveProperty('status');
      expect(health).toHaveProperty('components');
      expect(health).toHaveProperty('uptime');
      expect(health.components).toHaveProperty('database');
      expect(health.components).toHaveProperty('cache');
      expect(health.components).toHaveProperty('memory');
    });
  });

  describe('Query Optimizer', () => {
    it('should analyze queries and provide suggestions', () => {
      const suggestions = QueryOptimizer.analyzeQuery('User', 'findMany', {});

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.some(s => s.includes("Consider using 'include'"))).toBe(true);
    });

    it('should suggest pagination improvements', () => {
      const suggestions = QueryOptimizer.analyzeQuery('User', 'findMany', {
        skip: 2000,
      });

      expect(suggestions.some(s => s.includes('cursor-based pagination'))).toBe(true);
    });

    it('should suggest indexes based on query patterns', () => {
      const queryLog = [
        { model: 'User', operation: 'findMany', args: { where: { email: 'test@example.com' } } },
        { model: 'User', operation: 'findMany', args: { where: { email: 'test2@example.com' } } },
        { model: 'User', operation: 'findMany', args: { where: { email: 'test3@example.com' } } },
        // Repeat to trigger frequency threshold
        ...Array(10).fill({ model: 'User', operation: 'findMany', args: { where: { email: 'test@example.com' } } }),
      ];

      const suggestions = QueryOptimizer.suggestIndexes(queryLog);

      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Middleware', () => {
    it('should track request performance', (done) => {
      const { performanceMiddleware } = require('../performance');
      const middleware = performanceMiddleware(performanceMonitor);

      const mockReq = {};
      const mockRes = {
        on: jest.fn((event, callback) => {
          if (event === 'finish') {
            // Simulate response finish after 100ms
            setTimeout(() => {
              callback();
              
              // Check that metrics were updated
              const metrics = performanceMonitor.getRequestMetrics();
              expect(metrics.totalRequests).toBe(1);
              done();
            }, 100);
          }
        }),
        statusCode: 200,
      };
      const mockNext = jest.fn();

      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

describe('Cache Service Performance', () => {
  beforeEach(async () => {
    await cacheService.clear();
  });

  it('should track cache statistics', async () => {
    // Add some cache entries
    await cacheService.set('test1', 'value1');
    await cacheService.set('test2', 'value2');
    
    // Access one entry to increase hit count
    await cacheService.get('test1');
    await cacheService.get('test1');
    
    // Try to access non-existent entry to increase miss count
    await cacheService.get('nonexistent');

    const stats = cacheService.getStats();

    expect(stats.size).toBe(2);
    expect(stats.totalHits).toBe(2);
    expect(stats.totalMisses).toBe(1);
    expect(stats.hitRate).toBeCloseTo(66.67, 1); // 2 hits out of 3 total requests
  });

  it('should handle cache warm-up', async () => {
    const warmUpData = [
      {
        key: 'test1',
        fetcher: async () => ({ data: 'test1' }),
        ttl: 5000,
      },
      {
        key: 'test2',
        fetcher: async () => ({ data: 'test2' }),
      },
    ];

    await cacheService.warmUp(warmUpData);

    const value1 = await cacheService.get('test1');
    const value2 = await cacheService.get('test2');

    expect(value1).toEqual({ data: 'test1' });
    expect(value2).toEqual({ data: 'test2' });
  });

  it('should invalidate cache by pattern', async () => {
    await cacheService.set('user:1', 'user1');
    await cacheService.set('user:2', 'user2');
    await cacheService.set('course:1', 'course1');

    const invalidated = await cacheService.invalidatePattern('^user:');

    expect(invalidated).toBe(2);
    
    const user1 = await cacheService.get('user:1');
    const course1 = await cacheService.get('course:1');
    
    expect(user1).toBeNull();
    expect(course1).toBe('course1');
  });

  it('should perform LRU eviction when cache is full', async () => {
    // Set a small cache size for testing
    const originalMaxSize = (cacheService as any).maxSize;
    (cacheService as any).maxSize = 3;

    try {
      // Fill cache to capacity
      await cacheService.set('item1', 'value1');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await cacheService.set('item2', 'value2');
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await cacheService.set('item3', 'value3');

      // Access item1 to make it recently used
      await cacheService.get('item1');

      // Add another item, should evict the least recently used
      await cacheService.set('item4', 'value4');

      const item1 = await cacheService.get('item1');
      const item2 = await cacheService.get('item2');
      const item3 = await cacheService.get('item3');
      const item4 = await cacheService.get('item4');

      // At least one item should be evicted and item4 should exist
      expect(item4).toBe('value4'); // Should exist (newly added)
      expect(item1).toBe('value1'); // Should still exist (recently accessed)
      
      // Either item2 or item3 should be evicted (the one that was least recently used)
      const evictedCount = [item2, item3].filter(item => item === null).length;
      expect(evictedCount).toBe(1);
    } finally {
      // Restore original max size
      (cacheService as any).maxSize = originalMaxSize;
    }
  });
});