/**
 * User Repository Unit Tests
 */
import { UserRepository } from "../userRepository";
import { createMockPrismaClient } from "@/shared/test/mocks";
import { AppError } from "@/shared/middleware/errorHandler";
import { ErrorCodes, HttpStatus, UserRole } from "@/shared/types";
import { Prisma } from "@prisma/client";

// Mock the logger
jest.mock("@/shared/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("UserRepository", () => {
  let userRepository: UserRepository;
  let mockPrisma: ReturnType<typeof createMockPrismaClient>;

  beforeEach(() => {
    // Create a mock Prisma client
    mockPrisma = createMockPrismaClient();

    // Create a UserRepository with the mock Prisma client
    userRepository = new UserRepository(mockPrisma as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create a user successfully", async () => {
      // Arrange
      const userData = {
        email: "test@example.com",
        username: "testuser",
        country_code: "US",
        profile_picture_url: "https://example.com/avatar.jpg",
        role: "student" as UserRole,
      };

      const mockCreatedUser = {
        id: "test-id",
        email: userData.email,
        username: userData.username,
        countryCode: userData.country_code,
        registrationDate: new Date(),
        lastLoginDate: null,
        profilePictureUrl: userData.profile_picture_url,
        isActive: true,
        role: userData.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await userRepository.create(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.username).toBe(userData.username);
      expect(result.country_code).toBe(userData.country_code);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: userData.email,
          username: userData.username,
          countryCode: userData.country_code,
          profilePictureUrl: userData.profile_picture_url,
          role: userData.role,
        },
      });
    });

    it("should handle unique constraint violation", async () => {
      // Arrange
      const userData = {
        email: "existing@example.com",
        username: "existinguser",
      };

      // Create a proper Prisma error mock
      const uniqueConstraintError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint violation",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["email"] },
        },
      );

      mockPrisma.user.create.mockRejectedValue(uniqueConstraintError);

      // Act & Assert
      await expect(userRepository.create(userData)).rejects.toThrow(
        new AppError(
          "Email or username already exists",
          HttpStatus.CONFLICT,
          ErrorCodes.CONFLICT,
        ),
      );
    });

    it("should handle generic database errors", async () => {
      // Arrange
      const userData = {
        email: "test@example.com",
        username: "testuser",
      };

      // Mock a generic database error
      mockPrisma.user.create.mockRejectedValue(
        new Error("Database connection failed"),
      );

      // Act & Assert
      await expect(userRepository.create(userData)).rejects.toThrow(
        new AppError(
          "Failed to create user",
          HttpStatus.INTERNAL_SERVER_ERROR,
          ErrorCodes.DATABASE_ERROR,
        ),
      );
    });
  });

  describe("findById", () => {
    it("should return a user when found", async () => {
      // Arrange
      const userId = "test-id";
      const mockUser = {
        id: userId,
        email: "test@example.com",
        username: "testuser",
        countryCode: "US",
        registrationDate: new Date(),
        lastLoginDate: null,
        profilePictureUrl: null,
        isActive: true,
        role: "student",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      // Act
      const result = await userRepository.findById(userId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(userId);
      expect(result?.email).toBe(mockUser.email);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
    });

    it("should return null when user is not found", async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await userRepository.findById("non-existent-id");

      // Assert
      expect(result).toBeNull();
    });

    it("should handle database errors", async () => {
      // Arrange
      mockPrisma.user.findUnique.mockRejectedValue(new Error("Database error"));

      // Act & Assert
      await expect(userRepository.findById("test-id")).rejects.toThrow(
        new AppError(
          "Failed to find user",
          HttpStatus.INTERNAL_SERVER_ERROR,
          ErrorCodes.DATABASE_ERROR,
        ),
      );
    });
  });

  describe("update", () => {
    it("should update a user successfully", async () => {
      // Arrange
      const userId = "test-id";
      const updates = {
        username: "updateduser",
        country_code: "CA",
        profile_picture_url: "https://example.com/new-avatar.jpg",
        is_active: false,
      };

      const mockUpdatedUser = {
        id: userId,
        email: "test@example.com",
        username: updates.username,
        countryCode: updates.country_code,
        registrationDate: new Date(),
        lastLoginDate: null,
        profilePictureUrl: updates.profile_picture_url,
        isActive: updates.is_active,
        role: "student",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await userRepository.update(userId, updates);

      // Assert
      expect(result).toBeDefined();
      expect(result.username).toBe(updates.username);
      expect(result.country_code).toBe(updates.country_code);
      expect(result.profile_picture_url).toBe(updates.profile_picture_url);
      expect(result.is_active).toBe(updates.is_active);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          username: updates.username,
          countryCode: updates.country_code,
          profilePictureUrl: updates.profile_picture_url,
          isActive: updates.is_active,
        },
      });
    });

    it("should handle record not found error", async () => {
      // Arrange
      const userId = "non-existent-id";
      const updates = { username: "updateduser" };

      // Create a proper Prisma error mock
      const notFoundError = new Prisma.PrismaClientKnownRequestError(
        "Record not found",
        {
          code: "P2025",
          clientVersion: "5.0.0",
        },
      );

      mockPrisma.user.update.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(userRepository.update(userId, updates)).rejects.toThrow(
        new AppError(
          "User not found",
          HttpStatus.NOT_FOUND,
          ErrorCodes.NOT_FOUND,
        ),
      );
    });

    it("should handle unique constraint violation", async () => {
      // Arrange
      const userId = "test-id";
      const updates = { username: "takenusername" };

      // Create a proper Prisma error mock
      const uniqueConstraintError = new Prisma.PrismaClientKnownRequestError(
        "Unique constraint violation",
        {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["username"] }
        }
      );

      mockPrisma.user.update.mockRejectedValue(uniqueConstraintError);

      // Act & Assert
      await expect(userRepository.update(userId, updates)).rejects.toThrow(
        new AppError(
          "Username already exists",
          HttpStatus.CONFLICT,
          ErrorCodes.CONFLICT,
        ),
      );
    });
  });

  describe("findAll", () => {
    it("should return paginated users", async () => {
      // Arrange
      const options = {
        page: 1,
        limit: 10,
        sortBy: "created_at",
        sortOrder: "desc" as const,
      };

      const mockUsers = [
        {
          id: "user-1",
          email: "user1@example.com",
          username: "user1",
          countryCode: "US",
          registrationDate: new Date(),
          lastLoginDate: null,
          profilePictureUrl: null,
          isActive: true,
          role: "student",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "user-2",
          email: "user2@example.com",
          username: "user2",
          countryCode: "CA",
          registrationDate: new Date(),
          lastLoginDate: null,
          profilePictureUrl: null,
          isActive: true,
          role: "student",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrisma.user.count.mockResolvedValue(2);
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      // Act
      const result = await userRepository.findAll(options);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      });
      expect(mockPrisma.user.count).toHaveBeenCalled();
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { created_at: "desc" },
      });
    });

    it("should apply filters correctly", async () => {
      // Arrange
      const options = {
        page: 1,
        limit: 10,
        filters: {
          role: "admin",
          is_active: true,
          search: "test",
        },
      };

      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "admin-user",
          email: "admin@example.com",
          username: "testadmin",
          countryCode: "US",
          registrationDate: new Date(),
          lastLoginDate: null,
          profilePictureUrl: null,
          isActive: true,
          role: "admin",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      // Act
      const result = await userRepository.findAll(options);

      // Assert
      expect(result).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: {
          role: "admin",
          isActive: true,
          OR: [
            { email: { contains: "test", mode: "insensitive" } },
            { username: { contains: "test", mode: "insensitive" } },
          ],
        },
      });
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: {
          role: "admin",
          isActive: true,
          OR: [
            { email: { contains: "test", mode: "insensitive" } },
            { username: { contains: "test", mode: "insensitive" } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { created_at: "desc" },
      });
    });
  });
});
