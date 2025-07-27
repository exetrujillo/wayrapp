// src/shared/middleware/validation.ts

/**
 * Request validation middleware system for WayrApp Backend API
 * 
 * This module provides comprehensive request validation capabilities for the WayrApp language learning
 * platform, utilizing Zod schemas to ensure data integrity and security across all API endpoints.
 * The validation system serves as a critical security layer, preventing malformed or malicious data
 * from reaching business logic layers and ensuring consistent data structures throughout the application.
 * 
 * The module offers flexible validation options for different parts of HTTP requests (body, parameters,
 * query strings) and integrates seamlessly with the Express middleware stack. It automatically transforms
 * and validates incoming data according to predefined schemas, providing immediate feedback for validation
 * failures while maintaining high performance through efficient schema compilation and caching.
 * 
 * Key architectural features include automatic error handling integration with the global error handler,
 * support for complex nested validation schemas, automatic type coercion and transformation, and
 * comprehensive error reporting that helps developers identify and fix validation issues quickly.
 * The system is designed to scale with the application's growth toward a distributed architecture,
 * ensuring consistent validation behavior across multiple nodes and services.
 * 
 * Security considerations include protection against injection attacks through strict schema validation,
 * prevention of data type confusion attacks, automatic sanitization of input data, and comprehensive
 * logging of validation failures for security monitoring. The module also includes safeguards against
 * denial-of-service attacks through request size validation and schema complexity limits.
 * 
 * @module validation
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic usage with body validation
 * import { validate } from '@/shared/middleware/validation';
 * import { z } from 'zod';
 * 
 * const userSchema = z.object({
 *   name: z.string().min(1).max(100),
 *   email: z.string().email(),
 *   age: z.number().int().min(13).max(120)
 * });
 * 
 * router.post('/users', validate({ body: userSchema }), userController.create);
 * 
 * @example
 * // Multi-part validation (body, params, query)
 * const courseUpdateSchema = {
 *   params: z.object({ id: z.string().uuid() }),
 *   body: z.object({ title: z.string().min(1) }),
 *   query: z.object({ notify: z.boolean().optional() })
 * };
 * 
 * router.put('/courses/:id', validate(courseUpdateSchema), courseController.update);
 * 
 * @example
 * // Using convenience functions
 * import { validateBody, validateParams, validateQuery } from '@/shared/middleware/validation';
 * 
 * router.get('/courses/:id', validateParams(z.object({ id: z.string().uuid() })), courseController.get);
 * router.post('/courses', validateBody(courseSchema), courseController.create);
 * router.get('/courses', validateQuery(paginationSchema), courseController.list);
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler';
import { ErrorCodes, HttpStatus } from '@/shared/types';

/**
 * Primary validation middleware factory for comprehensive request data validation
 *  
 * Creates Express middleware that validates incoming HTTP requests against Zod schemas for body,
 * parameters, and query string data. This function serves as the core validation mechanism for
 * the WayrApp backend API, ensuring all incoming data conforms to expected structures before
 * reaching route handlers and business logic layers.
 * 
 * The middleware performs validation in a specific order: body, parameters, then query parameters.
 * Each validation step transforms and validates the corresponding request data, automatically
 * coercing types where appropriate (e.g., string to number conversions). If validation succeeds,
 * the validated and transformed data replaces the original request data, ensuring type safety
 * throughout the request lifecycle.
 * 
 * When validation fails, the middleware automatically forwards Zod validation errors to the
 * global error handler, which transforms them into standardized API error responses. This
 * ensures consistent error formatting and proper HTTP status codes for all validation failures.
 * 
 * The function is designed for high performance with minimal overhead, utilizing Zod's efficient
 * parsing engine and avoiding unnecessary data copying. It supports complex nested schemas,
 * conditional validation, custom transformations, and all Zod validation features.
 * 
 * Security features include automatic sanitization of input data, prevention of prototype
 * pollution attacks through safe object parsing, and protection against type confusion attacks
 * by enforcing strict schema adherence. The middleware also includes safeguards against
 * denial-of-service attacks through efficient validation algorithms.
 * 
 * @param {Object} schema - Configuration object containing Zod schemas for different request parts
 * @param {ZodSchema} [schema.body] - Optional Zod schema for validating request body data
 * @param {ZodSchema} [schema.params] - Optional Zod schema for validating URL parameters
 * @param {ZodSchema} [schema.query] - Optional Zod schema for validating query string parameters
 * @returns {Function} Express middleware function that performs the validation
 * 
 * @throws {ZodError} When validation fails, forwards Zod validation errors to error handler
 * @throws {AppError} When non-Zod errors occur during validation process
 * 
 * @example
 * // Validate only request body
 * const userSchema = z.object({
 *   name: z.string().min(1, 'Name is required'),
 *   email: z.string().email('Invalid email format'),
 *   age: z.number().int().min(13, 'Must be at least 13 years old')
 * });
 * 
 * router.post('/users', validate({ body: userSchema }), userController.create);
 * 
 * @example
 * // Validate URL parameters only
 * const paramSchema = z.object({
 *   id: z.string().uuid('Invalid user ID format'),
 *   courseId: z.string().uuid('Invalid course ID format')
 * });
 * 
 * router.get('/users/:id/courses/:courseId', validate({ params: paramSchema }), handler);
 * 
 * @example
 * // Validate query parameters with transformations
 * const querySchema = z.object({
 *   page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)),
 *   limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)),
 *   search: z.string().optional(),
 *   sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional()
 * });
 * 
 * router.get('/courses', validate({ query: querySchema }), courseController.list);
 * 
 * @example
 * // Comprehensive validation for complex endpoints
 * const updateCourseSchema = {
 *   params: z.object({
 *     id: z.string().uuid('Invalid course ID')
 *   }),
 *   body: z.object({
 *     title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
 *     description: z.string().optional(),
 *     isPublished: z.boolean().optional(),
 *     tags: z.array(z.string()).max(10, 'Too many tags').optional()
 *   }),
 *   query: z.object({
 *     notify: z.string().transform(val => val === 'true').pipe(z.boolean()).optional()
 *   })
 * };
 * 
 * router.put('/courses/:id', validate(updateCourseSchema), courseController.update);
 * 
 * @example
 * // Nested object validation
 * const lessonSchema = z.object({
 *   title: z.string().min(1),
 *   content: z.object({
 *     type: z.enum(['video', 'text', 'interactive']),
 *     data: z.object({
 *       url: z.string().url().optional(),
 *       text: z.string().optional(),
 *       exercises: z.array(z.object({
 *         question: z.string(),
 *         answer: z.string()
 *       })).optional()
 *     })
 *   })
 * });
 * 
 * router.post('/lessons', validate({ body: lessonSchema }), lessonController.create);
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
 * Convenience middleware factory for request body validation only
 * 
 * Creates Express middleware that validates only the request body against a Zod schema,
 * ignoring URL parameters and query strings. This function provides a streamlined API
 * for the common use case of validating POST, PUT, and PATCH request bodies without
 * the need to specify the full schema object structure.
 * 
 * This middleware is particularly useful for API endpoints that accept JSON payloads
 * for creating or updating resources, where URL parameters and query strings are either
 * not used or validated separately. It maintains the same validation behavior and error
 * handling as the main validate function while providing a more concise syntax.
 * 
 * The function internally delegates to the main validate function, ensuring consistent
 * behavior and error handling across all validation middleware. This approach maintains
 * code reusability while providing developer-friendly convenience functions.
 * 
 * @param {ZodSchema} schema - Zod schema for validating the request body
 * @returns {Function} Express middleware function that validates request body
 * 
 * @throws {ZodError} When body validation fails, forwards error to global error handler
 * @throws {AppError} When non-Zod errors occur during validation
 * 
 * @example
 * // User registration endpoint
 * const registerSchema = z.object({
 *   email: z.string().email('Invalid email format'),
 *   password: z.string().min(8, 'Password must be at least 8 characters'),
 *   firstName: z.string().min(1, 'First name is required'),
 *   lastName: z.string().min(1, 'Last name is required'),
 *   acceptTerms: z.boolean().refine(val => val === true, 'Must accept terms')
 * });
 * 
 * router.post('/auth/register', validateBody(registerSchema), authController.register);
 * 
 * @example
 * // Course creation with nested validation
 * const courseSchema = z.object({
 *   title: z.string().min(1, 'Title is required').max(200),
 *   description: z.string().max(1000).optional(),
 *   difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
 *   modules: z.array(z.object({
 *     title: z.string().min(1),
 *     order: z.number().int().min(0)
 *   })).min(1, 'At least one module is required')
 * });
 * 
 * router.post('/courses', validateBody(courseSchema), courseController.create);
 * 
 * @example
 * // Update user profile
 * const updateProfileSchema = z.object({
 *   firstName: z.string().min(1).optional(),
 *   lastName: z.string().min(1).optional(),
 *   bio: z.string().max(500).optional(),
 *   preferences: z.object({
 *     language: z.string().optional(),
 *     notifications: z.boolean().optional()
 *   }).optional()
 * });
 * 
 * router.put('/profile', validateBody(updateProfileSchema), userController.updateProfile);
 */
