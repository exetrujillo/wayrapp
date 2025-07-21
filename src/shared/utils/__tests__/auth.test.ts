/**
 * Auth Utility Tests
 */
import { 
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyRefreshToken,
  hashPassword, 
  comparePassword, 
  getTokenExpiration,
  TokenPayload
} from '../auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

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
    it('should generate a JWT access token', () => {
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
  });

  describe('generateRefreshToken', () => {
    it('should generate a JWT refresh token', () => {
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
  });

  describe('generateTokenPair', () => {
    it('should call generateAccessToken and generateRefreshToken to create a pair', () => {
      (jwt.sign as jest.Mock)
        .mockImplementation((_payload, secret) => {
          if (secret === 'test-access-secret') return 'final.access.token';
          if (secret === 'test-refresh-secret') return 'final.refresh.token';
          return 'unknown';
        });

      const pair = generateTokenPair(testPayload);

      expect(pair.accessToken).toBe('final.access.token');
      expect(pair.refreshToken).toBe('final.refresh.token');
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });
  });

  // NOTA: No hay una función 'verifyAccessToken' exportada, así que no la probamos.
  // La verificación del access token sucede en el middleware 'authenticateToken',
  // y eso se prueba en 'auth.middleware.test.ts'.

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = 'valid.refresh.token';
      const decodedPayload = { sub: 'user-123', email: 'test@example.com', role: 'student' };
      (jwt.verify as jest.Mock).mockReturnValue(decodedPayload);

      const result = verifyRefreshToken(token);

      expect(result).toEqual(decodedPayload);
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-refresh-secret');
    });
  });

  describe('hashPassword', () => {
    it('should hash a password with bcrypt', async () => {
      const password = 'Password123!';
      const hashedPassword = 'hashed_password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await hashPassword(password);

      expect(result).toBe(hashedPassword);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'Password123!';
      const hash = 'hashed_password';
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
    });
  });

  describe('getTokenExpiration', () => {
    it('should return a Date from a valid token exp claim', () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hora
      const fakeToken = `header.${Buffer.from(JSON.stringify({ exp: futureTimestamp })).toString('base64')}.signature`;
      
      const expirationDate = getTokenExpiration(fakeToken);
      
      expect(expirationDate).toBeInstanceOf(Date);
      expect(expirationDate?.getTime()).toBe(futureTimestamp * 1000);
    });

    it('should return null for a token without exp claim', () => {
      const fakeToken = `header.${Buffer.from(JSON.stringify({ iat: 123 })).toString('base64')}.signature`;
      expect(getTokenExpiration(fakeToken)).toBeNull();
    });
  });

});
