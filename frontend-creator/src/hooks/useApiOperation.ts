import React, { useState, useCallback } from 'react';
import { useEnhancedErrorHandling } from './useEnhancedErrorHandling';
import { useLoadingState } from '../components/ui/LoadingStateProvider';
import { useApiErrorHandler } from '../contexts/ErrorContext';

interface ApiOperationOptions {
  enableAutoRetry?: boolean;
  maxRetries?: number;
  showLoadingToast?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  loadingMessage?: string;
  successMessage?: string;
  context?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  onFinally?: () => void;
}

interface ApiOperationState {
  isLoading: boolean;
  error: any;
  data: any;
  hasError: boolean;
  canRetry: boolean;
  retryCount: number;
}

/**
 * Comprehensive hook for managing API operations with loading states, error handling, and retry logic
 */
export const useApiOperation = <T = any>(options: ApiOperationOptions = {}) => {
  const {
    enableAutoRetry = false,
    maxRetries = 3,
    showLoadingToast = false,
    showSuccessToast = true,
    showErrorToast = true,
    loadingMessage = 'Processing...',
    successMessage,
    context,
    onSuccess,
    onError,
    onFinally,
  } = options;

  const [state, setState] = useState<ApiOperationState>({
    isLoading: false,
    error: null,
    data: null,
    hasError: false,
    canRetry: true,
    retryCount: 0,
  });

  const loadingState = useLoadingState();
  const { handleError, handleSuccess } = useApiErrorHandler();
  const errorHandling = useEnhancedErrorHandling({
    maxRetries,
    enableAutoRetry,
    ...(context && { context }),
    onError: (error, attempt) => {
      setState(prev => ({
        ...prev,
        error,
        hasError: true,
        retryCount: attempt,
        canRetry: attempt < maxRetries,
      }));
      
      if (showErrorToast) {
        handleError(error, () => retry(), context);
      }
      
      if (onError) {
        onError(error);
      }
    },
    onSuccess: (result, attempt) => {
      setState(prev => ({
        ...prev,
        data: result,
        error: null,
        hasError: false,
        retryCount: attempt,
      }));
      
      if (showSuccessToast && successMessage) {
        handleSuccess(successMessage);
      }
      
      if (onSuccess) {
        onSuccess(result);
      }
    },
  });

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      hasError: false,
    }));

    let loadingOperationId: string | undefined;

    try {
      // Start loading state
      if (showLoadingToast) {
        loadingOperationId = loadingState.startLoading(loadingMessage, {
          priority: 'normal',
          cancellable: false,
        });
      }

      // Execute operation with error handling
      const result = await errorHandling.executeWithErrorHandling(operation, showLoadingToast);
      
      setState(prev => ({
        ...prev,
        data: result,
        isLoading: false,
        error: null,
        hasError: false,
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error,
        hasError: true,
      }));
      
      throw error;
    } finally {
      // Stop loading state
      if (loadingOperationId) {
        loadingState.stopLoading(loadingOperationId);
      }
      
      if (onFinally) {
        onFinally();
      }
    }
  }, [
    errorHandling,
    loadingState,
    showLoadingToast,
    loadingMessage,
    onFinally,
  ]);

  const retry = useCallback(async () => {
    if (!errorHandling.canRetry) {
      return;
    }

    try {
      await errorHandling.retry();
    } catch (error) {
      // Error is already handled by errorHandling
    }
  }, [errorHandling]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
      hasError: false,
      canRetry: true,
      retryCount: 0,
    });
    
    errorHandling.clearError();
  }, [errorHandling]);

  const mutate = useCallback((newData: T) => {
    setState(prev => ({
      ...prev,
      data: newData,
      error: null,
      hasError: false,
    }));
  }, []);

  return {
    // State
    ...state,
    
    // Enhanced error state
    isNetworkError: errorHandling.isNetworkError,
    isRecoverableError: errorHandling.error ? errorHandling.isRecoverableError(errorHandling.error) : false,
    errorMessage: errorHandling.getErrorMessage(),
    isWaitingForRetry: errorHandling.isWaitingForRetry,
    nextRetryIn: errorHandling.nextRetryIn,
    
    // Actions
    execute,
    retry,
    reset,
    mutate,
    
    // Utilities
    clearError: errorHandling.clearError,
  };
};

