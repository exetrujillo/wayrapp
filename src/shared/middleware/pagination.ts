// src/shared/middleware/pagination.ts

/**
 * Comprehensive pagination middleware and utilities for WayrApp backend API endpoints.
 * 
 * This module provides a complete pagination solution supporting both traditional page-based
 * and modern offset-based pagination strategies. It serves as the central pagination layer
 * for all API endpoints requiring data pagination, filtering, sorting, and search capabilities.
 * The middleware automatically validates query parameters, normalizes pagination options,
 * and provides utilities for building database queries and response headers.
 * 
 * Key architectural features include dual pagination strategy support (page/offset), 
 * comprehensive query parameter validation using Zod schemas, flexible filtering and 
 * sorting with configurable allowed fields, full-text search capabilities across multiple
 * fields, and RFC 5988 compliant Link headers for API navigation. The module integrates
 * seamlessly with Prisma ORM and Express.js middleware patterns.
 * 
 * The pagination system is designed for high-performance content delivery in the language
 * learning platform, supporting course listings, exercise collections, user progress
 * tracking, and administrative content management interfaces. All utilities generate
 * Prisma-compatible query objects and provide consistent response formatting across
 * the entire application.
 * 
 * @module Pagination
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic pagination middleware usage in routes
 * import { paginationMiddleware } from '@/shared/middleware/pagination';
 * 
 * router.get('/courses', 
 *   paginationMiddleware({
 *     allowedSortFields: ['name', 'created_at'],
 *     defaultSortField: 'created_at',
 *     allowedFilters: ['source_language', 'target_language'],
 *     searchFields: ['name', 'description']
 *   }),
 *   courseController.getCourses
 * );
 * 
 * @example
 * // Using pagination utilities in service layer
 * import { getPaginationParams, getSortParams, buildTextSearchFilter } from '@/shared/middleware/pagination';
 * 
 * const { skip, take } = getPaginationParams(page, limit);
 * const orderBy = getSortParams(sortBy, sortOrder);
 * const searchFilter = buildTextSearchFilter(search, ['name', 'description']);
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { QueryOptions } from '../types';
import { AppError } from './errorHandler';
import { ErrorCodes, HttpStatus } from '../types';

// Pagination query schema for validation with both page-limit and offset-limit strategies
const PaginationQuerySchema = z.object({
  // Page-based pagination (traditional)
  page: z.coerce.number().int().min(1).optional(),

  // Offset-based pagination (new strategy)
  offset: z.coerce.number().int().min(0).optional(),

  // Common parameters
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

/**
 * Configuration options for the pagination middleware.
 * 
 * @interface PaginationOptions
 */
export interface PaginationOptions {
  /** Default number of items per page when not specified in query parameters */
  defaultLimit?: number;
  /** Maximum allowed limit to prevent excessive data retrieval */
  maxLimit?: number;
  /** Array of field names that are allowed for sorting operations */
  allowedSortFields?: string[];
  /** Array of filter parameter names that are allowed in query parameters */
  allowedFilters?: string[];
  /** Default field to sort by when sortBy is not specified or invalid */
  defaultSortField?: string;
  /** Array of field names to search within when search parameter is provided */
  searchFields?: string[];
}

/**
 * Express middleware that validates and normalizes pagination query parameters.
 * 
 * This middleware supports both traditional page-based pagination (page/limit) and
 * modern offset-based pagination (offset/limit) strategies. It validates all query
 * parameters using Zod schemas, enforces limits and allowed fields, and attaches
 * the normalized pagination options to the request object for use by route handlers.
 * 
 * The middleware automatically handles parameter coercion, validation errors, and
 * provides fallback values for missing parameters. It also supports flexible
 * filtering, sorting, and full-text search capabilities based on configuration.
 * 
 * @param {PaginationOptions} [options={}] Configuration options for pagination behavior
 * @param {number} [options.defaultLimit=20] Default number of items per page
 * @param {number} [options.maxLimit=100] Maximum allowed limit value
 * @param {string[]} [options.allowedSortFields=[]] Allowed fields for sorting
 * @param {string[]} [options.allowedFilters=[]] Allowed filter parameter names
 * @param {string} [options.defaultSortField='created_at'] Default sort field
 * @param {string[]} [options.searchFields=[]] Fields to search within
 * @returns {Function} Express middleware function
 * @throws {AppError} When validation fails with VALIDATION_ERROR code
 * 
 * @example
 * // Basic usage with default options
 * app.get('/api/items', paginationMiddleware(), itemController.getItems);
 * 
 * @example
 * // Advanced configuration for course listings
 * app.get('/api/courses', 
 *   paginationMiddleware({
 *     defaultLimit: 10,
 *     maxLimit: 50,
 *     allowedSortFields: ['name', 'created_at', 'updated_at'],
 *     allowedFilters: ['source_language', 'target_language', 'is_public'],
 *     defaultSortField: 'created_at',
 *     searchFields: ['name', 'description']
 *   }),
 *   courseController.getCourses
 * );
 */
