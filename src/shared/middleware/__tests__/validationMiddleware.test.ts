/**
 * Validation Middleware Tests
 */
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../validationMiddleware';
import { createMockRequest, createMockResponse, createMockNext } from '@/shared/test/utils/testUtils';
import { HttpStatus } from '@/shared/types';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = createMockNext();
  });

  describe('validate', () => {
    const testSchema = z.object({
      name: z.string().min(3),
      age: z.number().positive(),
    });

    it('should call next() when validation passes for body', () => {
      // Arrange
      mockRequest.body = { name: 'John Doe', age: 30 };
      const middleware = validate({ body: testSchema });

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 400 when body validation fails', () => {
      // Arrange
      mockRequest.body = { name: 'Jo', age: -5 };
      const middleware = validate({ body: testSchema });

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: expect.arrayContaining([
              expect.objectContaining({ path: ['name'] }),
              expect.objectContaining({ path: ['age'] })
            ])
          })
        })
      );
    });

    it('should validate query parameters', () => {
      // Arrange
      const querySchema = z.object({
        page: z.string().transform(val => parseInt(val)),
        limit: z.string().transform(val => parseInt(val)),
      });
      mockRequest.query = { page: '2', limit: '10' };
      const middleware = validate({ query: querySchema });

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.query).toEqual({ page: '2', limit: '10' });
    });

    it('should validate URL parameters', () => {
      // Arrange
      const paramsSchema = z.object({
        id: z.string().uuid(),
      });
      mockRequest.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      const middleware = validate({ params: paramsSchema });

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should validate multiple sources', () => {
      // Arrange
      const bodySchema = z.object({ name: z.string() });
      const querySchema = z.object({ sort: z.string() });
      mockRequest.body = { name: 'John' };
      mockRequest.query = { sort: 'asc' };
      const middleware = validate({ body: bodySchema, query: querySchema });

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 400 when any validation source fails', () => {
      // Arrange
      const bodySchema = z.object({ name: z.string().min(5) });
      const querySchema = z.object({ sort: z.enum(['asc', 'desc']) });
      mockRequest.body = { name: 'John' };
      mockRequest.query = { sort: 'invalid' };
      const middleware = validate({ body: bodySchema, query: querySchema });

      // Act
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            details: expect.arrayContaining([
              expect.objectContaining({ path: ['name'] }),
              expect.objectContaining({ path: ['sort'] })
            ])
          })
        })
      );
    });
  });
});