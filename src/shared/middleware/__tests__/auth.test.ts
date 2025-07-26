// src/shared/middleware/__tests__/auth.test.ts

/**
 * Authentication and Authorization Middleware Test Suite
 * 
 * Test suite that validates all authentication and authorization middleware
 * components used to secure Express.js routes within the WayrApp backend infrastructure.
 * This test suite ensures that JWT token verification, role-based access control (RBAC),
 * permission-based authorization, optional authentication, and resource ownership validation
 * all function correctly and maintain proper security posture.
 * 
 * The test suite covers critical security scenarios including token validation, role
 * enforcement, permission checking, ownership verification, and error handling. Each
 * middleware component is tested with both positive and negative test cases to ensure
 * robust security behavior under various conditions.
 * 
 * The tests validate the middleware components that are used extensively across the
 * application in authentication routes, user management endpoints, content management
 * systems, and other protected API endpoints. This ensures that the security foundation
 * of the application remains solid and reliable.
 * 
 * All tests use proper mocking for external dependencies (JWT library, logger, environment
 * variables) to ensure isolated, deterministic testing that focuses on the middleware
 * logic without external dependencies.
 * 
 * @fileoverview Test suite for authentication and authorization middleware components
 * @author Exequiel Trujillo
 * @version 1.0.0
 * @since 1.0.0
 * 
 * @example
 * // Run all authentication middleware tests
 * npm test -- src/shared/middleware/__tests__/auth.test.ts
 * 
 * @example
 * // Run specific test group
 * npm test -- --testNamePattern="authenticateToken" src/shared/middleware/__tests__/auth.test.ts
 * 
 * @example
 * // Run tests with coverage
 * npm test -- --coverage src/shared/middleware/__tests__/auth.test.ts
 * 
 * @example
 * // Run tests in watch mode during development
 * npm test -- --watch src/shared/middleware/__tests__/auth.test.ts
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  authenticateToken,
  requireRole,
  requirePermission,
  optionalAuth,
  requireOwnership,
  PERMISSIONS,
} from "../auth";
import { ErrorCodes, HttpStatus } from "@/shared/types";
import { mockRequest, mockResponse } from "@/shared/test/mocks";

/**
 * JWT Library Mock Configuration
 * 
 * Mocks the jsonwebtoken library to enable controlled testing of JWT token verification
 * without requiring actual token generation and validation. This allows tests to simulate
 * various JWT scenarios including valid tokens, invalid tokens, expired tokens, and
 * malformed tokens.
 */
jest.mock("jsonwebtoken");

/**
 * Environment Variables Backup
 * 
 * Stores the original process.env to restore it after each test, ensuring that
 * environment variable modifications in tests don't affect other tests. This is
 * crucial for testing JWT_SECRET configuration scenarios.
 */
const originalEnv = process.env;

/**
 * Logger Mock Configuration
 * 
 * Mocks the shared logger utility to prevent actual logging during tests and enable
 * verification of logging behavior in authentication middleware. The mock provides
 * spy functions for error, warn, and debug logging methods used by the auth middleware.
 */
