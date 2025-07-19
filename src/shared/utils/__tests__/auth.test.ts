/**
 * Authentication Utilities Tests
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  extractTokenFromHeader,
  validateTokenFormat,
  isTokenExpired,
  getTokenExpiration,
  generateSecureToken,
  TokenPayload
} from '../auth';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('Authentication Utilities', () => {
  const mockTokenPayload: TokenPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'student'
  };

  beforeEach(() => {
    process.env['JWT_SECRET'] = 'test-secret';
    process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret';
    process.env['JWT_ACCESS_EXPIRES_IN'] = '15m';
    process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
    process.env['BCRYPT_SALT_ROUNDS'] = '12';
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env['JWT_SECRET'];
    delete process.env['JWT_REFRESH_SECRET'];
    delete process.env['JWT_ACCESS_EXPIRES_IN'];
    delete process.env['JWT_REFRESH_EXPIRES_IN'];
    delete process.env['BCRYPT_SALT_ROUNDS'];
  });

  describe('generateAccessToken', () => {
    it('should generate access token with correct payload', () => {
      const mockToken = 'mock-access-token';
      (mockJwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = generateAccessToken(mockTokenPayload);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          sub: mockTokenPayload.userId,
          email: mockTokenPayload.email,
          role: mockTokenPayload.role
        },
        'test-secret',
        {
          expiresIn: '15m',
          issuer: 'wayrapp-api',
          audience: 'wayrapp-client'
        }
      );
      expect(result).toBe(mockToken);
    });

    it('should throw error if JWT_SECRET is not set', () => {
      delete process.env['JWT_SECRET'];

      expect(() => generateAccessToken(mockTokenPayload)).toThrow(
        'JWT_SECRET environment variable not set'
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate refresh token with correct payload', () => {
      const mockToken = 'mock-refresh-token';
      (mockJwt.sign as jest.Mock).mockReturnValue(mockToken);

      const result = generateRefreshToken(mockTokenPayload);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          sub: mockTokenPayload.userId,
          email: mockTokenPayload.email,
          role: mockTokenPayload.role
        },
        'test-refresh-secret',
        {
          expiresIn: '7d',
          issuer: 'wayrapp-api',
          audience: 'wayrapp-client'
        }
      );
      expect(result).toBe(mockToken);
    });

    it('should throw error if JWT_REFRESH_SECRET is not set', () => {
      delete process.env['JWT_REFRESH_SECRET'];

      expect(() => generateRefreshToken(mockTokenPayload)).toThrow(
        'JWT_REFRESH_SECRET environment variable not set'
      );
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const mockAccessToken = 'mock-access-token';
      const mockRefreshToken = 'mock-refresh-token';
      
      (mockJwt.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);

      const result = generateTokenPair(mockTokenPayload);

      expect(result).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken
      });
      expect(mockJwt.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify refresh token successfully', () => {
      const mockToken = 'valid-refresh-token';
      const mockPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'student',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      (mockJwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = verifyRefreshToken(mockToken);

      expect(mockJwt.verify).toHaveBeenCalledWith(mockToken, 'test-refresh-secret');
      expect(result).toEqual(mockPayload);
    });

    it('should throw error if JWT_REFRESH_SECRET is not set', () => {
      delete process.env['JWT_REFRESH_SECRET'];

      expect(() => verifyRefreshToken('token')).toThrow(
        'JWT_REFRESH_SECRET environment variable not set'
      );
    });
  });

  describe('hashPassword', () => {
    it('should hash password with correct salt rounds', async () => {
      const password = 'test-password';
      const hashedPassword = 'hashed-password';
      
      (mockBcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it('should use default salt rounds if not specified', async () => {
      delete process.env['BCRYPT_SALT_ROUNDS'];
      const password = 'test-password';
      const hashedPassword = 'hashed-password';
      
      (mockBcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      await hashPassword(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe('comparePassword', () => {
    it('should compare password correctly', async () => {
      const password = 'test-password';
      const hash = 'hashed-password';
      
      (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await comparePassword(password, hash);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const authHeader = 'Bearer valid-token';
      const result = extractTokenFromHeader(authHeader);
      expect(result).toBe('valid-token');
    });

    it('should return null for invalid header format', () => {
      expect(extractTokenFromHeader('Invalid header')).toBeNull();
      expect(extractTokenFromHeader('Bearer')).toBeNull();
      expect(extractTokenFromHeader('Token valid-token')).toBeNull();
    });

    it('should return null for undefined header', () => {
      expect(extractTokenFromHeader(undefined)).toBeNull();
    });
  });

  describe('validateTokenFormat', () => {
    it('should validate correct JWT format', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE2MTYyMzkwMjJ9.signature';
      expect(validateTokenFormat(validToken)).toBe(true);
    });

    it('should reject invalid JWT format', () => {
      expect(validateTokenFormat('invalid-token')).toBe(false);
      expect(validateTokenFormat('part1.part2')).toBe(false);
      expect(validateTokenFormat('')).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    it('should detect expired token', () => {
      const expiredPayload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      };
      const expiredToken = `header.${Buffer.from(JSON.stringify(expiredPayload)).toString('base64')}.signature`;
      
      expect(isTokenExpired(expiredToken)).toBe(true);
    });

    it('should detect valid token', () => {
      const validPayload = {
        sub: 'user-123',
        exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      };
      const validToken = `header.${Buffer.from(JSON.stringify(validPayload)).toString('base64')}.signature`;
      
      expect(isTokenExpired(validToken)).toBe(false);
    });

    it('should return true for invalid token format', () => {
      expect(isTokenExpired('invalid-token')).toBe(true);
    });
  });

  describe('getTokenExpiration', () => {
    it('should extract expiration date from token', () => {
      const exp = Math.floor(Date.now() / 1000) + 3600;
      const payload = { sub: 'user-123', exp };
      const token = `header.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
      
      const result = getTokenExpiration(token);
      expect(result).toEqual(new Date(exp * 1000));
    });

    it('should return null for invalid token', () => {
      expect(getTokenExpiration('invalid-token')).toBeNull();
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token of specified length', () => {
      const token = generateSecureToken(16);
      expect(token).toHaveLength(16);
      expect(typeof token).toBe('string');
    });

    it('should generate token of default length', () => {
      const token = generateSecureToken();
      expect(token).toHaveLength(32);
    });

    it('should generate different tokens on multiple calls', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      expect(token1).not.toBe(token2);
    });
  });
});