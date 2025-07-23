/**
 * Mock Service Worker server setup for testing
 * Configures MSW for Node.js testing environment
 */

import { setupServer } from 'msw/node';
import { handlers } from '../../mocks/handlers';

// Setup MSW server with our handlers
export const server = setupServer(...handlers);

// Enable API mocking before all tests
beforeAll(() => {
  server.listen({
    onUnhandledRequest: 'warn',
  });
});

// Reset any request handlers that are declared as a part of our tests
afterEach(() => {
  server.resetHandlers();
});

// Clean up after all tests are done
afterAll(() => {
  server.close();
});