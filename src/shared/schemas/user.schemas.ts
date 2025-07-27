// src/shared/schemas/user.schemas.ts

/**
 * User management validation schemas for WayrApp language learning platform
 * 
 * This module provides comprehensive Zod validation schemas for all user management
 * operations in the WayrApp language learning platform. It serves as the data validation
 * foundation for user profile management, administrative user operations, and user
 * discovery functionality, ensuring data integrity, security, and consistency across
 * all user-related operations.
 * 
 * The schemas support the platform's user management system by providing robust
 * validation for profile updates, role management, and user querying operations.
 * They ensure that user data maintains quality standards while supporting flexible
 * user management workflows for both self-service profile management and administrative
 * user operations.
 * 
 * Key architectural features include optional profile field updates that support
 * progressive profile completion, role-based access control through administrative
 * schemas, comprehensive user discovery through flexible query parameters, and
 * security-focused validation that prevents unauthorized data manipulation and
 * maintains user privacy standards.
 * 
 * The module implements user experience optimization through optional field validation
 * that doesn't force users to provide all information immediately, administrative
 * efficiency through streamlined role management schemas, and system scalability
 * through efficient query parameter validation that supports large user bases
 * and complex filtering requirements.
 * 
 * Security considerations include input sanitization for all user-provided data,
 * role validation to prevent privilege escalation, query parameter validation to
 * prevent injection attacks, and comprehensive validation of profile data to
 * maintain platform quality and user safety standards.
 * 
 * @module user.schemas
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic usage with validation middleware
 * import { UserProfileUpdateSchema, UserRoleUpdateSchema } from '@/shared/schemas/user.schemas';
 * import { validate } from '@/shared/middleware/validation';
 * 
 * router.put('/profile', validate({ body: UserProfileUpdateSchema }), userController.updateProfile);
 * router.put('/users/:id/role', validate({ body: UserRoleUpdateSchema }), adminController.updateUserRole);
 * 
 * @example
 * // Type inference for user operations
 * import { UserProfileUpdateRequest, UserQueryParams } from '@/shared/schemas/user.schemas';
 * 
 * const updateUserProfile = async (userId: string, updates: UserProfileUpdateRequest) => {
 *   // updates is fully typed with validation constraints
 *   return await userService.updateProfile(userId, updates);
 * };
 * 
 * @example
 * // User management and discovery
 * import { UserQuerySchema } from '@/shared/schemas/user.schemas';
 * 
 * router.get('/users', validate({ query: UserQuerySchema }), (req, res) => {
 *   const { page, limit, role, is_active, search } = req.query;
 *   // All query parameters are properly typed and validated
 * });
 */

import { z } from 'zod';
import {
  UsernameSchema,
  CountryCodeSchema,
  UrlSchema,
  RoleSchema,
  BooleanStringSchema,
} from './common';

