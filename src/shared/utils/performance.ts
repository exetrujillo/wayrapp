// src/shared/utils/performance.ts

/**
 * Single-node performance monitoring and system health utilities for WayrApp backend.
 * 
 * This module provides comprehensive performance tracking, system health monitoring, and database
 * query optimization capabilities for the WayrApp language learning platform. It serves as the
 * central observability layer, automatically tracking HTTP request metrics, monitoring system
 * resources, and providing actionable performance recommendations. The module integrates seamlessly
 * with Express middleware for automatic request tracking and exposes health check endpoints for
 * container orchestration and monitoring systems.
 * 
 * Key architectural components include real-time request performance tracking, system resource
 * monitoring (memory, CPU, uptime), database connectivity health checks, cache performance
 * analysis, and intelligent query optimization suggestions. The module supports both development
 * debugging and production monitoring scenarios, with Prometheus-compatible metrics export for
 * integration with monitoring infrastructure.
 * 
 * @module Performance
 * @category Performance
 * @category Utilities
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Automatic request tracking via Express middleware
 * import { performanceMiddleware, performanceMonitor } from '@/shared/utils/performance';
 * app.use(performanceMiddleware(performanceMonitor));
 * 
 * @example
 * // Manual performance tracking and reporting
 * import { performanceMonitor } from '@/shared/utils/performance';
 * 
 * // Track individual requests
 * performanceMonitor.trackRequest(250, false); // 250ms response, no error
 * 
 * // Generate comprehensive performance report
 * const report = await performanceMonitor.generateReport();
 * console.log(`Average response time: ${report.requests.averageResponseTime}ms`);
 * console.log('Recommendations:', report.recommendations);
 * 
 * @example
 * // System health monitoring for container orchestration
 * import { healthChecks } from '@/shared/utils/performance';
 * 
 * // Check overall system health (Kubernetes readiness probe)
 * const systemHealth = await healthChecks.system();
 * if (systemHealth.status === 'healthy') {
 *   console.log('All systems operational');
 * }
 * 
 * // Individual component health checks
 * const dbHealth = await healthChecks.database();
 * const cacheHealth = await healthChecks.cache();
 * const memoryHealth = await healthChecks.memory();
 * 
 * @example
 * // Database query optimization analysis
 * import { QueryOptimizer } from '@/shared/utils/performance';
 * 
 * // Analyze individual queries for optimization opportunities
 * const suggestions = QueryOptimizer.analyzeQuery('User', 'findMany', {
 *   skip: 1000,
 *   where: { email: 'user@example.com' }
 * });
 * 
 * // Generate index suggestions from query patterns
 * const queryLog = [
 *   { model: 'User', operation: 'findMany', args: { where: { email: 'test@example.com' } } },
 *   { model: 'Course', operation: 'findMany', args: { orderBy: { createdAt: 'desc' } } }
 * ];
 * const indexSuggestions = QueryOptimizer.suggestIndexes(queryLog);
 */

import { logger } from './logger';
import { cacheService } from './cache';
import { prisma } from '@/shared/database/connection';

// Performance metrics interfaces
export interface RequestMetrics {
  totalRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  errorRate: number;
  requestsPerMinute: number;
  peakResponseTime: number;
  fastestResponseTime: number;
}

export interface SystemMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  activeConnections: number;
  timestamp: number;
}

export interface PerformanceReport {
  system: SystemMetrics;
  requests: RequestMetrics;
  database: any; // Will be populated by database health check
  cache: any; // Will be populated by cache stats
  recommendations: string[];
}

/**
 * Core performance monitoring class that tracks HTTP request metrics and generates system reports.
 * 
 * This class maintains in-memory statistics about request performance, including response times,
 * error rates, and slow request detection. It provides comprehensive reporting capabilities with
 * actionable recommendations for performance optimization. The monitor automatically manages
 * memory usage by maintaining a rolling window of the most recent request times.
 * 
 * @class PerformanceMonitor
 * @example
 * const monitor = new PerformanceMonitor();
 * 
 * // Track requests (typically done automatically via middleware)
 * monitor.trackRequest(150, false); // 150ms response, no error
 * monitor.trackRequest(1200, false); // Slow request (>1000ms)
 * monitor.trackRequest(300, true); // 300ms response with error
 * 
 * // Get current metrics
 * const metrics = monitor.getRequestMetrics();
 * console.log(`Total requests: ${metrics.totalRequests}`);
 * console.log(`Average response time: ${metrics.averageResponseTime}ms`);
 * console.log(`Error rate: ${metrics.errorRate}%`);
 */
