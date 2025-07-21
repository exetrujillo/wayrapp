/**
 * UserService Unit Tests
 * Tests for business logic in UserService
 */

import { UserService } from '../userService';
import { UserRepository } from '../../repositories/userRepository';
import { User, CreateUserDto, UpdateUserDto } from '../../types';
import { AppError } from '@/shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus, PaginatedResult, QueryOptions } from '@/shared/types';

// Mock dependencies
jest.mock('../../repositories/userRepository');
jest.mock('@/shared/utils/auth', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  comparePassword: jest.fn(),
}));
jest.mock('@/shared/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      create: jest.fn(),
      createWithPassword: jest.fn(),
      findById: jest.fn(),
      findByIdWithPassword: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findByUsername: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
      updatePassword: jest.fn(),
      updateLastLogin: jest.fn(),
    } as any;

    userService = new UserService(mockUserRepository);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const userId = 'test-user-id';
      const expectedUser: User = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(expectedUser);

      const result = await userService.findById(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found', async () => {
      const userId = 'non-existent-user';

      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.findById(userId);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found by email', async () => {
      const email = 'test@example.com';
      const expectedUser: User = {
        id: 'test-user-id',
        email,
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(expectedUser);

      const result = await userService.findByEmail(email);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found by email', async () => {
      const email = 'nonexistent@example.com';

      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await userService.findByEmail(email);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData: CreateUserDto = {
        email: 'test@example.com',
        username: 'testuser',
      };

      const createdUser: User = {
        id: 'new-user-id',
        email: userData.email,
        username: userData.username || null,
        country_code: null,
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(createdUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('new-user-id');
      expect(result.email).toBe(userData.email);
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(userData.email);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(userData.username);
      expect(mockUserRepository.create).toHaveBeenCalledWith(userData);
    });

    it('should throw an error when email already exists', async () => {
      // Arrange
      const userData: CreateUserDto = {
        email: 'existing@example.com',
        username: 'testuser',
      };

      const existingUser: User = {
        id: 'existing-user-id',
        email: userData.email,
        username: 'existinguser',
        country_code: null,
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow(
        new AppError('Email already registered', HttpStatus.CONFLICT, ErrorCodes.CONFLICT)
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('should throw an error when username already exists', async () => {
      // Arrange
      const userData: CreateUserDto = {
        email: 'new@example.com',
        username: 'existinguser',
      };

      const existingUser: User = {
        id: 'existing-user-id',
        email: 'existing@example.com',
        username: userData.username || null,
        country_code: null,
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow(
        new AppError('Username already taken', HttpStatus.CONFLICT, ErrorCodes.CONFLICT)
      );
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const updates: UpdateUserDto = {
        username: 'updateduser',
        country_code: 'CA',
      };

      const existingUser: User = {
        id: userId,
        email: 'test@example.com',
        username: 'oldusername',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const updatedUser: User = {
        ...existingUser,
        username: updates.username!,
        country_code: updates.country_code!,
        updated_at: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updateUser(userId, updates);

      // Assert
      expect(result).toBeDefined();
      expect(result.username).toBe(updates.username);
      expect(result.country_code).toBe(updates.country_code);
      expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(updates.username);
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, updates);
    });

    it('should throw an error when user does not exist', async () => {
      // Arrange
      const userId = 'non-existent-id';
      const updates: UpdateUserDto = {
        username: 'updateduser',
      };

      mockUserRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(userService.updateUser(userId, updates)).rejects.toThrow(
        new AppError('User not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND)
      );
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should throw an error when username is already taken', async () => {
      // Arrange
      const userId = 'test-user-id';
      const updates: UpdateUserDto = {
        username: 'takenusername',
      };

      const existingUser: User = {
        id: userId,
        email: 'test@example.com',
        username: 'oldusername',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const userWithTakenUsername: User = {
        id: 'another-user-id',
        email: 'another@example.com',
        username: 'takenusername',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findById.mockResolvedValue(existingUser);
      mockUserRepository.findByUsername.mockResolvedValue(userWithTakenUsername);

      // Act & Assert
      await expect(userService.updateUser(userId, updates)).rejects.toThrow(
        new AppError('Username already taken', HttpStatus.CONFLICT, ErrorCodes.CONFLICT)
      );
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('verifyUserByEmail', () => {
    it('should return user when credentials are valid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123!';
      const mockUserWithPassword = {
        id: 'test-user-id',
        email,
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
        password_hash: 'hashed_password',
      };

      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUserWithPassword);

      const { comparePassword } = await import('@/shared/utils/auth');
      (comparePassword as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await userService.verifyUserByEmail(email, password);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUserWithPassword.id);
      expect(comparePassword).toHaveBeenCalledWith(password, mockUserWithPassword.password_hash);
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      mockUserRepository.findByEmailWithPassword.mockResolvedValue(null);

      // Act
      const result = await userService.verifyUserByEmail('nonexistent@example.com', 'password');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'WrongPassword123!';
      const mockUserWithPassword = {
        id: 'test-user-id',
        email,
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
        password_hash: 'hashed_password',
      };

      mockUserRepository.findByEmailWithPassword.mockResolvedValue(mockUserWithPassword);

      const { comparePassword } = await import('@/shared/utils/auth');
      (comparePassword as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await userService.verifyUserByEmail(email, password);

      // Assert
      expect(result).toBeNull();
      expect(comparePassword).toHaveBeenCalledWith(password, mockUserWithPassword.password_hash);
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully when current password is correct', async () => {
      // Arrange
      const userId = 'test-user-id';
      const currentPassword = 'CurrentPassword123!';
      const newPassword = 'NewPassword456!';

      // Mock verifyPassword to return true (current password is correct)
      jest.spyOn(userService, 'verifyPassword').mockResolvedValue(true);

      const updatedUser: User = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.updatePassword.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updatePassword(userId, currentPassword, newPassword);

      // Assert
      expect(result).toBe(true);
      expect(userService.verifyPassword).toHaveBeenCalledWith(userId, currentPassword);
      expect(mockUserRepository.updatePassword).toHaveBeenCalled();
    });

    it('should throw an error when current password is incorrect', async () => {
      // Arrange
      const userId = 'test-user-id';
      const currentPassword = 'WrongPassword123!';
      const newPassword = 'NewPassword456!';

      // Mock verifyPassword to return false (current password is incorrect)
      jest.spyOn(userService, 'verifyPassword').mockResolvedValue(false);

      // Act & Assert
      await expect(userService.updatePassword(userId, currentPassword, newPassword)).rejects.toThrow(
        new AppError('Current password is incorrect', HttpStatus.UNAUTHORIZED, ErrorCodes.AUTHENTICATION_ERROR)
      );
      expect(userService.verifyPassword).toHaveBeenCalledWith(userId, currentPassword);
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile without sensitive data', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: new Date(),
        profile_picture_url: 'https://example.com/avatar.jpg',
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUserProfile(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(mockUser.id);
      expect(result?.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('password_hash');
      expect(userService.findById).toHaveBeenCalledWith(userId);
    });

    it('should return null when user does not exist', async () => {
      // Arrange
      jest.spyOn(userService, 'findById').mockResolvedValue(null);

      // Act
      const result = await userService.getUserProfile('non-existent-id');

      // Assert
      expect(result).toBeNull();
      expect(userService.findById).toHaveBeenCalledWith('non-existent-id');
    });

    it('should handle null values in user profile', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        username: null,
        country_code: null,
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);

      // Act
      const result = await userService.getUserProfile(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.username).toBe('');
      expect(result?.country_code).toBe('');
      expect(result?.profile_picture_url).toBe('');
      expect(result).not.toHaveProperty('last_login_date');
    });
  });

  describe('findByUsername', () => {
    it('should return user when found by username', async () => {
      const username = 'testuser';
      const expectedUser: User = {
        id: 'test-user-id',
        email: 'test@example.com',
        username,
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findByUsername.mockResolvedValue(expectedUser);

      const result = await userService.findByUsername(username);

      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(username);
      expect(result).toEqual(expectedUser);
    });

    it('should return null when user not found by username', async () => {
      const username = 'nonexistentuser';

      mockUserRepository.findByUsername.mockResolvedValue(null);

      const result = await userService.findByUsername(username);

      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith(username);
      expect(result).toBeNull();
    });
  });

  describe('createUserWithPassword', () => {
    it('should create user with hashed password successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'Password123!',
      };

      const createdUser: User = {
        id: 'new-user-id',
        email: userData.email,
        username: userData.username,
        country_code: null,
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.createWithPassword.mockResolvedValue(createdUser);

      const { hashPassword } = await import('@/shared/utils/auth');
      (hashPassword as jest.Mock).mockResolvedValue('hashed-password');

      // Act
      const result = await userService.createUserWithPassword(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('new-user-id');
      expect(result.email).toBe(userData.email);
      expect(hashPassword).toHaveBeenCalledWith(userData.password);
      expect(mockUserRepository.createWithPassword).toHaveBeenCalledWith({
        ...userData,
        passwordHash: 'hashed-password',
      });
    });

    it('should throw error when email already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        username: 'testuser',
        password: 'Password123!',
      };

      const existingUser: User = {
        id: 'existing-user-id',
        email: userData.email,
        username: 'existinguser',
        country_code: null,
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.findByEmail.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(userService.createUserWithPassword(userData)).rejects.toThrow(
        new AppError('Email already registered', HttpStatus.CONFLICT, ErrorCodes.CONFLICT)
      );
      expect(mockUserRepository.createWithPassword).not.toHaveBeenCalled();
    });
  });

  describe('verifyPassword', () => {
    it('should return true when password is correct', async () => {
      // Arrange
      const userId = 'test-user-id';
      const password = 'Password123!';
      const mockUserWithPassword = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
        password_hash: 'hashed_password',
      };

      mockUserRepository.findByIdWithPassword.mockResolvedValue(mockUserWithPassword);

      const { comparePassword } = await import('@/shared/utils/auth');
      (comparePassword as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await userService.verifyPassword(userId, password);

      // Assert
      expect(result).toBe(true);
      expect(comparePassword).toHaveBeenCalledWith(password, mockUserWithPassword.password_hash);
    });

    it('should return false when user not found', async () => {
      // Arrange
      mockUserRepository.findByIdWithPassword.mockResolvedValue(null);

      // Act
      const result = await userService.verifyPassword('non-existent-id', 'password');

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when user has no password hash', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockUserWithoutPassword = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
        password_hash: null,
      };

      mockUserRepository.findByIdWithPassword.mockResolvedValue(mockUserWithoutPassword);

      // Act
      const result = await userService.verifyPassword(userId, 'password');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const updatedUser: User = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: new Date(),
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockUserRepository.updateLastLogin.mockResolvedValue(updatedUser);

      // Act
      await userService.updateLastLogin(userId);

      // Assert
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(userId, expect.any(Date));
    });

    it('should not throw error when update fails', async () => {
      // Arrange
      const userId = 'test-user-id';
      mockUserRepository.updateLastLogin.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(userService.updateLastLogin(userId)).resolves.not.toThrow();
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const deactivatedUser: User = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: false,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest.spyOn(userService, 'updateUser').mockResolvedValue(deactivatedUser);

      // Act
      const result = await userService.deactivateUser(userId);

      // Assert
      expect(result).toEqual(deactivatedUser);
      expect(result.is_active).toBe(false);
      expect(userService.updateUser).toHaveBeenCalledWith(userId, { is_active: false });
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      // Arrange
      const userId = 'test-user-id';
      const activatedUser: User = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest.spyOn(userService, 'updateUser').mockResolvedValue(activatedUser);

      // Act
      const result = await userService.activateUser(userId);

      // Assert
      expect(result).toEqual(activatedUser);
      expect(result.is_active).toBe(true);
      expect(userService.updateUser).toHaveBeenCalledWith(userId, { is_active: true });
    });
  });

  describe('userExists', () => {
    it('should return true when user exists', async () => {
      // Arrange
      const userId = 'test-user-id';
      const mockUser: User = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      jest.spyOn(userService, 'findById').mockResolvedValue(mockUser);

      // Act
      const result = await userService.userExists(userId);

      // Assert
      expect(result).toBe(true);
      expect(userService.findById).toHaveBeenCalledWith(userId);
    });

    it('should return false when user does not exist', async () => {
      // Arrange
      jest.spyOn(userService, 'findById').mockResolvedValue(null);

      // Act
      const result = await userService.userExists('non-existent-id');

      // Assert
      expect(result).toBe(false);
      expect(userService.findById).toHaveBeenCalledWith('non-existent-id');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully when current password is correct', async () => {
      // Arrange
      const userId = 'test-user-id';
      const currentPassword = 'CurrentPassword123!';
      const newPassword = 'NewPassword456!';

      // Mock verifyPassword to return true (current password is correct)
      jest.spyOn(userService, 'verifyPassword').mockResolvedValue(true);

      const updatedUser: User = {
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        country_code: 'US',
        registration_date: new Date(),
        last_login_date: null,
        profile_picture_url: null,
        is_active: true,
        role: 'student',
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockUserRepository.updatePassword.mockResolvedValue(updatedUser);

      // Act
      const result = await userService.updatePassword(userId, currentPassword, newPassword);

      // Assert
      expect(result).toBe(true);
      expect(userService.verifyPassword).toHaveBeenCalledWith(userId, currentPassword);
      expect(mockUserRepository.updatePassword).toHaveBeenCalled();
    });

    it('should throw an error when current password is incorrect', async () => {
      // Arrange
      const userId = 'test-user-id';
      const currentPassword = 'WrongPassword123!';
      const newPassword = 'NewPassword456!';

      // Mock verifyPassword to return false (current password is incorrect)
      jest.spyOn(userService, 'verifyPassword').mockResolvedValue(false);

      // Act & Assert
      await expect(userService.updatePassword(userId, currentPassword, newPassword)).rejects.toThrow(
        new AppError('Current password is incorrect', HttpStatus.UNAUTHORIZED, ErrorCodes.AUTHENTICATION_ERROR)
      );
      expect(userService.verifyPassword).toHaveBeenCalledWith(userId, currentPassword);
      expect(mockUserRepository.updatePassword).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated users with default options', async () => {
      // Arrange
      const expectedResult: PaginatedResult<User> = {
        data: [
          {
            id: 'user-1',
            email: 'user1@example.com',
            username: 'user1',
            country_code: 'US',
            registration_date: new Date(),
            last_login_date: null,
            profile_picture_url: null,
            is_active: true,
            role: 'student',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      mockUserRepository.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await userService.findAll();

      // Assert
      expect(mockUserRepository.findAll).toHaveBeenCalledWith({});
      expect(result).toEqual(expectedResult);
    });

    it('should return paginated users with custom options', async () => {
      // Arrange
      const options: QueryOptions = { page: 2, limit: 10 };
      const expectedResult: PaginatedResult<User> = {
        data: [],
        pagination: {
          page: 2,
          limit: 10,
          total: 5,
          totalPages: 1,
          hasNext: false,
          hasPrev: true,
        },
      };

      mockUserRepository.findAll.mockResolvedValue(expectedResult);

      // Act
      const result = await userService.findAll(options);

      // Assert
      expect(mockUserRepository.findAll).toHaveBeenCalledWith(options);
      expect(result).toEqual(expectedResult);
    });
  });
});