/**
 * User profile update validation schema for self-service profile management
 * 
 * Comprehensive validation schema for user profile update operations that allows
 * users to modify their personal information including username, country location,
 * and profile picture. This schema supports progressive profile completion by
 * making all fields optional, enabling users to update their profiles incrementally
 * while maintaining data quality through comprehensive field validation.
 * 
 * The profile update schema ensures data integrity through reusable validation
 * components, supports internationalization through country code validation,
 * maintains platform quality through username format enforcement, and enables
 * personalization through profile picture URL validation. All fields are optional
 * to support flexible user experience patterns and progressive disclosure.
 * 
 * User experience considerations include optional field updates that don't require
 * complete profile information, validation feedback that guides users toward
 * successful profile completion, flexible update patterns that support various
 * user interface designs, and privacy-conscious validation that respects user
 * choice in profile information sharing.
 * 
 * Security features include input sanitization for all profile fields, URL
 * validation to prevent malicious link injection, username format validation
 * to prevent injection attacks, and country code validation to ensure data
 * consistency and prevent geographic data manipulation.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Complete profile update
 * const profileUpdate = {
 *   username: 'language_learner_2024',
 *   country_code: 'PE',
 *   profile_picture_url: 'https://example.com/avatars/user123.jpg'
 * };
 * 
 * const result = UserProfileUpdateSchema.parse(profileUpdate);
 * console.log('Valid profile update:', result);
 * 
 * @example
 * // Partial profile update (username only)
 * const usernameUpdate = {
 *   username: 'new_username'
 * };
 * 
 * const result = UserProfileUpdateSchema.parse(usernameUpdate);
 * // Other fields remain unchanged
 * 
 * @example
 * // Profile update endpoint with validation
 * router.put('/profile', 
 *   authenticateToken,
 *   validate({ body: UserProfileUpdateSchema }), 
 *   async (req, res) => {
 *     const updates = req.body; // Validated profile updates
 *     const userId = req.user.id;
 *     
 *     const updatedProfile = await userService.updateProfile(userId, updates);
 *     
 *     res.json({
 *       success: true,
 *       profile: updatedProfile,
 *       message: 'Profile updated successfully'
 *     });
 *   }
 * );
 * 
 * @example
 * // Progressive profile completion
 * const profileSteps = [
 *   { username: 'student123' },                    // Step 1: Choose username
 *   { country_code: 'MX' },                       // Step 2: Set location
 *   { profile_picture_url: 'https://...' }        // Step 3: Add avatar
 * ];
 * 
 * for (const step of profileSteps) {
 *   const validation = UserProfileUpdateSchema.safeParse(step);
 *   if (validation.success) {
 *     await userService.updateProfile(userId, validation.data);
 *   }
 * }
 * 
 * @example
 * // Mobile app profile management
 * const mobileProfileUpdate = async (updates: Partial<UserProfileUpdateRequest>) => {
 *   const validation = UserProfileUpdateSchema.safeParse(updates);
 *   
 *   if (!validation.success) {
 *     throw new ValidationError('Invalid profile data', validation.error.errors);
 *   }
 *   
 *   return await fetch('/api/profile', {
 *     method: 'PUT',
 *     headers: { 
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${accessToken}`
 *     },
 *     body: JSON.stringify(validation.data)
 *   });
 * };
 * 
 * @example
 * // Profile validation with user feedback
 * const validateProfileUpdate = (formData: any) => {
 *   const result = UserProfileUpdateSchema.safeParse(formData);
 *   
 *   if (!result.success) {
 *     const fieldErrors = result.error.errors.reduce((acc, err) => {
 *       const field = err.path[0] as string;
 *       acc[field] = err.message;
 *       return acc;
 *     }, {} as Record<string, string>);
 *     
 *     return { isValid: false, errors: fieldErrors };
 *   }
 *   
 *   return { isValid: true, data: result.data };
 * };
 */
export const UserProfileUpdateSchema = z.object({
  username: UsernameSchema.optional(),
  country_code: CountryCodeSchema.optional(),
  profile_picture_url: UrlSchema.optional(),
});

