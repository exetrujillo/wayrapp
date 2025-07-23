/**
 * Test Utilities
 * Common utilities for testing
 */

import { PrismaClient } from "@prisma/client";
import { DeepMockProxy, mockDeep } from "jest-mock-extended";
import { NextFunction, Request, Response } from "express";
import {
  JWTPayload,
  PaginatedResult,
  QueryOptions,
  UserRole,
} from "@/shared/types";

/**
 * Create a mock Prisma client for testing with proper typing and default implementations
 */
export function createMockPrismaClient(): DeepMockProxy<PrismaClient> {
  const mockClient = mockDeep<PrismaClient>();

  // Add default mock implementations for common methods
  mockClient.$connect.mockResolvedValue(undefined);
  mockClient.$disconnect.mockResolvedValue(undefined);
  mockClient.$transaction.mockImplementation(async (callback: any) => {
    if (typeof callback === "function") {
      return callback(mockClient);
    }
    return Promise.all(callback);
  });

  // Add common query result mocks
  const mockQueryResult = {
    findUnique: jest.fn().mockResolvedValue(null),
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest
      .fn()
      .mockImplementation((args: any) =>
        Promise.resolve({ id: "mock-id", ...args.data }),
      ),
    update: jest
      .fn()
      .mockImplementation((args: any) =>
        Promise.resolve({ id: "mock-id", ...args.data }),
      ),
    upsert: jest
      .fn()
      .mockImplementation((args: any) =>
        Promise.resolve({ id: "mock-id", ...args.create }),
      ),
    delete: jest.fn().mockResolvedValue({ id: "mock-id" }),
    deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({ _count: { id: 0 } }),
    groupBy: jest.fn().mockResolvedValue([]),
  };

  // Apply common mock implementations to all models
  Object.keys(mockClient).forEach((key) => {
    const property = mockClient[key as keyof typeof mockClient];
    if (
      property &&
      typeof property === "object" &&
      !key.startsWith("$") &&
      key !== "_"
    ) {
      Object.assign(property, mockQueryResult);
    }
  });

  return mockClient;
}

/**
 * Create a paginated result for testing
 */