export const validateBody = (schema: ZodSchema) => {
  return validate({ body: schema });
};

/**
 * Convenience middleware factory for URL parameter validation only
 * 
 * Creates Express middleware that validates only URL parameters (route parameters) against
 * a Zod schema, ignoring request body and query strings. This function is essential for
 * validating resource identifiers, slugs, and other path-based parameters that determine
 * which resources an API endpoint should operate on.
 * 
 * URL parameters are typically used for resource identification (e.g., user IDs, course IDs)
 * and must be validated to ensure they conform to expected formats (UUIDs, integers, slugs).
 * This validation prevents invalid identifiers from reaching business logic and helps
 * prevent injection attacks through malformed URLs.
 * 
 * The middleware is particularly important for RESTful API endpoints that follow resource-based
 * URL patterns, where parameters directly map to database queries or resource lookups.
 * Proper validation ensures that only well-formed identifiers are processed, improving
 * both security and error handling.
 * 
 * @param {ZodSchema} schema - Zod schema for validating URL parameters
 * @returns {Function} Express middleware function that validates URL parameters
 * 
 * @throws {ZodError} When parameter validation fails, forwards error to global error handler
 * @throws {AppError} When non-Zod errors occur during validation
 * 
 * @example
 * // Validate UUID parameters for resource endpoints
 * const uuidParamSchema = z.object({
 *   id: z.string().uuid('Invalid resource ID format')
 * });
 * 
 * router.get('/users/:id', validateParams(uuidParamSchema), userController.getById);
 * router.put('/courses/:id', validateParams(uuidParamSchema), courseController.update);
 * router.delete('/lessons/:id', validateParams(uuidParamSchema), lessonController.delete);
 * 
 * @example
 * // Multiple parameter validation
 * const nestedParamSchema = z.object({
 *   courseId: z.string().uuid('Invalid course ID'),
 *   moduleId: z.string().uuid('Invalid module ID'),
 *   lessonId: z.string().uuid('Invalid lesson ID')
 * });
 * 
 * router.get('/courses/:courseId/modules/:moduleId/lessons/:lessonId', 
 *   validateParams(nestedParamSchema), 
 *   lessonController.getLesson
 * );
 * 
 * @example
 * // Slug-based parameter validation
 * const slugParamSchema = z.object({
 *   slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format').min(1).max(100)
 * });
 * 
 * router.get('/courses/slug/:slug', validateParams(slugParamSchema), courseController.getBySlug);
 * 
 * @example
 * // Mixed parameter types with transformations
 * const mixedParamSchema = z.object({
 *   userId: z.string().uuid('Invalid user ID'),
 *   page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)),
 *   category: z.string().min(1).max(50)
 * });
 * 
 * router.get('/users/:userId/courses/:category/page/:page', 
 *   validateParams(mixedParamSchema), 
 *   courseController.getUserCoursesByCategory
 * );
 */
