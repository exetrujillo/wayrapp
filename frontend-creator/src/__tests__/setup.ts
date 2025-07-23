/**
 * Test Setup File for Jest (v4 - The Human Fix)
 */

// --- FASE 1: APLICAR POLYFILLS CRÍTICOS ANTES DE CUALQUIER OTRA COSA ---

// El problema: `import { ... } from 'undici'` y `import { ... } from 'msw'`
// necesitan que APIs como 'TextEncoder' y 'Response' existan GLOBALMENTE
// al momento en que son importadas.
// La solución: Ponemos los polyfills en un archivo separado y lo importamos
// PRIMERO en la configuración de Jest.

import 'whatwg-fetch'; // Un polyfill más simple y robusto para fetch/Response/Request
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;


// --- FASE 2: IMPORTAR EL RESTO DESPUÉS DE LOS POLYFILLS ---

import '@testing-library/jest-dom';
import { server } from './mocks/server';
import './i18n';


// --- FASE 3: CICLO DE VIDA DEL SERVIDOR MSW ---

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());


// --- FASE 4: MOCKS ADICIONALES DEL NAVEGADOR ---

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