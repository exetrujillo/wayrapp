// Vercel serverless function handler
// Initialize module aliases for @/ path resolution
require('module-alias/register');

const { default: app } = require('../dist/app.js');

module.exports = app;