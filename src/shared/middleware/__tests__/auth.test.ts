/**
 * Authentication Middleware Tests
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole, requirePermission, optionalAuth } from '../auth';
import { JWTPayload, ErrorCodes, HttpStatus } from '@/shared/types';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('@/shared/utils/logger');

const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {};
    mockNext = jest.fn();
    
    // Set up environment variable
    process.env['JWT_SECRET'] = 'test-secret';
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    delete process.env['JWT_SECRET'];
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token', async () => {
      const mockPayload: JWTPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'student',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (mockJwt.verify as jest.Mock).mockReturnValue(mockPayload);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockJwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject request without token', async () => {
      mockRequest.headers = {};

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR
        })
      );
    });

    it('should reject invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR
        })
      );
    });

    it('should reject expired token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token'
      };

      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR
        })
      );
    });

    it('should handle missing JWT_SECRET', async () => {
      delete process.env['JWT_SECRET'];

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          code: ErrorCodes.INTERNAL_ERROR
        })
      );
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'student',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
    });

    it('should allow access for correct role', () => {
      const middleware = requireRole('student');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access for multiple roles', () => {
      const middleware = requireRole(['student', 'content_creator']);

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for incorrect role', () => {
      const middleware = requireRole('admin');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.FORBIDDEN,
          code: ErrorCodes.AUTHORIZATION_ERROR
        })
      );
    });

    it('should deny access without authentication', () => {
      delete mockRequest.user;
      const middleware = requireRole('student');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR
        })
      );
    });
  });

  describe('requirePermission', () => {
    beforeEach(() => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'student',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
    });

    it('should allow access for valid permission', () => {
      const middleware = requirePermission('read:courses');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for invalid permission', () => {
      const middleware = requirePermission('delete:content');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.FORBIDDEN,
          code: ErrorCodes.AUTHORIZATION_ERROR
        })
      );
    });

    it('should allow admin access to all permissions', () => {
      mockRequest.user!.role = 'admin';
      const middleware = requirePermission('delete:content');

      middleware(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('optionalAuth', () => {
    it('should attach user if valid token provided', async () => {
      const mockPayload: JWTPayload = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'student',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token'
      };

      (mockJwt.verify as jest.Mock).mockReturnValue(mockPayload);

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toEqual(mockPayload);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user if no token provided', async () => {
      mockRequest.headers = {};

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without user if invalid token provided', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token'
      };

      (mockJwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await optionalAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockRequest.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});