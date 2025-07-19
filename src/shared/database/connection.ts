import { PrismaClient } from '@prisma/client';
import { logger } from '@/shared/utils/logger';

// Singleton pattern for Prisma client
class DatabaseConnection {
  private static instance: PrismaClient;

  public static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'info',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
      });

      // Log database queries in development
      if (process.env.NODE_ENV === 'development') {
        DatabaseConnection.instance.$on('query', (e) => {
          logger.debug('Database Query', {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
            timestamp: e.timestamp
          });
        });
      }

      // Log database errors
      DatabaseConnection.instance.$on('error', (e) => {
        logger.error('Database Error', {
          message: e.message,
          target: e.target,
          timestamp: e.timestamp
        });
      });

      // Log database info
      DatabaseConnection.instance.$on('info', (e) => {
        logger.info('Database Info', {
          message: e.message,
          target: e.target,
          timestamp: e.timestamp
        });
      });

      // Log database warnings
      DatabaseConnection.instance.$on('warn', (e) => {
        logger.warn('Database Warning', {
          message: e.message,
          target: e.target,
          timestamp: e.timestamp
        });
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