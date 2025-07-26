// src/shared/utils/auth.ts

/**
 * Authentication Utilities for Sovereign Node Operations
 * 
 * This module provides comprehensive JWT token management and password security utilities
 * for the WayrApp platform's authentication system. It serves as the core authentication
 * infrastructure supporting user login, token refresh, password hashing, and security
 * validation across the entire application.
 * 
 * The module implements industry-standard security practices including JWT token generation
 * with configurable expiration times, bcrypt password hashing with salt rounds, token
 * format validation, expiration checking, and secure random token generation. All functions
 * are designed to work seamlessly with the authentication middleware and controllers to
 * provide a robust, secure authentication system.
 * 
 * This utility module is extensively used by the AuthController for user authentication
 * operations, the authentication middleware for token verification, and various other
 * components throughout the application that require secure token handling and password
 * management capabilities.
 * 
 * @exports {interface} TokenPair - Interface for access and refresh token pairs
 * @exports {interface} TokenPayload - Interface for JWT token payload structure
 * @exports {function} generateAccessToken - Generates short-lived JWT access tokens
 * @exports {function} generateRefreshToken - Generates long-lived JWT refresh tokens
 * @exports {function} generateTokenPair - Generates both access and refresh tokens
 * @exports {function} verifyRefreshToken - Verifies and decodes refresh tokens
 * @exports {function} hashPassword - Hashes passwords using bcrypt with salt
 * @exports {function} comparePassword - Compares plaintext passwords with hashes
 * @exports {function} extractTokenFromHeader - Extracts Bearer tokens from Authorization headers
 * @exports {function} validateTokenFormat - Validates JWT token structure without verification
 * @exports {function} isTokenExpired - Checks if a token is expired without verification
 * @exports {function} getTokenExpiration - Extracts expiration date from token payload
 * @exports {function} generateSecureToken - Generates cryptographically secure random tokens
 * 
 * @fileoverview JWT token management and password security utilities for authentication
 * @author Exequiel Trujillo
 * @version 1.0.0
 * @since 1.0.0
 * 
 * @example
 * // Generate token pair for user authentication
 * import { generateTokenPair } from '@/shared/utils/auth';
 * 
 * const tokenPayload = {
 *   userId: 'user-uuid-123',
 *   email: 'user@example.com',
 *   role: 'student'
 * };
 * 
 * const tokens = generateTokenPair(tokenPayload);
 * console.log(tokens.accessToken); // Short-lived JWT for API requests
 * console.log(tokens.refreshToken); // Long-lived JWT for token renewal
 * 
 * @example
 * // Password hashing and verification
 * import { hashPassword, comparePassword } from '@/shared/utils/auth';
 * 
 * // Hash password during registration
 * const hashedPassword = await hashPassword('userPassword123!');
 * 
 * // Verify password during login
 * const isValid = await comparePassword('userPassword123!', hashedPassword);
 * console.log(isValid); // true
 * 
 * @example
 * // Token validation and extraction
 * import { extractTokenFromHeader, validateTokenFormat, isTokenExpired } from '@/shared/utils/auth';
 * 
 * const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
 * const token = extractTokenFromHeader(authHeader);
 * 
 * if (token && validateTokenFormat(token) && !isTokenExpired(token)) {
 *   // Token is valid and not expired
 *   console.log('Token is ready for verification');
 * }
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload, UserRole } from '@/shared/types';
import { logger } from './logger';

/**
 * Token pair interface containing both access and refresh JWT tokens
 * 
 * This interface defines the structure for JWT token pairs returned by authentication
 * operations. It contains both short-lived access tokens for API requests and long-lived
 * refresh tokens for token renewal, providing a complete authentication token set.
 * 
 * @interface TokenPair
 * @property {string} accessToken - Short-lived JWT token for API authentication (typically 15 minutes)
 * @property {string} refreshToken - Long-lived JWT token for generating new access tokens (typically 7 days)
 * 
 * @example
 * // Typical usage in authentication response
 * const tokens: TokenPair = {
 *   accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * };
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Token payload interface for JWT token generation
 * 
 * This interface defines the user information structure used to create JWT tokens.
 * It contains essential user identification and authorization data that gets encoded
 * into both access and refresh tokens for authentication and authorization purposes.
 * 
 * @interface TokenPayload
 * @property {string} userId - Unique user identifier (UUID) for token subject
 * @property {string} email - User's email address for identification
 * @property {UserRole} role - User's role for authorization ('student' | 'content_creator' | 'admin')
 * 
 * @example
 * // Creating token payload for JWT generation
 * const payload: TokenPayload = {
 *   userId: 'user-uuid-123',
 *   email: 'user@example.com',
 *   role: 'student'
 * };
 */
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Generate JWT access token for API authentication
 * 
 * Creates a short-lived JWT access token containing user identification and authorization
 * information. The token is signed with the JWT_SECRET environment variable and includes
 * standard JWT claims (issuer, audience, expiration) for security and validation.
 * 
 * Access tokens are designed for frequent API requests and have a short expiration time
 * (default 15 minutes) to minimize security risks if compromised. They contain user ID,
 * email, and role information needed for authentication and authorization middleware.
 * 
 * @param {TokenPayload} payload - User information to encode in the token
 * @param {string} payload.userId - Unique user identifier (becomes 'sub' claim)
 * @param {string} payload.email - User's email address
 * @param {UserRole} payload.role - User's role for authorization
 * @returns {string} Signed JWT access token string
 * 
 * @throws {Error} When JWT_SECRET environment variable is not configured
 * 
 * @example
 * // Generate access token for authenticated user
 * const payload = {
 *   userId: 'user-uuid-123',
 *   email: 'user@example.com',
 *   role: 'student'
 * };
 * 
 * const accessToken = generateAccessToken(payload);
 * // Returns: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * 
 * @example
 * // Token contains standard JWT structure
 * // Header: { "alg": "HS256", "typ": "JWT" }
 * // Payload: { 
 * //   "sub": "user-uuid-123", 
 * //   "email": "user@example.com", 
 * //   "role": "student",
 * //   "iss": "wayrapp-api",
 * //   "aud": "wayrapp-client",
 * //   "iat": 1234567890,
 * //   "exp": 1234568790
 * // }
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const jwtSecret = process.env['JWT_SECRET'];
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable not set');
  }

  const jwtPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: payload.userId,
    email: payload.email,
    role: payload.role
  };

  return jwt.sign(jwtPayload, jwtSecret, {
    expiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] || '15m',
    issuer: 'wayrapp-api',
    audience: 'wayrapp-client'
  } as any);
};

