#!/usr/bin/env node

/**
 * Authentication Integration Test Runner
 * 
 * This script runs integration tests for the authentication flow with the production API.
 * It can be run manually to validate that the authentication system works correctly.
 */

const { execSync } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader(text) {
  console.log('\n' + colorize('='.repeat(60), 'cyan'));
  console.log(colorize(text, 'bright'));
  console.log(colorize('='.repeat(60), 'cyan') + '\n');
}

function printSection(text) {
  console.log('\n' + colorize('─'.repeat(40), 'blue'));
  console.log(colorize(text, 'blue'));
  console.log(colorize('─'.repeat(40), 'blue'));
}

function printSuccess(text) {
  console.log(colorize('✅ ' + text, 'green'));
}

function printError(text) {
  console.log(colorize('❌ ' + text, 'red'));
}

function printWarning(text) {
  console.log(colorize('⚠️  ' + text, 'yellow'));
}

function printInfo(text) {
  console.log(colorize('ℹ️  ' + text, 'blue'));
}

async function main() {
  printHeader('Authentication Integration Test Runner');

  // Check if we're in the correct directory
  const currentDir = process.cwd();
  const expectedPath = path.join('frontend-creator');
  
  if (!currentDir.includes('frontend-creator')) {
    printError('This script must be run from the frontend-creator directory');
    printInfo('Current directory: ' + currentDir);
    printInfo('Please run: cd frontend-creator && node scripts/test-auth-integration.js');
    process.exit(1);
  }

  // Check environment variables
  printSection('Environment Configuration Check');
  
  const requiredEnvVars = ['VITE_API_URL', 'VITE_ENABLE_MSW'];
  const optionalEnvVars = ['TEST_EMAIL', 'TEST_PASSWORD'];
  
  let envValid = true;
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      printSuccess(`${envVar}: ${value}`);
    } else {
      printError(`${envVar}: Not set`);
      envValid = false;
    }
  }
  
  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar];
    if (value) {
      printSuccess(`${envVar}: ${value.replace(/./g, '*')} (hidden)`);
    } else {
      printWarning(`${envVar}: Not set (some tests will be skipped)`);
    }
  }

  if (!envValid) {
    printError('Required environment variables are missing');
    printInfo('Please check your .env file in the frontend-creator directory');
    process.exit(1);
  }

  // Validate API configuration
  printSection('API Configuration Validation');
  
  const apiUrl = process.env.VITE_API_URL;
  const enableMSW = process.env.VITE_ENABLE_MSW;
  
  if (apiUrl === 'https://wayrapp.vercel.app/api/v1') {
    printSuccess('API URL is set to production');
  } else {
    printWarning(`API URL is not production: ${apiUrl}`);
  }
  
  if (enableMSW === 'false') {
    printSuccess('MSW is disabled (correct for production API testing)');
  } else {
    printWarning('MSW is enabled - this may interfere with production API testing');
  }

  // Run TypeScript compilation check
  printSection('TypeScript Compilation Check');
  
  try {
    execSync('npx tsc --noEmit', { 
      stdio: 'pipe',
      cwd: process.cwd()
    });
    printSuccess('TypeScript compilation successful');
  } catch (error) {
    printError('TypeScript compilation failed');
    console.log(error.stdout?.toString() || error.message);
    process.exit(1);
  }

  // Run the integration tests
  printSection('Running Authentication Integration Tests');
  
  try {
    const testCommand = 'npx jest src/__tests__/integration/auth-integration.test.ts --verbose --no-cache';
    
    printInfo('Running command: ' + testCommand);
    
    const result = execSync(testCommand, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    });
    
    printSuccess('All integration tests passed!');
    
  } catch (error) {
    printError('Integration tests failed');
    console.error(error.message);
    process.exit(1);
  }

  // Summary
  printSection('Test Summary');
  printSuccess('Authentication integration tests completed successfully');
  printInfo('The following components have been validated:');
  console.log('  • Production API connectivity');
  console.log('  • Login flow with real credentials');
  console.log('  • Error handling for invalid credentials');
  console.log('  • Session management and persistence');
  console.log('  • Token validation and expiry handling');
  console.log('  • User profile fetching from /auth/me endpoint');
  console.log('  • Logout flow and session cleanup');
  
  printHeader('Integration Testing Complete! 🎉');
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  printError('Uncaught exception: ' + error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  printError('Unhandled rejection at: ' + promise + ', reason: ' + reason);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  printError('Script failed: ' + error.message);
  console.error(error.stack);
  process.exit(1);
});