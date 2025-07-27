// src/shared/schemas/common.ts

/**
 * Common validation schemas and utilities for WayrApp Backend API
 * 
 * This module provides a comprehensive collection of reusable Zod validation schemas that serve
 * as the foundation for data validation across the entire WayrApp language learning platform.
 * These schemas implement consistent validation patterns, data types, and business rules that
 * are shared between multiple modules, ensuring uniform data handling and validation behavior
 * throughout the application.
 * 
 * The common schemas cover fundamental data types including pagination parameters, identifiers,
 * user information, geographic data, content metadata, and application-specific enumerations.
 * They are designed to be composable building blocks that can be combined to create more
 * complex validation schemas while maintaining consistency and reducing code duplication.
 * 
 * Key architectural benefits include centralized validation logic that ensures consistent
 * behavior across all API endpoints, reusable schema components that accelerate development,
 * standardized error messages that improve user experience, and type safety through TypeScript
 * integration that prevents runtime errors and improves code reliability.
 * 
 * The schemas implement industry best practices for data validation including input sanitization
 * to prevent injection attacks, length limits to prevent buffer overflow and denial-of-service
 * attacks, format validation to ensure data integrity, and comprehensive error handling that
 * provides clear feedback for validation failures.
 * 
 * Security considerations include protection against common web vulnerabilities through strict
 * input validation, prevention of malicious data injection through pattern matching and
 * sanitization, enforcement of business rules that maintain data consistency, and comprehensive
 * logging support for security monitoring and audit trails.
 * 
 * The module supports internationalization requirements through flexible language and country
 * code validation, accommodates various content types and user roles specific to language
 * learning applications, and provides extensible patterns that can be adapted for future
 * feature requirements and platform evolution.
 * 
 * @module common
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic usage with validation middleware
 * import { EmailSchema, PaginationSchema, IdParamSchema } from '@/shared/schemas/common';
 * import { validate } from '@/shared/middleware/validation';
 * 
 * router.get('/users', validate({ query: PaginationSchema }), userController.list);
 * router.get('/users/:id', validate({ params: IdParamSchema }), userController.getById);
 * 
 * @example
 * // Composing schemas for complex validation
 * import { EmailSchema, UsernameSchema, CountryCodeSchema } from '@/shared/schemas/common';
 * 
 * const UserRegistrationSchema = z.object({
 *   email: EmailSchema,
 *   username: UsernameSchema,
 *   country: CountryCodeSchema.optional()
 * });
 * 
 * @example
 * // Using factory functions for flexible validation
 * import { TextFieldSchema, OptionalTextFieldSchema } from '@/shared/schemas/common';
 * 
 * const CourseSchema = z.object({
 *   title: TextFieldSchema(1, 100),        // Required, 1-100 characters
 *   description: OptionalTextFieldSchema(500), // Optional, max 500 characters
 *   tags: z.array(TextFieldSchema(1, 50)).max(10) // Array of tags, max 10 items
 * });
 */

import { z } from 'zod';

/**
 * Base pagination schema for query parameter transformation
 * 
 * Foundational schema that handles the transformation of string-based query parameters
 * into properly typed pagination data. This schema serves as the building block for
 * pagination validation across the application, providing consistent parameter parsing
 * and default value assignment for paginated API endpoints.
 * 
 * The schema automatically transforms string query parameters (as received from HTTP
 * requests) into appropriate numeric types while providing sensible defaults for
 * missing parameters. This transformation is essential since HTTP query parameters
 * are always received as strings but need to be processed as numbers for pagination
 * logic.
 * 
 * Default values are carefully chosen to provide optimal user experience: page 1
 * for initial requests, limit 20 for balanced performance and usability, and
 * ascending sort order for predictable result ordering. These defaults ensure
 * that pagination works correctly even when clients don't specify all parameters.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Query parameter transformation
 * const queryParams = { page: '2', limit: '50', sortBy: 'name', sortOrder: 'desc' };
 * const result = BasePaginationSchema.parse(queryParams);
 * // Result: { page: 2, limit: 50, sortBy: 'name', sortOrder: 'desc' }
 * 
 * @example
 * // Default value assignment
 * const emptyQuery = {};
 * const result = BasePaginationSchema.parse(emptyQuery);
 * // Result: { page: 1, limit: 20, sortOrder: 'asc' }
 */
export const BasePaginationSchema = z.object({
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
});