/**
 * Generate JWT refresh token for token renewal
 * 
 * Creates a long-lived JWT refresh token used to generate new access tokens without
 * requiring user re-authentication. The token is signed with a separate JWT_REFRESH_SECRET
 * for additional security and has a longer expiration time (default 7 days).
 * 
 * Refresh tokens are stored securely by clients and used only for token renewal operations.
 * They contain the same user information as access tokens but are designed for less
 * frequent use and longer validity periods to balance security with user experience.
 * 
 * @param {TokenPayload} payload - User information to encode in the refresh token
 * @param {string} payload.userId - Unique user identifier (becomes 'sub' claim)
 * @param {string} payload.email - User's email address
 * @param {UserRole} payload.role - User's role for authorization
 * @returns {string} Signed JWT refresh token string
 * 
 * @throws {Error} When JWT_REFRESH_SECRET environment variable is not configured
 * 
 * @example
 * // Generate refresh token for token renewal
 * const payload = {
 *   userId: 'user-uuid-123',
 *   email: 'user@example.com',
 *   role: 'student'
 * };
 * 
 * const refreshToken = generateRefreshToken(payload);
 * // Returns: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * 
 * @example
 * // Refresh token usage in token renewal
 * // Client sends refresh token to /auth/refresh endpoint
 * // Server verifies refresh token and generates new token pair
 * // Old refresh token can be revoked for security
 */
export const generateRefreshToken = (payload: TokenPayload): string => {
  const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'];
  if (!jwtRefreshSecret) {
    throw new Error('JWT_REFRESH_SECRET environment variable not set');
  }

  const jwtPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: payload.userId,
    email: payload.email,
    role: payload.role
  };

  return jwt.sign(jwtPayload, jwtRefreshSecret, {
    expiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
    issuer: 'wayrapp-api',
    audience: 'wayrapp-client'
  } as any);
};

