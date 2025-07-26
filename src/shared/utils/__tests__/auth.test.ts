// src/shared/utils/__tests__/auth.test.ts

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
  TokenPayload,
  TokenPair
} from '../auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');
jest.mock('../logger', () => ({
  logger: {
    debug: jest.fn()
  }
}));

/**
 * Authentication Utilities Test Suite
 * 
 * Test suite for the authentication utilities module, covering JWT token
 * generation, verification, password hashing, token validation, and security utilities.
 * This test suite ensures the reliability and security of core authentication functions
 * used throughout the WayrApp platform.
 * 
 * The testing strategy focuses on validating correct functionality under normal conditions,
 * error handling for edge cases, security considerations, and integration with external
 * dependencies like JWT and bcrypt libraries. Tests cover both successful operations and
 * failure scenarios to ensure robust error handling and secure-by-default behavior.
 * 
 * Key areas tested include:
 * - JWT token generation with proper payload structure and configuration
 * - Token verification and validation with comprehensive error handling
 * - Password hashing and comparison using bcrypt with configurable salt rounds
 * - Token format validation and expiration checking without cryptographic verification
 * - Header parsing and secure token generation utilities
 * - Environment variable configuration and error handling
 * - Interface compliance and type safety validation
 * 
 * @fileoverview Unit and integration tests for authentication utilities
 * @author Exequiel Trujillo
 * @version 1.0.0
 * @since 1.0.0
 */
