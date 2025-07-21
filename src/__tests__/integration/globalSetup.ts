/**
 * Global Setup for Integration Tests
 * Runs once before all integration tests
 */

import { execSync } from 'child_process';
import dotenv from 'dotenv';

export default async function globalSetup() {
  console.log('🚀 Setting up integration tests...');
  
  // Load environment variables
  dotenv.config();
  
  // Ensure we're in test environment
  process.env['NODE_ENV'] = 'test';
  
  try {
    // Generate Prisma client if needed
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Push database schema (for test database)
    if (process.env['DATABASE_URL']) {
      console.log('🗄️  Setting up test database schema...');
      execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    } else {
      console.warn('⚠️  DATABASE_URL not set, skipping database setup');
    }
    
    console.log('✅ Integration test setup complete');
  } catch (error) {
    console.error('❌ Integration test setup failed:', error);
    throw error;
  }
}