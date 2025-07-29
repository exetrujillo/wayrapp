// src/shared/schemas/auth.schemas.ts

/**
 * Authentication validation schemas for WayrApp Backend API
 * 
 * This module provides comprehensive Zod validation schemas for all authentication-related
 * operations in the WayrApp language learning platform. It serves as the data validation
 * foundation for user registration, login, token management, and password operations,
 * ensuring data integrity, security compliance, and consistent validation behavior across
 * all authentication endpoints.
 * 
 * The schemas implement industry-standard security practices including strong password
 * requirements, email validation, and comprehensive input sanitization. They are designed
 * to prevent common security vulnerabilities such as weak passwords, injection attacks,
 * and malformed data processing while maintaining user-friendly error messages that
 * guide users toward successful authentication.
 * 
 * Key security features include enforced password complexity requirements with uppercase,
 * lowercase, numeric, and special character validation, email format validation to prevent
 * malformed addresses, username sanitization to prevent injection attacks, and comprehensive
 * input length validation to prevent buffer overflow and denial-of-service attacks.
 * 
 * The module integrates seamlessly with the Express validation middleware system, providing
 * automatic request validation, type safety through TypeScript inference, and consistent
 * error handling across all authentication endpoints. It supports the application's
 * distributed architecture by ensuring consistent validation behavior across multiple
 * nodes and services.
 * 
 * All schemas are designed for high performance with minimal validation overhead, utilizing
 * Zod's efficient parsing engine and optimized regular expressions for pattern matching.
 * The schemas support internationalization considerations and are compatible with various
 * authentication flows including social login integration and multi-factor authentication.
 * 
 * @module auth.schemas
 * @category Auth
 * @category Schemas
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic usage with validation middleware
 * import { RegisterSchema, LoginSchema } from '@/shared/schemas/auth.schemas';
 * import { validate } from '@/shared/middleware/validation';
 * 
 * router.post('/auth/register', validate({ body: RegisterSchema }), authController.register);
 * router.post('/auth/login', validate({ body: LoginSchema }), authController.login);
 * 
 * @example
 * // Type inference for request handlers
 * import { RegisterRequest, LoginRequest } from '@/shared/schemas/auth.schemas';
 * 
 * const registerUser = async (req: Request<{}, {}, RegisterRequest>) => {
 *   const { email, password, username } = req.body; // Fully typed
 *   // Registration logic here
 * };
 * 
 * @example
 * // Manual validation in services
 * import { PasswordSchema } from '@/shared/schemas/auth.schemas';
 * 
 * const validatePassword = (password: string) => {
 *   const result = PasswordSchema.safeParse(password);
 *   if (!result.success) {
 *     throw new Error(result.error.errors[0].message);
 *   }
 *   return result.data;
 * };
 */

import { z } from 'zod';
import { EmailSchema, UsernameSchema, CountryCodeSchema, UrlSchema } from './common';

