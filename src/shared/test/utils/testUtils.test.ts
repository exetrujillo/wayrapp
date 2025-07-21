/**
 * Test utilities tests
 * Basic tests to verify the test utilities work correctly
 */

import {
  mockDate,
  mockJwt,
  mockLogger,
  createMockRequest,
  createMockResponse,
  createMockNext,
  createMockPrismaClient,
} from './testUtils';

describe('Test Utilities', () => {
  describe('mockDate', () => {
    it('should mock the current date', () => {
      const testDate = new Date('2025-01-01T00:00:00Z');
      const dateMock = mockDate(testDate);

      expect(new Date().getTime()).toBe(testDate.getTime());
      expect(Date.now()).toBe(testDate.getTime());

      dateMock.restore();
    });

    it('should provide helper methods for common date scenarios', () => {
      const testDate = new Date('2025-01-01T12:00:00Z');
      const dateMock = mockDate(testDate);

      expect(dateMock.helpers.yesterday().getDate()).toBe(31);
      expect(dateMock.helpers.tomorrow().getDate()).toBe(2);
      expect(dateMock.helpers.startOfDay().getHours()).toBe(0);
      expect(dateMock.helpers.endOfDay().getHours()).toBe(23);

      dateMock.restore();
    });

    it('should allow advancing the date', () => {
      const testDate = new Date('2025-01-01T00:00:00Z');
      const dateMock = mockDate(testDate);

      // Test advancing by days
      dateMock.advanceByDays(1);
      const advancedDate = dateMock.getCurrentDate();
      expect(advancedDate.getUTCDate()).toBe(2); // Use UTC to avoid timezone issues

      // Test advancing by hours
      dateMock.advanceByHours(12);
      const advancedWithHours = dateMock.getCurrentDate();
      expect(advancedWithHours.getUTCHours()).toBe(12); // Use UTC to avoid timezone issues

      dateMock.restore();
    });
  });

  describe('mockJwt', () => {
    it('should mock JWT functions', () => {
      const jwtMock = mockJwt();

      // Test default behavior
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ sub: 'test' }, 'secret');
      expect(token).toMatch(/^mock-token-/);

      const payload = jwt.verify('valid-token', 'secret');
      expect(payload).toHaveProperty('sub', 'test-user-id');
      expect(payload).toHaveProperty('email', 'test@example.com');

      jwtMock.restore();
    });

    it('should handle different token scenarios', () => {
      const jwtMock = mockJwt();

      // Test expired token scenario using helper
      jwtMock.helpers.mockVerifyExpired();
      expect(() => jwtMock.mocks.verify('expired-token', 'secret')).toThrow('Token expired');

      // Test invalid token scenario using helper
      jwtMock.helpers.mockVerifyInvalid();
      expect(() => jwtMock.mocks.verify('invalid-token', 'secret')).toThrow('Invalid token');

      // Test malformed token scenario using helper
      jwtMock.helpers.mockVerifyMalformed();
      expect(() => jwtMock.mocks.verify('malformed-token', 'secret')).toThrow('Malformed token');

      jwtMock.restore();
    });

    it('should provide helper methods', () => {
      const jwtMock = mockJwt();

      const customPayload = jwtMock.helpers.mockVerifySuccess({
        sub: 'custom-user',
        role: 'admin' as any,
      });

      expect(customPayload.sub).toBe('custom-user');
      expect(customPayload.role).toBe('admin');

      jwtMock.restore();
    });
  });

  describe('mockLogger', () => {
    it('should mock logger functions', () => {
      const loggerMock = mockLogger();

      const { logger } = require('@/shared/utils/logger');
      logger.info('test message');
      logger.error('error message');

      loggerMock.helpers.expectInfo('test message');
      loggerMock.helpers.expectError('error message');

      loggerMock.restore();
    });

    it('should provide verification helpers', () => {
      const loggerMock = mockLogger();

      // Use the mock logger directly
      loggerMock.logger.warn('warning message', { extra: 'data' });

      loggerMock.helpers.expectLogCall('warn', 'warning message', { extra: 'data' });
      loggerMock.helpers.expectLogCallCount('warn', 1);

      loggerMock.restore();
    });
  });

  describe('createMockRequest', () => {
    it('should create a properly typed mock request', () => {
      const req = createMockRequest();

      expect(req.method).toBe('GET');
      expect(req.path).toBe('/test-path');
      expect(req.user).toHaveProperty('sub', 'test-user-id');
      expect(req.user).toHaveProperty('role', 'student');
      expect(typeof req.get).toBe('function');
    });

    it('should allow overrides', () => {
      const req = createMockRequest({
        method: 'POST',
        body: { test: 'data' },
        params: { id: '123' },
      });

      expect(req.method).toBe('POST');
      expect(req.body).toEqual({ test: 'data' });
      expect(req.params).toEqual({ id: '123' });
    });
  });

  describe('createMockResponse', () => {
    it('should create a properly typed mock response', () => {
      const res = createMockResponse();

      expect(typeof res.status).toBe('function');
      expect(typeof res.json).toBe('function');
      expect(typeof res.send).toBe('function');
      expect(res.locals).toEqual({});
      expect(res.headersSent).toBe(false);
    });

    it('should support method chaining', () => {
      const res = createMockResponse();

      const result = res.status(200).json({ success: true });
      expect(result).toBe(res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true });
    });
  });

  describe('createMockNext', () => {
    it('should create a properly typed next function', () => {
      const next = createMockNext();

      expect(typeof next).toBe('function');
      expect(jest.isMockFunction(next)).toBe(true);
    });
  });

  describe('createMockPrismaClient', () => {
    it('should create a mock Prisma client', () => {
      const prisma = createMockPrismaClient();

      expect(typeof prisma.$connect).toBe('function');
      expect(typeof prisma.$disconnect).toBe('function');
      expect(typeof prisma.$transaction).toBe('function');
      expect(jest.isMockFunction(prisma.$connect)).toBe(true);
    });
  });
});