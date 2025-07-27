// Vercel serverless function handler
// Initialize module aliases for @/ path resolution
const moduleAlias = require('module-alias');
moduleAlias.addAlias('@', __dirname + '/../dist');

const { default: app } = require('../dist/app.js');

module.exports = app;