import { useState, useCallback } from 'react';

interface ErrorState {
  error: any;
  retryCount: number;
  isRetrying: boolean;
}

interface UseErrorHandlingOptions {
  maxRetries?: number;
  onError?: (error: any) => void;
  onRetry?: () => void;
  onMaxRetriesReached?: (error: any) => void;
}

/**
 * Hook for managing error states and retry logic
 * Provides consistent error handling patterns across components
 */
export const useErrorHandling = (options: UseErrorHandlingOptions = {}) => {
  const {
    maxRetries = 3,
    onError,
    onRetry,
    onMaxRetriesReached,
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    retryCount: 0,
    isRetrying: false,
  });

  const setError = useCallback((error: any) => {
    setErrorState(prev => ({
      ...prev,
      error,
    }));

    if (onError) {
      onError(error);
    }
  }, [onError]);

  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      retryCount: 0,
      isRetrying: false,
    });
  }, []);

  const retry = useCallback(async (retryFn?: () => Promise<void> | void) => {
    if (errorState.retryCount >= maxRetries) {
      if (onMaxRetriesReached) {
        onMaxRetriesReached(errorState.error);
      }
      return;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      if (retryFn) {
        await retryFn();
      }
      
      if (onRetry) {
        onRetry();
      }

      // Clear error on successful retry
      clearError();
    } catch (error) {
      setErrorState(prev => ({
        ...prev,
        error,
        isRetrying: false,
      }));

      if (onError) {
        onError(error);
      }
    }
  }, [errorState.retryCount, errorState.error, maxRetries, onRetry, onError, onMaxRetriesReached, clearError]);

  const canRetry = errorState.retryCount < maxRetries;

  return {
    error: errorState.error,
    retryCount: errorState.retryCount,
    isRetrying: errorState.isRetrying,
    canRetry,
    setError,
    clearError,
    retry,
  };
};

interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  maxRetries?: number;
}

/**
 * Hook for managing async operations with loading and error states
 */
export const useAsyncOperation = (options: UseAsyncOperationOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const errorHandling = useErrorHandling({
    ...(options.maxRetries !== undefined && { maxRetries: options.maxRetries }),
    ...(options.onError && { onError: options.onError }),
  });

  const execute = useCallback(async (operation: () => Promise<any>) => {
    setIsLoading(true);
    errorHandling.clearError();

    try {
      const result = await operation();
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error) {
      errorHandling.setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [errorHandling, options.onSuccess]);

  const retry = useCallback(() => {
    return errorHandling.retry();
  }, [errorHandling]);

  return {
    isLoading,
    error: errorHandling.error,
    retryCount: errorHandling.retryCount,
    isRetrying: errorHandling.isRetrying,
    canRetry: errorHandling.canRetry,
    execute,
    retry,
    clearError: errorHandling.clearError,
  };
};

export default useErrorHandling;