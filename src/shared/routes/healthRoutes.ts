// src/shared/routes/healthRoutes.ts

/**
 * Comprehensive system health monitoring, performance metrics, and observability endpoints.
 * 
 * This module provides a complete observability and monitoring solution for the WayrApp language
 * learning platform backend, implementing comprehensive health checks, performance metrics collection,
 * and operational management endpoints. The routes support both development debugging and production
 * monitoring scenarios, with integration capabilities for container orchestration and external
 * monitoring systems.
 * 
 * The module implements multiple health check endpoints ranging from basic system status to detailed
 * component-specific diagnostics. It provides Kubernetes-compatible readiness and liveness probes
 * for container orchestration, Prometheus-compatible metrics export for monitoring infrastructure,
 * and operational endpoints for cache management and performance monitoring controls.
 * 
 * Key features include comprehensive system health monitoring (database, cache, memory, system),
 * Kubernetes-compatible readiness and liveness probes, Prometheus metrics export for monitoring
 * integration, detailed performance metrics with request tracking, operational cache management
 * endpoints, database-specific health diagnostics with table counts and connection pool status,
 * and comprehensive error handling with appropriate HTTP status codes.
 * 
 * The health check endpoints are designed to provide actionable insights for both automated
 * monitoring systems and human operators. All endpoints include proper error handling and return
 * structured JSON responses with timestamps and detailed component status information.
 * 
 * @module HealthRoutes
 * @category Routes
 * @category Monitoring
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Mount health routes in main application
 * import healthRoutes from '@/shared/routes/healthRoutes';
 * app.use(healthRoutes);
 * 
 * @example
 * // Available health check endpoints:
 * // GET /health - Basic system health check
 * // GET /health/detailed - Comprehensive health report
 * // GET /health/database - Database-specific diagnostics
 * // GET /health/cache - Cache system diagnostics
 * // GET /ready - Kubernetes readiness probe
 * // GET /live - Kubernetes liveness probe
 * 
 * @example
 * // Monitoring and metrics endpoints:
 * // GET /metrics - Performance metrics in JSON format
 * // GET /metrics/prometheus - Prometheus-compatible metrics
 * // POST /metrics/reset - Reset performance counters
 * // POST /cache/clear - Clear application cache
 * // POST /cache/cleanup - Cleanup expired cache entries
 */

import { Router } from 'express';
import { healthChecks, performanceMonitor } from '@/shared/utils/performance';
import { cacheService } from '@/shared/utils/cache';
import { prisma } from '@/shared/database/connection';
import { logger } from '@/shared/utils/logger';

/**
 * Express router configured with comprehensive health monitoring and observability endpoints.
 * 
 * @type {Router}
 */
const router = Router();

/**
 * Basic system health check endpoint.
 * 
 * Provides a quick overview of system health status including uptime, environment,
 * version, and basic component status. Returns HTTP 200 for healthy systems and
 * HTTP 503 for unhealthy systems.
 * 
 * @route GET /health
 * @returns {Object} Basic health status with system information
 */
router.get('/health', async (_req, res) => {
  try {
    const health = await healthChecks.system();
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
      status: health.status,
      timestamp: health.timestamp,
      uptime: health.uptime,
      environment: process.env['NODE_ENV'] || 'development',
      version: process.env['npm_package_version'] || '1.0.0',
      components: health.components,
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

/**
 * Comprehensive health check with detailed component analysis.
 * 
 * Provides in-depth health information for all system components including
 * database, cache, memory, system resources, performance metrics, and
 * environment configuration. Useful for detailed system diagnostics.
 * 
 * @route GET /health/detailed
 * @returns {Object} Detailed health report with all component diagnostics
 */
router.get('/health/detailed', async (_req, res) => {
  try {
    const [database, cache, memory, system] = await Promise.all([
      healthChecks.database(),
      healthChecks.cache(),
      healthChecks.memory(),
      healthChecks.system(),
    ]);

    const performanceReport = await performanceMonitor.generateReport();

    res.json({
      status: system.status,
      timestamp: new Date().toISOString(),
      components: {
        database,
        cache,
        memory,
        system: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
        },
      },
      performance: performanceReport,
      environment: {
        nodeEnv: process.env['NODE_ENV'],
        databaseUrl: process.env['DATABASE_URL'] ? 'configured' : 'missing',
        cacheMaxSize: process.env['CACHE_MAX_SIZE'] || 'default',
        dbConnectionLimit: process.env['DB_CONNECTION_LIMIT'] || 'default',
      },
    });
  } catch (error) {
    logger.error('Detailed health check failed', { error });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed',
    });
  }
});