/**
 * User role update validation schema for administrative user management
 * 
 * Specialized validation schema for administrative role management operations
 * that allows authorized administrators to modify user roles within the platform.
 * This schema enforces strict role validation to maintain security boundaries
 * and prevent unauthorized privilege escalation while supporting legitimate
 * administrative workflows for user management and access control.
 * 
 * The role update schema ensures security through strict role enumeration,
 * prevents privilege escalation through comprehensive validation, supports
 * administrative workflows through streamlined role assignment, and maintains
 * audit trails through structured role change operations that can be logged
 * and monitored for security compliance.
 * 
 * Administrative security features include role validation that prevents invalid
 * role assignments, enumeration constraints that limit roles to valid platform
 * roles, integration with authorization middleware that ensures only authorized
 * administrators can perform role changes, and structured validation that
 * supports comprehensive audit logging and security monitoring.
 * 
 * The schema supports the platform's role-based access control system by
 * providing validated role assignments, ensuring consistent role management
 * across all administrative interfaces, and maintaining security boundaries
 * between different user privilege levels.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Administrative role assignment
 * const roleUpdate = {
 *   role: 'content_creator'
 * };
 * 
 * const result = UserRoleUpdateSchema.parse(roleUpdate);
 * console.log('Valid role update:', result);
 * 
 * @example
 * // Administrative role update endpoint
 * router.put('/users/:userId/role', 
 *   authenticateToken,
 *   requireRole('admin'),
 *   validate({ 
 *     params: z.object({ userId: z.string().uuid() }),
 *     body: UserRoleUpdateSchema 
 *   }), 
 *   async (req, res) => {
 *     const { role } = req.body; // Validated role
 *     const { userId } = req.params;
 *     const adminId = req.user.id;
 *     
 *     // Log administrative action for audit trail
 *     await auditService.logRoleChange(adminId, userId, role);
 *     
 *     const updatedUser = await userService.updateRole(userId, role);
 *     
 *     res.json({
 *       success: true,
 *       user: updatedUser,
 *       message: `User role updated to ${role}`
 *     });
 *   }
 * );
 * 
 * @example
 * // Batch role updates for administrative efficiency
 * const batchRoleUpdate = async (userRoleUpdates: Array<{userId: string, role: string}>) => {
 *   const validatedUpdates = userRoleUpdates.map(update => {
 *     const validation = UserRoleUpdateSchema.safeParse({ role: update.role });
 *     if (!validation.success) {
 *       throw new ValidationError(`Invalid role for user ${update.userId}: ${update.role}`);
 *     }
 *     return { userId: update.userId, role: validation.data.role };
 *   });
 *   
 *   return await Promise.all(
 *     validatedUpdates.map(update => 
 *       userService.updateRole(update.userId, update.role)
 *     )
 *   );
 * };
 * 
 * @example
 * // Role promotion workflow
 * const promoteToContentCreator = async (userId: string) => {
 *   const roleUpdate = { role: 'content_creator' as const };
 *   
 *   const validation = UserRoleUpdateSchema.safeParse(roleUpdate);
 *   if (!validation.success) {
 *     throw new Error('Invalid role promotion request');
 *   }
 *   
 *   // Check user eligibility for promotion
 *   const user = await userService.findById(userId);
 *   if (!user || user.role !== 'student') {
 *     throw new Error('User not eligible for content creator promotion');
 *   }
 *   
 *   return await userService.updateRole(userId, validation.data.role);
 * };
 * 
 * @example
 * // Administrative dashboard role management
 * const handleRoleChange = async (userId: string, newRole: string) => {
 *   try {
 *     const validation = UserRoleUpdateSchema.safeParse({ role: newRole });
 *     
 *     if (!validation.success) {
 *       return {
 *         success: false,
 *         error: 'Invalid role selected',
 *         details: validation.error.errors
 *       };
 *     }
 *     
 *     const updatedUser = await adminService.updateUserRole(userId, validation.data.role);
 *     
 *     return {
 *       success: true,
 *       user: updatedUser,
 *       message: `Role successfully updated to ${validation.data.role}`
 *     };
 *   } catch (error) {
 *     return {
 *       success: false,
 *       error: 'Failed to update user role',
 *       details: error.message
 *     };
 *   }
 * };
 */
export const UserRoleUpdateSchema = z.object({
  role: RoleSchema,
});