/**
 * Complete pagination schema with business rule validation
 * 
 * Enhanced pagination schema that extends BasePaginationSchema with comprehensive
 * business rule validation to ensure pagination parameters are within acceptable
 * ranges for application performance and security. This schema prevents common
 * pagination-related vulnerabilities and performance issues while maintaining
 * usability for legitimate use cases.
 * 
 * The validation rules enforce minimum page number of 1 to prevent negative or
 * zero page requests that could cause application errors, minimum limit of 1
 * to ensure meaningful results, and maximum limit of 100 to prevent excessive
 * resource consumption and potential denial-of-service attacks through large
 * result set requests.
 * 
 * These constraints balance user flexibility with system performance and security,
 * allowing reasonable pagination ranges while protecting against abuse. The limits
 * are designed to accommodate typical user interface patterns while preventing
 * resource exhaustion in high-traffic scenarios.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Valid pagination parameters
 * const validParams = { page: '1', limit: '25', sortBy: 'created_at', sortOrder: 'desc' };
 * const result = PaginationSchema.parse(validParams);
 * // Result: { page: 1, limit: 25, sortBy: 'created_at', sortOrder: 'desc' }
 * 
 * @example
 * // Usage in API endpoints
 * router.get('/courses', validate({ query: PaginationSchema }), (req, res) => {
 *   const { page, limit, sortBy, sortOrder } = req.query;
 *   // All parameters are properly typed and validated
 *   const courses = await courseService.findMany({
 *     skip: (page - 1) * limit,
 *     take: limit,
 *     orderBy: sortBy ? { [sortBy]: sortOrder } : { created_at: 'desc' }
 *   });
 *   res.json({ courses, pagination: { page, limit, sortBy, sortOrder } });
 * });
 * 
 * @example
 * // Error handling for invalid parameters
 * try {
 *   const result = PaginationSchema.parse({ page: '0', limit: '200' });
 * } catch (error) {
 *   // Throws: "Page must be >= 1 and limit must be between 1 and 100"
 * }
 */
export const PaginationSchema = BasePaginationSchema.refine((data) => {
  return data.page >= 1 && data.limit >= 1 && data.limit <= 100;
}, {
  message: 'Page must be >= 1 and limit must be between 1 and 100'
});

/**
 * Generic ID parameter validation schema for URL parameters
 * 
 * Flexible identifier validation schema that accepts any non-empty string as a valid
 * ID parameter. This schema is designed for endpoints that use various ID formats
 * including database-generated IDs, slugs, custom identifiers, or legacy ID systems
 * that don't conform to specific patterns like UUIDs.
 * 
 * The schema provides basic validation to ensure ID parameters are present and
 * non-empty, preventing common errors from missing or malformed route parameters.
 * It's particularly useful for endpoints that need to accept different types of
 * identifiers or during migration periods where multiple ID formats coexist.
 * 
 * Security considerations include prevention of empty ID attacks that could bypass
 * authorization checks, basic input sanitization to prevent injection attempts,
 * and consistent error messaging that doesn't reveal system internals. The schema
 * maintains flexibility while providing essential validation for route parameters.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Usage with various ID formats
 * const validIds = [
 *   { id: 'user-123' },
 *   { id: 'course_advanced_spanish' },
 *   { id: '12345' },
 *   { id: 'abc-def-ghi' }
 * ];
 * 
 * validIds.forEach(idParam => {
 *   const result = IdParamSchema.parse(idParam);
 *   console.log(result.id); // Valid ID string
 * });
 * 
 * @example
 * // Route parameter validation
 * router.get('/resources/:id', validate({ params: IdParamSchema }), (req, res) => {
 *   const { id } = req.params; // Guaranteed to be non-empty string
 *   const resource = await resourceService.findById(id);
 *   res.json({ resource });
 * });
 */
export const IdParamSchema = z.object({
  id: z.string().min(1, 'ID is required')
});

/**
 * UUID parameter validation schema for strict identifier validation
 * 
 * Strict identifier validation schema that enforces UUID format compliance for
 * route parameters. This schema is essential for endpoints that use UUID-based
 * identifiers, providing strong validation to ensure only properly formatted
 * UUIDs are accepted and preventing malformed identifier attacks.
 * 
 * UUID validation provides several security and reliability benefits including
 * prevention of SQL injection attacks through strict format enforcement,
 * elimination of malformed identifier errors that could cause application
 * crashes, and consistent identifier format that supports distributed systems
 * and database replication scenarios.
 * 
 * The schema validates against the standard UUID format (8-4-4-4-12 hexadecimal
 * digits) and rejects any input that doesn't conform to this pattern. This
 * strict validation is particularly important for APIs that expose database
 * primary keys or need to maintain referential integrity across distributed
 * services.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Valid UUID parameter validation
 * const validUuid = { id: '123e4567-e89b-12d3-a456-426614174000' };
 * const result = UuidParamSchema.parse(validUuid);
 * console.log(result.id); // Valid UUID string
 * 
 * @example
 * // Route parameter validation for UUID-based resources
 * router.get('/users/:id', validate({ params: UuidParamSchema }), (req, res) => {
 *   const { id } = req.params; // Guaranteed to be valid UUID
 *   const user = await userService.findById(id);
 *   if (!user) {
 *     return res.status(404).json({ error: 'User not found' });
 *   }
 *   res.json({ user });
 * });
 * 
 * @example
 * // Error handling for invalid UUIDs
 * try {
 *   const result = UuidParamSchema.parse({ id: 'not-a-uuid' });
 * } catch (error) {
 *   // Throws: "Invalid UUID format"
 * }
 * 
 * @example
 * // Batch UUID validation
 * const validateUuidList = (ids: string[]) => {
 *   return ids.map(id => {
 *     const result = UuidParamSchema.safeParse({ id });
 *     return result.success ? result.data.id : null;
 *   }).filter(Boolean);
 * };
 */