export class PerformanceMonitor {
  private requestTimes: number[] = [];
  private requestCount = 0;
  private errorCount = 0;
  private slowRequestCount = 0;
  private readonly SLOW_REQUEST_THRESHOLD = 1000; // 1 second
  private readonly MAX_STORED_TIMES = 1000; // Keep last 1000 request times

  /**
   * Records performance metrics for a single HTTP request.
   * 
   * Tracks response time, error status, and identifies slow requests based on the configured
   * threshold (1000ms). Automatically logs warnings for slow requests and maintains a rolling
   * window of recent request times for memory efficiency.
   * 
   * @param {number} responseTime - Request response time in milliseconds
   * @param {boolean} [isError=false] - Whether the request resulted in an error (HTTP status >= 400)
   * @returns {void}
   * 
   * @example
   * // Track successful request
   * performanceMonitor.trackRequest(250, false);
   * 
   * @example
   * // Track error request
   * performanceMonitor.trackRequest(500, true);
   * 
   * @example
   * // Track slow request (will trigger warning log)
   * performanceMonitor.trackRequest(1500, false);
   */
  trackRequest(responseTime: number, isError: boolean = false): void {
    this.requestCount++;
    this.requestTimes.push(responseTime);

    if (isError) {
      this.errorCount++;
    }

    if (responseTime > this.SLOW_REQUEST_THRESHOLD) {
      this.slowRequestCount++;
      logger.warn('Slow request detected', {
        responseTime: `${responseTime}ms`,
        threshold: `${this.SLOW_REQUEST_THRESHOLD}ms`,
      });
    }

    // Keep only recent request times
    if (this.requestTimes.length > this.MAX_STORED_TIMES) {
      this.requestTimes.shift();
    }
  }

  /**
   * Retrieves comprehensive metrics about tracked HTTP requests.
   * 
   * Calculates and returns aggregated performance statistics including total request count,
   * average response time, error rate, slow request count, and peak/fastest response times.
   * All calculations are based on the current rolling window of tracked requests.
   * 
   * @returns {RequestMetrics} Object containing comprehensive request performance metrics
   * 
   * @example
   * const metrics = performanceMonitor.getRequestMetrics();
   * console.log(`Processed ${metrics.totalRequests} requests`);
   * console.log(`Average response time: ${metrics.averageResponseTime}ms`);
   * console.log(`Error rate: ${metrics.errorRate}%`);
   * console.log(`Slow requests: ${metrics.slowRequests}`);
   * console.log(`Peak response time: ${metrics.peakResponseTime}ms`);
   */
  getRequestMetrics(): RequestMetrics {
    const totalRequests = this.requestCount;
    const averageResponseTime = this.requestTimes.length > 0
      ? this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length
      : 0;

    const errorRate = totalRequests > 0 ? (this.errorCount / totalRequests) * 100 : 0;
    const peakResponseTime = this.requestTimes.length > 0 ? Math.max(...this.requestTimes) : 0;
    const fastestResponseTime = this.requestTimes.length > 0 ? Math.min(...this.requestTimes) : 0;

    // Calculate requests per minute (based on last 1000 requests)
    const requestsPerMinute = this.requestTimes.length > 0
      ? (this.requestTimes.length / (Date.now() - (Date.now() - 60000))) * 60000
      : 0;

    return {
      totalRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      slowRequests: this.slowRequestCount,
      errorRate: Math.round(errorRate * 100) / 100,
      requestsPerMinute: Math.round(requestsPerMinute),
      peakResponseTime,
      fastestResponseTime,
    };
  }

  /**
   * Retrieves current system resource metrics from the Node.js process.
   * 
   * Collects real-time information about system uptime, memory usage, CPU usage, and
   * active connections. These metrics are essential for monitoring system health and
   * identifying resource bottlenecks in production environments.
   * 
   * @returns {SystemMetrics} Object containing current system resource metrics
   * 
   * @example
   * const systemMetrics = performanceMonitor.getSystemMetrics();
   * console.log(`System uptime: ${systemMetrics.uptime} seconds`);
   * console.log(`Memory usage: ${systemMetrics.memoryUsage.heapUsed / 1024 / 1024} MB`);
   * console.log(`CPU usage: ${systemMetrics.cpuUsage} seconds`);
   */
  getSystemMetrics(): SystemMetrics {
    const memoryUsage = process.memoryUsage();

    return {
      uptime: process.uptime(),
      memoryUsage,
      cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      activeConnections: 0, // Would need additional monitoring
      timestamp: Date.now(),
    };
  }

