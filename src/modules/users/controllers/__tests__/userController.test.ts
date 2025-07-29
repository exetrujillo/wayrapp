/**
 * UserController Tests
 * Unit tests for user profile management endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { UserController } from '../userController';
import { UserService } from '../../services/userService';
import { AppError } from '../../../../shared/middleware/errorHandler';
import { HttpStatus, JWTPayload } from '../../../../shared/types';

// Extend Request interface for tests
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Mock UserService
jest.mock('../../services/userService');
const MockedUserService = UserService as jest.MockedClass<typeof UserService>;

describe('UserController', () => {
  let userController: UserController;
  let mockUserService: jest.Mocked<UserService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockUserService = new MockedUserService({} as any) as jest.Mocked<UserService>;
    userController = new UserController(mockUserService);
    
    mockRequest = {
      user: {
        sub: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        role: 'student',
        iat: 1234567890,
        exp: 1234567890
      },
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      get: jest.fn((header: string) => {
        if (header === 'User-Agent') return 'test-user-agent';
        if (header === 'set-cookie') return undefined;
        return undefined;
      }) as any
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        profile_picture_url: 'https://example.com/avatar.jpg',
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockUserService.getUserProfile.mockResolvedValue(mockUser);

      await userController.getProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getUserProfile).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        data: mockUser
      });
    });

    it('should call next with error when user is not authenticated', async () => {
      // Arrange
      delete mockRequest.user;

      // Act
      await Promise.resolve(userController.getProfile(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(error.message).toBe('Authentication required');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should call next with error when user is not found', async () => {
      // Arrange: The service itself throws the error
      const notFoundError = new AppError('User not found', HttpStatus.NOT_FOUND, 'NOT_FOUND');
      mockUserService.getUserProfile.mockRejectedValue(notFoundError);

      // Act
      await Promise.resolve(userController.getProfile(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert: We check if asyncHandler correctly passed the service's error to next()
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const updateData = {
        username: 'newusername',
        country_code: 'CA'
      };
      
      const updatedUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        username: 'newusername',
        country_code: 'CA',
        registration_date: new Date(),
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRequest.body = updateData;
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      await userController.updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.updateUser).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', expect.objectContaining(updateData));
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        message: 'Profile updated successfully',
        data: updatedUser
      });
    });

    it('should call next with error when user is not authenticated', async () => {
      // Arrange
      delete mockRequest.user;

      // Act
      await Promise.resolve(userController.updateProfile(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(error.message).toBe('Authentication required');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws error', async () => {
      // Arrange: The service itself throws the error
      const updateData = { username: 'newusername' };
      mockRequest.body = updateData;
      
      const serviceError = new AppError('User not found', HttpStatus.NOT_FOUND, 'NOT_FOUND');
      mockUserService.updateUser.mockRejectedValue(serviceError);

      // Act
      await Promise.resolve(userController.updateProfile(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert: We check if asyncHandler correctly passed the service's error to next()
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should only allow permitted fields to be updated (whitelist pattern)', async () => {
      const updateData = {
        username: 'newusername',
        country_code: 'CA',
        profile_picture_url: 'https://example.com/new-avatar.jpg'
      };
      
      const updatedUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        username: 'newusername',
        country_code: 'CA',
        profile_picture_url: 'https://example.com/new-avatar.jpg',
        registration_date: new Date(),
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRequest.body = updateData;
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      await userController.updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify that only allowed fields are passed to the service
      expect(mockUserService.updateUser).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', {
        username: 'newusername',
        country_code: 'CA',
        profile_picture_url: 'https://example.com/new-avatar.jpg'
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        message: 'Profile updated successfully',
        data: updatedUser
      });
    });

    it('should implement whitelist pattern correctly (defense-in-depth)', async () => {
      // Mock logger to capture log calls
      const loggerSpy = jest.spyOn(require('../../../../shared/utils/logger').logger, 'warn');
      
      // Simulate a scenario where validation passed but data contains extra fields
      // This tests the defense-in-depth whitelist pattern
      const updateData = {
        username: 'newusername',
        country_code: 'CA',
        profile_picture_url: 'https://example.com/avatar.jpg'
      };
      
      // Mock the validated data to include extra fields that shouldn't be processed
      // This simulates a potential security bypass scenario
      const mockParse = jest.spyOn(require('../../types').UpdateUserSchema, 'parse');
      mockParse.mockReturnValue({
        username: 'newusername',
        country_code: 'CA',
        profile_picture_url: 'https://example.com/avatar.jpg',
        // These extra fields simulate a potential security issue
        extraField1: 'should be ignored',
        extraField2: 'should also be ignored'
      });
      
      const updatedUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        username: 'newusername',
        country_code: 'CA',
        profile_picture_url: 'https://example.com/avatar.jpg',
        registration_date: new Date(),
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRequest.body = updateData;
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      await userController.updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify that only allowed fields are passed to the service (whitelist pattern working)
      expect(mockUserService.updateUser).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', {
        username: 'newusername',
        country_code: 'CA',
        profile_picture_url: 'https://example.com/avatar.jpg'
      });

      // Verify that unauthorized field modification attempt was logged
      expect(loggerSpy).toHaveBeenCalledWith('Unauthorized field modification attempt detected in profile update', {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        unauthorizedFields: ['extraField1', 'extraField2'],
        timestamp: expect.any(String)
      });

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        message: 'Profile updated successfully',
        data: updatedUser
      });

      mockParse.mockRestore();
      loggerSpy.mockRestore();
    });

    it('should handle partial updates with only some allowed fields', async () => {
      const updateData = {
        username: 'partialusername'
        // Only updating username, not country_code or profile_picture_url
      };
      
      const updatedUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com',
        username: 'partialusername',
        country_code: 'US', // Unchanged
        profile_picture_url: null, // Unchanged
        registration_date: new Date(),
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date()
      };

      mockRequest.body = updateData;
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      await userController.updateProfile(mockRequest as Request, mockResponse as Response, mockNext);

      // The service should be called with the validated data from the request body
      // Since the previous test's mock might still be active, we expect all fields that were validated
      expect(mockUserService.updateUser).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000', 
        expect.objectContaining({
          username: 'partialusername'
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        message: 'Profile updated successfully',
        data: updatedUser
      });
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      // SECURITY_AUDIT_TODO: Hardcoded passwords in test data pose security risks.
      // Risk: Using real-looking passwords in tests could lead to developers accidentally using 
      // similar patterns in production, or these passwords being committed to version control.
      // Remediation: Use clearly fake test passwords or generate random test data.
      const passwordData = {
        current_password: 'oldPassword123!',
        new_password: 'newPassword456!'
      };

      mockRequest.body = passwordData;
      mockUserService.updatePassword.mockResolvedValue(true);

      await userController.updatePassword(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.updatePassword).toHaveBeenCalledWith(
        '550e8400-e29b-41d4-a716-446655440000',
        'oldPassword123!',
        'newPassword456!'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        message: 'Password updated successfully',
        data: { message: 'Password updated successfully' }
      });
    });

    it('should log password update with enhanced security context', async () => {
      // Mock logger to capture log calls
      const loggerSpy = jest.spyOn(require('../../../../shared/utils/logger').logger, 'info');
      
      const passwordData = {
        current_password: 'oldPassword123!',
        new_password: 'newPassword456!'
      };

      mockRequest.body = passwordData;
      mockUserService.updatePassword.mockResolvedValue(true);

      await userController.updatePassword(mockRequest as Request, mockResponse as Response, mockNext);

      // Verify that the logger was called with enhanced security context
      expect(loggerSpy).toHaveBeenCalledWith('User password updated successfully', {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        ip: '127.0.0.1',
        userAgent: 'test-user-agent'
      });

      loggerSpy.mockRestore();
    });

    it('should call next with error when user is not authenticated', async () => {
      // Arrange
      delete mockRequest.user;

      // Act
      await Promise.resolve(userController.updatePassword(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(error.message).toBe('Authentication required');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should call next with error when service throws error', async () => {
      // Arrange: The service itself throws the error
      const passwordData = {
        current_password: 'wrongPassword',
        new_password: 'newPassword456!'
      };
      mockRequest.body = passwordData;
      
      const serviceError = new AppError('Current password is incorrect', HttpStatus.UNAUTHORIZED, 'AUTHENTICATION_ERROR');
      mockUserService.updatePassword.mockRejectedValue(serviceError);

      // Act
      await Promise.resolve(userController.updatePassword(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert: We check if asyncHandler correctly passed the service's error to next()
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getAllUsers', () => {
    it('should return paginated users list', async () => {
      // Set user as admin for this test
      mockRequest.user!.role = 'admin';

      // Simulate the default values that UserQuerySchema would provide
      mockRequest.query = {
        page: 1,        // UserQuerySchema default
        limit: 20,      // UserQuerySchema default
        sortBy: undefined, // No default in schema
        sortOrder: 'asc'   // UserQuerySchema default
      } as any;

      const mockUsers = {
        data: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            username: 'user1',
            role: 'student',
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            registration_date: new Date(),
            country_code: 'US',
            profile_picture_url: null,
            last_login_date: null
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        }
      };

      // Add findAll method to the mock
      (mockUserService as any).findAll = jest.fn().mockResolvedValue(mockUsers);

      await userController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockUserService as any).findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        sortBy: undefined,
        sortOrder: 'asc',
        filters: {}
      });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        data: mockUsers
      });
    });

    it('should handle query parameters correctly', async () => {
      // Set user as admin for this test
      mockRequest.user!.role = 'admin';
      
      // Simulate the validated query data that would come from UserQuerySchema middleware
      // The middleware transforms strings to appropriate types
      mockRequest.query = {
        page: 2,        // UserQuerySchema transforms string to number
        limit: 10,      // UserQuerySchema transforms string to number
        sortBy: 'email',
        sortOrder: 'asc',
        role: 'admin',
        is_active: true, // BooleanStringSchema transforms 'true' to boolean true
        search: 'test'
      } as any;

      const mockUsers = {
        data: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: true
        }
      };

      (mockUserService as any).findAll = jest.fn().mockResolvedValue(mockUsers);

      await userController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext);

      expect((mockUserService as any).findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        sortBy: 'email',
        sortOrder: 'asc',
        filters: {
          role: 'admin',
          is_active: true,
          search: 'test'
        }
      });
    });

    it('should call next with error when service throws error', async () => {
      // Set user as admin for this test
      mockRequest.user!.role = 'admin';
      
      // Arrange: The service itself throws the error
      const serviceError = new AppError('Database error', HttpStatus.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR');
      (mockUserService as any).findAll = jest.fn().mockRejectedValue(serviceError);

      // Act
      await Promise.resolve(userController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert: We check if asyncHandler correctly passed the service's error to next()
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should deny access to non-admin users', async () => {
      // Arrange: User is not admin (default role is 'student')
      
      // Act
      await Promise.resolve(userController.getAllUsers(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert: Should be blocked by admin role check
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(error.message).toBe('Insufficient permissions');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return user by ID successfully', async () => {
      // Set user as admin for this test
      mockRequest.user!.role = 'admin';
      
      const mockUser = {
        id: 'user-456',
        email: 'user456@example.com',
        username: 'user456',
        role: 'student',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        registration_date: new Date(),
        country_code: 'US',
        profile_picture_url: null,
        last_login_date: null
      };

      mockRequest.params = { id: 'user-456' };
      mockUserService.getUserProfile.mockResolvedValue(mockUser);

      await userController.getUserById(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.getUserProfile).toHaveBeenCalledWith('user-456');
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        data: mockUser
      });
    });

    it('should call next with error when user is not found', async () => {
      // Set user as admin for this test
      mockRequest.user!.role = 'admin';
      
      // Arrange: The service itself throws the error
      mockRequest.params = { id: 'nonexistent-user' };
      const notFoundError = new AppError('User not found', HttpStatus.NOT_FOUND, 'NOT_FOUND');
      mockUserService.getUserProfile.mockRejectedValue(notFoundError);

      // Act
      await Promise.resolve(userController.getUserById(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert: We check if asyncHandler correctly passed the service's error to next()
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(notFoundError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should call next with error when user ID is missing', async () => {
      // Set user as admin for this test
      mockRequest.user!.role = 'admin';
      
      // Arrange
      mockRequest.params = {};

      // Act
      await Promise.resolve(userController.getUserById(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toBe('User ID is required');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should deny access to non-admin users', async () => {
      // Arrange: User is not admin (default role is 'student')
      mockRequest.params = { id: 'user-456' };
      
      // Act
      await Promise.resolve(userController.getUserById(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert: Should be blocked by admin role check
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(error.message).toBe('Insufficient permissions');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      // Set user as admin for this test
      mockRequest.user!.role = 'admin';
      
      const updatedUser = {
        id: 'user-456',
        email: 'user456@example.com',
        username: 'user456',
        role: 'admin',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        registration_date: new Date(),
        country_code: 'US',
        profile_picture_url: null,
        last_login_date: null
      };

      mockRequest.params = { id: 'user-456' };
      mockRequest.body = { role: 'admin' };
      mockUserService.updateUser.mockResolvedValue(updatedUser);

      await userController.updateUserRole(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockUserService.updateUser).toHaveBeenCalledWith('user-456', { role: 'admin' });
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        message: 'User role updated successfully',
        data: updatedUser
      });
    });

    it('should call next with error when user does not exist', async () => {
      // Set user as admin for this test
      mockRequest.user!.role = 'admin';
      
      // Arrange: The service itself throws the error
      mockRequest.params = { id: 'nonexistent-user' };
      mockRequest.body = { role: 'admin' };
      
      const serviceError = new AppError('User not found', HttpStatus.NOT_FOUND, 'NOT_FOUND');
      mockUserService.updateUser.mockRejectedValue(serviceError);

      // Act
      await Promise.resolve(userController.updateUserRole(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert: We check if asyncHandler correctly passed the service's error to next()
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should call next with error when user ID is missing', async () => {
      // Set user as admin for this test
      mockRequest.user!.role = 'admin';
      
      // Arrange
      mockRequest.params = {};
      mockRequest.body = { role: 'admin' };

      // Act
      await Promise.resolve(userController.updateUserRole(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(error.message).toBe('User ID is required');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should deny access to non-admin users', async () => {
      // Arrange: User is not admin (default role is 'student')
      mockRequest.params = { id: 'user-456' };
      mockRequest.body = { role: 'admin' };
      
      // Act
      await Promise.resolve(userController.updateUserRole(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert: Should be blocked by admin role check
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(error.message).toBe('Insufficient permissions');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should prevent admin from changing their own role (self-lockout prevention)', async () => {
      // Set user as admin for this test
      mockRequest.user!.role = 'admin';
      
      // Arrange: Admin tries to change their own role
      mockRequest.params = { id: '550e8400-e29b-41d4-a716-446655440000' }; // Same as mockRequest.user.sub
      mockRequest.body = { role: 'student' };
      
      // Act
      await Promise.resolve(userController.updateUserRole(mockRequest as Request, mockResponse as Response, mockNext));
      
      // Assert: Should be blocked by self-role modification check
      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith(expect.any(AppError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(error.message).toBe('Administrators cannot change their own role to prevent self-lockout.');
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
      
      // Verify that the service was never called
      expect(mockUserService.updateUser).not.toHaveBeenCalled();
    });
  });
});