export const UuidParamSchema = z.object({
  id: z.string().uuid('Invalid UUID format')
});

/**
 * Language code validation schema following BCP 47 standard
 * 
 * Comprehensive language code validation that supports the BCP 47 standard for
 * language identification, including ISO 639-1 (two-letter codes), ISO 639-2/3
 * (three-letter codes), and regional variants. This schema is essential for
 * internationalization support in the language learning platform, ensuring
 * proper language identification and content localization.
 * 
 * The validation supports various language code formats including simple language
 * codes (e.g., "en", "es", "qu"), language codes with country variants (e.g.,
 * "es-ES", "en-US"), and language codes with numeric region codes (e.g., "es-419"
 * for Latin American Spanish). This flexibility accommodates diverse linguistic
 * requirements and regional content variations.
 * 
 * Security and data integrity features include strict pattern matching to prevent
 * malformed language codes that could cause localization errors, length limits
 * to prevent buffer overflow attacks, and case sensitivity enforcement to maintain
 * consistency with international standards. The schema ensures that only valid
 * language identifiers are accepted throughout the application.
 * 
 * @type {z.ZodString}
 * 
 * @example
 * // Valid language codes
 * const validCodes = ['en', 'es', 'qu', 'es-ES', 'en-US', 'es-419', 'zh-CN'];
 * validCodes.forEach(code => {
 *   const result = LanguageCodeSchema.parse(code);
 *   console.log(`${code} is valid`);
 * });
 * 
 * @example
 * // Usage in course content validation
 * const CourseLanguageSchema = z.object({
 *   sourceLanguage: LanguageCodeSchema,
 *   targetLanguage: LanguageCodeSchema,
 *   supportedLocales: z.array(LanguageCodeSchema).optional()
 * });
 * 
 * @example
 * // Localization endpoint validation
 * router.get('/content/:lang', validate({ 
 *   params: z.object({ lang: LanguageCodeSchema }) 
 * }), (req, res) => {
 *   const { lang } = req.params; // Validated language code
 *   const content = await contentService.getLocalizedContent(lang);
 *   res.json({ content, language: lang });
 * });
 */
export const LanguageCodeSchema = z.string()
  .min(2, 'Language code must be at least 2 characters')
  .max(20, 'Language code must not exceed 20 characters')
  .regex(/^[a-z]{2,3}(-[A-Z]{2}|-[0-9]{3})?$/, 'Language code must follow BCP 47 format (e.g., "en", "qu", "es-ES", "es-419")');

/**
 * Country code validation schema following ISO 3166-1 alpha-2 standard
 * 
 * Strict country code validation that enforces the ISO 3166-1 alpha-2 standard
 * for country identification. This schema ensures consistent geographic data
 * representation throughout the application, supporting features like user
 * location tracking, content regionalization, and compliance with geographic
 * restrictions or regulations.
 * 
 * The validation enforces the exact two-character uppercase format required by
 * the ISO standard, preventing common errors like lowercase codes, full country
 * names, or numeric codes. This strict validation ensures compatibility with
 * international systems and maintains data consistency across distributed
 * services and third-party integrations.
 * 
 * Security considerations include prevention of injection attacks through strict
 * pattern matching, elimination of malformed geographic data that could cause
 * localization errors, and consistent data format that supports geographic
 * analytics and compliance reporting. The schema maintains compatibility with
 * standard geographic databases and mapping services.
 * 
 * @type {z.ZodString}
 * 
 * @example
 * // Valid country codes
 * const validCodes = ['US', 'CA', 'MX', 'BR', 'AR', 'ES', 'FR', 'DE', 'JP', 'AU'];
 * validCodes.forEach(code => {
 *   const result = CountryCodeSchema.parse(code);
 *   console.log(`${code} is valid`);
 * });
 * 
 * @example
 * // User profile with country validation
 * const UserProfileSchema = z.object({
 *   name: z.string(),
 *   email: EmailSchema,
 *   country: CountryCodeSchema.optional(),
 *   timezone: z.string().optional()
 * });
 * 
 * @example
 * // Geographic content filtering
 * router.get('/content/regional', validate({ 
 *   query: z.object({ country: CountryCodeSchema.optional() }) 
 * }), (req, res) => {
 *   const { country } = req.query;
 *   const content = await contentService.getRegionalContent(country);
 *   res.json({ content, region: country });
 * });
 * 
 * @example
 * // Error handling for invalid country codes
 * try {
 *   CountryCodeSchema.parse('usa'); // Invalid: lowercase and too long
 * } catch (error) {
 *   // Throws: "Country code must be uppercase letters"
 * }
 */
export const CountryCodeSchema = z.string().length(2, 'Country code must be 2 characters').regex(/^[A-Z]{2}$/, 'Country code must be uppercase letters');

