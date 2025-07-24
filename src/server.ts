/**
 * Server Entry Point
 * Starts the Express server with performance optimizations
 */

import app from "./app-simple";
import { logger } from "@/shared/utils/logger";
import { startupManager } from "@/shared/utils/startup";

const PORT = process.env["PORT"] || 3000;

async function startServer() {
  try {
    // Initialize performance optimizations
    logger.info('Initializing application...');
    await startupManager.initialize();

    // Verify system health before starting
    const isHealthy = await startupManager.healthCheck();
    if (!isHealthy) {
      logger.error('Health check failed, server startup aborted');
      process.exit(1);
    }

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`WayrApp API server running on port ${PORT}`, {
        environment: process.env["NODE_ENV"] || "development",
        port: PORT,
        features: [
          'Performance monitoring enabled',
          'Database optimization active',
          'Cache warming completed',
          'Health checks available',
        ],
      });
    });

    // Handle server errors
    server.on('error', (error) => {
      logger.error('Server error:', { error });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        await startupManager.shutdown();
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', { error });
    process.exit(1);
  }
}

// Start the server
startServer();