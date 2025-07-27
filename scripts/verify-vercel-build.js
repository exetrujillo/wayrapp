#!/usr/bin/env node

/**
 * Verification script for Vercel build
 * Checks that all necessary files are present for compilation
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/app.ts',
  'src/server.ts',
  'tsconfig.vercel.json',
  'package.json',
  'prisma/schema.prisma'
];

const requiredDirs = [
  'src/modules',
  'src/shared',
  'prisma'
];

console.log('🔍 Verifying Vercel build requirements...\n');

let allGood = true;

// Check required files
console.log('📄 Checking required files:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    allGood = false;
  }
});

// Check required directories
console.log('\n📁 Checking required directories:');
requiredDirs.forEach(dir => {
  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    console.log(`  ✅ ${dir}/`);
  } else {
    console.log(`  ❌ ${dir}/ - MISSING`);
    allGood = false;
  }
});

// Check TypeScript config
console.log('\n⚙️  Checking TypeScript configuration:');
try {
  const tsConfig = JSON.parse(fs.readFileSync('tsconfig.vercel.json', 'utf8'));
  if (tsConfig.include && tsConfig.include.includes('src/**/*')) {
    console.log('  ✅ tsconfig.vercel.json includes src/**/*');
  } else {
    console.log('  ❌ tsconfig.vercel.json missing src/**/* in include');
    allGood = false;
  }
  
  // Check that Jest types are not included
  if (tsConfig.compilerOptions && tsConfig.compilerOptions.types) {
    const types = tsConfig.compilerOptions.types;
    if (types.includes('jest')) {
      console.log('  ❌ tsconfig.vercel.json should not include jest types');
      allGood = false;
    } else {
      console.log('  ✅ Jest types excluded from Vercel build');
    }
  }
  
  // Check exclusions
  if (tsConfig.exclude && tsConfig.exclude.includes('src/testInfo.ts')) {
    console.log('  ✅ Test-related files excluded');
  } else {
    console.log('  ❌ Test-related files not properly excluded');
    allGood = false;
  }
} catch (error) {
  console.log('  ❌ Error reading tsconfig.vercel.json:', error.message);
  allGood = false;
}

console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ All requirements met! Ready for Vercel deployment.');
  process.exit(0);
} else {
  console.log('❌ Some requirements are missing. Please fix before deploying.');
  process.exit(1);
}