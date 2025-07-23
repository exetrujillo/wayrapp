/**
 * Jest Configuration for Frontend Creator (v3 - VITE-JEST)
 * This configuration delegates transforms to Vite for consistency.
 */
module.exports = {
  // Entorno de navegador simulado
  testEnvironment: 'jsdom',

  // Carga nuestro archivo de setup antes de cada test
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],

  // --- LA MAGIA ESTÁ AQUÍ ---
  // Usa vite-jest para transformar archivos TS/TSX.
  // Le pasa la responsabilidad a Vite, que sabe cómo hacerlo.
  transform: {
    '^.+\\.(ts|tsx)$': 'vite-jest',
  },

  // Mapeadores para importaciones de CSS, etc.
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};