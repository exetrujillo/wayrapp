// src/shared/middleware/security.ts

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { logger } from '@/shared/utils/logger';
import { ErrorCodes, HttpStatus } from '@/shared/types';

/**
 * Node Security Hardening Middleware
 * 
 * This module provides comprehensive security middleware components designed to harden Express.js
 * applications against common web vulnerabilities and attacks. It implements multiple layers of
 * security controls including CORS policy enforcement, rate limiting, input sanitization, security
 * headers, and request size validation. These middleware functions form the security foundation
 * for the WayrApp backend infrastructure and are essential for protecting the distributed node
 * architecture against malicious requests and abuse.
 * 
 * The security middleware is applied early in the Express middleware stack (src/app.ts) to ensure
 * all incoming requests are properly validated and secured before reaching application logic.
 * Special rate limiting configurations are also applied to authentication endpoints to prevent
 * brute force attacks and credential stuffing attempts.
 * 
 * Each middleware component can be used independently or as part of the complete security stack,
 * making it suitable for both monolithic deployments and distributed microservice architectures
 * where different nodes may require different security configurations.
 * 
 * @fileoverview Security hardening middleware for Express.js applications
 * @author Exequiel Trujillo
 * @version 1.0.0
 * @since 1.0.0
 * 
 * @example
 * // Complete security stack setup in main application (src/app.ts)
 * import {
 *   corsOptions,
 *   defaultRateLimiter,
 *   helmetOptions,
 *   sanitizeInput,
 *   securityHeaders,
 *   requestSizeLimiter
 * } from '@/shared/middleware/security';
 * 
 * const app = express();
 * 
 * // Apply security middleware stack
 * app.use(helmet(helmetOptions));
 * app.use(securityHeaders);
 * app.use(cors(corsOptions));
 * app.use(defaultRateLimiter);
 * app.use(requestSizeLimiter);
 * app.use(sanitizeInput);
 * 
 * @example
 * // Authentication endpoint protection (src/modules/users/routes/authRoutes.ts)
 * import { authRateLimiter } from '@/shared/middleware/security';
 * 
 * const router = Router();
 * 
 * // Apply strict rate limiting to auth endpoints
 * router.post('/login', authRateLimiter, loginController);
 * router.post('/register', authRateLimiter, registerController);
 * 
 * @example
 * // Custom rate limiter for specific endpoints
 * import { createRateLimiter } from '@/shared/middleware/security';
 * 
 * // Create custom rate limiter for API endpoints
 * const apiRateLimiter = createRateLimiter(
 *   60 * 1000, // 1 minute window
 *   50         // 50 requests per minute
 * );
 * 
 * app.use('/api/v1', apiRateLimiter);
 */

/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 * 
 * Configures cross-origin request policies for the Express application. This configuration
 * controls which domains can access the API, what HTTP methods are allowed, and which
 * headers can be sent in cross-origin requests. The origin validation function checks
 * incoming requests against a whitelist of allowed domains from environment variables.
 * 
 * The configuration supports both development and production environments by allowing
 * requests with no origin (mobile apps, Postman) and dynamically validating origins
 * against the CORS_ORIGIN environment variable. Failed CORS validations are logged
 * for security monitoring purposes.
 * 
 * @constant {Object} corsOptions - CORS configuration object for Express cors middleware
 * @property {Function} origin - Dynamic origin validation function
 * @property {boolean} credentials - Allow credentials in cross-origin requests
 * @property {number} optionsSuccessStatus - Status code for successful OPTIONS requests
 * @property {string[]} methods - Allowed HTTP methods for cross-origin requests
 * @property {string[]} allowedHeaders - Headers that can be sent in cross-origin requests
 * @property {string[]} exposedHeaders - Headers exposed to the client in responses
 * 
 * @example
 * // Usage in main application setup
 * import cors from 'cors';
 * import { corsOptions } from '@/shared/middleware/security';
 * 
 * app.use(cors(corsOptions));
 * 
 * @example
 * // Environment variable configuration
 * // .env file
 * CORS_ORIGIN=http://localhost:3000,https://app.wayrapp.com,https://admin.wayrapp.com
 * 
 * @example
 * // Allow all origins in development (not recommended for production)
 * // .env file
 * CORS_ORIGIN=*
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env['CORS_ORIGIN']?.split(',') || ['http://localhost:3000'];

    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

