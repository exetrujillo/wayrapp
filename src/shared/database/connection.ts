// src/shared/database/connection.ts

/**
 * Manages the database connection for a single, independent WayrApp node.
 * 
 * This module utilizes the Singleton pattern with Prisma ORM to provide an optimized
 * and centralized database access layer. It is the foundational component for all
 * data persistence within a sovereign WayrApp instance.
 *
 * ## Architectural Vision: Sovereign Nodes
 *
 * The "decentralization" in WayrApp refers to empowering any community to deploy
 * and own a complete, independent instance of the platform.
 * 
 * - **Sovereign Deployment:** Each instance (a "node") is self-hosted and fully autonomous.
 * - **Data Sovereignty:** Each node maintains its own private, isolated database. There is **no**
 *   data sharing, replication, or synchronization between nodes.
 * - **Self-Contained:** This connection manager is the heart of a SINGLE node.
 * 
 * @module Connection
 * @category Database
 * @category Connection
 * @author Exequiel Trujillo
 * @since 1.0.0
 *
 * @example <caption>Basic Repository Usage</caption>
 * // Each query operates on this node's private database only.
 * import { prisma } from '@/shared/database/connection';
 * const users = await prisma.user.findMany();
 *
 * @example <caption>Dependency Injection into Route Factories</caption>
 * // The prisma instance is passed to route modules at application startup.
 * import { prisma } from '@/shared/database/connection';
 * app.use(API_BASE, createContentRoutes(prisma));
 *
 * @example <caption>Integration Testing</caption>
 * // Tests use the prisma instance to set up and tear down the test database.
 * import { prisma } from '@/shared/database/connection';
 * beforeEach(async () => {
 *   await prisma.user.deleteMany();
 * });
 * 
 * // Routes receive the node's database connection
 * app.use(API_BASE, createContentRoutes(prisma));
 * app.use(API_BASE, createProgressRoutes(prisma));
 *
 * @example
 * // Health monitoring for node administrators
 * import { prisma } from '@/shared/database/connection';
 * 
 * const health = await DatabaseConnection.healthCheck();
 * const metrics = DatabaseConnection.getMetrics();
 * 
 * // Community administrators can monitor their node's database performance
 * console.log(`Node database latency: ${health.latency}ms`);
 * console.log(`Total queries processed: ${metrics.totalQueries}`);
 *
 * @example
 * // Integration testing for node development
 * import { prisma } from '@/shared/database/connection';
 * 
 * describe('Node Database Tests', () => {
 *   beforeEach(async () => {
 *     // Clean the node's test database
 *     await prisma.user.deleteMany();
 *     await prisma.course.deleteMany();
 *   });
 * });
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "@/shared/utils/logger";

/**
 * Database Performance Metrics Interface
 * 
 * Performance metrics collection for monitoring a single sovereign node's database health.
 * These metrics help community administrators understand their node's performance and
 * optimize their deployment for their specific user base and content volume.
 * 
 * Unlike distributed systems, these metrics represent the complete picture of database
 * performance for this autonomous node - there are no external dependencies or shared
 * resources to consider.
 * 
 * @interface DatabaseMetrics
 */
interface DatabaseMetrics {
  /** Total number of database queries executed since this node started */
  totalQueries: number;
  /** Number of queries that exceeded the slow query threshold (>1000ms) */
  slowQueries: number;
  /** Rolling average query execution time in milliseconds (last 1000 queries) */
  averageQueryTime: number;
  /** Maximum number of concurrent database connections configured for this node */
  connectionPoolSize: number;
  /** Current number of active database connections (requires additional monitoring) */
  activeConnections: number;
}

/**
 * Database Connection Singleton Class
 * 
 * Manages the single Prisma client instance for this sovereign WayrApp node with
 * comprehensive monitoring, health checking, and performance optimization capabilities.
 * 
 * This class ensures that the node's private database connection is robust, efficient,
 * and well-monitored, enabling community administrators to maintain a reliable
 * educational platform for their users without external dependencies.
 * 
 * Key responsibilities:
 * - Singleton pattern ensures single connection pool per node
 * - Performance monitoring for query optimization
 * - Health checking for operational reliability
 * - Graceful error handling and logging
 * - Environment-specific configuration management
 * 
 * @class DatabaseConnection
 * @static
 */
class DatabaseConnection {
  private static instance: PrismaClient;
  private static metrics: DatabaseMetrics = {
    totalQueries: 0,
    slowQueries: 0,
    averageQueryTime: 0,
    connectionPoolSize: 0,
    activeConnections: 0,
  };
  private static queryTimes: number[] = [];