export function createPaginatedResult<T>(
  data: T[],
  options: QueryOptions = { page: 1, limit: 20 },
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
 * Ensure a mock function has all Jest mock methods available
 * This is a helper to fix issues where mockRejectedValueOnce might not be available
 */
export function ensureJestMock(mockFn: any) {
  if (!jest.isMockFunction(mockFn)) {
    throw new Error('Provided function is not a Jest mock');
  }

  // Ensure common Jest mock methods are available
  if (!mockFn.mockResolvedValueOnce) {
    mockFn.mockResolvedValueOnce = jest.fn().mockReturnValue(mockFn);
  }
  if (!mockFn.mockRejectedValueOnce) {
    mockFn.mockRejectedValueOnce = jest.fn().mockReturnValue(mockFn);
  }
  if (!mockFn.mockRejectedValue) {
    mockFn.mockRejectedValue = jest.fn().mockReturnValue(mockFn);
  }

  return mockFn;
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
 * Enhanced helper to mock date for consistent testing with edge case handling
 * Provides comprehensive date mocking capabilities for various testing scenarios
 */
export function mockDate(date: Date = new Date("2025-01-01T00:00:00Z")) {
  const RealDate = Date;
  let currentMockDate = date;

  class MockDate extends RealDate {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(currentMockDate);
      } else if (args.length === 1) {
        super(args[0]);
      } else if (args.length === 2) {
        super(args[0], args[1]);
      } else if (args.length === 3) {
        super(args[0], args[1], args[2]);
      } else if (args.length === 4) {
        super(args[0], args[1], args[2], args[3]);
      } else if (args.length === 5) {
        super(args[0], args[1], args[2], args[3], args[4]);
      } else if (args.length === 6) {
        super(args[0], args[1], args[2], args[3], args[4], args[5]);
      } else {
        super(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
      }
    }

    static override now() {
      return currentMockDate.getTime();
    }

    static override parse(s: string) {
      return RealDate.parse(s);
    }

    static override UTC(...args: Parameters<typeof Date.UTC>) {
      return RealDate.UTC(...args);
    }

    // Override valueOf to ensure consistent behavior
    override valueOf() {
      return currentMockDate.getTime();
    }

    // Override toString to ensure consistent behavior
    override toString() {
      return currentMockDate.toString();
    }

    // Override toISOString to ensure consistent behavior
    override toISOString() {
      return currentMockDate.toISOString();
    }
  }

  global.Date = MockDate as any;

  return {
    /**
     * Restore the original Date constructor
     */
    restore: () => {
      global.Date = RealDate;
    },

    /**
     * Update the mocked date to a new value
     * @param newDate - The new date to mock
     */
    setDate: (newDate: Date) => {
      currentMockDate = newDate;
    },

    /**
     * Advance the mocked date by a specified amount
     * @param milliseconds - Number of milliseconds to advance
     */
    advanceBy: (milliseconds: number) => {
      currentMockDate = new Date(currentMockDate.getTime() + milliseconds);
    },

    /**
     * Advance the mocked date by a specified number of days
     * @param days - Number of days to advance
     */
    advanceByDays: (days: number) => {
      currentMockDate = new Date(currentMockDate.getTime() + (days * 24 * 60 * 60 * 1000));
    },

    /**
     * Advance the mocked date by a specified number of hours
     * @param hours - Number of hours to advance
     */
    advanceByHours: (hours: number) => {
      currentMockDate = new Date(currentMockDate.getTime() + (hours * 60 * 60 * 1000));
    },

    /**
     * Advance the mocked date by a specified number of minutes
     * @param minutes - Number of minutes to advance
     */
    advanceByMinutes: (minutes: number) => {
      currentMockDate = new Date(currentMockDate.getTime() + (minutes * 60 * 1000));
    },

    /**
     * Get the current mocked date
     */
    getCurrentDate: () => currentMockDate,

    /**
     * Reset to the original mocked date
     */
    reset: () => {
      currentMockDate = date;
    },

    /**
     * Mock a specific timezone by adjusting the date
     * @param timezoneOffset - Timezone offset in minutes (e.g., -480 for PST)
     */
    mockTimezone: (timezoneOffset: number) => {
      const originalGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = jest.fn().mockReturnValue(timezoneOffset);

      return {
        restore: () => {
          Date.prototype.getTimezoneOffset = originalGetTimezoneOffset;
        }
      };
    },

    /**
     * Create a date that's relative to the current mocked date
     * @param offset - Offset in milliseconds from the current mocked date
     */
    createRelativeDate: (offset: number) => {
      return new Date(currentMockDate.getTime() + offset);
    },

    /**
     * Helper methods for common date testing scenarios
     */
    helpers: {
      /**
       * Get a date representing "yesterday" relative to the mocked date
       */
      yesterday: () => new Date(currentMockDate.getTime() - (24 * 60 * 60 * 1000)),

      /**
       * Get a date representing "tomorrow" relative to the mocked date
       */
      tomorrow: () => new Date(currentMockDate.getTime() + (24 * 60 * 60 * 1000)),

      /**
       * Get a date representing "one week ago" relative to the mocked date
       */
      oneWeekAgo: () => new Date(currentMockDate.getTime() - (7 * 24 * 60 * 60 * 1000)),

      /**
       * Get a date representing "one week from now" relative to the mocked date
       */
      oneWeekFromNow: () => new Date(currentMockDate.getTime() + (7 * 24 * 60 * 60 * 1000)),

      /**
       * Get a date representing "one month ago" relative to the mocked date
       */
      oneMonthAgo: () => {
        const date = new Date(currentMockDate);
        date.setMonth(date.getMonth() - 1);
        return date;
      },

      /**
       * Get a date representing "one month from now" relative to the mocked date
       */
      oneMonthFromNow: () => {
        const date = new Date(currentMockDate);
        date.setMonth(date.getMonth() + 1);
        return date;
      },

      /**
       * Get a date representing "one year ago" relative to the mocked date
       */
      oneYearAgo: () => {
        const date = new Date(currentMockDate);
        date.setFullYear(date.getFullYear() - 1);
        return date;
      },

      /**
       * Get a date representing "one year from now" relative to the mocked date
       */
      oneYearFromNow: () => {
        const date = new Date(currentMockDate);
        date.setFullYear(date.getFullYear() + 1);
        return date;
      },

      /**
       * Get the start of the day for the mocked date
       */
      startOfDay: () => {
        const date = new Date(currentMockDate);
        date.setHours(0, 0, 0, 0);
        return date;
      },

      /**
       * Get the end of the day for the mocked date
       */
      endOfDay: () => {
        const date = new Date(currentMockDate);
        date.setHours(23, 59, 59, 999);
        return date;
      },

      /**
       * Get the start of the week for the mocked date
       */
      startOfWeek: () => {
        const date = new Date(currentMockDate);
        const day = date.getDay();
        const diff = date.getDate() - day;
        const startOfWeek = new Date(date.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek;
      },

      /**
       * Get the end of the week for the mocked date
       */
      endOfWeek: () => {
        const date = new Date(currentMockDate);
        const day = date.getDay();
        const diff = date.getDate() - day + 6;
        const endOfWeek = new Date(date.setDate(diff));
        endOfWeek.setHours(23, 59, 59, 999);
        return endOfWeek;
      },

      /**
       * Get the start of the month for the mocked date
       */
      startOfMonth: () => {
        const date = new Date(currentMockDate);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date;
      },

      /**
       * Get the end of the month for the mocked date
       */
      endOfMonth: () => {
        const date = new Date(currentMockDate);
        date.setMonth(date.getMonth() + 1, 0);
        date.setHours(23, 59, 59, 999);
        return date;
      },

      /**
       * Get the start of the year for the mocked date
       */
      startOfYear: () => {
        const date = new Date(currentMockDate);
        date.setMonth(0, 1);
        date.setHours(0, 0, 0, 0);
        return date;
      },

      /**
       * Get the end of the year for the mocked date
       */
      endOfYear: () => {
        const date = new Date(currentMockDate);
        date.setMonth(11, 31);
        date.setHours(23, 59, 59, 999);
        return date;
      },

      /**
       * Create an expired date (1 hour ago)
       */
      expiredDate: () => new Date(currentMockDate.getTime() - (60 * 60 * 1000)),

      /**
       * Create a future date (1 hour from now)
       */
      futureDate: () => new Date(currentMockDate.getTime() + (60 * 60 * 1000)),

      /**
       * Create a date in ISO string format
       */
      isoString: () => currentMockDate.toISOString(),

      /**
       * Create a Unix timestamp
       */
      unixTimestamp: () => Math.floor(currentMockDate.getTime() / 1000),

      /**
       * Create a date for JWT expiration (1 hour from now)
       */
      jwtExpiration: () => Math.floor((currentMockDate.getTime() + (60 * 60 * 1000)) / 1000),

      /**
       * Create a date for JWT issued at (current time)
       */
      jwtIssuedAt: () => Math.floor(currentMockDate.getTime() / 1000),
    }
  };
}

/**
 * Helper to mock JWT functions for consistent testing
 * Provides comprehensive JWT mocking capabilities for various authentication scenarios
 */
export function mockJwt() {
  const originalJwt = jest.requireActual('jsonwebtoken');

  // Default mock implementations
  const mockSign = jest.fn();
  const mockVerify = jest.fn();
  const mockDecode = jest.fn();

  // Mock the entire jsonwebtoken module
  jest.doMock('jsonwebtoken', () => ({
    ...originalJwt,
    sign: mockSign,
    verify: mockVerify,
    decode: mockDecode,
  }));

  // Also use jest.mock for immediate effect
  jest.mock('jsonwebtoken', () => ({
    sign: mockSign,
    verify: mockVerify,
    decode: mockDecode,
  }));

  // Set up default behaviors
  const setupDefaults = () => {
    // Default sign behavior - returns a mock token
    mockSign.mockImplementation((_payload: any, _secret: string, _options?: any) => {
      return `mock-token-${Date.now()}`;
    });

    // Default verify behavior - returns the payload for valid tokens
    mockVerify.mockImplementation((token: string, _secret: string, _options?: any) => {
      if (token === 'invalid-token') {
        const error = new Error('Invalid token');
        (error as any).name = 'JsonWebTokenError';
        throw error;
      }
      if (token === 'expired-token') {
        const error = new Error('Token expired');
        (error as any).name = 'TokenExpiredError';
        (error as any).expiredAt = new Date();
        throw error;
      }
      if (token === 'malformed-token') {
        const error = new Error('Malformed token');
        (error as any).name = 'JsonWebTokenError';
        throw error;
      }

      // Return a default valid payload
      const timestamp = Math.floor(Date.now() / 1000);
      return {
        sub: 'test-user-id',
        email: 'test@example.com',
        role: 'student' as UserRole,
        iat: timestamp,
        exp: timestamp + 3600,
      };
    });

    // Default decode behavior - returns the payload without verification
    mockDecode.mockImplementation((token: string, _options?: any) => {
      if (!token || token === 'malformed-token') {
        return null;
      }

      const timestamp = Math.floor(Date.now() / 1000);
      return {
        header: { alg: 'HS256', typ: 'JWT' },
        payload: {
          sub: 'test-user-id',
          email: 'test@example.com',
          role: 'student' as UserRole,
          iat: timestamp,
          exp: timestamp + 3600,
        },
        signature: 'mock-signature',
      };
    });
  };

  // Initialize with defaults
  setupDefaults();

  return {
    /**
     * Restore the original JWT module
     */
    restore: () => {
      jest.unmock('jsonwebtoken');
      mockSign.mockRestore();
      mockVerify.mockRestore();
      mockDecode.mockRestore();
    },

    /**
     * Reset all mocks to their default state
     */
    reset: () => {
      mockSign.mockReset();
      mockVerify.mockReset();
      mockDecode.mockReset();
      setupDefaults();
    },

    /**
     * Access to the mock functions for custom setup
     */
    mocks: {
      sign: mockSign,
      verify: mockVerify,
      decode: mockDecode,
    },

    /**
     * Helper methods for common JWT testing scenarios
     */
    helpers: {
      /**
       * Mock a successful token generation
       * @param token - The token to return (optional, generates one if not provided)
       */
      mockSignSuccess: (token?: string) => {
        const mockToken = token || `mock-token-${Date.now()}`;
        mockSign.mockReturnValue(mockToken);
        return mockToken;
      },

      /**
       * Mock a token generation error
       * @param error - The error to throw (optional, uses default if not provided)
       */
      mockSignError: (error?: Error) => {
        const signError = error || new Error('Token generation failed');
        mockSign.mockImplementation(() => {
          throw signError;
        });
      },

      /**
       * Mock successful token verification with custom payload
       * @param payload - The payload to return when verifying
       */
      mockVerifySuccess: (payload: Partial<JWTPayload>) => {
        const timestamp = Math.floor(Date.now() / 1000);
        const defaultPayload: JWTPayload = {
          sub: 'test-user-id',
          email: 'test@example.com',
          role: 'student' as UserRole,
          iat: timestamp,
          exp: timestamp + 3600,
          ...payload,
        };

        mockVerify.mockReturnValue(defaultPayload);
        return defaultPayload;
      },

      /**
       * Mock token verification for an expired token
       * @param expiredAt - When the token expired (optional, defaults to 1 hour ago)
       */
      mockVerifyExpired: (expiredAt?: Date) => {
        const expiredDate = expiredAt || new Date(Date.now() - (60 * 60 * 1000));
        mockVerify.mockImplementation(() => {
          const error = new Error('Token expired');
          (error as any).name = 'TokenExpiredError';
          (error as any).expiredAt = expiredDate;
          throw error;
        });
      },

      /**
       * Mock token verification for an invalid token
       * @param message - Error message (optional)
       */
      mockVerifyInvalid: (message?: string) => {
        mockVerify.mockImplementation(() => {
          const error = new Error(message || 'Invalid token');
          (error as any).name = 'JsonWebTokenError';
          throw error;
        });
      },

      /**
       * Mock token verification for a malformed token
       * @param message - Error message (optional)
       */
      mockVerifyMalformed: (message?: string) => {
        mockVerify.mockImplementation(() => {
          const error = new Error(message || 'Malformed token');
          (error as any).name = 'JsonWebTokenError';
          throw error;
        });
      },

      /**
       * Mock token decoding success with custom payload
       * @param payload - The payload to return when decoding
       */
      mockDecodeSuccess: (payload: Partial<JWTPayload>) => {
        const timestamp = Math.floor(Date.now() / 1000);
        const defaultPayload: JWTPayload = {
          sub: 'test-user-id',
          email: 'test@example.com',
          role: 'student' as UserRole,
          iat: timestamp,
          exp: timestamp + 3600,
          ...payload,
        };

        const decodedToken = {
          header: { alg: 'HS256', typ: 'JWT' },
          payload: defaultPayload,
          signature: 'mock-signature',
        };

        mockDecode.mockReturnValue(decodedToken);
        return decodedToken;
      },

      /**
       * Mock token decoding failure (returns null)
       */
      mockDecodeFailure: () => {
        mockDecode.mockReturnValue(null);
      },

      /**
       * Create a mock token for different user roles
       * @param role - The user role
       * @param additionalPayload - Additional payload properties
       */
      createTokenForRole: (role: UserRole, additionalPayload: Partial<JWTPayload> = {}) => {
        const timestamp = Math.floor(Date.now() / 1000);
        const payload: JWTPayload = {
          sub: `${role}-user-id`,
          email: `${role}@example.com`,
          role,
          iat: timestamp,
          exp: timestamp + 3600,
          ...additionalPayload,
        };

        mockVerify.mockReturnValue(payload);
        mockDecode.mockReturnValue({
          header: { alg: 'HS256', typ: 'JWT' },
          payload,
          signature: 'mock-signature',
        });

        return payload;
      },

      /**
       * Create an expired token payload
       * @param role - The user role (optional, defaults to 'student')
       * @param expiredMinutesAgo - How many minutes ago the token expired (optional, defaults to 60)
       */
      createExpiredToken: (role: UserRole = 'student', expiredMinutesAgo: number = 60) => {
        const now = Math.floor(Date.now() / 1000);
        const expiredTime = now - (expiredMinutesAgo * 60);

        const payload: JWTPayload = {
          sub: `${role}-user-id`,
          email: `${role}@example.com`,
          role,
          iat: expiredTime - 3600, // Issued 1 hour before expiration
          exp: expiredTime,
        };

        return payload;
      },

      /**
       * Create a token that will expire soon
       * @param role - The user role (optional, defaults to 'student')
       * @param expiresInMinutes - How many minutes until expiration (optional, defaults to 5)
       */
      createExpiringToken: (role: UserRole = 'student', expiresInMinutes: number = 5) => {
        const now = Math.floor(Date.now() / 1000);
        const expirationTime = now + (expiresInMinutes * 60);

        const payload: JWTPayload = {
          sub: `${role}-user-id`,
          email: `${role}@example.com`,
          role,
          iat: now,
          exp: expirationTime,
        };

        mockVerify.mockReturnValue(payload);
        return payload;
      },

      /**
       * Verify that sign was called with specific parameters
       * @param payload - Expected payload
       * @param secret - Expected secret
       * @param options - Expected options
       */
      expectSignCall: (payload?: any, secret?: string, options?: any) => {
        expect(mockSign).toHaveBeenCalled();
        if (payload !== undefined) {
          expect(mockSign).toHaveBeenCalledWith(payload, secret, options);
        }
      },

      /**
       * Verify that verify was called with specific parameters
       * @param token - Expected token
       * @param secret - Expected secret
       * @param options - Expected options
       */
      expectVerifyCall: (token?: string, secret?: string, options?: any) => {
        expect(mockVerify).toHaveBeenCalled();
        if (token !== undefined) {
          expect(mockVerify).toHaveBeenCalledWith(token, secret, options);
        }
      },

      /**
       * Verify that decode was called with specific parameters
       * @param token - Expected token
       * @param options - Expected options
       */
      expectDecodeCall: (token?: string, options?: any) => {
        expect(mockDecode).toHaveBeenCalled();
        if (token !== undefined) {
          expect(mockDecode).toHaveBeenCalledWith(token, options);
        }
      },

      /**
       * Verify that sign was not called
       */
      expectSignNotCalled: () => {
        expect(mockSign).not.toHaveBeenCalled();
      },

      /**
       * Verify that verify was not called
       */
      expectVerifyNotCalled: () => {
        expect(mockVerify).not.toHaveBeenCalled();
      },

      /**
       * Verify that decode was not called
       */
      expectDecodeNotCalled: () => {
        expect(mockDecode).not.toHaveBeenCalled();
      },
    },

    /**
     * Predefined token scenarios for common testing cases
     */
    scenarios: {
      validStudentToken: 'valid-student-token',
      validInstructorToken: 'valid-instructor-token',
      validAdminToken: 'valid-admin-token',
      expiredToken: 'expired-token',
      invalidToken: 'invalid-token',
      malformedToken: 'malformed-token',
    },
  };
}

/**
 * Helper to mock logger functions for consistent testing
 * Provides comprehensive logger mocking capabilities for verifying log messages
 */
export function mockLogger() {
  // Create mock functions for all log levels
  const mockInfo = jest.fn();
  const mockWarn = jest.fn();
  const mockError = jest.fn();
  const mockDebug = jest.fn();
  const mockVerbose = jest.fn();
  const mockSilly = jest.fn();

  // Create the mock logger object
  const mockLoggerInstance = {
    info: mockInfo,
    warn: mockWarn,
    error: mockError,
    debug: mockDebug,
    verbose: mockVerbose,
    silly: mockSilly,
    log: mockInfo, // Alias for info
  };

  // Mock the logger module
  jest.doMock('@/shared/utils/logger', () => ({
    logger: mockLoggerInstance,
    default: mockLoggerInstance,
  }));

  // Also mock the module using jest.mock for immediate effect
  jest.mock('@/shared/utils/logger', () => ({
    logger: mockLoggerInstance,
    default: mockLoggerInstance,
  }));

  // Also mock winston if it's used directly
  jest.doMock('winston', () => ({
    createLogger: jest.fn().mockReturnValue(mockLoggerInstance),
    format: {
      combine: jest.fn(),
      timestamp: jest.fn(),
      errors: jest.fn(),
      json: jest.fn(),
      colorize: jest.fn(),
      simple: jest.fn(),
      printf: jest.fn(),
    },
    transports: {
      Console: jest.fn(),
      File: jest.fn(),
    },
  }));

  return {
    /**
     * Restore the original logger module
     */
    restore: () => {
      jest.unmock('@/shared/utils/logger');
      jest.unmock('winston');
      mockInfo.mockRestore();
      mockWarn.mockRestore();
      mockError.mockRestore();
      mockDebug.mockRestore();
      mockVerbose.mockRestore();
      mockSilly.mockRestore();
    },

    /**
     * Reset all logger mocks
     */
    reset: () => {
      mockInfo.mockReset();
      mockWarn.mockReset();
      mockError.mockReset();
      mockDebug.mockReset();
      mockVerbose.mockReset();
      mockSilly.mockReset();
    },

    /**
     * Clear all logger mock call history
     */
    clear: () => {
      mockInfo.mockClear();
      mockWarn.mockClear();
      mockError.mockClear();
      mockDebug.mockClear();
      mockVerbose.mockClear();
      mockSilly.mockClear();
    },

    /**
     * Access to the mock logger instance
     */
    logger: mockLoggerInstance,

    /**
     * Access to individual mock functions
     */
    mocks: {
      info: mockInfo,
      warn: mockWarn,
      error: mockError,
      debug: mockDebug,
      verbose: mockVerbose,
      silly: mockSilly,
    },

    /**
     * Helper methods for verifying log messages
     */
    helpers: {
      /**
       * Verify that a specific log level was called with a message
       * @param level - The log level (info, warn, error, debug, verbose, silly)
       * @param message - The expected message
       * @param meta - Optional metadata object
       */
      expectLogCall: (
        level: 'info' | 'warn' | 'error' | 'debug' | 'verbose' | 'silly',
        message: string,
        meta?: any
      ) => {
        const mockFn = mockLoggerInstance[level];
        expect(mockFn).toHaveBeenCalled();

        if (meta !== undefined) {
          expect(mockFn).toHaveBeenCalledWith(message, meta);
        } else {
          expect(mockFn).toHaveBeenCalledWith(message);
        }
      },

      /**
       * Verify that a specific log level was called a certain number of times
       * @param level - The log level
       * @param times - Expected number of calls
       */
      expectLogCallCount: (
        level: 'info' | 'warn' | 'error' | 'debug' | 'verbose' | 'silly',
        times: number
      ) => {
        expect(mockLoggerInstance[level]).toHaveBeenCalledTimes(times);
      },

      /**
       * Verify that a specific log level was not called
       * @param level - The log level
       */
      expectLogNotCalled: (
        level: 'info' | 'warn' | 'error' | 'debug' | 'verbose' | 'silly'
      ) => {
        expect(mockLoggerInstance[level]).not.toHaveBeenCalled();
      },

      /**
       * Verify that info log was called with specific message
       * @param message - Expected message
       * @param meta - Optional metadata
       */
      expectInfo: (message: string, meta?: any) => {
        if (meta !== undefined) {
          expect(mockInfo).toHaveBeenCalledWith(message, meta);
        } else {
          expect(mockInfo).toHaveBeenCalledWith(message);
        }
      },

      /**
       * Verify that warn log was called with specific message
       * @param message - Expected message
       * @param meta - Optional metadata
       */
      expectWarn: (message: string, meta?: any) => {
        if (meta !== undefined) {
          expect(mockWarn).toHaveBeenCalledWith(message, meta);
        } else {
          expect(mockWarn).toHaveBeenCalledWith(message);
        }
      },

      /**
       * Verify that error log was called with specific message
       * @param message - Expected message
       * @param meta - Optional metadata
       */
      expectError: (message: string, meta?: any) => {
        if (meta !== undefined) {
          expect(mockError).toHaveBeenCalledWith(message, meta);
        } else {
          expect(mockError).toHaveBeenCalledWith(message);
        }
      },

      /**
       * Verify that debug log was called with specific message
       * @param message - Expected message
       * @param meta - Optional metadata
       */
      expectDebug: (message: string, meta?: any) => {
        if (meta !== undefined) {
          expect(mockDebug).toHaveBeenCalledWith(message, meta);
        } else {
          expect(mockDebug).toHaveBeenCalledWith(message);
        }
      },

      /**
       * Verify that any log level was called with a message containing specific text
       * @param text - Text that should be contained in the log message
       */
      expectLogContaining: (text: string) => {
        const allCalls = [
          ...mockInfo.mock.calls,
          ...mockWarn.mock.calls,
          ...mockError.mock.calls,
          ...mockDebug.mock.calls,
          ...mockVerbose.mock.calls,
          ...mockSilly.mock.calls,
        ];

        const foundCall = allCalls.some(call =>
          call.some((arg: any) =>
            typeof arg === 'string' && arg.includes(text)
          )
        );

        expect(foundCall).toBe(true);
      },

      /**
       * Verify that error log was called with an Error object
       * @param errorMessage - Expected error message (optional)
       * @param errorType - Expected error constructor (optional)
       */
      expectErrorWithException: (errorMessage?: string, errorType?: new (...args: any[]) => Error) => {
        expect(mockError).toHaveBeenCalled();

        const errorCall = mockError.mock.calls.find(call =>
          call.some((arg: any) => arg instanceof Error)
        );

        expect(errorCall).toBeDefined();

        if (errorMessage || errorType) {
          const errorArg = errorCall?.find((arg: any) => arg instanceof Error);

          if (errorMessage) {
            expect(errorArg?.message).toContain(errorMessage);
          }

          if (errorType) {
            expect(errorArg).toBeInstanceOf(errorType);
          }
        }
      },

      /**
       * Get all log calls for a specific level
       * @param level - The log level
       * @returns Array of call arguments
       */
      getLogCalls: (level: 'info' | 'warn' | 'error' | 'debug' | 'verbose' | 'silly') => {
        return mockLoggerInstance[level].mock.calls;
      },

      /**
       * Get all log calls across all levels
       * @returns Object with calls for each level
       */
      getAllLogCalls: () => {
        return {
          info: mockInfo.mock.calls,
          warn: mockWarn.mock.calls,
          error: mockError.mock.calls,
          debug: mockDebug.mock.calls,
          verbose: mockVerbose.mock.calls,
          silly: mockSilly.mock.calls,
        };
      },

      /**
       * Verify that no logs were called at any level
       */
      expectNoLogs: () => {
        expect(mockInfo).not.toHaveBeenCalled();
        expect(mockWarn).not.toHaveBeenCalled();
        expect(mockError).not.toHaveBeenCalled();
        expect(mockDebug).not.toHaveBeenCalled();
        expect(mockVerbose).not.toHaveBeenCalled();
        expect(mockSilly).not.toHaveBeenCalled();
      },

      /**
       * Verify that logs were called in a specific order
       * @param expectedCalls - Array of expected calls in order
       */
      expectLogOrder: (expectedCalls: Array<{
        level: 'info' | 'warn' | 'error' | 'debug' | 'verbose' | 'silly';
        message: string;
        meta?: any;
      }>) => {
        // Get all calls with timestamps
        const allCallsWithLevel: Array<{
          level: string;
          args: any[];
          callTime: number;
        }> = [];

        Object.entries(mockLoggerInstance).forEach(([level, mockFn]) => {
          if (jest.isMockFunction(mockFn)) {
            mockFn.mock.invocationCallOrder.forEach((callTime, index) => {
              allCallsWithLevel.push({
                level,
                args: mockFn.mock.calls[index],
                callTime,
              });
            });
          }
        });

        // Sort by call time
        allCallsWithLevel.sort((a, b) => a.callTime - b.callTime);

        // Verify the order matches expected calls
        expectedCalls.forEach((expectedCall, index) => {
          const actualCall = allCallsWithLevel[index];
          expect(actualCall).toBeDefined();
          expect(actualCall!.level).toBe(expectedCall.level);

          if (expectedCall.meta !== undefined) {
            expect(actualCall!.args).toEqual([expectedCall.message, expectedCall.meta]);
          } else {
            expect(actualCall!.args[0]).toBe(expectedCall.message);
          }
        });
      },

      /**
       * Create a spy on console methods (useful for testing console.log, etc.)
       */
      spyOnConsole: () => {
        const consoleSpy = {
          log: jest.spyOn(console, 'log').mockImplementation(),
          warn: jest.spyOn(console, 'warn').mockImplementation(),
          error: jest.spyOn(console, 'error').mockImplementation(),
          info: jest.spyOn(console, 'info').mockImplementation(),
          debug: jest.spyOn(console, 'debug').mockImplementation(),
        };

        return {
          ...consoleSpy,
          restore: () => {
            Object.values(consoleSpy).forEach(spy => spy.mockRestore());
          },
          reset: () => {
            Object.values(consoleSpy).forEach(spy => spy.mockReset());
          },
        };
      },
    },

    /**
     * Predefined scenarios for common logging test cases
     */
    scenarios: {
      /**
       * Setup logger to capture all calls without throwing
       */
      captureAll: () => {
        // All mocks are already set up to capture calls
        return mockLoggerInstance;
      },

      /**
       * Setup logger to throw on error level
       */
      throwOnError: () => {
        mockError.mockImplementation((message: string, _meta?: any) => {
          throw new Error(`Logger error: ${message}`);
        });
      },

      /**
       * Setup logger to be silent (no-op)
       */
      silent: () => {
        // Mocks are already no-op by default
        return mockLoggerInstance;
      },

      /**
       * Setup logger with custom implementations
       */
      custom: (implementations: Partial<{
        info: (...args: any[]) => any;
        warn: (...args: any[]) => any;
        error: (...args: any[]) => any;
        debug: (...args: any[]) => any;
        verbose: (...args: any[]) => any;
        silly: (...args: any[]) => any;
      }>) => {
        Object.entries(implementations).forEach(([level, impl]) => {
          const mockFn = mockLoggerInstance[level as keyof typeof mockLoggerInstance];
          if (jest.isMockFunction(mockFn) && impl) {
            mockFn.mockImplementation(impl);
          }
        });
      },
    },
  };
}

/**
 * Create a mock Express request object with proper typing
 * @template P - Type for request parameters
 * @template B - Type for request body
 * @template Q - Type for request query
 * @param overrides - Optional overrides for the request object
 * @returns A properly typed mock request object
 */
export function createMockRequest<
  P = Record<string, any>,
  B = Record<string, any>,
  Q = Record<string, any>,
>(
  overrides: Partial<Request<P, any, B, Q>> = {},
): Partial<Request<P, any, B, Q>> {
  const timestamp = Math.floor(Date.now() / 1000);

  const mockUser: JWTPayload = {
    sub: "test-user-id",
    email: "test@example.com",
    role: "student" as UserRole,
    iat: timestamp,
    exp: timestamp + 3600,
  };

  const req: Partial<Request<P, any, B, Q>> = {
    body: {} as B,
    params: {} as P,
    query: {} as Q,
    headers: {},
    cookies: {},
    path: "/test-path",
    url: "/test-path",
    method: "GET",
    ip: "127.0.0.1",
    protocol: "http",
    secure: false,
    hostname: "localhost",
    originalUrl: "/test-path",
    baseUrl: "",
    user: mockUser,
  };

  // Add methods with proper typing
  req.get = jest.fn((name: string) => {
    if (name.toLowerCase() === "user-agent") return "Test User Agent";
    if (name.toLowerCase() === "set-cookie") return ["cookie=value"];
    return undefined;
  }) as any;

  req.header = jest.fn((name: string) => {
    if (name.toLowerCase() === "user-agent") return "Test User Agent";
    if (name.toLowerCase() === "set-cookie") return ["cookie=value"];
    return undefined;
  }) as any;

  req.accepts = jest.fn((...types: string[]) => {
    return types.length ? types[0] : ["*/*"];
  }) as any;

  req.acceptsCharsets = jest.fn((...charsets: string[]) => {
    return charsets.length ? charsets[0] : ["utf-8"];
  }) as any;

  req.acceptsEncodings = jest.fn((...encodings: string[]) => {
    return encodings.length ? encodings[0] : ["gzip", "deflate"];
  }) as any;

  req.acceptsLanguages = jest.fn((...langs: string[]) => {
    return langs.length ? langs[0] : ["en"];
  }) as any;

  req.is = jest.fn(() => false) as any;

  return {
    ...req,
    ...overrides,
  };
}

/**
 * Create a mock Express response object with proper typing
 * @returns A properly typed mock response object
 */
export function createMockResponse(): Response {
  const res: Partial<Response> = {
    locals: {},
    headersSent: false,
    app: {} as any,
  };

  // Add all required methods with proper return type chaining
  res.status = jest.fn().mockReturnValue(res as Response);
  res.json = jest.fn().mockReturnValue(res as Response);
  res.send = jest.fn().mockReturnValue(res as Response);
  res.end = jest.fn().mockReturnValue(res as Response);
  res.set = jest.fn().mockReturnValue(res as Response);
  res.header = jest.fn().mockReturnValue(res as Response);
  res.cookie = jest.fn().mockReturnValue(res as Response);
  res.clearCookie = jest.fn().mockReturnValue(res as Response);
  res.redirect = jest.fn().mockReturnValue(res as Response);
  res.render = jest.fn().mockReturnValue(res as Response);
  res.sendStatus = jest.fn().mockReturnValue(res as Response);
  res.type = jest.fn().mockReturnValue(res as Response);
  res.format = jest.fn().mockReturnValue(res as Response);
  res.attachment = jest.fn().mockReturnValue(res as Response);
  res.append = jest.fn().mockReturnValue(res as Response);
  res.location = jest.fn().mockReturnValue(res as Response);
  res.links = jest.fn().mockReturnValue(res as Response);
  res.vary = jest.fn().mockReturnValue(res as Response);

  // Add getters/setters
  res.get = jest.fn().mockReturnValue("");

  return res as Response;
}

/**
 * Create a mock Express next function with proper typing for error handling
 * @returns A properly typed mock next function
 */
export function createMockNext(): NextFunction {
  // Using unknown as an intermediate type to avoid type errors
  return jest.fn() as unknown as NextFunction;
}

/**
 * Standard pattern for service tests
 * Sets up a service test environment with repository mocks and common dependencies
 * @template T - Type of the service being tested
 * @param ServiceClass - The service class constructor
 * @param mockRepository - Mock repository instance
 * @param additionalDependencies - Additional mock dependencies (optional)
 * @returns Test setup object with service instance and helper methods
 */
export function setupServiceTest<T>(
  ServiceClass: new (...args: any[]) => T,
  mockRepository: any,
  additionalDependencies: Record<string, any> = {},
): {
  service: T;
  mockRepository: any;
  mockAuth: any;
  mockLogger: any;
  additionalDependencies: Record<string, any>;
  helpers: {
    reset: () => void;
    mockRepositoryMethod: (methodName: string, returnValue: any) => void;
    mockRepositoryError: (methodName: string, error: Error) => void;
    mockAuthMethods: (hashResult?: string, compareResult?: boolean) => void;
    createMockPaginatedResult: <TData>(
      data: TData[],
      options?: QueryOptions,
    ) => PaginatedResult<TData>;
    expectRepositoryCall: (methodName: string, ...expectedArgs: any[]) => void;
    expectRepositoryCallCount: (methodName: string, times: number) => void;
    expectLoggerCall: (
      level: "info" | "warn" | "error" | "debug",
      message: string,
      meta?: any,
    ) => void;
  };
} {
  // Create service instance with mocked dependencies
  const service = new ServiceClass(
    mockRepository,
    ...Object.values(additionalDependencies),
  );

  // Mock common external dependencies
  const mockAuth = {
    hashPassword: jest.fn().mockResolvedValue("hashed-password"),
    comparePassword: jest.fn().mockResolvedValue(true),
  };

  const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };

  // Setup default mocks for auth and logger
  jest.doMock("@/shared/utils/auth", () => mockAuth);
  jest.doMock("@/shared/utils/logger", () => ({ logger: mockLogger }));

  return {
    service,
    mockRepository,
    mockAuth,
    mockLogger,
    additionalDependencies,

    // Helper methods for common service test operations
    helpers: {
      /**
       * Reset all mocks between tests
       */
      reset: () => {
        jest.clearAllMocks();

        // Reset repository mocks
        if (mockRepository) {
          Object.keys(mockRepository).forEach((key) => {
            if (jest.isMockFunction(mockRepository[key])) {
              mockRepository[key].mockReset();
            }
          });
        }

        // Reset additional dependency mocks
        Object.values(additionalDependencies).forEach((dep) => {
          if (dep && typeof dep === "object") {
            Object.keys(dep).forEach((key) => {
              if (jest.isMockFunction(dep[key])) {
                dep[key].mockReset();
              }
            });
          }
        });

        // Reset auth mocks
        mockAuth.hashPassword.mockReset().mockResolvedValue("hashed-password");
        mockAuth.comparePassword.mockReset().mockResolvedValue(true);

        // Reset logger mocks
        (Object.keys(mockLogger) as Array<keyof typeof mockLogger>).forEach(
          (key) => {
            mockLogger[key].mockReset();
          },
        );
      },

      /**
       * Setup repository method mocks with default return values
       * @param methodName - Name of the repository method
       * @param returnValue - Value to return from the mock
       */
      mockRepositoryMethod: (methodName: string, returnValue: any) => {
        if (mockRepository && mockRepository[methodName]) {
          mockRepository[methodName].mockResolvedValue(returnValue);
        }
      },

      /**
       * Setup repository method to throw an error
       * @param methodName - Name of the repository method
       * @param error - Error to throw
       */
      mockRepositoryError: (methodName: string, error: Error) => {
        if (mockRepository && mockRepository[methodName]) {
          mockRepository[methodName].mockRejectedValue(error);
        }
      },

      /**
       * Setup auth mock responses
       * @param hashResult - Result for hashPassword mock
       * @param compareResult - Result for comparePassword mock
       */
      mockAuthMethods: (
        hashResult: string = "hashed-password",
        compareResult: boolean = true,
      ) => {
        mockAuth.hashPassword.mockResolvedValue(hashResult);
        mockAuth.comparePassword.mockResolvedValue(compareResult);
      },

      /**
       * Create a mock paginated result for testing
       * @param data - Array of data items
       * @param options - Query options for pagination
       */
      createMockPaginatedResult: <TData>(
        data: TData[],
        options: QueryOptions = { page: 1, limit: 20 },
      ): PaginatedResult<TData> => {
        return createPaginatedResult(data, options);
      },

      /**
       * Verify that a repository method was called with specific arguments
       * @param methodName - Name of the repository method
       * @param expectedArgs - Expected arguments
       */
      expectRepositoryCall: (methodName: string, ...expectedArgs: any[]) => {
        expect(mockRepository[methodName]).toHaveBeenCalledWith(
          ...expectedArgs,
        );
      },

      /**
       * Verify that a repository method was called a specific number of times
       * @param methodName - Name of the repository method
       * @param times - Expected number of calls
       */
      expectRepositoryCallCount: (methodName: string, times: number) => {
        expect(mockRepository[methodName]).toHaveBeenCalledTimes(times);
      },

      /**
       * Verify that logger was called with specific message
       * @param level - Log level (info, warn, error, debug)
       * @param message - Expected log message
       * @param meta - Optional metadata object
       */
      expectLoggerCall: (
        level: "info" | "warn" | "error" | "debug",
        message: string,
        meta?: any,
      ) => {
        if (meta) {
          expect(mockLogger[level]).toHaveBeenCalledWith(message, meta);
        } else {
          expect(mockLogger[level]).toHaveBeenCalledWith(message);
        }
      },
    },
  };
}

/**
 * Test Pattern Library
 * Reusable patterns for common testing scenarios
 */

/**
 * Controller Test Setup Pattern
 * Sets up a standard controller test environment with request, response, and next function mocks
 */
export interface ControllerTestSetup<P = any, B = any, Q = any> {
  req: Partial<Request<P, any, B, Q>>;
  res: Response;
  next: NextFunction;
  // Helper methods for common controller test operations
  expectSuccess: (statusCode?: number) => void;
  expectError: (statusCode: number, message?: string) => void;
  expectValidationError: (field?: string) => void;
  expectAuthError: () => void;
  expectNotFound: () => void;
  setAuthenticatedUser: (user?: Partial<JWTPayload>) => void;
  setRequestBody: (body: B) => void;
  setRequestParams: (params: P) => void;
  setRequestQuery: (query: Q) => void;
}

/**
 * Setup a standard controller test environment
 * @param overrides - Optional overrides for request object
 * @returns Controller test setup with mocks and helper methods
 */
export function setupControllerTest<P = any, B = any, Q = any>(
  overrides: Partial<Request<P, any, B, Q>> = {},
): ControllerTestSetup<P, B, Q> {
  const req = createMockRequest<P, B, Q>(overrides);
  const res = createMockResponse();
  const next = createMockNext();

  const setup: ControllerTestSetup<P, B, Q> = {
    req,
    res,
    next,

    expectSuccess: (statusCode = 200) => {
      expect(res.status).toHaveBeenCalledWith(statusCode);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    },

    expectError: (statusCode: number, message?: string) => {
      expect(next).toHaveBeenCalled();
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode || error.status).toBe(statusCode);
      if (message) {
        expect(error.message).toContain(message);
      }
    },

    expectValidationError: (field?: string) => {
      expect(next).toHaveBeenCalled();
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode || error.status).toBe(400);
      if (field) {
        expect(error.message || error.details).toContain(field);
      }
    },

    expectAuthError: () => {
      expect(next).toHaveBeenCalled();
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode || error.status).toBe(401);
    },

    expectNotFound: () => {
      expect(next).toHaveBeenCalled();
      const error = (next as jest.Mock).mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode || error.status).toBe(404);
    },

    setAuthenticatedUser: (user?: Partial<JWTPayload>) => {
      const timestamp = Math.floor(Date.now() / 1000);
      const defaultUser: JWTPayload = {
        sub: "test-user-id",
        email: "test@example.com",
        role: "student" as UserRole,
        iat: timestamp,
        exp: timestamp + 3600,
        ...user,
      };
      req.user = defaultUser;
    },

    setRequestBody: (body: B) => {
      req.body = body;
    },

    setRequestParams: (params: P) => {
      req.params = params;
    },

    setRequestQuery: (query: Q) => {
      req.query = query;
    },
  };

  return setup;
}