/**
 * Database-specific health check and diagnostics.
 * 
 * Provides detailed database health information including connection status,
 * table counts, sample da, connection pool configuration, and database
 * metrics. Useful for database-specific troubleshooting and monitoring.
 * 
 * @route GET /health/database
 * @returns {Object} Database health status with detailed diagnost
 */
router.get('/health/database', async (_req, res) => {
  try {
    const dbHealth = await healthChecks.database();
    
    // Get additional database metrics if available
    const dbMetrics = (prisma as any).getMetrics ? (prisma as any).getMetrics() : null;
    
    // Get table counts for debugging
    const tableCounts = await Promise.all([
      prisma.course.count().catch(() => 0),
      prisma.level.count().catch(() => 0),
      prisma.section.count().catch(() => 0),
      prisma.module.count().catch(() => 0),
      prisma.lesson.count().catch(() => 0),
      prisma.exercise.count().catch(() => 0),
    ]);
    
    // Get sample course data for debugging
    const sampleCourse = await prisma.course.findFirst({
      select: {
        id: true,
        name: true,
        isPublic: true,
        createdAt: true,
      }
    }).catch(() => null);
    
    res.json({
      ...dbHealth,
      metrics: dbMetrics,
      tableCounts: {
        courses: tableCounts[0],
        levels: tableCounts[1],
        sections: tableCounts[2],
        modules: tableCounts[3],
        lessons: tableCounts[4],
        exercises: tableCounts[5],
      },
      sampleCourse,
      connectionPool: {
        limit: process.env['DB_CONNECTION_LIMIT'] || '10',
        timeout: process.env['DB_POOL_TIMEOUT'] || '10',
      },
    });
  } catch (error) {
    logger.error('Database health check failed', { error });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Database health check failed',
    });
  }
});

/**
 * Cache system health check and statistics.
 * 
 * Provides cache system health information including hit rates, size statistics,
 * configuration details, and performance metrics. Useful for cache optimization
 * and troubleshooting.
 * 
 * @route GET /health/cache
 * @returns {Object} Cache health status with detailed statistics
 */
router.get('/health/cache', async (_req, res) => {
  try {
    const cacheHealth = await healthChecks.cache();
    const cacheStats = cacheService.getStats();
    
    res.json({
      ...cacheHealth,
      detailed_stats: cacheStats,
      configuration: {
        maxSize: process.env['CACHE_MAX_SIZE'] || '1000',
        defaultTTL: '5 minutes',
      },
    });
  } catch (error) {
    logger.error('Cache health check failed', { error });
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Cache health check failed',
    });
  }
});

/**
 * Performance metrics endpoint in JSON format.
 * 
 * Provides comprehensive performance metrics including request statistics,
 * response times, error rates, system resource usage, and performance
 * recommendations. Useful for performance analysis and optimization.
 * 
 * @route GET /metrics
 * @returns {Object} Performance metrics and system statistics
 */
