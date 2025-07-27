// src/server.ts

/**
 * Deployment-agnostic server entry point for the WayrApp language learning platform backend.
 * 
 * This module serves as the main deployment entry point, designed for maximum compatibility across
 * different hosting environments including serverless platforms (Vercel) and traditional server
 * deployments. It imports the main Express application instance and exports it in a format
 * suitable for various deployment scenarios.
 * 
 * The module handles essential deployment concerns including module alias registration for compiled
 * TypeScript code, ensuring proper path resolution in production environments. It provides a clean
 * separation between application logic (defined in app.ts) and deployment configuration.
 * 
 * Currently configured for serverless deployment on Vercel, where the Express app is exported as
 * a serverless function handler. The module also includes comprehensive traditional server setup
 * code (commented out) that provides graceful shutdown handling, health checks, performance
 * monitoring, and proper error handling for traditional server environments.
 * 
 * Key features include automatic module alias registration for production builds, serverless
 * function compatibility, traditional server support with graceful shutdown, comprehensive
 * error handling and logging, health check integration, and performance monitoring capabilities.
 * 
 * The deployment flexibility allows the same codebase to run in multiple environments without
 * modification, supporting the platform's evolution from serverless to potentially distributed
 * or traditional server architectures as needed.
 * 
 * @module Server
 * @category Server
 * @category Deployment
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Used by Vercel serverless deployment (api/index.js)
 * const app = require('../dist/server.js').default;
 * module.exports = app;
 * 
 * @example
 * // Used in development with ts-node-dev
 * // npm run dev -> ts-node-dev src/server.ts
 * 
 * @example
 * // Traditional server deployment (when uncommented)
 * // node dist/server.js
 * // Provides graceful shutdown, health checks, and monitoring
 */

/**
 * Register module path aliases for compiled JavaScript code.
 * 
 * This import ensures that TypeScript path aliases (like @/shared/utils) work correctly
 * in the compiled JavaScript environment, enabling proper module resolution in production.
 */
import 'module-alias/register';

/**
 * Main Express application instance configured with all middleware, routes, and error handling.
 * 
 * @type {express.Application}
 */
import app from './app';

/**
 * Export the Express application for serverless deployment compatibility.
 * 
 * This export format allows the application to be used as a serverless function handler
 * in platforms like Vercel, while maintaining compatibility with traditional server deployments.
 * 
 * @type {express.Application}
 */
export default app;

// import app from "./app-simple";
// import { logger } from "@/shared/utils/logger";
// import { startupManager } from "@/shared/utils/startup";

// const PORT = process.env["PORT"] || 3000;

// async function startServer() {
//   try {
//     // Initialize performance optimizations
//     logger.info('Initializing application...');
//     await startupManager.initialize();

//     // Verify system health before starting
//     const isHealthy = await startupManager.healthCheck();
//     if (!isHealthy) {
//       logger.error('Health check failed, server startup aborted');
//       process.exit(1);
//     }

//     // Start server
//     const server = app.listen(PORT, () => {
//       logger.info(`WayrApp API server running on port ${PORT}`, {
//         environment: process.env["NODE_ENV"] || "development",
//         port: PORT,
//         features: [
//           'Performance monitoring enabled',
//           'Database optimization active',
//           'Cache warming completed',
//           'Health checks available',
//         ],
//       });
//     });

//     // Handle server errors
//     server.on('error', (error) => {
//       logger.error('Server error:', { error });
//     });

//     // Graceful shutdown
//     const gracefulShutdown = async (signal: string) => {
//       logger.info(`Received ${signal}, starting graceful shutdown...`);
      
//       server.close(async () => {
//         logger.info('HTTP server closed');
//         await startupManager.shutdown();
//         process.exit(0);
//       });

//       // Force shutdown after 30 seconds
//       setTimeout(() => {
//         logger.error('Forced shutdown after timeout');
//         process.exit(1);
//       }, 30000);
//     };

//     process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
//     process.on('SIGINT', () => gracefulShutdown('SIGINT'));

//   } catch (error) {
//     logger.error('Failed to start server:', { error });
//     process.exit(1);
//   }
// }

// // Start the server
// startServer();