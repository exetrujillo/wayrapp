/**
 * Tests for setupServiceTest pattern
 * Demonstrates usage and verifies functionality
 */

import { setupServiceTest } from '../testUtils';
import { AppError } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus } from '@/shared/types';

// Mock service class for testing
class MockService {
  constructor(private repository: any) { }

  async findById(id: string) {
    return this.repository.findById(id);
  }

  async create(data: any) {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new AppError('Already exists', HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
    }
    return this.repository.create(data);
  }

  async hashAndCreate(data: any) {
    const { hashPassword } = await import('@/shared/utils/auth');
    const hashedPassword = await hashPassword(data.password);
    return this.repository.create({ ...data, password: hashedPassword });
  }

  async logAndFind(id: string) {
    const { logger } = await import('@/shared/utils/logger');
    logger.info('Finding user', { id });
    return this.repository.findById(id);
  }
}

describe('setupServiceTest', () => {
  describe('basic setup', () => {
    it('should create service instance with mocked repository', () => {
      const mockRepository = {
        findById: jest.fn(),
        create: jest.fn(),
        findByEmail: jest.fn(),
      };

      const setup = setupServiceTest(MockService, mockRepository);

      expect(setup.service).toBeInstanceOf(MockService);
      expect(setup.mockRepository).toBe(mockRepository);
      expect(setup.mockAuth).toBeDefined();
      expect(setup.mockLogger).toBeDefined();
      expect(setup.helpers).toBeDefined();
    });

    it('should create service with additional dependencies', () => {
      const mockRepository = { findById: jest.fn() };
      const mockExternalDep = { someMethod: jest.fn() };

      const setup = setupServiceTest(
        MockService,
        mockRepository,
        { externalDep: mockExternalDep }
      );

      expect(setup.service).toBeInstanceOf(MockService);
      expect(setup.additionalDependencies['externalDep']).toBe(mockExternalDep);
    });
  });

  describe('helper methods', () => {
    let setup: ReturnType<typeof setupServiceTest>;
    let mockRepository: any;

    beforeEach(() => {
      mockRepository = {
        findById: jest.fn(),
        create: jest.fn(),
        findByEmail: jest.fn(),
      };

      setup = setupServiceTest(MockService, mockRepository);
    });

    it('should reset all mocks', async () => {
      // Call some methods to create call history
      await mockRepository.findById('test-id');
      await setup.mockAuth.hashPassword('test-password');
      setup.mockLogger.info('test message');

      // Verify mocks have been called
      expect(mockRepository.findById).toHaveBeenCalled();
      expect(setup.mockAuth.hashPassword).toHaveBeenCalled();
      expect(setup.mockLogger.info).toHaveBeenCalled();

      // Reset mocks
      setup.helpers.reset();

      // Verify mocks are reset
      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(setup.mockAuth.hashPassword).not.toHaveBeenCalled();
      expect(setup.mockLogger.info).not.toHaveBeenCalled();

      // Verify default values are restored
      await expect(setup.mockAuth.hashPassword()).resolves.toBe('hashed-password');
      await expect(setup.mockAuth.comparePassword()).resolves.toBe(true);
    });

    it('should mock repository methods', () => {
      const testUser = { id: '1', name: 'Test User' };

      setup.helpers.mockRepositoryMethod('findById', testUser);

      expect(mockRepository.findById).toHaveBeenCalledTimes(0);
      mockRepository.findById('1');
      expect(mockRepository.findById()).resolves.toEqual(testUser);
    });

    it('should mock repository errors', () => {
      const testError = new Error('Database error');

      setup.helpers.mockRepositoryError('findById', testError);

      expect(mockRepository.findById('1')).rejects.toThrow(testError);
    });

    it('should mock auth methods', () => {
      setup.helpers.mockAuthMethods('custom-hash', false);

      expect(setup.mockAuth.hashPassword()).resolves.toBe('custom-hash');
      expect(setup.mockAuth.comparePassword()).resolves.toBe(false);
    });

    it('should create mock paginated results', () => {
      const data = [{ id: '1' }, { id: '2' }];
      const result = setup.helpers.createMockPaginatedResult(data, { page: 1, limit: 10 });

      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(2);
    });

    it('should verify repository calls', () => {
      mockRepository.findById('test-id');

      setup.helpers.expectRepositoryCall('findById', 'test-id');
      setup.helpers.expectRepositoryCallCount('findById', 1);
    });

    it('should verify logger calls', () => {
      setup.mockLogger.info('Test message', { userId: '123' });

      setup.helpers.expectLoggerCall('info', 'Test message', { userId: '123' });
    });
  });

  describe('integration with service methods', () => {
    let setup: ReturnType<typeof setupServiceTest<MockService>>;

    beforeEach(() => {
      const mockRepository = {
        findById: jest.fn(),
        create: jest.fn(),
        findByEmail: jest.fn(),
      };

      setup = setupServiceTest(MockService, mockRepository);
    });

    it('should work with repository methods', async () => {
      const testUser = { id: '1', name: 'Test User' };
      setup.helpers.mockRepositoryMethod('findById', testUser);

      const result = await setup.service.findById('1');

      expect(result).toEqual(testUser);
      setup.helpers.expectRepositoryCall('findById', '1');
    });

    it('should work with auth utilities', async () => {
      const userData = { email: 'test@example.com', password: 'password123' };
      const createdUser = { id: '1', ...userData, password: 'hashed-password' };

      setup.helpers.mockRepositoryMethod('create', createdUser);

      const result = await setup.service.hashAndCreate(userData);

      expect(result).toEqual(createdUser);
      expect(setup.mockAuth.hashPassword).toHaveBeenCalledWith('password123');
    });

    it('should work with logger utilities', async () => {
      const testUser = { id: '1', name: 'Test User' };
      setup.helpers.mockRepositoryMethod('findById', testUser);

      const result = await setup.service.logAndFind('1');

      expect(result).toEqual(testUser);
      setup.helpers.expectLoggerCall('info', 'Finding user', { id: '1' });
    });

    it('should handle service errors properly', async () => {
      const userData = { email: 'existing@example.com' };
      const existingUser = { id: '1', email: 'existing@example.com' };

      setup.helpers.mockRepositoryMethod('findByEmail', existingUser);

      await expect(setup.service.create(userData)).rejects.toThrow(AppError);
      setup.helpers.expectRepositoryCall('findByEmail', 'existing@example.com');
    });
  });
});