import React, { Component, ErrorInfo, ReactNode, createContext, useContext } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface ErrorBoundaryContextValue {
  reportError: (error: Error, errorInfo?: ErrorInfo, context?: string) => void;
  clearError: () => void;
  hasGlobalError: boolean;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextValue | undefined>(undefined);

interface ErrorBoundaryProviderProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, context?: string) => void;
}

interface ErrorBoundaryProviderState {
  hasGlobalError: boolean;
  errorCount: number;
}

/**
 * Provider for managing error boundaries across the application
 * Provides context for error reporting and global error state
 */
export class ErrorBoundaryProvider extends Component<ErrorBoundaryProviderProps, ErrorBoundaryProviderState> {
  private errorReports: Array<{ error: Error; errorInfo?: ErrorInfo | undefined; context?: string | undefined; timestamp: number }> = [];
  private networkStatusListener: (() => void) | null = null;

  constructor(props: ErrorBoundaryProviderProps) {
    super(props);
    this.state = {
      hasGlobalError: false,
      errorCount: 0,
    };
  }

  override componentDidMount() {
    // Listen for network status changes
    this.networkStatusListener = () => {
      if (navigator.onLine && this.state.hasGlobalError) {
        // Network is back online, potentially clear network-related errors
        this.clearError();
      }
    };
    
    window.addEventListener('online', this.networkStatusListener);
    
    // Listen for unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Listen for global JavaScript errors
    window.addEventListener('error', this.handleGlobalError);
  }

  override componentWillUnmount() {
    if (this.networkStatusListener) {
      window.removeEventListener('online', this.networkStatusListener);
    }
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleGlobalError);
  }

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    this.reportError(error, undefined, 'unhandled-promise');
    event.preventDefault(); // Prevent the default browser error handling
  };

  private handleGlobalError = (event: ErrorEvent) => {
    const error = event.error || new Error(event.message);
    this.reportError(error, undefined, 'global-js-error');
  };

  reportError = (error: Error, errorInfo?: ErrorInfo, context?: string) => {
    const timestamp = Date.now();
    
    // Add to error reports
    const errorReport: { error: Error; errorInfo?: ErrorInfo | undefined; context?: string | undefined; timestamp: number } = {
      error,
      timestamp
    };
    
    if (errorInfo !== undefined) {
      errorReport.errorInfo = errorInfo;
    }
    
    if (context !== undefined) {
      errorReport.context = context;
    }
    
    this.errorReports.push(errorReport);
    
    // Keep only last 10 errors
    if (this.errorReports.length > 10) {
      this.errorReports = this.errorReports.slice(-10);
    }

    // Update error count
    this.setState(prev => ({ 
      errorCount: prev.errorCount + 1,
      hasGlobalError: context === 'global' || prev.hasGlobalError,
    }));

    // Log error
    console.error(`Error reported${context ? ` (${context})` : ''}:`, error, errorInfo);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo || {} as ErrorInfo, context);
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorReporting(error, errorInfo, context);
    }
  };

  clearError = () => {
    this.setState({ hasGlobalError: false });
  };

  private sendToErrorReporting = (error: Error, errorInfo?: ErrorInfo, context?: string) => {
    // Enhanced error reporting with more context
    const errorReport = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      isOnline: navigator.onLine,
      errorCount: this.state.errorCount,
      ...(errorInfo && {
        componentStack: errorInfo.componentStack,
      }),
    };

    // Example: Send to Sentry, LogRocket, or other error reporting service
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: errorInfo,
    //     custom: errorReport
    //   },
    //   tags: {
    //     context,
    //     errorCount: this.state.errorCount.toString(),
    //   }
    // });

    // For now, log to console in a structured way
    console.group(`🚨 Error Report (${context || 'unknown'})`);
    console.error('Error:', error);
    console.table(errorReport);
    if (errorInfo) {
      console.log('Component Stack:', errorInfo.componentStack);
    }
    console.groupEnd();
  };

  override render() {
    const contextValue: ErrorBoundaryContextValue = {
      reportError: this.reportError,
      clearError: this.clearError,
      hasGlobalError: this.state.hasGlobalError,
    };

    return (
      <ErrorBoundaryContext.Provider value={contextValue}>
        {this.props.children}
      </ErrorBoundaryContext.Provider>
    );
  }
}

/**
 * Hook to use the error boundary context
 */
export const useErrorBoundary = (): ErrorBoundaryContextValue => {
  const context = useContext(ErrorBoundaryContext);
  if (context === undefined) {
    throw new Error('useErrorBoundary must be used within an ErrorBoundaryProvider');
  }
  return context;
};

/**
 * HOC for wrapping components with error boundaries
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  level: 'global' | 'page' | 'component' = 'component',
  fallback?: ReactNode
) => {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary level={level} fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

/**
 * Hook for manually triggering error boundaries
 */
export const useErrorHandler = () => {
  const { reportError } = useErrorBoundary();

  const handleError = (error: Error | string, context?: string) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    reportError(errorObj, undefined, context);
  };

  const handleAsyncError = (promise: Promise<any>, context?: string) => {
    promise.catch((error) => {
      handleError(error, context);
    });
  };

  return {
    handleError,
    handleAsyncError,
  };
};

export default ErrorBoundaryProvider;