/**
 * @module __tests__/integration/index
 * 
 * Integration Tests Index
 * Exports all integration test suites for organized test execution
 * I think this is not actually necessary and it is not up to the current state of the app.
 * @author Exequiel Trujillo
 * 
 * @since 1.0.0
 */

// Import all integration test suites
import './auth.integration.test';
import './content.integration.test';
import './database.integration.test';
import './crossModule.integration.test';
import './errorHandling.integration.test';

// This file serves as an entry point for all integration tests
// Jest will automatically discover and run all test files
export {};