/**
 * Service Test Setup Pattern
 * Sets up a standard service test environment with repository mocks and other dependencies
 */
export interface ServiceTestSetup {
  mockRepository: ReturnType<typeof createMockRepository>;
  mockPrisma: DeepMockProxy<PrismaClient>;
  // Helper methods for common service test operations
  expectRepositoryCall: (method: string, args?: any) => void;
  expectRepositoryNotCalled: (method: string) => void;
  mockRepositorySuccess: (method: string, returnValue: any) => void;
  mockRepositoryError: (method: string, error: Error) => void;
  mockRepositoryResolvedValue: (method: string, value: any) => void;
  mockRepositoryRejectedValue: (method: string, error: Error) => void;
  expectPrismaCall: (model: string, method: string, args?: any) => void;
  mockPrismaSuccess: (model: string, method: string, returnValue: any) => void;
  mockPrismaError: (model: string, method: string, error: Error) => void;
  resetAllMocks: () => void;
}

/**
 * Setup a standard service test environment
 * @param options - Optional configuration for the service test setup
 * @returns Service test setup with mocks and helper methods
 */
export function createServiceTestSetup(
  options: {
    mockRepository?: boolean;
    mockPrisma?: boolean;
  } = {},
): ServiceTestSetup {
  const {
    mockRepository: shouldMockRepository = true,
    mockPrisma: shouldMockPrisma = true,
  } = options;

  const mockRepository = shouldMockRepository ? createMockRepository() : null;
  const mockPrisma = shouldMockPrisma ? createMockPrismaClient() : null;

  const setup: ServiceTestSetup = {
    mockRepository: mockRepository!,
    mockPrisma: mockPrisma!,

    expectRepositoryCall: (method: string, args?: any) => {
      if (!mockRepository) throw new Error("Repository mock not enabled");
      const mockMethod = mockRepository[
        method as keyof typeof mockRepository
      ] as jest.Mock;
      expect(mockMethod).toHaveBeenCalled();
      if (args !== undefined) {
        expect(mockMethod).toHaveBeenCalledWith(args);
      }
    },

    expectRepositoryNotCalled: (method: string) => {
      if (!mockRepository) throw new Error("Repository mock not enabled");
      const mockMethod = mockRepository[
        method as keyof typeof mockRepository
      ] as jest.Mock;
      expect(mockMethod).not.toHaveBeenCalled();
    },

    mockRepositorySuccess: (method: string, returnValue: any) => {
      if (!mockRepository) throw new Error("Repository mock not enabled");
      const mockMethod = mockRepository[
        method as keyof typeof mockRepository
      ] as jest.Mock;
      mockMethod.mockResolvedValue(returnValue);
    },

    mockRepositoryError: (method: string, error: Error) => {
      if (!mockRepository) throw new Error("Repository mock not enabled");
      const mockMethod = mockRepository[
        method as keyof typeof mockRepository
      ] as jest.Mock;
      mockMethod.mockRejectedValue(error);
    },

    mockRepositoryResolvedValue: (method: string, value: any) => {
      if (!mockRepository) throw new Error("Repository mock not enabled");
      const mockMethod = mockRepository[
        method as keyof typeof mockRepository
      ] as jest.Mock;
      mockMethod.mockResolvedValue(value);
    },

    mockRepositoryRejectedValue: (method: string, error: Error) => {
      if (!mockRepository) throw new Error("Repository mock not enabled");
      const mockMethod = mockRepository[
        method as keyof typeof mockRepository
      ] as jest.Mock;
      mockMethod.mockRejectedValue(error);
    },

    expectPrismaCall: (model: string, method: string, args?: any) => {
      if (!mockPrisma) throw new Error("Prisma mock not enabled");
      const modelMock = mockPrisma[model as keyof typeof mockPrisma] as any;
      const methodMock = modelMock[method] as jest.Mock;
      expect(methodMock).toHaveBeenCalled();
      if (args !== undefined) {
        expect(methodMock).toHaveBeenCalledWith(args);
      }
    },

    mockPrismaSuccess: (model: string, method: string, returnValue: any) => {
      if (!mockPrisma) throw new Error("Prisma mock not enabled");
      const modelMock = mockPrisma[model as keyof typeof mockPrisma] as any;
      const methodMock = modelMock[method] as jest.Mock;
      methodMock.mockResolvedValue(returnValue);
    },

    mockPrismaError: (model: string, method: string, error: Error) => {
      if (!mockPrisma) throw new Error("Prisma mock not enabled");
      const modelMock = mockPrisma[model as keyof typeof mockPrisma] as any;
      const methodMock = modelMock[method] as jest.Mock;
      methodMock.mockRejectedValue(error);
    },

    resetAllMocks: () => {
      if (mockRepository) {
        Object.values(mockRepository).forEach((mock) => {
          if (jest.isMockFunction(mock)) {
            mock.mockReset();
          }
        });
      }
      if (mockPrisma) {
        jest.clearAllMocks();
      }
    },
  };

  return setup;
}