/**
 * Rate Limiter Factory Function
 * 
 * Creates configurable rate limiting middleware to protect against abuse and DoS attacks.
 * This factory function generates express-rate-limit middleware instances with custom
 * time windows and request limits. When limits are exceeded, the middleware responds
 * with a standardized error format and logs the violation for security monitoring.
 * 
 * The rate limiter uses IP-based tracking and includes proper HTTP headers to inform
 * clients about rate limit status. Failed requests are logged with IP address, user
 * agent, and request details for security analysis.
 * 
 * @param {number} [windowMs=900000] - Time window in milliseconds (default: 15 minutes)
 * @param {number} [max=100] - Maximum number of requests per window (default: 100)
 * @returns {Function} Express middleware function for rate limiting
 * 
 * @example
 * // Create custom rate limiter for API endpoints
 * const apiLimiter = createRateLimiter(
 *   60 * 1000, // 1 minute window
 *   50         // 50 requests per minute
 * );
 * 
 * app.use('/api', apiLimiter);
 * 
 * @example
 * // Strict rate limiter for sensitive operations
 * const strictLimiter = createRateLimiter(
 *   5 * 60 * 1000, // 5 minute window
 *   3              // 3 requests per 5 minutes
 * );
 * 
 * app.use('/api/admin', strictLimiter);
 * 
 * @example
 * // Rate limiter response format when limit exceeded
 * // HTTP 429 Too Many Requests
 * {
 *   "error": {
 *     "code": "RATE_LIMIT_ERROR",
 *     "message": "Too many requests from this IP, please try again later.",
 *     "timestamp": "2024-01-20T10:30:00.000Z",
 *     "path": "/api/v1/auth/login"
 *   }
 * }
 */
export const createRateLimiter = (windowMs: number = 15 * 60 * 1000, max: number = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: {
        code: ErrorCodes.RATE_LIMIT_ERROR,
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString(),
        path: ''
      }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method
      });

      res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        error: {
          code: ErrorCodes.RATE_LIMIT_ERROR,
          message: 'Too many requests from this IP, please try again later.',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
    }
  });
};

/**
 * Default Rate Limiter for General API Endpoints
 * 
 * Pre-configured rate limiter for general API usage with moderate restrictions.
 * Applied globally to all routes in the main application to prevent abuse while
 * allowing normal usage patterns. Configuration values are read from environment
 * variables to allow deployment-specific tuning.
 * 
 * @constant {Function} defaultRateLimiter - Rate limiting middleware for general API usage
 * 
 * @example
 * // Usage in main application (automatically applied to all routes)
 * import { defaultRateLimiter } from '@/shared/middleware/security';
 * 
 * if (process.env.NODE_ENV !== 'test') {
 *   app.use(defaultRateLimiter);
 * }
 * 
 * @example
 * // Environment variable configuration
 * // .env file
 * RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
 * RATE_LIMIT_MAX_REQUESTS=100    # 100 requests per window
 */
export const defaultRateLimiter = createRateLimiter(
  parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100')
);

/**
 * Authentication Rate Limiter for Security-Critical Endpoints
 * 
 * Strict rate limiter specifically designed for authentication endpoints to prevent
 * brute force attacks, credential stuffing, and account enumeration attempts. This
 * limiter has much lower thresholds than the default limiter and is applied to
 * login, registration, and password reset endpoints.
 * 
 * The restrictive limits help protect user accounts while still allowing legitimate
 * authentication attempts. Failed authentication attempts are logged for security
 * monitoring and potential account lockout mechanisms.
 * 
 * @constant {Function} authRateLimiter - Strict rate limiting middleware for auth endpoints
 * 
 * @example
 * // Usage in authentication routes
 * import { authRateLimiter } from '@/shared/middleware/security';
 * 
 * router.post('/login', authRateLimiter, loginController);
 * router.post('/register', authRateLimiter, registerController);
 * router.post('/forgot-password', authRateLimiter, forgotPasswordController);
 * 
 * @example
 * // Environment variable configuration
 * // .env file
 * AUTH_RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
 * AUTH_RATE_LIMIT_MAX_REQUESTS=5        # 5 attempts per window
 */
