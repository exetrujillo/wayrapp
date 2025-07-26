// frontend-creator/src/contexts/ErrorContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Toast } from '../components/ui/Feedback';

/**
 * Context value interface for global error handling and toast notification system.
 * 
 * Provides methods for displaying different types of toast notifications throughout
 * the application with consistent styling and behavior.
 */
interface ErrorContextValue {
  /** Display an error toast with optional retry functionality */
  showError: (message: string, options?: ErrorOptions) => void;
  /** Display a success toast notification */
  showSuccess: (message: string, options?: SuccessOptions) => void;
  /** Display a warning toast notification */
  showWarning: (message: string, options?: WarningOptions) => void;
  /** Display an informational toast notification */
  showInfo: (message: string, options?: InfoOptions) => void;
  /** Clear all currently displayed toast notifications */
  clearAllToasts: () => void;
}

/**
 * Base configuration options for toast notifications.
 */
interface ToastOptions {
  /** Duration in milliseconds before auto-dismissal (0 = no auto-dismiss) */
  duration?: number;
  /** Screen position for the toast notification */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Whether to display an icon with the toast */
  showIcon?: boolean;
}

/**
 * Extended options for error toast notifications with retry functionality.
 */
interface ErrorOptions extends ToastOptions {
  /** Function to execute when retry button is clicked */
  retryAction?: () => void;
  /** Custom label for the retry button */
  retryLabel?: string;
}

/** Options for success toast notifications */
interface SuccessOptions extends ToastOptions { }
/** Options for warning toast notifications */
interface WarningOptions extends ToastOptions { }
/** Options for informational toast notifications */
interface InfoOptions extends ToastOptions { }

/**
 * Internal representation of a toast notification item.
 */
interface ToastItem {
  /** Unique identifier for the toast */
  id: string;
  /** Visual type determining styling and icon */
  type: 'error' | 'success' | 'warning' | 'info';
  /** Text content to display */
  message: string;
  /** Configuration options for display behavior */
  options: ToastOptions;
  /** Optional retry function for error toasts */
  retryAction?: () => void;
  /** Optional custom retry button label */
  retryLabel?: string;
}

const ErrorContext = createContext<ErrorContextValue | undefined>(undefined);

/**
 * Props for the ErrorProvider component.
 */
interface ErrorProviderProps {
  /** Child components that will have access to the error context */
  children: ReactNode;
}

/**
 * Global error handling and toast notification provider for the creator application.
 * 
 * This provider manages all toast notifications throughout the application, providing
 * a centralized system for displaying errors, success messages, warnings, and info
 * notifications. It handles automatic dismissal, positioning, retry functionality for
 * errors, and maintains a queue of active toasts. The provider is used in App.tsx
 * as part of the application's provider hierarchy and is consumed by various hooks
 * like useApiErrorHandler, useCourses, and useApiOperation for consistent error
 * handling across the application.
 * 
 * Features:
 * - Automatic toast dismissal with configurable duration
 * - Multiple toast types (error, success, warning, info)
 * - Retry functionality for error toasts
 * - Configurable positioning and styling
 * - Queue management for multiple simultaneous toasts
 * - Network-aware error handling
 * 
 * @param {ErrorProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to error context
 * @returns {JSX.Element} Provider component with toast rendering system
 * 
 * @example
 * // Used in App.tsx as part of the provider hierarchy
 * <QueryClientProvider client={queryClient}>
 *   <ErrorProvider>
 *     <Router>
 *       <AppRoutes />
 *     </Router>
 *   </ErrorProvider>
 * </QueryClientProvider>
 * 
 * @example
 * // Consumed by components through useErrorContext hook
 * const { showError, showSuccess } = useErrorContext();
 * 
 * const handleSubmit = async () => {
 *   try {
 *     await submitData();
 *     showSuccess('Data saved successfully!');
 *   } catch (error) {
 *     showError('Failed to save data', { 
 *       retryAction: handleSubmit,
 *       retryLabel: 'Try Again' 
 *     });
 *   }
 * };
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
 * Hook to access the error context for displaying toast notifications.
 * 
 * Provides access to all toast notification methods (showError, showSuccess, showWarning,
 * showInfo, clearAllToasts) for components that need to display user feedback. This hook
 * must be used within an ErrorProvider component tree.
 * 
 * @returns {ErrorContextValue} Object containing toast notification methods
 * @throws {Error} When used outside of ErrorProvider
 * 
 * @example
 * // Basic usage in a component
 * const MyComponent = () => {
 *   const { showError, showSuccess } = useErrorContext();
 *   
 *   const handleAction = async () => {
 *     try {
 *       await performAction();
 *       showSuccess('Action completed successfully!');
 *     } catch (error) {
 *       showError('Action failed. Please try again.');
 *     }
 *   };
 *   
 *   return <button onClick={handleAction}>Perform Action</button>;
 * };
 */
export const useErrorContext = (): ErrorContextValue => {
  const context = useContext(ErrorContext);
  if (context === undefined) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
};

/**
 * Specialized hook for handling API errors with intelligent error parsing and toast notifications.
 * 
 * This hook provides comprehensive API error handling capabilities including network error detection,
 * HTTP status code interpretation, automatic retry suggestions, and user-friendly error messages.
 * It's extensively used throughout the application by hooks like useCourses, useApiOperation, and
 * useEnhancedErrorHandling to provide consistent error handling behavior.
 * 
 * Features:
 * - Network error detection and handling
 * - HTTP status code interpretation with appropriate messages
 * - Automatic retry functionality for recoverable errors
 * - Offline detection and warnings
 * - Context-aware error logging
 * - Configurable toast durations based on error type
 * 
 * @returns {Object} Object containing error handling methods and utilities
 * @returns {Function} returns.handleError - Main error handling function with retry support
 * @returns {Function} returns.handleSuccess - Success message handler
 * @returns {Function} returns.handleWarning - Warning message handler
 * @returns {Function} returns.handleNetworkError - Specialized network error handler
 * @returns {Function} returns.isNetworkError - Utility to check if error is network-related
 * @returns {Function} returns.getErrorMessage - Extract user-friendly message from error
 * 
 * @example
 * // Used in API hooks for consistent error handling
 * const { handleError, handleSuccess } = useApiErrorHandler();
 * 
 * const createCourse = useMutation({
 *   mutationFn: courseService.createCourse,
 *   onSuccess: (data) => {
 *     handleSuccess('Course created successfully!');
 *   },
 *   onError: (error) => {
 *     handleError(error, () => createCourse.mutate(), 'Course Creation');
 *   }
 * });
 * 
 * @example
 * // Network-specific error handling
 * const { handleNetworkError, isNetworkError } = useApiErrorHandler();
 * 
 * const fetchData = async () => {
 *   try {
 *     const data = await apiCall();
 *     return data;
 *   } catch (error) {
 *     if (isNetworkError(error)) {
 *       handleNetworkError(error, fetchData);
 *     } else {
 *       handleError(error);
 *     }
 *   }
 * };
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