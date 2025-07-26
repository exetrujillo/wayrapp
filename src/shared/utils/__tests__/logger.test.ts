// src/shared/utils/__tests__/logger.test.ts

/**
 * Test suite for the logger utility module, covering environment-aware logging configuration and Winston integration.
 * 
 * These tests verify that the logger correctly adapts to different deployment environments (serverless vs traditional),
 * properly configures Winston transports, handles log levels appropriately, and manages file system operations safely.
 * The test suite validates the core logging functionality, environment detection logic, directory creation behavior,
 * and ensures the logger exports are correctly structured for both named and default imports.
 * 
 * @fileoverview Unit tests for logger.ts - environment-aware logging utility
 * @author Exequiel Trujillo
 * @version 1.0.0
 * @since 1.0.0
 */

// Mock fs module
const mockFs = {
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
};
jest.mock('fs', () => mockFs);

// Mock winston
const mockWinston = {
  format: {
    combine: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis(),
    printf: jest.fn().mockReturnThis(),
    colorize: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    simple: jest.fn().mockReturnThis(),
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn(),
  },
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    http: jest.fn(),
  }),
  addColors: jest.fn(),
};
jest.mock('winston', () => mockWinston);

describe('Logger Utility', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Reset environment variables
    process.env = { ...originalEnv };
    delete process.env['VERCEL'];
    delete process.env['AWS_LAMBDA_FUNCTION_NAME'];
    delete process.env['NETLIFY'];
    delete process.env['LOG_LEVEL'];
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('logger exports', () => {
    it('should expose all required logging methods', () => {
      // Import the logger after mocking
      const { logger } = require('../logger');

      // Assert all log levels are available
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.debug).toBeDefined();
      expect(logger.http).toBeDefined();
    });

    it('should provide both named and default exports', () => {
      const loggerModule = require('../logger');

      // Assert both export patterns work
      expect(loggerModule.logger).toBeDefined();
      expect(loggerModule.default).toBeDefined();
      expect(loggerModule.logger).toBe(loggerModule.default);
    });
  });

  describe('winston configuration', () => {
    it('should configure winston with colors', () => {
      // Import to trigger winston setup
      require('../logger');

      // Assert winston.addColors was called
      expect(mockWinston.addColors).toHaveBeenCalledWith({
        error: "red",
        warn: "yellow",
        info: "green",
        http: "magenta",
        debug: "white",
      });
    });

    it('should create logger with correct configuration', () => {
      // Import to trigger winston setup
      require('../logger');

      // Assert winston.createLogger was called with expected config
      expect(mockWinston.createLogger).toHaveBeenCalledWith({
        level: "info", // default when LOG_LEVEL not set
        levels: {
          error: 0,
          warn: 1,
          info: 2,
          http: 3,
          debug: 4,
        },
        format: expect.any(Object),
        transports: expect.any(Array),
        exitOnError: false,
      });
    });

    it('should respect LOG_LEVEL environment variable', () => {
      // Arrange
      process.env['LOG_LEVEL'] = 'debug';

      // Act
      require('../logger');

      // Assert
      expect(mockWinston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug'
        })
      );
    });
  });

  describe('environment detection', () => {
    it('should detect Vercel serverless environment', () => {
      // Arrange
      process.env['VERCEL'] = '1';

      // Act
      require('../logger');

      // Assert - should only have console transport (no file transports)
      expect(mockWinston.transports.Console).toHaveBeenCalled();
      expect(mockWinston.transports.File).not.toHaveBeenCalled();
    });

    it('should detect AWS Lambda serverless environment', () => {
      // Arrange
      process.env['AWS_LAMBDA_FUNCTION_NAME'] = 'my-function';

      // Act
      require('../logger');

      // Assert - should only have console transport
      expect(mockWinston.transports.Console).toHaveBeenCalled();
      expect(mockWinston.transports.File).not.toHaveBeenCalled();
    });

    it('should detect Netlify serverless environment', () => {
      // Arrange
      process.env['NETLIFY'] = 'true';

      // Act
      require('../logger');

      // Assert - should only have console transport
      expect(mockWinston.transports.Console).toHaveBeenCalled();
      expect(mockWinston.transports.File).not.toHaveBeenCalled();
    });

    it('should configure file transports in traditional server environment', () => {
      // Act
      require('../logger');

      // Assert - should have console + file transports
      expect(mockWinston.transports.Console).toHaveBeenCalled();
      expect(mockWinston.transports.File).toHaveBeenCalledWith({
        filename: "logs/error.log",
        level: "error",
        format: expect.any(Object),
      });
      expect(mockWinston.transports.File).toHaveBeenCalledWith({
        filename: "logs/combined.log",
        format: expect.any(Object),
      });
    });
  });

  describe('directory creation', () => {
    it('should create logs directory when it does not exist in traditional environment', () => {
      // Arrange
      mockFs.existsSync.mockReturnValue(false);

      // Act
      require('../logger');

      // Assert
      expect(mockFs.existsSync).toHaveBeenCalledWith('logs');
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('logs');
    });

    it('should not create logs directory when it already exists', () => {
      // Arrange
      mockFs.existsSync.mockReturnValue(true);

      // Act
      require('../logger');

      // Assert
      expect(mockFs.existsSync).toHaveBeenCalledWith('logs');
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should not attempt directory creation in serverless environment', () => {
      // Arrange
      process.env['VERCEL'] = '1';

      // Act
      require('../logger');

      // Assert
      expect(mockFs.existsSync).not.toHaveBeenCalled();
      expect(mockFs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should handle directory creation errors gracefully', () => {
      // Arrange
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Act & Assert - should not throw
      expect(() => require('../logger')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Could not create logs directory:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });
});