export const authRateLimiter = createRateLimiter(
  parseInt(process.env['AUTH_RATE_LIMIT_WINDOW_MS'] || '900000'), // 15 minutes
  parseInt(process.env['AUTH_RATE_LIMIT_MAX_REQUESTS'] || '5')
);

/**
 * Helmet Security Headers Configuration
 * 
 * Configuration object for the Helmet middleware that sets various HTTP security headers
 * to protect against common web vulnerabilities. This configuration implements a Content
 * Security Policy (CSP), HTTP Strict Transport Security (HSTS), and other security
 * headers while maintaining compatibility with API usage patterns.
 * 
 * The CSP is configured to be restrictive but functional for API responses, while HSTS
 * ensures secure connections in production environments. Some features like Cross-Origin
 * Embedder Policy are disabled to maintain API compatibility.
 * 
 * @constant {Object} helmetOptions - Configuration object for Helmet security middleware
 * @property {Object} contentSecurityPolicy - CSP directives for content loading restrictions
 * @property {boolean} crossOriginEmbedderPolicy - Disabled for API compatibility
 * @property {Object} hsts - HTTP Strict Transport Security configuration
 * 
 * @example
 * // Usage with Helmet middleware in main application
 * import helmet from 'helmet';
 * import { helmetOptions } from '@/shared/middleware/security';
 * 
 * app.use(helmet(helmetOptions));
 * 
 * @example
 * // Headers set by this configuration:
 * // Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; ...
 * // Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
 * // X-Content-Type-Options: nosniff
 * // X-Frame-Options: DENY
 * // X-XSS-Protection: 1; mode=block
 */
export const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Disable for API
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
};

