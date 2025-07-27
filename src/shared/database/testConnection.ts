// src/shared/database/testConnection.ts

/**
 * Database Connection Test Utility for WayrApp Sovereign Nodes
 * 
 * This module provides comprehensive database connectivity testing and schema verification
 * specifically designed for community-owned WayrApp educational platform deployments.
 * 
 * @module DatabaseConnectionTest
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { prisma } from './connection';
import { logger } from '@/shared/utils/logger';

/**
 * Tests database connection and verifies schema setup for WayrApp sovereign nodes.
 * 
 * This function performs a comprehensive health check of the database connection,
 * ensuring that community administrators can verify their educational platform's
 * database is properly configured and accessible. It's designed to be used both
 * programmatically and as a CLI diagnostic tool during deployment and maintenance.
 * 
 * The function performs three levels of verification:
 * 1. **Basic Connection Test**: Verifies that the database server is reachable
 * 2. **Query Execution Test**: Confirms that SQL queries can be executed successfully  
 * 3. **Schema Verification**: Checks if database migrations have been applied
 * 
 * This utility is essential for sovereign node deployment workflows, allowing
 * community administrators to validate their database setup without requiring
 * deep database expertise. It provides clear, actionable feedback through
 * structured logging with visual indicators (✅, ⚠️, ❌).
 * 
 * **Usage Context:**
 * - Deployment verification scripts
 * - Health check endpoints
 * - Development environment setup
 * - Troubleshooting database connectivity issues
 * - CI/CD pipeline database validation
 * 
 * **Error Handling:**
 * The function gracefully handles various failure scenarios:
 * - Network connectivity issues
 * - Authentication failures
 * - Missing database schema (pre-migration state)
 * - Database server unavailability
 * 
 * All errors are logged with appropriate severity levels and human-readable
 * messages suitable for community administrators managing their own nodes.
 * 
 * @returns {Promise<boolean>} Promise that resolves to `true` if all database
 *   tests pass successfully, `false` if any connectivity or basic query tests fail.
 *   Note that missing schema (unmigrated database) is treated as a warning, not a failure.
 * 
 * @throws {Error} Only throws if there are unexpected runtime errors. Normal
 *   database connectivity failures are caught and returned as `false`.
 * 
 * @example
 * // Programmatic usage in deployment scripts
 * import { testDatabaseConnection } from '@/shared/database/testConnection';
 * 
 * async function deploymentHealthCheck() {
 *   const isHealthy = await testDatabaseConnection();
 *   if (!isHealthy) {
 *     console.error('Database connection failed - deployment aborted');
 *     process.exit(1);
 *   }
 *   console.log('Database verified - proceeding with deployment');
 * }
 * 
 * @example
 * // CLI usage for system administrators
 * // Run directly: node dist/shared/database/testConnection.js
 * // Or via npm script: npm run db:test
 * // Exit code 0 = success, 1 = failure
 * 
 * @example
 * // Integration with health check endpoints
 * app.get('/health/database', async (req, res) => {
 *   const isHealthy = await testDatabaseConnection();
 *   res.status(isHealthy ? 200 : 503).json({
 *     status: isHealthy ? 'healthy' : 'unhealthy',
 *     service: 'database'
 *   });
 * });
 * 
 * @example
 * // Usage in automated testing environments
 * beforeAll(async () => {
 *   const dbReady = await testDatabaseConnection();
 *   if (!dbReady) {
 *     throw new Error('Database not available for testing');
 *   }
 * });
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    logger.info('Testing database connection...');

    // Phase 1: Basic connectivity test - verifies network access and authentication
    await prisma.$connect();
    logger.info('✅ Database connection successful');

    // Phase 2: Query execution test - confirms database is responsive and functional
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    logger.info('✅ Database query test successful', { result });

    // Phase 3: Schema verification - checks if Prisma migrations have been applied
    // This is non-blocking as unmigrated databases are valid during initial setup
    try {
      const userCount = await prisma.user.count();
      logger.info('✅ Database schema verified', { userCount });
    } catch (error) {
      // Schema not found is expected before migrations - log as warning, not error
      logger.warn('⚠️  Database schema not yet migrated', {
        message: 'Run migrations to create tables'
      });
    }

    return true;
  } catch (error) {
    // Log connection failures with detailed error information for troubleshooting
    logger.error('❌ Database connection failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return false;
  } finally {
    // Always disconnect to prevent connection leaks, regardless of test outcome
    await prisma.$disconnect();
  }
}

/**
 * CLI Entry Point for Database Connection Testing
 * 
 * When this module is executed directly (not imported), it runs the database
 * connection test and exits with appropriate status codes for shell scripting
 * and deployment automation.
 * 
 * **Exit Codes:**
 * - `0`: Database connection successful and healthy
 * - `1`: Database connection failed or unexpected error occurred
 * 
 * **Usage Examples:**
 * ```bash
 * # Direct execution
 * node dist/shared/database/testConnection.js
 * 
 * # Via npm script (recommended)
 * npm run db:test
 * 
 * # In deployment scripts
 * if npm run db:test; then
 *   echo "Database ready - starting application"
 *   npm start
 * else
 *   echo "Database connection failed - deployment aborted"
 *   exit 1
 * fi
 * ```
 * 
 * This CLI interface is particularly useful for:
 * - Docker health checks
 * - Kubernetes readiness probes  
 * - CI/CD pipeline validation
 * - Manual troubleshooting by community administrators
 * - Automated deployment verification
 */
if (require.main === module) {
  testDatabaseConnection()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      logger.error('Connection test failed', { error });
      process.exit(1);
    });
}