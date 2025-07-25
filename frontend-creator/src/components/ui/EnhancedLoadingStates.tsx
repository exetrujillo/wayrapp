import React, { useState, useEffect, useCallback } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { LoadingOverlay, PageLoading, InlineLoading, Skeleton } from './LoadingStates';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useLoadingStateManager } from '../../hooks/useLoadingStateManager';
import { Button } from './Button';

interface EnhancedLoadingProps {
  isLoading: boolean;
  error?: any;
  children: React.ReactNode;
  variant?: 'overlay' | 'page' | 'inline' | 'skeleton';
  message?: string;
  onRetry?: () => void;
  showNetworkStatus?: boolean;
  showRetryButton?: boolean;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
  skeletonCount?: number;
  size?: 'sm' | 'md' | 'lg';
  timeout?: number;
  onTimeout?: () => void;
}

/**
 * Enhanced loading component that combines all loading state functionality
 * with network awareness, error handling, and timeout management
 */
export const EnhancedLoading: React.FC<EnhancedLoadingProps> = ({
  isLoading,
  error,
  children,
  variant = 'overlay',
  message = 'Loading...',
  onRetry,
  showNetworkStatus = true,
  showRetryButton = true,
  retryCount = 0,
  maxRetries = 3,
  className = '',
  skeletonCount = 3,
  size = 'md',
  timeout = 30000,
  onTimeout,
}) => {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  // Handle timeout
  useEffect(() => {
    if (!isLoading) {
      setHasTimedOut(false);
      setShowSlowWarning(false);
      return;
    }

    let timeoutId: NodeJS.Timeout;
    let slowWarningId: NodeJS.Timeout;

    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        setHasTimedOut(true);
        if (onTimeout) {
          onTimeout();
        }
      }, timeout);
    }

    // Show slow connection warning after 5 seconds
    if (isSlowConnection) {
      slowWarningId = setTimeout(() => {
        setShowSlowWarning(true);
      }, 5000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (slowWarningId) clearTimeout(slowWarningId);
    };
  }, [isLoading, timeout, onTimeout, isSlowConnection]);

  // Get appropriate loading message
  const getLoadingMessage = useCallback(() => {
    if (hasTimedOut) {
      return 'This is taking longer than expected...';
    }
    
    if (!isOnline) {
      return 'You appear to be offline. Waiting for connection...';
    }
    
    if (showSlowWarning) {
      return 'This is taking longer than usual due to slow connection...';
    }
    
    return message;
  }, [hasTimedOut, isOnline, showSlowWarning, message]);

  // Get appropriate spinner color
  const getSpinnerColor = () => {
    if (hasTimedOut) return 'warning';
    if (!isOnline) return 'gray';
    if (showSlowWarning) return 'warning';
    return 'primary';
  };

  // Handle retry with enhanced logic
  const handleRetry = useCallback(() => {
    setHasTimedOut(false);
    setShowSlowWarning(false);
    if (onRetry) {
      onRetry();
    }
  }, [onRetry]);

  // Render based on variant
  switch (variant) {
    case 'page':
      return (
        <PageLoading
          message={getLoadingMessage()}
          error={error}
          onRetry={handleRetry}
          showNetworkStatus={showNetworkStatus}
          className={className}
        />
      );

    case 'inline':
      if (error) {
        return (
          <div className={`flex items-center space-x-3 ${className}`}>
            <div className="text-error">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <span className="text-sm text-gray-600">
              {error?.message || 'Something went wrong'}
            </span>
            {onRetry && showRetryButton && retryCount < maxRetries && (
              <Button onClick={handleRetry} variant="outline" size="sm">
                Retry
              </Button>
            )}
          </div>
        );
      }

      if (isLoading) {
        return (
          <div className={`flex items-center space-x-2 ${className}`}>
            <LoadingSpinner size={size} color={getSpinnerColor()} />
            <span className="text-sm text-gray-600">{getLoadingMessage()}</span>
          </div>
        );
      }

      return <>{children}</>;

    case 'skeleton':
      if (error) {
        return (
          <div className={`p-4 border border-error border-opacity-20 rounded bg-error bg-opacity-5 ${className}`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className="text-error">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <span className="text-sm text-gray-600">
                {error?.message || 'Failed to load content'}
              </span>
            </div>
            {onRetry && showRetryButton && retryCount < maxRetries && (
              <Button onClick={handleRetry} variant="outline" size="sm">
                Try Again
              </Button>
            )}
          </div>
        );
      }

      if (isLoading) {
        return (
          <div className={`space-y-4 ${className}`}>
            {Array.from({ length: skeletonCount }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex space-x-4">
                  <Skeleton width="w-12" height="h-12" rounded />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="w-3/4" height="h-4" />
                    <Skeleton width="w-1/2" height="h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      }

      return <>{children}</>;

    case 'overlay':
    default:
      return (
        <LoadingOverlay
          isLoading={isLoading}
          message={getLoadingMessage()}
          showNetworkStatus={showNetworkStatus}
          onRetry={handleRetry}
          error={error}
          className={className}
        >
          {children}
        </LoadingOverlay>
      );
  }
};

interface SmartLoadingProps {
  operationId?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  variant?: 'overlay' | 'page' | 'inline' | 'skeleton';
  className?: string;
}

/**
 * Smart loading component that automatically manages loading states
 * using the loading state manager
 */
export const SmartLoading: React.FC<SmartLoadingProps> = ({
  operationId,
  children,
  fallback,
  variant = 'overlay',
  className = '',
}) => {
  const loadingManager = useLoadingStateManager();

  // If no operation ID provided, show children
  if (!operationId) {
    return <>{children}</>;
  }

  const operation = loadingManager.operations.find(op => op.id === operationId);
  const isLoading = !!operation;

  if (isLoading && fallback) {
    return <>{fallback}</>;
  }

  if (isLoading) {
    const message = operation?.message || 'Loading...';
    
    switch (variant) {
      case 'page':
        return (
          <PageLoading
            message={loadingManager.networkAwareMessage}
            className={className}
          />
        );
      
      case 'inline':
        return (
          <InlineLoading
            message={message}
            className={className}
          />
        );
      
      case 'skeleton':
        return (
          <div className={`space-y-4 ${className}`}>
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} />
            ))}
          </div>
        );
      
      case 'overlay':
      default:
        return (
          <LoadingOverlay
            isLoading={true}
            message={loadingManager.networkAwareMessage}
            showNetworkStatus={true}
            className={className}
          >
            {children}
          </LoadingOverlay>
        );
    }
  }

  return <>{children}</>;
};

interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  loadingText?: string;
  showSpinner?: boolean;
}

/**
 * Button component with integrated loading state
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({
  isLoading,
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  className = '',
  loadingText,
  showSpinner = true,
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          {showSpinner && <LoadingSpinner size="sm" />}
          <span>{loadingText || 'Loading...'}</span>
        </div>
      ) : (
        children
      )}
    </Button>
  );
};

interface ProgressLoadingProps {
  progress: number;
  message?: string;
  showPercentage?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Progress loading component for operations with known progress
 */
export const ProgressLoading: React.FC<ProgressLoadingProps> = ({
  progress,
  message = 'Loading...',
  showPercentage = true,
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <span className={`text-gray-600 ${textSizeClasses[size]}`}>
          {message}
        </span>
        {showPercentage && (
          <span className={`text-gray-500 ${textSizeClasses[size]}`}>
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div
          className={`bg-primary-500 ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default {
  EnhancedLoading,
  SmartLoading,
  LoadingButton,
  ProgressLoading,
};