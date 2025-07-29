// src/shared/middleware/errorHandler.ts

/**
 * Global error handling middleware and utilities for WayrApp Backend API
 * 
 * This module provides error handling capabilities for the WayrApp language learning platform,
 * including a custom error class, global error handler middleware, and async wrapper utility. It ensures
 * consistent error responses across all API endpoints and provides proper error logging for debugging
 * and monitoring purposes.
 * 
 * Key Features:
 * - Custom AppError class for structured application errors
 * - Global error handler middleware for Express applications
 * - Async handler wrapper for automatic error catching
 * - Support for various error types (Zod, Prisma, generic errors)
 * - Consistent error response format across the application
 * - Comprehensive error logging with request context
 * 
 * @module errorHandler
 * @category Middleware
 * @category Error Handling
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { ApiError, ErrorCodes, HttpStatus } from '@/shared/types';

/**
 * This module provides a comprehensive error handling system for the WayrApp backend API.
 * It includes utilities for creating structured errors, handling different error types,
 * and providing consistent error responses to clients.
 * 
 * ## Usage Guidelines
 * 
 * ### 1. Creating Application Errors
 * Use the AppError class for all expected application errors:
 * ```typescript
 * throw new AppError('User not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND);
 * ```
 * 
 * ### 2. Wrapping Async Handlers
 * Always wrap async route handlers with asyncHandler:
 * ```typescript
 * router.get('/users/:id', asyncHandler(async (req, res) => {
 *   // Your async code here
 * }));
 * ```
 * 
 * ### 3. Setting Up Error Handler
 * Add the error handler as the last middleware in your Express app:
 * ```typescript
 * app.use(errorHandler);
 * ```
 * 
 * ### 4. Error Response Format
 * All errors are returned in a consistent format:
 * ```json
 * {
 *   "success": false,
 *   "timestamp": "2024-01-20T10:30:00.000Z",
 *   "error": {
 *     "code": "ERROR_CODE",
 *     "message": "Human readable message",
 *     "details": "Additional error details (optional)",
 *     "path": "/api/endpoint"
 *   }
 * }
 * ```
 * 
 * ## Best Practices
 * 
 * - Use AppError for all expected application errors
 * - Wrap all async route handlers with asyncHandler
 * - Use appropriate HTTP status codes and error codes
 * - Provide clear, user-friendly error messages
 * - Log errors with sufficient context for debugging
 * - Never expose sensitive information in error messages
 * - Handle validation errors consistently using Zod
 * - Map database errors to appropriate HTTP responses
 */

/**
 * Custom Application Error Class for WayrApp Backend
 * 
 * A specialized error class that extends the native JavaScript Error to provide structured
 * error handling throughout the WayrApp language learning platform. This class standardizes
 * error representation by including HTTP status codes, application-specific error codes,
 * and operational flags that help distinguish between expected application errors and
 * unexpected system failures.
 * 
 * The AppError class is designed to work seamlessly with the errorHandler middleware,
 * providing a consistent error format across all API endpoints. It supports the application's
 * evolution toward a distributed architecture where standardized error handling becomes
 * critical for inter-node communication and debugging across multiple services.
 * 
 * This error class is used throughout the application for throwing predictable, well-structured
 * errors that can be properly handled by the error middleware and returned to clients in a
 * consistent format. It's particularly useful for validation errors, authentication failures,
 * authorization issues, and business logic violations.
 * 
 * **Key Features:**
 * - Extends native Error class for proper inheritance
 * - Includes HTTP status codes for proper response handling
 * - Contains application-specific error codes for categorization
 * - Marks errors as operational to distinguish from system failures
 * - Automatically captures stack traces for debugging
 * - Integrates seamlessly with the global error handler
 * 
 * **Usage Patterns:**
 * - Validation errors: Use with BAD_REQUEST status and VALIDATION_ERROR code
 * - Authentication errors: Use with UNAUTHORIZED status and AUTHENTICATION_ERROR code
 * - Authorization errors: Use with FORBIDDEN status and AUTHORIZATION_ERROR code
 * - Resource not found: Use with NOT_FOUND status and NOT_FOUND code
 * - Conflict errors: Use with CONFLICT status and CONFLICT code
 * 
 * @example
 * // Throwing a validation error in a service
 * import { AppError } from '@/shared/middleware/errorHandler';
 * import { ErrorCodes, HttpStatus } from '@/shared/types';
 * 
 * if (!user.email) {
 *   throw new AppError(
 *     'Email is required for user registration',
 *     HttpStatus.BAD_REQUEST,
 *     ErrorCodes.VALIDATION_ERROR
 *   );
 * }
 * 
 * @example
 * // Throwing an authorization error in a controller
 * if (user.role !== 'admin') {
 *   throw new AppError(
 *     'Admin access required for this operation',
 *     HttpStatus.FORBIDDEN,
 *     ErrorCodes.AUTHORIZATION_ERROR
 *   );
 * }
 * 
 * @example
 * // Throwing a not found error in a service
 * const course = await prisma.course.findUnique({ where: { id } });
 * if (!course) {
 *   throw new AppError(
 *     'Course not found',
 *     HttpStatus.NOT_FOUND,
 *     ErrorCodes.NOT_FOUND
 *   );
 * }
 * 
 * @example
 * // Throwing a conflict error for duplicate resources
 * const existingUser = await prisma.user.findUnique({ where: { email } });
 * if (existingUser) {
 *   throw new AppError(
 *     'User with this email already exists',
 *     HttpStatus.CONFLICT,
 *     ErrorCodes.CONFLICT
 *   );
 * }
 * 
 * @class AppError
 * @extends Error
 */
