// Vercel serverless function entry point
const path = require('path');

// Set up path mappings for TypeScript compiled output
const tsConfigPaths = require('tsconfig-paths');
const baseUrl = path.join(__dirname, '..', 'dist');

tsConfigPaths.register({
  baseUrl: baseUrl,
  paths: {
    '@/*': ['*']
  }
});

// Load and export the Express app
let app;

try {
  const appModule = require('../dist/app.js');
  app = appModule.default || appModule;

  if (!app) {
    throw new Error('No app export found');
  }

  console.log('App loaded successfully');
} catch (error) {
  console.error('Failed to load app:', error);

  // Create fallback handler
  app = (req, res) => {
    res.status(500).json({
      error: 'Application failed to initialize',
      message: error.message
    });
  };
}

module.exports = app;