describe('Auth Utilities', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    // Configuramos las variables de entorno para los tests
    process.env['JWT_SECRET'] = 'test-access-secret';
    process.env['JWT_REFRESH_SECRET'] = 'test-refresh-secret';
    process.env['JWT_ACCESS_EXPIRES_IN'] = '15m';
    process.env['JWT_REFRESH_EXPIRES_IN'] = '7d';
    process.env['BCRYPT_SALT_ROUNDS'] = '12';
  });

  // El payload de prueba que usaremos, ahora sí completo
  const testPayload: TokenPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: 'student',
  };

  describe('generateAccessToken', () => {
    it('should generate a JWT access token with correct payload and options', () => {
      const mockToken = 'mock.access.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);
      
      const token = generateAccessToken(testPayload);
      
      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: testPayload.userId, email: testPayload.email, role: testPayload.role },
        'test-access-secret',
        { expiresIn: '15m', issuer: 'wayrapp-api', audience: 'wayrapp-client' }
      );
    });

    it('should throw error when JWT_SECRET is not set', () => {
      delete process.env['JWT_SECRET'];
      
      expect(() => generateAccessToken(testPayload)).toThrow('JWT_SECRET environment variable not set');
    });

    it('should use custom expiration time from environment variable', () => {
      process.env['JWT_ACCESS_EXPIRES_IN'] = '30m';
      const mockToken = 'mock.access.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);
      
      generateAccessToken(testPayload);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'test-access-secret',
        expect.objectContaining({ expiresIn: '30m' })
      );
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a JWT refresh token with correct payload and options', () => {
      const mockToken = 'mock.refresh.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = generateRefreshToken(testPayload);

      expect(token).toBe(mockToken);
      expect(jwt.sign).toHaveBeenCalledWith(
        { sub: testPayload.userId, email: testPayload.email, role: testPayload.role },
        'test-refresh-secret',
        { expiresIn: '7d', issuer: 'wayrapp-api', audience: 'wayrapp-client' }
      );
    });

    it('should throw error when JWT_REFRESH_SECRET is not set', () => {
      delete process.env['JWT_REFRESH_SECRET'];
      
      expect(() => generateRefreshToken(testPayload)).toThrow('JWT_REFRESH_SECRET environment variable not set');
    });

    it('should use custom expiration time from environment variable', () => {
      process.env['JWT_REFRESH_EXPIRES_IN'] = '14d';
      const mockToken = 'mock.refresh.token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);
      
      generateRefreshToken(testPayload);
      
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'test-refresh-secret',
        expect.objectContaining({ expiresIn: '14d' })
      );
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      (jwt.sign as jest.Mock)
        .mockImplementation((_payload, secret) => {
          if (secret === 'test-access-secret') return 'final.access.token';
          if (secret === 'test-refresh-secret') return 'final.refresh.token';
          return 'unknown';
        });

      const pair = generateTokenPair(testPayload);

      expect(pair).toEqual({
        accessToken: 'final.access.token',
        refreshToken: 'final.refresh.token'
      });
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });

    it('should return TokenPair interface compliant object', () => {
      (jwt.sign as jest.Mock).mockReturnValue('mock.token');
      
      const pair: TokenPair = generateTokenPair(testPayload);
      
      expect(typeof pair.accessToken).toBe('string');
      expect(typeof pair.refreshToken).toBe('string');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify and decode a valid refresh token', () => {
      const token = 'valid.refresh.token';
      const decodedPayload = { 
        sub: 'user-123', 
        email: 'test@example.com', 
        role: 'student',
        iat: 1234567890,
        exp: 1234567890 + 3600
      };
      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);

      const result = verifyRefreshToken(token);

      expect(result).toEqual(decodedPayload);
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-refresh-secret');
    });

    it('should throw error when JWT_REFRESH_SECRET is not set', () => {
      delete process.env['JWT_REFRESH_SECRET'];
      
      expect(() => verifyRefreshToken('some.token')).toThrow('JWT_REFRESH_SECRET environment variable not set');
    });

    it('should propagate JWT verification errors', () => {
      const token = 'invalid.token';
      const jwtError = new Error('Invalid token');
      jwtError.name = 'JsonWebTokenError';
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw jwtError;
      });

      expect(() => verifyRefreshToken(token)).toThrow('Invalid token');
    });
  });

  describe('hashPassword', () => {
    it('should hash a password with bcrypt using default salt rounds', async () => {
      const password = 'Password123!';
      const hashedPassword = '$2b$12$hashedPassword';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });

    it('should use custom salt rounds from environment variable', async () => {
      process.env['BCRYPT_SALT_ROUNDS'] = '10';
      const password = 'Password123!';
      const hashedPassword = '$2b$10$hashedPassword';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it('should handle bcrypt errors', async () => {
      const password = 'Password123!';
      const bcryptError = new Error('Bcrypt error');
      (bcrypt.hash as jest.Mock).mockRejectedValue(bcryptError);

      await expect(hashPassword(password)).rejects.toThrow('Bcrypt error');
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'Password123!';
      const hash = '$2b$12$hashedPassword';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'WrongPassword';
      const hash = '$2b$12$hashedPassword';
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await comparePassword(password, hash);

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });

    it('should handle bcrypt comparison errors', async () => {
      const password = 'Password123!';
      const hash = 'invalid_hash';
      const bcryptError = new Error('Invalid hash');
      (bcrypt.compare as jest.Mock).mockRejectedValue(bcryptError);

      await expect(comparePassword(password, hash)).rejects.toThrow('Invalid hash');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer authorization header', () => {
      const authHeader = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token.signature';
      const result = extractTokenFromHeader(authHeader);
      
      expect(result).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.token.signature');
    });

    it('should return null for missing authorization header', () => {
      const result = extractTokenFromHeader(undefined);
      expect(result).toBeNull();
    });

    it('should return null for invalid authorization header format', () => {
      expect(extractTokenFromHeader('InvalidHeader')).toBeNull();
      expect(extractTokenFromHeader('Bearer')).toBeNull();
      expect(extractTokenFromHeader('Basic dXNlcjpwYXNz')).toBeNull();
      expect(extractTokenFromHeader('Bearer token extra')).toBeNull();
    });

    it('should return null for empty token in Bearer header', () => {
      const result = extractTokenFromHeader('Bearer ');
      expect(result).toBeNull();
    });
  });

  describe('validateTokenFormat', () => {
    it('should return true for valid JWT format', () => {
      const validHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const validPayload = Buffer.from(JSON.stringify({ sub: 'user-123', exp: 1234567890 })).toString('base64');
      const validToken = `${validHeader}.${validPayload}.signature`;
      
      const result = validateTokenFormat(validToken);
      expect(result).toBe(true);
    });

    it('should return false for token with wrong number of parts', () => {
      expect(validateTokenFormat('invalid.token')).toBe(false);
      expect(validateTokenFormat('too.many.parts.here')).toBe(false);
      expect(validateTokenFormat('single-part')).toBe(false);
    });

    it('should return false for token with invalid base64 encoding', () => {
      const result = validateTokenFormat('invalid-base64.invalid-base64.signature');
      expect(result).toBe(false);
    });

    it('should return false for token missing required claims', () => {
      const invalidHeader = Buffer.from(JSON.stringify({ typ: 'JWT' })).toString('base64'); // missing alg
      const invalidPayload = Buffer.from(JSON.stringify({ sub: 'user-123' })).toString('base64'); // missing exp
      const invalidToken = `${invalidHeader}.${invalidPayload}.signature`;
      
      const result = validateTokenFormat(invalidToken);
      expect(result).toBe(false);
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for non-expired token', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
      const validPayload = Buffer.from(JSON.stringify({ exp: futureTimestamp })).toString('base64');
      const token = `header.${validPayload}.signature`;
      
      const result = isTokenExpired(token);
      expect(result).toBe(false);
    });

    it('should return true for expired token', () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour in past
      const expiredPayload = Buffer.from(JSON.stringify({ exp: pastTimestamp })).toString('base64');
      const token = `header.${expiredPayload}.signature`;
      
      const result = isTokenExpired(token);
      expect(result).toBe(true);
    });

    it('should return true for malformed token', () => {
      expect(isTokenExpired('invalid.token')).toBe(true);
      expect(isTokenExpired('invalid-base64.payload.signature')).toBe(true);
      expect(isTokenExpired('single-part')).toBe(true);
    });

    it('should return false for token without exp claim (undefined < number is false)', () => {
      const payloadWithoutExp = Buffer.from(JSON.stringify({ sub: 'user-123' })).toString('base64');
      const token = `header.${payloadWithoutExp}.signature`;
      
      const result = isTokenExpired(token);
      expect(result).toBe(false); // undefined < now evaluates to false
    });
  });

  describe('getTokenExpiration', () => {
    it('should return Date object for valid token with exp claim', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
      const validPayload = Buffer.from(JSON.stringify({ exp: futureTimestamp })).toString('base64');
      const token = `header.${validPayload}.signature`;
      
      const expirationDate = getTokenExpiration(token);
      
      expect(expirationDate).toBeInstanceOf(Date);
      expect(expirationDate?.getTime()).toBe(futureTimestamp * 1000);
    });

    it('should return null for token without exp claim', () => {
      const payloadWithoutExp = Buffer.from(JSON.stringify({ sub: 'user-123' })).toString('base64');
      const token = `header.${payloadWithoutExp}.signature`;
      
      const result = getTokenExpiration(token);
      expect(result).toBeNull();
    });

    it('should return null for malformed token', () => {
      expect(getTokenExpiration('invalid.token')).toBeNull();
      expect(getTokenExpiration('invalid-base64.payload.signature')).toBeNull();
      expect(getTokenExpiration('single-part')).toBeNull();
    });

    it('should return null for token with invalid exp claim type', () => {
      const invalidExpPayload = Buffer.from(JSON.stringify({ exp: 'invalid-timestamp' })).toString('base64');
      const token = `header.${invalidExpPayload}.signature`;
      
      const result = getTokenExpiration(token);
      expect(result).toBeNull();
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token with default length of 32 characters', () => {
      const token = generateSecureToken();
      
      expect(typeof token).toBe('string');
      expect(token.length).toBe(32);
      expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true); // Only alphanumeric characters
    });

    it('should generate token with custom length', () => {
      const shortToken = generateSecureToken(16);
      const longToken = generateSecureToken(64);
      
      expect(shortToken.length).toBe(16);
      expect(longToken.length).toBe(64);
      expect(/^[A-Za-z0-9]+$/.test(shortToken)).toBe(true);
      expect(/^[A-Za-z0-9]+$/.test(longToken)).toBe(true);
    });

    it('should generate different tokens on multiple calls', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      
      expect(token1).not.toBe(token2);
    });

    it('should handle edge case of zero length', () => {
      const token = generateSecureToken(0);
      expect(token).toBe('');
    });
  });

  describe('Interface Compliance', () => {
    it('should ensure TokenPayload interface compliance', () => {
      const payload: TokenPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'student'
      };
      
      expect(typeof payload.userId).toBe('string');
      expect(typeof payload.email).toBe('string');
      expect(['student', 'content_creator', 'admin']).toContain(payload.role);
    });

    it('should ensure TokenPair interface compliance', () => {
      (jwt.sign as jest.Mock).mockReturnValue('mock.token');
      
      const tokenPair: TokenPair = generateTokenPair(testPayload);
      
      expect(typeof tokenPair.accessToken).toBe('string');
      expect(typeof tokenPair.refreshToken).toBe('string');
      expect(tokenPair.accessToken.length).toBeGreaterThan(0);
      expect(tokenPair.refreshToken.length).toBeGreaterThan(0);
    });
  });

});
