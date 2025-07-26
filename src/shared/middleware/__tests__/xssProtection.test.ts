// src/shared/middleware/__tests__/xssProtection.test.ts

/**
 * XSS Protection Middleware Test Suite
 * 
 * Test suite that validates the XSS (Cross-Site Scripting) protection middleware
 * which forms a critical security layer in the WayrApp backend infrastructure. This test suite
 * ensures that the middleware effectively prevents XSS attacks by sanitizing malicious HTML and
 * JavaScript content from user input while preserving legitimate data and maintaining data
 * structure integrity across complex nested objects and arrays.
 * 
 * The XSS protection middleware is part of the layered security approach implemented in the
 * WayrApp backend, working in conjunction with basic input sanitization to provide comprehensive
 * protection against script injection attacks. This middleware is applied to all incoming requests
 * in the main application security stack (src/app.ts) and processes request bodies, query
 * parameters, and URL parameters to neutralize potential XSS threats.
 * 
 * The test suite validates critical security scenarios including:
 * - HTML/JavaScript script injection prevention in request bodies
 * - Malicious attribute removal from query parameters (onerror, onclick, etc.)
 * - Script tag neutralization in URL parameters
 * - Recursive sanitization of nested objects and arrays
 * - Security logging and monitoring for attack detection
 * - Data type preservation for non-string values
 * - Edge case handling for null, undefined, and empty values
 * - Log truncation for long attack payloads to prevent log pollution
 * 
 * Each test validates both the sanitization effectiveness and the security monitoring
 * capabilities, ensuring that XSS attempts are not only neutralized but also properly
 * logged for security analysis and incident response. The test suite uses proper mocking
 * for external dependencies (xss library, logger) to ensure isolated, deterministic
 * testing focused on the middleware's security logic.
 * 
 * This test suite is essential for maintaining the security posture of the application
 * and ensuring that one of the most common web application vulnerabilities (XSS) is
 * effectively mitigated across all user input vectors.
 * 
 * @fileoverview Comprehensive test suite for XSS protection middleware security validation
 * @author Exequiel Trujillo
 * @version 1.0.0
 * @since 1.0.0
 * 
 * @example
 * // Run all XSS protection middleware tests
 * npm test -- src/shared/middleware/__tests__/xssProtection.test.ts
 * 
 * @example
 * // Run specific test with pattern matching
 * npm test -- --testNamePattern="sanitize XSS" src/shared/middleware/__tests__/xssProtection.test.ts
 * 
 * @example
 * // Run tests with coverage to validate security test completeness
 * npm test -- --coverage src/shared/middleware/__tests__/xssProtection.test.ts
 * 
 * @example
 * // Run tests in watch mode during security development
 * npm test -- --watch src/shared/middleware/__tests__/xssProtection.test.ts
 * 
 * @example
 * // Example of XSS attack scenarios tested:
 * // Script injection: "<script>alert('XSS')</script>"
 * // Event handler injection: "<img src=x onerror=alert(1)>"
 * // JavaScript URL injection: "<img src=\"javascript:alert('XSS')\">"
 * // Nested object attacks: { user: { bio: "<script>...</script>" } }
 */
import { Request, Response, NextFunction } from "express";
import { xssProtection } from "../xssProtection";
import { logger } from "@/shared/utils/logger";

// Mock logger to prevent actual logging during tests and enable verification
jest.mock("@/shared/utils/logger", () => ({
  logger: {
    warn: jest.fn(),
  },
}));

/**
 * XSS Protection Middleware Test Suite
 * 
 * Tests the xssProtection middleware that provides comprehensive protection against
 * Cross-Site Scripting (XSS) attacks by sanitizing user input using the xss library.
 * Validates sanitization of request bodies, query parameters, URL parameters, and
 * complex nested data structures while ensuring security logging functionality.
 * 
 * @group XSS Protection
 * @requires jest
 * @requires xss library (external dependency)
 */
