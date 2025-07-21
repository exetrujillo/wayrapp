import { Request, Response, NextFunction } from 'express';
import xss from 'xss';
import { logger } from '@/shared/utils/logger';

/**
 * XSS Protection Middleware
 * Sanitizes request body, query parameters, and URL parameters to prevent XSS attacks
 */
export const xssProtection = (req: Request, _res: Response, next: NextFunction): void => {
  // Function to recursively sanitize objects
  const sanitizeObject = (obj: any): any => {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      const sanitized = xss(obj);
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
      return obj.map((item) => sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }

    return obj;
  };

  // Sanitize request body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};