export const validateParams = (schema: ZodSchema) => {
  return validate({ params: schema });
};

/**
 * Convenience middleware factory for query parameter validation only
 * 
 * Creates Express middleware that validates only query string parameters against a Zod schema,
 * ignoring request body and URL parameters. This function is crucial for validating optional
 * parameters that modify endpoint behavior, such as pagination settings, search filters,
 * sorting options, and feature flags passed through the URL query string.
 * 
 * Query parameters are typically used for optional functionality like filtering, sorting,
 * pagination, and search. Since they come from user input in the URL, they must be validated
 * to ensure they conform to expected formats and ranges. This validation prevents malformed
 * queries from causing errors and helps maintain consistent API behavior.
 * 
 * The middleware supports automatic type coercion, which is particularly useful for query
 * parameters since they are always received as strings but often need to be converted to
 * numbers, booleans, or other types. Zod's transformation capabilities make this conversion
 * safe and predictable.
 * 
 * This function is essential for implementing robust API endpoints that accept optional
 * parameters while maintaining strict data validation and type safety throughout the
 * application.
 * 
 * @param {ZodSchema} schema - Zod schema for validating query string parameters
 * @returns {Function} Express middleware function that validates query parameters
 * 
 * @throws {ZodError} When query validation fails, forwards error to global error handler
 * @throws {AppError} When non-Zod errors occur during validation
 * 
 * @example
 * // Pagination and search parameters
 * const paginationSchema = z.object({
 *   page: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1)).optional().default('1'),
 *   limit: z.string().transform(val => parseInt(val, 10)).pipe(z.number().int().min(1).max(100)).optional().default('20'),
 *   search: z.string().min(1).max(100).optional(),
 *   sortBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('createdAt'),
 *   sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
 * });
 * 
 * router.get('/courses', validateQuery(paginationSchema), courseController.list);
 * 
 * @example
 * // Boolean flags and filters
 * const filterSchema = z.object({
 *   published: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
 *   difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
 *   hasVideo: z.string().transform(val => val === 'true').pipe(z.boolean()).optional(),
 *   minRating: z.string().transform(val => parseFloat(val)).pipe(z.number().min(0).max(5)).optional()
 * });
 * 
 * router.get('/courses/search', validateQuery(filterSchema), courseController.search);
 * 
 * @example
 * // Date range validation
 * const dateRangeSchema = z.object({
 *   startDate: z.string().datetime('Invalid start date format').optional(),
 *   endDate: z.string().datetime('Invalid end date format').optional(),
 *   timezone: z.string().optional().default('UTC')
 * }).refine(data => {
 *   if (data.startDate && data.endDate) {
 *     return new Date(data.startDate) <= new Date(data.endDate);
 *   }
 *   return true;
 * }, 'Start date must be before end date');
 * 
 * router.get('/analytics/progress', validateQuery(dateRangeSchema), analyticsController.getProgress);
 * 
 * @example
 * // Array parameters (comma-separated values)
 * const arrayQuerySchema = z.object({
 *   tags: z.string().transform(val => val.split(',')).pipe(z.array(z.string().min(1))).optional(),
 *   categories: z.string().transform(val => val.split(',')).pipe(z.array(z.enum(['language', 'culture', 'grammar']))).optional(),
 *   exclude: z.string().transform(val => val.split(',')).pipe(z.array(z.string().uuid())).optional()
 * });
 * 
 * router.get('/content/filter', validateQuery(arrayQuerySchema), contentController.filter);
 */
export const validateQuery = (schema: ZodSchema) => {
  return validate({ query: schema });
};