/**
 * Jest Setup File - Runs BEFORE any modules are imported
 * This is critical for mocking import.meta before any code tries to use it
 */

/**
 * JEST MOCK FOR IMPORT.META
 * Mocking import.meta.env for the Jest/Node.js environment.
 * Vite uses import.meta.env to expose environment variables, but this is not
 * standard in Node.js where Jest runs. This mock makes the variables
 * available to modules like `environment.ts` during testing.
 */
Object.defineProperty(global, 'import.meta', {
  value: {
    env: {
      VITE_API_URL: 'http://localhost:3000/api/v1', // Use a consistent mock URL for all tests
      VITE_APP_NAME: 'WayrApp Creator Tool [Test]',
      VITE_ENABLE_MSW: 'true', // MSW should be enabled for tests
      VITE_LOG_LEVEL: 'warn',
      DEV: true,
      PROD: false,
      // Add any other environment variables your application code might access
    },
  },
  writable: true, // Allows for tests to override this mock if needed
});

/**
 * BroadcastChannel polyfill for MSW
 * MSW requires BroadcastChannel which is not available in Node.js
 */
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(public name: string) {}
    postMessage(message: any) {}
    addEventListener(type: string, listener: any) {}
    removeEventListener(type: string, listener: any) {}
    close() {}
  } as any;
}