/**
 * Repository Test Setup Pattern
 * Sets up a standard repository test environment with database mocks and other dependencies
 */
export interface RepositoryTestSetup {
  mockPrisma: DeepMockProxy<PrismaClient>;
  // Helper methods for common repository test operations
  expectDatabaseCall: (model: string, method: string, args?: any) => void;
  expectDatabaseNotCalled: (model: string, method: string) => void;
  mockDatabaseSuccess: (
    model: string,
    method: string,
    returnValue: any,
  ) => void;
  mockDatabaseError: (model: string, method: string, error: Error) => void;
  mockTransactionSuccess: (returnValue: any) => void;
  mockTransactionError: (error: Error) => void;
  expectTransactionCall: () => void;
  expectTransactionNotCalled: () => void;
  mockFindUnique: (model: string, returnValue: any) => void;
  mockFindMany: (model: string, returnValue: any[]) => void;
  mockCreate: (model: string, returnValue: any) => void;
  mockUpdate: (model: string, returnValue: any) => void;
  mockDelete: (model: string, returnValue: any) => void;
  mockCount: (model: string, returnValue: number) => void;
  resetAllMocks: () => void;
}

/**
 * Setup a standard repository test environment
 * @param options - Optional configuration for the repository test setup
 * @returns Repository test setup with mocks and helper methods
 */
