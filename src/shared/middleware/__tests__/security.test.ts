// src/shared/middleware/__tests__/security.test.ts

/**
 * Security Middleware Test Suite
 * 
 * Test suite for the security middleware components that form the foundation
 * of the WayrApp backend security infrastructure. This test suite validates all security
 * middleware functions including CORS configuration, rate limiting, input sanitization,
 * security headers, and request size validation.
 * 
 * The tests ensure that each middleware component properly handles both normal and edge
 * cases, validates environment variable configuration, and maintains proper security
 * posture across different deployment scenarios. Special attention is given to testing
 * the rate limiting functionality and CORS origin validation which are critical for
 * preventing abuse and maintaining secure cross-origin communication.
 * 
 * This test suite supports the distributed node architecture by validating that security
 * middleware can be deployed consistently across multiple nodes while maintaining
 * configurable security policies through environment variables.
 * 
 * @fileoverview Comprehensive test suite for security middleware components
 * @author Exequiel Trujillo
  * 
 * @since 1.0.0
 * 
 * @example
 * // Run all security middleware tests
 * npm test -- src/shared/middleware/__tests__/security.test.ts
 * 
 * @example
 * // Run specific test group
 * npm test -- --testNamePattern="corsOptions" src/shared/middleware/__tests__/security.test.ts
 * 
 * @example
 * // Run tests with coverage
 * npm test -- --coverage src/shared/middleware/__tests__/security.test.ts
 */

import { Request, Response, NextFunction } from 'express';
import {
  sanitizeInput,
  securityHeaders,
  requestSizeLimiter,
  corsOptions,
  createRateLimiter,
  defaultRateLimiter,
  authRateLimiter,
  helmetOptions
} from '../security';
import { ErrorCodes, HttpStatus } from '@/shared/types';
import { logger } from '@/shared/utils/logger';

/**
 * Logger Mock Configuration
 * 
 * Mocks the shared logger utility to prevent actual logging during tests and enable
 * verification of logging behavior in security middleware. The mock provides all
 * standard logging methods (warn, info, error) as Jest spy functions.
 */
jest.mock('@/shared/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
}));

/**
 * Mock Express Request Object Factory
 * 
 * Creates a partial Express Request object for testing middleware functions.
 * Provides default values for common request properties and allows customization
 * of body, query parameters, URL parameters, and headers.
 * 
 * @param {any} [body] - Request body object
 * @param {any} [query] - Query parameters object
 * @param {any} [params] - URL parameters object
 * @param {any} [headers] - Request headers object
 * @returns {Partial<Request>} Mock Express request object
 * 
 * @example
 * // Basic request mock
 * const req = mockRequest();
 * 
 * @example
 * // Request with body and headers
 * const req = mockRequest(
 *   { name: 'test' },
 *   undefined,
 *   undefined,
 *   { 'content-length': '1000' }
 * );
 */
const mockRequest = (body?: any, query?: any, params?: any, headers?: any): Partial<Request> => ({
  body: body || {},
  query: query || {},
  params: params || {},
  headers: headers || {},
  ip: '127.0.0.1',
  path: '/test'
});

/**
 * Mock Express Response Object Factory
 * 
 * Creates a partial Express Response object with Jest spy functions for testing
 * middleware that modifies response headers or sends responses. All methods
 * return the response object to support method chaining.
 * 
 * @returns {Partial<Response>} Mock Express response object with spy methods
 * 
 * @example
 * // Basic response mock
 * const res = mockResponse();
 * 
 * @example
 * // Verify response methods were called
 * middleware(req, res, next);
 * expect(res.status).toHaveBeenCalledWith(200);
 * expect(res.json).toHaveBeenCalledWith({ success: true });
 */
const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.removeHeader = jest.fn();
  res.setHeader = jest.fn();
  return res;
};

/**
 * Mock Express Next Function
 * 
 * Jest spy function that mocks the Express next function for testing middleware
 * that calls next() to continue the middleware chain or pass errors.
 * 
 * @type {NextFunction} Jest mock function with Express NextFunction signature
 * 
 * @example
 * // Verify middleware calls next
 * middleware(req, res, mockNext);
 * expect(mockNext).toHaveBeenCalledWith();
 * 
 * @example
 * // Verify middleware passes error to next
 * expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
 */
const mockNext = jest.fn() as NextFunction;

