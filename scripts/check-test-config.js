#!/usr/bin/env node

/**
 * Script to check test configuration
 * Verifies that test and production databases are separate
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 Checking test configuration...\n');

// Function to parse .env file manually to avoid conflicts
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim() === '' || line.trim().startsWith('#')) {
      return;
    }
    
    const equalIndex = line.indexOf('=');
    if (equalIndex > 0) {
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim().replace(/^["']|["']$/g, ''); // Remove quotes
      env[key] = value;
    }
  });
  
  return env;
}

// Load production environment
const prodEnv = parseEnvFile(path.resolve(__dirname, '..', '.env'));
const prodDbUrl = prodEnv.DATABASE_URL;

// Load test environment
const testEnv = parseEnvFile(path.resolve(__dirname, '..', '.env.test'));
const testDbUrl = testEnv.DATABASE_URL;

console.log('📊 Configuration Status:');
console.log('========================');

// Check production database
if (prodDbUrl) {
  console.log('✅ Production database configured');
  console.log('   URL:', prodDbUrl.replace(/:[^:@]*@/, ':***@'));
} else {
  console.log('❌ Production database NOT configured');
}

// Check test database
if (testDbUrl) {
  console.log('✅ Test database configured');
  console.log('   URL:', testDbUrl.replace(/:[^:@]*@/, ':***@'));
} else {
  console.log('❌ Test database NOT configured');
}

console.log('');

// Validate separation
if (prodDbUrl && testDbUrl) {
  if (prodDbUrl === testDbUrl) {
    console.log('🚨 CRITICAL ERROR: Test and production databases are THE SAME!');
    console.log('   This means tests will DELETE your production data!');
    console.log('   Please create a separate test database.');
    process.exit(1);
  } else {
    console.log('✅ Test and production databases are separate');
  }
  
  // Check if test database looks like a test database
  if (testDbUrl.includes('test') || testDbUrl.includes('wayrapp_test')) {
    console.log('✅ Test database URL appears to be for testing');
  } else {
    console.log('⚠️  WARNING: Test database URL does not contain "test"');
    console.log('   Make sure this is actually a test database!');
  }
} else {
  console.log('❌ Cannot validate database separation - missing configuration');
}

console.log('');
console.log('📝 Next steps:');
if (!testDbUrl || prodDbUrl === testDbUrl) {
  console.log('   1. Create a separate test database in Neon');
  console.log('   2. Update DATABASE_URL in .env.test');
  console.log('   3. Run: npm run test:db:setup');
} else {
  console.log('   1. Run: npm run test:db:setup');
  console.log('   2. Run: npm run test:integration:safe');
}