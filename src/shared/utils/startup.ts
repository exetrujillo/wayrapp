/**
 * Application Startup Utilities
 * Initialize performance optimizations, caching, and monitoring
 * 
 * @author Exequiel Trujillo
 */

import { logger } from './logger';
import { cacheService, CACHE_KEYS } from './cache';
import { DatabaseOptimizer } from '@/shared/database/optimization';
import { prisma } from '@/shared/database/connection';

export class StartupManager {
  private dbOptimizer: DatabaseOptimizer;

  constructor() {
    this.dbOptimizer = new DatabaseOptimizer(prisma);
  }

  /**
   * Initialize all performance optimizations
   */
  async initialize(): Promise<void> {
    logger.info('Starting application initialization...');

    try {
      // Initialize database optimizations
      await this.initializeDatabase();

      // Warm up cache with frequently accessed data
      await this.warmUpCache();

      // Set up periodic maintenance tasks
      this.setupMaintenanceTasks();

      logger.info('Application initialization completed successfully');
    } catch (error) {
      logger.error('Application initialization failed', { error });
      throw error;
    }
  }

  /**
   * Initialize database optimizations
   */
  private async initializeDatabase(): Promise<void> {
    logger.info('Initializing database optimizations...');

    try {
      // Create performance indexes
      await this.dbOptimizer.createPerformanceIndexes();

      // Optimize database configuration
      await this.dbOptimizer.optimizeConfiguration();

      // Clean up expired data
      await this.dbOptimizer.cleanupExpiredData();

      logger.info('Database optimization completed');
    } catch (error) {
      logger.warn('Database optimization partially failed', { error });
      // Don't throw here as the app can still function
    }
  }

  /**
   * Warm up cache with frequently accessed content
   */
  private async warmUpCache(): Promise<void> {
    logger.info('Starting cache warm-up...');

    const warmUpData = [
      // Popular courses
      {
        key: CACHE_KEYS.POPULAR_COURSES(),
        fetcher: async () => {
          return await prisma.course.findMany({
            where: { isPublic: true },
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              levels: {
                take: 1,
                select: { id: true },
              },
            },
          });
        },
        ttl: 30 * 60 * 1000, // 30 minutes
      },
      
      // System health check data
      {
        key: CACHE_KEYS.HEALTH_CHECK(),
        fetcher: async () => {
          const startTime = Date.now();
          await prisma.$queryRaw`SELECT 1`;
          return {
            status: 'healthy',
            latency: Date.now() - startTime,
            timestamp: new Date().toISOString(),
          };
        },
        ttl: 60 * 1000, // 1 minute
      },

      // Database metrics
      {
        key: CACHE_KEYS.DB_METRICS(),
        fetcher: async () => {
          return await this.dbOptimizer.getDatabaseInfo();
        },
        ttl: 5 * 60 * 1000, // 5 minutes
      },
    ];

    try {
      await cacheService.warmUp(warmUpData);
      logger.info('Cache warm-up completed');
    } catch (error) {
      logger.warn('Cache warm-up partially failed', { error });
    }
  }

  /**
   * Set up periodic maintenance tasks
   */
  private setupMaintenanceTasks(): void {
    logger.info('Setting up maintenance tasks...');

    // Cache cleanup every 10 minutes
    setInterval(() => {
      try {
        cacheService.cleanup();
        logger.debug('Periodic cache cleanup completed');
      } catch (error) {
        logger.warn('Periodic cache cleanup failed', { error });
      }
    }, 10 * 60 * 1000);

    // Database cleanup every hour
    setInterval(async () => {
      try {
        await this.dbOptimizer.cleanupExpiredData();
        logger.debug('Periodic database cleanup completed');
      } catch (error) {
        logger.warn('Periodic database cleanup failed', { error });
      }
    }, 60 * 60 * 1000);

    // Performance analysis every 6 hours
    setInterval(async () => {
      try {
        const analysis = await this.dbOptimizer.runPerformanceAnalysis();
        logger.info('Periodic performance analysis completed', {
          databaseSize: analysis.database_info?.database?.[0]?.database_size,
          tableCount: Array.isArray(analysis.database_info?.tables) 
            ? analysis.database_info.tables.length 
            : 0,
        });
      } catch (error) {
        logger.warn('Periodic performance analysis failed', { error });
      }
    }, 6 * 60 * 60 * 1000);

    // Cache statistics logging every 30 minutes
    setInterval(() => {
      try {
        const stats = cacheService.getStats();
        logger.info('Cache statistics', {
          size: stats.size,
          hitRate: `${stats.hitRate}%`,
          memoryUsage: `${Math.round(stats.memoryUsage / 1024)} KB`,
        });
      } catch (error) {
        logger.warn('Cache statistics logging failed', { error });
      }
    }, 30 * 60 * 1000);

    logger.info('Maintenance tasks configured');
  }

  /**
   * Graceful shutdown cleanup
   */
  async shutdown(): Promise<void> {
    logger.info('Starting graceful shutdown...');

    try {
      // Clear cache
      await cacheService.clear();

      // Disconnect from database
      await prisma.$disconnect();

      logger.info('Graceful shutdown completed');
    } catch (error) {
      logger.error('Graceful shutdown failed', { error });
    }
  }

  /**
   * Health check for startup readiness
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test database connection
      await prisma.$queryRaw`SELECT 1`;
      
      // Test cache functionality
      await cacheService.set('startup_test', 'ok', 1000);
      const testValue = await cacheService.get('startup_test');
      
      if (testValue !== 'ok') {
        throw new Error('Cache test failed');
      }

      await cacheService.delete('startup_test');
      
      return true;
    } catch (error) {
      logger.error('Startup health check failed', { error });
      return false;
    }
  }
}

// Singleton instance
export const startupManager = new StartupManager();

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, starting graceful shutdown...');
  await startupManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, starting graceful shutdown...');
  await startupManager.shutdown();
  process.exit(0);
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  // Don't exit the process, but log the error
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', { error });
  // Exit the process for uncaught exceptions
  process.exit(1);
});