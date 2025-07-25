import { useState, useCallback, useRef, useEffect } from 'react';

interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number;
}

interface UseLoadingStateOptions {
  initialLoading?: boolean;
  defaultMessage?: string;
  timeout?: number; // Auto-clear loading after timeout
}

/**
 * Hook for managing loading states with progress tracking and timeout
 */
export const useLoadingState = (options: UseLoadingStateOptions = {}) => {
  const {
    initialLoading = false,
    defaultMessage = 'Loading...',
    timeout,
  } = options;

  const [state, setState] = useState<LoadingState>({
    isLoading: initialLoading,
    ...(initialLoading && { loadingMessage: defaultMessage }),
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const startLoading = useCallback((message?: string, progress?: number) => {
    setState({
      isLoading: true,
      loadingMessage: message || defaultMessage,
      ...(progress !== undefined && { progress }),
    });

    // Set timeout if specified
    if (timeout) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({ ...prev, isLoading: false }));
      }, timeout);
    }
  }, [defaultMessage, timeout]);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setState(prev => ({
      ...prev,
      progress,
      ...(message && { loadingMessage: message }),
    }));
  }, []);

  const updateMessage = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      loadingMessage: message,
    }));
  }, []);

  const stopLoading = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setState({
      isLoading: false,
    });
  }, []);

  const withLoading = useCallback(async <T>(
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    startLoading(message);
    try {
      const result = await operation();
      stopLoading();
      return result;
    } catch (error) {
      stopLoading();
      throw error;
    }
  }, [startLoading, stopLoading]);

  return {
    ...state,
    startLoading,
    stopLoading,
    updateProgress,
    updateMessage,
    withLoading,
  };
};

/**
 * Hook for managing multiple loading states (e.g., different operations)
 */
export const useMultipleLoadingStates = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});

  const setLoading = useCallback((key: string, isLoading: boolean, message?: string, progress?: number) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        isLoading,
        ...(message && { loadingMessage: message }),
        ...(progress !== undefined && { progress }),
      },
    }));
  }, []);

  const startLoading = useCallback((key: string, message?: string, progress?: number) => {
    setLoading(key, true, message, progress);
  }, [setLoading]);

  const stopLoading = useCallback((key: string) => {
    setLoading(key, false);
  }, [setLoading]);

  const updateProgress = useCallback((key: string, progress: number, message?: string) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        progress,
        ...(message && { loadingMessage: message }),
      },
    }));
  }, []);

  const isAnyLoading = Object.values(loadingStates).some(state => state.isLoading);
  const getLoadingState = (key: string) => loadingStates[key] || { isLoading: false };

  const withLoading = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>,
    message?: string
  ): Promise<T> => {
    startLoading(key, message);
    try {
      const result = await operation();
      stopLoading(key);
      return result;
    } catch (error) {
      stopLoading(key);
      throw error;
    }
  }, [startLoading, stopLoading]);

  return {
    loadingStates,
    isAnyLoading,
    getLoadingState,
    startLoading,
    stopLoading,
    updateProgress,
    withLoading,
  };
};

export default useLoadingState;