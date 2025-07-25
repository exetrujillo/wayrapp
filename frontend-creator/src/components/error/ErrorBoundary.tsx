import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { ErrorDisplay } from './ErrorDisplay';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error | undefined;
  errorInfo?: ErrorInfo | undefined;
  retryCount: number;
  isRetrying: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, retryCount: number, retry: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'global' | 'page' | 'component';
  maxRetries?: number;
  showRetryButton?: boolean;
  isolate?: boolean; // Whether to isolate errors to this boundary
}

/**
 * Enhanced error boundary component for catching and handling React errors
 * Provides different fallback UIs based on the error level with retry functionality
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      this.reportError();
    }
  }

  override componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  private reportError = () => {
    // Example: Send to Sentry, LogRocket, or other error reporting service
    // Sentry.captureException(error, {
    //   contexts: {
    //     react: errorInfo,
    //     boundary: {
    //       level: this.props.level,
    //       retryCount: this.state.retryCount,
    //     }
    //   }
    // });
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      return;
    }

    this.setState({ 
      isRetrying: true,
      retryCount: this.state.retryCount + 1,
    });

    // Add a small delay before retrying to prevent rapid retries
    this.retryTimeoutId = setTimeout(() => {
      this.setState({ 
        hasError: false,
        isRetrying: false,
        ...(this.state.error && { error: undefined }),
        ...(this.state.errorInfo && { errorInfo: undefined }),
      });
    }, 1000);
  };

  handleReload = () => {
    window.location.reload();
  };

  private canRetry = (): boolean => {
    const { maxRetries = 3, showRetryButton = true } = this.props;
    return showRetryButton && this.state.retryCount < maxRetries;
  };

  override render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error!, this.state.retryCount, this.handleRetry);
        }
        return this.props.fallback;
      }

      // Default fallback based on error level
      return this.renderDefaultFallback();
    }

    return this.props.children;
  }

  private renderDefaultFallback() {
    const { level = 'component' } = this.props;
    const { error } = this.state;

    switch (level) {
      case 'global':
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full mx-4">
              <div className="text-center mb-6">
                <div className="mx-auto h-16 w-16 text-error mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Something went wrong
                </h1>
                <p className="text-gray-600 mb-6">
                  We're sorry, but something unexpected happened. Please try refreshing the page.
                </p>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={this.handleReload}
                  variant="primary"
                  className="w-full"
                >
                  Refresh Page
                </Button>
                
                {process.env.NODE_ENV === 'development' && error && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      Error Details (Development)
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                      {error.toString()}
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>
        );

      case 'page':
        return (
          <div className="flex flex-col items-center justify-center min-h-96 p-8">
            <div className="text-center max-w-md">
              <div className="mx-auto h-12 w-12 text-error mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Page Error
              </h2>
              <p className="text-gray-600 mb-6">
                This page encountered an error. Please try again.
              </p>
              <div className="space-y-2">
                <Button onClick={this.handleRetry} variant="primary">
                  Try Again
                </Button>
                <Button onClick={this.handleReload} variant="outline">
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        );

      case 'component':
      default:
        if (this.state.isRetrying) {
          return (
            <div className="p-4 border border-gray-200 rounded-component bg-gray-50 flex items-center justify-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-600">Retrying...</span>
            </div>
          );
        }

        return (
          <ErrorDisplay
            error={error}
            {...(this.canRetry() && { onRetry: this.handleRetry })}
            retryCount={this.state.retryCount}
            maxRetries={this.props.maxRetries || 3}
            variant="card"
            title="Component Error"
          />
        );
    }
  }
}

export default ErrorBoundary;