export const paginationMiddleware = (options: PaginationOptions = {}) => {
  const {
    defaultLimit = 20,
    maxLimit = 100,
    allowedSortFields = [],
    allowedFilters = [],
    defaultSortField = 'created_at',
    searchFields = []
  } = options;

  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Create dynamic schema based on options
      const schema = PaginationQuerySchema.extend({
        limit: z.coerce.number().int().min(1).default(defaultLimit).transform(val => Math.min(val, maxLimit)),
        sortBy: z.string().optional(),
      });

      // Parse and validate pagination parameters
      let paginationParams = schema.parse(req.query);

      // Validate sortBy field separately if allowedSortFields is provided
      if (allowedSortFields.length > 0 && paginationParams.sortBy) {
        if (!allowedSortFields.includes(paginationParams.sortBy)) {
          paginationParams.sortBy = undefined; // Will fall back to default
        }
      }

      // Parse filters if allowed
      const filters: Record<string, any> = {};
      if (allowedFilters.length > 0) {
        for (const filterKey of allowedFilters) {
          if (req.query[filterKey] !== undefined) {
            filters[filterKey] = req.query[filterKey];
          }
        }
      }

      // Handle both pagination strategies
      let page: number | undefined;
      let offset: number | undefined;

      // If offset is provided, use offset-based pagination
      if (paginationParams.offset !== undefined) {
        offset = paginationParams.offset;
        // Calculate equivalent page for internal use
        page = Math.floor(offset / paginationParams.limit) + 1;
      }
      // Otherwise use page-based pagination
      else {
        page = paginationParams.page || 1;
        offset = (page - 1) * paginationParams.limit;
      }

      // Create QueryOptions object
      const queryOptions: QueryOptions = {
        page,
        limit: paginationParams.limit,
        offset,
        sortBy: paginationParams.sortBy || defaultSortField,
        sortOrder: paginationParams.sortOrder,
        filters,
        ...(paginationParams.search && { search: paginationParams.search }),
        ...(searchFields.length > 0 && { searchFields })
      };

      // Attach to request object
      (req as any).pagination = queryOptions;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors.map(err =>
          `${err.path.join('.')}: ${err.message}`
        ).join(', ');

        next(new AppError(
          `Invalid pagination parameters: ${errorMessage}`,
          HttpStatus.BAD_REQUEST,
          ErrorCodes.VALIDATION_ERROR
        ));
      } else {
        next(error);
      }
    }
  };
};

/**
 * Adds comprehensive pagination metadata to HTTP response headers.
 * 
 * This function enriches the HTTP response with pagination information including
 * traditional page-based headers, offset-based headers, and RFC 5988 compliant
 * Link headers for API navigation. It automatically calculates next/previous
 * offsets and constructs proper URLs for pagination links.
 * 
 * The function adds both standard pagination headers (X-Total-Count, X-Current-Page)
 * and modern offset-based headers (X-Offset, X-Next-Offset) to support different
 * client pagination strategies. Link headers provide direct navigation URLs for
 * first, last, next, and previous pages.
 * 
 * @param {Response} res Express response object to add headers to
 * @param {any} pagination Pagination metadata object containing page, limit, total, totalPages, hasNext, and hasPrev properties
 * 
 * @example
 * // Usage in controller after service call
 * const result = await courseService.getCourses(queryOptions);
 * addPaginationHeaders(res, result.pagination);
 * res.json({ data: result.data, success: true });
 */
export const addPaginationHeaders = (res: Response, pagination: any) => {
  const offset = (pagination.page - 1) * pagination.limit;
  const nextOffset = pagination.hasNext ? offset + pagination.limit : null;
  const prevOffset = pagination.hasPrev ? Math.max(0, offset - pagination.limit) : null;

  // Parse current URL to properly handle existing query parameters
  const url = new URL(res.req.originalUrl, `http://${res.req.headers.host || 'localhost'}`);

  // Create URL builder helper function
  const buildUrl = (newOffset: number | null) => {
    const newUrl = new URL(url.toString());
    if (newOffset !== null) {
      newUrl.searchParams.set('offset', newOffset.toString());
      newUrl.searchParams.set('limit', pagination.limit.toString());
    }
    return newUrl.pathname + newUrl.search;
  };

  res.set({
    // Standard pagination headers
    'X-Total-Count': pagination.total.toString(),
    'X-Total-Pages': pagination.totalPages.toString(),
    'X-Current-Page': pagination.page.toString(),
    'X-Has-Next': pagination.hasNext.toString(),
    'X-Has-Prev': pagination.hasPrev.toString(),
    'X-Limit': pagination.limit.toString(),

    // Offset-based pagination headers
    'X-Offset': offset.toString(),
    'X-Next-Offset': nextOffset !== null ? nextOffset.toString() : '',
    'X-Prev-Offset': prevOffset !== null ? prevOffset.toString() : '',

    // Link header for pagination navigation (RFC 5988)
    'Link': [
      pagination.hasNext ? `<${buildUrl(nextOffset)}>; rel="next"` : '',
      pagination.hasPrev ? `<${buildUrl(prevOffset)}>; rel="prev"` : '',
      `<${buildUrl(0)}>; rel="first"`,
      `<${buildUrl((pagination.totalPages - 1) * pagination.limit)}>; rel="last"`
    ].filter(Boolean).join(', ')
  });
};

