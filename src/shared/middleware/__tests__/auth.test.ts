/**
 * Authentication Middleware Tests
 */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import {
  authenticateToken,
  requireRole,
  requirePermission,
  optionalAuth,
  requireOwnership,
} from "../auth";
import { ErrorCodes, HttpStatus } from "@/shared/types";
import { mockRequest, mockResponse } from "@/shared/test/mocks";

// Mock jwt
jest.mock("jsonwebtoken");

// Mock environment variables
const originalEnv = process.env;

// Mock logger
jest.mock("@/shared/utils/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe("Authentication Middleware", () => {
  let req: Request;
  let res: Response;
  let next: NextFunction;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();

    // Setup environment
    process.env = { ...originalEnv };
    process.env["JWT_SECRET"] = "test-secret";
  });

  afterEach(() => {
    jest.clearAllMocks();
    process.env = originalEnv;
  });

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
  });

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
  });

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
