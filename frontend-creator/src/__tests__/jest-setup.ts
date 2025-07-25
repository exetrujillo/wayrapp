/**
 * Jest setup file that runs before all other setup
 * This handles critical mocks that need to be in place before modules load
 */

// Ensure NODE_ENV is set to test
process.env.NODE_ENV = 'test';

// Set up environment variables for Jest
process.env.VITE_API_URL = 'https://wayrapp.vercel.app/api/v1';
process.env.VITE_APP_NAME = 'WayrApp Creator Tool (Test)';
process.env.VITE_ENABLE_MSW = 'false';
process.env.VITE_LOG_LEVEL = 'debug';

// Mock import.meta for Jest environment
// This needs to be set up before any modules are imported
const mockImportMeta = {
  env: {
    VITE_API_URL: 'https://wayrapp.vercel.app/api/v1',
    VITE_APP_NAME: 'WayrApp Creator Tool (Test)',
    VITE_ENABLE_MSW: 'false',
    VITE_LOG_LEVEL: 'debug',
    DEV: false,
    PROD: false,
  },
};

// Set up import.meta mock on global object
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: mockImportMeta,
  },
  writable: true,
});

// Also set up on global for compatibility
if (typeof global !== 'undefined') {
  Object.defineProperty(global, 'import', {
    value: {
      meta: mockImportMeta,
    },
    writable: true,
  });
}

// Mock BroadcastChannel for MSW
global.BroadcastChannel = class BroadcastChannel {
  constructor(public name: string) {}
  postMessage() {}
  addEventListener() {}
  removeEventListener() {}
  close() {}
} as any;

// Suppress JSDOM navigation errors by overriding console.error
const originalError = console.error;
console.error = (...args: any[]) => {
  // Suppress JSDOM navigation errors
  if (
    args[0] &&
    typeof args[0] === 'object' &&
    args[0].type === 'not implemented' &&
    args[0].message &&
    args[0].message.includes('navigation')
  ) {
    return;
  }
  originalError.apply(console, args);
};

// Mock window.location early to prevent JSDOM navigation errors
delete (window as any).location;
(window as any).location = {
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};