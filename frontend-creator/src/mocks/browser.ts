/**
 * Mock Service Worker browser setup for development
 * Configures MSW for browser environment with Vite
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// Setup MSW worker with our handlers for browser environment
export const worker = setupWorker(...handlers);

// Start the worker in development mode
export const startMocking = async () => {
  if (import.meta.env.DEV) {
    try {
      await worker.start({
        onUnhandledRequest: 'warn',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      });
      console.log('🔶 MSW: Mock Service Worker started for development');
    } catch (error) {
      console.error('Failed to start MSW:', error);
    }
  }
};