/**
 * Creates standardized pagination metadata object from basic parameters.
 * 
 * This utility function calculates all pagination-related metadata including
 * total pages, navigation flags, and offset values from the basic page, limit,
 * and total count parameters. It provides a consistent pagination metadata
 * structure used throughout the application.
 * 
 * @param {number} page Current page number (1-based)
 * @param {number} limit Number of items per page
 * @param {number} total Total number of items in the dataset
 * @returns {Object} Pagination metadata object
 * @returns {number} returns.page Current page number
 * @returns {number} returns.limit Items per page
 * @returns {number} returns.total Total number of items
 * @returns {number} returns.totalPages Total number of pages
 * @returns {boolean} returns.hasNext Whether there is a next page
 * @returns {boolean} returns.hasPrev Whether there is a previous page
 * @returns {number} returns.offset Zero-based offset for current page
 * 
 * @example
 * // Creating pagination metadata in service layer
 * const total = await prisma.course.count(whereClause);
 * const paginationMeta = createPaginationMeta(page, limit, total);
 * return { data: courses, pagination: paginationMeta };
 */
export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    offset: (page - 1) * limit,
  };
};

/**
 * Converts page-based pagination parameters to Prisma skip/take format.
 * 
 * This utility function transforms page and limit values into the skip/take
 * parameters required by Prisma ORM for database queries. It handles the
 * conversion from 1-based page numbers to 0-based skip offsets.
 * 
 * @param {number} page Current page number (1-based)
 * @param {number} limit Number of items per page
 * @returns {Object} Prisma pagination parameters
 * @returns {number} returns.skip Number of items to skip (0-based offset)
 * @returns {number} returns.take Number of items to retrieve
 * 
 * @example
 * // Using in Prisma query
 * const { skip, take } = getPaginationParams(page, limit);
 * const courses = await prisma.course.findMany({
 *   skip,
 *   take,
 *   where: whereClause,
 *   orderBy: sortParams
 * });
 */
export const getPaginationParams = (page: number, limit: number) => {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
};

/**
 * Builds Prisma-compatible sort parameters from field name and order.
 * 
 * This utility function creates the orderBy object structure required by Prisma
 * ORM for sorting database queries. It provides a fallback to 'createdAt' field
 * when no sort field is specified and handles the conversion to Prisma's expected
 * object format.
 * 
 * @param {string} [sortBy] Field name to sort by
 * @param {'asc' | 'desc'} [sortOrder='desc'] Sort direction
 * @returns {Object} Prisma orderBy object
 * 
 * @example
 * // Basic usage with custom field
 * const orderBy = getSortParams('name', 'asc');
 * // Returns: { name: 'asc' }
 * 
 * @example
 * // Fallback to default when no field specified
 * const orderBy = getSortParams();
 * // Returns: { createdAt: 'desc' }
 */
export const getSortParams = (sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') => {
  if (!sortBy) {
    return { createdAt: sortOrder };
  }

  return { [sortBy]: sortOrder };
};

/**
 * Builds Prisma text search filter for multiple fields with case-insensitive matching.
 * 
 * This utility creates a Prisma where clause that searches for the given text
 * across multiple specified fields using case-insensitive contains matching.
 * It generates an OR condition that matches any of the specified fields,
 * enabling flexible full-text search capabilities.
 * 
 * @param {string} search Search term to look for
 * @param {string[]} fields Array of field names to search within
 * @returns {Object} Prisma where clause object with OR conditions
 * 
 * @example
 * // Search across course name and description
 * const searchFilter = buildTextSearchFilter('javascript', ['name', 'description']);
 * // Returns: {
 * //   OR: [
 * //     { name: { contains: 'javascript', mode: 'insensitive' } },
 * //     { description: { contains: 'javascript', mode: 'insensitive' } }
 * //   ]
 * // }
 * 
 * @example
 * // Empty search or no fields returns empty object
 * const emptyFilter = buildTextSearchFilter('', ['name']);
 * // Returns: {}
 */
