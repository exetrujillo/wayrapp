/**
 * Jest setup file that runs before all other setup
 * This handles critical mocks that need to be in place before modules load
 */

// Mock import.meta for Jest environment
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_URL: 'http://localhost:3000',
      },
    },
  },
  writable: true,
});

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