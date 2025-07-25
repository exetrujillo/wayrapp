import React from 'react';
import { Button } from '../ui';
import { Feedback } from '../ui/Feedback';
import { NetworkErrorHandler } from './NetworkErrorHandler';

interface ErrorDisplayProps {
  error: any;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryCount?: number;
  maxRetries?: number;
  showRetryButton?: boolean;
  showDismissButton?: boolean;
  variant?: 'inline' | 'card' | 'page';
  className?: string;
  title?: string;
}

/**
 * Comprehensive error display component that handles different types of errors
 * and provides appropriate user interfaces and actions
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  retryCount = 0,
  maxRetries = 3,
  showRetryButton = true,
  showDismissButton = false,
  variant = 'inline',
  className = '',
  title,
}) => {
  // Check if this is a network-related error
  const isNetworkError = () => {
    return (
      error?.status === 0 ||
      error?.status >= 500 ||
      error?.status === 408 ||
      error?.status === 429 ||
      error?.message?.includes('Network Error') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('network') ||
      !navigator.onLine
    );
  };

  // Get appropriate error message based on error type
  const getErrorMessage = () => {
    if (error?.message) {
      return error.message;
    }

    if (error?.status) {
      switch (error.status) {
        case 400:
          return 'Invalid request. Please check your input and try again.';
        case 401:
          return 'You are not authorized to perform this action. Please log in and try again.';
        case 403:
          return 'You do not have permission to access this resource.';
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
  };

  // Get error details for development mode
  const getErrorDetails = () => {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    const details: any = {};
    
    if (error?.status) details.status = error.status;
    if (error?.code) details.code = error.code;
    if (error?.details) details.details = error.details;
    if (error?.stack) details.stack = error.stack;

    return Object.keys(details).length > 0 ? details : null;
  };

  // Handle network errors with specialized component
  if (isNetworkError() && onRetry) {
    return (
      <NetworkErrorHandler
        error={error}
        onRetry={onRetry}
        retryCount={retryCount}
        maxRetries={maxRetries}
        showRetryButton={showRetryButton}
        className={className}
      />
    );
  }

  // Render based on variant
  switch (variant) {
    case 'page':
      return (
        <div className={`flex flex-col items-center justify-center min-h-96 p-8 ${className}`}>
          <div className="text-center max-w-md">
            <div className="mx-auto h-16 w-16 text-error mb-6">
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
            
            {title && (
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
            )}
            
            <p className="text-gray-600 mb-6">{getErrorMessage()}</p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {onRetry && showRetryButton && retryCount < maxRetries && (
                <Button onClick={onRetry} variant="primary">
                  Try Again
                </Button>
              )}
              
              {onDismiss && showDismissButton && (
                <Button onClick={onDismiss} variant="outline">
                  Dismiss
                </Button>
              )}
              
              <Button onClick={() => window.location.reload()} variant="outline">
                Refresh Page
              </Button>
            </div>
            
            {getErrorDetails() && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40 text-left">
                  {JSON.stringify(getErrorDetails(), null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );

    case 'card':
      return (
        <div className={`p-6 border border-error border-opacity-20 rounded-component bg-error bg-opacity-5 ${className}`}>
          {title && (
            <h3 className="text-lg font-medium text-gray-900 mb-3">{title}</h3>
          )}
          
          <Feedback
            type="error"
            message={getErrorMessage()}
            showIcon={true}
          />
          
          <div className="mt-4 flex flex-wrap gap-2">
            {onRetry && showRetryButton && retryCount < maxRetries && (
              <Button onClick={onRetry} variant="outline" size="sm">
                Try Again
              </Button>
            )}
            
            {onDismiss && showDismissButton && (
              <Button onClick={onDismiss} variant="outline" size="sm">
                Dismiss
              </Button>
            )}
          </div>
          
          {getErrorDetails() && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
                {JSON.stringify(getErrorDetails(), null, 2)}
              </pre>
            </details>
          )}
        </div>
      );

    case 'inline':
    default:
      return (
        <div className={`space-y-3 ${className}`}>
          <Feedback
            type="error"
            message={getErrorMessage()}
            {...(onDismiss && showDismissButton && { onDismiss })}
            showIcon={true}
          />
          
          {(onRetry && showRetryButton && retryCount < maxRetries) && (
            <div className="flex items-center gap-3">
              <Button onClick={onRetry} variant="outline" size="sm">
                Try Again
              </Button>
              
              {retryCount > 0 && (
                <span className="text-sm text-gray-500">
                  Attempt {retryCount + 1} of {maxRetries + 1}
                </span>
              )}
            </div>
          )}
          
          {getErrorDetails() && (
            <details>
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
                {JSON.stringify(getErrorDetails(), null, 2)}
              </pre>
            </details>
          )}
        </div>
      );
  }
};

export default ErrorDisplay;