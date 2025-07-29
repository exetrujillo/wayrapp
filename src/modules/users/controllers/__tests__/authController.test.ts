// src/modules/users/controllers/__tests__/authController.test.ts

/**
 * AuthController Test Suite
 * 
 * Comprehensive unit test suite for the AuthController class, covering all authentication
 * endpoints and their core functionalities. This test suite validates user registration,
 * login, token refresh, logout, and profile retrieval operations in isolation using mocked
 * dependencies. The tests ensure proper error handling, security logic, input validation,
 * and response formatting while maintaining complete isolation from external services.
 * 
 * Testing Strategy:
 * - Unit-level testing with complete dependency mocking (UserService, TokenBlacklistService)
 * - Comprehensive coverage of success paths, error conditions, and edge cases
 * - Security-focused testing including authentication, authorization, and token management
 * - Input validation testing for all endpoints with various invalid data scenarios
 * - Response structure validation ensuring consistent API responses
 * - Error handling verification with proper HTTP status codes and error messages
 * 
 * @fileoverview Unit and integration tests for AuthController.ts
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AuthController } from '../authController';
import { UserService } from '../../services/userService';
import { TokenBlacklistService } from '../../services/tokenBlacklistService';
import { AppError } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus, UserRole, JWTPayload } from '@/shared/types';
import { generateTokenPair, verifyRefreshToken } from '@/shared/utils/auth';
import { logger } from '@/shared/utils/logger';
import { User } from '../../types';

// Mock external dependencies
jest.mock('../../services/userService');
jest.mock('../../services/tokenBlacklistService');
jest.mock('@/shared/utils/auth');
jest.mock('@/shared/utils/logger');

// Test request interface
interface MockRequest {
  body: any;
  user?: JWTPayload | undefined;
}

describe('AuthController', () => {
  let authController: AuthController;
  let mockUserService: jest.Mocked<UserService>;
  let mockTokenBlacklistService: jest.Mocked<TokenBlacklistService>;
  let mockRequest: MockRequest;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  // Mock user data for testing
  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    country_code: 'US',
    registration_date: new Date('2024-01-01'),
    last_login_date: new Date('2024-01-15'),
    profile_picture_url: 'https://example.com/avatar.jpg',
    is_active: true,
    role: 'student',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-15')
  };

  const mockTokens = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token'
  };

  const mockDecodedToken: JWTPayload = {
    sub: 'user-123',
    email: 'test@example.com',
    role: 'student' as UserRole,
    iat: 1640995200,
    exp: 1641081600
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockUserService = new UserService({} as any) as jest.Mocked<UserService>;
    mockTokenBlacklistService = new TokenBlacklistService({} as any) as jest.Mocked<TokenBlacklistService>;

    // Create controller instance
    authController = new AuthController(mockUserService, mockTokenBlacklistService);

    // Setup mock request and response
    mockRequest = {
      body: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();

    // Setup default mock implementations
    (generateTokenPair as jest.Mock).mockReturnValue(mockTokens);
    (verifyRefreshToken as jest.Mock).mockReturnValue(mockDecodedToken);
  });

  describe('Constructor', () => {
    it('should create an instance with required dependencies', () => {
      expect(authController).toBeInstanceOf(AuthController);
      expect(authController['userService']).toBe(mockUserService);
      expect(authController['tokenBlacklistService']).toBe(mockTokenBlacklistService);
    });
  });

  describe('login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'SecurePass123!'
    };

    beforeEach(() => {
      mockRequest.body = validLoginData;
    });

    it('should successfully login with valid credentials', async () => {
      // Arrange
      mockUserService.verifyUserByEmail.mockResolvedValue(mockUser);
      mockUserService.updateLastLogin.mockResolvedValue(undefined);

      // Act
      await authController.login(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockUserService.verifyUserByEmail).toHaveBeenCalledWith(
        validLoginData.email,
        validLoginData.password
      );
      expect(mockUserService.updateLastLogin).toHaveBeenCalledWith(mockUser.id);
      expect(generateTokenPair).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        message: 'Login successful',
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            username: mockUser.username,
            role: mockUser.role
          },
          tokens: mockTokens
        }
      });
      expect(logger.info).toHaveBeenCalledWith('Login attempt', { email: validLoginData.email });
      expect(logger.info).toHaveBeenCalledWith('Login successful', {
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle user with null username', async () => {
      // Arrange
      const userWithNullUsername = { ...mockUser, username: null };
      mockUserService.verifyUserByEmail.mockResolvedValue(userWithNullUsername);
      mockUserService.updateLastLogin.mockResolvedValue(undefined);

      // Act
      await authController.login(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        message: 'Login successful',
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            username: undefined,
            role: mockUser.role
          },
          tokens: mockTokens
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with AppError when credentials are invalid', async () => {
      // Arrange
      mockUserService.verifyUserByEmail.mockResolvedValue(null);

      // Act
      await authController.login(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid email or password',
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR
        })
      );
      expect(logger.warn).toHaveBeenCalledWith('Login failed - invalid credentials', {
        email: validLoginData.email
      });
    });

    it('should call next with AppError when user account is inactive', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, is_active: false };
      mockUserService.verifyUserByEmail.mockResolvedValue(inactiveUser);

      // Act
      await authController.login(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Account is deactivated',
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR
        })
      );
      expect(logger.warn).toHaveBeenCalledWith('Login failed - user inactive', {
        email: validLoginData.email,
        userId: inactiveUser.id
      });
    });

    it('should call next with ZodError for invalid email format', async () => {
      // Arrange
      mockRequest.body = { email: 'invalid-email', password: 'password' };

      // Act
      await authController.login(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });
  });

  describe('register', () => {
    const validRegisterData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!',
      username: 'newuser',
      country_code: 'US',
      profile_picture_url: 'https://example.com/avatar.jpg'
    };

    beforeEach(() => {
      mockRequest.body = validRegisterData;
    });

    it('should successfully register a new user with all fields', async () => {
      // Arrange
      mockUserService.createUserWithPassword.mockResolvedValue(mockUser);

      // Act
      await authController.register(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockUserService.createUserWithPassword).toHaveBeenCalledWith({
        email: validRegisterData.email,
        password: validRegisterData.password,
        role: 'student',
        username: validRegisterData.username,
        country_code: validRegisterData.country_code,
        profile_picture_url: validRegisterData.profile_picture_url
      });
      expect(generateTokenPair).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        message: 'Registration successful',
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            username: mockUser.username,
            role: mockUser.role
          },
          tokens: mockTokens
        }
      });
      expect(logger.info).toHaveBeenCalledWith('Registration attempt', { email: validRegisterData.email });
      expect(logger.info).toHaveBeenCalledWith('Registration successful', {
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should successfully register a new user with only required fields', async () => {
      // Arrange
      const minimalRegisterData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!'
      };
      mockRequest.body = minimalRegisterData;
      mockUserService.createUserWithPassword.mockResolvedValue(mockUser);

      // Act
      await authController.register(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockUserService.createUserWithPassword).toHaveBeenCalledWith({
        email: minimalRegisterData.email,
        password: minimalRegisterData.password,
        role: 'student'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with ZodError for invalid email format', async () => {
      // Arrange
      mockRequest.body = { ...validRegisterData, email: 'invalid-email' };

      // Act
      await authController.register(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it('should call next with UserService errors', async () => {
      // Arrange
      const serviceError = new AppError('Email already registered', HttpStatus.CONFLICT, ErrorCodes.CONFLICT);
      mockUserService.createUserWithPassword.mockRejectedValue(serviceError);

      // Act
      await authController.register(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe('refresh', () => {
    const validRefreshData = {
      refreshToken: 'valid.refresh.token'
    };

    beforeEach(() => {
      mockRequest.body = validRefreshData;
    });

    it('should successfully refresh tokens with valid refresh token', async () => {
      // Arrange
      mockTokenBlacklistService.isTokenRevoked.mockResolvedValue(false);
      mockUserService.findById.mockResolvedValue(mockUser);

      // Act
      await authController.refresh(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(verifyRefreshToken).toHaveBeenCalledWith(validRefreshData.refreshToken);
      expect(mockTokenBlacklistService.isTokenRevoked).toHaveBeenCalledWith(validRefreshData.refreshToken);
      expect(mockUserService.findById).toHaveBeenCalledWith(mockDecodedToken.sub);
      expect(generateTokenPair).toHaveBeenCalledWith({
        userId: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        message: 'Token refresh successful',
        data: { tokens: mockTokens }
      });
      expect(logger.debug).toHaveBeenCalledWith('Token refresh attempt');
      expect(logger.info).toHaveBeenCalledWith('Token refresh successful', { userId: mockUser.id });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with AppError when refresh token is revoked', async () => {
      // Arrange
      mockTokenBlacklistService.isTokenRevoked.mockResolvedValue(true);

      // Act
      await authController.refresh(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid refresh token',
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR
        })
      );
      expect(logger.warn).toHaveBeenCalledWith('Token refresh failed - token revoked', {
        userId: mockDecodedToken.sub
      });
    });

    it('should call next with AppError when user is not found', async () => {
      // Arrange
      mockTokenBlacklistService.isTokenRevoked.mockResolvedValue(false);
      mockUserService.findById.mockResolvedValue(null);

      // Act
      await authController.refresh(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid refresh token',
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR
        })
      );
      expect(logger.warn).toHaveBeenCalledWith('Token refresh failed - user not found', {
        userId: mockDecodedToken.sub
      });
    });

    it('should handle JWT verification errors', async () => {
      // Arrange
      const jwtError = new Error('JsonWebTokenError');
      jwtError.name = 'JsonWebTokenError';
      (verifyRefreshToken as jest.Mock).mockImplementation(() => {
        throw jwtError;
      });

      // Act
      await authController.refresh(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid refresh token',
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR
        })
      );
      expect(logger.warn).toHaveBeenCalledWith('Token refresh failed - invalid token', {
        error: jwtError.message
      });
    });
  });

  describe('logout', () => {
    const validLogoutData = {
      refreshToken: 'valid.refresh.token'
    };

    beforeEach(() => {
      mockRequest.body = validLogoutData;
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'student' as UserRole,
        iat: 1640995200,
        exp: 1641081600
      };
    });

    it('should successfully logout with refresh token', async () => {
      // Arrange
      mockTokenBlacklistService.revokeToken.mockResolvedValue(undefined);

      // Act
      await authController.logout(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockTokenBlacklistService.revokeToken).toHaveBeenCalledWith(
        validLogoutData.refreshToken,
        mockRequest.user!.sub
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        data: {
          message: 'Logged out successfully. Please remove tokens from client storage.'
        }
      });
      expect(logger.info).toHaveBeenCalledWith('User logout', { userId: mockRequest.user!.sub });
      expect(logger.info).toHaveBeenCalledWith('Refresh token revoked', { userId: mockRequest.user!.sub });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should successfully logout without refresh token', async () => {
      // Arrange
      mockRequest.body = {};

      // Act
      await authController.logout(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockTokenBlacklistService.revokeToken).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        data: {
          message: 'Logged out successfully. Please remove tokens from client storage.'
        }
      });
      expect(logger.info).toHaveBeenCalledWith('User logout', { userId: mockRequest.user!.sub });
      expect(logger.warn).toHaveBeenCalledWith('Logout without refresh token', { userId: mockRequest.user!.sub });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle logout without authenticated user', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await authController.logout(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockTokenBlacklistService.revokeToken).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalledWith('User logout', expect.any(Object));
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        data: {
          message: 'Logged out successfully. Please remove tokens from client storage.'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('me', () => {
    beforeEach(() => {
      mockRequest.user = {
        sub: 'user-123',
        email: 'test@example.com',
        role: 'student' as UserRole,
        iat: 1640995200,
        exp: 1641081600
      };
    });

    it('should successfully return current user information', async () => {
      // Arrange
      mockUserService.findById.mockResolvedValue(mockUser);

      // Act
      await authController.me(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockUserService.findById).toHaveBeenCalledWith(mockRequest.user!.sub);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            username: mockUser.username,
            country_code: mockUser.country_code,
            registration_date: mockUser.registration_date,
            last_login_date: mockUser.last_login_date,
            profile_picture_url: mockUser.profile_picture_url,
            is_active: mockUser.is_active,
            role: mockUser.role,
            created_at: mockUser.created_at,
            updated_at: mockUser.updated_at
          }
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle user with null optional fields', async () => {
      // Arrange
      const userWithNullFields = {
        ...mockUser,
        username: null,
        country_code: null,
        last_login_date: null,
        profile_picture_url: null
      };
      mockUserService.findById.mockResolvedValue(userWithNullFields);

      // Act
      await authController.me(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        data: {
          user: {
            id: mockUser.id,
            email: mockUser.email,
            username: undefined,
            country_code: undefined,
            registration_date: mockUser.registration_date,
            last_login_date: undefined,
            profile_picture_url: undefined,
            is_active: mockUser.is_active,
            role: mockUser.role,
            created_at: mockUser.created_at,
            updated_at: mockUser.updated_at
          }
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with AppError when user is not authenticated', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await authController.me(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Authentication required',
          statusCode: HttpStatus.UNAUTHORIZED,
          code: ErrorCodes.AUTHENTICATION_ERROR
        })
      );
      expect(mockUserService.findById).not.toHaveBeenCalled();
    });

    it('should call next with AppError when user is not found', async () => {
      // Arrange
      mockUserService.findById.mockResolvedValue(null);

      // Act
      await authController.me(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
          statusCode: HttpStatus.NOT_FOUND,
          code: ErrorCodes.NOT_FOUND
        })
      );
      expect(mockUserService.findById).toHaveBeenCalledWith(mockRequest.user!.sub);
    });
  });

  describe('Security and Validation', () => {
    it('should validate input data using Zod schemas', async () => {
      // Arrange
      mockRequest.body = { email: 'invalid-email', password: '' };

      // Act
      await authController.login(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
      expect(mockUserService.verifyUserByEmail).not.toHaveBeenCalled();
    });

    it('should handle special characters in input safely', async () => {
      // Arrange
      mockRequest.body = {
        email: 'test+special@example.com',
        password: 'Pass123!@#$%^&*()'
      };
      mockUserService.verifyUserByEmail.mockResolvedValue(mockUser);
      mockUserService.updateLastLogin.mockResolvedValue(undefined);

      // Act
      await authController.login(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockUserService.verifyUserByEmail).toHaveBeenCalledWith(
        'test+special@example.com',
        'Pass123!@#$%^&*()'
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should properly handle null values in user data', async () => {
      // Arrange
      const userWithNulls = { ...mockUser, username: null, country_code: null };
      mockUserService.verifyUserByEmail.mockResolvedValue(userWithNulls);
      mockUserService.updateLastLogin.mockResolvedValue(undefined);
      mockRequest.body = { email: 'test@example.com', password: 'password' };

      // Act
      await authController.login(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            user: expect.objectContaining({
              username: undefined
            })
          })
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle unexpected service errors', async () => {
      // Arrange
      mockRequest.body = { email: 'test@example.com', password: 'password' };
      const unexpectedError = new Error('Database connection failed');
      mockUserService.verifyUserByEmail.mockRejectedValue(unexpectedError);

      // Act
      await authController.login(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    });

    it('should handle token service errors in refresh', async () => {
      // Arrange
      mockRequest.body = { refreshToken: 'valid.token' };
      const tokenError = new Error('Token service unavailable');
      mockTokenBlacklistService.isTokenRevoked.mockRejectedValue(tokenError);

      // Act
      await authController.refresh(mockRequest as any, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(tokenError);
    });
  });
});