  /**
   * Get Singleton Prisma Client Instance
   * 
   * Returns the single, optimized Prisma client instance for this sovereign node.
   * Initializes the client on first access with environment-specific configuration,
   * connection pooling, and comprehensive performance monitoring.
   * 
   * The client is configured for the node's private database with:
   * - Environment-appropriate logging levels
   * - Optimized connection pooling
   * - Query performance monitoring middleware
   * - Automatic slow query detection and logging
   * 
   * @returns {PrismaClient} Fully configured Prisma client instance for this node
   * @static
   */
  public static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) {
      // Configure Prisma client with optimized connection pooling
      const logLevel =
        process.env["NODE_ENV"] === "development"
          ? ["query", "info", "warn", "error"]
          : ["error"];

      DatabaseConnection.instance = new PrismaClient({
        log: logLevel as any,
        datasources: {
          db: {
            url: process.env["DATABASE_URL"] || "",
          },
        },
      });

      // Add query performance monitoring
      DatabaseConnection.setupQueryMonitoring();

      logger.info("Database connection initialized with optimized pooling", {
        connectionLimit: process.env["DB_CONNECTION_LIMIT"] || "10",
        poolTimeout: process.env["DB_POOL_TIMEOUT"] || "10",
        environment: process.env["NODE_ENV"],
      });
    }

    return DatabaseConnection.instance;
  }

  private static setupQueryMonitoring(): void {
    if (!DatabaseConnection.instance) return;

    // Monitor query performance
    DatabaseConnection.instance.$use(async (params, next) => {
      const startTime = Date.now();

      try {
        const result = await next(params);
        const queryTime = Date.now() - startTime;

        // Update metrics
        DatabaseConnection.metrics.totalQueries++;
        DatabaseConnection.queryTimes.push(queryTime);

        // Keep only last 1000 query times for average calculation
        if (DatabaseConnection.queryTimes.length > 1000) {
          DatabaseConnection.queryTimes.shift();
        }

        // Calculate average query time
        DatabaseConnection.metrics.averageQueryTime =
          DatabaseConnection.queryTimes.reduce((a, b) => a + b, 0) /
          DatabaseConnection.queryTimes.length;

        // Log slow queries (>1000ms)
        if (queryTime > 1000) {
          DatabaseConnection.metrics.slowQueries++;
          logger.warn("Slow database query detected", {
            model: params.model,
            action: params.action,
            queryTime: `${queryTime}ms`,
            args: params.args,
          });
        }

        // Log very slow queries (>5000ms) as errors
        if (queryTime > 5000) {
          logger.error("Very slow database query detected", {
            model: params.model,
            action: params.action,
            queryTime: `${queryTime}ms`,
            args: params.args,
          });
        }

        return result;
      } catch (error) {
        const queryTime = Date.now() - startTime;
        logger.error("Database query failed", {
          model: params.model,
          action: params.action,
          queryTime: `${queryTime}ms`,
          error: error instanceof Error ? error.message : "Unknown error",
          args: params.args,
        });
        throw error;
      }
    });
  }

  /**
   * Disconnect Database Connection
   * 
   * Gracefully closes the database connection for the. Used during
   * application shutdown to ensure clean termination and prevent connection leaks.
   * Essential for proper node lifecycle management in community deployments.
   * 
   * @static
   */
  public static async disconnect(): Promise<void> {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.$disconnect();
      logger.info("Database connection closed");
    }
  }

  /**
   * Database Health Check
   * 
   * Performs a comprehensive health check of this node's database connection,
   * measuring response latency and collecting performance metrics. Essential for
   * community administrators to monitor their node's operational health.
   * 
   * This health check is completely self-contained - it only tests this node's
   * private database connection and does not depend on any external services
   * or other nodes.
   * 
   * @returns {Promise<{status: string, latency: number, metrics: DatabaseMetrics}>}
   *   Complete health status including connection state, response latency in ms,
   *   and comprehensive performance metrics for this node
   * @static
   */
  public static async healthCheck(): Promise<{
    status: string;
    latency: number;
    metrics: DatabaseMetrics;
  }> {
    if (!DatabaseConnection.instance) {
      return {
        status: "disconnected",
        latency: -1,
        metrics: DatabaseConnection.metrics,
      };
    }

    try {
      const startTime = Date.now();
      await DatabaseConnection.instance.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;

      return {
        status: "connected",
        latency,
        metrics: {
          ...DatabaseConnection.metrics,
          connectionPoolSize: parseInt(
            process.env["DB_CONNECTION_LIMIT"] || "10"
          ),
          activeConnections: 0, // This would need additional monitoring setup
        },
      };
    } catch (error) {
      logger.error("Database health check failed", { error });
      return {
        status: "error",
        latency: -1,
        metrics: DatabaseConnection.metrics,
      };
    }
  }

  /**
   * Get Current Database Metrics
   * 
   * Returns current performance metrics for this sovereign node's database.
   * Useful for community administrators to monitor performance, identify
   * optimization opportunities, and ensure their node operates efficiently
   * for their user base.
   * 
   * @returns {DatabaseMetrics} Current database performance metrics for this node
   * @static
   */
  public static getMetrics(): DatabaseMetrics {
    return {
      ...DatabaseConnection.metrics,
      connectionPoolSize: parseInt(process.env["DB_CONNECTION_LIMIT"] || "10"),
      activeConnections: 0, // This would need additional monitoring setup
    };
  }

  /**
   * Reset Database Metrics
   * 
   * Resets all performance metrics to their initial state. Useful for testing
   * environments or when community administrators want to start fresh metrics
   * collection after node maintenance or optimization changes.
   * 
   * @static
   */
  public static resetMetrics(): void {
    DatabaseConnection.metrics = {
      totalQueries: 0,
      slowQueries: 0,
      averageQueryTime: 0,
      connectionPoolSize: parseInt(process.env["DB_CONNECTION_LIMIT"] || "10"),
      activeConnections: 0,
    };
    DatabaseConnection.queryTimes = [];
  }
}

/**
 * Primary Prisma Client Export
 * 
 * The main database client instance for this sovereign WayrApp node. This is the
 * single point of access to the node's private database, used throughout the
 * application by repositories, services, route handlers, and tests.
 * 
 * Every database operation in this node goes through this client, ensuring
 * consistent connection management, performance monitoring, and error handling
 * for the community's educational platform.
 * 
 * Configured Prisma client singleton for this node
 */
export const prisma = DatabaseConnection.getInstance();

/**
 * Graceful Shutdown Handlers
 * 
 * Ensures the node's database connection is properly closed when the application
 * receives termination signals. Critical for community deployments to prevent
 * connection leaks and ensure clean shutdown in various hosting environments.
 */
process.on("SIGINT", async () => {
  logger.info("Received SIGINT, closing database connection...");
  await DatabaseConnection.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, closing database connection...");
  await DatabaseConnection.disconnect();
  process.exit(0);
});

export default prisma;