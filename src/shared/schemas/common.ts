import { z } from 'zod';

/**
 * Common validation schemas used across the application
 */

// Pagination schema for query parameters
export const BasePaginationSchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
});

export const PaginationSchema = BasePaginationSchema.refine((data) => {
  return data.page >= 1 && data.limit >= 1 && data.limit <= 100;
}, {
  message: 'Page must be >= 1 and limit must be between 1 and 100'
});

// ID parameter schema
export const IdParamSchema = z.object({
  id: z.string().min(1, 'ID is required')
});

// UUID parameter schema
export const UuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format')
});

// Language code validation (ISO 639-1)
export const LanguageCodeSchema = z.string().length(2, 'Language code must be 2 characters').regex(/^[a-z]{2}$/, 'Language code must be lowercase letters');

// Country code validation (ISO 3166-1 alpha-2)
export const CountryCodeSchema = z.string().length(2, 'Country code must be 2 characters').regex(/^[A-Z]{2}$/, 'Country code must be uppercase letters');

// Email validation
export const EmailSchema = z.string().email('Invalid email format').max(255, 'Email too long');

// Username validation
export const UsernameSchema = z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

// URL validation
export const UrlSchema = z.string().url('Invalid URL format').max(255, 'URL too long');

// Experience points validation
export const ExperiencePointsSchema = z.number().int().min(0, 'Experience points must be non-negative');

// Order validation (for hierarchical content)
export const OrderSchema = z.number().int().positive('Order must be a positive integer');

// Score validation (0-100)
export const ScoreSchema = z.number().int().min(0, 'Score must be at least 0').max(100, 'Score cannot exceed 100');

// Time validation (seconds)
export const TimeSecondsSchema = z.number().int().min(0, 'Time must be non-negative');

// Boolean string validation (for query parameters)
export const BooleanStringSchema = z.string().optional().transform((val) => {
  if (val === undefined) return undefined;
  return val === 'true' || val === '1';
});

// Role validation
export const RoleSchema = z.enum(['student', 'content_creator', 'admin']);

// Module type validation
export const ModuleTypeSchema = z.enum(['informative', 'basic_lesson', 'reading', 'dialogue', 'exam']);

// Exercise type validation
export const ExerciseTypeSchema = z.enum(['translation', 'fill_in_the_blank', 'vof', 'pairs', 'informative', 'ordering']);

// Generic text field validation
export const TextFieldSchema = (minLength: number = 1, maxLength: number = 255) => 
  z.string().min(minLength, `Text must be at least ${minLength} characters`).max(maxLength, `Text cannot exceed ${maxLength} characters`);

// Optional text field validation
export const OptionalTextFieldSchema = (maxLength: number = 255) => 
  z.string().max(maxLength, `Text cannot exceed ${maxLength} characters`).optional();

// JSON validation for exercise data
export const JsonSchema = z.record(z.any()).or(z.array(z.any()));

export type PaginationQuery = z.infer<typeof PaginationSchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type UuidParam = z.infer<typeof UuidParamSchema>;