export const buildTextSearchFilter = (search: string, fields: string[]) => {
  if (!search || fields.length === 0) return {};

  return {
    OR: fields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as const,
      },
    })),
  };
};

/**
 * Builds Prisma range filter for numeric or date fields with min/max bounds.
 * 
 * This utility creates a Prisma where clause for range-based filtering using
 * greater-than-or-equal (gte) and less-than-or-equal (lte) operators. It's
 * commonly used for date ranges, price ranges, or any numeric field filtering.
 * 
 * @param {string} field Database field name to apply the range filter to
 * @param {string | number} [min] Minimum value for the range (inclusive)
 * @param {string | number} [max] Maximum value for the range (inclusive)
 * @returns {Object} Prisma where clause object with range conditions
 * 
 * @example
 * // Date range filter
 * const dateFilter = buildRangeFilter('createdAt', '2024-01-01', '2024-12-31');
 * // Returns: { createdAt: { gte: '2024-01-01', lte: '2024-12-31' } }
 * 
 * @example
 * // Price range with only minimum
 * const priceFilter = buildRangeFilter('price', 100);
 * // Returns: { price: { gte: 100 } }
 * 
 * @example
 * // No bounds returns empty object
 * const emptyFilter = buildRangeFilter('price');
 * // Returns: {}
 */
export const buildRangeFilter = (
  field: string,
  min?: string | number,
  max?: string | number
) => {
  const filter: any = {};

  if (min !== undefined) {
    filter.gte = min;
  }

  if (max !== undefined) {
    filter.lte = max;
  }

  return Object.keys(filter).length > 0 ? { [field]: filter } : {};
};

/**
 * Builds Prisma enum filter for matching against specific values.
 * 
 * This utility creates a Prisma where clause for filtering by specific enum
 * values or a list of allowed values. It handles both single values and arrays
 * of values, using Prisma's 'in' operator for multiple values.
 * 
 * @param {string} field Database field name to apply the enum filter to
 * @param {string | string[]} values Single value or array of values to match
 * @returns {Object} Prisma where clause object with 'in' condition
 * 
 * @example
 * // Single language filter
 * const langFilter = buildEnumFilter('sourceLanguage', 'en');
 * // Returns: { sourceLanguage: { in: ['en'] } }
 * 
 * @example
 * // Multiple language filter
 * const multiLangFilter = buildEnumFilter('sourceLanguage', ['en', 'es', 'fr']);
 * // Returns: { sourceLanguage: { in: ['en', 'es', 'fr'] } }
 * 
 * @example
 * // Empty values returns empty object
 * const emptyFilter = buildEnumFilter('status', '');
 * // Returns: {}
 */
export const buildEnumFilter = (field: string, values: string | string[]) => {
  if (!values) return {};

  const valueArray = Array.isArray(values) ? values : [values];

  return {
    [field]: {
      in: valueArray,
    },
  };
};

/**
 * Builds Prisma cursor-based pagination parameters for high-performance pagination.
 * 
 * This utility creates cursor-based pagination parameters for Prisma queries,
 * which is more efficient than offset-based pagination for large datasets.
 * It takes one extra item to determine if there's a next page and uses the
 * cursor to position the query correctly.
 * 
 * Note: This is prepared for future implementation of cursor-based pagination
 * as an alternative to the current offset/page-based approaches.
 * 
 * @param {string} [cursor] Cursor value (typically an ID) to start pagination from
 * @param {number} [limit=20] Number of items to retrieve
 * @param {string} [sortField='createdAt'] Field to sort by for consistent ordering
 * @returns {Object} Prisma query parameters for cursor-based pagination
 * @returns {number} returns.take Number of items to take (limit + 1)
 * @returns {Object} returns.orderBy Sort configuration
 * @returns {Object} [returns.cursor] Cursor position (when cursor provided)
 * @returns {number} [returns.skip] Skip cursor item (when cursor provided)
 * 
 * @example
 * // First page (no cursor)
 * const params = buildCursorPagination();
 * // Returns: { take: 21, orderBy: { createdAt: 'desc' } }
 * 
 * @example
 * // Subsequent page with cursor
 * const params = buildCursorPagination('clx123abc', 10, 'updatedAt');
 * // Returns: {
 * //   take: 11,
 * //   orderBy: { updatedAt: 'desc' },
 * //   cursor: { id: 'clx123abc' },
 * //   skip: 1
 * // }
 */
export const buildCursorPagination = (
  cursor?: string,
  limit: number = 20,
  sortField: string = 'createdAt'
) => {
  const params: any = {
    take: limit + 1, // Take one extra to check if there's a next page
    orderBy: { [sortField]: 'desc' },
  };

  if (cursor) {
    params.cursor = { id: cursor };
    params.skip = 1; // Skip the cursor item
  }

  return params;
};

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      pagination?: QueryOptions;
    }
  }
}