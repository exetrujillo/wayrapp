/**
 * Environment Configuration Utility
 * 
 * Centralizes access to environment variables with type safety and validation.
 * Provides a single source of truth for all environment-based configuration.
 */

interface EnvironmentConfig {
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
 * Validates and parses environment variables into a typed configuration object
 */
function createEnvironmentConfig(): EnvironmentConfig {
    // Handle Jest environment where import.meta might not be available
    let apiUrl: string;
    let appName: string;
    let enableMSW: boolean;
    let logLevel: string;
    let isDevelopment: boolean;
    let isProduction: boolean;

    try {
        // Try to use Vite's import.meta.env
        apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
        appName = import.meta.env.VITE_APP_NAME || 'WayrApp Creator Tool';
        enableMSW = import.meta.env.VITE_ENABLE_MSW === 'true';
        logLevel = import.meta.env.VITE_LOG_LEVEL || 'info';
        isDevelopment = import.meta.env.DEV;
        isProduction = import.meta.env.PROD;
    } catch {
        // Fallback to process.env for Jest environment
        apiUrl = process.env.VITE_API_URL || 'http://localhost:3000/api/v1';
        appName = process.env.VITE_APP_NAME || 'WayrApp Creator Tool';
        enableMSW = process.env.VITE_ENABLE_MSW === 'true';
        logLevel = process.env.VITE_LOG_LEVEL || 'info';
        isDevelopment = process.env.NODE_ENV === 'development';
        isProduction = process.env.NODE_ENV === 'production';
    }

    // Validate required environment variables
    if (!apiUrl) {
        throw new Error('VITE_API_URL environment variable is required');
    }

    // Validate API URL format
    try {
        new URL(apiUrl);
    } catch (error) {
        throw new Error(`Invalid VITE_API_URL format: ${apiUrl}`);
    }

    return {
        apiUrl,
        appName,
        enableMSW,
        logLevel,
        isDevelopment,
        isProduction,
    };
}

/**
 * Environment configuration object
 * 
 * Use this throughout the application to access environment-specific settings.
 * 
 * @example
 * ```typescript
 * import { env } from '@/config/environment';
 * 
 * // Use API URL
 * const response = await fetch(`${env.apiUrl}/users`);
 * 
 * // Check if MSW is enabled
 * if (env.enableMSW) {
 *   // Initialize MSW
 * }
 * ```
 */
export const env = createEnvironmentConfig();

/**
 * Type export for environment configuration
 */
export type { EnvironmentConfig };