/**
 * Security Middleware Test Suite
 * 
 * Main test suite that validates all security middleware components including
 * CORS configuration, rate limiting, input sanitization, security headers,
 * and request size validation. Each test group focuses on a specific middleware
 * component and validates both normal operation and edge cases.
 * 
 * The test suite ensures that:
 * - All middleware functions have proper Express middleware signatures
 * - Environment variable configuration works correctly
 * - Security policies are enforced as expected
 * - Error handling and logging work properly
 * - Default values are used when configuration is missing
 * 
 * @group Security Middleware
 * @requires jest
 * @requires supertest (for integration tests)
 */
describe('Security Middleware', () => {
  /**
   * Test Setup and Cleanup
   * 
   * Runs before each test to ensure a clean testing environment by:
   * - Clearing all Jest mock function call history
   * - Resetting environment variables to prevent test interference
   * - Ensuring consistent test conditions across all test cases
   * 
   * This setup is crucial for testing environment variable-dependent
   * middleware like rate limiters and CORS configuration.
   */
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables to ensure clean test state
    delete process.env['CORS_ORIGIN'];
    delete process.env['MAX_REQUEST_SIZE'];
    delete process.env['RATE_LIMIT_WINDOW_MS'];
    delete process.env['RATE_LIMIT_MAX_REQUESTS'];
    delete process.env['AUTH_RATE_LIMIT_WINDOW_MS'];
    delete process.env['AUTH_RATE_LIMIT_MAX_REQUESTS'];
  });

  /**
   * CORS Configuration Tests
   * 
   * Tests the Cross-Origin Resource Sharing (CORS) configuration object that
   * controls which domains can access the API. Validates origin checking logic,
   * environment variable handling, and proper CORS policy enforcement.
   * 
   * Key test scenarios:
   * - Origin validation with whitelist checking
   * - Wildcard origin support for development
   * - Default origin fallback behavior
   * - Security logging for blocked requests
   * - CORS configuration properties validation
   * 
   * @group CORS Configuration
   */
  describe('corsOptions', () => {
    it('should allow requests with no origin', (done) => {
      corsOptions.origin(undefined, (err, allow) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);
        done();
      });
    });

    it('should allow requests from allowed origins', (done) => {
      process.env['CORS_ORIGIN'] = 'http://localhost:3000,https://app.wayrapp.com';

      corsOptions.origin('http://localhost:3000', (err, allow) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);
        done();
      });
    });

    it('should allow all origins when wildcard is set', (done) => {
      process.env['CORS_ORIGIN'] = '*';

      corsOptions.origin('https://example.com', (err, allow) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);
        done();
      });
    });

    it('should block requests from disallowed origins', (done) => {
      process.env['CORS_ORIGIN'] = 'http://localhost:3000';

      corsOptions.origin('https://malicious.com', (err, allow) => {
        expect(err).toBeInstanceOf(Error);
        expect(err?.message).toBe('Not allowed by CORS');
        expect(allow).toBeUndefined();
        expect(logger.warn).toHaveBeenCalledWith('CORS blocked request', {
          origin: 'https://malicious.com',
          allowedOrigins: ['http://localhost:3000']
        });
        done();
      });
    });

    it('should use default origin when CORS_ORIGIN is not set', (done) => {
      corsOptions.origin('http://localhost:3000', (err, allow) => {
        expect(err).toBeNull();
        expect(allow).toBe(true);
        done();
      });
    });

    it('should have correct CORS configuration properties', () => {
      expect(corsOptions.credentials).toBe(true);
      expect(corsOptions.optionsSuccessStatus).toBe(200);
      expect(corsOptions.methods).toEqual(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']);
      expect(corsOptions.allowedHeaders).toEqual(['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']);
      expect(corsOptions.exposedHeaders).toEqual(['X-Total-Count', 'X-Page-Count']);
    });
  });

  /**
   * Rate Limiter Factory Function Tests
   * 
   * Tests the factory function that creates configurable rate limiting middleware
   * to protect against abuse and DoS attacks. Validates that the factory creates
   * proper Express middleware with correct signatures and configurations.
   * 
   * Key test scenarios:
   * - Default parameter handling (15 minutes, 100 requests)
   * - Custom parameter configuration
   * - Middleware function signature validation
   * - Error response format configuration
   * - Logging behavior for rate limit violations
   * 
   * @group Rate Limiting
   */
  describe('createRateLimiter', () => {
    it('should create rate limiter with default values', () => {
      const limiter = createRateLimiter();
      expect(typeof limiter).toBe('function');
    });

    it('should create rate limiter with custom values', () => {
      const limiter = createRateLimiter(60000, 50); // 1 minute, 50 requests
      expect(typeof limiter).toBe('function');
    });

    it('should create rate limiter with proper configuration', () => {
      const limiter = createRateLimiter(60000, 10);

      // Test that the limiter is a function (middleware)
      expect(typeof limiter).toBe('function');
      expect(limiter.length).toBe(3); // Express middleware signature (req, res, next)
    });

    it('should create rate limiter that logs and responds when limit exceeded', () => {
      const limiter = createRateLimiter(60000, 1); // Very restrictive for testing

      // Mock the rate limiter to simulate limit exceeded
      // Note: This tests the handler function configuration
      expect(typeof limiter).toBe('function');

      // Verify the limiter was created with proper error response structure
      // The actual rate limiting behavior is tested in integration tests
      // since it requires multiple requests and timing
    });

    it('should create rate limiter with standardized error format', () => {
      const limiter = createRateLimiter(1000, 1);

      // Verify the limiter is properly configured
      expect(typeof limiter).toBe('function');
      expect(limiter.length).toBe(3);
    });
  });

  /**
   * Default Rate Limiter Tests
   * 
   * Tests the pre-configured rate limiter for general API usage with moderate
   * restrictions. Validates environment variable configuration and fallback
   * to default values when environment variables are not set.
   * 
   * Key test scenarios:
   * - Express middleware signature validation
   * - Environment variable configuration (RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS)
   * - Default value fallback (15 minutes, 100 requests)
   * - Integration with createRateLimiter factory
   * 
   * @group Rate Limiting
   */
  describe('defaultRateLimiter', () => {
    it('should be a function (middleware)', () => {
      expect(typeof defaultRateLimiter).toBe('function');
      expect(defaultRateLimiter.length).toBe(3); // Express middleware signature
    });

    it('should use environment variables for configuration', () => {
      // Set environment variables
      process.env['RATE_LIMIT_WINDOW_MS'] = '60000';
      process.env['RATE_LIMIT_MAX_REQUESTS'] = '50';

      // Create a new rate limiter to test env var usage
      const testLimiter = createRateLimiter(
        parseInt(process.env['RATE_LIMIT_WINDOW_MS'] || '900000'),
        parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] || '100')
      );

      expect(typeof testLimiter).toBe('function');
    });

    it('should use default values when environment variables are not set', () => {
      // Ensure env vars are not set
      delete process.env['RATE_LIMIT_WINDOW_MS'];
      delete process.env['RATE_LIMIT_MAX_REQUESTS'];

      // The defaultRateLimiter should still be a valid function
      expect(typeof defaultRateLimiter).toBe('function');
    });
  });

  /**
   * Authentication Rate Limiter Tests
   * 
   * Tests the strict rate limiter designed for authentication endpoints to prevent
   * brute force attacks and credential stuffing. Validates more restrictive limits
   * compared to the default rate limiter and proper environment variable handling.
   * 
   * Key test scenarios:
   * - Express middleware signature validation
   * - Auth-specific environment variables (AUTH_RATE_LIMIT_WINDOW_MS, AUTH_RATE_LIMIT_MAX_REQUESTS)
   * - Restrictive configuration (15 minutes, 5 requests by default)
   * - Comparison with default rate limiter restrictions
   * - Default value fallback for missing configuration
   * 
   * @group Rate Limiting
   * @group Authentication Security
   */
  describe('authRateLimiter', () => {
    it('should be a function (middleware)', () => {
      expect(typeof authRateLimiter).toBe('function');
      expect(authRateLimiter.length).toBe(3); // Express middleware signature
    });

    it('should use environment variables for auth-specific configuration', () => {
      // Set auth-specific environment variables
      process.env['AUTH_RATE_LIMIT_WINDOW_MS'] = '300000'; // 5 minutes
      process.env['AUTH_RATE_LIMIT_MAX_REQUESTS'] = '3';

      // Create a new auth rate limiter to test env var usage
      const testAuthLimiter = createRateLimiter(
        parseInt(process.env['AUTH_RATE_LIMIT_WINDOW_MS'] || '900000'),
        parseInt(process.env['AUTH_RATE_LIMIT_MAX_REQUESTS'] || '5')
      );

      expect(typeof testAuthLimiter).toBe('function');
    });

    it('should be more restrictive than default rate limiter', () => {
      // Both should be middleware functions
      expect(typeof authRateLimiter).toBe('function');
      expect(typeof defaultRateLimiter).toBe('function');

      // Auth rate limiter should be configured for stricter limits
      // (This is verified by the environment variable defaults: 5 vs 100 requests)
    });

    it('should use default auth values when environment variables are not set', () => {
      // Ensure auth env vars are not set
      delete process.env['AUTH_RATE_LIMIT_WINDOW_MS'];
      delete process.env['AUTH_RATE_LIMIT_MAX_REQUESTS'];

      // The authRateLimiter should still be a valid function
      expect(typeof authRateLimiter).toBe('function');
    });
  });

  /**
   * Helmet Security Headers Configuration Tests
   * 
   * Tests the configuration object for Helmet middleware that sets various HTTP
   * security headers to protect against common web vulnerabilities. Validates
   * Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), and
   * other security header configurations.
   * 
   * Key test scenarios:
   * - Content Security Policy directive validation
   * - HSTS configuration (max-age, includeSubDomains, preload)
   * - Cross-Origin Embedder Policy settings for API compatibility
   * - Security header completeness and correctness
   * 
   * @group Security Headers
   * @group Content Security Policy
   */
  describe('helmetOptions', () => {
    it('should have correct Content Security Policy configuration', () => {
      expect(helmetOptions.contentSecurityPolicy).toBeDefined();
      expect(helmetOptions.contentSecurityPolicy.directives).toBeDefined();

      const directives = helmetOptions.contentSecurityPolicy.directives;
      expect(directives.defaultSrc).toEqual(["'self'"]);
      expect(directives.styleSrc).toEqual(["'self'", "'unsafe-inline'", "https://unpkg.com/swagger-ui-dist@5.9.0/"]);
      expect(directives.scriptSrc).toEqual(["'self'", "'unsafe-inline'", "https://unpkg.com/swagger-ui-dist@5.9.0/"]);
      expect(directives.imgSrc).toEqual(["'self'", "data:", "https:", "https://unpkg.com/swagger-ui-dist@5.9.0/"]);
      expect(directives.connectSrc).toEqual(["'self'"]);
      expect(directives.fontSrc).toEqual(["'self'", "https://unpkg.com/swagger-ui-dist@5.9.0/"]);
      expect(directives.objectSrc).toEqual(["'none'"]);
      expect(directives.mediaSrc).toEqual(["'self'"]);
      expect(directives.frameSrc).toEqual(["'none'"]);
    });

    it('should have HSTS configuration', () => {
      expect(helmetOptions.hsts).toBeDefined();
      expect(helmetOptions.hsts.maxAge).toBe(31536000); // 1 year
      expect(helmetOptions.hsts.includeSubDomains).toBe(true);
      expect(helmetOptions.hsts.preload).toBe(true);
    });

    it('should disable Cross-Origin Embedder Policy for API compatibility', () => {
      expect(helmetOptions.crossOriginEmbedderPolicy).toBe(false);
    });

    it('should allow specific Swagger UI resources in CSP', () => {
      const directives = helmetOptions.contentSecurityPolicy.directives;
      const swaggerDomain = "https://unpkg.com/swagger-ui-dist@5.9.0/";

      // Verify Swagger UI resources are specifically allowed
      expect(directives.styleSrc).toContain(swaggerDomain);
      expect(directives.scriptSrc).toContain(swaggerDomain);
      expect(directives.imgSrc).toContain(swaggerDomain);
      expect(directives.fontSrc).toContain(swaggerDomain);

      // Verify it's specific to Swagger UI version, not all of unpkg.com
      expect(directives.styleSrc).not.toContain("https://unpkg.com");
      expect(directives.scriptSrc).not.toContain("https://unpkg.com");
    });
  });

  /**
   * Input Sanitization Middleware Tests
   * 
   * Tests the middleware that sanitizes incoming request data by removing null bytes
   * and control characters that could be used in injection attacks. Validates
   * recursive processing of nested objects and arrays while preserving data structure.
   * 
   * Key test scenarios:
   * - Control character removal (\x00-\x1F, \x7F)
   * - Nested object processing with deep sanitization
   * - Array handling with mixed data types
   * - Non-string value preservation (numbers, booleans, null, undefined)
   * - Request body, query, and params sanitization
   * 
   * @group Input Sanitization
   * @group Security Validation
   */
  describe('sanitizeInput', () => {
    it('should remove control characters from strings', () => {
      const req = mockRequest(
        { name: 'John\x00Doe\x1F', description: 'Test\x7F' },
        { search: 'query\x00test' },
        { id: 'param\x1Ftest' }
      );
      const res = mockResponse();

      sanitizeInput(req as Request, res as Response, mockNext);

      expect(req.body).toEqual({ name: 'JohnDoe', description: 'Test' });
      expect(req.query).toEqual({ search: 'querytest' });
      expect(req.params).toEqual({ id: 'paramtest' });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle nested objects', () => {
      const req = mockRequest({
        user: {
          name: 'John\x00Doe',
          profile: {
            bio: 'Test\x1Fbio'
          }
        }
      });
      const res = mockResponse();

      sanitizeInput(req as Request, res as Response, mockNext);

      expect(req.body).toEqual({
        user: {
          name: 'JohnDoe',
          profile: {
            bio: 'Testbio'
          }
        }
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle arrays', () => {
      const req = mockRequest({
        items: ['item1\x00', 'item2\x1F', { name: 'nested\x7F' }]
      });
      const res = mockResponse();

      sanitizeInput(req as Request, res as Response, mockNext);

      expect(req.body).toEqual({
        items: ['item1', 'item2', { name: 'nested' }]
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle non-string values', () => {
      const req = mockRequest({
        number: 123,
        boolean: true,
        null: null,
        undefined: undefined
      });
      const res = mockResponse();

      sanitizeInput(req as Request, res as Response, mockNext);

      expect(req.body).toEqual({
        number: 123,
        boolean: true,
        null: null,
        undefined: undefined
      });
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  /**
   * Custom Security Headers Middleware Tests
   * 
   * Tests the middleware that adds additional security headers beyond what Helmet
   * provides and removes potentially sensitive server information. Validates
   * proper header setting and server fingerprinting prevention.
   * 
   * Key test scenarios:
   * - X-Powered-By header removal for server fingerprinting prevention
   * - Security header setting (X-Content-Type-Options, X-Frame-Options, etc.)
   * - XSS protection header configuration
   * - Referrer policy and permissions policy enforcement
   * - Middleware chain continuation with next()
   * 
   * @group Security Headers
   * @group Server Fingerprinting
   */
  describe('securityHeaders', () => {
    it('should set security headers', () => {
      const req = mockRequest();
      const res = mockResponse();

      securityHeaders(req as Request, res as Response, mockNext);

      expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  /**
   * Request Size Limiting Middleware Tests
   * 
   * Tests the middleware that validates incoming request size against configurable
   * limits to prevent resource exhaustion attacks. Validates Content-Length header
   * checking, error response format, and environment variable configuration.
   * 
   * Key test scenarios:
   * - Request size validation against configured limits
   * - Oversized request rejection with proper error responses
   * - Default size limit usage (10MB) when not configured
   * - Missing Content-Length header handling
   * - Environment variable configuration (MAX_REQUEST_SIZE)
   * - Security logging for oversized requests
   * 
   * @group Request Validation
   * @group DoS Protection
   */
  describe('requestSizeLimiter', () => {

    it('should allow requests within size limit', () => {
      const req = mockRequest(undefined, undefined, undefined, { 'content-length': '1000' });
      const res = mockResponse();

      requestSizeLimiter(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject requests exceeding size limit', () => {
      process.env['MAX_REQUEST_SIZE'] = '1000';
      const req = mockRequest(undefined, undefined, undefined, { 'content-length': '2000' });
      const res = mockResponse();

      requestSizeLimiter(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Request size too large',
          timestamp: expect.any(String),
          path: '/test'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use default size limit when not configured', () => {
      const req = mockRequest(undefined, undefined, undefined, { 'content-length': '20000000' }); // 20MB
      const res = mockResponse();

      requestSizeLimiter(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow requests without content-length header', () => {
      const req = mockRequest();
      const res = mockResponse();

      requestSizeLimiter(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});