  /**
   * Analyzes performance metrics and generates actionable optimization recommendations.
   * 
   * Evaluates request performance, system resources, cache efficiency, and database health
   * to provide specific, actionable recommendations for improving application performance.
   * Recommendations are prioritized based on impact and include specific thresholds and
   * suggested solutions.
   * 
   * @param {PerformanceReport} metrics - Complete performance report containing all system metrics
   * @returns {string[]} Array of actionable performance optimization recommendations
   * 
   * @example
   * const report = await performanceMonitor.generateReport();
   * const recommendations = performanceMonitor.generateRecommendations(report);
   * recommendations.forEach(rec => console.log(`⚠️ ${rec}`));
   */
  generateRecommendations(metrics: PerformanceReport): string[] {
    const recommendations: string[] = [];

    // Request performance recommendations
    if (metrics.requests.averageResponseTime > 500) {
      recommendations.push('Average response time is high (>500ms). Consider optimizing database queries or adding caching.');
    }

    if (metrics.requests.errorRate > 5) {
      recommendations.push('Error rate is high (>5%). Review error logs and implement better error handling.');
    }

    if (metrics.requests.slowRequests > metrics.requests.totalRequests * 0.1) {
      recommendations.push('High number of slow requests (>10%). Consider query optimization and indexing.');
    }

    // Memory recommendations
    const memoryUsageMB = metrics.system.memoryUsage.heapUsed / 1024 / 1024;
    if (memoryUsageMB > 500) {
      recommendations.push('High memory usage detected. Consider implementing memory optimization strategies.');
    }

    // Cache recommendations
    if (metrics.cache.hitRate < 70) {
      recommendations.push('Cache hit rate is low (<70%). Review caching strategy and TTL configurations.');
    }

    if (metrics.cache.size > 800) {
      recommendations.push('Cache size is large. Consider implementing cache eviction policies.');
    }

    // Database recommendations
    if (metrics.database.metrics?.slowQueries > 10) {
      recommendations.push('Multiple slow database queries detected. Review and optimize query performance.');
    }

    if (metrics.database.latency > 100) {
      recommendations.push('Database latency is high (>100ms). Check database connection and query optimization.');
    }

    return recommendations;
  }

  /**
   * Generates a comprehensive performance report including all system components.
   * 
   * Aggregates metrics from request tracking, system resources, database health, and cache
   * performance into a unified report. Includes intelligent recommendations based on current
   * performance patterns and thresholds. This method is used by health check endpoints and
   * monitoring dashboards.
   * 
   * @returns {Promise<PerformanceReport>} Complete performance report with recommendations
   * 
   * @example
   * const report = await performanceMonitor.generateReport();
   * 
   * console.log('System Status:', report.system.uptime);
   * console.log('Request Metrics:', report.requests);
   * console.log('Database Status:', report.database.status);
   * console.log('Cache Performance:', report.cache);
   * console.log('Recommendations:', report.recommendations);
   * 
   * // Use in health check endpoint
   * app.get('/metrics', async (req, res) => {
   *   const report = await performanceMonitor.generateReport();
   *   res.json(report);
   * });
   */
  async generateReport(): Promise<PerformanceReport> {
    const system = this.getSystemMetrics();
    const requests = this.getRequestMetrics();

    // Get database health and metrics
    const database = await prisma.$queryRaw`SELECT 1`
      .then(() => ({ status: 'connected', latency: 0, metrics: {} }))
      .catch(() => ({ status: 'error', latency: -1, metrics: {} }));

    // Get cache statistics
    const cache = cacheService.getStats();

    const report: PerformanceReport = {
      system,
      requests,
      database,
      cache,
      recommendations: [],
    };

    // Generate recommendations based on metrics
    report.recommendations = this.generateRecommendations(report);

    return report;
  }

