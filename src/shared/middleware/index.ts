/**
 * Middleware exports
 * Centralized exports for all middleware functions
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