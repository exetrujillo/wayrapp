/**
 * Error Handler Middleware Tests
 */
import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../errorHandler';
import { createMockRequest, createMockResponse, createMockNext } from '@/shared/test/utils/testUtils';
import { ErrorCodes, HttpStatus } from '@/shared/types';
import { ZodError, z } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = createMockRequest();
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
      mockRequest.path = '/test-path';

      // Act
      errorHandler(appError, mockRequest as Request, mockResponse as Response, mockNext);

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
      mockRequest.path = '/test-path';

      // Act
      errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Validation error',
          details: expect.arrayContaining([
            expect.objectContaining({ path: ['name'] }),
            expect.objectContaining({ path: ['email'] })
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
      mockRequest.path = '/test-path';

      // Act
      errorHandler(prismaError, mockRequest as Request, mockResponse as Response, mockNext);

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
      mockRequest.path = '/test-path';

      // Act
      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
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
      mockRequest.path = '/test-path';

      // Act
      errorHandler(genericError, mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
          details: 'Something went wrong',
          stack: expect.any(String),
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
      const error = new AppError('Test message');

      // Assert
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test message');
      expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(error.errorCode).toBe(ErrorCodes.INTERNAL_ERROR);
    });

    it('should create an AppError with custom values', () => {
      // Act
      const error = new AppError(
        'Not found',
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND,
        { id: '123' }
      );

      // Assert
      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(error.errorCode).toBe(ErrorCodes.NOT_FOUND);
      expect(error.details).toEqual({ id: '123' });
    });
  });
});