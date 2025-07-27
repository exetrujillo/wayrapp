// src/shared/middleware/requestLogger.ts

/**
 * HTTP request logging middleware for WayrApp Backend API
 * 
 * This module provides comprehensive HTTP request and response logging capabilities for the WayrApp
 * language learning platform backend. It serves as a critical observability component that tracks
 * all incoming HTTP requests and their corresponding responses, providing essential data for
 * monitoring, debugging, performance analysis, and security auditing across the entire application.
 * 
 * The request logger operates as Express middleware that automatically captures detailed information
 * about each HTTP transaction, including request metadata (method, URL, IP address, user agent),
 * response details (status code, processing duration), and timing information. This data is
 * essential for understanding application behavior, identifying performance bottlenecks, detecting
 * security threats, and maintaining operational visibility in production environments.
 * 
 * The middleware integrates seamlessly with the Winston-based logging infrastructure, supporting
 * both development and production logging scenarios. In development, it provides colorized console
 * output for immediate feedback, while in production it generates structured JSON logs suitable
 * for log aggregation systems, monitoring dashboards, and automated alerting systems.
 * 
 * Key architectural features include non-blocking logging operations that don't impact request
 * performance, automatic request duration calculation for performance monitoring, comprehensive
 * request context capture for debugging, and seamless integration with the application's
 * distributed logging infrastructure. The logger is designed to scale with the application's
 * evolution toward a distributed architecture, providing consistent logging behavior across
 * multiple nodes and services.
 * 
 * Security and privacy considerations include careful handling of sensitive data in logs,
 * automatic IP address logging for security monitoring, user agent tracking for threat detection,
 * and structured logging formats that support security information and event management (SIEM)
 * systems. The logger avoids capturing sensitive request body data while maintaining sufficient
 * context for effective monitoring and debugging.
 * 
 * @module requestLogger
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic usage in Express application
 * import { requestLogger } from '@/shared/middleware/requestLogger';
 * import express from 'express';
 * 
 * const app = express();
 * 
 * // Apply request logging to all routes
 * app.use(requestLogger);
 * 
 * // All subsequent routes will be automatically logged
 * app.get('/api/users', userController.list);
 * app.post('/api/auth/login', authController.login);
 * 
 * @example
 * // Integration with other middleware (recommended order)
 * import { requestLogger, errorHandler } from '@/shared/middleware';
 * 
 * const app = express();
 * 
 * // Security and parsing middleware first
 * app.use(helmet());
 * app.use(cors());
 * app.use(express.json());
 * 
 * // Request logging after parsing but before routes
 * app.use(requestLogger);
 * 
 * // Application routes
 * app.use('/api', apiRoutes);
 * 
 * // Error handling last
 * app.use(errorHandler);
 * 
 * @example
 * // Sample log output for incoming request
 * // {
 * //   "level": "http",
 * //   "message": "Incoming request",
 * //   "method": "POST",
 * //   "url": "/api/v1/auth/login",
 * //   "ip": "192.168.1.100",
 * //   "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
 * //   "timestamp": "2024-01-20T10:30:00.000Z"
 * // }
 * 
 * @example
 * // Sample log output for completed request
 * // {
 * //   "level": "http",
 * //   "message": "Request completed",
 * //   "method": "POST",
 * //   "url": "/api/v1/auth/login",
 * //   "statusCode": 200,
 * //   "duration": "145ms",
 * //   "ip": "192.168.1.100",
 * //   "timestamp": "2024-01-20T10:30:00.145Z"
 * // }
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger';

/**
 * HTTP Request Logging Middleware for Express Applications
 * 
 * Express middleware function that provides comprehensive logging of HTTP requests and responses
 * for the WayrApp backend API. This middleware captures detailed information about each HTTP
 * transaction, including request metadata, response details, and performance metrics, making it
 * an essential component for application monitoring, debugging, and security auditing.
 * 
 * The middleware operates by intercepting incoming requests and logging their details immediately,
 * then overriding the response's end method to capture response information and calculate request
 * duration. This approach ensures complete transaction logging without impacting request processing
 * performance or interfering with normal Express middleware flow.
 * 
 * Request logging includes HTTP method, full URL path, client IP address, user agent string, and
 * precise timestamp information. Response logging captures HTTP status code, request processing
 * duration in milliseconds, and completion timestamp. This comprehensive logging provides the
 * data foundation for performance monitoring, error tracking, security analysis, and operational
 * insights.
 * 
 * The middleware integrates with the Winston-based logging system, utilizing the 'http' log level
 * for request/response events. This integration ensures consistent log formatting, proper log
 * level management, and seamless integration with log aggregation and monitoring systems in
 * production environments.
 * 
 * Performance considerations include minimal overhead through efficient timestamp calculation,
 * non-blocking logging operations that don't delay request processing, and careful memory
 * management to prevent memory leaks in high-traffic scenarios. The middleware is designed
 * to handle thousands of concurrent requests without impacting application performance.
 * 
 * Security features include automatic IP address logging for security monitoring, user agent
 * tracking for threat detection and bot identification, and structured logging that supports
 * security information and event management (SIEM) systems. The middleware carefully avoids
 * logging sensitive data while maintaining sufficient context for security analysis.
 * 
 * The middleware supports the application's distributed architecture by providing consistent
 * logging behavior across multiple nodes and services, enabling centralized log aggregation
 * and cross-service request tracing for complex distributed operations.
 * 
 * @param {Request} req - Express request object containing HTTP request information
 * @param {Response} res - Express response object for HTTP response handling
 * @param {NextFunction} next - Express next function to continue middleware chain
 * @returns {void} Continues to next middleware after setting up logging hooks
 * 
 * @example
 * // Basic middleware setup in Express application
 * import express from 'express';
 * import { requestLogger } from '@/shared/middleware/requestLogger';
 * 
 * const app = express();
 * 
 * // Apply request logging to all routes
 * app.use(requestLogger);
 * 
 * // All routes after this point will be automatically logged
 * app.get('/api/users', (req, res) => {
 *   res.json({ users: [] });
 * });
 * 
 * // Logs will show:
 * // [HTTP] Incoming request: POST /api/users from 192.168.1.100
 * // [HTTP] Request completed: POST /api/users - 200 (45ms)
 * 
 * @example
 * // Recommended middleware order for optimal logging
 * import { requestLogger, errorHandler } from '@/shared/middleware';
 * 
 * const app = express();
 * 
 * // Security and parsing middleware first
 * app.use(helmet());
 * app.use(cors());
 * app.use(express.json({ limit: '10mb' }));
 * app.use(express.urlencoded({ extended: true }));
 * 
 * // Request logging after parsing but before business logic
 * app.use(requestLogger);
 * 
 * // Authentication and validation middleware
 * app.use('/api/auth', authRoutes);
 * app.use('/api/users', authenticateToken, userRoutes);
 * 
 * // Error handling middleware last
 * app.use(errorHandler);
 * 
 * @example
 * // Log output examples for different request types
 * 
 * // GET request log:
 * // [2024-01-20 10:30:00] HTTP: Incoming request {
 * //   method: 'GET',
 * //   url: '/api/v1/courses?page=1&limit=20',
 * //   ip: '192.168.1.100',
 * //   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
 * //   timestamp: '2024-01-20T10:30:00.000Z'
 * // }
 * // [2024-01-20 10:30:00] HTTP: Request completed {
 * //   method: 'GET',
 * //   url: '/api/v1/courses?page=1&limit=20',
 * //   statusCode: 200,
 * //   duration: '23ms',
 * //   ip: '192.168.1.100',
 * //   timestamp: '2024-01-20T10:30:00.023Z'
 * // }
 * 
 * @example
 * // Error request logging
 * // POST /api/v1/auth/login with invalid credentials:
 * // [2024-01-20 10:30:00] HTTP: Incoming request {
 * //   method: 'POST',
 * //   url: '/api/v1/auth/login',
 * //   ip: '192.168.1.100',
 * //   userAgent: 'PostmanRuntime/7.32.3',
 * //   timestamp: '2024-01-20T10:30:00.000Z'
 * // }
 * // [2024-01-20 10:30:00] HTTP: Request completed {
 * //   method: 'POST',
 * //   url: '/api/v1/auth/login',
 * //   statusCode: 401,
 * //   duration: '156ms',
 * //   ip: '192.168.1.100',
 * //   timestamp: '2024-01-20T10:30:00.156Z'
 * // }
 * 
 * @example
 * // High-traffic performance monitoring
 * // The middleware efficiently handles concurrent requests:
 * // [2024-01-20 10:30:00] HTTP: Request completed { method: 'GET', url: '/api/health', statusCode: 200, duration: '2ms' }
 * // [2024-01-20 10:30:00] HTTP: Request completed { method: 'POST', url: '/api/users', statusCode: 201, duration: '89ms' }
 * // [2024-01-20 10:30:00] HTTP: Request completed { method: 'GET', url: '/api/courses', statusCode: 200, duration: '45ms' }
 * 
 * @function requestLogger
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any): Response {
    const duration = Date.now() - start;

    logger.http('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};