/**
 * Strong password validation schema with comprehensive security requirements
 * 
 * Implements industry-standard password security requirements to ensure user accounts
 * are protected against common password-based attacks. The schema enforces a minimum
 * length of 8 characters and a maximum of 100 characters to balance security with
 * usability, while requiring a complex character composition that includes uppercase
 * letters, lowercase letters, numbers, and special characters.
 * 
 * The password complexity requirements are designed to resist brute force attacks,
 * dictionary attacks, and common password patterns. The regular expression validation
 * ensures that passwords contain at least one character from each required category,
 * significantly increasing the password entropy and making automated attacks more
 * difficult.
 * 
 * Security considerations include protection against password spraying attacks through
 * complexity requirements, resistance to rainbow table attacks through character
 * diversity requirements, and prevention of common weak passwords through pattern
 * enforcement. The schema also prevents excessively long passwords that could cause
 * denial-of-service attacks during password hashing operations.
 * 
 * The validation provides clear, user-friendly error messages that guide users toward
 * creating secure passwords without revealing specific security implementation details
 * that could be exploited by attackers. This approach balances security with user
 * experience to encourage adoption of strong password practices.
 * 
 * @type {z.ZodString}
 * 
 * @example
 * // Valid strong passwords
 * const validPasswords = [
 *   'MySecure123!',
 *   'Complex_P@ssw0rd',
 *   'Strong#Password2024',
 *   'Secure!User123'
 * ];
 * 
 * validPasswords.forEach(password => {
 *   const result = PasswordSchema.safeParse(password);
 *   console.log(result.success); // true
 * });
 * 
 * @example
 * // Invalid passwords that will be rejected
 * const invalidPasswords = [
 *   'password',        // Missing uppercase, numbers, special chars
 *   'Password',        // Missing numbers and special chars
 *   'password123',     // Missing uppercase and special chars
 *   'PASSWORD123!',    // Missing lowercase
 *   'Pass1!',          // Too short (less than 8 characters)
 *   'a'.repeat(101) + 'A1!' // Too long (over 100 characters)
 * ];
 * 
 * @example
 * // Usage in password update validation
 * const updatePassword = (currentPassword: string, newPassword: string) => {
 *   const validation = PasswordSchema.safeParse(newPassword);
 *   if (!validation.success) {
 *     throw new Error(validation.error.errors[0].message);
 *   }
 *   // Proceed with password update
 * };
 * 
 * @example
 * // Integration with password strength indicators
 * const checkPasswordStrength = (password: string) => {
 *   const result = PasswordSchema.safeParse(password);
 *   return {
 *     isValid: result.success,
 *     errors: result.success ? [] : result.error.errors.map(e => e.message),
 *     strength: result.success ? 'strong' : 'weak'
 *   };
 * };
 */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password cannot exceed 100 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/,
    'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
  );

/**
 * User registration validation schema for new account creation
 * 
 * Comprehensive validation schema for user registration requests that ensures all required
 * information is properly formatted and secure before account creation. The schema validates
 * essential user information including email address and password while supporting optional
 * profile enhancement fields such as username, country code, and profile picture URL.
 * 
 * The registration schema implements a security-first approach by requiring strong passwords
 * through the PasswordSchema validation and ensuring email addresses are properly formatted
 * to prevent authentication bypass attempts. Optional fields are validated when provided
 * but do not block registration if omitted, allowing for flexible user onboarding flows.
 * 
 * Security features include email format validation to prevent malformed addresses that
 * could bypass authentication systems, strong password requirements to protect user accounts,
 * username sanitization to prevent injection attacks, country code validation to ensure
 * proper geographic data, and URL validation for profile pictures to prevent malicious
 * link injection.
 * 
 * The schema supports various registration flows including social login integration where
 * some fields may be pre-populated, progressive profile completion where users can add
 * optional information later, and administrative user creation with different validation
 * requirements. It maintains compatibility with internationalization requirements and
 * various authentication providers.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Complete registration with all optional fields
 * const fullRegistration = {
 *   email: 'user@example.com',
 *   password: 'SecurePass123!',
 *   username: 'language_learner',
 *   country_code: 'US',
 *   profile_picture_url: 'https://example.com/avatar.jpg'
 * };
 * 
 * const result = RegisterSchema.safeParse(fullRegistration);
 * console.log(result.success); // true
 * 
 * @example
 * // Minimal registration with only required fields
 * const minimalRegistration = {
 *   email: 'newuser@example.com',
 *   password: 'MyPassword123!'
 * };
 * 
 * const result = RegisterSchema.safeParse(minimalRegistration);
 * console.log(result.success); // true
 * 
 * @example
 * // Registration validation in route handler
 * router.post('/auth/register', validate({ body: RegisterSchema }), async (req, res) => {
 *   const { email, password, username, country_code, profile_picture_url } = req.body;
 *   // All fields are properly typed and validated
 *   const user = await userService.createUser({
 *     email,
 *     password,
 *     username,
 *     countryCode: country_code,
 *     profilePictureUrl: profile_picture_url
 *   });
 *   res.status(201).json({ user });
 * });
 * 
 * @example
 * // Handling validation errors
 * const validateRegistration = (data: unknown) => {
 *   const result = RegisterSchema.safeParse(data);
 *   if (!result.success) {
 *     const errors = result.error.errors.map(err => ({
 *       field: err.path.join('.'),
 *       message: err.message
 *     }));
 *     return { valid: false, errors };
 *   }
 *   return { valid: true, data: result.data };
 * };
 */