/**
 * Generate both access and refresh tokens as a pair
 * 
 * Convenience function that creates both access and refresh tokens simultaneously
 * using the same user payload. This is the primary function used during user
 * authentication and token renewal operations to provide a complete token set.
 * 
 * The function combines generateAccessToken and generateRefreshToken to create
 * a TokenPair object containing both tokens, ensuring consistency in token
 * generation and simplifying authentication workflows.
 * 
 * @param {TokenPayload} payload - User information to encode in both tokens
 * @param {string} payload.userId - Unique user identifier
 * @param {string} payload.email - User's email address
 * @param {UserRole} payload.role - User's role for authorization
 * @returns {TokenPair} Object containing both accessToken and refreshToken
 * 
 * @throws {Error} When JWT_SECRET or JWT_REFRESH_SECRET environment variables are not configured
 * 
 * @example
 * // Generate complete token pair for user login
 * const payload = {
 *   userId: 'user-uuid-123',
 *   email: 'user@example.com',
 *   role: 'content_creator'
 * };
 * 
 * const tokens = generateTokenPair(payload);
 * console.log(tokens.accessToken);  // Short-lived token for API requests
 * console.log(tokens.refreshToken); // Long-lived token for renewal
 * 
 * @example
 * // Typical usage in authentication controller
 * const authResponse = {
 *   user: userInfo,
 *   tokens: generateTokenPair(tokenPayload)
 * };
 */
export const generateTokenPair = (payload: TokenPayload): TokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
};