/**
 * Input Sanitization Middleware
 * 
 * Sanitizes incoming request data by removing null bytes and control characters that
 * could be used in injection attacks or cause parsing issues. This middleware processes
 * request body, query parameters, and URL parameters recursively, handling nested
 * objects and arrays while preserving data structure.
 * 
 * The sanitization process removes characters in the range \x00-\x1F (control characters)
 * and \x7F (DEL character) from string values. This helps prevent null byte injection,
 * control character injection, and other low-level attacks while maintaining data integrity.
 * 
 * Applied early in the middleware stack after body parsing to ensure all user input
 * is sanitized before reaching application logic or validation layers.
 * 
 * @param {Request} req - Express request object containing user input to sanitize
 * @param {Response} _res - Express response object (unused)
 * @param {NextFunction} next - Express next function to continue middleware chain
 * @returns {void}
 * 
 * @example
 * // Usage in main application middleware stack
 * import { sanitizeInput } from '@/shared/middleware/security';
 * 
 * app.use(express.json());
 * app.use(express.urlencoded({ extended: true }));
 * app.use(sanitizeInput); // Apply after body parsing
 * 
 * @example
 * // Input sanitization example:
 * // Before: { "name": "John\x00Doe", "data": ["test\x01", "normal"] }
 * // After:  { "name": "JohnDoe", "data": ["test", "normal"] }
 * 
 * @example
 * // Handles nested objects and arrays:
 * // Before: { "user": { "name": "test\x00", "tags": ["tag\x01", "normal"] } }
 * // After:  { "user": { "name": "test", "tags": ["tag", "normal"] } }
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  // Remove null bytes and control characters from strings
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/[\x00-\x1F\x7F]/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    return obj;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Custom Security Headers Middleware
 * 
 * Adds additional security headers beyond what Helmet provides and removes potentially
 * sensitive server information. This middleware complements Helmet by adding custom
 * security headers and implementing security best practices for API responses.
 * 
 * The middleware removes the X-Powered-By header to prevent server fingerprinting
 * and adds several security headers to protect against common web vulnerabilities
 * including content type sniffing, clickjacking, XSS attacks, and information leakage.
 * 
 * Applied early in the middleware stack to ensure all responses include proper
 * security headers regardless of the response path or content type.
 * 
 * @param {Request} _req - Express request object (unused)
 * @param {Response} res - Express response object to modify headers
 * @param {NextFunction} next - Express next function to continue middleware chain
 * @returns {void}
 * 
 * @example
 * // Usage in main application middleware stack
 * import { securityHeaders } from '@/shared/middleware/security';
 * 
 * app.use(securityHeaders); // Apply early in middleware stack
 * 
 * @example
 * // Headers added by this middleware:
 * // X-Content-Type-Options: nosniff
 * // X-Frame-Options: DENY
 * // X-XSS-Protection: 1; mode=block
 * // Referrer-Policy: strict-origin-when-cross-origin
 * // Permissions-Policy: geolocation=(), microphone=(), camera=()
 * // (X-Powered-By header is removed)
 * 
 * @example
 * // Security benefits:
 * // - Prevents MIME type sniffing attacks
 * // - Blocks iframe embedding (clickjacking protection)
 * // - Enables XSS filtering in older browsers
 * // - Controls referrer information leakage
 * // - Restricts dangerous browser APIs
 * // - Hides server technology information
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Remove server information
  res.removeHeader('X-Powered-By');

  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

/**
 * Request Size Limiting Middleware
 * 
 * Validates incoming request size against configurable limits to prevent resource
 * exhaustion attacks and ensure system stability. This middleware checks the
 * Content-Length header before request processing to reject oversized requests
 * early in the pipeline, preventing memory exhaustion and processing overhead.
 * 
 * When requests exceed the size limit, the middleware responds with a standardized
 * error format and logs the violation for security monitoring. The size limit is
 * configurable via environment variables to accommodate different deployment needs.
 * 
 * Applied before body parsing middleware to prevent large payloads from being
 * processed and consuming server resources. Works in conjunction with Express
 * body parser limits for comprehensive request size control.
 * 
 * @param {Request} req - Express request object to validate size
 * @param {Response} res - Express response object for error responses
 * @param {NextFunction} next - Express next function to continue middleware chain
 * @returns {void}
 * 
 * @example
 * // Usage in main application middleware stack
 * import { requestSizeLimiter } from '@/shared/middleware/security';
 * 
 * app.use(requestSizeLimiter); // Apply before body parsing
 * app.use(express.json({ limit: '10mb' }));
 * app.use(express.urlencoded({ extended: true, limit: '10mb' }));
 * 
 * @example
 * // Environment variable configuration
 * // .env file
 * MAX_REQUEST_SIZE=10485760  # 10MB in bytes
 * 
 * @example
 * // Error response for oversized requests:
 * // HTTP 422 Unprocessable Entity
 * {
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Request size too large",
 *     "timestamp": "2024-01-20T10:30:00.000Z",
 *     "path": "/api/v1/upload"
 *   }
 * }
 * 
 * @example
 * // Security benefits:
 * // - Prevents DoS attacks via large payloads
 * // - Protects against memory exhaustion
 * // - Reduces processing overhead for invalid requests
 * // - Provides early rejection of malicious requests
 * // - Logs security violations for monitoring
 */
export const requestSizeLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const maxSize = parseInt(process.env['MAX_REQUEST_SIZE'] || '10485760'); // 10MB default

  if (req.headers['content-length']) {
    const contentLength = parseInt(req.headers['content-length']);
    if (contentLength > maxSize) {
      logger.warn('Request size exceeded', {
        contentLength,
        maxSize,
        ip: req.ip,
        path: req.path
      });

      res.status(HttpStatus.UNPROCESSABLE_ENTITY).json({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Request size too large',
          timestamp: new Date().toISOString(),
          path: req.path
        }
      });
      return;
    }
  }

  next();
};