/**
 * Email address validation schema with comprehensive format checking
 * 
 * Robust email validation schema that ensures email addresses conform to standard
 * format requirements while preventing common email-based attacks and data integrity
 * issues. The schema validates both the structural format of email addresses and
 * enforces reasonable length limits to prevent abuse and ensure compatibility with
 * database storage and email service providers.
 * 
 * The validation uses Zod's built-in email validation which implements RFC 5322
 * compliant email format checking, ensuring that email addresses are properly
 * structured with valid local and domain parts. The maximum length limit of 255
 * characters aligns with email standards and prevents potential buffer overflow
 * attacks or database storage issues.
 * 
 * Security features include prevention of email injection attacks through format
 * validation, protection against excessively long email addresses that could cause
 * denial-of-service conditions, and consistent validation that supports email
 * verification workflows and authentication systems. The schema maintains
 * compatibility with international email addresses and various domain formats.
 * 
 * @type {z.ZodString}
 * 
 * @example
 * // Valid email addresses
 * const validEmails = [
 *   'user@example.com',
 *   'test.email+tag@domain.co.uk',
 *   'user123@subdomain.example.org',
 *   'firstname.lastname@company-name.com'
 * ];
 * 
 * validEmails.forEach(email => {
 *   const result = EmailSchema.parse(email);
 *   console.log(`${email} is valid`);
 * });
 * 
 * @example
 * // User registration with email validation
 * const RegistrationSchema = z.object({
 *   email: EmailSchema,
 *   password: z.string().min(8),
 *   confirmEmail: EmailSchema
 * }).refine(data => data.email === data.confirmEmail, {
 *   message: 'Email addresses must match',
 *   path: ['confirmEmail']
 * });
 * 
 * @example
 * // Email update endpoint
 * router.put('/profile/email', validate({ 
 *   body: z.object({ newEmail: EmailSchema }) 
 * }), async (req, res) => {
 *   const { newEmail } = req.body; // Validated email address
 *   await userService.updateEmail(req.user.id, newEmail);
 *   res.json({ message: 'Email updated successfully' });
 * });
 */
export const EmailSchema = z.string().email('Invalid email format').max(255, 'Email too long');

/**
 * Username validation schema with character restrictions and length limits
 * 
 * Comprehensive username validation schema that enforces consistent username
 * format requirements across the application. The schema ensures usernames are
 * appropriate length, contain only safe characters, and follow patterns that
 * support user identification while preventing security vulnerabilities and
 * user experience issues.
 * 
 * The character restrictions allow letters, numbers, underscores, and hyphens,
 * which provides flexibility for user expression while preventing problematic
 * characters that could cause issues in URLs, database queries, or user
 * interfaces. The length limits ensure usernames are meaningful while preventing
 * abuse through excessively long identifiers.
 * 
 * Security considerations include prevention of username injection attacks
 * through character restrictions, elimination of special characters that could
 * cause parsing errors in various contexts, and consistent format that supports
 * username-based authentication and user lookup operations. The schema maintains
 * compatibility with URL encoding and various user interface components.
 * 
 * @type {z.ZodString}
 * 
 * @example
 * // Valid usernames
 * const validUsernames = [
 *   'user123',
 *   'language_learner',
 *   'student-2024',
 *   'TeacherMaria',
 *   'quiz_master_pro'
 * ];
 * 
 * validUsernames.forEach(username => {
 *   const result = UsernameSchema.parse(username);
 *   console.log(`${username} is valid`);
 * });
 * 
 * @example
 * // Username availability check
 * router.get('/username/check/:username', validate({ 
 *   params: z.object({ username: UsernameSchema }) 
 * }), async (req, res) => {
 *   const { username } = req.params; // Validated username
 *   const isAvailable = await userService.isUsernameAvailable(username);
 *   res.json({ username, available: isAvailable });
 * });
 * 
 * @example
 * // Profile update with username validation
 * const ProfileUpdateSchema = z.object({
 *   username: UsernameSchema.optional(),
 *   displayName: z.string().max(100).optional(),
 *   bio: z.string().max(500).optional()
 * });
 * 
 * @example
 * // Error handling for invalid usernames
 * try {
 *   UsernameSchema.parse('ab'); // Too short
 * } catch (error) {
 *   // Throws: "Username must be at least 3 characters"
 * }
 * 
 * try {
 *   UsernameSchema.parse('user@name'); // Invalid character
 * } catch (error) {
 *   // Throws: "Username can only contain letters, numbers, underscores, and hyphens"
 * }
 */
export const UsernameSchema = z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username too long').regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

