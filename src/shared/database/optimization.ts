/**
 * Database Optimization Utilities
 * Query optimization, index management, and performance tuning
 * 
 * @author Exequiel Trujillo
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';

export class DatabaseOptimizer {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create additional performance indexes not covered by Prisma schema
   */
  async createPerformanceIndexes(): Promise<void> {
    const indexes = [
      // Composite indexes for common query patterns
      {
        name: 'idx_user_progress_activity_exp',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_progress_activity_exp 
              ON user_progress (last_activity_date DESC, experience_points DESC)`,
        description: 'Optimize leaderboard and activity queries',
      },
      {
        name: 'idx_lesson_completions_user_date',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_completions_user_date 
              ON lesson_completions (user_id, completed_at DESC)`,
        description: 'Optimize user progress history queries',
      },
      {
        name: 'idx_courses_language_public_created',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_language_public_created 
              ON courses (source_language, target_language, is_public, created_at DESC) 
              WHERE is_public = true`,
        description: 'Optimize course discovery queries',
      },
      {
        name: 'idx_exercises_type_data_gin',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercises_type_data_gin 
              ON exercises USING GIN (exercise_type, data)`,
        description: 'Optimize exercise search by type and content',
      },
      {
        name: 'idx_revoked_tokens_cleanup',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_revoked_tokens_cleanup 
              ON revoked_tokens (expires_at) WHERE expires_at < NOW()`,
        description: 'Optimize expired token cleanup',
      },
      // Partial indexes for active users
      {
        name: 'idx_users_active_recent',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_recent 
              ON users (last_login_date DESC) 
              WHERE is_active = true AND last_login_date > NOW() - INTERVAL '30 days'`,
        description: 'Optimize active user queries',
      },
      // Full-text search indexes
      {
        name: 'idx_courses_name_fulltext',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_name_fulltext 
              ON courses USING GIN (to_tsvector('english', name))`,
        description: 'Enable full-text search on course names',
      },
      {
        name: 'idx_exercises_data_fulltext',
        sql: `CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_exercises_data_fulltext 
              ON exercises USING GIN (to_tsvector('english', data::text))`,
        description: 'Enable full-text search on exercise content',
      },
    ];

    logger.info('Creating performance indexes...');

    for (const index of indexes) {
      try {
        await this.prisma.$executeRawUnsafe(index.sql);
        logger.info(`Created index: ${index.name}`, { description: index.description });
      } catch (error) {
        // Index might already exist, log as warning instead of error
        logger.warn(`Index creation skipped: ${index.name}`, { 
          error: error instanceof Error ? error.message : 'Unknown error',
          description: index.description,
        });
      }
    }

    logger.info('Performance index creation completed');
  }

  /**
   * Analyze table statistics and suggest optimizations
   */
  async analyzeTableStatistics(): Promise<any> {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          attname as column_name,
          n_distinct,
          correlation,
          most_common_vals,
          most_common_freqs
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      `;

      logger.info('Table statistics analysis completed', { 
        tablesAnalyzed: Array.isArray(stats) ? stats.length : 0 
      });

      return stats;
    } catch (error) {
      logger.error('Failed to analyze table statistics', { error });
      return [];
    }
  }

  /**
   * Get slow query information from PostgreSQL
   */
  async getSlowQueries(): Promise<any> {
    try {
      // This requires pg_stat_statements extension to be enabled
      const slowQueries = await this.prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_time,
          mean_time,
          rows,
          100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
        FROM pg_stat_statements 
        WHERE mean_time > 100  -- Queries taking more than 100ms on average
        ORDER BY mean_time DESC 
        LIMIT 20
      `;

      return slowQueries;
    } catch (error) {
      logger.warn('Could not retrieve slow query statistics', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        note: 'pg_stat_statements extension may not be enabled',
      });
      return [];
    }
  }

  /**
   * Optimize database configuration for performance
   */
  async optimizeConfiguration(): Promise<void> {
    const optimizations = [
      // Update table statistics
      'ANALYZE;',
      
      // Vacuum tables to reclaim space and update statistics
      'VACUUM ANALYZE;',
      
      // Set optimal work_mem for this session (for complex queries)
      "SET work_mem = '256MB';",
      
      // Enable parallel query execution
      "SET max_parallel_workers_per_gather = 2;",
    ];

    logger.info('Applying database optimizations...');

    for (const sql of optimizations) {
      try {
        await this.prisma.$executeRawUnsafe(sql);
        logger.debug(`Applied optimization: ${sql}`);
      } catch (error) {
        logger.warn(`Optimization failed: ${sql}`, { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    logger.info('Database optimization completed');
  }

  /**
   * Clean up expired data to improve performance
   */
  async cleanupExpiredData(): Promise<void> {
    logger.info('Starting expired data cleanup...');

    try {
      // Clean up expired revoked tokens
      const expiredTokens = await this.prisma.revokedToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info(`Cleaned up ${expiredTokens.count} expired tokens`);

      // Clean up old lesson completions (older than 2 years) to keep table size manageable
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

      const oldCompletions = await this.prisma.lessonCompletion.deleteMany({
        where: {
          completedAt: {
            lt: twoYearsAgo,
          },
        },
      });

      logger.info(`Cleaned up ${oldCompletions.count} old lesson completions`);

      // Update statistics after cleanup
      await this.prisma.$executeRaw`ANALYZE revoked_tokens, lesson_completions;`;

    } catch (error) {
      logger.error('Data cleanup failed', { error });
    }
  }

  /**
   * Get database size and table information
   */
  async getDatabaseInfo(): Promise<any> {
    try {
      const dbSize = await this.prisma.$queryRaw`
        SELECT 
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          current_database() as database_name
      `;

      const tableInfo = await this.prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;

      return {
        database: dbSize,
        tables: tableInfo,
      };
    } catch (error) {
      logger.error('Failed to get database info', { error });
      return null;
    }
  }

  /**
   * Monitor connection pool usage
   */
  async getConnectionInfo(): Promise<any> {
    try {
      const connections = await this.prisma.$queryRaw`
        SELECT 
          state,
          COUNT(*) as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `;

      const totalConnections = await this.prisma.$queryRaw`
        SELECT COUNT(*) as total_connections
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;

      return {
        byState: connections,
        total: totalConnections,
      };
    } catch (error) {
      logger.error('Failed to get connection info', { error });
      return null;
    }
  }

  /**
   * Run comprehensive performance analysis
   */
  async runPerformanceAnalysis(): Promise<any> {
    logger.info('Starting comprehensive performance analysis...');

    const analysis = {
      timestamp: new Date().toISOString(),
      database_info: await this.getDatabaseInfo(),
      connection_info: await this.getConnectionInfo(),
      table_statistics: await this.analyzeTableStatistics(),
      slow_queries: await this.getSlowQueries(),
    };

    logger.info('Performance analysis completed');
    return analysis;
  }
}