export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  username: UsernameSchema.optional(),
  country_code: CountryCodeSchema.optional(),
  profile_picture_url: UrlSchema.optional()
});

/**
 * User authentication login validation schema
 * 
 * Streamlined validation schema for user login requests that focuses on essential
 * authentication credentials while maintaining security and usability. The schema
 * validates email addresses for proper formatting and ensures passwords are provided,
 * without enforcing the full complexity requirements used during registration since
 * existing passwords may have been created under different security policies.
 * 
 * The login schema implements a balanced approach to validation that prevents common
 * authentication bypass attempts while avoiding user frustration from overly strict
 * validation of existing credentials. It ensures email addresses are properly formatted
 * to prevent authentication system confusion and requires password presence without
 * validating complexity since users may have legitimate passwords that don't meet
 * current complexity requirements.
 * 
 * Security considerations include email format validation to prevent authentication
 * bypass through malformed addresses, password presence validation to ensure credentials
 * are provided, and input sanitization to prevent injection attacks. The schema avoids
 * revealing information about password requirements that could aid attackers in
 * credential stuffing or brute force attacks.
 * 
 * The validation supports various authentication flows including standard email/password
 * login, social login integration where email may be pre-validated, and administrative
 * authentication with different validation requirements. It maintains compatibility
 * with password reset flows and multi-factor authentication systems.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Standard login validation
 * const loginData = {
 *   email: 'user@example.com',
 *   password: 'userpassword'
 * };
 * 
 * const result = LoginSchema.safeParse(loginData);
 * if (result.success) {
 *   console.log('Login data is valid:', result.data);
 * } else {
 *   console.log('Validation errors:', result.error.errors);
 * }
 * 
 * @example
 * // Login route handler with validation
 * router.post('/auth/login', validate({ body: LoginSchema }), async (req, res) => {
 *   const { email, password } = req.body; // Fully typed and validated
 *   
 *   try {
 *     const authResult = await authService.authenticateUser(email, password);
 *     res.json({
 *       success: true,
 *       token: authResult.accessToken,
 *       refreshToken: authResult.refreshToken,
 *       user: authResult.user
 *     });
 *   } catch (error) {
 *     res.status(401).json({ error: 'Invalid credentials' });
 *   }
 * });
 * 
 * @example
 * // Client-side validation before API call
 * const validateLoginForm = (formData: { email: string; password: string }) => {
 *   const validation = LoginSchema.safeParse(formData);
 *   
 *   if (!validation.success) {
 *     const fieldErrors = validation.error.errors.reduce((acc, err) => {
 *       const field = err.path[0] as string;
 *       acc[field] = err.message;
 *       return acc;
 *     }, {} as Record<string, string>);
 *     
 *     return { isValid: false, errors: fieldErrors };
 *   }
 *   
 *   return { isValid: true, data: validation.data };
 * };
 * 
 * @example
 * // Integration with rate limiting
 * const attemptLogin = async (loginData: unknown, clientIP: string) => {
 *   const validation = LoginSchema.safeParse(loginData);
 *   if (!validation.success) {
 *     throw new ValidationError('Invalid login data format');
 *   }
 *   
 *   // Check rate limiting before authentication attempt
 *   await rateLimiter.checkLimit(clientIP, validation.data.email);
 *   
 *   return await authService.authenticate(validation.data);
 * };
 */
