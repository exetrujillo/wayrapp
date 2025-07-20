/**
 * Token Blacklist Service
 * Manages revoked JWT refresh tokens
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';
import { getTokenExpiration } from '@/shared/utils/auth';

export class TokenBlacklistService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Add a token to the blacklist
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
   * Check if a token is blacklisted
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
   * Clean up expired tokens from the blacklist
   * This should be run periodically as a maintenance task
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