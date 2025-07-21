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

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
  allowedSortFields?: string[];
  allowedFilters?: string[];
  defaultSortField?: string;
  searchFields?: string[];
}

/**
 * Pagination middleware that validates and normalizes pagination parameters
 * Supports both page-based and offset-based pagination strategies
 * Adds parsed pagination options to req.pagination
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
        limit: z.coerce.number().int().min(1).max(maxLimit).default(defaultLimit),
        sortBy: allowedSortFields.length > 0 
          ? z.enum(allowedSortFields as [string, ...string[]]).optional()
          : z.string().optional(),
      });

      // Parse and validate pagination parameters
      const paginationParams = schema.parse(req.query);

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
 * Helper function to add pagination headers to response
 * Includes both page-based and offset-based pagination information
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
 * Helper function to create pagination metadata
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
 * Helper function to build database skip/take parameters
 */
export const getPaginationParams = (page: number, limit: number) => {
  return {
    skip: (page - 1) * limit,
    take: limit,
  };
};

/**
 * Helper function to build sort parameters for Prisma
 */
export const getSortParams = (sortBy?: string, sortOrder: 'asc' | 'desc' = 'desc') => {
  if (!sortBy) {
    return { createdAt: sortOrder };
  }
  
  return { [sortBy]: sortOrder };
};

/**
 * Advanced filtering helper for text search
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
 * Helper to build range filters (for dates, numbers)
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
 * Helper to build enum filters
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
 * Cursor-based pagination helper (for future implementation)
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