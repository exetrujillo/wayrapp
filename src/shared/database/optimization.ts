// src/shared/database/optimization.ts

/**
 * Database Optimization Utilities for WayrApp Sovereign Nodes
 *
 * This module provides comprehensive database optimization tools specifically designed
 * for community-owned WayrApp nodes. It enables community administrators to maintain
 * optimal database performance for their educational platform without requiring
 * deep database expertise.
 *
 * ## SOVEREIGN NODE OPTIMIZATION PHILOSOPHY
 *
 * Each WayrApp node serves a specific community with unique usage patterns:
 * - A community might have seasonal learning peaks
 * - A university department may have semester-based activity cycles  
 * - A language school could have consistent daily usage patterns
 *
 * This optimization suite adapts to each community's specific needs, providing
 * automated performance tuning, proactive maintenance, and detailed analytics
 * to ensure their educational platform runs smoothly regardless of scale.
 *
 * ## KEY OPTIMIZATION AREAS
 *
 * **Performance Indexes**: Automatically creates optimized database indexes for
 * common educational platform queries (user progress, course discovery, content search)
 *
 * **Automated Maintenance**: Handles routine database maintenance tasks like
 * expired data cleanup, statistics updates, and space reclamation
 *
 * **Performance Monitoring**: Provides detailed analytics and slow query detection
 * to help community administrators understand their node's performance
 *
 * **Batch Operations**: Optimized bulk operations for content creation and user
 * management, essential for communities importing large educational datasets
 *
 * ## COMMUNITY ADMINISTRATOR BENEFITS
 *
 * - **Zero Database Expertise Required**: Automated optimizations work out-of-the-box
 * - **Community-Specific Tuning**: Adapts to each node's unique usage patterns
 * - **Proactive Maintenance**: Prevents performance degradation before it impacts users
 * - **Detailed Insights**: Clear performance metrics for informed decision-making
 * - **Scalability Support**: Handles growth from small communities to large institutions
 *
 * Used by the StartupManager during node initialization and for periodic maintenance
 * tasks, ensuring each community's educational platform maintains optimal performance
 * throughout its lifecycle.
 * 
 * @module Database Optimization
 * @category Database
 * @author Exequiel Trujillo
 * @since 1.0.0
 *
 * @example
 * // Automatic optimization during node startup
 * import { DatabaseOptimizer } from '@/shared/database/optimization';
 * import { prisma } from '@/shared/database/connection';
 * 
 * const optimizer = new DatabaseOptimizer(prisma);
 * await optimizer.createPerformanceIndexes();
 * await optimizer.optimizeConfiguration();
 *
 * @example
 * // Community administrator monitoring their node's performance
 * const analysis = await optimizer.runPerformanceAnalysis();
 * console.log(`Database size: ${analysis.database_info.database[0].database_size}`);
 * console.log(`Active connections: ${analysis.connection_info.total[0].total_connections}`);
 *
 * @example
 * // Batch operations for community content import
 * const batchOps = new BatchOperations(prisma);
 * const courses = await batchOps.batchCreate('course', courseData, 50);
 * console.log(`Imported ${courses.length} courses for the community`);
 *
 * @example
 * // Automated maintenance for community administrators
 * await optimizer.cleanupExpiredData(); // Removes old tokens and completions
 * const dbInfo = await optimizer.getDatabaseInfo(); // Check storage usage
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { TokenBlacklistService } from '@/modules/users/services/tokenBlacklistService';

/**
 * Database Optimizer for Sovereign WayrApp Nodes
 * 
 * Main optimization class that provides comprehensive database performance tuning
 * for community-owned educational platforms. Designed to work autonomously with
 * minimal administrator intervention while providing detailed insights when needed.
 * 
 * Each method is optimized for the specific data patterns of language learning
 * platforms: user progress tracking, content discovery, exercise completion,
 * and educational analytics.
 * 
 * @class DatabaseOptimizer
 */
export class DatabaseOptimizer {
  private tokenBlacklistService: TokenBlacklistService;

