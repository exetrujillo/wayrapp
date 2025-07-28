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

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *       - Monitoring
 *     summary: Basic health check
 *     description: Provides a quick overview of system health status including uptime, environment, version, and basic component status
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *                 uptime:
 *                   type: number
 *                   description: Application uptime in seconds
 *                   example: 3600
 *                 environment:
 *                   type: string
 *                   example: "production"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 components:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       example: "healthy"
 *                     cache:
 *                       type: string
 *                       enum: [healthy, unhealthy]
 *                       example: "healthy"
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *                 error:
 *                   type: string
 *                   example: "Health check failed"
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

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     tags:
 *       - Health
 *       - Monitoring
 *     summary: Detailed health report
 *     description: Provides comprehensive health information for all system components including database, cache, memory, performance metrics, and environment configuration
 *     responses:
 *       200:
 *         description: Detailed health report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *                 components:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         responseTime:
 *                           type: number
 *                           example: 15
 *                     cache:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         hitRate:
 *                           type: number
 *                           example: 85.5
 *                     memory:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "healthy"
 *                         heapUsed:
 *                           type: number
 *                           example: 52428800
 *                     system:
 *                       type: object
 *                       properties:
 *                         uptime:
 *                           type: number
 *                           example: 3600
 *                         nodeVersion:
 *                           type: string
 *                           example: "v18.17.0"
 *                         platform:
 *                           type: string
 *                           example: "linux"
 *                         arch:
 *                           type: string
 *                           example: "x64"
 *                 performance:
 *                   type: object
 *                   properties:
 *                     requests:
 *                       type: object
 *                       properties:
 *                         totalRequests:
 *                           type: number
 *                           example: 1500
 *                         averageResponseTime:
 *                           type: number
 *                           example: 250
 *                         errorRate:
 *                           type: number
 *                           example: 2.5
 *                 environment:
 *                   type: object
 *                   properties:
 *                     nodeEnv:
 *                       type: string
 *                       example: "production"
 *                     databaseUrl:
 *                       type: string
 *                       example: "configured"
 *                     cacheMaxSize:
 *                       type: string
 *                       example: "1000"
 *       503:
 *         description: Detailed health check failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *                 error:
 *                   type: string
 *                   example: "Detailed health check failed"
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
 * table counts, sample data, connection pool configuration, and database
 * metrics. Useful for database-specific troubleshooting and monitoring.
 * 
 * @route GET /health/database
 * @returns {Object} Database health status with detailed diagnostics
 */