export function setupRepositoryTest(
  options: {
    enableTransactionMock?: boolean;
  } = {},
): RepositoryTestSetup {
  const { enableTransactionMock = true } = options;

  const mockPrisma = createMockPrismaClient();

  // Setup transaction mock if enabled
  if (enableTransactionMock) {
    mockPrisma.$transaction.mockImplementation(async (callback: any) => {
      if (typeof callback === "function") {
        return callback(mockPrisma);
      }
      return Promise.all(callback);
    });
  }

  const setup: RepositoryTestSetup = {
    mockPrisma,

    expectDatabaseCall: (model: string, method: string, args?: any) => {
      const modelMock = mockPrisma[model as keyof typeof mockPrisma] as any;
      const methodMock = modelMock[method] as jest.Mock;
      expect(methodMock).toHaveBeenCalled();
      if (args !== undefined) {
        expect(methodMock).toHaveBeenCalledWith(args);
      }
    },

    expectDatabaseNotCalled: (model: string, method: string) => {
      const modelMock = mockPrisma[model as keyof typeof mockPrisma] as any;
      const methodMock = modelMock[method] as jest.Mock;
      expect(methodMock).not.toHaveBeenCalled();
    },

    mockDatabaseSuccess: (model: string, method: string, returnValue: any) => {
      const modelMock = mockPrisma[model as keyof typeof mockPrisma] as any;
      const methodMock = modelMock[method] as jest.Mock;
      methodMock.mockResolvedValue(returnValue);
    },

    mockDatabaseError: (model: string, method: string, error: Error) => {
      const modelMock = mockPrisma[model as keyof typeof mockPrisma] as any;
      const methodMock = modelMock[method] as jest.Mock;
      methodMock.mockRejectedValue(error);
    },

    mockTransactionSuccess: (returnValue: any) => {
      mockPrisma.$transaction.mockResolvedValue(returnValue);
    },

    mockTransactionError: (error: Error) => {
      mockPrisma.$transaction.mockRejectedValue(error);
    },

    expectTransactionCall: () => {
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    },

    expectTransactionNotCalled: () => {
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    },

    mockFindUnique: (model: string, returnValue: any) => {
      const modelMock = mockPrisma[model as keyof typeof mockPrisma] as any;
      modelMock.findUnique.mockResolvedValue(returnValue);
    },

    mockFindMany: (model: string, returnValue: any[]) => {
      const modelMock = mockPrisma[model as keyof typeof mockPrisma] as any;
      modelMock.findMany.mockResolvedValue(returnValue);
    },

    mockCreate: (model: string, returnValue: any) => {
      const modelMock = mockPrisma[model as keyof typeof mockPrisma] as any;
      modelMock.create.mockResolvedValue(returnValue);
    },

    mockUpdate: (model: string, returnValue: any) => {
      const modelMock = mockPrisma[model as keyof typeof mockPrisma] as any;
      modelMock.update.mockResolvedValue(returnValue);
    },

    mockDelete: (model: string, returnValue: any) => {
      const modelMock = mockPrisma[model as keyof typeof mockPrisma] as any;
      modelMock.delete.mockResolvedValue(returnValue);
    },

    mockCount: (model: string, returnValue: number) => {
      const modelMock = mockPrisma[model as keyof typeof mockPrisma] as any;
      modelMock.count.mockResolvedValue(returnValue);
    },

    resetAllMocks: () => {
      jest.clearAllMocks();
    },
  };

  return setup;
}
