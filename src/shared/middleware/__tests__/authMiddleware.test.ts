/**
 * Authentication Middleware Tests
 */
import { Request, Response, NextFunction } from 'express';
import { authenticateToken, requireRole } from '../auth';
import { createMockRequest, createMockResponse, createMockNext } from '@/shared/test/utils/testUtils';
import { HttpStatus, JWTPayload } from '@/shared/types';
import jwt from 'jsonwebtoken';

// Mock jwt verify
jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
  JsonWebTokenError: jest.requireActual('jsonwebtoken').JsonWebTokenError,
  TokenExpiredError: jest.requireActual('jsonwebtoken').TokenExpiredError
}));

describe('Authentication Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = createMockRequest({
      user: {
        sub: 'test-user-id',
        email: 'test@example.com',
        role: 'student',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    });
    mockResponse = createMockResponse();
    mockNext = createMockNext();
    jest.clearAllMocks();
    
    // Set environment variable for tests
    process.env['JWT_SECRET'] = 'test-secret';
  });

  describe('authenticateToken', () => {
    it('should call next() when valid token is provided', async () => {
      // Arrange
      const token = 'valid.jwt.token';
      const decodedToken: JWTPayload = { 
        sub: 'test-user-id', 
        email: 'test@example.com', 
        role: 'student',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      mockRequest.headers = { authorization: `Bearer ${token}` };
      
      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, 'test-secret');
      expect(mockRequest.user).toEqual(decodedToken);
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should pass error to next() when no token is provided', async () => {
      // Arrange
      mockRequest.headers = {};

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token required',
          statusCode: HttpStatus.UNAUTHORIZED
        })
      );
    });

    it('should pass error to next() when token is invalid', async () => {
      // Arrange
      mockRequest.headers = { authorization: 'Bearer invalid.token' };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid access token',
          statusCode: HttpStatus.UNAUTHORIZED
        })
      );
    });

    it('should pass error to next() when token is expired', async () => {
      // Arrange
      const token = 'expired.jwt.token';
      mockRequest.headers = { authorization: `Bearer ${token}` };
      
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError('Token expired', new Date());
      });

      // Act
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Access token expired',
          statusCode: HttpStatus.UNAUTHORIZED
        })
      );
    });
  });

  describe('requireRole', () => {
    it('should call next() when user has required role', async () => {
      // Arrange
      mockRequest.user = { 
        sub: 'test-user-id', 
        email: 'test@example.com', 
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const middleware = requireRole(['admin', 'content_creator']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should pass error to next() when user does not have required role', async () => {
      // Arrange
      mockRequest.user = { 
        sub: 'test-user-id', 
        email: 'test@example.com', 
        role: 'student',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      };
      const middleware = requireRole(['admin', 'content_creator']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Insufficient permissions',
          statusCode: HttpStatus.FORBIDDEN
        })
      );
    });

    it('should pass error to next() when no user is attached to request', async () => {
      // Arrange
      mockRequest.user = undefined;
      const middleware = requireRole(['admin']);

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: HttpStatus.UNAUTHORIZED
        })
      );
    });
  });
});