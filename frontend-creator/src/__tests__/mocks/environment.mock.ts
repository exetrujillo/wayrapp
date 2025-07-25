/**
 * Mock Environment Configuration for Jest Tests
 * This replaces the real environment.ts module during testing
 */

export interface EnvironmentConfig {
    /** API base URL for backend services */
    apiUrl: string;
    /** Application name displayed in UI */
    appName: string;
    /** Whether Mock Service Worker (MSW) is enabled */
    enableMSW: boolean;
    /** Logging level for development */
    logLevel: string;
    /** Whether the app is running in development mode */
    isDevelopment: boolean;
    /** Whether the app is running in production mode */
    isProduction: boolean;
}

/**
 * Mock environment configuration for tests
 */
export const env: EnvironmentConfig = {
    apiUrl: 'http://localhost:3000/api/v1',
    appName: 'WayrApp Creator Tool [Test]',
    enableMSW: true,
    logLevel: 'warn',
    isDevelopment: true,
    isProduction: false,
};