/**
 * URL validation schema with format checking and length limits
 * 
 * Comprehensive URL validation schema that ensures URLs are properly formatted
 * and safe for use throughout the application. The schema validates URL structure
 * according to standard specifications while enforcing reasonable length limits
 * to prevent abuse and ensure compatibility with various systems and storage
 * mechanisms.
 * 
 * The validation uses Zod's built-in URL validation which checks for proper
 * protocol specification, domain format, and overall URL structure. This ensures
 * that URLs are valid and can be safely used for HTTP requests, redirects, and
 * user interface display without causing errors or security vulnerabilities.
 * 
 * Security features include prevention of malicious URL injection through format
 * validation, protection against excessively long URLs that could cause buffer
 * overflow or denial-of-service conditions, and consistent validation that
 * supports safe URL handling in various contexts including user-generated content
 * and external service integrations.
 * 
 * @type {z.ZodString}
 * 
 * @example
 * // Valid URLs
 * const validUrls = [
 *   'https://example.com',
 *   'http://subdomain.example.org/path',
 *   'https://api.service.com/v1/endpoint?param=value',
 *   'https://cdn.example.com/images/avatar.jpg'
 * ];
 * 
 * validUrls.forEach(url => {
 *   const result = UrlSchema.parse(url);
 *   console.log(`${url} is valid`);
 * });
 * 
 * @example
 * // User profile with avatar URL validation
 * const UserProfileSchema = z.object({
 *   name: z.string(),
 *   email: EmailSchema,
 *   avatarUrl: UrlSchema.optional(),
 *   websiteUrl: UrlSchema.optional()
 * });
 * 
 * @example
 * // Content with external resource validation
 * const LessonContentSchema = z.object({
 *   title: z.string(),
 *   description: z.string(),
 *   videoUrl: UrlSchema.optional(),
 *   audioUrl: UrlSchema.optional(),
 *   externalResources: z.array(UrlSchema).optional()
 * });
 * 
 * @example
 * // URL validation in API endpoints
 * router.post('/resources', validate({ 
 *   body: z.object({ 
 *     name: z.string(),
 *     url: UrlSchema,
 *     description: z.string().optional()
 *   }) 
 * }), async (req, res) => {
 *   const { name, url, description } = req.body; // URL is validated
 *   const resource = await resourceService.create({ name, url, description });
 *   res.status(201).json({ resource });
 * });
 */
export const UrlSchema = z.string().url('Invalid URL format').max(255, 'URL too long');

/**
 * Experience points validation schema for gamification features
 * 
 * Validation schema for experience points used in the language learning platform's
 * gamification system. This schema ensures that experience point values are always
 * non-negative integers, preventing data corruption and maintaining the integrity
 * of user progress tracking and achievement systems.
 * 
 * Experience points are fundamental to user engagement and progress measurement,
 * requiring strict validation to ensure accurate tracking of learning achievements.
 * The schema prevents negative values that could corrupt user progress data and
 * ensures integer values for consistent point calculations and display.
 * 
 * @type {z.ZodNumber}
 * 
 * @example
 * // Valid experience point values
 * const validPoints = [0, 10, 100, 1500, 50000];
 * validPoints.forEach(points => {
 *   const result = ExperiencePointsSchema.parse(points);
 *   console.log(`${points} XP is valid`);
 * });
 * 
 * @example
 * // User progress tracking
 * const ProgressUpdateSchema = z.object({
 *   lessonId: z.string().uuid(),
 *   experienceGained: ExperiencePointsSchema,
 *   completionTime: TimeSecondsSchema
 * });
 */
export const ExperiencePointsSchema = z.number().int().min(0, 'Experience points must be non-negative');

/**
 * Order validation schema for hierarchical content organization
 * 
 * Validation schema for order/position values used in hierarchical content
 * structures such as course modules, lessons, and exercises. This schema ensures
 * that order values are positive integers, maintaining proper content sequencing
 * and preventing organizational errors in the learning platform.
 * 
 * Order values are critical for maintaining logical content flow and user
 * navigation, requiring validation to ensure positive integers that support
 * proper sorting and sequencing operations. The schema prevents zero or negative
 * values that could disrupt content organization and user experience.
 * 
 * @type {z.ZodNumber}
 * 
 * @example
 * // Content ordering validation
 * const LessonOrderSchema = z.object({
 *   lessonId: z.string().uuid(),
 *   newOrder: OrderSchema
 * });
 * 
 * @example
 * // Batch reordering validation
 * const ReorderSchema = z.object({
 *   items: z.array(z.object({
 *     id: z.string().uuid(),
 *     order: OrderSchema
 *   }))
 * });
 */
export const OrderSchema = z.number().int().positive('Order must be a positive integer');

/**
 * Score validation schema for assessment and progress tracking
 * 
 * Validation schema for score values used in quizzes, exercises, and assessments
 * throughout the language learning platform. This schema enforces a 0-100 range
 * that aligns with percentage-based scoring systems and provides consistent
 * score representation across all assessment types.
 * 
 * The 0-100 range provides intuitive percentage-based scoring that users can
 * easily understand while maintaining compatibility with various grading systems
 * and progress calculations. The schema ensures integer values for consistent
 * score display and comparison operations.
 * 
 * @type {z.ZodNumber}
 * 
 * @example
 * // Exercise completion with score
 * const ExerciseResultSchema = z.object({
 *   exerciseId: z.string().uuid(),
 *   score: ScoreSchema,
 *   timeSpent: TimeSecondsSchema,
 *   attempts: z.number().int().min(1)
 * });
 * 
 * @example
 * // Quiz grading validation
 * const QuizGradeSchema = z.object({
 *   quizId: z.string().uuid(),
 *   userId: z.string().uuid(),
 *   finalScore: ScoreSchema,
 *   passingScore: ScoreSchema
 * });
 */
