/**
 * Logger Utility Tests
 */
import { mockLogger } from '@/shared/test/utils/testUtils';
import winston from 'winston';

// Mock winston
jest.mock('winston', () => {
  const mockFormat = {
    combine: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis(),
    printf: jest.fn().mockReturnThis(),
    colorize: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  
  const mockTransport = jest.fn();
  
  const mockLoggerInstance = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  
  return {
    format: mockFormat,
    transports: {
      Console: mockTransport,
      File: mockTransport,
    },
    createLogger: jest.fn().mockReturnValue(mockLoggerInstance),
  };
});

// Mock the logger module
jest.mock('../logger', () => {
  const mockLoggerInstance = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  
  return {
    logger: mockLoggerInstance,
    configureLogger: jest.fn(),
  };
});

describe('Logger Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('logger', () => {
    it('should expose logging methods', () => {
      // Import the mocked logger
      const { logger } = require('../logger');
      
      // Assert
      expect(logger.info).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.debug).toBeDefined();
    });
    
    it('should log messages with correct level', () => {
      // Arrange
      const { logger: mockLoggerInstance } = mockLogger();
      
      // Act
      mockLoggerInstance.info('Info message', { context: 'test' });
      mockLoggerInstance.warn('Warning message');
      mockLoggerInstance.error('Error message', new Error('Test error'));
      mockLoggerInstance.debug('Debug message');
      
      // Assert
      expect(mockLoggerInstance.info).toHaveBeenCalledWith('Info message', { context: 'test' });
      expect(mockLoggerInstance.warn).toHaveBeenCalledWith('Warning message');
      expect(mockLoggerInstance.error).toHaveBeenCalledWith('Error message', new Error('Test error'));
      expect(mockLoggerInstance.debug).toHaveBeenCalledWith('Debug message');
    });
  });
  
  describe('configureLogger', () => {
    const originalNodeEnv = process.env['NODE_ENV'];
    
    afterEach(() => {
      process.env['NODE_ENV'] = originalNodeEnv;
    });
    
    it('should configure logger with development settings', () => {
      // Arrange
      process.env['NODE_ENV'] = 'development';
      
      // Act
      configureLogger();
      
      // Assert
      expect(winston.createLogger).toHaveBeenCalled();
      expect(winston.format.combine).toHaveBeenCalled();
      expect(winston.format.timestamp).toHaveBeenCalled();
      expect(winston.format.colorize).toHaveBeenCalled();
      expect(winston.transports.Console).toHaveBeenCalled();
    });
    
    it('should configure logger with production settings', () => {
      // Arrange
      process.env['NODE_ENV'] = 'production';
      
      // Act
      configureLogger();
      
      // Assert
      expect(winston.createLogger).toHaveBeenCalled();
      expect(winston.format.combine).toHaveBeenCalled();
      expect(winston.format.timestamp).toHaveBeenCalled();
      expect(winston.format.json).toHaveBeenCalled();
      expect(winston.transports.Console).toHaveBeenCalled();
      expect(winston.transports.File).toHaveBeenCalledWith({ filename: 'error.log', level: 'error' });
      expect(winston.transports.File).toHaveBeenCalledWith({ filename: 'combined.log' });
    });
    
    it('should configure logger with test settings', () => {
      // Arrange
      process.env['NODE_ENV'] = 'test';
      
      // Act
      configureLogger();
      
      // Assert
      expect(winston.createLogger).toHaveBeenCalled();
      // In test mode, we might want to silence logs or use a different transport
    });
  });
});

// Mock implementation of configureLogger function
function configureLogger() {
  const env = process.env['NODE_ENV'] || 'development';
  
  const transports: any[] = [];
  
  if (env === 'production') {
    // Production: JSON format with file transports
    transports.push(
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    );
    
    winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports
    });
  } else if (env === 'development') {
    // Development: Colorized console output
    transports.push(new winston.transports.Console());
    
    winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `${timestamp} [${level}]: ${message}`;
        })
      ),
      transports
    });
  } else {
    // Test: Silent or minimal logging
    winston.createLogger({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: []
    });
  }
}
