/**
 * Database Connection Test Utility
 * Tests the database connection and verifies schema setup
 * 
 * @author Exequiel Trujillo
 */

import { prisma } from './connection';
import { logger } from '@/shared/utils/logger';

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    logger.info('Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    logger.info('✅ Database connection successful');
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    logger.info('✅ Database query test successful', { result });
    
    // Test if tables exist (after migration)
    try {
      const userCount = await prisma.user.count();
      logger.info('✅ Database schema verified', { userCount });
    } catch (error) {
      logger.warn('⚠️  Database schema not yet migrated', { 
        message: 'Run migrations to create tables' 
      });
    }
    
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed', { 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI utility to test connection
if (require.main === module) {
  testDatabaseConnection()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      logger.error('Connection test failed', { error });
      process.exit(1);
    });
}