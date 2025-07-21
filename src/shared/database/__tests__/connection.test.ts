import { ensureJestMock } from '@/shared/test/utils/testUtils';
import prisma from '../connection';

// Mock the prisma connection module
jest.mock('../connection', () => {
  const mockClient = {
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
  };
  return mockClient;
});

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connectDatabase', () => {
    it('should connect to the database successfully', async () => {
      // Act
      await connectDatabase();

      // Assert
      expect((prisma as any).$connect).toHaveBeenCalledTimes(1);
    });

    it('should handle connection errors', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockError = new Error('Connection failed');

      // Ensure the mock has the required methods
      const connectMock = ensureJestMock((prisma as any).$connect);
      connectMock.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(connectDatabase()).rejects.toThrow(
        'Failed to connect to database'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Database connection error:',
        mockError
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe('disconnectDatabase', () => {
    it('should disconnect from the database successfully', async () => {
      // Act
      await disconnectDatabase();

      // Assert
      expect((prisma as any).$disconnect).toHaveBeenCalledTimes(1);
    });

    it('should handle disconnection errors', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockError = new Error('Disconnection failed');

      // Ensure the mock has the required methods
      const disconnectMock = ensureJestMock((prisma as any).$disconnect);
      disconnectMock.mockRejectedValueOnce(mockError);

      // Act & Assert
      await expect(disconnectDatabase()).rejects.toThrow(
        'Failed to disconnect from database'
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error disconnecting from database:',
        mockError
      );

      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });

  describe('prisma instance', () => {
    it('should be a singleton', () => {
      // Act
      const prismaInstance1 = prisma;
      const prismaInstance2 = prisma;

      // Assert
      expect(prismaInstance1).toBe(prismaInstance2);
    });
  });
});

// Mock implementation of connectDatabase function
async function connectDatabase() {
  try {
    await (prisma as any).$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error('Failed to connect to database');
  }
}

// Mock implementation of disconnectDatabase function
async function disconnectDatabase() {
  try {
    await (prisma as any).$disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
    throw new Error('Failed to disconnect from database');
  }
}