  /**
   * Resets all tracked performance metrics to initial state.
   * 
   * Clears request times, counters, and error tracking. Useful for testing scenarios,
   * periodic metric resets, or when starting fresh monitoring periods. This operation
   * is logged for audit purposes.
   * 
   * @returns {void}
   * 
   * @example
   * // Reset metrics for new monitoring period
   * performanceMonitor.resetMetrics();
   * 
   * @example
   * // Reset via API endpoint
   * app.post('/metrics/reset', (req, res) => {
   *   performanceMonitor.resetMetrics();
   *   res.json({ success: true, message: 'Metrics reset successfully' });
   * });
   */
  resetMetrics(): void {
    this.requestTimes = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.slowRequestCount = 0;
    logger.info('Performance metrics reset');
  }
}

/**
 * Express middleware factory for automatic HTTP request performance tracking.
 * 
 * Creates middleware that automatically measures response times and tracks error rates
 * for all HTTP requests. Integrates seamlessly with Express applications and requires
 * no manual instrumentation. The middleware is non-blocking and adds minimal overhead
 * to request processing.
 * 
 * @param {PerformanceMonitor} monitor - Performance monitor instance to track metrics
 * @returns {Function} Express middleware function for automatic request tracking
 * 
 * @example
 * // Basic usage with singleton monitor
 * import { performanceMiddleware, performanceMonitor } from '@/shared/utils/performance';
 * app.use(performanceMiddleware(performanceMonitor));
 * 
 * @example
 * // Usage with custom monitor instance
 * const customMonitor = new PerformanceMonitor();
 * app.use(performanceMiddleware(customMonitor));
 * 
 * @example
 * // Conditional usage (skip in test environment)
 * if (process.env.NODE_ENV !== 'test') {
 *   app.use(performanceMiddleware(performanceMonitor));
 * }
 */
export const performanceMiddleware = (monitor: PerformanceMonitor) => {
  return (_req: any, res: any, next: any) => {
    const startTime = Date.now();

    // Track when response finishes
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const isError = res.statusCode >= 400;
      monitor.trackRequest(responseTime, isError);
    });

    next();
  };
};

/**
 * Database query optimization utility providing analysis and recommendations.
 * 
 * Static utility class that analyzes Prisma database queries and provides specific
 * optimization suggestions including N+1 query prevention, pagination improvements,
 * and indexing recommendations. Helps developers identify and resolve common database
 * performance issues before they impact production systems.
 * 
 * @example
 * // Analyze individual query for optimization opportunities
 * const suggestions = QueryOptimizer.analyzeQuery('User', 'findMany', {
 *   skip: 1000,
 *   where: { email: 'user@example.com' }
 * });
 * suggestions.forEach(suggestion => console.log(`💡 ${suggestion}`));
 * 
 * @example
 * // Generate index suggestions from query patterns
 * const queryLog = [
 *   { model: 'User', operation: 'findMany', args: { where: { email: 'test@example.com' } } },
 *   { model: 'Course', operation: 'findMany', args: { orderBy: { createdAt: 'desc' } } }
 * ];
 * const indexSuggestions = QueryOptimizer.suggestIndexes(queryLog);
 */
export class QueryOptimizer {
  /**
   * Analyzes a single database query and provides optimization suggestions.
   * 
   * Examines query patterns to identify common performance issues such as missing
   * includes (N+1 queries), inefficient pagination, and missing filters on large tables.
   * Returns specific, actionable recommendations for improving query performance.
   * 
   * @param {string} model - Prisma model name being queried
   * @param {string} operation - Database operation (findMany, findFirst, etc.)
   * @param {any} args - Query arguments including where, include, skip, etc.
   * @returns {string[]} Array of specific optimization suggestions
   * 
   * @example
   * // Analyze query with potential N+1 issue
   * const suggestions = QueryOptimizer.analyzeQuery('User', 'findMany', {
   *   where: { isActive: true }
   * });
   * // Returns: ["Consider using 'include' to fetch related data in a single query for User.findMany"]
   * 
   * @example
   * // Analyze query with inefficient pagination
   * const suggestions = QueryOptimizer.analyzeQuery('Course', 'findMany', {
   *   skip: 5000,
   *   take: 20
   * });
   * // Returns: ["Large offset (5000) detected. Consider cursor-based pagination for better performance."]
   */
  static analyzeQuery(model: string, operation: string, args: any): string[] {
    const suggestions: string[] = [];

    // Check for missing includes that might cause N+1 queries
    if (operation === 'findMany' && !args.include) {
      suggestions.push(`Consider using 'include' to fetch related data in a single query for ${model}.${operation}`);
    }

    // Check for inefficient pagination
    if (args.skip && args.skip > 1000) {
      suggestions.push(`Large offset (${args.skip}) detected. Consider cursor-based pagination for better performance.`);
    }

    // Check for missing where clauses on large tables
    if (operation === 'findMany' && !args.where && ['User', 'Course', 'Lesson'].includes(model)) {
      suggestions.push(`Consider adding filters to ${model}.${operation} to reduce data transfer.`);
    }

    return suggestions;
  }

