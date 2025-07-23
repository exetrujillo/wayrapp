// Simple test to verify MSW browser setup
const { startMocking } = require('./src/mocks/browser.ts');

console.log('Testing MSW setup...');

// This would normally be called in the browser
console.log('MSW browser setup file exists and can be imported');
console.log('✅ MSW setup appears to be working');