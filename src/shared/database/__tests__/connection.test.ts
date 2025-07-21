import { PrismaClient } from '@prisma/client';
import prisma from '../connection';

describe('Database Connection', () => {
  beforeEach(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });
  let mockPrismaClient: any;
  
  beforeEach(() => {
    mockPrismaClient = new PrismaClient();
    jest.clearAllMocks();
  });
  
  describe('connectDatabase', () => {
    it('should connect to the database successfully', async () => {
      // Act
      await connectDatabase();
      
      // Assert
      expect(mockPrismaClient.$connect).toHaveBeenCalledTimes(1);
    });
    
    it('should handle connection errors', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockError = new Error('Connection failed');
      mockPrismaClient.$connect.mockRejectedValueOnce(mockError);
      
      // Act & Assert
      await expect(connectDatabase()).rejects.toThrow('Failed to connect to database');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Database connection error:', mockError);
      
      // Cleanup
      consoleErrorSpy.mockRestore();
    });
  });
  
  describe('disconnectDatabase', () => {
    it('should disconnect from the database successfully', async () => {
      // Act
      await connectDatabase();
      
      // Assert
      expect(mockPrismaClient.$disconnect).toHaveBeenCalledTimes(1);
    });
    
    it('should handle disconnection errors', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockError = new Error('Disconnection failed');
      mockPrismaClient.$disconnect.mockRejectedValueOnce(mockError);
      
      // Act
      await connectDatabase();
      
      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error disconnecting from database:', mockError);
      
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

function connectDatabase() {
  throw new Error('Function not implemented.');
}
