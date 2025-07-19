/**
 * Database Connection Manager
 * Singleton pattern for Prisma client with logging and connection management
 * 
 * @author Exequiel Trujillo
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@/shared/utils/logger';

// Singleton pattern for Prisma client
class DatabaseConnection {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) {
      // Configure Prisma client with appropriate logging
      const logLevel = process.env['NODE_ENV'] === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'];
      
      DatabaseConnection.instance = new PrismaClient({
        log: logLevel as any,
      });

      logger.info('Database connection initialized');
    }

    return DatabaseConnection.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.$disconnect();
      logger.info('Database connection closed');
    }
  }
}

export const prisma = DatabaseConnection.getInstance();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connection...');
  await DatabaseConnection.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connection...');
  await DatabaseConnection.disconnect();
  process.exit(0);
});

export default prisma;