/**
 * Query performance monitoring decorator
 */
export function monitorQuery(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const startTime = Date.now();
    const className = target.constructor.name;
    
    try {
      const result = await method.apply(this, args);
      const duration = Date.now() - startTime;
      
      if (duration > 500) { // Log slow queries
        logger.warn('Slow query detected', {
          class: className,
          method: propertyName,
          duration: `${duration}ms`,
          args: args.length > 0 ? 'provided' : 'none',
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Query failed', {
        class: className,
        method: propertyName,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };

  return descriptor;
}

/**
 * Batch operation utilities for better performance
 */
export class BatchOperations {
  constructor(private prisma: PrismaClient) {}

  /**
   * Batch create operations with transaction
   */
  async batchCreate<T>(
    model: string,
    data: any[],
    batchSize: number = 100
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        const batchResults = await this.prisma.$transaction(
          batch.map((item) => (this.prisma as any)[model].create({ data: item }))
        );
        
        results.push(...batchResults);
        logger.debug(`Batch created ${batchResults.length} ${model} records`);
      } catch (error) {
        logger.error(`Batch create failed for ${model}`, { 
          batchIndex: i / batchSize,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Batch update operations
   */
  async batchUpdate(
    model: string,
    updates: Array<{ where: any; data: any }>,
    batchSize: number = 50
  ): Promise<number> {
    let totalUpdated = 0;
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      
      try {
        const results = await this.prisma.$transaction(
          batch.map((update) => 
            (this.prisma as any)[model].update({
              where: update.where,
              data: update.data,
            })
          )
        );
        
        totalUpdated += results.length;
        logger.debug(`Batch updated ${results.length} ${model} records`);
      } catch (error) {
        logger.error(`Batch update failed for ${model}`, { 
          batchIndex: i / batchSize,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        throw error;
      }
    }
    
    return totalUpdated;
  }
}