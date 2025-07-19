import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler';
import { ErrorCodes, HttpStatus } from '@/shared/types';

/**
 * Validation middleware factory that validates request data against Zod schemas
 */
export const validate = (schema: {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // SECURITY_AUDIT_TODO: Consider implementing request size limits to prevent DoS attacks
      // Large payloads could consume excessive memory during validation. Add middleware like
      // express.json({ limit: '10mb' }) before validation middleware to limit request size.
      
      // Validate request body
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }

      // Validate request parameters
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }

      // Validate query parameters
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // SECURITY_AUDIT_TODO: ZodError messages may leak sensitive schema information
        // Consider sanitizing error messages before sending to client to avoid exposing
        // internal validation logic. Implement a custom error formatter that provides
        // generic validation messages while logging detailed errors server-side.
        next(error);
      } else {
        next(new AppError(
          'Validation failed',
          HttpStatus.BAD_REQUEST,
          ErrorCodes.VALIDATION_ERROR
        ));
      }
    }
  };
};

/**
 * Validate request body only
 */
export const validateBody = (schema: ZodSchema) => {
  return validate({ body: schema });
};

/**
 * Validate request parameters only
 */
export const validateParams = (schema: ZodSchema) => {
  return validate({ params: schema });
};

/**
 * Validate query parameters only
 */
export const validateQuery = (schema: ZodSchema) => {
  return validate({ query: schema });
};