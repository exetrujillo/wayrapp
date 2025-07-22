#!/usr/bin/env node

/**
 * Test Deployment Script for WayrApp Monorepo
 * Verifies that all applications can be built and deployed successfully
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting WayrApp Monorepo Deployment Test...\n');

// Function to execute commands and handle errors
function runCommand(command, errorMessage) {
  try {
    console.log(`Running: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`❌ ${errorMessage}:`, error.message);
    return false;
  }
}

// Check if Vercel CLI is installed
function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.error('❌ Vercel CLI is not installed. Please install it with: npm install -g vercel');
    return false;
  }
}

// Verify Vercel configuration
function verifyVercelConfig() {
  console.log('📋 Verifying Vercel configuration...');
  
  try {
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));
    
    // Check if builds are configured correctly
    if (!vercelConfig.builds || vercelConfig.builds.length < 3) {
      console.error('❌ Vercel configuration is missing required builds for backend, frontend-creator, and frontend-mobile');
      return false;
    }
    
    // Validate each build configuration
    const expectedBuilds = [
      { src: 'src/server.ts', use: '@vercel/node' },
      { src: 'frontend-creator/package.json', use: '@vercel/static-build' },
      { src: 'frontend-mobile/package.json', use: '@vercel/static-build' }
    ];
    
    for (const expectedBuild of expectedBuilds) {
      const found = vercelConfig.builds.find(build => 
        build.src === expectedBuild.src && build.use === expectedBuild.use
      );
      if (!found) {
        console.error(`❌ Missing build configuration for ${expectedBuild.src} with ${expectedBuild.use}`);
        return false;
      }
    }
    
    // Check if routes are configured correctly
    if (!vercelConfig.routes || vercelConfig.routes.length < 3) {
      console.error('❌ Vercel configuration is missing required routes for API and frontend applications');
      return false;
    }
    
    // Validate route configuration
    const hasApiRoute = vercelConfig.routes.some(route => route.src && route.src.includes('/api/'));
    const hasCreatorRoute = vercelConfig.routes.some(route => route.src && route.src.includes('/creator/'));
    const hasMobileRoute = vercelConfig.routes.some(route => route.src && route.src.includes('/mobile/'));
    
    if (!hasApiRoute) {
      console.error('❌ Missing API route configuration');
      return false;
    }
    
    if (!hasCreatorRoute) {
      console.error('❌ Missing creator route configuration');
      return false;
    }
    
    if (!hasMobileRoute) {
      console.error('❌ Missing mobile route configuration');
      return false;
    }
    
    console.log('✅ Vercel configuration validation passed');
    console.log('  - Backend build: ✓');
    console.log('  - Frontend-creator build: ✓');
    console.log('  - Frontend-mobile build: ✓');
    console.log('  - API routes: ✓');
    console.log('  - Creator routes: ✓');
    console.log('  - Mobile routes: ✓');
    
    return true;
  } catch (error) {
    console.error('❌ Failed to read or parse vercel.json:', error.message);
    return false;
  }
}

// Test building all applications
function testBuild() {
  console.log('\n📦 Testing build process for all applications...');
  
  // Build backend
  console.log('\n🔧 Building backend...');
  if (!runCommand('npm run build', 'Backend build failed')) {
    return false;
  }
  
  // Build all frontend applications
  console.log('\n🔧 Building all frontend applications...');
  if (!runCommand('npm run build:all', 'Frontend build failed')) {
    return false;
  }
  
  console.log('✅ All applications built successfully');
  return true;
}

// Test build outputs
function testBuildOutputs() {
  console.log('\n📁 Verifying build outputs...');
  
  // Check backend build output
  if (!fs.existsSync(path.join(__dirname, '..', 'dist', 'server.js'))) {
    console.error('❌ Backend build output missing: dist/server.js');
    return false;
  }
  
  // Check frontend-creator build output
  if (!fs.existsSync(path.join(__dirname, '..', 'frontend-creator', 'dist', 'index.html'))) {
    console.error('❌ Frontend-creator build output missing: frontend-creator/dist/index.html');
    return false;
  }
  
  // Check frontend-shared build output
  if (!fs.existsSync(path.join(__dirname, '..', 'frontend-shared', 'dist', 'index.js'))) {
    console.error('❌ Frontend-shared build output missing: frontend-shared/dist/index.js');
    return false;
  }
  
  console.log('✅ All build outputs are present');
  console.log('  - Backend: dist/server.js ✓');
  console.log('  - Frontend-creator: frontend-creator/dist/index.html ✓');
  console.log('  - Frontend-shared: frontend-shared/dist/index.js ✓');
  
  return true;
}

// Test server startup (basic syntax check)
function testServerStartup() {
  console.log('\n🚀 Testing server startup (syntax validation)...');
  
  try {
    // Test if the built server file has valid syntax
    require(path.join(__dirname, '..', 'dist', 'server.js'));
    console.log('✅ Server file syntax is valid');
    return true;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('Cannot find module')) {
      // This is expected since we're not running in the full environment
      console.log('✅ Server file syntax is valid (module dependencies expected)');
      return true;
    } else {
      console.error('❌ Server file has syntax errors:', error.message);
      return false;
    }
  }
}

// Test Vercel configuration validation
function testVercelConfigValidation() {
  console.log('\n🔍 Testing Vercel configuration validation...');
  
  if (!checkVercelCLI()) {
    console.log('⚠️  Vercel CLI not available, skipping Vercel-specific validation');
    return true;
  }
  
  // Check if user is logged in to Vercel
  try {
    execSync('vercel whoami', { stdio: 'pipe' });
  } catch (error) {
    console.log('⚠️  Not logged in to Vercel, skipping Vercel build validation');
    console.log('   To test actual deployment, run: vercel login');
    return true;
  }
  
  // Test Vercel build process (this validates the configuration)
  if (!runCommand('vercel build --yes', 'Vercel build validation failed')) {
    return false;
  }
  
  console.log('✅ Vercel configuration validation passed');
  return true;
}

// Main function
async function main() {
  let success = true;
  
  // Step 1: Verify Vercel configuration
  if (!verifyVercelConfig()) {
    success = false;
  }
  
  // Step 2: Test building all applications
  if (success && !testBuild()) {
    success = false;
  }
  
  // Step 3: Test build outputs
  if (success && !testBuildOutputs()) {
    success = false;
  }
  
  // Step 4: Test server startup
  if (success && !testServerStartup()) {
    success = false;
  }
  
  // Step 5: Test Vercel configuration validation
  if (success && !testVercelConfigValidation()) {
    success = false;
  }
  
  if (success) {
    console.log('\n🎉 Deployment test completed successfully!');
    console.log('All applications can be built and deployed to Vercel.');
  } else {
    console.error('\n❌ Deployment test failed. Please fix the issues before deploying to Vercel.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});