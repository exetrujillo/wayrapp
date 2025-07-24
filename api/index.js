// Register path aliases for compiled JavaScript
require('module-alias/register');

const app = require('../dist/app.js').default;

module.exports = app;