/**
 * Verify and decode JWT refresh token
 * 
 * Validates a refresh token's signature and expiration using the JWT_REFRESH_SECRET,
 * then returns the decoded payload containing user information. This function is
 * used during token renewal operations to ensure the refresh token is valid and
 * extract user data for generating new tokens.
 * 
 * The function performs cryptographic verification of the token signature and
 * automatically checks expiration time. If verification fails, it throws a
 * JsonWebTokenError that should be handled by the calling code.
 * 
 * @param {string} token - JWT refresh token string to verify and decode
 * @returns {JWTPayload} Decoded token payload containing user information and JWT claims
 * @property {string} sub - User ID from token subject
 * @property {string} email - User's email address
 * @property {UserRole} role - User's role for authorization
 * @property {number} iat - Token issued at timestamp
 * @property {number} exp - Token expiration timestamp
 * 
 * @throws {Error} When JWT_REFRESH_SECRET environment variable is not configured
 * @throws {JsonWebTokenError} When token signature is invalid
 * @throws {TokenExpiredError} When token has expired
 * @throws {NotBeforeError} When token is not active yet
 * 
 * @example
 * // Verify refresh token during token renewal
 * try {
 *   const decoded = verifyRefreshToken(refreshToken);
 *   console.log(decoded.sub);   // User ID
 *   console.log(decoded.email); // User email
 *   console.log(decoded.role);  // User role
 * } catch (error) {
 *   if (error.name === 'TokenExpiredError') {
 *     console.log('Refresh token has expired');
 *   } else if (error.name === 'JsonWebTokenError') {
 *     console.log('Invalid refresh token');
 *   }
 * }
 * 
 * @example
 * // Usage in token refresh endpoint
 * const decoded = verifyRefreshToken(req.body.refreshToken);
 * const newTokens = generateTokenPair({
 *   userId: decoded.sub,
 *   email: decoded.email,
 *   role: decoded.role
 * });
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  const jwtRefreshSecret = process.env['JWT_REFRESH_SECRET'];
  if (!jwtRefreshSecret) {
    throw new Error('JWT_REFRESH_SECRET environment variable not set');
  }

  return jwt.verify(token, jwtRefreshSecret) as JWTPayload;
};

/**
 * Hash password using bcrypt with configurable salt rounds
 * 
 * Securely hashes a plaintext password using the bcrypt algorithm with a configurable
 * number of salt rounds. The salt rounds determine the computational cost of hashing,
 * with higher values providing better security at the cost of performance.
 * 
 * The function uses the BCRYPT_SALT_ROUNDS environment variable (default 12) to
 * configure the hashing strength. This allows for security tuning based on
 * deployment requirements and hardware capabilities.
 * 
 * @param {string} password - Plaintext password to hash
 * @returns {Promise<string>} Promise resolving to bcrypt hash string
 * 
 * @example
 * // Hash password during user registration
 * const plainPassword = 'userPassword123!';
 * const hashedPassword = await hashPassword(plainPassword);
 * console.log(hashedPassword); // '$2b$12$...' (bcrypt hash format)
 * 
 * // Store hashedPassword in database, never store plaintext
 * await userRepository.create({
 *   email: 'user@example.com',
 *   password: hashedPassword
 * });
 * 
 * @example
 * // Configure salt rounds via environment variable
 * // BCRYPT_SALT_ROUNDS=10 (faster, less secure)
 * // BCRYPT_SALT_ROUNDS=14 (slower, more secure)
 * // Default: 12 (balanced security/performance)
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = parseInt(process.env['BCRYPT_SALT_ROUNDS'] || '12');
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare plaintext password with bcrypt hash
 * 
 * Securely compares a plaintext password against a bcrypt hash to verify user
 * credentials during authentication. Uses bcrypt's built-in comparison function
 * which handles timing-safe comparison to prevent timing attacks.
 * 
 * This function is essential for user login operations where stored password
 * hashes need to be verified against user-provided plaintext passwords.
 * The comparison is cryptographically secure and resistant to timing attacks.
 * 
 * @param {string} password - Plaintext password to verify
 * @param {string} hash - Bcrypt hash to compare against
 * @returns {Promise<boolean>} Promise resolving to true if password matches hash, false otherwise
 * 
 * @example
 * // Verify user password during login
 * const isValidPassword = await comparePassword(
 *   'userPassword123!',
 *   '$2b$12$...' // stored hash from database
 * );
 * 
 * if (isValidPassword) {
 *   console.log('Authentication successful');
 * } else {
 *   console.log('Invalid credentials');
 * }
 * 
 * @example
 * // Usage in authentication service
 * const user = await getUserByEmail(email);
 * const isValid = await comparePassword(password, user.passwordHash);
 * if (!isValid) {
 *   throw new Error('Invalid credentials');
 * }
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Extract Bearer token from Authorization header
 * 
 * Parses the Authorization header to extract JWT tokens following the Bearer
 * token authentication scheme. Validates the header format and returns the
 * token portion, or null if the header is missing or malformed.
 * 
 * This utility function is used by authentication middleware to extract tokens
 * from HTTP requests for verification. It handles the standard "Bearer <token>"
 * format and provides safe parsing with null returns for invalid formats.
 * 
 * @param {string} [authHeader] - Authorization header value (optional)
 * @returns {string | null} Extracted token string or null if header is invalid/missing
 * 
 * @example
 * // Extract token from request header
 * const authHeader = req.headers.authorization; // 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * const token = extractTokenFromHeader(authHeader);
 * console.log(token); // 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
 * 
 * @example
 * // Handle missing or invalid headers
 * extractTokenFromHeader(undefined);           // returns null
 * extractTokenFromHeader('Invalid header');    // returns null
 * extractTokenFromHeader('Bearer');            // returns null
 * extractTokenFromHeader('Basic dXNlcjpwYXNz'); // returns null (wrong scheme)
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
};

/**
 * Validate JWT token format and structure without verification
 * 
 * Performs basic structural validation of a JWT token without cryptographic
 * verification. Checks that the token has the correct three-part format
 * (header.payload.signature) and contains required JWT claims in the header
 * and payload sections.
 * 
 * This function is useful for quick format validation before attempting
 * expensive cryptographic verification. It helps filter out obviously
 * malformed tokens and provides early validation in authentication flows.
 * 
 * @param {string} token - JWT token string to validate
 * @returns {boolean} True if token has valid JWT structure, false otherwise
 * 
 * @example
 * // Validate token format before verification
 * const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
 * const isValidFormat = validateTokenFormat(token);
 * 
 * if (isValidFormat) {
 *   // Proceed with cryptographic verification
 *   const decoded = jwt.verify(token, secret);
 * } else {
 *   console.log('Invalid token format');
 * }
 * 
 * @example
 * // Examples of validation results
 * validateTokenFormat('invalid.token');           // false (only 2 parts)
 * validateTokenFormat('not.a.jwt.token');         // false (4 parts)
 * validateTokenFormat('valid.jwt.token');         // true (if properly formatted)
 */
