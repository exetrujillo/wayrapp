// Vercel serverless function entry point for Express app
const path = require('path');

// Register TypeScript path mappings for compiled JavaScript
const tsConfigPaths = require('tsconfig-paths');
const baseUrl = path.join(__dirname, '..', 'dist');

// Register path mappings based on tsconfig.json
tsConfigPaths.register({
  baseUrl: baseUrl,
  paths: {
    '@/*': ['*'],
    '@/modules/*': ['modules/*'],
    '@/shared/*': ['shared/*']
  }
});

try {
  const app = require('../dist/app.js');

  // Handle both CommonJS and ES module exports
  module.exports = app.default || app;
} catch (error) {
  console.error('Error loading app:', error);
  console.error('Stack trace:', error.stack);

  // Fallback: create a simple error handler
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  };
}