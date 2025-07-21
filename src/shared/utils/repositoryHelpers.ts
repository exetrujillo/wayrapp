/**
 * Repository Helper Utilities
 * Standardized utilities for pagination, filtering, and sorting across repositories
 */

import { QueryOptions, PaginatedResult } from '../types';

/**
 * Standard pagination parameters for Prisma queries
 */
export interface PrismaQueryParams {
  skip: number;
  take: number;
  where?: any;
  orderBy?: any;
  include?: any;
}

/**
 * Build standardized Prisma query parameters from QueryOptions
 * Supports both page-based and offset-based pagination strategies
 */
export const buildPrismaQueryParams = (
  options: QueryOptions,
  allowedSortFields: string[] = [],
  defaultSortField: string = 'createdAt',
  fieldMapping: Record<string, string> = {}
): Omit<PrismaQueryParams, 'include'> => {
  const {
    page = 1,
    limit = 20,
    offset,
    sortBy = defaultSortField,
    sortOrder = 'desc'
  } = options;

  // Calculate pagination - prefer offset if provided, otherwise calculate from page
  const skip = offset !== undefined ? offset : (page - 1) * limit;
  const take = limit;

  // Validate and map sort field
  const validSortBy = allowedSortFields.length > 0 && allowedSortFields.includes(sortBy) 
    ? sortBy 
    : defaultSortField;
  
  const dbSortField = fieldMapping[validSortBy] || validSortBy;

  return {
    skip,
    take,
    orderBy: { [dbSortField]: sortOrder }
  };
};

/**
 * Build text search filter for multiple fields
 * Enhanced with support for multiple search terms and exact matching
 */
export const buildTextSearchWhere = (
  search: string | undefined,
  searchFields: string[]
): any => {
  if (!search || searchFields.length === 0) return {};

  // Check if it's an exact match search (enclosed in quotes)
  const exactMatch = /^"(.+)"$/.exec(search);
  if (exactMatch) {
    const exactTerm = exactMatch[1];
    return {
      OR: searchFields.map(field => ({
        [field]: {
          equals: exactTerm,
          mode: 'insensitive' as const,
        },
      })),
    };
  }

  // Check if it's a multi-term search (space-separated terms)
  const terms = search.split(/\s+/).filter(Boolean);
  if (terms.length > 1) {
    // Create AND condition for multiple terms
    return {
      AND: terms.map(term => ({
        OR: searchFields.map(field => ({
          [field]: {
            contains: term,
            mode: 'insensitive' as const,
          },
        })),
      })),
    };
  }

  // Standard single term search
  return {
    OR: searchFields.map(field => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as const,
      },
    })),
  };
};

/**
 * Build enum filter
 */
export const buildEnumFilterWhere = (
  value: string | string[] | undefined,
  field: string
): any => {
  if (!value) return {};

  const values = Array.isArray(value) ? value : [value];
  return {
    [field]: {
      in: values,
    },
  };
};

/**
 * Build boolean filter
 */
export const buildBooleanFilterWhere = (
  value: boolean | string | undefined,
  field: string
): any => {
  if (value === undefined) return {};

  const boolValue = typeof value === 'string' 
    ? value === 'true' 
    : value;

  return {
    [field]: boolValue,
  };
};

/**
 * Build range filter for dates or numbers
 */
export const buildRangeFilterWhere = (
  min: string | number | Date | undefined,
  max: string | number | Date | undefined,
  field: string
): any => {
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
 * Combine multiple where conditions
 */
export const combineWhereConditions = (...conditions: any[]): any => {
  const validConditions = conditions.filter(condition => 
    condition && Object.keys(condition).length > 0
  );

  if (validConditions.length === 0) return {};
  if (validConditions.length === 1) return validConditions[0];

  return {
    AND: validConditions,
  };
};

/**
 * Create standardized pagination metadata
 */
export const createPaginationResult = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

/**
 * Standard field mappings for common API fields to database fields
 */
export const COMMON_FIELD_MAPPINGS = {
  'created_at': 'createdAt',
  'updated_at': 'updatedAt',
  'source_language': 'sourceLanguage',
  'target_language': 'targetLanguage',
  'is_public': 'isPublic',
  'course_id': 'courseId',
  'level_id': 'levelId',
  'section_id': 'sectionId',
  'module_id': 'moduleId',
  'lesson_id': 'lessonId',
  'exercise_id': 'exerciseId',
  'user_id': 'userId',
  'module_type': 'moduleType',
  'exercise_type': 'exerciseType',
  'experience_points': 'experiencePoints',
  'last_completed_lesson_id': 'lastCompletedLessonId',
  'last_activity_date': 'lastActivityDate',
  'lives_current': 'livesCurrent',
  'streak_current': 'streakCurrent',
  'password_hash': 'passwordHash',
  'country_code': 'countryCode',
  'registration_date': 'registrationDate',
  'last_login_date': 'lastLoginDate',
  'profile_picture_url': 'profilePictureUrl',
  'is_active': 'isActive',
};

/**
 * Standard sort fields for different entity types
 */
export const SORT_FIELDS = {
  COURSE: ['created_at', 'updated_at', 'name', 'source_language', 'target_language'],
  LEVEL: ['order', 'created_at', 'updated_at', 'name', 'code'],
  SECTION: ['order', 'created_at', 'updated_at', 'name'],
  MODULE: ['order', 'created_at', 'updated_at', 'name', 'module_type'],
  LESSON: ['order', 'created_at', 'updated_at', 'experience_points'],
  EXERCISE: ['created_at', 'updated_at', 'exercise_type'],
  USER: ['created_at', 'updated_at', 'email', 'username', 'role', 'registration_date'],
  PROGRESS: ['last_activity_date', 'experience_points', 'streak_current'],
};

/**
 * Helper to validate and sanitize limit parameter
 */
export const sanitizeLimit = (limit: number | undefined, maxLimit: number = 100): number => {
  if (!limit) return 20;
  return Math.min(Math.max(1, limit), maxLimit);
};

/**
 * Helper to validate and sanitize page parameter
 */
export const sanitizePage = (page: number | undefined): number => {
  if (!page) return 1;
  return Math.max(1, page);
};

/**
 * Build optimized include for child counts
 */
export const buildChildCountInclude = (childRelations: string[]): any => {
  const include: any = {
    _count: {
      select: {}
    }
  };

  childRelations.forEach(relation => {
    include._count.select[relation] = true;
  });

  return include;
};

/**
 * Map child counts to API response format
 */
export const mapChildCounts = (
  entity: any,
  countMappings: Record<string, string>
): any => {
  const result = { ...entity };
  
  if (entity._count) {
    Object.entries(countMappings).forEach(([dbField, apiField]) => {
      if (entity._count[dbField] !== undefined) {
        result[apiField] = entity._count[dbField];
      }
    });
    
    // Remove the _count object from the result
    delete result._count;
  }

  return result;
};