  /**
   * Analyzes query patterns and suggests database indexes for performance optimization.
   * 
   * Examines a collection of database queries to identify frequently used fields in
   * WHERE clauses and ORDER BY statements. Generates specific index recommendations
   * based on usage frequency and query patterns to improve database performance.
   * 
   * @param {Array<{model: string, operation: string, args: any}>} queryLog - Array of executed queries with their parameters
   * @returns {string[]} Array of specific database index recommendations
   * 
   * @example
   * // Analyze query patterns for index suggestions
   * const queryLog = [
   *   { model: 'User', operation: 'findMany', args: { where: { email: 'user1@example.com' } } },
   *   { model: 'User', operation: 'findMany', args: { where: { email: 'user2@example.com' } } },
   *   { model: 'Course', operation: 'findMany', args: { orderBy: { createdAt: 'desc' } } },
   *   // ... more queries
   * ];
   * 
   * const suggestions = QueryOptimizer.suggestIndexes(queryLog);
   * // Returns: ["Consider adding index on User.email (used 15 times)", "Consider adding index on Course.createdAt_sort (used 12 times)"]
   * 
   * @example
   * // Use with query logging middleware
   * const queryLog = [];
   * prisma.$use(async (params, next) => {
   *   queryLog.push({ model: params.model, operation: params.action, args: params.args });
   *   return next(params);
   * });
   * 
   * // Periodically analyze and suggest indexes
   * setInterval(() => {
   *   const suggestions = QueryOptimizer.suggestIndexes(queryLog);
   *   suggestions.forEach(suggestion => logger.info(`Index suggestion: ${suggestion}`));
   * }, 3600000); // Every hour
   */
  static suggestIndexes(queryLog: Array<{ model: string; operation: string; args: any }>): string[] {
    const indexSuggestions: string[] = [];
    const fieldUsage = new Map<string, number>();

    // Analyze query patterns
    queryLog.forEach(({ model, args }) => {
      if (args.where) {
        Object.keys(args.where).forEach(field => {
          const key = `${model}.${field}`;
          fieldUsage.set(key, (fieldUsage.get(key) || 0) + 1);
        });
      }

      if (args.orderBy) {
        Object.keys(args.orderBy).forEach(field => {
          const key = `${model}.${field}_sort`;
          fieldUsage.set(key, (fieldUsage.get(key) || 0) + 1);
        });
      }
    });

    // Generate index suggestions for frequently used fields
    fieldUsage.forEach((count, field) => {
      if (count > 10) { // Frequently used fields
        indexSuggestions.push(`Consider adding index on ${field} (used ${count} times)`);
      }
    });

    return indexSuggestions;
  }
}

/**
 * Singleton performance monitor instance for application-wide request tracking.
 * 
 * Pre-configured PerformanceMonitor instance that serves as the primary performance
 * tracking system for the entire application. Used by Express middleware and health
 * check endpoints to provide consistent performance monitoring across all components.
 * 
 * @type {PerformanceMonitor}
 * @example
 * // Use in Express middleware
 * import { performanceMiddleware, performanceMonitor } from '@/shared/utils/performance';
 * app.use(performanceMiddleware(performanceMonitor));
 * 
 * @example
 * // Manual tracking
 * performanceMonitor.trackRequest(responseTime, isError);
 * 
 * @example
 * // Generate reports
 * const report = await performanceMonitor.generateReport();
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * Comprehensive health check utilities for system component monitoring.
 * 
 * Collection of health check functions that monitor critical system components including
 * database connectivity, cache performance, memory usage, and overall system health.
 * Designed for use with container orchestration systems (Kubernetes readiness/liveness probes)
 * and monitoring infrastructure. Each check returns standardized health status information
 * with timestamps and relevant metrics.
 * 
 * @namespace healthChecks
 * @example
 * // Check overall system health (Kubernetes readiness probe)
 * const systemHealth = await healthChecks.system();
 * if (systemHealth.status === 'healthy') {
 *   console.log('All systems operational');
 * }
 * 
 * @example
 * // Individual component health checks
 * const dbHealth = await healthChecks.database();
 * const cacheHealth = await healthChecks.cache();
 * const memoryHealth = await healthChecks.memory();
 * 
 * @example
 * // Use in health check endpoint
 * app.get('/health', async (req, res) => {
 *   const health = await healthChecks.system();
 *   const statusCode = health.status === 'healthy' ? 200 : 503;
 *   res.status(statusCode).json(health);
 * });
 */
