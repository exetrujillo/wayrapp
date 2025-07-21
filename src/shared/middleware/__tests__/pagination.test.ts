import { Request, Response } from 'express';
import { paginationMiddleware, addPaginationHeaders } from '../pagination';
import { AppError } from '../errorHandler';

describe('Pagination Middleware', () => {
  let mockRequest: Partial<Request & { pagination?: any }>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      query: {}
    };
    mockResponse = {
      set: jest.fn(),
      req: {
        originalUrl: '/api/v1/courses',
        headers: { host: 'localhost' }
      } as any
    };
    nextFunction = jest.fn();
  });

  test('should use default pagination values when no query params provided', () => {
    const middleware = paginationMiddleware();
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest).toHaveProperty('pagination');
    expect(mockRequest.pagination).toEqual(expect.objectContaining({
      page: 1,
      limit: 20,
      offset: 0,
      sortOrder: 'desc'
    }));
    expect(nextFunction).toHaveBeenCalled();
  });

  test('should parse page-based pagination parameters', () => {
    mockRequest.query = { page: '2', limit: '30', sortOrder: 'asc' };
    const middleware = paginationMiddleware();
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination).toEqual(expect.objectContaining({
      page: 2,
      limit: 30,
      offset: 30,
      sortOrder: 'asc'
    }));
  });

  test('should parse offset-based pagination parameters', () => {
    mockRequest.query = { offset: '40', limit: '10', sortOrder: 'asc' };
    const middleware = paginationMiddleware();
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination).toEqual(expect.objectContaining({
      page: 5, // Calculated from offset/limit
      limit: 10,
      offset: 40,
      sortOrder: 'asc'
    }));
  });

  test('should enforce maximum limit', () => {
    mockRequest.query = { limit: '200' };
    const middleware = paginationMiddleware({ maxLimit: 50 });
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination?.limit).toBe(50);
  });

  test('should validate allowed sort fields', () => {
    mockRequest.query = { sortBy: 'invalid_field' };
    const middleware = paginationMiddleware({ 
      allowedSortFields: ['name', 'created_at'],
      defaultSortField: 'created_at'
    });
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination?.sortBy).toBe('created_at');
  });

  test('should parse allowed filters', () => {
    mockRequest.query = { 
      source_language: 'qu',
      target_language: 'es-ES',
      invalid_filter: 'value'
    };
    const middleware = paginationMiddleware({ 
      allowedFilters: ['source_language', 'target_language']
    });
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination?.filters).toEqual({
      source_language: 'qu',
      target_language: 'es-ES'
    });
    expect(mockRequest.pagination?.filters).not.toHaveProperty('invalid_filter');
  });

  test('should handle search parameter', () => {
    mockRequest.query = { search: 'test query' };
    const middleware = paginationMiddleware({ searchFields: ['name', 'description'] });
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.pagination?.search).toBe('test query');
    expect(mockRequest.pagination?.searchFields).toEqual(['name', 'description']);
  });

  test('should handle validation errors', () => {
    mockRequest.query = { page: 'invalid', limit: 'not-a-number' };
    const middleware = paginationMiddleware();
    middleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith(expect.any(AppError));
  });
});

describe('addPaginationHeaders', () => {
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockResponse = {
      set: jest.fn(),
      req: {
        originalUrl: '/api/v1/courses?page=2',
        headers: { host: 'localhost' }
      } as any
    };
  });

  test('should add all pagination headers', () => {
    const pagination = {
      page: 2,
      limit: 20,
      total: 100,
      totalPages: 5,
      hasNext: true,
      hasPrev: true
    };

    addPaginationHeaders(mockResponse as Response, pagination);

    expect(mockResponse.set).toHaveBeenCalled();
    const setCall = (mockResponse.set as jest.Mock).mock.calls[0][0];
    
    expect(setCall).toHaveProperty('X-Total-Count', '100');
    expect(setCall).toHaveProperty('X-Total-Pages', '5');
    expect(setCall).toHaveProperty('X-Current-Page', '2');
    expect(setCall).toHaveProperty('X-Has-Next', 'true');
    expect(setCall).toHaveProperty('X-Has-Prev', 'true');
    expect(setCall).toHaveProperty('X-Limit', '20');
    expect(setCall).toHaveProperty('X-Offset', '20');
    expect(setCall).toHaveProperty('X-Next-Offset', '40');
    expect(setCall).toHaveProperty('X-Prev-Offset', '0');
    expect(setCall).toHaveProperty('Link');
    expect(setCall.Link).toContain('rel="next"');
    expect(setCall.Link).toContain('rel="prev"');
    expect(setCall.Link).toContain('rel="first"');
    expect(setCall.Link).toContain('rel="last"');
  });
});