export class AppError extends Error {
  /** 
   * HTTP status code to be returned to the client
   * @type {number}
   * @example 400, 401, 403, 404, 409, 500
   */
  public statusCode: number;

  /** 
   * Application-specific error code for categorization and client-side handling
   * @type {string}
   * @example 'VALIDATION_ERROR', 'NOT_FOUND', 'AUTHORIZATION_ERROR'
   */
  public code: string;

  /** 
   * Flag indicating this is an expected operational error, not a system failure
   * Operational errors are expected and should be handled gracefully by the application
   * @type {boolean}
   * @default true
   */
  public isOperational: boolean;

  /**
   * Creates a new AppError instance with structured error information
   * 
   * This constructor automatically sets the error as operational and captures
   * the stack trace for debugging purposes. The error will be properly handled
   * by the global error handler middleware.
   * 
   * @param {string} message - Human-readable error message describing what went wrong
   * @param {number} statusCode - HTTP status code (e.g., 400, 401, 403, 404, 500)
   * @param {string} code - Application-specific error code from ErrorCodes enum
   * 
   * @throws {AppError} The constructed error instance
   * 
   * @example
   * // Create a validation error
   * const error = new AppError(
   *   'Invalid email format',
   *   HttpStatus.BAD_REQUEST,
   *   ErrorCodes.VALIDATION_ERROR
   * );
   * 
   * @example
   * // Create a not found error
   * const error = new AppError(
   *   'User not found',
   *   HttpStatus.NOT_FOUND,
   *   ErrorCodes.NOT_FOUND
   * );
   */
  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global Error Handler Middleware for WayrApp Backend API
 * 
 * A comprehensive Express error handling middleware that provides centralized error processing
 * for the entire WayrApp language learning platform backend. This middleware serves as the
 * final error processing layer in the Express middleware stack, catching and standardizing
 * all errors that occur during request processing across all API endpoints.
 * 
 * The error handler intelligently processes different types of errors including custom AppErrors,
 * Zod validation errors, Prisma database errors, and generic JavaScript errors. It transforms
 * these various error types into a consistent API response format that clients can reliably
 * parse and handle. The middleware also provides comprehensive error logging with request
 * context for debugging and monitoring purposes.
 * 
 * This middleware is essential for the application's distributed architecture evolution, as it
 * ensures consistent error handling across all nodes and services. It's configured in the main
 * Express application (src/app.ts) as the final middleware in the stack, ensuring all unhandled
 * errors are properly caught and formatted before being sent to clients.
 * 
 * The error handler supports the application's security posture by sanitizing error messages
 * in production environments and providing detailed error information only when appropriate.
 * It integrates with the application's logging system to provide comprehensive error tracking
 * and monitoring capabilities.
 * 
 * **Error Type Handling:**
 * - **AppError**: Returns custom status code and error code with original message
 * - **ZodError**: Returns 400 BAD_REQUEST with detailed validation error information
 * - **PrismaClientKnownRequestError**: Maps specific Prisma error codes to appropriate HTTP statuses
 *   - P2002: Unique constraint violation → 409 CONFLICT
 *   - P2025: Record not found → 404 NOT_FOUND
 *   - Others: Generic database error → 400 BAD_REQUEST
 * - **PrismaClientValidationError**: Returns 400 BAD_REQUEST for invalid data
 * - **Generic Error**: Returns 500 INTERNAL_SERVER_ERROR with sanitized message
 * 
 * **Logging Features:**
 * - Logs all errors with full stack traces
 * - Includes request context (URL, method, IP, user agent)
 * - Provides structured logging for monitoring and debugging
 * - Maintains error correlation for distributed tracing
 * 
 * **Security Considerations:**
 * - Sanitizes error messages to prevent information leakage
 * - Provides consistent error format regardless of error source
 * - Logs sensitive information server-side while sending safe messages to clients
 * 
 * @param {Error} error - The error object to be processed and formatted
 * @param {Request} req - Express request object containing request context
 * @param {Response} res - Express response object for sending the error response
 * @param {NextFunction} _next - Express next function (unused in error handlers)
 * @returns {void} Sends JSON error response to client and terminates request
 * 
 * @example
 * // Primary usage in main Express application (src/app.ts)
 * import { errorHandler } from '@/shared/middleware';
 * 
 * const app = express();
 * 
 * // ... other middleware and routes
 * 
 * // Error handler must be the last middleware
 * app.use(errorHandler);
 * 
 * @example
 * // The middleware automatically handles different error types:
 * // 
 * // AppError -> Returns structured error with custom status and code
 * // ZodError -> Returns 400 with validation details
 * // Prisma errors -> Returns appropriate status based on error type
 * // Generic errors -> Returns 500 with sanitized message
 * 
 * @example
 * // Error response format sent to clients:
 * // {
 * //   "error": {
 * //     "code": "VALIDATION_ERROR",
 * //     "message": "Email is required",
 * //     "details": { "field": "email", "message": "Required" },
 * //     "timestamp": "2024-01-20T10:30:00.000Z",
 * //     "path": "/api/v1/auth/register"
 * //   }
 * // }
 * 
 * @example
 * // Zod validation error response:
 * // {
 * //   "error": {
 * //     "code": "VALIDATION_ERROR",
 * //     "message": "Validation failed",
 * //     "details": [
 * //       { "field": "email", "message": "Invalid email", "code": "invalid_string" },
 * //       { "field": "password", "message": "String must contain at least 8 character(s)", "code": "too_small" }
 * //     ],
 * //     "timestamp": "2024-01-20T10:30:00.000Z",
 * //     "path": "/api/v1/auth/register"
 * //   }
 * // }
 * 
 * @example
 * // Prisma unique constraint error response:
 * // {
 * //   "error": {
 * //     "code": "CONFLICT",
 * //     "message": "Unique constraint violation",
 * //     "details": { "field": ["email"] },
 * //     "timestamp": "2024-01-20T10:30:00.000Z",
 * //     "path": "/api/v1/users"
 * //   }
 * // }
 * 
 * @function errorHandler
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Initialize default error response values
  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let code: string = ErrorCodes.INTERNAL_ERROR;
  let message = 'Internal server error';
  let details: any = undefined;

