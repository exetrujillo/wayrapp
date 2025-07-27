/**
 * Database Connection Tests for WayrApp Sovereign Nodes
 * 
 * Test suite for the database connection module exports.
 * Tests the actual exported functionality that other modules use,
 * ensuring the sovereign node's database connection works correctly.
 * 
 * @author Exequiel Trujillo
  * 
 * @since 1.0.0
 * 
 * Note: This tests the exported prisma client, not internal implementation details.
 */

import { PrismaClient } from '@prisma/client';

// Mock PrismaClient methods
const mockDisconnect = jest.fn().mockResolvedValue(undefined);
const mockQueryRaw = jest.fn().mockResolvedValue([{ result: 1 }]);
const mockUse = jest.fn();

const mockPrismaClient = {
  $disconnect: mockDisconnect,
  $queryRaw: mockQueryRaw,
  $use: mockUse,
} as unknown as PrismaClient;

const mockPrismaConstructor = jest.fn().mockImplementation(() => mockPrismaClient);

// Mock PrismaClient constructor
jest.mock('@prisma/client', () => ({
  PrismaClient: mockPrismaConstructor,
}));

// Mock the logger to avoid console output during tests
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

jest.mock('@/shared/utils/logger', () => ({
  logger: mockLogger,
}));

describe('Database Connection Module', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Exported Prisma Client', () => {
    it('should export a prisma client instance', () => {
      const prisma = require('../connection').default;
      
      expect(prisma).toBeDefined();
      expect(typeof prisma).toBe('object');
      expect(prisma).toBe(mockPrismaClient);
    });

    it('should export the same instance as named export', () => {
      const connectionModule = require('../connection');
      
      expect(connectionModule.prisma).toBeDefined();
      expect(connectionModule.default).toBe(connectionModule.prisma);
    });
  });

  describe('Module Initialization', () => {
    it('should create PrismaClient instance on module load', () => {
      // Clear previous calls
      mockPrismaConstructor.mockClear();
      
      // Re-import to trigger initialization
      jest.resetModules();
      require('../connection');
      
      expect(mockPrismaConstructor).toHaveBeenCalledTimes(1);
    });

    it('should configure PrismaClient with datasource', () => {
      // Clear previous calls
      mockPrismaConstructor.mockClear();
      
      // Re-import to trigger initialization
      jest.resetModules();
      require('../connection');
      
      expect(mockPrismaConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          datasources: {
            db: {
              url: expect.any(String),
            },
          },
        })
      );
    });

    it('should configure logging', () => {
      // Clear previous calls
      mockPrismaConstructor.mockClear();
      
      // Re-import to trigger initialization
      jest.resetModules();
      require('../connection');
      
      expect(mockPrismaConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          log: expect.any(Array),
        })
      );
    });

    it('should set up query monitoring middleware', () => {
      // Clear previous calls
      mockUse.mockClear();
      
      // Re-import to trigger initialization
      jest.resetModules();
      require('../connection');
      
      expect(mockUse).toHaveBeenCalled();
    });

    it('should log successful initialization', () => {
      // Clear previous calls
      mockLogger.info.mockClear();
      
      // Re-import to trigger initialization
      jest.resetModules();
      require('../connection');
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Database connection initialized with optimized pooling',
        expect.objectContaining({
          connectionLimit: expect.any(String),
          poolTimeout: expect.any(String),
          environment: expect.any(String),
        })
      );
    });
  });

  describe('Database Operations', () => {
    let prisma: any;

    beforeEach(() => {
      jest.resetModules();
      prisma = require('../connection').default;
    });

    it('should support raw database queries', async () => {
      const result = await prisma.$queryRaw`SELECT 1`;
      
      expect(result).toEqual([{ result: 1 }]);
      expect(mockQueryRaw).toHaveBeenCalled();
    });

    it('should support database disconnection', async () => {
      await prisma.$disconnect();
      
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should maintain singleton pattern', () => {
      const prisma2 = require('../connection').default;
      
      expect(prisma).toBe(prisma2);
      expect(mockPrismaConstructor).toHaveBeenCalledTimes(1);
    });
  });

  describe('Graceful Shutdown', () => {
    let originalProcessOn: any;
    let mockProcessOn: jest.Mock;

    beforeEach(() => {
      // Mock process.on to capture event handlers
      originalProcessOn = process.on;
      mockProcessOn = jest.fn();
      process.on = mockProcessOn;
    });

    afterEach(() => {
      // Restore original process.on
      process.on = originalProcessOn;
    });

    it('should register SIGINT handler', () => {
      jest.resetModules();
      require('../connection');

      expect(mockProcessOn).toHaveBeenCalledWith('SIGINT', expect.any(Function));
    });

    it('should register SIGTERM handler', () => {
      jest.resetModules();
      require('../connection');

      expect(mockProcessOn).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });
  });

  describe('Sovereign Node Characteristics', () => {
    it('should provide a single database connection for the community node', () => {
      jest.resetModules();
      const prisma = require('../connection').default;
      
      // Verify we get a single, consistent connection
      expect(prisma).toBeDefined();
      expect(mockPrismaConstructor).toHaveBeenCalledTimes(1);
    });

    it('should initialize with appropriate configuration for community deployment', () => {
      jest.resetModules();
      require('../connection');
      
      // Verify configuration suitable for community hosting
      expect(mockPrismaConstructor).toHaveBeenCalledWith(
        expect.objectContaining({
          datasources: expect.objectContaining({
            db: expect.objectContaining({
              url: expect.any(String),
            }),
          }),
          log: expect.any(Array),
        })
      );
    });

    it('should set up monitoring for community administrators', () => {
      jest.resetModules();
      require('../connection');
      
      // Verify monitoring setup
      expect(mockUse).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Database connection initialized'),
        expect.any(Object)
      );
    });
  });
});