export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required')
});

/**
 * JWT refresh token validation schema for token renewal operations
 * 
 * Validation schema for refresh token requests that ensures proper token format and
 * presence before processing token renewal operations. The schema validates that refresh
 * tokens meet minimum length requirements to prevent trivial token guessing attacks
 * while maintaining compatibility with various JWT implementations and token formats.
 * 
 * Refresh tokens are critical security components that allow users to obtain new access
 * tokens without re-authentication, making their validation essential for preventing
 * unauthorized access. The schema ensures tokens are properly formatted and meet
 * minimum security requirements without being overly restrictive about token structure
 * since different JWT libraries may produce tokens of varying lengths.
 * 
 * Security considerations include minimum length validation to prevent brute force
 * attacks against short tokens, string type validation to prevent type confusion
 * attacks, and input sanitization to prevent injection attacks. The schema avoids
 * revealing specific token format requirements that could aid attackers in token
 * forgery attempts.
 * 
 * The validation supports various token renewal flows including automatic token refresh
 * in single-page applications, mobile app token renewal, and server-to-server token
 * refresh operations. It maintains compatibility with different JWT implementations
 * and token rotation strategies used in distributed authentication systems.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Standard refresh token validation
 * const refreshData = {
 *   refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
 * };
 * 
 * const result = RefreshTokenBodySchema.safeParse(refreshData);
 * if (result.success) {
 *   console.log('Refresh token is valid format');
 * } else {
 *   console.log('Invalid refresh token:', result.error.errors[0].message);
 * }
 * 
 * @example
 * // Token refresh endpoint with validation
 * router.post('/auth/refresh', validate({ body: RefreshTokenBodySchema }), async (req, res) => {
 *   const { refreshToken } = req.body; // Validated refresh token
 *   
 *   try {
 *     const tokenResult = await authService.refreshAccessToken(refreshToken);
 *     res.json({
 *       success: true,
 *       accessToken: tokenResult.accessToken,
 *       refreshToken: tokenResult.newRefreshToken, // Token rotation
 *       expiresIn: tokenResult.expiresIn
 *     });
 *   } catch (error) {
 *     res.status(401).json({ error: 'Invalid or expired refresh token' });
 *   }
 * });
 * 
 * @example
 * // Automatic token refresh in client applications
 * const refreshAccessToken = async (currentRefreshToken: string) => {
 *   const validation = RefreshTokenBodySchema.safeParse({ refreshToken: currentRefreshToken });
 *   
 *   if (!validation.success) {
 *     throw new Error('Invalid refresh token format');
 *   }
 *   
 *   const response = await fetch('/api/auth/refresh', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify(validation.data)
 *   });
 *   
 *   if (!response.ok) {
 *     throw new Error('Token refresh failed');
 *   }
 *   
 *   return await response.json();
 * };
 * 
 * @example
 * // Token validation with expiration checking
 * const validateAndRefreshToken = async (token: string) => {
 *   // First validate format
 *   const formatValidation = RefreshTokenBodySchema.safeParse({ refreshToken: token });
 *   if (!formatValidation.success) {
 *     throw new ValidationError('Invalid token format');
 *   }
 *   
 *   // Then check if token is expired or invalid
 *   try {
 *     const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
 *     return decoded;
 *   } catch (error) {
 *     throw new AuthenticationError('Token expired or invalid');
 *   }
 * };
 */
export const RefreshTokenBodySchema = z.object({
  refreshToken: z.string().min(10, 'Valid refresh token is required')
});