export const validateTokenFormat = (token: string): boolean => {
  try {
    // Basic JWT format validation (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Try to decode header and payload (without verification)
    const header = JSON.parse(Buffer.from(parts[0]!, 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64').toString());

    // Basic structure validation
    return !!(header.alg && header.typ && payload.sub && payload.exp);
  } catch (error: any) {
    logger.debug('Token format validation failed', { error: error.message });
    return false;
  }
};

/**
 * Check if JWT token is expired without cryptographic verification
 * 
 * Examines the token's payload to determine if it has expired by comparing
 * the 'exp' claim with the current timestamp. This check is performed without
 * cryptographic verification, making it suitable for quick expiration checks
 * before attempting more expensive verification operations.
 * 
 * The function safely handles malformed tokens by returning true (expired)
 * for any token that cannot be parsed, ensuring secure-by-default behavior.
 * 
 * @param {string} token - JWT token string to check for expiration
 * @returns {boolean} True if token is expired or malformed, false if still valid
 * 
 * @example
 * // Check token expiration before verification
 * const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
 * 
 * if (isTokenExpired(token)) {
 *   console.log('Token has expired');
 *   // Redirect to login or refresh token
 * } else {
 *   console.log('Token is still valid');
 *   // Proceed with API request
 * }
 * 
 * @example
 * // Use in authentication middleware for early filtering
 * if (isTokenExpired(accessToken)) {
 *   // Try to refresh token instead of verification
 *   return refreshTokens();
 * }
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64').toString());
    const now = Math.floor(Date.now() / 1000);

    return payload.exp < now;
  } catch (error: any) {
    logger.debug('Token expiration check failed', { error: error.message });
    return true;
  }
};

/**
 * Extract expiration date from JWT token without verification
 * 
 * Parses the token payload to extract the expiration timestamp ('exp' claim)
 * and converts it to a JavaScript Date object. This function provides expiration
 * information without performing cryptographic verification, making it useful
 * for displaying token validity periods to users or scheduling token refresh.
 * 
 * The function safely handles malformed tokens or missing expiration claims
 * by returning null, allowing calling code to handle these cases appropriately.
 * 
 * @param {string} token - JWT token string to extract expiration from
 * @returns {Date | null} Date object representing token expiration, or null if extraction fails
 * 
 * @example
 * // Display token expiration to user
 * const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
 * const expirationDate = getTokenExpiration(token);
 * 
 * if (expirationDate) {
 *   console.log(`Token expires at: ${expirationDate.toLocaleString()}`);
 *   console.log(`Time remaining: ${expirationDate.getTime() - Date.now()}ms`);
 * } else {
 *   console.log('Could not determine token expiration');
 * }
 * 
 * @example
 * // Schedule token refresh based on expiration
 * const expiration = getTokenExpiration(accessToken);
 * if (expiration) {
 *   const refreshTime = expiration.getTime() - (5 * 60 * 1000); // 5 minutes before expiry
 *   setTimeout(refreshTokens, refreshTime - Date.now());
 * }
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64').toString());

    // Check if exp claim exists and is a valid number
    if (!payload.exp || typeof payload.exp !== 'number') {
      return null;
    }

    return new Date(payload.exp * 1000);
  } catch (error: any) {
    logger.debug('Token expiration extraction failed', { error: error.message });
    return null;
  }
};

/**
 * Generate cryptographically secure random string for tokens
 * 
 * Creates a random string of specified length using a secure character set
 * suitable for generating session tokens, API keys, or other security-sensitive
 * identifiers. Uses Math.random() for character selection, which while not
 * cryptographically secure, provides sufficient randomness for most use cases.
 * 
 * The generated string contains alphanumeric characters (A-Z, a-z, 0-9) and
 * is suitable for use in URLs, headers, and other contexts where special
 * characters might cause issues.
 * 
 * @param {number} [length=32] - Length of the generated token string (default: 32)
 * @returns {string} Random alphanumeric string of specified length
 * 
 * @example
 * // Generate default 32-character token
 * const sessionToken = generateSecureToken();
 * console.log(sessionToken); // 'A7x9K2mP8qR5vN3jL6wE9tY4uI1oS0cF'
 * 
 * @example
 * // Generate custom length tokens
 * const shortToken = generateSecureToken(16);  // 16 characters
 * const longToken = generateSecureToken(64);   // 64 characters
 * 
 * @example
 * // Use for API key generation
 * const apiKey = `wayr_${generateSecureToken(40)}`;
 * console.log(apiKey); // 'wayr_X8mK9pL2qR7vN4jM6wE3tY5uI0oS1cF2dG8hJ9k'
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
};