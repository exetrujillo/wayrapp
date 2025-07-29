/**
 * Test suite for the Error Handler Middleware
 * 
 * This test suite validates the complete error handling system for the WayrApp backend API,
 * ensuring that all error types are properly processed, logged, and returned to clients
 * in a consistent format. The tests cover three main components:
 * 
 * 1. **errorHandler middleware**: Tests the global error handler's ability to process
 *    different error types (AppError, ZodError, Prisma errors, generic errors) and
 *    transform them into standardized API responses.
 * 
 * 2. **AppError class**: Validates the custom error class constructor, properties,
 *    and inheritance behavior to ensure proper error object creation.
 * 
 * 3. **asyncHandler utility**: Tests the async wrapper function's ability to catch
 *    and forward both synchronous and asynchronous errors to the error handler.
 * 
 * ## Test Coverage
 * 
 * ### Error Handler Middleware Tests
 * - Custom AppError processing with proper status codes and error codes
 * - Zod validation error transformation with detailed field-level errors
 * - Prisma database error mapping (P2002, P2025, validation errors)
 * - Generic error handling with sanitized responses
 * - Error logging with request context
 * 
 * ### AppError Class Tests
 * - Constructor parameter validation
 * - Property assignment verification
 * - Error inheritance and stack trace generation
 * - Operational error flag setting
 * 
 * ### AsyncHandler Utility Tests
 * - Successful async function execution
 * - Async error catching and forwarding
 * - Promise rejection handling
 * - Function context preservation
 * - Next function integration
 * 
 * ## Testing Strategy
 * 
 * The tests use comprehensive mocking to isolate the error handling logic:
 * - Mock Express request/response objects with realistic properties
 * - Mock logger to prevent console output during tests
 * - Mock Date.now() for consistent timestamp testing
 * - Use real error instances (ZodError, PrismaError) for authentic testing
 * @author Exequiel Trujillo
 * @since 1.0.0
 */
import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError, asyncHandler } from '../errorHandler';
import { createMockResponse, createMockNext, mockLogger } from '@/shared/test/utils/testUtils';
import { ErrorCodes, HttpStatus } from '@/shared/types';
import { ZodError, z } from 'zod';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';

/**
 * Main test suite for the Error Handler Middleware system
 * 
 * This suite tests the complete error handling pipeline including the global error handler,
 * custom error classes, and async wrapper utilities. Each test is designed to validate
 * specific error scenarios that can occur in a production environment.
 */
describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Response;
  let mockNext: NextFunction;
  let loggerMock: ReturnType<typeof mockLogger>;

  /**
   * Test setup - executed before each individual test
   * 
   * Creates a comprehensive testing environment with:
   * - Mocked Express request object with realistic properties
   * - Mocked Express response object with chainable methods
   * - Mocked Express next function for middleware testing
   * - Mocked logger to prevent console output during tests
   * - Fixed timestamp for consistent error response testing
   */
  beforeEach(() => {
    // Mock the logger to prevent actual logging during tests and enable verification
    loggerMock = mockLogger();

    // Create a comprehensive mock request that satisfies the Express.Request interface
    // This includes all properties that the error handler accesses for logging
    mockRequest = {
      path: '/test-path',           // Request path for error response
      url: '/test-path',            // Full URL for logging
      method: 'GET',                // HTTP method for logging
      ip: '127.0.0.1',             // Client IP for logging
      headers: {},                  // Request headers
      body: {},                     // Request body
      params: {},                   // Route parameters
      query: {},                    // Query parameters
      get: jest.fn((header) => {    // Header getter function
        if (header === 'User-Agent') return 'Test User Agent';
        if (header === 'set-cookie') return [];
        return undefined;
      }) as any,
      user: {                       // Authenticated user context (if available)
        sub: 'test-user-id',
        email: 'test@example.com',
        role: 'student' as any,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600
      }
    };

    // Create mock Express response and next function using test utilities
    mockResponse = createMockResponse();
    mockNext = createMockNext();

    // Mock Date.now() for consistent timestamps in error responses
    // This ensures test assertions don't fail due to timing differences
    jest.spyOn(Date, 'now').mockImplementation(() => 1609459200000); // 2021-01-01
  });

  /**
   * Test cleanup - executed after each individual test
   * 
   * Restores all mocked functions to their original implementations
   * to prevent test interference and memory leaks.
   */
  afterEach(() => {
    jest.restoreAllMocks();
    loggerMock.restore();
  });

  /**
   * Test suite for the errorHandler middleware function
   * 
   * These tests validate that the global error handler correctly processes different
   * types of errors and transforms them into consistent API responses. Each test
   * focuses on a specific error type to ensure comprehensive coverage.
   */
  describe('errorHandler', () => {
    /**
     * Test: Custom AppError handling
     * 
     * Validates that custom application errors are processed correctly:
     * - Uses the custom status code from the AppError
     * - Uses the custom error code from the AppError
     * - Preserves the original error message
     * - Sets details to undefined (no additional details for AppErrors)
     * - Includes proper timestamp and request path
     * - Logs the error for monitoring purposes
     */
    it('should handle AppError correctly', () => {
      // Arrange: Create a custom application error with specific properties
      const appError = new AppError('Test error message', HttpStatus.BAD_REQUEST, ErrorCodes.VALIDATION_ERROR);

      // Act: Process the error through the error handler
      errorHandler(appError, mockRequest as unknown as Request, mockResponse as Response, mockNext);

      // Assert: Verify the response format and status code
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        timestamp: expect.any(String),
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Test error message',
          details: undefined,
          path: '/test-path',
        },
      });

      // Logger is mocked to prevent console output during tests
    });

    /**
     * Test: Zod validation error handling
     * 
     * Validates that Zod schema validation errors are properly transformed:
     * - Returns 400 BAD_REQUEST status code
     * - Uses VALIDATION_ERROR error code
     * - Provides generic "Validation failed" message
     * - Includes detailed field-level validation errors in details array
     * - Each detail contains field path, error message, and Zod error code
     * - Handles multiple validation errors simultaneously
     */
    it('should handle ZodError correctly', () => {
      // Arrange: Create a Zod schema and generate validation errors
      const schema = z.object({
        name: z.string().min(3),
        email: z.string().email(),
      });
      const zodError = schema.safeParse({ name: 'Jo', email: 'invalid-email' }).error as ZodError;

      // Act: Process the Zod error through the error handler
      errorHandler(zodError, mockRequest as unknown as Request, mockResponse as Response, mockNext);

      // Assert: Verify the response includes detailed validation information
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        timestamp: expect.any(String),
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Validation failed',
          details: expect.arrayContaining([
            expect.objectContaining({ field: 'name' }),
            expect.objectContaining({ field: 'email' })
          ]),
          path: '/test-path',
        },
      });
    });

    /**
     * Test: Prisma P2025 error handling (Record not found)
     * 
     * Validates handling of Prisma's "Record not found" error:
     * - Maps P2025 error code to 404 NOT_FOUND status
     * - Uses NOT_FOUND error code for client handling
     * - Preserves the original Prisma error message
     * - Sets details to undefined (no additional context needed)
     * - This error typically occurs when trying to update/delete non-existent records
     */
    it('should handle Prisma P2025 errors correctly (record not found)', () => {
      // Arrange: Create a Prisma "record not found" error
      const prismaError = new PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '4.0.0',
      });

      // Act: Process the Prisma error through the error handler
      errorHandler(prismaError, mockRequest as unknown as Request, mockResponse as Response, mockNext);

      // Assert: Verify proper mapping to NOT_FOUND response
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        timestamp: expect.any(String),
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: 'Record not found',
          details: undefined,
          path: '/test-path',
        },
      });
    });

    /**
     * Test: Prisma P2002 error handling (Unique constraint violation)
     * 
     * Validates handling of Prisma's unique constraint violation error:
     * - Maps P2002 error code to 409 CONFLICT status
     * - Uses CONFLICT error code for client handling
     * - Provides user-friendly "Unique constraint violation" message
     * - Includes field information from Prisma meta data in details
     * - This error occurs when trying to create/update records with duplicate unique values
     */
    it('should handle Prisma P2002 errors correctly (unique constraint violation)', () => {
      // Arrange: Create a Prisma unique constraint violation error with field metadata
      const prismaError = new PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '4.0.0',
        meta: { target: ['email'] }
      });

      // Act: Process the Prisma error through the error handler
      errorHandler(prismaError, mockRequest as unknown as Request, mockResponse as Response, mockNext);

      // Assert: Verify proper mapping to CONFLICT response with field details
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        timestamp: expect.any(String),
        error: {
          code: ErrorCodes.CONFLICT,
          message: 'Unique constraint violation',
          details: { field: ['email'] },
          path: '/test-path',
        },
      });
    });

    /**
     * Test: Other Prisma known request errors handling
     * 
     * Validates handling of Prisma errors not specifically mapped:
     * - Uses 400 BAD_REQUEST status for general database errors
     * - Uses DATABASE_ERROR error code for categorization
     * - Provides generic "Database operation failed" message for security
     * - Sets details to undefined to avoid exposing database internals
     * - This covers errors like foreign key constraints (P2003), etc.
     */
    it('should handle other Prisma known request errors correctly', () => {
      // Arrange: Create a Prisma error with an unmapped error code (P2003 = foreign key constraint)
      const prismaError = new PrismaClientKnownRequestError('Some other database error', {
        code: 'P2003',
        clientVersion: '4.0.0',
      });

      // Act: Process the unmapped Prisma error through the error handler
      errorHandler(prismaError, mockRequest as unknown as Request, mockResponse as Response, mockNext);

      // Assert: Verify fallback to generic database error response
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        timestamp: expect.any(String),
        error: {
          code: ErrorCodes.DATABASE_ERROR,
          message: 'Database operation failed',
          details: undefined,
          path: '/test-path',
        },
      });
    });

    /**
     * Test: Prisma validation error handling
     * 
     * Validates handling of Prisma client validation errors:
     * - Uses 400 BAD_REQUEST status for validation issues
     * - Uses VALIDATION_ERROR error code for consistency with other validation errors
     * - Provides user-friendly "Invalid data provided" message
     * - Sets details to undefined to avoid exposing internal validation details
     * - This error occurs when invalid data types or structures are passed to Prisma
     */
    it('should handle Prisma validation errors correctly', () => {
      // Arrange: Create a Prisma validation error (occurs with invalid data types/structures)
      const prismaValidationError = new PrismaClientValidationError('Invalid data provided to the database', { clientVersion: '4.0.0' });

      // Act: Process the Prisma validation error through the error handler
      errorHandler(prismaValidationError, mockRequest as unknown as Request, mockResponse as Response, mockNext);

      // Assert: Verify proper mapping to validation error response
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        timestamp: expect.any(String),
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Invalid data provided',
          details: undefined,
          path: '/test-path',
        },
      });
    });

    /**
     * Test: Generic error handling
     * 
     * Validates handling of unexpected/generic JavaScript errors:
     * - Uses 500 INTERNAL_SERVER_ERROR status for unknown errors
     * - Uses INTERNAL_ERROR error code for categorization
     * - Provides sanitized "Internal server error" message for security
     * - Sets details to undefined to avoid exposing internal error details
     * - This is the fallback for any error not specifically handled above
     * - Protects against information leakage in production environments
     */
    it('should handle generic errors correctly', () => {
      // Arrange: Create a generic JavaScript error (could be any unexpected error)
      const genericError = new Error('Something went wrong');

      // Act: Process the generic error through the error handler
      errorHandler(genericError, mockRequest as unknown as Request, mockResponse as Response, mockNext);

      // Assert: Verify fallback to generic internal server error response
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        timestamp: expect.any(String),
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Internal server error',
          details: undefined,
          path: '/test-path',
        },
      });
    });

    /**
     * Test: Error logging functionality
     * 
     * Validates that all errors are properly logged with comprehensive context:
     * - Logs error message and stack trace for debugging
     * - Includes request URL, method, IP address for request correlation
     * - Includes User-Agent header for client identification
     * - Provides sufficient context for production debugging and monitoring
     * - Logger is mocked during tests to prevent console output
     * - This test focuses on the logging aspect while also verifying response format
     */
    it('should log error details with request context', () => {
      // Arrange: Create a generic error to test logging functionality
      const genericError = new Error('Something went wrong');

      // Act: Process the error through the error handler (which includes logging)
      errorHandler(genericError, mockRequest as unknown as Request, mockResponse as Response, mockNext);

      // Assert: Verify both the response format and that logging occurred
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        timestamp: expect.any(String),
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: 'Internal server error',
          details: undefined,
          path: '/test-path',
        },
      });
      // Logger is mocked to prevent console output during tests
      // In production, this would log comprehensive error details for monitoring
    });
  });

  /**
   * Test suite for the AppError class
   * 
   * These tests validate the custom error class constructor, property assignment,
   * and inheritance behavior. The AppError class is fundamental to the error
   * handling system as it provides structured error information.
   */
  describe('AppError', () => {
    /**
     * Test: AppError constructor and property validation
     * 
     * Validates that the AppError constructor properly:
     * - Extends the native JavaScript Error class
     * - Assigns the provided message to the error instance
     * - Sets the custom statusCode property for HTTP responses
     * - Sets the custom code property for error categorization
     * - Automatically marks the error as operational (expected error)
     * - Generates a proper stack trace for debugging
     * - Maintains all properties of the base Error class
     */
    it('should create an AppError with correct properties', () => {
      // Act: Create an AppError instance with specific properties
      const error = new AppError('Test message', HttpStatus.INTERNAL_SERVER_ERROR, ErrorCodes.INTERNAL_ERROR);

      // Assert: Verify all properties are correctly set
      expect(error).toBeInstanceOf(Error);                                    // Proper inheritance
      expect(error.message).toBe('Test message');                             // Message assignment
      expect(error.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);        // Custom status code
      expect(error.code).toBe(ErrorCodes.INTERNAL_ERROR);                     // Custom error code
      expect(error.isOperational).toBe(true);                                 // Operational flag
      expect(error.stack).toBeDefined();                                      // Stack trace generation
    });

    /**
     * Test: AppError with different parameter values
     * 
     * Validates that the AppError constructor works correctly with different
     * combinations of parameters, ensuring flexibility in error creation:
     * - Different HTTP status codes (NOT_FOUND vs INTERNAL_SERVER_ERROR)
     * - Different error codes (NOT_FOUND vs INTERNAL_ERROR)
     * - Different error messages
     * - Consistent operational flag setting regardless of parameters
     */
    it('should create an AppError with custom values', () => {
      // Act: Create an AppError with different parameter values
      const error = new AppError(
        'Not found',
        HttpStatus.NOT_FOUND,
        ErrorCodes.NOT_FOUND
      );

      // Assert: Verify the constructor handles different parameter values correctly
      expect(error.message).toBe('Not found');                    // Custom message
      expect(error.statusCode).toBe(HttpStatus.NOT_FOUND);        // Custom status code
      expect(error.code).toBe(ErrorCodes.NOT_FOUND);              // Custom error code
      expect(error.isOperational).toBe(true);                     // Always operational
    });
  });

  /**
   * Test suite for the asyncHandler utility function
   * 
   * These tests validate the async wrapper utility that automatically catches
   * errors from async route handlers and forwards them to the error handling
   * middleware. This utility is crucial for preventing unhandled promise rejections.
   */
  describe('asyncHandler', () => {
    /**
     * Test: Successful async function execution
     * 
     * Validates that the asyncHandler wrapper:
     * - Properly executes the wrapped async function
     * - Passes through all arguments (req, res, next) correctly
     * - Does not interfere with normal function execution
     * - Does not call next() when the function succeeds
     * - Preserves the function's return value and behavior
     */
    it('should handle successful async function execution', async () => {
      // Arrange: Create a mock async function that resolves successfully
      const mockAsyncFn = jest.fn().mockResolvedValue('success');
      const wrappedFn = asyncHandler(mockAsyncFn);

      // Act: Execute the wrapped function
      await wrappedFn(mockRequest as Request, mockResponse, mockNext);

      // Assert: Verify normal execution without error handling
      expect(mockAsyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).not.toHaveBeenCalled(); // No error, so next() not called
    });

    /**
     * Test: Async function error catching and forwarding
     * 
     * Validates that the asyncHandler wrapper:
     * - Catches errors from rejected promises
     * - Forwards caught errors to Express error handling via next()
     * - Prevents unhandled promise rejections
     * - Maintains the original error object without modification
     * - Ensures the wrapped function is still called with correct arguments
     */
    it('should catch and forward async function errors', async () => {
      // Arrange: Create a mock async function that rejects with an error
      const testError = new Error('Async function failed');
      const mockAsyncFn = jest.fn().mockRejectedValue(testError);
      const wrappedFn = asyncHandler(mockAsyncFn);

      // Act: Execute the wrapped function (which will reject)
      await wrappedFn(mockRequest as Request, mockResponse, mockNext);

      // Assert: Verify error is caught and forwarded
      expect(mockAsyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(testError); // Error forwarded to Express
    });

    /**
     * Test: Promise.resolve wrapper error handling
     * 
     * Validates that the asyncHandler's Promise.resolve wrapper:
     * - Catches both sync and async errors through Promise.resolve()
     * - Handles promise rejections consistently
     * - Forwards all types of errors to the error handler
     * - Works with different types of promise-based errors
     * - Maintains error object integrity during forwarding
     */
    it('should catch and forward errors from Promise.resolve wrapper', async () => {
      // Arrange: Create a mock function that rejects (tests Promise.resolve error catching)
      const testError = new Error('Promise rejection error');
      const mockAsyncFn = jest.fn().mockRejectedValue(testError);
      const wrappedFn = asyncHandler(mockAsyncFn);

      // Act: Execute the wrapped function
      await wrappedFn(mockRequest as Request, mockResponse, mockNext);

      // Assert: Verify Promise.resolve catches and forwards the error
      expect(mockAsyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(testError);
    });

    /**
     * Test: Middleware function integration
     * 
     * Validates that the asyncHandler works correctly with middleware functions:
     * - Supports middleware that calls next() without errors
     * - Allows normal middleware flow to continue
     * - Does not interfere with middleware that calls next() explicitly
     * - Maintains compatibility with Express middleware patterns
     * - Preserves the ability to pass control to the next middleware
     */
    it('should handle async function that calls next() without error', async () => {
      // Arrange: Create a mock middleware function that calls next() normally
      const mockAsyncFn = jest.fn().mockImplementation(async (_req, _res, next) => {
        next(); // Normal middleware behavior
      });
      const wrappedFn = asyncHandler(mockAsyncFn);

      // Act: Execute the wrapped middleware function
      await wrappedFn(mockRequest as Request, mockResponse, mockNext);

      // Assert: Verify normal middleware flow is preserved
      expect(mockAsyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
      expect(mockNext).toHaveBeenCalledWith(); // Called without error
    });

    /**
     * Test: Function context and argument preservation
     * 
     * Validates that the asyncHandler wrapper:
     * - Preserves the original function's context and arguments
     * - Maintains the correct 'this' binding if applicable
     * - Passes req, res, next parameters correctly
     * - Preserves return values from the wrapped function
     * - Does not modify or interfere with function execution context
     * - Maintains compatibility with various function signatures
     */
    it('should preserve function context and arguments', async () => {
      // Arrange: Create a mock function that validates its arguments and returns a value
      const mockAsyncFn = jest.fn().mockImplementation(async (req, res, next) => {
        expect(req).toBe(mockRequest);     // Verify req parameter
        expect(res).toBe(mockResponse);    // Verify res parameter
        expect(next).toBe(mockNext);       // Verify next parameter
        return 'context preserved';        // Return value to test preservation
      });
      const wrappedFn = asyncHandler(mockAsyncFn);

      // Act: Execute the wrapped function and capture return value
      const result = await wrappedFn(mockRequest as Request, mockResponse, mockNext);

      // Assert: Verify context preservation and return value
      expect(result).toBe('context preserved');  // Return value preserved
      expect(mockAsyncFn).toHaveBeenCalledWith(mockRequest, mockResponse, mockNext);
    });
  });
});