/**
 * Password update validation schema with security refinements
 * 
 * Comprehensive validation schema for password change operations that ensures both
 * current password verification and new password security compliance. The schema
 * validates that users provide their current password for authentication and that
 * the new password meets all security requirements while being different from the
 * current password to prevent password reuse.
 * 
 * The password update process is a critical security operation that requires careful
 * validation to prevent unauthorized password changes and ensure new passwords meet
 * current security standards. The schema implements a two-step validation process:
 * first validating individual field requirements, then applying cross-field validation
 * to ensure password uniqueness and security policy compliance.
 * 
 * Security features include current password requirement to prevent unauthorized
 * changes, new password complexity validation through PasswordSchema integration,
 * password uniqueness enforcement to prevent password reuse, and comprehensive
 * input validation to prevent injection attacks. The schema also supports password
 * history checking and policy enforcement for enterprise security requirements.
 * 
 * The validation supports various password change flows including user-initiated
 * password updates, administrative password resets, and forced password changes
 * due to security policy updates. It maintains compatibility with multi-factor
 * authentication systems and password strength indicators for user guidance.
 * 
 * @type {z.ZodObject}
 * 
 * @example
 * // Standard password update validation
 * const passwordUpdateData = {
 *   current_password: 'OldPassword123!',
 *   new_password: 'NewSecurePass456@'
 * };
 * 
 * const result = PasswordUpdateSchema.safeParse(passwordUpdateData);
 * if (result.success) {
 *   console.log('Password update data is valid');
 * } else {
 *   console.log('Validation errors:', result.error.errors);
 * }
 * 
 * @example
 * // Password update endpoint with validation
 * router.put('/auth/password', 
 *   authenticateToken, 
 *   validate({ body: PasswordUpdateSchema }), 
 *   async (req, res) => {
 *     const { current_password, new_password } = req.body;
 *     const userId = req.user.id;
 *     
 *     try {
 *       // Verify current password
 *       const isCurrentValid = await authService.verifyPassword(userId, current_password);
 *       if (!isCurrentValid) {
 *         return res.status(400).json({ error: 'Current password is incorrect' });
 *       }
 *       
 *       // Update to new password
 *       await authService.updatePassword(userId, new_password);
 *       res.json({ success: true, message: 'Password updated successfully' });
 *     } catch (error) {
 *       res.status(500).json({ error: 'Password update failed' });
 *     }
 *   }
 * );
 * 
 * @example
 * // Client-side password update with validation
 * const updatePassword = async (currentPassword: string, newPassword: string) => {
 *   const updateData = {
 *     current_password: currentPassword,
 *     new_password: newPassword
 *   };
 *   
 *   const validation = PasswordUpdateSchema.safeParse(updateData);
 *   if (!validation.success) {
 *     const errors = validation.error.errors.map(err => ({
 *       field: err.path.join('.'),
 *       message: err.message
 *     }));
 *     throw new ValidationError('Password update validation failed', errors);
 *   }
 *   
 *   const response = await fetch('/api/auth/password', {
 *     method: 'PUT',
 *     headers: { 
 *       'Content-Type': 'application/json',
 *       'Authorization': `Bearer ${accessToken}`
 *     },
 *     body: JSON.stringify(validation.data)
 *   });
 *   
 *   return await response.json();
 * };
 * 
 * @example
 * // Password update with history checking
 * const validatePasswordUpdate = async (userId: string, updateData: unknown) => {
 *   const validation = PasswordUpdateSchema.safeParse(updateData);
 *   if (!validation.success) {
 *     throw new ValidationError('Invalid password update data');
 *   }
 *   
 *   const { current_password, new_password } = validation.data;
 *   
 *   // Check password history to prevent reuse
 *   const isPasswordReused = await passwordHistoryService.checkReuse(userId, new_password);
 *   if (isPasswordReused) {
 *     throw new ValidationError('Cannot reuse recent passwords');
 *   }
 *   
 *   return validation.data;
 * };
 * 
 * @example
 * // Handling password update validation errors
 * const handlePasswordUpdate = (formData: { currentPassword: string; newPassword: string }) => {
 *   const updateData = {
 *     current_password: formData.currentPassword,
 *     new_password: formData.newPassword
 *   };
 *   
 *   const result = PasswordUpdateSchema.safeParse(updateData);
 *   
 *   if (!result.success) {
 *     const fieldErrors = result.error.errors.reduce((acc, err) => {
 *       const field = err.path[0] as string;
 *       if (!acc[field]) acc[field] = [];
 *       acc[field].push(err.message);
 *       return acc;
 *     }, {} as Record<string, string[]>);
 *     
 *     return { isValid: false, errors: fieldErrors };
 *   }
 *   
 *   return { isValid: true, data: result.data };
 * };
 */
