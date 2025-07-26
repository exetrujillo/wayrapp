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