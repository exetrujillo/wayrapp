// src/modules/users/services/tokenBlacklistService.ts

/**
 * @fileoverview Token Blacklist Service - Secure JWT refresh token revocation and management
 * 
 * @summary Manages revoked JWT refresh tokens to prevent reuse after logout and provides automated cleanup functionality.
 * 
 * @description This service acts as the core security component for JWT refresh token management in the authentication system.
 * It provides secure token revocation functionality by maintaining a persistent blacklist of revoked refresh tokens in the database.
 * When users log out, their refresh tokens are added to this blacklist to prevent unauthorized reuse. The service integrates
 * with the authentication flow to check token validity during refresh operations and includes automated cleanup of expired
 * tokens to maintain optimal database performance. This service is used by the AuthController for logout operations and
 * token refresh validation, and by the DatabaseOptimizer for periodic maintenance tasks.
 * 
 * **ARCHITECTURAL NOTE ON ACCESS TOKENS:**
 * This service intentionally focuses on blacklisting **refresh tokens** only. While
 * blacklisting access tokens would provide immediate invalidation upon logout, it
 * would require a database check on every single authenticated API request,
 * introducing significant performance overhead.
 * 
 * The security strategy is to keep access tokens short-lived (e.g., 15 minutes).
 * Revoking the refresh token prevents the user from obtaining a new session, which
 * is the most critical security measure for long-term protection. This approach
 * represents a standard industry trade-off between absolute security and performance.
 * 
 * @exports {class} TokenBlacklistService - Main service class providing token revocation and validation functionality
 * @exports {function} revokeToken - Adds a refresh token to the blacklist to prevent reuse
 * @exports {function} isTokenRevoked - Checks if a refresh token has been revoked/blacklisted
 * @exports {function} cleanupExpiredTokens - Removes expired tokens from blacklist for maintenance
 * 
 * @author Exequiel Trujillo
 * @version 1.0.0
 * @since 1.0.0
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { getTokenExpiration } from '@/shared/utils/auth';

/**
 * TokenBlacklistService - Secure JWT refresh token revocation and management
 * 
 * @class TokenBlacklistService
 * @description Provides comprehensive refresh token blacklist management for secure authentication.
 * This service handles token revocation during logout, validation during refresh operations,
 * and automated cleanup of expired tokens. Designed with performance in mind, it focuses
 * on refresh token blacklisting while keeping access tokens short-lived for optimal security-performance balance.
 * 
 * @example
 * ```typescript
 * const tokenBlacklistService = new TokenBlacklistService(prisma);
 * 
 * // Revoke a refresh token during logout
 * await tokenBlacklistService.revokeToken(refreshToken, userId);
 * 
 * // Check if token is revoked during refresh
 * const isRevoked = await tokenBlacklistService.isTokenRevoked(refreshToken);
 * if (isRevoked) {
 *   throw new Error('Token has been revoked');
 * }
 * 
 * // Periodic cleanup of expired tokens
 * const cleanedCount = await tokenBlacklistService.cleanupExpiredTokens();
 * console.log(`Cleaned up ${cleanedCount} expired tokens`);
 * ```
 */
export class TokenBlacklistService {
  /**
   * Creates a new TokenBlacklistService instance
   * 
   * @param {PrismaClient} prisma - Prisma client instance for database operations
   */
  constructor(private prisma: PrismaClient) { }

