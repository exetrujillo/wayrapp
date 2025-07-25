import { useCallback } from 'react';
import { useErrorHandling } from './useErrorHandling';
import { useErrorRecovery } from './useErrorRecovery';
import { useNetworkStatus } from './useNetworkStatus';
import { useApiErrorHandler } from '../contexts/ErrorContext';

interface EnhancedErrorHandlingOptions {
  maxRetries?: number;
  enableAutoRetry?: boolean;
  retryOnNetworkReconnect?: boolean;
  onError?: (error: any, attempt: number) => void;
  onSuccess?: (result: any, attempt: number) => void;
  onMaxRetriesReached?: (error: any) => void;
  context?: string;
}

/**
 * Enhanced error handling hook that combines all error handling capabilities
 * Provides comprehensive error handling with network awareness, retry logic, and user feedback
 */
export const useEnhancedErrorHandling = (options: EnhancedErrorHandlingOptions = {}) => {
  const {
    maxRetries = 3,
    enableAutoRetry = true,
    retryOnNetworkReconnect = true,
    onError,
    onSuccess,
    onMaxRetriesReached,
    context,
  } = options;

  const { isOnline } = useNetworkStatus();
  const { handleError: handleApiError, isNetworkError } = useApiErrorHandler();
  
  const basicErrorHandling = useErrorHandling({
    maxRetries,
    ...(onMaxRetriesReached && { onMaxRetriesReached }),
  });

  const errorRecovery = useErrorRecovery({
    maxRetries,
    retryOnNetworkReconnect,
    ...(onError && { onError }),
    ...(onSuccess && { onSuccess }),
    ...(onMaxRetriesReached && { onMaxRetriesReached }),
  });

  // Enhanced error handler that combines all capabilities
  const handleError = useCallback((error: any, showToast = true) => {
    // Log error with context
    console.error(`Error${context ? ` (${context})` : ''}:`, error);

    // Set error in basic error handling
    basicErrorHandling.setError(error);

    // Show toast notification if requested
    if (showToast) {
      handleApiError(error, undefined, context);
    }

    // Additional custom error handling
    if (onError) {
      onError(error, basicErrorHandling.retryCount + 1);
    }
  }, [basicErrorHandling, handleApiError, onError, context]);

  // Enhanced retry function
  const retry = useCallback(async (operation?: () => Promise<any>) => {
    if (!basicErrorHandling.canRetry) {
      return;
    }

    try {
      let result;
      
      if (enableAutoRetry && operation) {
        // Use error recovery for automatic retry with backoff
        result = await errorRecovery.executeWithRecovery(operation);
      } else {
        // Use basic retry
        await basicErrorHandling.retry(operation);
        result = operation ? await operation() : undefined;
      }

      if (onSuccess) {
        onSuccess(result, basicErrorHandling.retryCount);
      }

      return result;
    } catch (error) {
      handleError(error, false); // Don't show toast again
      throw error;
    }
  }, [
    basicErrorHandling,
    enableAutoRetry,
    errorRecovery,
    onSuccess,
    handleError,
  ]);

  // Execute operation with comprehensive error handling
  const executeWithErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    showLoadingToast = false
  ): Promise<T> => {
    try {
      basicErrorHandling.clearError();
      
      if (enableAutoRetry) {
        return await errorRecovery.executeWithRecovery(operation);
      } else {
        return await operation();
      }
    } catch (error) {
      handleError(error, !showLoadingToast);
      throw error;
    }
  }, [basicErrorHandling, enableAutoRetry, errorRecovery, handleError]);

  // Check if error is recoverable
  const isRecoverableError = useCallback((error: any): boolean => {
    // Network errors are usually recoverable
    if (isNetworkError(error)) {
      return true;
    }

    // Server errors (5xx) are usually recoverable
    if (error?.status >= 500) {
      return true;
    }

    // Timeout errors are recoverable
    if (error?.status === 408 || error?.message?.toLowerCase().includes('timeout')) {
      return true;
    }

    // Rate limiting is recoverable
    if (error?.status === 429) {
      return true;
    }

    // Client errors (4xx) are usually not recoverable, except for auth
    if (error?.status >= 400 && error?.status < 500) {
      return error?.status === 401; // Auth errors can be recovered with token refresh
    }

    return false;
  }, [isNetworkError]);

  // Get user-friendly error message
  const getErrorMessage = useCallback((error: any): string => {
    if (!isOnline && isNetworkError(error)) {
      return 'You appear to be offline. Please check your internet connection.';
    }

    if (isNetworkError(error)) {
      return 'Unable to connect to the server. Please check your connection and try again.';
    }

    if (error?.message && typeof error.message === 'string') {
      return error.message;
    }

    if (error?.status) {
      switch (error.status) {
        case 400:
          return 'Invalid request. Please check your input and try again.';
        case 401:
          return 'You are not authorized. Please log in again.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 409:
          return 'There was a conflict with your request. Please try again.';
        case 422:
          return 'The data provided is invalid. Please check your input.';
        case 500:
          return 'Internal server error. Please try again later.';
        case 502:
          return 'Bad gateway. The server is temporarily unavailable.';
        case 503:
          return 'Service unavailable. Please try again later.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }

    return 'An unknown error occurred. Please try again.';
  }, [isOnline, isNetworkError]);

  return {
    // Error state
    error: basicErrorHandling.error,
    hasError: !!basicErrorHandling.error,
    retryCount: basicErrorHandling.retryCount,
    canRetry: basicErrorHandling.canRetry,
    isRetrying: basicErrorHandling.isRetrying,
    
    // Recovery state
    isWaitingForRetry: errorRecovery.isWaitingForRetry,
    nextRetryIn: errorRecovery.nextRetryIn,
    
    // Network state
    isOnline,
    isNetworkError: basicErrorHandling.error ? isNetworkError(basicErrorHandling.error) : false,
    
    // Actions
    handleError,
    retry,
    clearError: basicErrorHandling.clearError,
    executeWithErrorHandling,
    
    // Utilities
    isRecoverableError,
    getErrorMessage: () => basicErrorHandling.error ? getErrorMessage(basicErrorHandling.error) : '',
    
    // Recovery actions
    manualRetry: errorRecovery.manualRetry,
    resetRecovery: errorRecovery.reset,
  };
};

/**
 * Hook for handling form submission errors with enhanced error handling
 */
export const useFormErrorHandling = (options: EnhancedErrorHandlingOptions = {}) => {
  const enhancedErrorHandling = useEnhancedErrorHandling({
    ...options,
    enableAutoRetry: false, // Forms usually shouldn't auto-retry
    context: options.context || 'form-submission',
  });

  const handleSubmissionError = useCallback((error: any, fieldErrors?: Record<string, string>) => {
    // Handle validation errors differently
    if (error?.status === 422 && error?.details) {
      // Don't show toast for validation errors, let form handle them
      enhancedErrorHandling.handleError(error, false);
      return error.details;
    }

    // Handle other errors normally
    enhancedErrorHandling.handleError(error);
    return fieldErrors || {};
  }, [enhancedErrorHandling]);

  return {
    ...enhancedErrorHandling,
    handleSubmissionError,
  };
};

export default useEnhancedErrorHandling;