/**
 * Hook for managing multiple API operations with shared loading and error states
 */
export const useApiOperations = (operations: Record<string, ApiOperationOptions> = {}) => {
  const [globalState, setGlobalState] = useState({
    isLoading: false,
    hasError: false,
    errors: {} as Record<string, any>,
  });

  const operationHooks = Object.keys(operations).reduce((acc, key) => {
    acc[key] = useApiOperation({
      ...operations[key],
      onError: (error) => {
        setGlobalState(prev => ({
          ...prev,
          hasError: true,
          errors: { ...prev.errors, [key]: error },
        }));
        
        if (operations[key]?.onError) {
          operations[key].onError!(error);
        }
      },
      onSuccess: (result) => {
        setGlobalState(prev => ({
          ...prev,
          errors: { ...prev.errors, [key]: null },
        }));
        
        if (operations[key]?.onSuccess) {
          operations[key].onSuccess!(result);
        }
      },
    });
    
    return acc;
  }, {} as Record<string, ReturnType<typeof useApiOperation>>);

  // Update global loading state
  const isAnyLoading = Object.values(operationHooks).some(hook => hook.isLoading);
  const hasAnyError = Object.values(operationHooks).some(hook => hook.hasError);

  React.useEffect(() => {
    setGlobalState(prev => ({
      ...prev,
      isLoading: isAnyLoading,
      hasError: hasAnyError,
    }));
  }, [isAnyLoading, hasAnyError]);

  const retryAll = useCallback(async () => {
    const retryPromises = Object.values(operationHooks)
      .filter(hook => hook.hasError && hook.canRetry)
      .map(hook => hook.retry());
    
    await Promise.allSettled(retryPromises);
  }, [operationHooks]);

  const resetAll = useCallback(() => {
    Object.values(operationHooks).forEach(hook => hook.reset());
    setGlobalState({
      isLoading: false,
      hasError: false,
      errors: {},
    });
  }, [operationHooks]);

  return {
    // Global state
    ...globalState,
    
    // Individual operations
    operations: operationHooks,
    
    // Global actions
    retryAll,
    resetAll,
  };
};

/**
 * Hook for wrapping existing TanStack Query hooks with enhanced error handling
 */
export const useEnhancedQuery = <T = any>(
  queryResult: any,
  options: ApiOperationOptions = {}
) => {
  const { error, refetch } = queryResult;
  
  const apiOperation = useApiOperation<T>({
    ...options,
    onError: (error) => {
      if (options.onError) {
        options.onError(error);
      }
    },
  });

  // Sync query state with API operation state
  React.useEffect(() => {
    if (error && !apiOperation.hasError) {
      apiOperation.execute(() => Promise.reject(error));
    }
  }, [error, apiOperation]);

  const enhancedRefetch = useCallback(async () => {
    try {
      const result = await apiOperation.execute(async () => {
        const refetchResult = await refetch();
        return refetchResult.data;
      });
      return { data: result };
    } catch (error) {
      return { error };
    }
  }, [apiOperation, refetch]);

  return {
    // Original query result
    ...queryResult,
    
    // Enhanced error handling
    hasError: !!error || apiOperation.hasError,
    errorMessage: apiOperation.errorMessage,
    isNetworkError: apiOperation.isNetworkError,
    canRetry: apiOperation.canRetry,
    retryCount: apiOperation.retryCount,
    
    // Enhanced actions
    refetch: enhancedRefetch,
    retry: apiOperation.retry,
    reset: apiOperation.reset,
  };
};

export default useApiOperation;