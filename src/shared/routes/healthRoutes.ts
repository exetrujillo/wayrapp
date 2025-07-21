/**
 * Health Check and Monitoring Routes
 * Comprehensive system health monitoring and performance metrics
 * 
 * @author Exequiel Trujillo
 */

import { Router } from 'express';
import { healthChecks, performanceMonitor } from '@/shared/utils/performance';
import { cacheService } from '@/shared/utils/cache';
import { prisma } from '@/shared/database/connection';
import { logger } from '@/shared/utils/logger';

const router = Router();

// Basic health check endpoint
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

// Detailed health check with all components
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

// Database-specific health check
router.get('/health/database', async (_req, res) => {
  try {
    const dbHealth = await healthChecks.database();
    
    // Get additional database metrics if available
    const dbMetrics = (prisma as any).getMetrics ? (prisma as any).getMetrics() : null;
    
    res.json({
      ...dbHealth,
      metrics: dbMetrics,
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

// Cache-specific health check
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

// Performance metrics endpoint
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

// Performance metrics in Prometheus format (for monitoring tools)
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

// Readiness probe (for Kubernetes/container orchestration)
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

// Liveness probe (for Kubernetes/container orchestration)
router.get('/live', (_req, res) => {
  // Simple liveness check - if the server can respond, it's alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;