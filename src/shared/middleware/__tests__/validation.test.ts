import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate, validateBody, validateParams, validateQuery } from '../validation';

// Mock Express objects
const mockRequest = (body?: any, params?: any, query?: any): Partial<Request> => ({
  body: body || {},
  params: params || {},
  query: query || {}
});

const mockResponse = (): Partial<Response> => ({});

const mockNext = jest.fn() as NextFunction;

describe('Validation Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should pass validation with valid data', () => {
      const schema = {
        body: z.object({
          name: z.string(),
          age: z.number()
        })
      };

      const req = mockRequest({ name: 'John', age: 25 });
      const res = mockResponse();

      const middleware = validate(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.body).toEqual({ name: 'John', age: 25 });
    });

    it('should call next with ZodError for invalid data', () => {
      const schema = {
        body: z.object({
          name: z.string(),
          age: z.number()
        })
      };

      const req = mockRequest({ name: 'John', age: 'invalid' });
      const res = mockResponse();

      const middleware = validate(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should validate params correctly', () => {
      const schema = {
        params: z.object({
          id: z.string().uuid()
        })
      };

      const req = mockRequest(undefined, { id: '123e4567-e89b-12d3-a456-426614174000' });
      const res = mockResponse();

      const middleware = validate(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should validate query parameters correctly', () => {
      const schema = {
        query: z.object({
          page: z.string().transform(val => parseInt(val, 10)),
          limit: z.string().transform(val => parseInt(val, 10))
        })
      };

      const req = mockRequest(undefined, undefined, { page: '1', limit: '20' });
      const res = mockResponse();

      const middleware = validate(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(req.query).toEqual({ page: 1, limit: 20 });
    });
  });

  describe('validateBody', () => {
    it('should validate body only', () => {
      const schema = z.object({
        email: z.string().email()
      });

      const req = mockRequest({ email: 'test@example.com' });
      const res = mockResponse();

      const middleware = validateBody(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('validateParams', () => {
    it('should validate params only', () => {
      const schema = z.object({
        id: z.string()
      });

      const req = mockRequest(undefined, { id: 'test-id' });
      const res = mockResponse();

      const middleware = validateParams(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('validateQuery', () => {
    it('should validate query only', () => {
      const schema = z.object({
        search: z.string().optional()
      });

      const req = mockRequest(undefined, undefined, { search: 'test' });
      const res = mockResponse();

      const middleware = validateQuery(schema);
      middleware(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});