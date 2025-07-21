---
layout: default
title: Performance Optimization and Monitoring
---

# Performance Optimization and Monitoring

This document describes the comprehensive performance optimization and monitoring features implemented in the WayrApp backend.

## Overview

The performance optimization system includes:

- **Database Connection Pooling**: Optimized connection management with Neon PostgreSQL
- **Response Caching**: Multi-tier caching strategy for frequently accessed content
- **Performance Monitoring**: Real-time metrics collection and analysis
- **Database Optimization**: Query optimization, indexing, and maintenance
- **Health Check Endpoints**: Comprehensive system health monitoring

## Features Implemented

### 1. Database Connection Pooling

**Location**: `src/shared/database/connection.ts`

- Singleton pattern for Prisma client management
- Optimized connection pool configuration
- Query performance monitoring with automatic slow query detection
- Connection health checks and metrics collection

**Configuration**:
```env
DB_CONNECTION_LIMIT=10          # Maximum database connections
DB_POOL_TIMEOUT=10              # Connection timeout in seconds
DB_SCHEMA_CACHE_SIZE=1000       # Schema cache size
```

**Features**:
- Automatic slow query logging (>1000ms)
- Very slow query alerts (>5000ms)
- Query performance metrics collection
- Connection pool health monitoring

### 2. Response Caching System

**Location**: `src/shared/utils/cache.ts`

Advanced in-memory caching with:
- **LRU Eviction**: Automatic removal of least recently used entries
- **TTL Management**: Different cache durations for different content types
- **Hit Rate Tracking**: Performance metrics and statistics
- **Pattern-based Invalidation**: Bulk cache invalidation by key patterns
- **Cache Warm-up**: Pre-loading frequently accessed data

**Cache TTL Configuration**:
- Packaged Courses: 30 minutes (infrequent changes)
- Course Lists: 10 minutes (moderate changes)
- Course Details: 15 minutes
- User Progress: 2 minutes (frequent changes)
- Exercise Lists: 20 minutes
- Health Checks: 30 seconds

**Configuration**:
```env
CACHE_MAX_SIZE=1000             # Maximum cache entries
```

### 3. Performance Monitoring

**Location**: `src/shared/utils/performance.ts`

Comprehensive performance tracking including:
- **Request Metrics**: Response times, error rates, throughput
- **System Metrics**: Memory usage, CPU usage, uptime
- **Database Metrics**: Query performance, connection status
- **Cache Metrics**: Hit rates, memory usage, entry counts
- **Automated Recommendations**: Performance improvement suggestions

**Middleware Integration**:
```typescript
import { performanceMiddleware, performanceMonitor } from "@/shared/utils/performance";
app.use(performanceMiddleware(performanceMonitor));
```

### 4. Database Optimization

**Location**: `src/shared/database/optimization.ts`

Advanced database optimization features:
- **Performance Indexes**: Automatic creation of optimized indexes
- **Query Analysis**: Slow query detection and optimization suggestions
- **Batch Operations**: Efficient bulk create/update operations
- **Data Cleanup**: Automatic removal of expired data
- **Statistics Analysis**: Table and query performance analysis

**Performance Indexes Created**:
- Composite indexes for common query patterns
- Partial indexes for active users
- Full-text search indexes for content
- GIN indexes for JSONB exercise data

### 5. Health Check Endpoints

**Location**: `src/shared/routes/healthRoutes.ts`

Comprehensive health monitoring:

#### Basic Health Check
```
GET /health
```
Returns overall system status with component health.

#### Detailed Health Check
```
GET /health/detailed
```
Returns comprehensive system information including performance metrics.

#### Component-Specific Health Checks
```
GET /health/database    # Database connectivity and performance
GET /health/cache       # Cache performance and statistics
```

#### Performance Metrics
```
GET /metrics            # Detailed performance report
GET /metrics/prometheus # Prometheus-compatible metrics
```

#### Management Endpoints
```
POST /cache/clear       # Clear all cache entries
POST /cache/cleanup     # Remove expired cache entries
POST /metrics/reset     # Reset performance metrics
```

#### Container Orchestration Support
```
GET /ready              # Readiness probe (for Kubernetes)
GET /live               # Liveness probe (for Kubernetes)
```

### 6. Startup Optimization

**Location**: `src/shared/utils/startup.ts`

Automated startup optimization:
- **Database Initialization**: Index creation and optimization
- **Cache Warm-up**: Pre-loading frequently accessed data
- **Maintenance Tasks**: Periodic cleanup and optimization
- **Health Verification**: Startup health checks

**Periodic Maintenance**:
- Cache cleanup: Every 10 minutes
- Database cleanup: Every hour
- Performance analysis: Every 6 hours
- Cache statistics logging: Every 30 minutes

## Usage Examples

### Monitoring Performance

```typescript
import { performanceMonitor } from '@/shared/utils/performance';

// Get current performance metrics
const metrics = performanceMonitor.getRequestMetrics();
console.log(`Average response time: ${metrics.averageResponseTime}ms`);
console.log(`Error rate: ${metrics.errorRate}%`);

// Generate comprehensive report
const report = await performanceMonitor.generateReport();
console.log('Recommendations:', report.recommendations);
```

### Using Cache Service

