/**
 * Mock Service Worker browser setup for development
 * Configures MSW for browser environment with Vite
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { env } from '../config/environment';

// Setup MSW worker with our handlers for browser environment
export const worker = setupWorker(...handlers);

// Start the worker only when MSW is enabled via environment variable
export const startMocking = async () => {
  if (env.enableMSW) {
    try {
      await worker.start({
        onUnhandledRequest: 'warn',
        serviceWorker: {
          url: '/mockServiceWorker.js',
        },
      });
      console.log('🔶 MSW: Mock Service Worker started (VITE_ENABLE_MSW=true)');
    } catch (error) {
      console.error('Failed to start MSW:', error);
    }
  } else {
    console.log('🔶 MSW: Mock Service Worker disabled (VITE_ENABLE_MSW=false)');
  }
};