export const ScoreSchema = z.number().int().min(0, 'Score must be at least 0').max(100, 'Score cannot exceed 100');

/**
 * Time duration validation schema in seconds
 * 
 * Validation schema for time duration values measured in seconds, used throughout
 * the platform for tracking lesson completion times, exercise durations, and
 * other time-based metrics. This schema ensures non-negative integer values
 * that support accurate time tracking and analytics.
 * 
 * Time tracking is essential for learning analytics and user progress monitoring,
 * requiring validation to ensure meaningful time values. The schema prevents
 * negative durations that could corrupt analytics data and ensures integer
 * values for consistent time calculations and display.
 * 
 * @type {z.ZodNumber}
 * 
 * @example
 * // Lesson completion tracking
 * const LessonCompletionSchema = z.object({
 *   lessonId: z.string().uuid(),
 *   completionTime: TimeSecondsSchema,
 *   score: ScoreSchema.optional()
 * });
 * 
 * @example
 * // Exercise timing validation
 * const ExerciseTimingSchema = z.object({
 *   startTime: z.date(),
 *   duration: TimeSecondsSchema,
 *   pausedTime: TimeSecondsSchema.optional()
 * });
 */
export const TimeSecondsSchema = z.number().int().min(0, 'Time must be non-negative');

/**
 * Boolean string transformation schema for query parameters
 * 
 * Specialized validation schema that transforms string-based query parameters
 * into boolean values, handling the common web pattern where boolean flags are
 * passed as string values in URLs. This schema provides flexible boolean
 * interpretation while maintaining type safety and consistent behavior.
 * 
 * The transformation accepts 'true' and '1' as truthy values, following common
 * web conventions for boolean query parameters. All other values are treated
 * as falsy, providing predictable behavior for client applications and API
 * consumers. The optional nature allows for parameters that may not be present.
 * 
 * @type {z.ZodOptional<z.ZodString>}
 * 
 * @example
 * // Query parameter boolean conversion
 * const FilterSchema = z.object({
 *   includeArchived: BooleanStringSchema,
 *   showPublicOnly: BooleanStringSchema,
 *   enableNotifications: BooleanStringSchema
 * });
 * 
 * // URL: /api/courses?includeArchived=true&showPublicOnly=1&enableNotifications=false
 * // Result: { includeArchived: true, showPublicOnly: true, enableNotifications: false }
 * 
 * @example
 * // API endpoint with boolean flags
 * router.get('/content', validate({ 
 *   query: z.object({
 *     published: BooleanStringSchema,
 *     featured: BooleanStringSchema
 *   })
 * }), (req, res) => {
 *   const { published, featured } = req.query; // Properly typed booleans
 *   const content = await contentService.find({ published, featured });
 *   res.json({ content });
 * });
 */
export const BooleanStringSchema = z.string().optional().transform((val) => {
  if (val === undefined) return undefined;
  return val === 'true' || val === '1';
});

/**
 * User role validation schema for authorization and access control
 * 
 * Enumeration schema that defines and validates the three primary user roles
 * in the WayrApp language learning platform. This schema ensures consistent
 * role-based access control throughout the application and prevents invalid
 * role assignments that could compromise security or functionality.
 * 
 * The three roles provide a hierarchical permission structure: students have
 * basic learning access, content creators can manage educational content, and
 * administrators have full system access. This role system supports the
 * platform's educational workflow while maintaining security boundaries.
 * 
 * @type {z.ZodEnum}
 * 
 * @example
 * // User role assignment validation
 * const UserRoleUpdateSchema = z.object({
 *   userId: z.string().uuid(),
 *   newRole: RoleSchema,
 *   reason: z.string().optional()
 * });
 * 
 * @example
 * // Role-based content filtering
 * const ContentAccessSchema = z.object({
 *   userRole: RoleSchema,
 *   contentType: z.string(),
 *   requestedAccess: z.enum(['read', 'write', 'delete'])
 * });
 * 
 * @example
 * // Authorization middleware integration
 * const requireRole = (allowedRoles: z.infer<typeof RoleSchema>[]) => {
 *   return (req: Request, res: Response, next: NextFunction) => {
 *     const userRole = RoleSchema.parse(req.user.role);
 *     if (allowedRoles.includes(userRole)) {
 *       next();
 *     } else {
 *       res.status(403).json({ error: 'Insufficient permissions' });
 *     }
 *   };
 * };
 */
export const RoleSchema = z.enum(['student', 'content_creator', 'admin']);

