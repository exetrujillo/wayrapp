import { z } from 'zod';
import {
  UsernameSchema,
  CountryCodeSchema,
  UrlSchema,
  RoleSchema,
  BooleanStringSchema,
} from './common';

/**
 * User validation schemas
 */

// User profile update schema
export const UserProfileUpdateSchema = z.object({
  username: UsernameSchema.optional(),
  country_code: CountryCodeSchema.optional(),
  profile_picture_url: UrlSchema.optional(),
});

// User role update schema (admin only)
export const UserRoleUpdateSchema = z.object({
  role: RoleSchema,
});

// User query parameters for listing users
export const UserQuerySchema = z.object({
  // Include base pagination fields
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  // Add user-specific fields
  role: z.enum(['student', 'content_creator', 'admin']).optional(),
  is_active: BooleanStringSchema,
  search: z.string().optional(),
}).refine(
  (data) => {
    return data.page >= 1 && data.limit >= 1 && data.limit <= 100;
  },
  {
    message: 'Page must be >= 1 and limit must be between 1 and 100',
  }
);

// Export types
export type UserProfileUpdateRequest = z.infer<typeof UserProfileUpdateSchema>;
export type UserRoleUpdateRequest = z.infer<typeof UserRoleUpdateSchema>;
export type UserQueryParams = z.infer<typeof UserQuerySchema>;