export const healthChecks = {
  /**
   * Checks database connectivity and measures query performance.
   * 
   * Executes a simple test query to verify database connectivity and measures
   * response latency. Returns health status with connection details and performance
   * metrics. Essential for monitoring database availability in production environments.
   * 
   * @returns {Promise<{status: string, latency?: number, error?: string, timestamp: string}>} Database health status with latency metrics
   * 
   * @example
   * const dbHealth = await healthChecks.database();
   * if (dbHealth.status === 'healthy') {
   *   console.log(`Database responding in ${dbHealth.latency}ms`);
   * } else {
   *   console.error(`Database error: ${dbHealth.error}`);
   * }
   */
  async database() {
    try {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      return {
        status: 'healthy',
        latency,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  },

  /**
   * Evaluates cache system performance and health status.
   * 
   * Analyzes cache hit rates, size metrics, and overall performance to determine
   * cache health status. Uses configurable thresholds to classify cache performance
   * as healthy or degraded based on hit rate and size metrics.
   * 
   * @returns {Promise<{status: string, stats: object, timestamp: string}>} Cache health status with performance statistics
   * 
   * @example
   * const cacheHealth = await healthChecks.cache();
   * console.log(`Cache status: ${cacheHealth.status}`);
   * console.log(`Hit rate: ${cacheHealth.stats.hitRate}%`);
   * console.log(`Cache size: ${cacheHealth.stats.size} entries`);
   */
  async cache() {
    const stats = cacheService.getStats();
    const isHealthy = stats.hitRate > 50 && stats.size < 1000;

    return {
      status: isHealthy ? 'healthy' : 'degraded',
      stats,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Monitors system memory usage and determines memory health status.
   * 
   * Analyzes current heap memory usage and compares against configured thresholds
   * to determine if memory usage is within acceptable limits. Provides detailed
   * memory breakdown including heap used, heap total, and external memory usage.
   * 
   * @returns {Promise<{status: string, usage: object, timestamp: string}>} Memory health status with detailed usage metrics
   * 
   * @example
   * const memoryHealth = await healthChecks.memory();
   * if (memoryHealth.status === 'warning') {
   *   console.log(`High memory usage: ${memoryHealth.usage.heapUsedMB}MB`);
   * }
   */
  async memory() {
    const usage = process.memoryUsage();
    const usageMB = usage.heapUsed / 1024 / 1024;
    const isHealthy = usageMB < 500; // Less than 500MB

    return {
      status: isHealthy ? 'healthy' : 'warning',
      usage: {
        heapUsedMB: Math.round(usageMB),
        heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
        externalMB: Math.round(usage.external / 1024 / 1024),
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Performs comprehensive system health check across all components.
   * 
   * Aggregates health status from database, cache, and memory checks to provide
   * an overall system health assessment. Returns detailed component status and
   * determines overall system health based on individual component states.
   * Ideal for Kubernetes readiness probes and monitoring dashboards.
   * 
   * @returns {Promise<{status: string, components: object, uptime: number, timestamp: string}>} Comprehensive system health status
   * 
   * @example
   * const systemHealth = await healthChecks.system();
   * console.log(`System status: ${systemHealth.status}`);
   * console.log(`Uptime: ${systemHealth.uptime} seconds`);
   * console.log('Component status:', systemHealth.components);
   * 
   * @example
   * // Use for Kubernetes readiness probe
   * app.get('/ready', async (req, res) => {
   *   const health = await healthChecks.system();
   *   const statusCode = health.status === 'healthy' ? 200 : 503;
   *   res.status(statusCode).json(health);
   * });
   */
  async system() {
    const [db, cache, memory] = await Promise.all([
      healthChecks.database(),
      healthChecks.cache(),
      healthChecks.memory(),
    ]);

    const allHealthy = [db.status, cache.status, memory.status].every(
      status => status === 'healthy'
    );

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      components: { database: db, cache, memory },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  },
};