  /**
   * Adds a refresh token to the blacklist to prevent reuse after logout
   * 
   * @param {string} token - The JWT refresh token to revoke
   * @param {string} userId - The unique identifier of the user who owns the token
   * @returns {Promise<void>} Promise that resolves when token is successfully blacklisted
   * @throws {Error} Does not throw - errors are logged and handled gracefully to prevent logout failures
   * 
   * @description This method extracts the expiration time from the JWT token and stores it in the
   * revoked_tokens table. If the token format is invalid or database operation fails, the error
   * is logged but not thrown to ensure logout operations don't fail. The token expiration is
   * stored to enable efficient cleanup of expired blacklisted tokens.
   * 
   * @example
   * ```typescript
   * // Called during user logout
   * await tokenBlacklistService.revokeToken(refreshToken, 'user-123');
   * // Token is now blacklisted and cannot be used for refresh operations
   * ```
   */
  async revokeToken(token: string, userId: string): Promise<void> {
    try {
      // Get token expiration time
      const expiresAt = getTokenExpiration(token);
      if (!expiresAt) {
        logger.warn('Failed to revoke token - invalid token format', { userId });
        return;
      }

      // Store token in blacklist
      await this.prisma.revokedToken.create({
        data: {
          token,
          userId,
          expiresAt
        }
      });

      logger.info('Token revoked successfully', { userId });
    } catch (error) {
      logger.error('Error revoking token', { error, userId });
      // We don't throw here to prevent logout failures
    }
  }

  /**
   * Checks if a refresh token has been revoked and is present in the blacklist
   * 
   * @param {string} token - The JWT refresh token to check for revocation status
   * @returns {Promise<boolean>} Promise resolving to true if token is revoked, false if valid or check fails
   * @throws {Error} Does not throw - errors are logged and method returns false to prevent blocking legitimate requests
   * 
   * @description This method queries the revoked_tokens table to determine if a token has been blacklisted.
   * Used during token refresh operations to validate that the refresh token is still valid. If the database
   * query fails, the method returns false (assumes token is valid) to prevent legitimate users from being
   * blocked due to temporary database issues. This fail-open approach prioritizes availability over security
   * in edge cases.
   * 
   * @example
   * ```typescript
   * // Called during token refresh validation
   * const isRevoked = await tokenBlacklistService.isTokenRevoked(refreshToken);
   * if (isRevoked) {
   *   throw new AppError('Token has been revoked', 401, 'AUTHENTICATION_ERROR');
   * }
   * // Proceed with token refresh if not revoked
   * ```
   */
  async isTokenRevoked(token: string): Promise<boolean> {
    try {
      const revokedToken = await this.prisma.revokedToken.findUnique({
        where: { token }
      });

      return !!revokedToken;
    } catch (error) {
      logger.error('Error checking token revocation status', { error });
      // If we can't check, assume it's not revoked to prevent blocking legitimate requests
      return false;
    }
  }

  /**
   * Removes expired tokens from the blacklist to maintain optimal database performance
   * 
   * @returns {Promise<number>} Promise resolving to the number of expired tokens removed from the blacklist
   * @throws {Error} Does not throw - errors are logged and method returns 0 on failure
   * 
   * @description This maintenance method removes expired tokens from the revoked_tokens table to prevent
   * unbounded growth and maintain query performance. It deletes all tokens where the expiresAt timestamp
   * is less than the current time. This method is designed to be run periodically as part of automated
   * maintenance tasks. The DatabaseOptimizer calls this method every hour as part of the cleanup routine.
   * If the cleanup operation fails, the error is logged and 0 is returned to indicate no tokens were cleaned.
   * 
   * @example
   * ```typescript
   * // Called by DatabaseOptimizer during periodic maintenance
   * const cleanedCount = await tokenBlacklistService.cleanupExpiredTokens();
   * logger.info(`Maintenance cleanup removed ${cleanedCount} expired tokens`);
   * 
   * // Can also be called manually for immediate cleanup
   * const result = await tokenBlacklistService.cleanupExpiredTokens();
   * if (result > 0) {
   *   console.log(`Successfully cleaned ${result} expired tokens`);
   * }
   * ```
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const now = new Date();
      const result = await this.prisma.revokedToken.deleteMany({
        where: {
          expiresAt: {
            lt: now
          }
        }
      });

      logger.info(`Cleaned up ${result.count} expired tokens from blacklist`);
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up expired tokens', { error });
      return 0;
    }
  }
}