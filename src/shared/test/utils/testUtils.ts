/**
 * Test Utilities
 * Common utilities for testing
 */

import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PaginatedResult, QueryOptions } from '@/shared/types';

/**
 * Create a mock Prisma client for testing
 */
export const createMockPrismaClient = (): DeepMockProxy<PrismaClient> => {
  return mockDeep<PrismaClient>();
};

/**
 * Create a paginated result for testing
 */
export function createPaginatedResult<T>(
  data: T[],
  options: QueryOptions = { page: 1, limit: 20 }
): PaginatedResult<T> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const total = data.length;
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Create a mock repository with basic CRUD methods
 */
export function createMockRepository() {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
  };
}

/**
 * Create a mock service with common methods
 */
export function createMockService() {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
}

/**
 * Helper to mock date for consistent testing
 */
export function mockDate(date: Date = new Date('2025-01-01T00:00:00Z')) {
  const RealDate = Date;
  
  class MockDate extends RealDate {
    constructor(...args: ConstructorParameters<typeof Date>) {
      // @ts-ignore
      if (args.length === 0) {
        super(date);
      } else {
        super(...args);
      }
    }
    
    static override now() {
      return date.getTime();
    }
  }
  
  global.Date = MockDate as any;
  
  return {
    restore: () => {
      global.Date = RealDate;
    }
  };
}

/**
 * Helper to create a mock request object
 */
export function createMockRequest(overrides: Record<string, any> = {}) {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: {
      sub: 'test-user-id',
      email: 'test@example.com',
      role: 'student',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    },
    ...overrides,
  };
}

/**
 * Helper to create a mock response object
 */
export function createMockResponse() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

/**
 * Helper to create a mock next function
 */
export function createMockNext() {
  return jest.fn();
}