/**
 * Test Setup File for Jest
 * Enhanced to work with MSW and modern testing environment
 * Note: import.meta mock is now in jest-setup.ts which runs before module imports
 */

// --- PHASE 1: CRITICAL POLYFILLS BEFORE ANYTHING ELSE ---

import 'whatwg-fetch'; // Polyfill for fetch/Response/Request

// Polyfills for TextEncoder/TextDecoder in test environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Polyfill for TransformStream (needed by MSW)
if (typeof global.TransformStream === 'undefined') {
  const { TransformStream } = require('stream/web');
  global.TransformStream = TransformStream;
}

// Polyfill for ReadableStream (needed by MSW)
if (typeof global.ReadableStream === 'undefined') {
  const { ReadableStream } = require('stream/web');
  global.ReadableStream = ReadableStream;
}

// Polyfill for WritableStream (needed by MSW)
if (typeof global.WritableStream === 'undefined') {
  const { WritableStream } = require('stream/web');
  global.WritableStream = WritableStream;
}

// Polyfill for BroadcastChannel (needed by MSW)
if (typeof global.BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor(public name: string) {}
    postMessage() {}
    addEventListener() {}
    removeEventListener() {}
    close() {}
  } as any;
}

// --- PHASE 2: IMPORT TESTING LIBRARIES ---

import '@testing-library/jest-dom';

// --- PHASE 2.5: INITIALIZE I18N FOR TESTS ---
import './i18n'; // Initialize i18n before any tests run

// --- PHASE 3: BROWSER API MOCKS ---

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});



// --- PHASE 4: MSW SETUP (CONDITIONAL) ---

// Only set up MSW if we're not testing components that don't need it
// This prevents MSW from interfering with tests that don't need mocking
let server: any = null;

// Check if we need MSW for this test
const needsMSW = process.env['JEST_WORKER_ID'] !== undefined &&
  !process.argv.some(arg => arg.includes('ProtectedRoute'));

// Always enable MSW for E2E tests
const isE2ETest = process.argv.some(arg => arg.includes('e2e.test'));

if (needsMSW || isE2ETest) {
  try {
    const { setupServer } = require('msw/node');
    const { handlers } = require('../mocks/handlers');

    server = setupServer(...handlers);

    beforeAll(() => {
      server.listen({ onUnhandledRequest: 'warn' });
    });

    afterEach(() => {
      server.resetHandlers();
    });

    afterAll(() => {
      server.close();
    });
  } catch (error: any) {
    console.warn('MSW setup failed, continuing without mocking:', error?.message || error);
  }
}