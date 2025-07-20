/**
 * UserService Tests
 * Unit tests for user business logic
 */

import { UserService } from '../userService';
import { UserRepository } from '../../repositories/userRepository';
import { AppError } from '../../../../shared/middleware/errorHandler';
import { ErrorCodes, HttpStatus } from '../../../../shared/types';
import { User, CreateUserDto, UpdateUserDto } from '../../types';

// Mock UserRepository
jest.mock('../../repositories/userRepository');
const MockedUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;

// Mock auth utilities
jest.mock('@/shared/utils/auth', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed-password'),
  comparePassword: jest.fn().mockResolvedValue(true)
}));

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    country_code: 'US',
    registration_date: new Date(),
    last_login_date: null,
    profile_picture_url: null,
    is_active: true,
    role: 'student',
    created_at: new Date(),
    updated_at: new Date()
  };

  beforeEach(() => {
    mockUserRepository = new MockedUserRepository({} as any) as jest.Mocked<UserRepository>;
    userService = new UserService(mockUserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.findById('user-123');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await userService.findByEmail('test@example.com');

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      const result = await userService.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      username: 'newuser',
      country_code: 'CA',
      role: 'student'
    };

    it('should create user successfully', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(createUserDto);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('newuser');
      expect(mockUserRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw error when email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(userService.createUser(createUserDto)).rejects.toThrow(
        new AppError('Email already registered', HttpStatus.CONFLICT, ErrorCodes.CONFLICT)
      );
    });

    it('should throw error when username already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);

      await expect(userService.createUser(createUserDto)).rejects.toThrow(
        new AppError('Username already taken', HttpStatus.CONFLICT, ErrorCodes.CONFLICT)
      );
    });

    it('should create user without username check when username not provided', async () => {
      const createUserDtoWithoutUsername = { ...createUserDto };
      delete createUserDtoWithoutUsername.username;

      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);

      const result = await userService.createUser(createUserDtoWithoutUsername);

      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('new@example.com');
      expect(mockUserRepository.findByUsername).not.toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });
  });

  describe('updateUser', () => {
    const updateUserDto: UpdateUserDto = {
      username: 'updateduser',
      country_code: 'UK'
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser('user-123', updateUserDto);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith('updateduser');
      expect(mockUserRepository.update).toHaveBeenCalledWith('user-123', updateUserDto);
      expect(result).toEqual(updatedUser);
    });

    it('should throw error when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.updateUser('nonexistent', updateUserDto)).rejects.toThrow(
        new AppError('User not found', HttpStatus.NOT_FOUND, ErrorCodes.NOT_FOUND)
      );
    });

    it('should throw error when username already taken by another user', async () => {
      const anotherUser = { ...mockUser, id: 'another-user', username: 'updateduser' };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findByUsername.mockResolvedValue(anotherUser);

      await expect(userService.updateUser('user-123', updateUserDto)).rejects.toThrow(
        new AppError('Username already taken', HttpStatus.CONFLICT, ErrorCodes.CONFLICT)
      );
    });

    it('should allow user to keep their own username', async () => {
      const updateWithSameUsername = { username: 'testuser' };
      const updatedUser = { ...mockUser };

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.findByUsername.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUser('user-123', updateWithSameUsername);

      expect(result).toEqual(updatedUser);
    });
  });

  describe('createUserWithPassword', () => {
    const createUserWithPasswordDto = {
      email: 'new@example.com',
      password: 'password123!',
      username: 'newuser',
      role: 'student' as const
    };

    it('should create user with hashed password', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.createWithPassword.mockResolvedValue(mockUser);

      const result = await userService.createUserWithPassword(createUserWithPasswordDto);

      expect(mockUserRepository.createWithPassword).toHaveBeenCalledWith({
        ...createUserWithPasswordDto,
        passwordHash: 'hashed-password'
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error when email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(userService.createUserWithPassword(createUserWithPasswordDto)).rejects.toThrow(
        new AppError('Email already registered', HttpStatus.CONFLICT, ErrorCodes.CONFLICT)
      );
    });
  });

  describe('verifyPassword', () => {
    it('should return true for valid password', async () => {
      const userWithPassword = { ...mockUser, password_hash: 'hashed-password' };
      mockUserRepository.findByIdWithPassword.mockResolvedValue(userWithPassword);

      const result = await userService.verifyPassword('user-123', 'password123!');

      expect(mockUserRepository.findByIdWithPassword).toHaveBeenCalledWith('user-123');
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      mockUserRepository.findByIdWithPassword.mockResolvedValue(null);

      const result = await userService.verifyPassword('nonexistent', 'password123!');

      expect(result).toBe(false);
    });

    it('should return false when password hash is null', async () => {
      const userWithoutPassword = { ...mockUser, password_hash: null };
      mockUserRepository.findByIdWithPassword.mockResolvedValue(userWithoutPassword);

      const result = await userService.verifyPassword('user-123', 'password123!');

      expect(result).toBe(false);
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      const userWithPassword = { ...mockUser, password_hash: 'old-hashed-password' };
      mockUserRepository.findByIdWithPassword.mockResolvedValue(userWithPassword);
      mockUserRepository.updatePassword.mockResolvedValue(mockUser);

      const result = await userService.updatePassword('user-123', 'oldPassword', 'newPassword');

      expect(mockUserRepository.updatePassword).toHaveBeenCalledWith('user-123', 'hashed-password');
      expect(result).toBe(true);
    });

    it('should throw error when current password is incorrect', async () => {
      const userWithPassword = { ...mockUser, password_hash: 'hashed-password' };
      mockUserRepository.findByIdWithPassword.mockResolvedValue(userWithPassword);

      // Mock comparePassword to return false
      const { comparePassword } = require('@/shared/utils/auth');
      comparePassword.mockResolvedValueOnce(false);

      await expect(
        userService.updatePassword('user-123', 'wrongPassword', 'newPassword')
      ).rejects.toThrow(
        new AppError('Current password is incorrect', HttpStatus.UNAUTHORIZED, ErrorCodes.AUTHENTICATION_ERROR)
      );
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile without sensitive data', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.getUserProfile('user-123');

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username || '',
        country_code: mockUser.country_code || '',
        registration_date: mockUser.registration_date,
        profile_picture_url: mockUser.profile_picture_url || '',
        is_active: mockUser.is_active,
        role: mockUser.role,
        created_at: mockUser.created_at,
        updated_at: mockUser.updated_at
      });
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.getUserProfile('nonexistent');

      expect(result).toBeNull();
    });

    it('should include last_login_date when it exists', async () => {
      const userWithLastLogin = { ...mockUser, last_login_date: new Date() };
      mockUserRepository.findById.mockResolvedValue(userWithLastLogin);

      const result = await userService.getUserProfile('user-123');

      expect(result).toHaveProperty('last_login_date', userWithLastLogin.last_login_date);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const deactivatedUser = { ...mockUser, is_active: false };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(deactivatedUser);

      const result = await userService.deactivateUser('user-123');

      expect(mockUserRepository.update).toHaveBeenCalledWith('user-123', { is_active: false });
      expect(result).toEqual(deactivatedUser);
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      const activatedUser = { ...mockUser, is_active: true };
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockResolvedValue(activatedUser);

      const result = await userService.activateUser('user-123');

      expect(mockUserRepository.update).toHaveBeenCalledWith('user-123', { is_active: true });
      expect(result).toEqual(activatedUser);
    });
  });

  describe('userExists', () => {
    it('should return true when user exists', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.userExists('user-123');

      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      const result = await userService.userExists('nonexistent');

      expect(result).toBe(false);
    });
  });
});