/**
 * User query parameters validation schema for user discovery and management
 * 
 * Comprehensive validation schema for query parameters used in user listing,
 * search, and administrative management operations across the language learning
 * platform. This schema combines standard pagination functionality with
 * user-specific filtering options including role-based filtering, activity
 * status filtering, and text-based search capabilities for efficient user
 * discovery and management.
 * 
 * The query schema supports administrative efficiency through role-based
 * filtering for user management, activity status filtering for user engagement
 * analysis, text search for user discovery, and flexible sorting for various
 * administrative workflows. All parameters are optional to support flexible
 * querying patterns and different user interface requirements.
 * 
 * Administrative features include comprehensive user filtering for large user
 * bases, efficient pagination for performance optimization, flexible search
 * capabilities for user discovery, and role-based filtering for access control
 * and user management workflows. The schema ensures efficient database
 * operations while maintaining security and usability.
 * 
 * Performance considerations include pagination limits to prevent excessive
 * resource consumption, optional parameters to reduce query complexity,
 * efficient filtering options that support database indexing, and search
 * functionality that balances comprehensiveness with performance requirements.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Comprehensive user management query
 * const userQuery = {
 *   page: '1',
 *   limit: '25',
 *   sortBy: 'registration_date',
 *   sortOrder: 'desc',
 *   role: 'student',
 *   is_active: 'true',
 *   search: 'maria'
 * };
 * 
 * const validatedQuery = UserQuerySchema.parse(userQuery);
 * // Result: { page: 1, limit: 25, sortBy: 'registration_date', sortOrder: 'desc',
 * //          role: 'student', is_active: true, search: 'maria' }
 * 
 * @example
 * // Administrative user listing endpoint
 * router.get('/users', 
 *   authenticateToken,
 *   requireRole('admin'),
 *   validate({ query: UserQuerySchema }), 
 *   async (req, res) => {
 *     const { 
 *       page, 
 *       limit, 
 *       sortBy, 
 *       sortOrder, 
 *       role, 
 *       is_active, 
 *       search 
 *     } = req.query;
 *     
 *     const queryOptions = {
 *       skip: (page - 1) * limit,
 *       take: limit,
 *       where: {
 *         ...(role && { role }),
 *         ...(is_active !== undefined && { is_active }),
 *         ...(search && {
 *           OR: [
 *             { username: { contains: search, mode: 'insensitive' } },
 *             { email: { contains: search, mode: 'insensitive' } }
 *           ]
 *         })
 *       },
 *       orderBy: sortBy ? { [sortBy]: sortOrder } : { registration_date: 'desc' }
 *     };
 *     
 *     const users = await userService.findMany(queryOptions);
 *     res.json({ users, pagination: { page, limit, sortBy, sortOrder } });
 *   }
 * );
 * 
 * @example
 * // Role-specific user filtering
 * const contentCreatorQuery = {
 *   role: 'content_creator',
 *   is_active: 'true',
 *   sortBy: 'last_login_date',
 *   sortOrder: 'desc',
 *   limit: '50'
 * };
 * 
 * @example
 * // User search functionality
 * const searchUsers = async (searchTerm: string) => {
 *   const searchQuery = {
 *     search: searchTerm,
 *     is_active: 'true',
 *     limit: '20',
 *     sortBy: 'username',
 *     sortOrder: 'asc'
 *   };
 *   
 *   const validation = UserQuerySchema.safeParse(searchQuery);
 *   if (!validation.success) {
 *     throw new ValidationError('Invalid search parameters');
 *   }
 *   
 *   return await userService.searchUsers(validation.data);
 * };
 * 
 * @example
 * // Administrative dashboard queries
 * const dashboardQueries = {
 *   activeStudents: {
 *     role: 'student',
 *     is_active: 'true',
 *     sortBy: 'registration_date',
 *     sortOrder: 'desc',
 *     limit: '100'
 *   },
 *   inactiveUsers: {
 *     is_active: 'false',
 *     sortBy: 'last_login_date',
 *     sortOrder: 'asc',
 *     limit: '50'
 *   },
 *   recentRegistrations: {
 *     sortBy: 'registration_date',
 *     sortOrder: 'desc',
 *     limit: '25'
 *   }
 * };
 * 
 * @example
 * // Mobile admin app user management
 * const mobileUserQuery = {
 *   page: '1',
 *   limit: '10', // Smaller batches for mobile
 *   sortBy: 'username',
 *   sortOrder: 'asc',
 *   is_active: 'true'
 * };
 * 
 * @example
 * // Dynamic query building for user interfaces
 * const buildUserQuery = (filters: any) => {
 *   const query: any = {
 *     page: filters.page || '1',
 *     limit: filters.limit || '20',
 *     sortBy: filters.sortBy || 'registration_date',
 *     sortOrder: filters.sortOrder || 'desc'
 *   };
 *   
 *   if (filters.role) query.role = filters.role;
 *   if (filters.activeOnly) query.is_active = 'true';
 *   if (filters.searchTerm) query.search = filters.searchTerm;
 *   
 *   const validation = UserQuerySchema.safeParse(query);
 *   return validation.success ? validation.data : null;
 * };
 */
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

