// Vercel serverless function handler
const { default: app } = require('../dist/app.js');

module.exports = app;