describe("XSS Protection Middleware", () => {
  /**
   * Test Variables
   * 
   * Express middleware test doubles that are reset before each test to ensure
   * clean test conditions. These mocks simulate the Express request/response
   * cycle for testing XSS protection behavior.
   */
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  /**
   * Test Setup
   * 
   * Runs before each test to ensure a clean testing environment by:
   * - Creating fresh mock objects for Express req, res, and next
   * - Setting up realistic request properties (path, IP)
   * - Clearing logger mock call history
   * 
   * This setup ensures that each test runs in isolation without interference
   * from previous test state.
   */
  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
      path: "/test",
      ip: "127.0.0.1",
    };
    mockResponse = {};
    nextFunction = jest.fn();

    // Clear logger mock calls
    jest.clearAllMocks();
  });

  /**
   * Request Body XSS Sanitization Test
   * 
   * Tests that the middleware properly sanitizes XSS content in request bodies
   * (POST/PUT/PATCH data) while preserving legitimate content. Validates that
   * malicious scripts are HTML-encoded and security logging occurs.
   */
  it("should sanitize XSS in request body", () => {
    mockRequest.body = {
      name: 'Test <script>alert("XSS")</script>',
      description: "Normal text",
    };

    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    // The xss library HTML-encodes dangerous scripts instead of removing them completely
    expect(mockRequest.body.name).toBe('Test &lt;script&gt;alert("XSS")&lt;/script&gt;');
    expect(mockRequest.body.description).toBe("Normal text");
    expect(nextFunction).toHaveBeenCalled();

    // Verify security logging occurred
    expect(logger.warn).toHaveBeenCalledWith(
      'XSS attempt detected and sanitized',
      expect.objectContaining({
        original: expect.stringContaining('<script>alert("XSS")</script>'),
        path: '/test',
        ip: '127.0.0.1',
      })
    );
  });

  /**
   * Query Parameters XSS Sanitization Test
   * 
   * Tests that the middleware properly sanitizes XSS content in URL query parameters
   * while preserving safe parameters. Validates that dangerous attributes like
   * onerror are removed and security logging occurs.
   */
  it("should sanitize XSS in query parameters", () => {
    mockRequest.query = {
      search: '<img src="x" onerror="alert(\'XSS\')">',
      page: "1",
    };

    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    // The xss library removes the onerror attribute and src value
    expect(mockRequest.query["search"]).toBe('<img src>');
    expect(mockRequest.query["page"]).toBe("1");
    expect(nextFunction).toHaveBeenCalled();

    // Verify security logging occurred
    expect(logger.warn).toHaveBeenCalledWith(
      'XSS attempt detected and sanitized',
      expect.objectContaining({
        original: expect.stringContaining('onerror'),
        path: '/test',
        ip: '127.0.0.1',
      })
    );
  });

  /**
   * URL Parameters XSS Sanitization Test
   * 
   * Tests that the middleware properly sanitizes XSS content in URL route parameters
   * while maintaining parameter functionality. Validates that script tags are
   * HTML-encoded and security logging occurs.
   */
  it("should sanitize XSS in URL parameters", () => {
    mockRequest.params = {
      id: "123<script>document.cookie</script>",
    };

    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    // The xss library HTML-encodes the script tag
    expect(mockRequest.params["id"]).toBe("123&lt;script&gt;document.cookie&lt;/script&gt;");
    expect(nextFunction).toHaveBeenCalled();

    // Verify security logging occurred
    expect(logger.warn).toHaveBeenCalledWith(
      'XSS attempt detected and sanitized',
      expect.objectContaining({
        original: expect.stringContaining('<script>document.cookie</script>'),
        path: '/test',
        ip: '127.0.0.1',
      })
    );
  });

  /**
   * Nested Objects and Arrays XSS Sanitization Test
   * 
   * Tests that the middleware recursively sanitizes XSS content in complex nested
   * data structures including objects within objects and arrays. Validates that
   * the recursive sanitization maintains data structure integrity while protecting
   * against XSS attacks at any nesting level.
   */
  it("should handle nested objects", () => {
    mockRequest.body = {
      user: {
        name: 'Test <script>alert("XSS")</script>',
        profile: {
          bio: "<img src=\"javascript:alert('XSS')\">",
        },
      },
      items: [
        { title: '<script>alert("Item XSS")</script>' },
        { title: "Safe title" },
      ],
    };

    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    // The xss library HTML-encodes dangerous scripts
    expect(mockRequest.body.user.name).toBe('Test &lt;script&gt;alert("XSS")&lt;/script&gt;');
    expect(mockRequest.body.user.profile.bio).toBe("<img src>");
    expect(mockRequest.body.items[0].title).toBe('&lt;script&gt;alert("Item XSS")&lt;/script&gt;');
    expect(mockRequest.body.items[1].title).toBe("Safe title");
    expect(nextFunction).toHaveBeenCalled();

    // Verify multiple security logging events occurred for nested XSS attempts
    expect(logger.warn).toHaveBeenCalledTimes(3); // name, bio, and items[0].title
    expect(logger.warn).toHaveBeenCalledWith(
      'XSS attempt detected and sanitized',
      expect.objectContaining({
        path: '/test',
        ip: '127.0.0.1',
      })
    );
  });

  /**
   * Null and Undefined Values Handling Test
   * 
   * Tests that the middleware properly handles null and undefined values without
   * causing errors or modifying them. Validates that the recursive sanitization
   * function gracefully handles edge cases and preserves data integrity for
   * non-string values.
   */
  it("should handle null and undefined values", () => {
    mockRequest.body = {
      nullValue: null,
      undefinedValue: undefined,
      text: "Normal text",
    };

    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(mockRequest.body.nullValue).toBeNull();
    expect(mockRequest.body.undefinedValue).toBeUndefined();
    expect(mockRequest.body.text).toBe("Normal text");
    expect(nextFunction).toHaveBeenCalled();

    // Verify no security logging occurred for safe content
    expect(logger.warn).not.toHaveBeenCalled();
  });

  /**
   * Empty Request Properties Handling Test
   * 
   * Tests that the middleware handles requests with empty or missing body, query,
   * and params properties without errors. Validates that the middleware gracefully
   * processes requests that don't contain user input data.
   */
  it("should handle non-object request properties", () => {
    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).toHaveBeenCalled();

    // Verify no security logging occurred for empty request
    expect(logger.warn).not.toHaveBeenCalled();
  });

  /**
   * Long Content Truncation Test
   * 
   * Tests that the middleware properly truncates long XSS content in security logs
   * to prevent log pollution while still capturing the attack attempt. Validates
   * that the original content is truncated at 100 characters with ellipsis.
   */
  it("should truncate long XSS content in security logs", () => {
    const longXssContent = 'A'.repeat(150) + '<script>alert("XSS")</script>';
    mockRequest.body = {
      content: longXssContent,
    };

    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    // Verify content was sanitized
    expect(mockRequest.body.content).toContain('&lt;script&gt;');
    expect(nextFunction).toHaveBeenCalled();

    // Verify security logging with truncated content
    expect(logger.warn).toHaveBeenCalledWith(
      'XSS attempt detected and sanitized',
      expect.objectContaining({
        original: expect.stringMatching(/^A{100}\.\.\.$/),
        path: '/test',
        ip: '127.0.0.1',
      })
    );
  });

  /**
   * Non-String Data Types Preservation Test
   * 
   * Tests that the middleware preserves non-string data types (numbers, booleans,
   * objects) without modification while still processing string values within
   * complex data structures.
   */
  it("should preserve non-string data types", () => {
    mockRequest.body = {
      number: 42,
      boolean: true,
      array: [1, 2, 3],
      object: { nested: "value" },
      mixedArray: [
        "safe string",
        123,
        { text: '<script>alert("XSS")</script>' }
      ]
    };

    xssProtection(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    // Non-string values should be preserved
    expect(mockRequest.body.number).toBe(42);
    expect(mockRequest.body.boolean).toBe(true);
    expect(mockRequest.body.array).toEqual([1, 2, 3]);
    expect(mockRequest.body.object).toEqual({ nested: "value" });

    // String values should be sanitized
    expect(mockRequest.body.mixedArray[0]).toBe("safe string");
    expect(mockRequest.body.mixedArray[1]).toBe(123);
    expect(mockRequest.body.mixedArray[2].text).toBe('&lt;script&gt;alert("XSS")&lt;/script&gt;');

    expect(nextFunction).toHaveBeenCalled();

    // Verify security logging occurred only for the XSS content
    expect(logger.warn).toHaveBeenCalledTimes(1);
  });
});
