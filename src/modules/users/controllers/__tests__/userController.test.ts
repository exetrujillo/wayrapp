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
        // SECURITY_AUDIT_TODO: Hardcoded user IDs in tests pose security risks.
        // Risk: Using predictable user IDs like 'user-123' could lead to developers accidentally using 
        // similar patterns in production, making user enumeration attacks easier.
        // Remediation: Use UUIDs or random test data generation for user IDs.
        sub: 'user-123',
        email: 'test@example.com',
        role: 'student',
        // SECURITY_AUDIT_TODO: Hardcoded JWT timestamps pose security risks in tests.
        // Risk: Using fixed timestamps (1234567890) could lead to security issues if these values are 
        // accidentally used in production or if tests don't properly validate token expiration logic.
        // Remediation: Use dynamic timestamps and test token expiration scenarios explicitly.
        iat: 1234567890,
        exp: 1234567890
      },
      body: {},
      params: {},
      query: {}
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
        id: 'user-123',
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

      expect(mockUserService.getUserProfile).toHaveBeenCalledWith('user-123');
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
        id: 'user-123',
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

      expect(mockUserService.updateUser).toHaveBeenCalledWith('user-123', expect.objectContaining(updateData));
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
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
        'user-123',
        'oldPassword123!',
        'newPassword456!'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        timestamp: expect.any(String),
        data: { message: 'Password updated successfully' }
      });
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
        sortBy: 'created_at',
        sortOrder: 'desc',
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
      mockRequest.query = {
        page: '2',
        limit: '10',
        sortBy: 'email',
        sortOrder: 'asc',
        role: 'admin',
        is_active: 'true',
        search: 'test'
      };

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
  });

  describe('getUserById', () => {
    it('should return user by ID successfully', async () => {
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
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
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
        data: updatedUser
      });
    });

    it('should call next with error when user does not exist', async () => {
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
  });
});