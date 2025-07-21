/**
 * Performance Monitoring Utilities
 * Comprehensive performance tracking and optimization tools
 * 
 * @author Exequiel Trujillo
 */

import { logger } from './logger';
import { cacheService } from './cache';
import { prisma } from '@/shared/database/connection';

// Performance metrics interfaces
interface RequestMetrics {
  totalRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  errorRate: number;
  requestsPerMinute: number;
  peakResponseTime: number;
  fastestResponseTime: number;
}

interface SystemMetrics {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  activeConnections: number;
  timestamp: number;
}

interface PerformanceReport {
  system: SystemMetrics;
  requests: RequestMetrics;
  database: any; // Will be populated by database health check
  cache: any; // Will be populated by cache stats
  recommendations: string[];
}

class PerformanceMonitor {
  private requestTimes: number[] = [];
  private requestCount = 0;
  private errorCount = 0;
  private slowRequestCount = 0;
  private readonly SLOW_REQUEST_THRESHOLD = 1000; // 1 second
  private readonly MAX_STORED_TIMES = 1000; // Keep last 1000 request times

  // Track request performance
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

  // Get current request metrics
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

  // Get system metrics
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

  // Generate performance recommendations
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

  // Generate comprehensive performance report
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

  // Reset metrics (useful for testing or periodic resets)
  resetMetrics(): void {
    this.requestTimes = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.slowRequestCount = 0;
    logger.info('Performance metrics reset');
  }
}

// Middleware for automatic request tracking
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

// Query optimization utilities
export class QueryOptimizer {
  // Analyze and suggest query optimizations
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
  
  // Suggest database indexes based on query patterns
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

// Singleton performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Health check utilities
export const healthChecks = {
  // Database connectivity and performance
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
  
  // Cache performance
  async cache() {
    const stats = cacheService.getStats();
    const isHealthy = stats.hitRate > 50 && stats.size < 1000;
    
    return {
      status: isHealthy ? 'healthy' : 'degraded',
      stats,
      timestamp: new Date().toISOString(),
    };
  },
  
  // Memory usage
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
  
  // Overall system health
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