// src/shared/middleware/xssProtection.ts

/**
 * XSS Protection Middleware for Cross-Site Scripting Attack Prevention
 * 
 * This middleware provides protection against Cross-Site Scripting (XSS) attacks
 * by sanitizing user input using the industry-standard `xss` library. It recursively processes
 * request bodies, query parameters, and URL parameters to remove or neutralize potentially
 * malicious HTML and JavaScript content while preserving legitimate data.
 * 
 * The middleware implements a layered security approach, working in conjunction with the basic
 * input sanitization middleware to provide comprehensive protection. While the basic sanitizer
 * removes control characters and null bytes, this XSS protection specifically targets HTML/JS
 * injection attempts and provides detailed security logging for monitoring purposes.
 * 
 * This middleware is applied in the main application security stack (src/app.ts) after basic
 * input sanitization and before request processing. It serves as a critical security layer
 * for protecting against one of the most common web application vulnerabilities, ensuring
 * that user-generated content cannot execute malicious scripts in other users' browsers.
 * 
 * The middleware maintains data structure integrity while sanitizing content, supporting
 * nested objects and arrays to handle complex request payloads. All XSS attempts are
 * logged with contextual information for security monitoring and incident response.
 * 
 * @module xssProtection
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @param {Request} req - Express request object containing user input to sanitize
 * @param {Response} _res - Express response object (unused)
 * @param {NextFunction} next - Express next function to continue middleware chain
 * @returns {void}
 * 
 * @example
 * // Usage in main application security stack
 * import { xssProtection } from '@/shared/middleware/xssProtection';
 * 
 * app.use(express.json());
 * app.use(express.urlencoded({ extended: true }));
 * app.use(sanitizeInput);  // Basic sanitization first
 * app.use(xssProtection);  // XSS protection second
 * 
 * @example
 * // Layered security approach in main app
 * import { sanitizeInput, xssProtection } from '@/shared/middleware';
 * 
 * // Apply security middleware in sequence
 * app.use(sanitizeInput);    // Remove control characters
 * app.use(xssProtection);    // Prevent XSS attacks
 * app.use(requestLogger);    // Log sanitized requests
 * 
 * @example
 * // XSS sanitization example:
 * // Input:  { "comment": "<script>alert('XSS')</script>Hello World" }
 * // Output: { "comment": "&lt;script&gt;alert('XSS')&lt;/script&gt;Hello World" }
 * 
 * @example
 * // Nested object sanitization:
 * // Input:  { "user": { "bio": "<img src=x onerror=alert(1)>", "posts": ["<script>...</script>"] } }
 * // Output: { "user": { "bio": "&lt;img src=x onerror=alert(1)&gt;", "posts": ["&lt;script&gt;...&lt;/script&gt;"] } }
 * 
 * @example
 * // Security logging for XSS attempts:
 * // When XSS content is detected, logs include:
 * // - Original content (truncated for security)
 * // - Request path where attempt occurred
 * // - Client IP address for tracking
 * // - Timestamp for incident response
 */

import { Request, Response, NextFunction } from 'express';
import xss from 'xss';
import { logger } from '@/shared/utils/logger';

export const xssProtection = (req: Request, _res: Response, next: NextFunction): void => {
  /**
   * Recursive Object Sanitization Function
   * 
   * Recursively traverses and sanitizes all string values within complex data structures
   * including nested objects and arrays. This ensures comprehensive XSS protection
   * regardless of the input data structure complexity.
   * 
   * @param {any} obj - Object, array, string, or primitive value to sanitize
   * @returns {any} Sanitized version of the input with XSS content neutralized
   */
  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      // Apply XSS sanitization to string values
      const sanitized = xss(obj);

      // Log XSS attempts for security monitoring
      if (sanitized !== obj) {
        logger.warn('XSS attempt detected and sanitized', {
          original: obj.substring(0, 100) + (obj.length > 100 ? '...' : ''),
          path: req.path,
          ip: req.ip,
        });
      }
      return sanitized;
    }

    if (Array.isArray(obj)) {
      // Recursively sanitize array elements
      return obj.map((item) => sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      // Recursively sanitize object properties
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize request body (POST/PUT/PATCH data)
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters (URL query string)
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters (route parameters)
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};