/**
 * @swagger
 * /health/database:
 *   get:
 *     tags:
 *       - Health
 *       - Database
 *       - Monitoring
 *     summary: Database health status
 *     description: Provides detailed database health information including connection status, table counts, sample data, and connection pool configuration
 *     responses:
 *       200:
 *         description: Database health information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *                 responseTime:
 *                   type: number
 *                   description: Database response time in milliseconds
 *                   example: 15
 *                 metrics:
 *                   type: object
 *                   nullable: true
 *                   description: Database-specific metrics if available
 *                 tableCounts:
 *                   type: object
 *                   properties:
 *                     courses:
 *                       type: number
 *                       example: 25
 *                     levels:
 *                       type: number
 *                       example: 150
 *                     sections:
 *                       type: number
 *                       example: 450
 *                     modules:
 *                       type: number
 *                       example: 1200
 *                     lessons:
 *                       type: number
 *                       example: 3600
 *                     exercises:
 *                       type: number
 *                       example: 18000
 *                 sampleCourse:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "qu-es-beginner"
 *                     name:
 *                       type: string
 *                       example: "Quechua for Spanish Speakers"
 *                     isPublic:
 *                       type: boolean
 *                       example: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T08:00:00.000Z"
 *                 connectionPool:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: string
 *                       example: "10"
 *                     timeout:
 *                       type: string
 *                       example: "10"
 *       503:
 *         description: Database health check failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *                 error:
 *                   type: string
 *                   example: "Database health check failed"
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

/**
 * @swagger
 * /health/cache:
 *   get:
 *     tags:
 *       - Health
 *       - Cache
 *       - Monitoring
 *     summary: Cache health status
 *     description: Provides cache system health information including hit rates, size statistics, configuration details, and performance metrics
 *     responses:
 *       200:
 *         description: Cache health information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy]
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *                 hitRate:
 *                   type: number
 *                   description: Cache hit rate percentage
 *                   example: 85.5
 *                 size:
 *                   type: number
 *                   description: Number of entries in cache
 *                   example: 450
 *                 detailed_stats:
 *                   type: object
 *                   properties:
 *                     hits:
 *                       type: number
 *                       example: 1275
 *                     misses:
 *                       type: number
 *                       example: 225
 *                     hitRate:
 *                       type: number
 *                       example: 85.0
 *                     size:
 *                       type: number
 *                       example: 450
 *                     maxSize:
 *                       type: number
 *                       example: 1000
 *                 configuration:
 *                   type: object
 *                   properties:
 *                     maxSize:
 *                       type: string
 *                       example: "1000"
 *                     defaultTTL:
 *                       type: string
 *                       example: "5 minutes"
 *       503:
 *         description: Cache health check failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "error"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *                 error:
 *                   type: string
 *                   example: "Cache health check failed"
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

/**
 * @swagger
 * /metrics:
 *   get:
 *     tags:
 *       - Metrics
 *       - Performance
 *       - Monitoring
 *     summary: Performance metrics
 *     description: Provides comprehensive performance metrics including request statistics, response times, error rates, and system resource usage in JSON format
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *                 requests:
 *                   type: object
 *                   properties:
 *                     totalRequests:
 *                       type: number
 *                       example: 1500
 *                     averageResponseTime:
 *                       type: number
 *                       description: Average response time in milliseconds
 *                       example: 250
 *                     slowRequests:
 *                       type: number
 *                       description: Number of requests slower than 1000ms
 *                       example: 25
 *                     errorRate:
 *                       type: number
 *                       description: Error rate percentage
 *                       example: 2.5
 *                 system:
 *                   type: object
 *                   properties:
 *                     uptime:
 *                       type: number
 *                       description: System uptime in seconds
 *                       example: 3600
 *                     memoryUsage:
 *                       type: object
 *                       properties:
 *                         heapUsed:
 *                           type: number
 *                           example: 52428800
 *                         heapTotal:
 *                           type: number
 *                           example: 67108864
 *                         external:
 *                           type: number
 *                           example: 1024000
 *                 database:
 *                   type: object
 *                   properties:
 *                     averageQueryTime:
 *                       type: number
 *                       example: 15
 *                     slowQueries:
 *                       type: number
 *                       example: 5
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Consider optimizing slow database queries", "Monitor memory usage"]
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     collection_period:
 *                       type: string
 *                       example: "Last 1000 requests"
 *                     slow_request_threshold:
 *                       type: string
 *                       example: "1000ms"
 *                     cache_cleanup_interval:
 *                       type: string
 *                       example: "10 minutes"
 *       500:
 *         description: Metrics collection failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Metrics collection failed"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
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

/**
 * @swagger
 * /metrics/prometheus:
 *   get:
 *     tags:
 *       - Metrics
 *       - Performance
 *       - Monitoring
 *       - Prometheus
 *     summary: Prometheus-formatted metrics
 *     description: Exports performance metrics in Prometheus-compatible format for integration with monitoring systems like Grafana and Prometheus
 *     responses:
 *       200:
 *         description: Prometheus metrics retrieved successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP wayrapp_requests_total Total number of HTTP requests
 *                 # TYPE wayrapp_requests_total counter
 *                 wayrapp_requests_total 1500
 *                 
 *                 # HELP wayrapp_request_duration_ms Average request duration in milliseconds
 *                 # TYPE wayrapp_request_duration_ms gauge
 *                 wayrapp_request_duration_ms 250
 *                 
 *                 # HELP wayrapp_slow_requests_total Total number of slow requests (>1s)
 *                 # TYPE wayrapp_slow_requests_total counter
 *                 wayrapp_slow_requests_total 25
 *                 
 *                 # HELP wayrapp_error_rate_percent Error rate percentage
 *                 # TYPE wayrapp_error_rate_percent gauge
 *                 wayrapp_error_rate_percent 2.5
 *                 
 *                 # HELP wayrapp_cache_hit_rate_percent Cache hit rate percentage
 *                 # TYPE wayrapp_cache_hit_rate_percent gauge
 *                 wayrapp_cache_hit_rate_percent 85.0
 *                 
 *                 # HELP wayrapp_memory_usage_bytes Memory usage in bytes
 *                 # TYPE wayrapp_memory_usage_bytes gauge
 *                 wayrapp_memory_usage_bytes 52428800
 *                 
 *                 # HELP wayrapp_uptime_seconds Application uptime in seconds
 *                 # TYPE wayrapp_uptime_seconds gauge
 *                 wayrapp_uptime_seconds 3600
 *       500:
 *         description: Prometheus metrics generation failed
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "# Error generating metrics"
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

/**
 * @swagger
 * /cache/clear:
 *   post:
 *     tags:
 *       - Cache
 *       - Management
 *       - Operations
 *     summary: Clear cache
 *     description: Clears all entries from the application cache. This operation removes all cached data and forces fresh data retrieval on subsequent requests
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cache cleared successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *       500:
 *         description: Failed to clear cache
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to clear cache"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 */
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

