import { apiClient } from './api';

interface ErrorRecoveryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: any) => void;
  onSuccess?: (result: any, attempts: number) => void;
  onFailure?: (error: any, attempts: number) => void;
}

interface RecoveryStrategy {
  canRecover: (error: any) => boolean;
  recover: (error: any, context?: any) => Promise<any>;
  priority: number;
}

/**
 * Service for handling error recovery across the application
 * Provides centralized error recovery strategies and retry logic
 */
class ErrorRecoveryService {
  private recoveryStrategies: RecoveryStrategy[] = [];
  private defaultOptions: Required<ErrorRecoveryOptions> = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableStatuses: [0, 408, 429, 500, 502, 503, 504],
    onRetry: () => {},
    onSuccess: () => {},
    onFailure: () => {},
  };

  constructor() {
    this.initializeDefaultStrategies();
  }

  /**
   * Initialize default recovery strategies
   */
  private initializeDefaultStrategies() {
    // Network connectivity recovery
    this.addRecoveryStrategy({
      canRecover: (error) => this.isNetworkError(error) && !navigator.onLine,
      recover: async () => {
        // Wait for network to come back online
        return new Promise((resolve, reject) => {
          const checkConnection = () => {
            if (navigator.onLine) {
              window.removeEventListener('online', checkConnection);
              resolve(true);
            }
          };

          window.addEventListener('online', checkConnection);
          
          // Timeout after 30 seconds
          setTimeout(() => {
            window.removeEventListener('online', checkConnection);
            reject(new Error('Network recovery timeout'));
          }, 30000);
        });
      },
      priority: 1,
    });

    // Token refresh recovery
    this.addRecoveryStrategy({
      canRecover: (error) => error?.status === 401,
      recover: async () => {
        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          // Try to refresh the token
          const response = await apiClient.post('/auth/refresh', { refreshToken });
          const responseData = response as any;
          const { accessToken } = responseData.data.tokens;

          // Update the token in localStorage
          localStorage.setItem('access_token', accessToken);

          return { tokenRefreshed: true };
        } catch (refreshError) {
          // If refresh fails, clear auth data and redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth_user');
          
          // Redirect to login page
          window.location.href = '/login';
          
          throw new Error('Authentication failed - redirecting to login');
        }
      },
      priority: 2,
    });

    // Rate limiting recovery
    this.addRecoveryStrategy({
      canRecover: (error) => error?.status === 429,
      recover: async (error) => {
        // Extract retry-after header if available
        const retryAfter = error?.headers?.['retry-after'];
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000;
        
        // Wait for the specified delay
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return { rateLimitRecovered: true };
      },
      priority: 3,
    });

    // Server error recovery with exponential backoff
    this.addRecoveryStrategy({
      canRecover: (error) => error?.status >= 500,
      recover: async (_, context) => {
        const attempt = context?.attempt || 1;
        const delay = Math.min(
          this.defaultOptions.baseDelay * Math.pow(this.defaultOptions.backoffMultiplier, attempt - 1),
          this.defaultOptions.maxDelay
        );
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.1 * delay;
        const finalDelay = delay + jitter;
        
        await new Promise(resolve => setTimeout(resolve, finalDelay));
        
        return { serverErrorRecovered: true };
      },
      priority: 4,
    });
  }

  /**
   * Add a custom recovery strategy
   */
  addRecoveryStrategy(strategy: RecoveryStrategy) {
    this.recoveryStrategies.push(strategy);
    // Sort by priority (lower number = higher priority)
    this.recoveryStrategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Remove a recovery strategy
   */
  removeRecoveryStrategy(predicate: (strategy: RecoveryStrategy) => boolean) {
    this.recoveryStrategies = this.recoveryStrategies.filter(strategy => !predicate(strategy));
  }

  /**
   * Execute operation with automatic error recovery
   */
  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    options: ErrorRecoveryOptions = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: any;
    let attempts = 0;

    while (attempts <= opts.maxRetries) {
      try {
        const result = await operation();
        
        if (attempts > 0 && opts.onSuccess) {
          opts.onSuccess(result, attempts);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        attempts++;

        // If we've reached max retries, don't try to recover
        if (attempts > opts.maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error, opts.retryableStatuses)) {
          break;
        }

        // Try to recover using available strategies
        const recovered = await this.tryRecovery(error, { attempt: attempts });
        
        if (!recovered) {
          // If no recovery strategy worked, wait with exponential backoff
          const delay = Math.min(
            opts.baseDelay * Math.pow(opts.backoffMultiplier, attempts - 1),
            opts.maxDelay
          );
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        if (opts.onRetry) {
          opts.onRetry(attempts, error);
        }
      }
    }

    // All retries failed
    if (opts.onFailure) {
      opts.onFailure(lastError, attempts);
    }

    throw lastError;
  }

  /**
   * Try to recover from an error using available strategies
   */
  private async tryRecovery(error: any, context?: any): Promise<boolean> {
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canRecover(error)) {
        try {
          await strategy.recover(error, context);
          return true;
        } catch (recoveryError) {
          console.warn('Recovery strategy failed:', recoveryError);
          // Continue to next strategy
        }
      }
    }
    
    return false;
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any, retryableStatuses: number[]): boolean {
    // Network errors are always retryable
    if (this.isNetworkError(error)) {
      return true;
    }

    // Check status code
    if (error?.status && retryableStatuses.includes(error.status)) {
      return true;
    }

    // Check error type
    if (error?.code === 'NETWORK_ERROR' || error?.code === 'TIMEOUT') {
      return true;
    }

    return false;
  }

  /**
   * Check if an error is network-related
   */
  private isNetworkError(error: any): boolean {
    return (
      error?.status === 0 ||
      error?.status >= 500 ||
      error?.status === 408 ||
      error?.status === 429 ||
      error?.message?.toLowerCase().includes('network') ||
      error?.message?.toLowerCase().includes('timeout') ||
      error?.message?.toLowerCase().includes('fetch') ||
      error?.code === 'NETWORK_ERROR' ||
      !navigator.onLine
    );
  }

  /**
   * Get error recovery suggestions for users
   */
  getRecoverySuggestions(error: any): string[] {
    const suggestions: string[] = [];

    if (!navigator.onLine) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try again when you\'re back online');
    } else if (this.isNetworkError(error)) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
      suggestions.push('Wait a moment and try again');
    } else if (error?.status === 401) {
      suggestions.push('Please log in again');
      suggestions.push('Your session may have expired');
    } else if (error?.status === 403) {
      suggestions.push('You may not have permission for this action');
      suggestions.push('Contact support if you believe this is an error');
    } else if (error?.status === 404) {
      suggestions.push('The requested resource was not found');
      suggestions.push('Check the URL and try again');
    } else if (error?.status === 429) {
      suggestions.push('You\'re making requests too quickly');
      suggestions.push('Wait a moment before trying again');
    } else if (error?.status >= 500) {
      suggestions.push('The server is experiencing issues');
      suggestions.push('Try again in a few minutes');
      suggestions.push('Contact support if the problem persists');
    } else {
      suggestions.push('Try refreshing the page');
      suggestions.push('Check your input and try again');
      suggestions.push('Contact support if the problem persists');
    }

    return suggestions;
  }

  /**
   * Create a wrapper function that automatically handles errors
   */
  wrapWithRecovery<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: ErrorRecoveryOptions = {}
  ) {
    return async (...args: T): Promise<R> => {
      return this.executeWithRecovery(() => fn(...args), options);
    };
  }

  /**
   * Batch execute multiple operations with recovery
   */
  async executeBatchWithRecovery<T>(
    operations: (() => Promise<T>)[],
    options: ErrorRecoveryOptions & { 
      failFast?: boolean;
      concurrency?: number;
    } = {}
  ): Promise<Array<{ success: boolean; result?: T; error?: any }>> {
    const { failFast = false, concurrency = 3, ...recoveryOptions } = options;
    const results: Array<{ success: boolean; result?: T; error?: any }> = [];

    // Execute operations in batches based on concurrency limit
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (operation) => {
        try {
          const result = await this.executeWithRecovery(operation, recoveryOptions);
          return { success: true, result };
        } catch (error) {
          if (failFast) {
            throw error;
          }
          return { success: false, error };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }
}

// Create and export service instance
export const errorRecoveryService = new ErrorRecoveryService();

export default errorRecoveryService;