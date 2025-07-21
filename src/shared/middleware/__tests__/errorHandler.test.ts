/**
 * Error Handler Middleware Tests
 */
import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../errorHandler';
import { createMockResponse, createMockNext } from '@/shared/test/utils/testUtils';
import { ErrorCodes, HttpStatus } from '@/shared/types';
import { ZodError, z } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create a more complete mock request that satisfies the Express.Request interface
    mockRequest = {
      path: '/test-path',
      url: '/test-path',
      method: 'GET',
      ip: '127.0.0.1',
      headers: {},
      body: {},
      params: {},
      query: {},
      get: jest.fn((header) => {
        if (header === 'User-Agent') return 'Test User Agent';
        if (header === 'set-cookie') return [];
        return undefined;
      }) as any,
      user: {
        sub: 'test-user-id',
        email: 'test@example.com',
        role: 'student' as any,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    };

    mockResponse = createMockResponse();
    mockNext = createMockNext();

    // Mock Date.now() for consistent timestamps in error responses
    jest.spyOn(Date, 'now').mockImplementation(() => 1609459200000); // 2021-01-01
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      // Arrange
      const appError = new AppError('Test error message', HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR);

      // Act
      errorHandler(appError, mockRequest as unknown as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Test error message',
          timestamp: expect.any(String),
          path: '/test-path',
        },
      });
    });

    it('should handle ZodError correctly', () => {
      // Arrange
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
      });
      const zodError = schema.safeParse({ name: 'Jo', email: 'invalid-email' }).error as ZodError;

      // Act
      errorHandler(zodError, mockRequest as unknown as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'name' }),
            expect.objectContaining({ field: 'email' })
          ]),
          timestamp: expect.any(String),
          path: '/test-path',
        },
      });
    });

    it('should handle Prisma errors correctly', () => {
      // Arrange
      const prismaError = new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '4.0.0',
      });

      // Act
      errorHandler(prismaError, mockRequest as unknown as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Record not found',
          timestamp: expect.any(String),
          path: '/test-path',
        },
      });
    });

    it('should handle generic errors correctly', () => {
      // Arrange
      const genericError = new Error('Something went wrong');

      // Act
      errorHandler(genericError, mockRequest as unknown as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Internal server error',
          details: undefined,
          timestamp: expect.any(String),
          path: '/test-path',
        },
      });
    });

    it('should include error details for development environment', () => {
      // Arrange
      const originalNodeEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';
      const genericError = new Error('Something went wrong');

      // Act
      errorHandler(genericError, mockRequest as unknown as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Internal server error',
          details: undefined,
          timestamp: expect.any(String),
          path: '/test-path',
        },
      });

      // Cleanup
      process.env['NODE_ENV'] = originalNodeEnv;
    });
  });

  describe('AppError', () => {
    it('should create an AppError with default values', () => {
      // Act
      const error = new AppError('Test message', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);
    });

    it('should create an AppError with custom values', () => {
      // Act
      const error = new AppError(
        'Not found',
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );

      // Assert
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(error.code).toBe(ErrorCodes.NOT_FOUND);
    });
  });
});