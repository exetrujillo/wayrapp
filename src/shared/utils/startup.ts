// src/shared/utils/startup.ts

/**
 * Node initialization and health check utilities for WayrApp sovereign nodes.
 * 
 * This module provides comprehensive startup management for community-owned WayrApp nodes,
 * handling database optimization, cache warming, health monitoring, and graceful shutdown
 * procedures. It ensures each educational platform node starts with optimal performance
 * configurations and maintains system health throughout its lifecycle. The StartupManager
 * orchestrates initialization sequences, sets up periodic maintenance tasks, and provides
 * health check capabilities essential for serverless and traditional deployment environments.
 * 
 * @exports {class} StartupManager - Main startup orchestration class with initialization and health management
 * @exports {StartupManager} startupManager - Singleton instance for application-wide startup management
 * 
 * @fileoverview Node initialization and health check utilities for WayrApp sovereign nodes
 * @author Exequiel Trujillo
 * @version 1.0.0
 * @since 1.0.0
 */

import { logger } from './logger';
import { cacheService, CACHE_KEYS } from './cache';
import { DatabaseOptimizer } from '@/shared/database/optimization';
import { prisma } from '@/shared/database/connection';

/**
 * Main startup orchestration class for WayrApp sovereign nodes.
 * 
 * Manages the complete initialization lifecycle of a community-owned educational platform node,
 * including database optimization, cache warming, health monitoring, and graceful shutdown.
 * This class ensures optimal performance from startup and maintains system health through
 * automated maintenance tasks.
 * 
 * @example
 * // Basic usage with singleton instance
 * import { startupManager } from '@/shared/utils/startup';
 * 
 * // Initialize the application
 * await startupManager.initialize();
 * 
 * // Check system health
 * const isHealthy = await startupManager.healthCheck();
 * if (!isHealthy) {
 *   console.error('System health check failed');
 *   process.exit(1);
 * }
 * 
 * // Graceful shutdown
 * await startupManager.shutdown();
 * 
 * @example
 * // Custom instance usage
 * const customStartup = new StartupManager();
 * await customStartup.initialize();
 */
export class StartupManager {
  private dbOptimizer: DatabaseOptimizer;

  /**
   * Creates a new StartupManager instance.
   * 
   * Initializes the database optimizer with the Prisma client connection.
   * The constructor sets up the foundation for all startup operations but
   * does not perform any initialization tasks - call initialize() for that.
   */
  constructor() {
    this.dbOptimizer = new DatabaseOptimizer(prisma);
  }

  /**
   * Initialize all performance optimizations and startup procedures.
   * 
   * Orchestrates the complete startup sequence including database optimization,
   * cache warming, and maintenance task setup. This method should be called
   * during application startup to ensure optimal performance from the beginning.
   * 
   * @returns {Promise<void>} Promise that resolves when initialization is complete
   * @throws {Error} Throws if critical initialization steps fail
   * 
   * @example
   * // Initialize during application startup
   * try {
   *   await startupManager.initialize();
   *   console.log('Application ready to serve requests');
   * } catch (error) {
   *   console.error('Startup failed:', error);
   *   process.exit(1);
   * }
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
   * Graceful shutdown cleanup for application termination.
   * 
   * Performs orderly cleanup of resources including cache clearing and database
   * disconnection. This method should be called during application shutdown to
   * ensure proper resource cleanup and prevent data corruption.
   * 
   * @returns {Promise<void>} Promise that resolves when shutdown is complete
   * 
   * @example
   * // Handle graceful shutdown on SIGTERM
   * process.on('SIGTERM', async () => {
   *   console.log('Received SIGTERM, shutting down gracefully...');
   *   await startupManager.shutdown();
   *   process.exit(0);
   * });
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
   * Health check for startup readiness and system status verification.
   * 
   * Performs comprehensive health checks including database connectivity and
   * cache functionality tests. This method is essential for determining if
   * the application is ready to serve requests and for monitoring system health.
   * 
   * @returns {Promise<boolean>} Promise that resolves to true if all health checks pass, false otherwise
   * 
   * @example
   * // Verify system health before starting server
   * const isHealthy = await startupManager.healthCheck();
   * if (!isHealthy) {
   *   logger.error('Health check failed, aborting startup');
   *   process.exit(1);
   * }
   * 
   * @example
   * // Periodic health monitoring
   * setInterval(async () => {
   *   const healthy = await startupManager.healthCheck();
   *   if (!healthy) {
   *     logger.warn('Health check failed during runtime');
   *   }
   * }, 60000); // Check every minute
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

/**
 * Singleton instance of StartupManager for application-wide startup management.
 * 
 * Pre-configured StartupManager instance that should be used throughout the application
 * for consistent startup behavior. This singleton ensures that initialization, health
 * checks, and shutdown procedures are coordinated across the entire application.
 * 
 * @type {StartupManager}
 * 
 * @example
 * // Import and use the singleton instance
 * import { startupManager } from '@/shared/utils/startup';
 * 
 * // Application startup
 * await startupManager.initialize();
 * 
 * // Health monitoring
 * const isHealthy = await startupManager.healthCheck();
 * 
 * // Graceful shutdown
 * await startupManager.shutdown();
 */
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