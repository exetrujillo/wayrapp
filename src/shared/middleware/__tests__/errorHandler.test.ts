import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { errorHandler, AppError } from '../errorHandler';
import { ErrorCodes, HttpStatus } from '@/shared/types';

// Mock logger
jest.mock('@/shared/utils/logger', () => ({
  logger: {
    error: jest.fn()
  }
}));

// Mock Express objects
const mockRequest = (): Partial<Request> => ({
  url: '/test',
  method: 'GET',
  ip: '127.0.0.1',
  path: '/test',
  get: jest.fn().mockReturnValue('test-user-agent')
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Error Handler Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError('Test error', HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR);
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
      expect(error.isOperational).toBe(true);
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Custom error', HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR);
      const req = mockRequest();
      const res = mockResponse();

      errorHandler(error, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Custom error',
          details: undefined,
          timestamp: expect.any(String),
          path: '/test'
        }
      });
    });

    it('should handle ZodError correctly', () => {
      const zodError = new ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['name'],
          message: 'Expected string, received number'
        }
      ]);

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(zodError, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Validation failed',
          details: [
            {
              field: 'name',
              message: 'Expected string, received number',
              code: 'invalid_type'
            }
          ],
          timestamp: expect.any(String),
          path: '/test'
        }
      });
    });

    it('should handle Prisma unique constraint error', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        {
          code: 'P2002',
          clientVersion: '4.0.0',
          meta: { target: ['email'] }
        }
      );

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(prismaError, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.CONFLICT,
          message: 'Unique constraint violation',
          details: { field: ['email'] },
          timestamp: expect.any(String),
          path: '/test'
        }
      });
    });

    it('should handle Prisma record not found error', () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '4.0.0'
        }
      );

      const req = mockRequest();
      const res = mockResponse();

      errorHandler(prismaError, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Record not found',
          details: undefined,
          timestamp: expect.any(String),
          path: '/test'
        }
      });
    });

    it('should handle generic errors', () => {
      const error = new Error('Generic error');
      const req = mockRequest();
      const res = mockResponse();

      errorHandler(error, req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Internal server error',
          details: undefined,
          timestamp: expect.any(String),
          path: '/test'
        }
      });
    });
  });
});