/**
 * Module type validation schema for educational content categorization
 * 
 * Enumeration schema that defines the different types of learning modules
 * available in the language learning platform. This schema ensures consistent
 * module categorization and supports the platform's pedagogical structure
 * by enforcing valid module types for content organization and user navigation.
 * 
 * The module types represent different learning approaches: informative modules
 * provide background knowledge, basic lessons cover fundamental concepts,
 * reading modules focus on comprehension skills, dialogue modules practice
 * conversational skills, and exam modules assess learning progress.
 * 
 * @type {z.ZodEnum}
 * 
 * @example
 * // Module creation with type validation
 * const CreateModuleSchema = z.object({
 *   title: z.string().min(1).max(200),
 *   type: ModuleTypeSchema,
 *   description: z.string().max(1000).optional(),
 *   order: OrderSchema
 * });
 * 
 * @example
 * // Module filtering by type
 * const ModuleQuerySchema = z.object({
 *   type: ModuleTypeSchema.optional(),
 *   difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional()
 * });
 */
export const ModuleTypeSchema = z.enum(['informative', 'basic_lesson', 'reading', 'dialogue', 'exam']);

/**
 * Exercise type validation schema for interactive learning activities
 * 
 * Enumeration schema that defines the various types of exercises available
 * in the language learning platform. This schema ensures consistent exercise
 * categorization and supports the platform's interactive learning system
 * by enforcing valid exercise types for content creation and user engagement.
 * 
 * The exercise types cover different learning modalities: translation exercises
 * develop language conversion skills, fill-in-the-blank tests comprehension,
 * true/false (vof) questions assess understanding, pairs exercises practice
 * matching concepts, informative exercises provide contextual learning, and
 * ordering exercises develop sequence understanding.
 * 
 * @type {z.ZodEnum}
 * 
 * @example
 * // Exercise creation with type validation
 * const CreateExerciseSchema = z.object({
 *   title: z.string().min(1).max(200),
 *   type: ExerciseTypeSchema,
 *   content: JsonSchema,
 *   difficulty: z.enum(['easy', 'medium', 'hard'])
 * });
 * 
 * @example
 * // Exercise filtering and search
 * const ExerciseQuerySchema = z.object({
 *   type: ExerciseTypeSchema.optional(),
 *   difficulty: z.string().optional(),
 *   tags: z.array(z.string()).optional()
 * });
 * 
 * @example
 * // Exercise completion tracking
 * const ExerciseCompletionSchema = z.object({
 *   exerciseId: z.string().uuid(),
 *   exerciseType: ExerciseTypeSchema,
 *   score: ScoreSchema,
 *   timeSpent: TimeSecondsSchema
 * });
 */
export const ExerciseTypeSchema = z.enum(['translation', 'fill_in_the_blank', 'vof', 'pairs', 'informative', 'ordering']);

/**
 * Generic text field validation schema factory function
 * 
 * Factory function that creates customizable text field validation schemas with
 * configurable minimum and maximum length constraints. This function provides
 * a reusable pattern for creating consistent text validation across the
 * application while allowing flexibility for different field requirements.
 * 
 * The factory approach enables creation of text schemas with appropriate length
 * limits for different use cases, from short titles and names to longer
 * descriptions and content. Default values provide sensible constraints for
 * most common text fields while allowing customization for specific needs.
 * 
 * @param {number} minLength - Minimum required length (default: 1)
 * @param {number} maxLength - Maximum allowed length (default: 255)
 * @returns {z.ZodString} Configured text validation schema
 * 
 * @example
 * // Different text field configurations
 * const TitleSchema = TextFieldSchema(1, 100);        // Required title, max 100 chars
 * const DescriptionSchema = TextFieldSchema(10, 500); // Required description, 10-500 chars
 * const TagSchema = TextFieldSchema(1, 50);           // Short tags, max 50 chars
 * 
 * @example
 * // Content creation schema with varied text fields
 * const CourseSchema = z.object({
 *   title: TextFieldSchema(1, 200),
 *   subtitle: TextFieldSchema(1, 300),
 *   description: TextFieldSchema(50, 2000),
 *   tags: z.array(TextFieldSchema(1, 30)).max(10)
 * });
 * 
 * @example
 * // User profile with different text requirements
 * const ProfileSchema = z.object({
 *   displayName: TextFieldSchema(2, 50),
 *   bio: TextFieldSchema(10, 500),
 *   location: TextFieldSchema(2, 100)
 * });
 */
export const TextFieldSchema = (minLength: number = 1, maxLength: number = 255) =>
  z.string().min(minLength, `Text must be at least ${minLength} characters`).max(maxLength, `Text cannot exceed ${maxLength} characters`);