/**
 * @swagger
 * /cache/cleanup:
 *   post:
 *     tags:
 *       - Cache
 *       - Management
 *       - Operations
 *     summary: Cleanup cache
 *     description: Removes expired entries from the cache while keeping valid entries. This operation optimizes cache performance by removing stale data
 *     responses:
 *       200:
 *         description: Cache cleanup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Cache cleanup completed"
 *                 stats:
 *                   type: object
 *                   properties:
 *                     hits:
 *                       type: number
 *                       example: 1275
 *                     misses:
 *                       type: number
 *                       example: 225
 *                     hitRate:
 *                       type: number
 *                       example: 85.0
 *                     size:
 *                       type: number
 *                       example: 420
 *                     maxSize:
 *                       type: number
 *                       example: 1000
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *       500:
 *         description: Failed to cleanup cache
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to cleanup cache"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 */
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

/**
 * @swagger
 * /metrics/reset:
 *   post:
 *     tags:
 *       - Metrics
 *       - Performance
 *       - Management
 *       - Operations
 *     summary: Reset metrics
 *     description: Resets all performance metrics counters to zero. This operation clears historical performance data and starts fresh metric collection
 *     responses:
 *       200:
 *         description: Performance metrics reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Performance metrics reset successfully"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *       500:
 *         description: Failed to reset metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to reset metrics"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 */
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

/**
 * @swagger
 * /ready:
 *   get:
 *     tags:
 *       - Health
 *       - Kubernetes
 *       - Monitoring
 *     summary: Readiness probe
 *     description: Kubernetes readiness probe that determines if the application is ready to receive traffic by checking essential services like database connectivity
 *     responses:
 *       200:
 *         description: Application is ready to receive traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ready"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *       503:
 *         description: Application is not ready to receive traffic
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "not ready"
 *                 reason:
 *                   type: string
 *                   example: "Database not available"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
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

/**
 * @swagger
 * /live:
 *   get:
 *     tags:
 *       - Health
 *       - Kubernetes
 *       - Monitoring
 *     summary: Liveness probe
 *     description: Kubernetes liveness probe that indicates if the application process is alive and responsive. Always returns HTTP 200 if the server can respond
 *     responses:
 *       200:
 *         description: Application is alive and responsive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "alive"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-20T10:30:00.000Z"
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds
 *                   example: 3600
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