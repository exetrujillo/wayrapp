import { useState, useCallback, useEffect, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface ErrorRecoveryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryOnNetworkReconnect?: boolean;
  onError?: (error: any, attempt: number) => void;
  onSuccess?: (result: any, attempt: number) => void;
  onMaxRetriesReached?: (error: any) => void;
}

interface ErrorRecoveryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: any;
  nextRetryIn: number;
}

/**
 * Hook for comprehensive error recovery with exponential backoff and network awareness
 */
export const useErrorRecovery = (options: ErrorRecoveryOptions = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    retryOnNetworkReconnect = true,
    onError,
    onSuccess,
    onMaxRetriesReached,
  } = options;

  const { isOnline } = useNetworkStatus();
  const [state, setState] = useState<ErrorRecoveryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    nextRetryIn: 0,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastOperationRef = useRef<(() => Promise<any>) | null>(null);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Auto-retry when network comes back online
  useEffect(() => {
    if (
      isOnline &&
      retryOnNetworkReconnect &&
      state.lastError &&
      !state.isRetrying &&
      state.retryCount < maxRetries &&
      lastOperationRef.current
    ) {
      // Network is back, retry the last failed operation
      executeWithRecovery(lastOperationRef.current);
    }
  }, [isOnline, retryOnNetworkReconnect, state.lastError, state.isRetrying, state.retryCount, maxRetries]);

  const calculateDelay = useCallback((attempt: number): number => {
    const delay = Math.min(baseDelay * Math.pow(backoffMultiplier, attempt), maxDelay);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }, [baseDelay, backoffMultiplier, maxDelay]);

  const startCountdown = useCallback((delayMs: number) => {
    setState(prev => ({ ...prev, nextRetryIn: Math.ceil(delayMs / 1000) }));
    
    countdownIntervalRef.current = setInterval(() => {
      setState(prev => {
        const newCount = prev.nextRetryIn - 1;
        if (newCount <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          return { ...prev, nextRetryIn: 0 };
        }
        return { ...prev, nextRetryIn: newCount };
      });
    }, 1000);
  }, []);

  const executeWithRecovery = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    // Store the operation for potential network reconnect retry
    lastOperationRef.current = operation;

    try {
      // Clear any previous error state when starting a new operation
      if (state.retryCount === 0) {
        setState(prev => ({ ...prev, lastError: null }));
      }

      const result = await operation();
      
      // Success - reset state
      setState({
        isRetrying: false,
        retryCount: 0,
        lastError: null,
        nextRetryIn: 0,
      });

      if (onSuccess) {
        onSuccess(result, state.retryCount);
      }

      return result;
    } catch (error) {
      const newRetryCount = state.retryCount + 1;
      
      setState(prev => ({
        ...prev,
        lastError: error,
        retryCount: newRetryCount,
      }));

      if (onError) {
        onError(error, newRetryCount);
      }

      // Check if we should retry
      if (newRetryCount >= maxRetries) {
        setState(prev => ({ ...prev, isRetrying: false }));
        
        if (onMaxRetriesReached) {
          onMaxRetriesReached(error);
        }
        
        throw error;
      }

      // Don't retry immediately if offline (wait for network reconnect)
      if (!isOnline && retryOnNetworkReconnect) {
        setState(prev => ({ ...prev, isRetrying: false }));
        throw error;
      }

      // Schedule retry with exponential backoff
      const delay = calculateDelay(newRetryCount - 1);
      setState(prev => ({ ...prev, isRetrying: true }));
      startCountdown(delay);

      return new Promise<T>((resolve, reject) => {
        retryTimeoutRef.current = setTimeout(async () => {
          setState(prev => ({ ...prev, isRetrying: false, nextRetryIn: 0 }));
          
          try {
            const result = await executeWithRecovery(operation);
            resolve(result);
          } catch (retryError) {
            reject(retryError);
          }
        }, delay);
      });
    }
  }, [
    state.retryCount,
    maxRetries,
    isOnline,
    retryOnNetworkReconnect,
    calculateDelay,
    startCountdown,
    onError,
    onSuccess,
    onMaxRetriesReached,
  ]);

  const manualRetry = useCallback(async () => {
    if (!lastOperationRef.current || state.isRetrying) {
      return;
    }

    // Clear any pending retry
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setState(prev => ({ ...prev, nextRetryIn: 0 }));
    
    try {
      return await executeWithRecovery(lastOperationRef.current);
    } catch (error) {
      // Error is already handled by executeWithRecovery
      throw error;
    }
  }, [state.isRetrying, executeWithRecovery]);

  const reset = useCallback(() => {
    // Clear timers
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Reset state
    setState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      nextRetryIn: 0,
    });

    // Clear stored operation
    lastOperationRef.current = null;
  }, []);

  const canRetry = state.retryCount < maxRetries && !state.isRetrying;
  const hasError = !!state.lastError;
  const isWaitingForRetry = state.isRetrying && state.nextRetryIn > 0;

  return {
    // State
    ...state,
    canRetry,
    hasError,
    isWaitingForRetry,
    
    // Actions
    executeWithRecovery,
    manualRetry,
    reset,
    
    // Computed values
    maxRetries,
    isNetworkError: state.lastError && (!isOnline || state.lastError?.status === 0 || state.lastError?.status >= 500),
  };
};

/**
 * Hook for wrapping async operations with automatic error recovery
 */
export const useAsyncWithRecovery = <T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  options: ErrorRecoveryOptions = {}
) => {
  const recovery = useErrorRecovery(options);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (...args: T): Promise<R> => {
    setIsLoading(true);
    try {
      const result = await recovery.executeWithRecovery(() => asyncFn(...args));
      return result;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFn, recovery]);

  const retry = useCallback(async (): Promise<R | undefined> => {
    if (!recovery.canRetry) return;
    
    setIsLoading(true);
    try {
      return await recovery.manualRetry();
    } finally {
      setIsLoading(false);
    }
  }, [recovery]);

  return {
    execute,
    retry,
    reset: recovery.reset,
    isLoading,
    error: recovery.lastError,
    retryCount: recovery.retryCount,
    canRetry: recovery.canRetry,
    isRetrying: recovery.isRetrying,
    nextRetryIn: recovery.nextRetryIn,
    isWaitingForRetry: recovery.isWaitingForRetry,
    isNetworkError: recovery.isNetworkError,
  };
};

export default useErrorRecovery;