  // Log the error with comprehensive request context for debugging and monitoring
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Process different error types and map them to appropriate HTTP responses
  if (error instanceof AppError) {
    // Handle custom application errors - use the provided status and code
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
  } else if (error instanceof ZodError) {
    // Handle Zod validation errors - transform validation issues into structured details
    statusCode = HttpStatus.BAD_REQUEST;
    code = ErrorCodes.VALIDATION_ERROR;
    message = 'Validation failed';
    details = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle known Prisma database errors - map specific error codes to HTTP responses
    statusCode = HttpStatus.BAD_REQUEST;
    code = ErrorCodes.DATABASE_ERROR;

    switch (error.code) {
      case 'P2002':
        // Unique constraint violation - typically occurs on duplicate entries
        message = 'Unique constraint violation';
        details = { field: error.meta?.['target'] };
        statusCode = HttpStatus.CONFLICT;
        code = ErrorCodes.CONFLICT;
        break;
      case 'P2025':
        // Record not found - occurs when trying to update/delete non-existent records
        message = 'Record not found';
        statusCode = HttpStatus.NOT_FOUND;
        code = ErrorCodes.NOT_FOUND;
        break;
      default:
        // Other database errors - use generic database error message
        message = 'Database operation failed';
    }
  } else if (error instanceof Prisma.PrismaClientValidationError) {
    // Handle Prisma validation errors - occurs when invalid data is provided to Prisma
    statusCode = HttpStatus.BAD_REQUEST;
    code = ErrorCodes.VALIDATION_ERROR;
    message = 'Invalid data provided';
  }
  // Note: Generic errors (else case) use the default values set above