/**
 * TypeScript type definitions inferred from user validation schemas
 * 
 * These type definitions provide compile-time type safety for user management
 * operations throughout the application. They are automatically inferred from
 * the corresponding Zod schemas, ensuring that TypeScript types remain
 * synchronized with runtime validation rules and preventing type/validation
 * mismatches in user management systems.
 * 
 * The types enable full type safety in user management services, administrative
 * interfaces, profile management systems, and client-side applications while
 * maintaining a single source of truth for validation rules. They support IDE
 * autocompletion, compile-time error detection, and refactoring safety across
 * the entire user management infrastructure.
 * 
 * @example
 * // Using types in user service methods
 * class UserService {
 *   async updateProfile(userId: string, updates: UserProfileUpdateRequest): Promise<User> {
 *     // updates is fully typed with optional fields properly handled
 *     return await this.userRepository.update(userId, updates);
 *   }
 * 
 *   async updateRole(userId: string, roleUpdate: UserRoleUpdateRequest): Promise<User> {
 *     // roleUpdate.role is typed as valid role enum value
 *     return await this.userRepository.updateRole(userId, roleUpdate.role);
 *   }
 * }
 * 
 * @example
 * // Using types in administrative request handlers
 * const getUserList = async (req: Request<{}, {}, {}, UserQueryParams>) => {
 *   const { page, limit, role, is_active, search } = req.query; // Fully typed
 *   // Implementation here
 * };
 */

/**
 * Type definition for user profile update operations
 * 
 * Represents the structure of validated user profile update data including
 * optional username, country location, and profile picture URL. This type
 * ensures type safety for profile management operations while supporting
 * flexible update patterns and progressive profile completion.
 * 
 * @type {Object}
 * @property {string} [username] - Optional username (3-50 chars, alphanumeric, underscore, hyphen)
 * @property {string} [country_code] - Optional ISO 3166-1 alpha-2 country code (2 uppercase chars)
 * @property {string} [profile_picture_url] - Optional profile picture URL (valid URL format, max 255 chars)
 */
export type UserProfileUpdateRequest = z.infer<typeof UserProfileUpdateSchema>;

/**
 * Type definition for administrative user role update operations
 * 
 * Represents the structure of validated role update data for administrative
 * user management. This type ensures type safety for role assignment operations
 * while enforcing security boundaries and preventing unauthorized privilege
 * escalation.
 * 
 * @type {Object}
 * @property {'student' | 'content_creator' | 'admin'} role - User role for platform access control
 */
export type UserRoleUpdateRequest = z.infer<typeof UserRoleUpdateSchema>;

/**
 * Type definition for user discovery and management query parameters
 * 
 * Represents the structure of validated query parameters for user listing,
 * search, and administrative management operations. This type ensures type
 * safety for user discovery operations while supporting comprehensive filtering
 * and pagination capabilities.
 * 
 * @type {Object}
 * @property {number} page - Page number for pagination (minimum 1, default: 1)
 * @property {number} limit - Results per page (1-100, default: 20)
 * @property {string} [sortBy] - Optional field name for sorting
 * @property {'asc' | 'desc'} sortOrder - Sort direction (default: 'asc')
 * @property {'student' | 'content_creator' | 'admin'} [role] - Optional role filter
 * @property {boolean} [is_active] - Optional activity status filter
 * @property {string} [search] - Optional text search query
 */
export type UserQueryParams = z.infer<typeof UserQuerySchema>;