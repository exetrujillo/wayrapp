/**
 * Database Connection Manager
 * Singleton pattern for Prisma client with logging, connection pooling, and performance monitoring
 *
 * @author Exequiel Trujillo
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "@/shared/utils/logger";

// Database performance metrics
interface DatabaseMetrics {
  totalQueries: number;
  slowQueries: number;
  averageQueryTime: number;
  connectionPoolSize: number;
  activeConnections: number;
}

// Singleton pattern for Prisma client with enhanced configuration
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

  public static async disconnect(): Promise<void> {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.$disconnect();
      logger.info("Database connection closed");
    }
  }

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

  public static getMetrics(): DatabaseMetrics {
    return {
      ...DatabaseConnection.metrics,
      connectionPoolSize: parseInt(process.env["DB_CONNECTION_LIMIT"] || "10"),
      activeConnections: 0, // This would need additional monitoring setup
    };
  }

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

export const prisma = DatabaseConnection.getInstance();

// Graceful shutdown
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