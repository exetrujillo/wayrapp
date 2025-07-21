/**
 * Advanced filtering utilities for repository queries
 * Provides standardized filter builders for common query patterns
 */

/**
 * Build a date range filter for Prisma queries
 * @param field The database field to filter on
 * @param startDate Optional start date (inclusive)
 * @param endDate Optional end date (inclusive)
 * @returns Prisma filter object
 */
export const dateRangeFilter = (
  field: string,
  startDate?: string | Date,
  endDate?: string | Date
): any => {
  const filter: any = {};

  if (startDate) {
    filter.gte = new Date(startDate);
  }

  if (endDate) {
    // Set end date to end of day if only date is provided
    const endDateTime = new Date(endDate);
    if (endDateTime.getHours() === 0 && 
        endDateTime.getMinutes() === 0 && 
        endDateTime.getSeconds() === 0) {
      endDateTime.setHours(23, 59, 59, 999);
    }
    filter.lte = endDateTime;
  }

  return Object.keys(filter).length > 0 ? { [field]: filter } : {};
};

/**
 * Build a numeric range filter for Prisma queries
 * @param field The database field to filter on
 * @param min Optional minimum value (inclusive)
 * @param max Optional maximum value (inclusive)
 * @returns Prisma filter object
 */
export const numericRangeFilter = (
  field: string,
  min?: number | string,
  max?: number | string
): any => {
  const filter: any = {};

  if (min !== undefined) {
    filter.gte = typeof min === 'string' ? parseFloat(min) : min;
  }

  if (max !== undefined) {
    filter.lte = typeof max === 'string' ? parseFloat(max) : max;
  }

  return Object.keys(filter).length > 0 ? { [field]: filter } : {};
};

/**
 * Build a multi-value filter for Prisma queries (IN operator)
 * @param field The database field to filter on
 * @param values Array of values or comma-separated string of values
 * @returns Prisma filter object
 */
export const multiValueFilter = (
  field: string,
  values?: string | string[]
): any => {
  if (!values) return {};

  const valueArray = Array.isArray(values) 
    ? values 
    : values.split(',').map(v => v.trim()).filter(Boolean);

  if (valueArray.length === 0) return {};

  return {
    [field]: {
      in: valueArray,
    },
  };
};

/**
 * Build a boolean filter for Prisma queries
 * @param field The database field to filter on
 * @param value Boolean value or string representation ('true'/'false')
 * @returns Prisma filter object
 */
export const booleanFilter = (
  field: string,
  value?: boolean | string
): any => {
  if (value === undefined) return {};

  const boolValue = typeof value === 'string' 
    ? value.toLowerCase() === 'true' 
    : !!value;

  return { [field]: boolValue };
};

/**
 * Build a full-text search filter for Prisma queries
 * @param searchTerm The search term to look for
 * @param fields Array of fields to search in
 * @param exactMatch Whether to match the exact phrase or individual terms
 * @returns Prisma filter object
 */
export const fullTextSearchFilter = (
  searchTerm?: string,
  fields: string[] = [],
  exactMatch: boolean = false
): any => {
  if (!searchTerm || fields.length === 0) return {};

  // For exact phrase matching
  if (exactMatch) {
    return {
      OR: fields.map(field => ({
        [field]: {
          contains: searchTerm,
          mode: 'insensitive' as const,
        },
      })),
    };
  }

  // For multi-term search (AND condition between terms)
  const terms = searchTerm.split(/\s+/).filter(Boolean);
  if (terms.length > 1) {
    return {
      AND: terms.map(term => ({
        OR: fields.map(field => ({
          [field]: {
            contains: term,
            mode: 'insensitive' as const,
          },
        })),
      })),
    };
  }

  // Single term search
  return {
    OR: fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const,
      },
    })),
  };
};

/**
 * Build a nested relation filter for Prisma queries
 * @param relationPath Path to the relation (e.g., 'author')
 * @param field Field in the relation to filter on (e.g., 'name')
 * @param value Value to filter by
 * @returns Prisma filter object
 */
export const relationFilter = (
  relationPath: string,
  field: string,
  value: any
): any => {
  if (value === undefined) return {};

  return {
    [relationPath]: {
      [field]: value,
    },
  };
};

/**
 * Combine multiple filters with AND logic
 * @param filters Array of filter objects to combine
 * @returns Combined filter object
 */
export const combineFilters = (...filters: any[]): any => {
  const validFilters = filters.filter(f => 
    f && typeof f === 'object' && Object.keys(f).length > 0
  );

  if (validFilters.length === 0) return {};
  if (validFilters.length === 1) return validFilters[0];

  return { AND: validFilters };
};

/**
 * Parse and apply filters from query parameters
 * @param queryFilters Object containing filter parameters from request
 * @param filterConfig Configuration mapping query params to filter functions
 * @returns Combined filter object
 */
export const parseQueryFilters = (
  queryFilters: Record<string, any> = {},
  filterConfig: Record<string, (value: any) => any>
): any => {
  const appliedFilters = Object.entries(filterConfig)
    .map(([key, filterFn]) => {
      const value = queryFilters[key];
      if (value !== undefined) {
        return filterFn(value);
      }
      return {};
    });

  return combineFilters(...appliedFilters);
};