jest.mock("@/shared/utils/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

/**
 * Authentication Middleware Test Suite
 * 
 * Main test suite that validates all authentication and authorization middleware
 * components. The tests are organized by middleware function to ensure comprehensive
 * coverage of each component's functionality, error handling, and security behavior.
 * 
 * Test coverage includes:
 * - PERMISSIONS constant validation for role-based permission system
 * - JWT token authentication with various token states
 * - Role-based access control with single and multiple role scenarios
 * - Permission-based authorization with granular permission checking
 * - Optional authentication for public/private content scenarios
 * - Resource ownership validation with admin override capabilities
 * 
 * Each test group validates both successful authorization scenarios and security
 * failure cases to ensure robust protection against unauthorized access attempts.
 * 
 * @group Authentication Middleware
 * @requires jest
 * @requires jsonwebtoken (mocked)
 */
describe("Authentication Middleware", () => {
  /**
   * PERMISSIONS Constant Validation Tests
   * 
   * Tests the PERMISSIONS constant that defines the hierarchical permission system
   * for role-based access control. Validates that each user role has the correct
   * set of permissions and that the permission hierarchy is properly maintained.
   * 
   * Key validations:
   * - Each role has the expected permissions defined
   * - Permission hierarchy is maintained (higher roles inherit lower role permissions)
   * - Permission naming follows the action:resource convention
   * - No unexpected permissions are granted to any role
   * 
   * The permission system is critical for fine-grained access control beyond
   * simple role-based authorization, allowing precise control over individual
   * actions and resources.
   * 
   * @group Permission System
   */
  describe("PERMISSIONS constant", () => {
    it("should define correct permissions for student role", () => {
      expect(PERMISSIONS.student).toEqual([
        'read:courses',
        'read:own_progress',
        'update:own_progress',
        'update:own_profile'
      ]);
    });

    it("should define correct permissions for content_creator role", () => {
      expect(PERMISSIONS.content_creator).toEqual([
        'read:courses',
        'read:own_progress',
        'update:own_progress',
        'update:own_profile',
        'create:content',
        'update:content',
        'read:analytics'
      ]);
    });

    it("should define correct permissions for admin role", () => {
      expect(PERMISSIONS.admin).toEqual([
        'read:courses',
        'read:own_progress',
        'update:own_progress',
        'update:own_profile',
        'create:content',
        'update:content',
        'read:analytics',
        'delete:content',
        'manage:users',
        'read:all_progress'
      ]);
    });

    it("should maintain hierarchical permission structure", () => {
      // Students have basic permissions
      expect(PERMISSIONS.student.length).toBe(4);

      // Content creators have student permissions plus additional ones
      expect(PERMISSIONS.content_creator.length).toBe(7);
      PERMISSIONS.student.forEach(permission => {
        expect(PERMISSIONS.content_creator).toContain(permission);
      });

      // Admins have all permissions
      expect(PERMISSIONS.admin.length).toBe(10);
      PERMISSIONS.content_creator.forEach(permission => {
        expect(PERMISSIONS.admin).toContain(permission);
      });
    });
  });
  /**
   * Test Variables
   * 
   * Express middleware test doubles that are reset before each test to ensure
   * clean test conditions. These mocks simulate the Express request/response
   * cycle for testing middleware behavior.
   */
  let req: Request;
  let res: Response;
  let next: NextFunction;

  /**
   * Test Setup
   * 
   * Runs before each test to ensure a clean testing environment by:
   * - Creating fresh mock objects for Express req, res, and next
   * - Restoring original environment variables
   * - Setting up test JWT_SECRET for token validation tests
   * 
   * This setup ensures that each test runs in isolation without interference
   * from previous test state or environment modifications.
   */
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();

    // Setup environment with test JWT secret
    process.env = { ...originalEnv };
    process.env["JWT_SECRET"] = "test-secret";
  });

  /**
   * Test Cleanup
   * 
   * Runs after each test to clean up test state by:
   * - Clearing all Jest mock function call history
   * - Restoring original environment variables
   * 
   * This cleanup prevents test interference and ensures consistent
   * test execution across the entire test suite.
   */
  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

  /**
   * JWT Authentication Middleware Tests
   * 
   * Tests the authenticateToken middleware that verifies JWT access tokens and
   * attaches authenticated user information to the Express request object. This
   * middleware forms the foundation of the authentication system and is used
   * across all protected routes.
   * 
   * Key test scenarios:
   * - Valid token verification and user attachment to request
   * - Missing token rejection with appropriate error response
   * - Invalid token handling with security logging
   * - Expired token detection and error handling
   * - JWT configuration error handling (missing JWT_SECRET)
   * - Malformed authorization header handling
   * - Generic JWT error handling for unexpected scenarios
   * 
   * All authentication failures are tested to ensure proper error responses
   * and security logging for monitoring and audit purposes.
   * 
   * @group JWT Authentication
   */
  describe("authenticateToken", () => {
    it("should authenticate valid token and attach user to request", async () => {
      // Arrange
      const token = "valid-token";
      req.headers = { authorization: `Bearer ${token}` };

      const decodedToken = {
        sub: "user-123",
        email: "test@example.com",
        role: "student",
        iat: 1234567890,
        exp: 9999999999,
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, "test-secret");
      expect(req.user).toEqual(decodedToken);
      expect(next).toHaveBeenCalledWith();
    });

    it("should throw error when no token is provided", async () => {
      // Arrange
      req.headers = {};

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Access token required",
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR,
        }),
      );
    });

    it("should throw error when JWT_SECRET is not set", async () => {
      // Arrange
      req.headers = { authorization: "Bearer token" };
      delete process.env["JWT_SECRET"];

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication configuration error",
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          code: ErrorCodes.INTERNAL_ERROR,
        }),
      );
    });

    it("should handle invalid token error", async () => {
      // Arrange
      req.headers = { authorization: "Bearer invalid-token" };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError("invalid token");
      });

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid access token",
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR,
        }),
      );
    });

    it("should handle expired token error", async () => {
      // Arrange
      req.headers = { authorization: "Bearer expired-token" };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.TokenExpiredError("jwt expired", new Date());
      });

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Access token expired",
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR,
        }),
      );
    });

    it("should handle malformed authorization header", async () => {
      // Arrange
      req.headers = { authorization: "InvalidFormat" };

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Access token required",
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR,
        }),
      );
    });

    it("should handle other JWT errors", async () => {
      // Arrange
      req.headers = { authorization: "Bearer token" };
      const customError = new Error("Custom JWT error");
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw customError;
      });

      // Act
      await authenticateToken(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(customError);
    });
  });

  /**
   * Role-Based Access Control Middleware Tests
   * 
   * Tests the requireRole middleware factory that creates middleware for enforcing
   * role-based access control. This middleware validates that authenticated users
   * have the required role(s) to access specific endpoints.
   * 
   * Key test scenarios:
   * - Single role authorization (user has exact required role)
   * - Multiple role authorization (user has one of several allowed roles)
   * - Role authorization failure (user lacks required role)
   * - Unauthenticated access rejection (no user in request)
   * 
   * The middleware supports both single role and array of roles patterns,
   * providing flexibility for different endpoint access requirements. Failed
   * authorization attempts are logged for security monitoring.
   * 
   * @group Role-Based Access Control
   */
  describe("requireRole", () => {
    it("should allow access when user has required role", () => {
      // Arrange
      req.user = {
        sub: "user-123",
        email: "test@example.com",
        role: "admin",
        iat: 1234567890,
        exp: 9999999999,
      };

      const middleware = requireRole("admin");

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it("should allow access when user has one of the required roles", () => {
      // Arrange
      req.user = {
        sub: "user-123",
        email: "test@example.com",
        role: "content_creator",
        iat: 1234567890,
        exp: 9999999999,
      };

      const middleware = requireRole(["admin", "content_creator"]);

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it("should deny access when user does not have required role", () => {
      // Arrange
      req.user = {
        sub: "user-123",
        email: "test@example.com",
        role: "student",
        iat: 1234567890,
        exp: 9999999999,
      };

      const middleware = requireRole("admin");

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Insufficient permissions",
          statusCode: HttpStatus.FORBIDDEN,
          code: ErrorCodes.AUTHORIZATION_ERROR,
        }),
      );
    });

    it("should throw error when user is not authenticated", () => {
      // Arrange
      const middleware = requireRole("admin");

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR,
        }),
      );
    });
  });

  /**
   * Permission-Based Authorization Middleware Tests
   * 
   * Tests the requirePermission middleware factory that creates middleware for
   * enforcing granular permission-based access control. This middleware provides
   * more fine-grained authorization than role-based access control by checking
   * specific permissions within user roles.
   * 
   * Key test scenarios:
   * - Permission authorization success (user role includes required permission)
   * - Permission authorization failure (user role lacks required permission)
   * - Role-specific permission testing (content creator vs student permissions)
   * - Unauthenticated access rejection (no user in request)
   * 
   * The permission system allows precise control over individual actions while
   * maintaining the role-based hierarchy. This enables scenarios where different
   * aspects of functionality need different access levels within the same role.
   * 
   * @group Permission-Based Authorization
   */
  describe("requirePermission", () => {
    it("should allow access when user has required permission", () => {
      // Arrange
      req.user = {
        sub: "user-123",
        email: "test@example.com",
        role: "admin",
        iat: 1234567890,
        exp: 9999999999,
      };

      const middleware = requirePermission("manage:users");

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it("should deny access when user does not have required permission", () => {
      // Arrange
      req.user = {
        sub: "user-123",
        email: "test@example.com",
        role: "student",
        iat: 1234567890,
        exp: 9999999999,
      };

      const middleware = requirePermission("manage:users");

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Permission 'manage:users' required",
          statusCode: HttpStatus.FORBIDDEN,
          code: ErrorCodes.AUTHORIZATION_ERROR,
        }),
      );
    });

    it("should allow content creator to create content", () => {
      // Arrange
      req.user = {
        sub: "user-123",
        email: "creator@example.com",
        role: "content_creator",
        iat: 1234567890,
        exp: 9999999999,
      };

      const middleware = requirePermission("create:content");

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it("should deny student access to create content", () => {
      // Arrange
      req.user = {
        sub: "user-123",
        email: "student@example.com",
        role: "student",
        iat: 1234567890,
        exp: 9999999999,
      };

      const middleware = requirePermission("create:content");

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Permission 'create:content' required",
          statusCode: HttpStatus.FORBIDDEN,
          code: ErrorCodes.AUTHORIZATION_ERROR,
        }),
      );
    });

    it("should throw error when user is not authenticated", () => {
      // Arrange
      const middleware = requirePermission("read:courses");

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR,
        }),
      );
    });
  });

  /**
   * Optional Authentication Middleware Tests
   * 
   * Tests the optionalAuth middleware that provides optional authentication for
   * endpoints that can serve both public and personalized content. Unlike
   * authenticateToken, this middleware does not require authentication but
   * attaches user information if a valid token is present.
   * 
   * Key test scenarios:
   * - Valid token processing with user attachment to request
   * - Missing token handling (continues without error)
   * - Invalid token handling (continues without error, no user attached)
   * - Missing JWT_SECRET handling (continues without error)
   * 
   * This middleware is ideal for public endpoints that can provide enhanced
   * functionality for authenticated users while still serving basic content
   * to anonymous users. All authentication failures are silently ignored.
   * 
   * @group Optional Authentication
   */
  describe("optionalAuth", () => {
    it("should attach user to request when valid token is provided", async () => {
      // Arrange
      const token = "valid-token";
      req.headers = { authorization: `Bearer ${token}` };

      const decodedToken = {
        sub: "user-123",
        email: "test@example.com",
        role: "student",
        iat: 1234567890,
        exp: 9999999999,
      };

      (jwt.verify as jest.Mock).mockReturnValue(decodedToken);

      // Act
      await optionalAuth(req, res, next);

      // Assert
      expect(jwt.verify).toHaveBeenCalledWith(token, "test-secret");
      expect(req.user).toEqual(decodedToken);
      expect(next).toHaveBeenCalledWith();
    });

    it("should continue without error when no token is provided", async () => {
      // Arrange
      req.headers = {};

      // Act
      await optionalAuth(req, res, next);

      // Assert
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    it("should continue without error when token is invalid", async () => {
      // Arrange
      req.headers = { authorization: "Bearer invalid-token" };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError("invalid token");
      });

      // Act
      await optionalAuth(req, res, next);

      // Assert
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });

    it("should continue without error when JWT_SECRET is not set", async () => {
      // Arrange
      req.headers = { authorization: "Bearer token" };
      delete process.env["JWT_SECRET"];

      // Act
      await optionalAuth(req, res, next);

      // Assert
      expect(req.user).toBeNull();
      expect(next).toHaveBeenCalledWith();
    });
  });

  /**
   * Resource Ownership Validation Middleware Tests
   * 
   * Tests the requireOwnership middleware factory that creates middleware for
   * enforcing resource ownership validation. This middleware ensures users can
   * only access resources that belong to them, with an admin override for
   * administrative access.
   * 
   * Key test scenarios:
   * - Ownership validation success (user owns the resource)
   * - Admin override success (admin can access any resource)
   * - Ownership validation failure (user tries to access another user's resource)
   * - Custom parameter name handling (flexible URL parameter naming)
   * - Unauthenticated access rejection (no user in request)
   * 
   * This middleware is essential for protecting user-specific data such as
   * progress tracking, personal profiles, and private content. It prevents
   * users from accessing other users' sensitive information through URL manipulation.
   * 
   * @group Resource Ownership
   */
  describe("requireOwnership", () => {
    it("should allow access when user is the owner of the resource", () => {
      // Arrange
      const userId = "user-123";
      req.user = {
        sub: userId,
        email: "test@example.com",
        role: "student",
        iat: 1234567890,
        exp: 9999999999,
      };
      req.params = { userId };

      const middleware = requireOwnership();

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it("should allow access when user is an admin", () => {
      // Arrange
      req.user = {
        sub: "admin-456",
        email: "admin@example.com",
        role: "admin",
        iat: 1234567890,
        exp: 9999999999,
      };
      req.params = { userId: "user-123" };

      const middleware = requireOwnership();

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it("should deny access when user is not the owner of the resource", () => {
      // Arrange
      req.user = {
        sub: "user-456",
        email: "other@example.com",
        role: "student",
        iat: 1234567890,
        exp: 9999999999,
      };
      req.params = { userId: "user-123" };

      const middleware = requireOwnership();

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Access denied - you can only access your own resources",
          statusCode: HttpStatus.FORBIDDEN,
          code: ErrorCodes.AUTHORIZATION_ERROR,
        }),
      );
    });

    it("should use custom parameter name when provided", () => {
      // Arrange
      const userId = "user-123";
      req.user = {
        sub: userId,
        email: "test@example.com",
        role: "student",
        iat: 1234567890,
        exp: 9999999999,
      };
      req.params = { id: userId };

      const middleware = requireOwnership("id");

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith();
    });

    it("should throw error when user is not authenticated", () => {
      // Arrange
      req.params = { userId: "user-123" };

      const middleware = requireOwnership();

      // Act
      middleware(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Authentication required",
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR,
        }),
      );
    });
  });
});
