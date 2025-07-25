import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from '../components/ui/Feedback';

interface ErrorContextValue {
  showError: (message: string, options?: ErrorOptions) => void;
  showSuccess: (message: string, options?: SuccessOptions) => void;
  showWarning: (message: string, options?: WarningOptions) => void;
  showInfo: (message: string, options?: InfoOptions) => void;
  clearAllToasts: () => void;
}

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  showIcon?: boolean;
}

interface ErrorOptions extends ToastOptions {
  retryAction?: () => void;
  retryLabel?: string;
}

interface SuccessOptions extends ToastOptions {}
interface WarningOptions extends ToastOptions {}
interface InfoOptions extends ToastOptions {}

interface ToastItem {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  options: ToastOptions;
  retryAction?: () => void;
  retryLabel?: string;
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

interface ErrorProviderProps {
  children: ReactNode;
}

/**
 * Error context provider for global error handling and toast notifications
 */
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((
    type: ToastItem['type'],
    message: string,
    options: ToastOptions = {},
    retryAction?: () => void,
    retryLabel?: string
  ) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 11);
    const toast: ToastItem = {
      id,
      type,
      message,
      options: {
        duration: 5000,
        position: 'top-right',
        showIcon: true,
        ...options,
      },
      ...(retryAction && { retryAction }),
      ...(retryLabel && { retryLabel }),
    };

    setToasts(prev => [...prev, toast]);

    // Auto-remove toast after duration
    if (toast.options.duration && toast.options.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.options.duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showError = useCallback((message: string, options: ErrorOptions = {}) => {
    const { retryAction, retryLabel, ...toastOptions } = options;
    addToast('error', message, toastOptions, retryAction, retryLabel);
  }, [addToast]);

  const showSuccess = useCallback((message: string, options: SuccessOptions = {}) => {
    addToast('success', message, options);
  }, [addToast]);

  const showWarning = useCallback((message: string, options: WarningOptions = {}) => {
    addToast('warning', message, options);
  }, [addToast]);

  const showInfo = useCallback((message: string, options: InfoOptions = {}) => {
    addToast('info', message, options);
  }, [addToast]);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ErrorContextValue = {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    clearAllToasts,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
      
      {/* Render toasts */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            message={toast.message}
            position={toast.options.position || 'top-right'}
            showIcon={toast.options.showIcon ?? true}
            duration={0} // We handle duration manually
            onDismiss={() => removeToast(toast.id)}
            className="pointer-events-auto"
          />
        ))}
      </div>
    </ErrorContext.Provider>
  );
};

/**
 * Hook to use the error context
 */
export const useErrorContext = (): ErrorContextValue => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
};

/**
 * Hook for handling API errors with toast notifications
 */
export const useApiErrorHandler = () => {
  const { showError, showSuccess, showWarning } = useErrorContext();

  const isNetworkError = useCallback((error: any): boolean => {
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
  }, []);

  const getErrorMessage = useCallback((error: any): string => {
    // Handle network errors first
    if (isNetworkError(error)) {
      if (!navigator.onLine) {
        return 'You appear to be offline. Please check your internet connection.';
      }
      if (error?.status === 0 || error?.message?.toLowerCase().includes('network')) {
        return 'Unable to connect to the server. Please check your connection.';
      }
      if (error?.status >= 500) {
        return 'The server is experiencing issues. Please try again in a moment.';
      }
      if (error?.status === 408 || error?.message?.toLowerCase().includes('timeout')) {
        return 'The request timed out. Please try again.';
      }
      if (error?.status === 429) {
        return 'Too many requests. Please wait a moment before trying again.';
      }
    }

    // Handle specific error messages
    if (error?.message && typeof error.message === 'string') {
      return error.message;
    }

    // Handle HTTP status codes
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
          return `Request failed with status ${error.status}`;
      }
    }

    return 'An unexpected error occurred. Please try again.';
  }, [isNetworkError]);

  const handleError = useCallback((error: any, retryAction?: () => void, context?: string) => {
    const message = getErrorMessage(error);
    const isNetwork = isNetworkError(error);
    
    // Log error for debugging
    console.error(`API Error${context ? ` (${context})` : ''}:`, error);

    showError(message, {
      ...(retryAction && { retryAction }),
      retryLabel: isNetwork ? 'Retry Connection' : 'Try Again',
      duration: isNetwork ? 10000 : 8000, // Longer duration for network errors
    });
  }, [showError, getErrorMessage, isNetworkError]);

  const handleSuccess = useCallback((message: string, duration?: number) => {
    showSuccess(message, {
      duration: duration || 4000,
    });
  }, [showSuccess]);

  const handleWarning = useCallback((message: string, duration?: number) => {
    showWarning(message, {
      duration: duration || 6000,
    });
  }, [showWarning]);

  const handleNetworkError = useCallback((error: any, retryAction?: () => void) => {
    if (!navigator.onLine) {
      showWarning('You are currently offline. Some features may not be available.', {
        duration: 0, // Don't auto-dismiss offline warnings
      });
    }
    
    handleError(error, retryAction, 'Network');
  }, [handleError, showWarning]);

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleNetworkError,
    isNetworkError,
    getErrorMessage,
  };
};

export default ErrorProvider;