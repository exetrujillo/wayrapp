import React, { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { ErrorDisplay } from './ErrorDisplay';
import { useErrorBoundary } from './ErrorBoundaryProvider';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface ErrorBoundaryWrapperProps {
  children: ReactNode;
  level?: 'global' | 'page' | 'component';
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;

  showRetryButton?: boolean;
  maxRetries?: number;
  isolate?: boolean;
  context?: string;
  className?: string;
}

/**
 * Enhanced error boundary wrapper with network awareness and recovery options
 */
export const ErrorBoundaryWrapper: React.FC<ErrorBoundaryWrapperProps> = ({
  children,
  level = 'component',
  fallback,
  onError,

  showRetryButton = true,
  maxRetries = 3,
  isolate = false,
  context,
  className = '',
}) => {
  const { reportError } = useErrorBoundary();
  const { isOnline } = useNetworkStatus();

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Report to global error boundary context
    reportError(error, errorInfo, context || level);
    
    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }
  };

  // Create enhanced fallback component that's network-aware
  const createEnhancedFallback = () => {
    if (fallback) {
      return fallback;
    }

    // Return a function that ErrorBoundary can use
    return (error: Error, retryCount: number, retry: () => void) => {
      const isNetworkError = !isOnline || 
        error.message?.toLowerCase().includes('network') ||
        error.message?.toLowerCase().includes('fetch') ||
        (error as any)?.status === 0 ||
        (error as any)?.status >= 500;

      const getErrorTitle = () => {
        switch (level) {
          case 'global':
            return 'Application Error';
          case 'page':
            return 'Page Error';
          case 'component':
          default:
            return 'Component Error';
        }
      };

      const getErrorMessage = () => {
        if (isNetworkError && !isOnline) {
          return 'You appear to be offline. Please check your internet connection and try again.';
        }
        
        if (isNetworkError) {
          return 'Unable to connect to the server. Please check your connection and try again.';
        }

        return error.message || 'An unexpected error occurred. Please try again.';
      };

      const getVariant = (): 'inline' | 'card' | 'page' => {
        switch (level) {
          case 'global':
          case 'page':
            return 'page';
          case 'component':
          default:
            return 'card';
        }
      };

      return (
        <div className={className}>
          <ErrorDisplay
            error={{
              message: getErrorMessage(),
              status: (error as any)?.status,
              code: (error as any)?.code,
            }}
            title={getErrorTitle()}
            variant={getVariant()}
            {...(showRetryButton && { onRetry: retry })}
            retryCount={retryCount}
            maxRetries={maxRetries}
            showRetryButton={showRetryButton}
          />
          
          {/* Network status indicator */}
          {isNetworkError && !isOnline && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-orange-700">
                    You're currently offline. The page will automatically retry when your connection is restored.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };
  };

  return (
    <ErrorBoundary
      level={level}
      onError={handleError}
      maxRetries={maxRetries}
      showRetryButton={showRetryButton}
      isolate={isolate}
      fallback={createEnhancedFallback()}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * HOC for wrapping components with error boundaries
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ErrorBoundaryWrapperProps, 'children'> = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundaryWrapper {...options}>
      <Component {...props} />
    </ErrorBoundaryWrapper>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook for manually triggering error boundaries with enhanced context
 */
export const useErrorHandler = () => {
  const { reportError } = useErrorBoundary();

  const handleError = (error: Error | string, context?: string, additionalInfo?: any) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    // Add additional context to error
    if (additionalInfo) {
      (errorObj as any).additionalInfo = additionalInfo;
    }
    
    reportError(errorObj, undefined, context);
  };

  const handleAsyncError = (promise: Promise<any>, context?: string) => {
    promise.catch((error) => {
      handleError(error, context);
    });
  };

  const wrapAsyncFunction = <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return async (...args: T): Promise<R> => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error as Error, context);
        throw error;
      }
    };
  };

  return {
    handleError,
    handleAsyncError,
    wrapAsyncFunction,
  };
};

/**
 * Pre-configured error boundary for global application level
 */
export const GlobalErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundaryWrapper level="global" isolate={true}>
    {children}
  </ErrorBoundaryWrapper>
);

/**
 * Pre-configured error boundary for page level
 */
export const PageErrorBoundary: React.FC<{ 
  children: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}> = ({ children, onError }) => (
  <ErrorBoundaryWrapper 
    level="page" 
    isolate={true}
    {...(onError && { onError })}
  >
    {children}
  </ErrorBoundaryWrapper>
);

/**
 * Pre-configured error boundary for component level
 */
export const ComponentErrorBoundary: React.FC<{ 
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}> = ({ children, fallback, onError }) => (
  <ErrorBoundaryWrapper 
    level="component" 
    {...(fallback && { fallback })}
    {...(onError && { onError })}
  >
    {children}
  </ErrorBoundaryWrapper>
);

export default ErrorBoundaryWrapper;