/**
 * Test Database Utility
 * Provides utilities for testing with a database
 */
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Create a unique schema name for isolated tests
const getTestSchemaName = () => `test_${uuidv4().replace(/-/g, '_')}`;

export class TestDatabase {
  private prisma: PrismaClient;
  private schemaName: string;

  constructor() {
    this.schemaName = getTestSchemaName();
    
    // Create a new PrismaClient instance with the test schema
    this.prisma = new PrismaClient({
      datasourceUrl: process.env['DATABASE_URL'] 
        ? `${process.env['DATABASE_URL']}?schema=${this.schemaName}`
        : `postgresql://postgres:postgres@localhost:5432/test?schema=${this.schemaName}`,
    });
  }

  /**
   * Initialize the test database
   */
  async init(): Promise<void> {
    try {
      // Create the schema
      await this.prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${this.schemaName}"`);
      
      // Run migrations or push schema
      await this.prisma.$executeRawUnsafe(`SET search_path TO "${this.schemaName}"`);
      
      // Use Prisma's db push for test schema setup (faster than migrations)
      // This requires the DATABASE_URL to include the schema
      await this.prisma.$executeRawUnsafe(`SET search_path TO "${this.schemaName}"`);
    } catch (error) {
      console.error('Failed to initialize test database:', error);
      throw error;
    }
  }

  /**
   * Clean up the test database
   */
  async cleanup(): Promise<void> {
    try {
      // Drop the schema
      await this.prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${this.schemaName}" CASCADE`);
      
      // Disconnect
      await this.prisma.$disconnect();
    } catch (error) {
      console.error('Failed to clean up test database:', error);
      throw error;
    }
  }

  /**
   * Get the Prisma client instance
   */
  getClient(): PrismaClient {
    return this.prisma;
  }
}

// Singleton for global test database
let testDb: TestDatabase | null = null;

/**
 * Get a global test database instance
 */
export const getTestDb = async (): Promise<TestDatabase> => {
  if (!testDb) {
    testDb = new TestDatabase();
    await testDb.init();
  }
  return testDb;
};

/**
 * Clean up the global test database
 */
export const cleanupTestDb = async (): Promise<void> => {
  if (testDb) {
    await testDb.cleanup();
    testDb = null;
  }
};