```typescript
import { cacheService, CACHE_KEYS } from '@/shared/utils/cache';

// Cache a course with automatic TTL
await cacheService.set(CACHE_KEYS.COURSE(courseId), courseData);

// Retrieve cached data
const cachedCourse = await cacheService.get(CACHE_KEYS.COURSE(courseId));

// Invalidate related cache entries
await cacheService.invalidatePattern('^course:');

// Get cache statistics
const stats = cacheService.getStats();
console.log(`Cache hit rate: ${stats.hitRate}%`);
```

### Database Optimization

```typescript
import { DatabaseOptimizer } from '@/shared/database/optimization';

const optimizer = new DatabaseOptimizer(prisma);

// Create performance indexes
await optimizer.createPerformanceIndexes();

// Analyze performance
const analysis = await optimizer.runPerformanceAnalysis();

// Clean up expired data
await optimizer.cleanupExpiredData();
```

### Query Performance Monitoring

```typescript
import { monitorQuery } from '@/shared/database/optimization';

class MyService {
  @monitorQuery
  async slowQuery() {
    // This query will be automatically monitored
    return await prisma.user.findMany({
      include: { progress: true }
    });
  }
}
```

## Performance Metrics

### Request Metrics
- **Total Requests**: Count of all HTTP requests
- **Average Response Time**: Mean response time in milliseconds
- **Slow Requests**: Count of requests >1000ms
- **Error Rate**: Percentage of failed requests
- **Peak Response Time**: Slowest request time
- **Requests Per Minute**: Current throughput

### Cache Metrics
- **Hit Rate**: Percentage of cache hits vs misses
- **Memory Usage**: Estimated cache memory consumption
- **Entry Count**: Number of cached items
- **Average Access Count**: How often items are accessed

### Database Metrics
- **Query Count**: Total database queries executed
- **Slow Queries**: Queries taking >100ms average
- **Connection Pool**: Active connections and limits
- **Database Size**: Storage usage information

## Monitoring Integration

### Prometheus Metrics

The system exports Prometheus-compatible metrics at `/metrics/prometheus`:

```
# HELP wayrapp_requests_total Total number of HTTP requests
# TYPE wayrapp_requests_total counter
wayrapp_requests_total 1234

# HELP wayrapp_request_duration_ms Average request duration
# TYPE wayrapp_request_duration_ms gauge
wayrapp_request_duration_ms 245.5

# HELP wayrapp_cache_hit_rate_percent Cache hit rate percentage
# TYPE wayrapp_cache_hit_rate_percent gauge
wayrapp_cache_hit_rate_percent 78.5
```

### Health Check Integration

Health checks return structured JSON responses:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00Z",
  "components": {
    "database": {
      "status": "healthy",
      "latency": 15
    },
    "cache": {
      "status": "healthy",
      "hitRate": 78.5
    },
    "memory": {
      "status": "healthy",
      "heapUsedMB": 125
    }
  }
}
```

## Performance Recommendations

The system automatically generates performance recommendations:

- **High Response Time**: Suggests query optimization or caching
- **High Error Rate**: Recommends error handling improvements
- **Low Cache Hit Rate**: Suggests caching strategy review
- **High Memory Usage**: Recommends memory optimization
- **Slow Database Queries**: Suggests indexing improvements

## Configuration

### Environment Variables

```env
# Database Performance
DB_CONNECTION_LIMIT=10
DB_POOL_TIMEOUT=10
DB_SCHEMA_CACHE_SIZE=1000

# Cache Configuration
CACHE_MAX_SIZE=1000

# Performance Monitoring
ENABLE_PERFORMANCE_MONITORING=true
SLOW_QUERY_THRESHOLD=1000
```

### Startup Configuration

The system automatically initializes performance optimizations on startup:

1. **Database Optimization**: Creates indexes and optimizes configuration
2. **Cache Warm-up**: Pre-loads frequently accessed data
3. **Health Verification**: Ensures all systems are operational
4. **Maintenance Setup**: Configures periodic optimization tasks

## Testing

Comprehensive test suites verify performance features:

```bash
# Run performance monitoring tests
npm test -- --testPathPattern="performance"

# Run database optimization tests
npm test -- --testPathPattern="optimization"
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**: Check cache size and implement cleanup
2. **Slow Database Queries**: Review indexes and query patterns
3. **Low Cache Hit Rate**: Adjust TTL values and cache keys
4. **Connection Pool Exhaustion**: Increase connection limits

### Debug Information

Enable debug logging for detailed performance information:

```env
LOG_LEVEL=debug
```

### Performance Analysis

Use the comprehensive analysis endpoint:

```bash
curl http://localhost:3000/metrics
```

This returns detailed performance metrics and recommendations for optimization.

## Future Enhancements

Planned improvements include:

- **Redis Integration**: External caching for distributed deployments
- **Query Plan Analysis**: Automatic query optimization suggestions
- **Real-time Alerting**: Performance threshold notifications
- **Advanced Metrics**: Custom business metrics tracking
- **Load Testing Integration**: Automated performance testing

## Conclusion

The performance optimization system provides comprehensive monitoring, caching, and optimization features that ensure the WayrApp backend operates efficiently at scale. The system automatically handles common performance bottlenecks while providing detailed insights for further optimization.