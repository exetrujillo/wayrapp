// src/modules/users/services/__tests__/tokenBlacklistService.test.ts

import { TokenBlacklistService } from '../tokenBlacklistService';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('@/shared/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));
jest.mock('@/shared/utils/auth', () => ({
    getTokenExpiration: jest.fn(),
}));

/**
 * @fileoverview Unit and integration tests for TokenBlacklistService.ts
 * 
 * @summary Test suite for the TokenBlacklistService class, covering secure JWT refresh token revocation and management operations.
 * 
 * @description These tests verify that the TokenBlacklistService correctly implements all token blacklist operations including:
 * - Token revocation during logout operations with proper expiration handling
 * - Token validation during refresh operations with blacklist checking
 * - Automated cleanup of expired tokens for database maintenance
 * - Error handling and graceful failure patterns for authentication flow stability
 * - Database interaction patterns using Prisma client
 * - Security-focused design with performance considerations
 * 
 * The testing strategy focuses on unit testing with mocked dependencies to ensure security logic correctness,
 * proper error handling without throwing exceptions, and adherence to fail-safe patterns. Each method is tested
 * for both success and failure scenarios, with particular attention to edge cases and security-sensitive operations
 * that must not disrupt the authentication flow.
 * 
 * @author Exequiel Trujillo
  * 
 * @since 1.0.0
 */
describe('TokenBlacklistService', () => {
    let tokenBlacklistService: TokenBlacklistService;
    let mockPrisma: jest.Mocked<PrismaClient>;

    beforeEach(() => {
        mockPrisma = {
            revokedToken: {
                create: jest.fn(),
                findUnique: jest.fn(),
                deleteMany: jest.fn(),
            },
        } as unknown as jest.Mocked<PrismaClient>;

        tokenBlacklistService = new TokenBlacklistService(mockPrisma);

        // Clear all mocks
        jest.clearAllMocks();
    });

    describe('revokeToken', () => {
        it('should successfully revoke a token with valid expiration', async () => {
            // Arrange
            const token = 'valid.jwt.token';
            const userId = 'user-123';
            const expirationDate = new Date('2024-12-31T23:59:59Z');

            const { getTokenExpiration } = await import('@/shared/utils/auth');
            (getTokenExpiration as jest.Mock).mockReturnValue(expirationDate);

            const mockCreateResult = {
                id: 'revoked-token-id',
                token,
                userId,
                expiresAt: expirationDate,
                revokedAt: new Date(),
            };

            (mockPrisma.revokedToken.create as jest.Mock).mockResolvedValue(mockCreateResult);

            // Act
            await tokenBlacklistService.revokeToken(token, userId);

            // Assert
            expect(getTokenExpiration).toHaveBeenCalledWith(token);
            expect(mockPrisma.revokedToken.create).toHaveBeenCalledWith({
                data: {
                    token,
                    userId,
                    expiresAt: expirationDate,
                },
            });
        });

        it('should handle invalid token format gracefully', async () => {
            // Arrange
            const token = 'invalid.token';
            const userId = 'user-123';

            const { getTokenExpiration } = await import('@/shared/utils/auth');
            (getTokenExpiration as jest.Mock).mockReturnValue(null);

            // Act
            await tokenBlacklistService.revokeToken(token, userId);

            // Assert
            expect(getTokenExpiration).toHaveBeenCalledWith(token);
            expect(mockPrisma.revokedToken.create).not.toHaveBeenCalled();
        });

        it('should handle database errors gracefully without throwing', async () => {
            // Arrange
            const token = 'valid.jwt.token';
            const userId = 'user-123';
            const expirationDate = new Date('2024-12-31T23:59:59Z');

            const { getTokenExpiration } = await import('@/shared/utils/auth');
            (getTokenExpiration as jest.Mock).mockReturnValue(expirationDate);

            (mockPrisma.revokedToken.create as jest.Mock).mockRejectedValue(new Error('Database error'));

            // Act & Assert
            await expect(tokenBlacklistService.revokeToken(token, userId)).resolves.not.toThrow();
            expect(mockPrisma.revokedToken.create).toHaveBeenCalled();
        });
    });

    describe('isTokenRevoked', () => {
        it('should return true when token is found in blacklist', async () => {
            // Arrange
            const token = 'blacklisted.jwt.token';
            const mockRevokedToken = {
                id: 'revoked-token-id',
                token,
                userId: 'user-123',
                expiresAt: new Date('2024-12-31T23:59:59Z'),
                revokedAt: new Date(),
            };

            (mockPrisma.revokedToken.findUnique as jest.Mock).mockResolvedValue(mockRevokedToken);

            // Act
            const result = await tokenBlacklistService.isTokenRevoked(token);

            // Assert
            expect(result).toBe(true);
            expect(mockPrisma.revokedToken.findUnique).toHaveBeenCalledWith({
                where: { token },
            });
        });

        it('should return false when token is not found in blacklist', async () => {
            // Arrange
            const token = 'valid.jwt.token';

            (mockPrisma.revokedToken.findUnique as jest.Mock).mockResolvedValue(null);

            // Act
            const result = await tokenBlacklistService.isTokenRevoked(token);

            // Assert
            expect(result).toBe(false);
            expect(mockPrisma.revokedToken.findUnique).toHaveBeenCalledWith({
                where: { token },
            });
        });

        it('should return false on database errors to prevent blocking legitimate requests', async () => {
            // Arrange
            const token = 'some.jwt.token';

            (mockPrisma.revokedToken.findUnique as jest.Mock).mockRejectedValue(new Error('Database connection error'));

            // Act
            const result = await tokenBlacklistService.isTokenRevoked(token);

            // Assert
            expect(result).toBe(false);
            expect(mockPrisma.revokedToken.findUnique).toHaveBeenCalledWith({
                where: { token },
            });
        });
    });

    describe('cleanupExpiredTokens', () => {
        it('should successfully clean up expired tokens and return count', async () => {
            // Arrange
            const mockDeleteResult = { count: 5 };

            (mockPrisma.revokedToken.deleteMany as jest.Mock).mockResolvedValue(mockDeleteResult);

            // Act
            const result = await tokenBlacklistService.cleanupExpiredTokens();

            // Assert
            expect(result).toBe(5);
            expect(mockPrisma.revokedToken.deleteMany).toHaveBeenCalledWith({
                where: {
                    expiresAt: {
                        lt: expect.any(Date),
                    },
                },
            });
        });

        it('should return 0 when no expired tokens are found', async () => {
            // Arrange
            const mockDeleteResult = { count: 0 };
            (mockPrisma.revokedToken.deleteMany as jest.Mock).mockResolvedValue(mockDeleteResult);

            // Act
            const result = await tokenBlacklistService.cleanupExpiredTokens();

            // Assert
            expect(result).toBe(0);
            expect(mockPrisma.revokedToken.deleteMany).toHaveBeenCalled();
        });

        it('should return 0 on database errors without throwing', async () => {
            // Arrange
            (mockPrisma.revokedToken.deleteMany as jest.Mock).mockRejectedValue(new Error('Database cleanup failed'));

            // Act
            const result = await tokenBlacklistService.cleanupExpiredTokens();

            // Assert
            expect(result).toBe(0);
            expect(mockPrisma.revokedToken.deleteMany).toHaveBeenCalled();
        });

        it('should use current time for expiration comparison', async () => {
            // Arrange
            const mockDeleteResult = { count: 3 };
            (mockPrisma.revokedToken.deleteMany as jest.Mock).mockResolvedValue(mockDeleteResult);

            const beforeCall = new Date();

            // Act
            await tokenBlacklistService.cleanupExpiredTokens();

            const afterCall = new Date();

            // Assert
            const callArgs = (mockPrisma.revokedToken.deleteMany as jest.Mock).mock.calls[0][0];
            const usedDate = callArgs.where.expiresAt.lt;

            expect(usedDate).toBeInstanceOf(Date);
            expect(usedDate.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
            expect(usedDate.getTime()).toBeLessThanOrEqual(afterCall.getTime());
        });
    });

    describe('constructor', () => {
        it('should create instance with provided Prisma client', () => {
            // Arrange & Act
            const service = new TokenBlacklistService(mockPrisma);

            // Assert
            expect(service).toBeInstanceOf(TokenBlacklistService);
        });
    });
});