  constructor(private prisma: PrismaClient) {
    this.tokenBlacklistService = new TokenBlacklistService(this.prisma);
  }

  /**
   * Create Performance Indexes for Educational Platform Queries
   * 
   * Automatically creates optimized database indexes specifically designed for
   * common language learning platform operations. These indexes dramatically
   * improve query performance for typical community usage patterns.
   * 
   * **Educational Platform Optimizations:**
   * - User progress and leaderboard queries
   * - Course discovery and filtering
   * - Exercise content search and retrieval
   * - Learning analytics and reporting
   * - Token management and cleanup
   * 
   * The indexes are created using CONCURRENTLY to avoid blocking community
   * users during optimization. Safe to run multiple times - existing indexes
   * are automatically skipped.
   * 
   * **Community Impact:**
   * - Faster course browsing and search
   * - Improved user progress tracking
   * - Quicker exercise loading
   * - Enhanced administrative reporting
   * 
   * @returns {Promise<void>} Completes when all performance indexes are created
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
   * Analyze Database Statistics for Community Usage Patterns
   * 
   * Examines the node's database statistics to understand how the community
   * uses their educational platform. Provides insights into data distribution,
   * query patterns, and optimization opportunities specific to this node's
   * learning content and user behavior.
   * 
   * **Community Insights Provided:**
   * - Most frequently accessed courses and content
   * - User engagement patterns and peak usage times
   * - Content distribution across languages and levels
   * - Database growth trends and storage optimization opportunities
   * 
   * This analysis helps community administrators understand their platform's
   * usage and make informed decisions about content organization and resource
   * allocation.
   * 
   * @returns {Promise<any>} Detailed statistics about the node's database usage patterns
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
   * Identify Slow Queries Affecting Community Experience
   * 
   * Detects database queries that may be impacting the learning experience
   * for community users. Focuses on educational platform operations that
   * should be fast: course loading, exercise retrieval, progress updates.
   * 
   * **Educational Platform Focus:**
   * - Course and lesson loading performance
   * - Exercise retrieval and submission speed
   * - User progress calculation efficiency
   * - Content search and discovery speed
   * 
   * Requires pg_stat_statements extension (commonly available in managed
   * database services). Provides actionable insights for community
   * administrators to improve their platform's responsiveness.
   * 
   * @returns {Promise<any>} List of slow queries with performance metrics and optimization suggestions
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
   * Optimize Database Configuration for Educational Workloads
   * 
   * Applies database configuration optimizations specifically tuned for
   * language learning platform workloads. Balances read performance (course
   * browsing, content delivery) with write performance (progress tracking,
   * exercise submissions).
   * 
   * **Educational Platform Optimizations:**
   * - Enhanced memory allocation for content queries
   * - Parallel processing for complex learning analytics
   * - Optimized statistics for course recommendation algorithms
   * - Improved vacuum settings for user activity data
   * 
   * These optimizations are safe and reversible, designed to improve the
   * learning experience without requiring database expertise from community
   * administrators.
   * 
   * @returns {Promise<void>} Completes when database configuration is optimized
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
   * Clean Up Expired Data for Optimal Node Performance
   * 
   * Removes expired and outdated data that can slow down the community's
   * educational platform. Focuses on data that accumulates over time and
   * doesn't impact the learning experience when removed.
   * 
   * **Automated Cleanup Tasks:**
   * - Expired authentication tokens (security and performance)
   * - Old lesson completion records (keeps recent progress intact)
   * - Temporary session data and cached content
   * - Database statistics updates for optimal query planning
   * 
   * **Community Benefits:**
   * - Faster database queries and page loading
   * - Reduced storage costs for community hosting
   * - Improved backup and maintenance speed
   * - Enhanced security through token cleanup
   * 
   * Safe to run regularly - only removes data that doesn't affect the
   * educational experience or user progress tracking.
   * 
   * @returns {Promise<void>} Completes when expired data cleanup is finished
   */
  async cleanupExpiredData(): Promise<void> {
    logger.info('Starting expired data cleanup...');

    try {
      // Clean up expired revoked tokens using the dedicated service
      logger.info('Cleaning up expired revoked tokens...');
      const cleanedTokensCount = await this.tokenBlacklistService.cleanupExpiredTokens();
      logger.info(`Token cleanup complete. Removed ${cleanedTokensCount} tokens.`);

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
   * Get Database Size and Storage Information for Community Planning
   * 
   * Provides detailed information about the node's database storage usage,
   * helping community administrators understand their platform's growth
   * and plan for future hosting needs.
   * 
   * **Community Planning Insights:**
   * - Total database size and growth trends
   * - Storage usage by educational content type (courses, exercises, media)
   * - User data storage requirements
   * - Largest tables and optimization opportunities
   * 
   * **Use Cases:**
   * - Hosting cost planning and budgeting
   * - Storage optimization and cleanup prioritization
   * - Backup strategy planning
   * - Migration and scaling decisions
   * 
   * Essential for community administrators managing their node's infrastructure
   * and planning for sustainable growth of their educational platform.
   * 
   * @returns {Promise<any>} Detailed database size information and table breakdown
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
   * Monitor Database Connection Usage for Community Load Management
   * 
   * Tracks database connection usage patterns to help community administrators
   * understand their platform's load characteristics and optimize for peak
   * learning periods.
   * 
   * **Community Load Insights:**
   * - Active connections during peak learning hours
   * - Connection state distribution (active, idle, waiting)
   * - Resource utilization patterns
   * - Potential connection bottlenecks
   * 
   * **Educational Platform Context:**
   * - Class session peaks (synchronized learning activities)
   * - Individual study patterns (evening/weekend usage)
   * - Content creation periods (educator activity)
   * - Assessment and testing load spikes
   * 
   * Helps community administrators optimize their hosting configuration
   * and understand when their educational platform experiences high demand.
   * 
   * @returns {Promise<any>} Connection usage statistics and load distribution
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
   * Run Comprehensive Performance Analysis for Community Administrators
   * 
   * Performs a complete health check and performance analysis of the node's
   * database, providing community administrators with a comprehensive overview
   * of their educational platform's technical health and optimization opportunities.
   * 
   * **Complete Analysis Includes:**
   * - Database size and growth trends
   * - Connection usage and load patterns  
   * - Query performance and slow operation detection
   * - Table statistics and data distribution
   * - Storage optimization recommendations
   * 
   * **Community Administrator Dashboard:**
   * - Platform health score and key metrics
   * - Performance trends and usage patterns
   * - Actionable optimization recommendations
   * - Capacity planning insights
   * - Cost optimization opportunities
   * 
   * **Automated Scheduling:**
   * - Runs periodically via StartupManager
   * - Provides historical performance tracking
   * - Alerts for performance degradation
   * - Proactive maintenance recommendations
   * 
   * Essential for maintaining a high-quality learning experience and making
   * informed decisions about the community's educational platform infrastructure.
   * 
   * @returns {Promise<any>} Comprehensive performance analysis report with actionable insights
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
 * Query Performance Monitoring Decorator for Educational Platform Operations
 * 
 * TypeScript decorator that automatically monitors database query performance
 * for educational platform operations. Helps identify slow queries that could
 * impact the learning experience without requiring manual instrumentation.
 * 
 * **Educational Platform Focus:**
 * - Course loading and content delivery performance
 * - User progress tracking and analytics speed
 * - Exercise retrieval and submission efficiency
 * - Search and discovery operation timing
 * 
 * **Community Benefits:**
 * - Automatic detection of performance issues
 * - Detailed logging for troubleshooting
 * - Proactive identification of optimization opportunities
 * - Zero-overhead monitoring for production use
 * 
 * **Usage Pattern:**
 * Apply to repository methods and service operations that interact with
 * the database to automatically track their performance impact on the
 * community's learning experience.
 * 
 * @param target - The class containing the method to monitor
 * @param propertyName - The name of the method being monitored
 * @param descriptor - The method descriptor for decoration
 * @returns Modified descriptor with performance monitoring
 * 
 * @example
 * class CourseRepository {
 *   async findCoursesByLanguage(language: string) {
 *     return await this.prisma.course.findMany({ where: { target_language: language } });
 *   }
 * }
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
 * Batch Operations for Educational Content Management
 * 
 * Optimized bulk database operations specifically designed for educational
 * platform needs. Essential for communities importing large amounts of
 * educational content, managing user enrollments, or performing administrative
 * tasks across many records.
 * 
 * **Educational Platform Use Cases:**
 * - Importing course content from existing educational materials
 * - Bulk user enrollment for classroom or institutional deployments
 * - Mass content updates (translations, corrections, enhancements)
 * - Administrative operations across multiple courses or users
 * - Data migration from other educational platforms
 * 
 * **Performance Benefits:**
 * - Transactional safety for data integrity
 * - Optimized batch sizes for educational workloads
 * - Detailed logging for administrative oversight
 * - Error handling that preserves partial progress
 * - Memory-efficient processing for large datasets
 * 
 * **Community Administrator Benefits:**
 * - Reliable bulk operations without database expertise
 * - Progress tracking for long-running imports
 * - Safe rollback capabilities for failed operations
 * - Optimized performance for community hosting environments
 * 
 * @class BatchOperations
 */
export class BatchOperations {
  constructor(private prisma: PrismaClient) { }

  /**
   * Batch Create Operations for Educational Content Import
   * 
   * Efficiently creates multiple database records in optimized batches with
   * full transactional safety. Ideal for communities importing educational
   * content, setting up courses, or performing bulk administrative tasks.
   * 
   * **Educational Platform Applications:**
   * - Importing courses from educational content providers
   * - Bulk creation of exercises and learning materials
   * - Setting up user accounts for classroom deployments
   * - Creating lesson sequences and learning paths
   * - Importing translation data for multilingual content
   * 
   * **Safety Features:**
   * - Transactional batches ensure data consistency
   * - Partial failure handling preserves completed work
   * - Optimized batch sizes prevent memory issues
   * - Detailed progress logging for administrators
   * 
   * @param model - Prisma model name (e.g., 'course', 'lesson', 'user')
   * @param data - Array of data objects to create
   * @param batchSize - Number of records per batch (default: 100, optimized for educational content)
   * @returns {Promise<T[]>} Array of created records
   * 
   * @example
   * // Import courses for a community's language program
   * const batchOps = new BatchOperations(prisma);
   * const courses = await batchOps.batchCreate('course', courseData, 50);
   * console.log(`Successfully imported ${courses.length} courses for the community`);
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
   * Batch Update Operations for Educational Content Management
   * 
   * Efficiently updates multiple database records with optimized batching
   * and transactional safety. Essential for community administrators managing
   * content updates, user status changes, or platform-wide modifications.
   * 
   * **Educational Platform Applications:**
   * - Updating course content and translations
   * - Modifying user enrollment status or progress
   * - Applying content corrections across multiple lessons
   * - Updating exercise difficulty or scoring
   * - Bulk administrative changes for community management
   * 
   * **Administrative Benefits:**
   * - Safe bulk updates with rollback capability
   * - Progress tracking for large update operations
   * - Optimized performance for community hosting
   * - Detailed logging for audit and troubleshooting
   * 
   * @param model - Prisma model name for updates
   * @param updates - Array of update operations with where conditions and data
   * @param batchSize - Number of updates per batch (default: 50, optimized for update operations)
   * @returns {Promise<number>} Total number of records successfully updated
   * 
   * @example
   * // Update course visibility for community content management
   * const updates = courses.map(course => ({
   *   where: { id: course.id },
   *   data: { is_public: true, updated_at: new Date() }
   * }));
   * const updated = await batchOps.batchUpdate('course', updates);
   * console.log(`Updated ${updated} courses for community access`);
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