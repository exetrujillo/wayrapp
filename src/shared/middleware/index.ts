// src/shared/middleware/index.ts

/**
 * Middleware Coordination Hub for Sovereign Nodes
 * 
 * This module serves as the central coordination point for all middleware functions used throughout
 * the WayrApp backend infrastructure. It acts as a barrel export that consolidates middleware
 * components from specialized modules into a single, convenient import interface. This design
 * supports the application's evolution toward a distributed, sovereign node architecture where
 * each node can selectively import and configure the middleware stack it requires.
 * 
 * The middleware coordination system provides a comprehensive security, validation, and request
 * processing pipeline that can be deployed across multiple nodes while maintaining consistency
 * and interoperability. Each middleware category addresses specific concerns: security hardening,
 * request validation, authentication/authorization, error handling, logging, and performance
 * optimization.
 * 
 * This centralized export pattern facilitates the transition to a decentralized architecture
 * where different services can be deployed independently across multiple nodes, each importing
 * only the middleware components they need while maintaining a consistent security posture
 * and operational behavior across the distributed system.
 * 
 * The middleware stack is primarily consumed by the main Express application (src/app.ts) where
 * it forms the foundation of the request processing pipeline, handling everything from CORS
 * configuration and rate limiting to JWT authentication and input sanitization.
 * 
 * @exports {function} errorHandler - Global error handling middleware for Express applications
 * @exports {class} AppError - Custom error class for structured application errors
 * @exports {function} asyncHandler - Async wrapper utility for automatic error catching
 * @exports {function} requestLogger - Request logging middleware for monitoring
 * @exports {function} validate - Validation middleware factory for Zod schema validation
 * @exports {function} validateBody - Request body validation middleware
 * @exports {function} validateParams - Request parameters validation middleware
 * @exports {function} validateQuery - Query parameters validation middleware
 * @exports {object} corsOptions - CORS configuration for cross-origin requests
 * @exports {function} createRateLimiter - Rate limiter factory function
 * @exports {function} defaultRateLimiter - Default rate limiting middleware
 * @exports {function} authRateLimiter - Authentication-specific rate limiting
 * @exports {object} helmetOptions - Security headers configuration
 * @exports {function} sanitizeInput - Input sanitization middleware
 * @exports {function} securityHeaders - Custom security headers middleware
 * @exports {function} requestSizeLimiter - Request size validation middleware
 * @exports {function} xssProtection - XSS protection middleware
 * @exports {function} authenticateToken - JWT token authentication middleware
 * @exports {function} requireRole - Role-based access control middleware
 * @exports {function} requirePermission - Permission-based authorization middleware
 * @exports {function} optionalAuth - Optional authentication middleware
 * @exports {function} requireOwnership - Resource ownership validation middleware
 * @exports {object} PERMISSIONS - Permission definitions for role-based access
 * @exports {type} Permission - TypeScript type for permission strings
 * @exports {interface} PaginationOptions - Pagination configuration interface
 * @exports {function} paginationMiddleware - Pagination middleware factory
 * @exports {function} addPaginationHeaders - Pagination headers utility
 * @exports {function} createPaginationMeta - Pagination metadata helper
 * @exports {function} getPaginationParams - Database pagination parameters helper
 * @exports {function} getSortParams - Database sorting parameters helper
 * @exports {function} buildTextSearchFilter - Text search filter builder
 * @exports {function} buildRangeFilter - Range filter builder for dates/numbers
 * @exports {function} buildEnumFilter - Enum filter builder
 * @exports {function} buildCursorPagination - Cursor-based pagination helper
 * 
 * @fileoverview Centralized middleware exports for distributed node architecture
 * @author Exequiel Trujillo
 * @version 1.0.0
 * @since 1.0.0
 * 
 * @example
 * // Primary usage in main application setup (src/app.ts)
 * import {
 *   errorHandler,
 *   requestLogger,
 *   corsOptions,
 *   defaultRateLimiter,
 *   authenticateToken,
 *   validateBody
 * } from '@/shared/middleware';
 * 
 * const app = express();
 * 
 * // Security middleware stack
 * app.use(cors(corsOptions));
 * app.use(defaultRateLimiter);
 * app.use(requestLogger);
 * 
 * // Authentication for protected routes
 * app.use('/api/v1/users', authenticateToken);
 * 
 * // Global error handling
 * app.use(errorHandler);
 * 
 * @example
 * // Selective import for specialized node services
 * import { 
 *   authenticateToken, 
 *   requireRole, 
 *   PERMISSIONS 
 * } from '@/shared/middleware';
 * 
 * // Content management node with role-based access
 * app.post('/content', 
 *   authenticateToken, 
 *   requireRole('content_creator'),
 *   contentController.create
 * );
 * 
 * @example
 * // Validation middleware for API endpoints
 * import { validateBody, validateParams } from '@/shared/middleware';
 * import { courseSchema, lessonSchema } from '@/schemas';
 * 
 * app.post('/api/v1/courses', 
 *   validateBody(courseSchema),
 *   courseController.create
 * );
 * 
 * app.get('/api/v1/lessons/:id',
 *   validateParams({ id: 'string' }),
 *   lessonController.getById
 * );
 */

// Error handling
export { errorHandler, AppError, asyncHandler } from './errorHandler';

// Request logging
export { requestLogger } from './requestLogger';

// Input validation
export { validate, validateBody, validateParams, validateQuery } from './validation';

// Security middleware
export {
  corsOptions,
  createRateLimiter,
  defaultRateLimiter,
  authRateLimiter,
  helmetOptions,
  sanitizeInput,
  securityHeaders,
  requestSizeLimiter
} from './security';

// XSS Protection
export { xssProtection } from './xssProtection';

// Authentication and authorization
export {
  authenticateToken,
  requireRole,
  requirePermission,
  optionalAuth,
  requireOwnership,
  PERMISSIONS
} from './auth';

// Pagination middleware
export {
  paginationMiddleware,
  addPaginationHeaders,
  createPaginationMeta,
  getPaginationParams,
  getSortParams,
  buildTextSearchFilter,
  buildRangeFilter,
  buildEnumFilter,
  buildCursorPagination
} from './pagination';