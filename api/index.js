// Vercel serverless function entry point for Express app
try {
  const app = require('../dist/app.js');
  
  // Handle both CommonJS and ES module exports
  module.exports = app.default || app;
} catch (error) {
  console.error('Error loading app:', error);
  
  // Fallback: create a simple error handler
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message
    });
  };
}