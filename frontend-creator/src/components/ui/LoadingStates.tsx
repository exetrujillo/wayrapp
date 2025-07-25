import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
  showNetworkStatus?: boolean;
  onRetry?: () => void;
  error?: any;
}

/**
 * Enhanced loading overlay component with network awareness and error handling
 */
export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Loading...',
  children,
  className = '',
  showNetworkStatus = true,
  onRetry,
  error,
}) => {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [showSlowConnectionWarning, setShowSlowConnectionWarning] = useState(false);

  // Show slow connection warning after 5 seconds of loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (isLoading && isSlowConnection) {
      timer = setTimeout(() => {
        setShowSlowConnectionWarning(true);
      }, 5000);
    } else {
      setShowSlowConnectionWarning(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading, isSlowConnection]);

  const getLoadingMessage = () => {
    if (!isOnline) {
      return 'You appear to be offline. Waiting for connection...';
    }
    if (showSlowConnectionWarning) {
      return 'This is taking longer than usual. Please check your connection.';
    }
    return message;
  };

  const getSpinnerColor = () => {
    if (!isOnline) return 'gray';
    if (showSlowConnectionWarning) return 'warning';
    return 'primary';
  };

  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-3 max-w-sm text-center">
            <LoadingSpinner size="lg" color={getSpinnerColor()} />
            <p className="text-sm text-gray-600">{getLoadingMessage()}</p>
            
            {showNetworkStatus && !isOnline && (
              <div className="text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                Offline - Will retry when connection is restored
              </div>
            )}
            
            {showSlowConnectionWarning && onRetry && (
              <button
                onClick={onRetry}
                className="text-xs text-primary-600 hover:text-primary-700 underline"
              >
                Retry now
              </button>
            )}
          </div>
        </div>
      )}
      
      {error && !isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-3 max-w-sm text-center">
            <div className="text-error">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              {error?.message || 'Something went wrong'}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-sm bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
  rounded?: boolean;
}

/**
 * Skeleton loading component for placeholder content
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = false,
}) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${width} ${height} ${
        rounded ? 'rounded-full' : 'rounded'
      } ${className}`}
    />
  );
};

/**
 * Card skeleton for loading course/content cards
 */
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-6 border rounded-component bg-white ${className}`}>
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Skeleton width="w-12" height="h-12" rounded />
          <div className="flex-1 space-y-2">
            <Skeleton width="w-3/4" height="h-4" />
            <Skeleton width="w-1/2" height="h-3" />
          </div>
        </div>
        <div className="space-y-2">
          <Skeleton width="w-full" height="h-3" />
          <Skeleton width="w-5/6" height="h-3" />
          <Skeleton width="w-4/6" height="h-3" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton width="w-20" height="h-6" />
          <div className="flex space-x-2">
            <Skeleton width="w-16" height="h-8" />
            <Skeleton width="w-16" height="h-8" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * List skeleton for loading content lists
 */
export const ListSkeleton: React.FC<{ 
  count?: number; 
  className?: string;
  itemClassName?: string;
}> = ({ 
  count = 3, 
  className = '',
  itemClassName = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} className={itemClassName} />
      ))}
    </div>
  );
};

/**
 * Table skeleton for loading table data
 */
export const TableSkeleton: React.FC<{ 
  rows?: number; 
  columns?: number;
  className?: string;
}> = ({ 
  rows = 5, 
  columns = 4,
  className = ''
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex space-x-4 pb-2 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} width="flex-1" height="h-4" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} width="flex-1" height="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Form skeleton for loading forms
 */
export const FormSkeleton: React.FC<{ 
  fields?: number;
  className?: string;
}> = ({ 
  fields = 4,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton width="w-24" height="h-4" />
          <Skeleton width="w-full" height="h-10" />
        </div>
      ))}
      <div className="flex justify-end space-x-3 pt-4">
        <Skeleton width="w-20" height="h-10" />
        <Skeleton width="w-24" height="h-10" />
      </div>
    </div>
  );
};

/**
 * Enhanced page loading component with network awareness and error handling
 */
export const PageLoading: React.FC<{ 
  message?: string;
  className?: string;
  error?: any;
  onRetry?: () => void;
  showNetworkStatus?: boolean;
}> = ({ 
  message = 'Loading page...',
  className = '',
  error,
  onRetry,
  showNetworkStatus = true,
}) => {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (!error && isSlowConnection) {
      timer = setTimeout(() => {
        setShowSlowWarning(true);
      }, 8000); // Show warning after 8 seconds for page loads
    } else {
      setShowSlowWarning(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [error, isSlowConnection]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-96 ${className}`}>
        <div className="text-error mb-4">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Page</h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          {error?.message || 'Something went wrong while loading this page.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-primary-500 text-white px-6 py-2 rounded hover:bg-primary-600 transition-colors"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded hover:bg-gray-200 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  const getLoadingMessage = () => {
    if (!isOnline) {
      return 'You appear to be offline. Waiting for connection...';
    }
    if (showSlowWarning) {
      return 'This is taking longer than usual. Please check your connection.';
    }
    return message;
  };

  const getSpinnerColor = () => {
    if (!isOnline) return 'gray';
    if (showSlowWarning) return 'warning';
    return 'primary';
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-96 ${className}`}>
      <LoadingSpinner size="lg" color={getSpinnerColor()} />
      <p className="mt-4 text-gray-600 text-center max-w-md">{getLoadingMessage()}</p>
      
      {showNetworkStatus && !isOnline && (
        <div className="mt-3 text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
          Offline - Will retry when connection is restored
        </div>
      )}
      
      {showSlowWarning && onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm text-primary-600 hover:text-primary-700 underline"
        >
          Retry now
        </button>
      )}
    </div>
  );
};

/**
 * Inline loading component for buttons and small areas
 */
export const InlineLoading: React.FC<{ 
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ 
  message,
  size = 'sm',
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <LoadingSpinner size={size} />
      {message && <span className="text-sm text-gray-600">{message}</span>}
    </div>
  );
};

export default {
  LoadingOverlay,
  Skeleton,
  CardSkeleton,
  ListSkeleton,
  TableSkeleton,
  FormSkeleton,
  PageLoading,
  InlineLoading,
};