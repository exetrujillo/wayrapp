import React, { useState, useEffect } from 'react';
import { Button } from '../ui';
import { Feedback } from '../ui/Feedback';

interface NetworkErrorHandlerProps {
  error: any;
  onRetry: () => void;
  retryCount?: number;
  maxRetries?: number;
  showRetryButton?: boolean;
  className?: string;
}

/**
 * Component for handling network-related errors with retry mechanisms
 * Provides user-friendly error messages and retry functionality
 */
export const NetworkErrorHandler: React.FC<NetworkErrorHandlerProps> = ({
  error,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
  showRetryButton = true,
  className = '',
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorMessage = () => {
    if (!isOnline) {
      return 'You appear to be offline. Please check your internet connection and try again.';
    }

    if (error?.status === 0 || error?.message?.includes('Network Error')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (error?.status >= 500) {
      return 'The server is currently experiencing issues. Please try again in a few moments.';
    }

    if (error?.status === 408 || error?.message?.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }

    if (error?.status === 429) {
      return 'Too many requests. Please wait a moment before trying again.';
    }

    if (error?.status >= 400 && error?.status < 500) {
      return error?.message || 'There was an issue with your request. Please try again.';
    }

    return error?.message || 'An unexpected error occurred. Please try again.';
  };

  const getRetryButtonText = () => {
    if (isRetrying) return 'Retrying...';
    if (!isOnline) return 'Retry when online';
    if (retryCount >= maxRetries) return 'Max retries reached';
    return `Retry${retryCount > 0 ? ` (${retryCount}/${maxRetries})` : ''}`;
  };

  const shouldShowRetryButton = () => {
    return showRetryButton && retryCount < maxRetries && (isOnline || !navigator.onLine);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Feedback
        type="error"
        message={getErrorMessage()}
        showIcon={true}
      />
      
      {!isOnline && (
        <Feedback
          type="warning"
          message="You're currently offline. Some features may not be available."
          showIcon={true}
        />
      )}

      {shouldShowRetryButton() && (
        <div className="flex items-center gap-3">
          <Button
            onClick={handleRetry}
            variant="outline"
            size="sm"
            disabled={isRetrying || (!isOnline && navigator.onLine)}
            loading={isRetrying}
          >
            {getRetryButtonText()}
          </Button>
          
          {retryCount > 0 && (
            <span className="text-sm text-gray-500">
              Attempt {retryCount + 1} of {maxRetries + 1}
            </span>
          )}
        </div>
      )}

      {retryCount >= maxRetries && (
        <Feedback
          type="warning"
          message="Maximum retry attempts reached. Please refresh the page or contact support if the problem persists."
          showIcon={true}
        />
      )}
    </div>
  );
};

export default NetworkErrorHandler;