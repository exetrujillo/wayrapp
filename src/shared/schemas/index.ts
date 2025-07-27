// src/shared/schemas/index.ts

/**
 * Centralized schema exports for WayrApp Backend API validation system
 * 
 * This module serves as the central export hub for all validation schemas used throughout
 * the WayrApp language learning platform backend. It provides a unified interface for
 * accessing validation schemas and their corresponding TypeScript types, ensuring
 * consistent imports and reducing coupling between modules while maintaining a clear
 * organizational structure for the validation system.
 * 
 * The centralized export approach offers several architectural benefits including simplified
 * imports that reduce boilerplate code, consistent schema access patterns across the
 * application, clear dependency management that prevents circular imports, and centralized
 * documentation of all available validation schemas and types for developer reference.
 * 
 * The module organizes schemas by functional domain (common utilities, authentication,
 * user management, content management, and progress tracking) while maintaining flat
 * exports that allow for flexible importing patterns. This structure supports both
 * specific schema imports and bulk imports based on development needs and module
 * requirements.
 * 
 * Key organizational principles include domain-based grouping that reflects application
 * architecture, comprehensive type exports that support full TypeScript integration,
 * consistent naming conventions that improve developer experience, and clear separation
 * between schemas and their inferred types for optimal code organization.
 * 
 * The export structure supports various import patterns including individual schema
 * imports for specific validation needs, bulk imports for modules that use multiple
 * schemas, type-only imports for TypeScript type definitions, and mixed imports that
 * combine schemas and types as needed for different use cases.
 * 
 * Security and performance considerations include tree-shaking support through named
 * exports that allow bundlers to eliminate unused code, consistent validation behavior
 * through centralized schema management, and clear dependency tracking that supports
 * security auditing and maintenance operations.
 * 
 * @module index
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Individual schema imports for specific validation needs
 * import { EmailSchema, PasswordSchema } from '@/shared/schemas';
 * import { validate } from '@/shared/middleware/validation';
 * 
 * router.post('/auth/register', 
 *   validate({ 
 *     body: z.object({
 *       email: EmailSchema,
 *       password: PasswordSchema
 *     })
 *   }), 
 *   authController.register
 * );
 * 
 * @example
 * // Bulk imports for modules using multiple schemas
 * import { CourseSchema, LessonSchema, ExerciseSchema } from '@/shared/schemas';
 * 
 * @example
 * // Type-only imports for TypeScript definitions
 * import type { RegisterRequest, LoginRequest, PaginationQuery } from '@/shared/schemas';
 * 
 * @example
 * // Mixed imports for comprehensive validation and typing
 * import { PaginationSchema, UserQuerySchema } from '@/shared/schemas';
 * 
 * @example
 * // Domain-specific imports for focused functionality
 * import { RegisterSchema, LoginSchema, CourseSchema, PaginationSchema } from '@/shared/schemas';
 */

/**
 * Common validation schemas and utilities
 * 
 * Foundational validation schemas that provide reusable components for data validation
 * across all application domains. These schemas implement consistent patterns for
 * common data types, pagination, identification, and application-specific enumerations
 * that are used throughout the platform.
 * 
 * Key exports include pagination schemas for consistent data loading, identification
 * schemas for URL parameters and database keys, text validation utilities for flexible
 * content validation, enumeration schemas for application-specific data types, and
 * comprehensive TypeScript types for compile-time safety.
 * 
 * @example
 * // Pagination and identification
 * import { PaginationSchema, IdParamSchema, UuidParamSchema } from '@/shared/schemas';
 * 
 * @example
 * // Text and content validation
 * import { TextFieldSchema, OptionalTextFieldSchema, JsonSchema } from '@/shared/schemas';
 * 
 * @example
 * // User and application data
 * import { EmailSchema, UsernameSchema, RoleSchema } from '@/shared/schemas';
 * 
 * @example
 * // Educational content types
 * import { ModuleTypeSchema, ExerciseTypeSchema, ExperiencePointsSchema } from '@/shared/schemas';
 */
export {
  PaginationSchema,
  IdParamSchema,
  UuidParamSchema,
  LanguageCodeSchema,
  CountryCodeSchema,
  EmailSchema,
  UsernameSchema,
  UrlSchema,
  ExperiencePointsSchema,
  OrderSchema,
  ScoreSchema,
  TimeSecondsSchema,
  BooleanStringSchema,
  RoleSchema,
  ModuleTypeSchema,
  ExerciseTypeSchema,
  TextFieldSchema,
  OptionalTextFieldSchema,
  JsonSchema,
  type PaginationQuery,
  type IdParam,
  type UuidParam
} from './common';

/**
 * Authentication validation schemas
 * 
 * Comprehensive validation schemas for all authentication-related operations including
 * user registration, login, token management, and password operations. These schemas
 * implement industry-standard security practices and provide the foundation for secure
 * user authentication throughout the platform.
 * 
 * Key features include strong password validation with complexity requirements, email
 * format validation for user identification, token validation for session management,
 * and comprehensive input sanitization to prevent security vulnerabilities.
 * 
 * @example
 * // User registration and authentication
 * import { RegisterSchema, LoginSchema, PasswordSchema } from '@/shared/schemas';
 * 
 * @example
 * // Token management and session handling
 * import { RefreshTokenSchema, PasswordUpdateSchema } from '@/shared/schemas';
 * 
 * @example
 * // Type-safe authentication operations
 * import type { RegisterRequest, LoginRequest } from '@/shared/schemas';
 */