router.get('/metrics', async (_req, res) => {
  try {
    const performanceReport = await performanceMonitor.generateReport();
    
    res.json({
      timestamp: new Date().toISOString(),
      ...performanceReport,
      metadata: {
        collection_period: 'Last 1000 requests',
        slow_request_threshold: '1000ms',
        cache_cleanup_interval: '10 minutes',
      },
    });
  } catch (error) {
    logger.error('Metrics collection failed', { error });
    res.status(500).json({
      error: 'Metrics collection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Performance metrics in Prometheus format for monitoring integration.
 * 
 * Exports performance metrics in Prometheus-compatible format for integration
 * with monitoring systems like Grafana, Prometheus, and other observability
 * platforms. Returns metrics as plain text in Prometheus exposition format.
 * 
 * @route GET /metrics/prometheus
 * @returns {string} Prometheus-formatted metrics
 */
router.get('/metrics/prometheus', async (_req, res) => {
  try {
    const report = await performanceMonitor.generateReport();
    const cacheStats = cacheService.getStats();
    
    // Generate Prometheus-style metrics
    const metrics = [
      `# HELP wayrapp_requests_total Total number of HTTP requests`,
      `# TYPE wayrapp_requests_total counter`,
      `wayrapp_requests_total ${report.requests.totalRequests}`,
      '',
      `# HELP wayrapp_request_duration_ms Average request duration in milliseconds`,
      `# TYPE wayrapp_request_duration_ms gauge`,
      `wayrapp_request_duration_ms ${report.requests.averageResponseTime}`,
      '',
      `# HELP wayrapp_slow_requests_total Total number of slow requests (>1s)`,
      `# TYPE wayrapp_slow_requests_total counter`,
      `wayrapp_slow_requests_total ${report.requests.slowRequests}`,
      '',
      `# HELP wayrapp_error_rate_percent Error rate percentage`,
      `# TYPE wayrapp_error_rate_percent gauge`,
      `wayrapp_error_rate_percent ${report.requests.errorRate}`,
      '',
      `# HELP wayrapp_cache_hit_rate_percent Cache hit rate percentage`,
      `# TYPE wayrapp_cache_hit_rate_percent gauge`,
      `wayrapp_cache_hit_rate_percent ${cacheStats.hitRate}`,
      '',
      `# HELP wayrapp_cache_size_entries Number of entries in cache`,
      `# TYPE wayrapp_cache_size_entries gauge`,
      `wayrapp_cache_size_entries ${cacheStats.size}`,
      '',
      `# HELP wayrapp_memory_usage_bytes Memory usage in bytes`,
      `# TYPE wayrapp_memory_usage_bytes gauge`,
      `wayrapp_memory_usage_bytes ${report.system.memoryUsage.heapUsed}`,
      '',
      `# HELP wayrapp_uptime_seconds Application uptime in seconds`,
      `# TYPE wayrapp_uptime_seconds gauge`,
      `wayrapp_uptime_seconds ${report.system.uptime}`,
    ].join('\n');
    
    res.set('Content-Type', 'text/plain');
    res.send(metrics);
  } catch (error) {
    logger.error('Prometheus metrics generation failed', { error });
    res.status(500).send('# Error generating metrics\n');
  }
});

// Cache management endpoints
router.post('/cache/clear', async (_req, res) => {
  try {
    await cacheService.clear();
    logger.info('Cache cleared via API');
    
    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cache clear failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache',
      timestamp: new Date().toISOString(),
    });
  }
});

router.post('/cache/cleanup', async (_req, res) => {
  try {
    cacheService.cleanup();
    const stats = cacheService.getStats();
    
    res.json({
      success: true,
      message: 'Cache cleanup completed',
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Cache cleanup failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup cache',
      timestamp: new Date().toISOString(),
    });
  }
});

// Performance monitoring controls
router.post('/metrics/reset', async (_req, res) => {
  try {
    performanceMonitor.resetMetrics();
    logger.info('Performance metrics reset via API');
    
    res.json({
      success: true,
      message: 'Performance metrics reset successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Metrics reset failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Kubernetes readiness probe endpoint.
 * 
 * Determines if the application is ready to receive traffic by checking
 * essential services like database connectivity. Returns HTTP 200 when ready
 * and HTTP 503 when not ready. Used by Kubernetes for traffic routing decisions.
 * 
 * @route GET /ready
 * @returns {Object} Readiness status for container orchestration
 */
router.get('/ready', async (_req, res) => {
  try {
    // Check if essential services are ready
    const dbCheck = await healthChecks.database();
    
    if (dbCheck.status === 'healthy') {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        reason: 'Database not available',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: 'Readiness check failed',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Kubernetes liveness probe endpoint.
 * 
 * Simple liveness check that indicates if the application process is alive
 * and responsive. Always returns HTTP 200 if the server can respond.
 * Used by Kubernetes to determine if the container should be restarted.
 * 
 * @route GET /live
 * @returns {Object} Liveness status with uptime information
 */
router.get('/live', (_req, res) => {
  // Simple liveness check - if the server can respond, it's alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;