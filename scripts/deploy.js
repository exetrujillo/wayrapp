#!/usr/bin/env node

/**
 * Deployment Script for WayrApp Backend
 * Handles pre-deployment checks and database migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting WayrApp Backend Deployment Process...\n');

// Check if we're in production environment
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);

// Pre-deployment checks
console.log('📋 Running pre-deployment checks...');

try {
  // Check if required environment variables are set
  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    process.exit(1);
  }

  console.log('✅ Environment variables check passed');

  // Check if dist directory exists
  if (!fs.existsSync(path.join(__dirname, '..', 'dist'))) {
    console.log('📦 Building application...');
    execSync('npm run build', { stdio: 'inherit' });
  }

  console.log('✅ Build check passed');

  // Generate Prisma client
  console.log('🔧 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  console.log('✅ Prisma client generated');

  // Run database migrations in production
  if (isProduction) {
    console.log('🗄️  Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Database migrations completed');
  }

  console.log('\n🎉 Deployment preparation completed successfully!');
  console.log('Ready for Vercel deployment.');

} catch (error) {
  console.error('❌ Deployment preparation failed:', error.message);
  process.exit(1);
}