export {
  PasswordSchema,
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  PasswordUpdateSchema,
  type RegisterRequest,
  type LoginRequest,
  type RefreshTokenRequest,
  type PasswordUpdateRequest
} from './auth.schemas';

/**
 * User management validation schemas
 * 
 * Validation schemas for user profile management, role administration, and user
 * discovery operations. These schemas support the platform's user management
 * system by providing secure validation for profile updates, administrative
 * operations, and user query functionality.
 * 
 * Key capabilities include profile update validation for user-controlled data,
 * role management schemas for administrative operations, and query parameter
 * validation for user discovery and listing functionality with proper pagination
 * and filtering support.
 * 
 * @example
 * // User profile management
 * import { UserProfileUpdateSchema, UserQuerySchema } from '@/shared/schemas';
 * 
 * @example
 * // Administrative user operations
 * import { UserRoleUpdateSchema } from '@/shared/schemas';
 * 
 * @example
 * // Type-safe user operations
 * import type { UserProfileUpdateRequest, UserQueryParams } from '@/shared/schemas';
 */
export {
  UserProfileUpdateSchema,
  UserRoleUpdateSchema,
  UserQuerySchema,
  type UserProfileUpdateRequest,
  type UserRoleUpdateRequest,
  type UserQueryParams
} from './user.schemas';

/**
 * Educational content validation schemas
 * 
 * Comprehensive validation schemas for the hierarchical educational content system
 * including courses, levels, sections, modules, lessons, and exercises. These schemas
 * model the complete structure of language learning content while enforcing
 * educational constraints, multi-language support, and proper content organization.
 * 
 * The content hierarchy flows from courses (top-level language pairs) through levels
 * (proficiency stages), sections (thematic units), modules (learning activities),
 * lessons (individual units), to exercises (interactive activities). Each level
 * includes appropriate validation for its role in the educational structure.
 * 
 * Key features include hierarchical content modeling, multi-language course support,
 * flexible exercise systems with JSON-based data structures, content organization
 * with proper sequencing, and comprehensive query support for content discovery
 * and management operations.
 * 
 * @example
 * // Course and level management
 * import { CourseSchema, LevelSchema, SectionSchema } from '@/shared/schemas';
 * 
 * @example
 * // Learning content creation
 * import { ModuleSchema, LessonSchema, ExerciseSchema } from '@/shared/schemas';
 * 
 * @example
 * // Content organization and management
 * import { LessonExerciseSchema, ExerciseReorderSchema, ContentQuerySchema } from '@/shared/schemas';
 * 
 * @example
 * // Type-safe content operations
 * import type { 
 *   CourseRequest, 
 *   LessonRequest, 
 *   ExerciseRequest,
 *   ContentQueryParams 
 * } from '@/shared/schemas';
 */
export {
  CourseSchema,
  LevelSchema,
  SectionSchema,
  ModuleSchema,
  LessonSchema,
  ExerciseSchema,
  LessonExerciseSchema,
  ExerciseReorderSchema,
  ContentQuerySchema,
  type CourseRequest,
  type LevelRequest,
  type SectionRequest,
  type ModuleRequest,
  type LessonRequest,
  type ExerciseRequest,
  type LessonExerciseRequest,
  type ExerciseReorderRequest,
  type ContentQueryParams
} from './content.schemas';

/**
 * Learning progress validation schemas
 * 
 * Validation schemas for tracking and managing learner progress throughout the
 * educational journey. These schemas support progress tracking, offline synchronization,
 * and analytics by providing robust validation for lesson completions, experience
 * tracking, and progress query operations.
 * 
 * Key capabilities include lesson completion tracking with scoring and timing data,
 * offline progress synchronization for mobile and disconnected learning scenarios,
 * and comprehensive progress querying for analytics and reporting functionality.
 * 
 * The progress system integrates with the gamification features through experience
 * point tracking and supports both real-time progress updates and batch synchronization
 * for various client applications and learning contexts.
 * 
 * @example
 * // Progress tracking and completion
 * import { LessonCompletionSchema, ProgressSyncSchema } from '@/shared/schemas';
 * 
 * @example
 * // Progress analytics and querying
 * import { ProgressQuerySchema } from '@/shared/schemas';
 * 
 * @example
 * // Type-safe progress operations
 * import type { 
 *   LessonCompletionRequest, 
 *   ProgressSyncRequest,
 *   ProgressQueryParams 
 * } from '@/shared/schemas';
 */
export {
  LessonCompletionSchema,
  ProgressSyncSchema,
  ProgressQuerySchema,
  type LessonCompletionRequest,
  type ProgressSyncRequest,
  type ProgressQueryParams
} from './progress.schemas';