import { Request, Response, NextFunction } from 'express';
import { sanitizeInput, securityHeaders, requestSizeLimiter } from '../security';
import { ErrorCodes, HttpStatus } from '@/shared/types';

// Mock logger
jest.mock('@/shared/utils/logger', () => ({
  logger: {
    warn: jest.fn()
  }
}));

// Mock Express objects
const mockRequest = (body?: any, query?: any, params?: any, headers?: any): Partial<Request> => ({
  body: body || {},
  query: query || {},
  params: params || {},
  headers: headers || {},
  ip: '127.0.0.1',
  path: '/test'
});

const mockResponse = (): Partial<Response> => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.removeHeader = jest.fn();
  res.setHeader = jest.fn();
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Security Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sanitizeInput', () => {
    it('should remove control characters from strings', () => {
      const req = mockRequest(
        { name: 'John\x00Doe\x1F', description: 'Test\x7F' },
        { search: 'query\x00test' },
        { id: 'param\x1Ftest' }
      );
      const res = mockResponse();

      sanitizeInput(req as Request, res as Response, mockNext);

      expect(req.body).toEqual({ name: 'JohnDoe', description: 'Test' });
      expect(req.query).toEqual({ search: 'querytest' });
      expect(req.params).toEqual({ id: 'paramtest' });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle nested objects', () => {
      const req = mockRequest({
        user: {
          name: 'John\x00Doe',
          profile: {
            bio: 'Test\x1Fbio'
          }
        }
      });
      const res = mockResponse();

      sanitizeInput(req as Request, res as Response, mockNext);

      expect(req.body).toEqual({
        user: {
          name: 'JohnDoe',
          profile: {
            bio: 'Testbio'
          }
        }
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle arrays', () => {
      const req = mockRequest({
        items: ['item1\x00', 'item2\x1F', { name: 'nested\x7F' }]
      });
      const res = mockResponse();

      sanitizeInput(req as Request, res as Response, mockNext);

      expect(req.body).toEqual({
        items: ['item1', 'item2', { name: 'nested' }]
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle non-string values', () => {
      const req = mockRequest({
        number: 123,
        boolean: true,
        null: null,
        undefined: undefined
      });
      const res = mockResponse();

      sanitizeInput(req as Request, res as Response, mockNext);

      expect(req.body).toEqual({
        number: 123,
        boolean: true,
        null: null,
        undefined: undefined
      });
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('securityHeaders', () => {
    it('should set security headers', () => {
      const req = mockRequest();
      const res = mockResponse();

      securityHeaders(req as Request, res as Response, mockNext);

      expect(res.removeHeader).toHaveBeenCalledWith('X-Powered-By');
      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requestSizeLimiter', () => {
    beforeEach(() => {
      // Reset environment variable
      delete process.env['MAX_REQUEST_SIZE'];
    });

    it('should allow requests within size limit', () => {
      const req = mockRequest(undefined, undefined, undefined, { 'content-length': '1000' });
      const res = mockResponse();

      requestSizeLimiter(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject requests exceeding size limit', () => {
      process.env['MAX_REQUEST_SIZE'] = '1000';
      const req = mockRequest(undefined, undefined, undefined, { 'content-length': '2000' });
      const res = mockResponse();

      requestSizeLimiter(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Request size too large',
          timestamp: expect.any(String),
          path: '/test'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should use default size limit when not configured', () => {
      const req = mockRequest(undefined, undefined, undefined, { 'content-length': '20000000' }); // 20MB
      const res = mockResponse();

      requestSizeLimiter(req as Request, res as Response, mockNext);

      expect(res.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should allow requests without content-length header', () => {
      const req = mockRequest();
      const res = mockResponse();

      requestSizeLimiter(req as Request, res as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});