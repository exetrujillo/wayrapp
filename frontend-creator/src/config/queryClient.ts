/**
 * TanStack Query Client Configuration
 * 
 * Configures the QueryClient with optimal settings for caching, error handling,
 * and retry policies tailored for the WayrApp Creator Tool.
 */

import { QueryClient } from '@tanstack/react-query';
import { env } from './environment';

/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
    constructor(
        message: string,
        public status?: number,
        public code?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

/**
 * Determines if an error should trigger a retry
 * 
 * @param failureCount - Number of previous failures
 * @param error - The error that occurred
 * @returns Whether to retry the request
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
    // Don't retry after 3 attempts
    if (failureCount >= 3) {
        return false;
    }

    // Handle ApiError instances
    if (error instanceof ApiError) {
        // Don't retry on client errors (4xx) except 401 (unauthorized)
        if (error.status && error.status >= 400 && error.status < 500) {
            return error.status === 401; // Retry 401 for token refresh
        }

        // Retry on server errors (5xx) and network errors
        return true;
    }

    // Handle generic errors (network issues, etc.)
    if (error instanceof Error) {
        // Retry on network errors
        return error.message.includes('fetch') ||
            error.message.includes('network') ||
            error.message.includes('timeout');
    }

    // Default to retry for unknown errors
    return true;
}

/**
 * Handles query errors with appropriate logging and transformation
 * 
 * @param error - The error that occurred
 */
export function handleQueryError(error: unknown): void {
    if (env.isDevelopment) {
        console.error('Query Error:', error);
    }

    // Transform network errors into user-friendly messages
    if (error instanceof Error && error.message.includes('fetch')) {
        throw new ApiError('Network error. Please check your connection and try again.');
    }

    // Re-throw ApiError instances as-is
    if (error instanceof ApiError) {
        throw error;
    }

    // Transform unknown errors
    throw new ApiError('An unexpected error occurred. Please try again.');
}

/**
 * Creates and configures a QueryClient instance with optimal settings
 * 
 * @returns Configured QueryClient instance
 */
export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // Cache data for 5 minutes before considering it stale
                staleTime: 5 * 60 * 1000,

                // Keep data in cache for 10 minutes after component unmounts
                gcTime: 10 * 60 * 1000, // Previously cacheTime in v4

                // Retry logic with custom function
                retry: shouldRetry,

                // Retry delay with exponential backoff
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

                // Don't refetch on window focus in production to avoid unnecessary requests
                refetchOnWindowFocus: env.isDevelopment,

                // Refetch on reconnect to ensure data freshness
                refetchOnReconnect: true,

                // Don't refetch on mount if data is fresh
                refetchOnMount: true,

                // Error handling
                throwOnError: false,

                // Network mode - fail fast on network errors
                networkMode: 'online',
            },
            mutations: {
                // Don't retry mutations by default to avoid duplicate operations
                retry: false,

                // Retry delay for mutations (if retry is enabled)
                retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

                // Error handling for mutations
                throwOnError: false,

                // Network mode for mutations
                networkMode: 'online',
            },
        },
    });
}

/**
 * Pre-configured QueryClient instance
 * 
 * Use this instance throughout the application for consistent query behavior.
 * 
 * @example
 * ```typescript
 * import { queryClient } from '@/config/queryClient';
 * import { QueryClientProvider } from '@tanstack/react-query';
 * 
 * function App() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <YourApp />
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */
export const queryClient = createQueryClient();

/**
 * Query key factory for consistent key generation
 * 
 * Provides a centralized way to generate query keys to avoid conflicts
 * and ensure proper cache invalidation.
 */
export const queryKeys = {
    // Authentication keys
    auth: {
        me: ['auth', 'me'] as const,
        profile: ['auth', 'profile'] as const,
    },

    // Course keys
    courses: {
        all: ['courses'] as const,
        list: (params?: Record<string, unknown>) => ['courses', 'list', params] as const,
        detail: (id: string) => ['courses', 'detail', id] as const,
        exercises: (courseId: string) => ['courses', courseId, 'exercises'] as const,
    },

    // Exercise keys
    exercises: {
        all: ['exercises'] as const,
        list: (params?: Record<string, unknown>) => ['exercises', 'list', params] as const,
        detail: (id: string) => ['exercises', 'detail', id] as const,
    },

    // Level keys
    levels: {
        all: ['levels'] as const,
        list: (courseId: string) => ['levels', 'list', courseId] as const,
        detail: (id: string) => ['levels', 'detail', id] as const,
    },

    // Section keys
    sections: {
        all: ['sections'] as const,
        list: (levelId: string) => ['sections', 'list', levelId] as const,
        detail: (id: string) => ['sections', 'detail', id] as const,
    },

    // Module keys
    modules: {
        all: ['modules'] as const,
        list: (sectionId: string) => ['modules', 'list', sectionId] as const,
        detail: (id: string) => ['modules', 'detail', id] as const,
    },
} as const;

/**
 * Utility functions for query management
 */
export const queryUtils = {
    /**
     * Invalidates all queries for a specific entity type
     */
    invalidateEntity: (entityType: 'courses' | 'exercises' | 'levels' | 'sections' | 'modules') => {
        return queryClient.invalidateQueries({
            queryKey: queryKeys[entityType].all,
        });
    },

    /**
     * Removes all queries for a specific entity type from cache
     */
    removeEntity: (entityType: 'courses' | 'exercises' | 'levels' | 'sections' | 'modules') => {
        return queryClient.removeQueries({
            queryKey: queryKeys[entityType].all,
        });
    },

    /**
     * Prefetches data for better user experience
     */
    prefetch: <T>(
        queryKey: readonly unknown[],
        queryFn: () => Promise<T>,
        options?: { staleTime?: number }
    ) => {
        return queryClient.prefetchQuery({
            queryKey,
            queryFn,
            staleTime: options?.staleTime || 5 * 60 * 1000,
        });
    },
};