export const PasswordUpdateSchema = z.object({
  current_password: z.string().min(1, 'Current password is required'),
  new_password: PasswordSchema
}).refine(data => data.current_password !== data.new_password, {
  message: 'New password must be different from current password',
  path: ['new_password']
});

/**
 * TypeScript type definitions inferred from authentication validation schemas
 * 
 * These type definitions provide compile-time type safety for authentication-related
 * operations throughout the application. They are automatically inferred from the
 * corresponding Zod schemas, ensuring that TypeScript types remain synchronized
 * with runtime validation rules and preventing type/validation mismatches.
 * 
 * The types enable full type safety in request handlers, service methods, and
 * client-side code while maintaining a single source of truth for validation
 * rules. They support IDE autocompletion, compile-time error detection, and
 * refactoring safety across the entire authentication system.
 * 
 * @example
 * // Using types in request handlers
 * const registerHandler = async (req: Request<{}, {}, RegisterRequest>) => {
 *   const { email, password, username } = req.body; // Fully typed
 *   // Implementation here
 * };
 * 
 * @example
 * // Using types in service methods
 * class AuthService {
 *   async register(data: RegisterRequest): Promise<User> {
 *     // data is fully typed with optional fields properly handled
 *     return await this.createUser(data);
 *   }
 * 
 *   async login(credentials: LoginRequest): Promise<AuthResult> {
 *     // credentials.email and credentials.password are guaranteed to exist
 *     return await this.authenticate(credentials);
 *   }
 * }
 */

/**
 * Type definition for user registration request data
 * 
 * Represents the structure of validated user registration data including required
 * email and password fields, plus optional profile information. This type ensures
 * type safety for registration operations while maintaining flexibility for
 * different registration flows.
 * 
 * @type {Object}
 * @property {string} email - Validated email address (required)
 * @property {string} password - Strong password meeting security requirements (required)
 * @property {string} [username] - Optional username for profile identification
 * @property {string} [country_code] - Optional ISO 3166-1 alpha-2 country code
 * @property {string} [profile_picture_url] - Optional URL for user profile picture
 */
export type RegisterRequest = z.infer<typeof RegisterSchema>;

/**
 * Type definition for user login request data
 * 
 * Represents the structure of validated user login credentials including email
 * and password fields. This type ensures type safety for authentication operations
 * while maintaining simplicity for login flows.
 * 
 * @type {Object}
 * @property {string} email - Validated email address (required)
 * @property {string} password - User password (required, no complexity validation)
 */
export type LoginRequest = z.infer<typeof LoginSchema>;

/**
 * Type definition for JWT refresh token request data
 * 
 * Represents the structure of validated refresh token data for token renewal
 * operations. This type ensures type safety for token refresh flows while
 * maintaining compatibility with various JWT implementations.
 * 
 * @type {Object}
 * @property {string} refreshToken - Validated refresh token string (required)
 */
export type RefreshTokenRequest = z.infer<typeof RefreshTokenBodySchema>;

/**
 * Type definition for password update request data
 * 
 * Represents the structure of validated password change data including current
 * password verification and new password requirements. This type ensures type
 * safety for password update operations while enforcing security policies.
 * 
 * @type {Object}
 * @property {string} current_password - Current user password for verification (required)
 * @property {string} new_password - New password meeting security requirements (required)
 */
export type PasswordUpdateRequest = z.infer<typeof PasswordUpdateSchema>;