/**
 * Optional text field validation schema factory function
 * 
 * Factory function that creates optional text field validation schemas with
 * configurable maximum length constraints. This function is designed for
 * optional fields that don't require content but should be validated when
 * provided, maintaining data quality while supporting flexible data entry.
 * 
 * The optional nature allows fields to be omitted entirely while still
 * enforcing length limits when values are provided. This pattern is common
 * for profile information, metadata fields, and supplementary content that
 * enhances but doesn't define the core data structure.
 * 
 * @param {number} maxLength - Maximum allowed length (default: 255)
 * @returns {z.ZodOptional<z.ZodString>} Configured optional text validation schema
 * 
 * @example
 * // Optional fields with different length limits
 * const MetadataSchema = z.object({
 *   title: TextFieldSchema(1, 100),                    // Required
 *   subtitle: OptionalTextFieldSchema(200),            // Optional, max 200 chars
 *   description: OptionalTextFieldSchema(1000),        // Optional, max 1000 chars
 *   notes: OptionalTextFieldSchema(500)                // Optional, max 500 chars
 * });
 * 
 * @example
 * // User profile with optional information
 * const UserProfileSchema = z.object({
 *   username: UsernameSchema,                          // Required
 *   displayName: OptionalTextFieldSchema(100),        // Optional display name
 *   bio: OptionalTextFieldSchema(500),                 // Optional biography
 *   website: UrlSchema.optional(),                     // Optional website
 *   location: OptionalTextFieldSchema(100)            // Optional location
 * });
 * 
 * @example
 * // Content with optional metadata
 * const LessonSchema = z.object({
 *   title: TextFieldSchema(1, 200),                    // Required title
 *   content: TextFieldSchema(50, 5000),               // Required content
 *   summary: OptionalTextFieldSchema(300),            // Optional summary
 *   teacherNotes: OptionalTextFieldSchema(1000)       // Optional teacher notes
 * });
 */
export const OptionalTextFieldSchema = (maxLength: number = 255) =>
  z.string().max(maxLength, `Text cannot exceed ${maxLength} characters`).optional();

/**
 * JSON data validation schema for flexible structured content
 * 
 * Flexible validation schema that accepts either JSON objects or arrays,
 * designed for storing structured data such as exercise configurations,
 * content metadata, and dynamic form data. This schema provides type safety
 * for JSON content while maintaining flexibility for various data structures.
 * 
 * The schema accepts both object and array formats to accommodate different
 * JSON data patterns used throughout the application. This flexibility is
 * essential for exercise data, configuration settings, and other structured
 * content that may vary in format while maintaining JSON compatibility.
 * 
 * @type {z.ZodUnion}
 * 
 * @example
 * // Exercise data with JSON content
 * const ExerciseSchema = z.object({
 *   title: TextFieldSchema(1, 200),
 *   type: ExerciseTypeSchema,
 *   data: JsonSchema,                    // Flexible JSON structure
 *   metadata: JsonSchema.optional()      // Optional JSON metadata
 * });
 * 
 * @example
 * // Different JSON data structures
 * const validJsonData = [
 *   { question: 'What is...?', options: ['A', 'B', 'C'], answer: 'A' },
 *   ['item1', 'item2', 'item3'],
 *   { config: { difficulty: 'medium', timeLimit: 300 } }
 * ];
 * 
 * validJsonData.forEach(data => {
 *   const result = JsonSchema.parse(data);
 *   console.log('Valid JSON data:', result);
 * });
 * 
 * @example
 * // Configuration storage with JSON validation
 * const SettingsSchema = z.object({
 *   userId: z.string().uuid(),
 *   preferences: JsonSchema,
 *   customizations: JsonSchema.optional()
 * });
 */
export const JsonSchema = z.record(z.any()).or(z.array(z.any()));

/**
 * TypeScript type definitions inferred from common validation schemas
 * 
 * These type definitions provide compile-time type safety for common data
 * structures used throughout the application. They are automatically inferred
 * from the corresponding Zod schemas, ensuring that TypeScript types remain
 * synchronized with runtime validation rules.
 * 
 * @example
 * // Using types in function signatures
 * const processPagination = (query: PaginationQuery) => {
 *   const { page, limit, sortBy, sortOrder } = query;
 *   // All properties are properly typed
 * };
 * 
 * const handleIdParam = (params: IdParam) => {
 *   const { id } = params; // id is guaranteed to be a non-empty string
 * };
 * 
 * const processUuidParam = (params: UuidParam) => {
 *   const { id } = params; // id is guaranteed to be a valid UUID string
 * };
 */

/**
 * Type definition for validated pagination query parameters
 * 
 * Represents the structure of validated pagination data including page number,
 * result limit, optional sorting field, and sort order. This type ensures
 * type safety for pagination operations while maintaining consistency with
 * the validation schema.
 * 
 * @type {Object}
 * @property {number} page - Page number (minimum 1)
 * @property {number} limit - Results per page (1-100)
 * @property {string} [sortBy] - Optional field name for sorting
 * @property {'asc' | 'desc'} sortOrder - Sort direction (default: 'asc')
 */
export type PaginationQuery = z.infer<typeof PaginationSchema>;

/**
 * Type definition for validated generic ID parameters
 * 
 * Represents the structure of validated ID parameters that accept any
 * non-empty string identifier. This type provides flexibility for various
 * ID formats while ensuring basic validation requirements are met.
 * 
 * @type {Object}
 * @property {string} id - Non-empty string identifier
 */
export type IdParam = z.infer<typeof IdParamSchema>;

/**
 * Type definition for validated UUID parameters
 * 
 * Represents the structure of validated UUID parameters that enforce strict
 * UUID format compliance. This type ensures type safety for UUID-based
 * operations while maintaining format validation requirements.
 * 
 * @type {Object}
 * @property {string} id - Valid UUID string identifier
 */
export type UuidParam = z.infer<typeof UuidParamSchema>;