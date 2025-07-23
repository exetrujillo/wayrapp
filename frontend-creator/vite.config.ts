import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Skip type checking during build
    minify: true,
    sourcemap: false,
  },
  server: {
    port: 5173,
    // Ensure MSW service worker is served correctly
    fs: {
      allow: ['..']
    },
    // Configure headers for service worker
    headers: {
      'Service-Worker-Allowed': '/'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      'wayrapp-shared': path.resolve(__dirname, '../frontend-shared/dist')
    }
  },
  // Ensure service worker is copied to dist during build
  publicDir: 'public',
  // Define environment variables for MSW
  define: {
    // Ensure MSW can detect development mode
    __DEV__: JSON.stringify(true)
  }
});