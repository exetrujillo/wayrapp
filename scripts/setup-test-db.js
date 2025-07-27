#!/usr/bin/env node

/**
 * Script to set up test database
 * Run this before running integration tests
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔧 Setting up test database...');

try {
  // Set environment to test
  process.env.NODE_ENV = 'test';
  
  // Load test environment variables
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env.test') });
  
  // Validate test database URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error('DATABASE_URL not found in .env.test');
  }
  
  // Check if it's a different database from production
  const fs = require('fs');
  let prodDbUrl = '';
  try {
    const prodEnv = fs.readFileSync(path.resolve(__dirname, '..', '.env'), 'utf8');
    const match = prodEnv.match(/DATABASE_URL="([^"]+)"/);
    if (match) {
      prodDbUrl = match[1];
    }
  } catch (error) {
    // Production .env not found, continue
  }
  
  if (prodDbUrl && dbUrl === prodDbUrl) {
    console.error('🚨 CRITICAL ERROR: Test and production databases are THE SAME!');
    console.error('Current URL:', dbUrl);
    console.error('This means tests will DELETE your production data!');
    process.exit(1);
  }
  
  if (!dbUrl.includes('test') && !dbUrl.includes('wayrapp_test')) {
    console.log('⚠️  Note: Database URL does not contain "test" but appears to be separate from production.');
    console.log('   Continuing with setup...');
  }
  
  console.log('📋 Pushing database schema to test database...');
  console.log('🔗 Database:', dbUrl.replace(/:[^:@]*@/, ':***@')); // Hide password
  
  // Push schema to test database
  execSync('npx prisma db push --force-reset', {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('✅ Test database setup complete!');
  console.log('🧪 You can now run integration tests safely.');
  console.log('');
  console.log('📝 Next steps:');
  console.log('   npm run test:integration:safe  # Run integration tests safely');
  console.log('   npm run test:backend          # Run all backend tests');
  
} catch (error) {
  console.error('❌ Failed to setup test database:', error.message);
  console.error('\n💡 Make sure you have:');
  console.error('   1. Created a separate test database in Neon');
  console.error('   2. Updated DATABASE_URL in .env.test with the test database URL');
  console.error('   3. The test database URL contains "test" or "wayrapp_test"');
  console.error('\n🔗 Current DATABASE_URL in .env.test:');
  console.error('   ', process.env.DATABASE_URL || 'NOT SET');
  process.exit(1);
}