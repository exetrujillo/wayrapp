// Serverless function for Vercel
const path = require('path');

try {
  // Set up module aliases for the compiled TypeScript code
  require('module-alias').addAlias('@', path.resolve(__dirname, '../dist'));
  
  // Import the compiled Express app
  const app = require('../dist/app.js').default;
  
  // Export the Express app as a serverless function
  module.exports = app;
} catch (error) {
  console.error('Error loading app:', error);
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  };
}