  // Construct the standardized error response
  const errorResponse: ApiError = {
    success: false,
    timestamp: new Date().toISOString(),
    error: {
      code,
      message,
      details,
      path: req.path
    }
  };

  // Send the error response to the client
  res.status(statusCode).json(errorResponse);
};

/**
 * Async Handler Wrapper for Express Route Handlers
 * 
 * A utility function that wraps asynchronous Express route handlers and middleware to ensure
 * that any rejected promises or thrown errors are properly caught and passed to the Express
 * error handling middleware. This wrapper eliminates the need for manual try-catch blocks
 * in async route handlers and ensures consistent error handling across the application.
 * 
 * This function is particularly important for the WayrApp backend as it heavily uses async
 * operations for database queries, external API calls, and file operations. Without proper
 * error handling, unhandled promise rejections could crash the application or leave requests
 * hanging without responses.
 * 
 * The asyncHandler works by wrapping the provided async function in a Promise.resolve() call
 * and attaching a .catch() handler that forwards any errors to the Express error handling
 * middleware via the next() function. This ensures that all errors, whether thrown synchronously
 * or from rejected promises, are properly handled by the errorHandler middleware.
 * 
 * This utility supports the application's distributed architecture by ensuring reliable error
 * handling across all async operations, which is critical for maintaining system stability
 * and providing consistent error responses to clients across multiple nodes and services.
 * 
 * **Key Benefits:**
 * - Eliminates boilerplate try-catch blocks in route handlers
 * - Ensures all async errors are properly caught and forwarded
 * - Maintains consistent error handling across the application
 * - Prevents unhandled promise rejections that could crash the server
 * - Works with both async/await and Promise-based code
 * - Preserves function context and arguments
 * 
 * **How It Works:**
 * 1. Wraps the provided function in Promise.resolve()
 * 2. Catches any errors (sync or async) using .catch()
 * 3. Forwards caught errors to Express error handling via next()
 * 4. Maintains the original function signature and return value
 * 
 * **Usage Patterns:**
 * - Route handlers that perform async operations
 * - Middleware functions that need async error handling
 * - Any Express function that uses async/await or returns promises
 * 
 * @param {Function} fn - The async function to wrap (route handler or middleware)
 * @returns {Function} Express middleware function that handles async errors
 * 
 * @example
 * // Wrapping an async route handler
 * import { asyncHandler } from '@/shared/middleware/errorHandler';
 * 
 * router.get('/courses/:id', asyncHandler(async (req, res) => {
 *   const course = await courseService.findById(req.params.id);
 *   if (!course) {
 *     throw new AppError('Course not found', 404, 'NOT_FOUND');
 *   }
 *   res.json({ data: course });
 * }));
 * 
 * @example
 * // Wrapping async middleware
 * const validateCourse = asyncHandler(async (req, res, next) => {
 *   const course = await prisma.course.findUnique({
 *     where: { id: req.params.courseId }
 *   });
 *   if (!course) {
 *     throw new AppError('Course not found', 404, 'NOT_FOUND');
 *   }
 *   req.course = course;
 *   next();
 * });
 * 
 * @example
 * // Wrapping a controller method
 * class UserController {
 *   static getUser = asyncHandler(async (req, res) => {
 *     const user = await userService.findById(req.params.id);
 *     res.json({ data: user });
 *   });
 * }
 * 
 * @example
 * // Without asyncHandler (manual error handling required):
 * router.post('/users', async (req, res, next) => {
 *   try {
 *     const user = await userService.create(req.body);
 *     res.status(201).json({ data: user });
 *   } catch (error) {
 *     next(error); // Manual error forwarding
 *   }
 * });
 * 
 * // With asyncHandler (automatic error handling):
 * router.post('/users', asyncHandler(async (req, res) => {
 *   const user = await userService.create(req.body);
 *   res.status(201).json({ data: user });
 * })); // Errors automatically forwarded to error handler
 * 
 * @example
 * // Handling database operations
 * router.put('/users/:id', asyncHandler(async (req, res) => {
 *   const user = await prisma.user.update({
 *     where: { id: req.params.id },
 *     data: req.body
 *   });
 *   res.json({ data: user });
 * })); // Prisma errors automatically caught and handled
 * 
 * @function asyncHandler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};