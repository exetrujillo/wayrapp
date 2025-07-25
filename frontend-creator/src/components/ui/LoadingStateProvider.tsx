import React, { createContext, useContext, ReactNode } from 'react';
import { useLoadingStateManager } from '../../hooks/useLoadingStateManager';
import { EnhancedLoading } from './EnhancedLoadingStates';
// import { ErrorBoundaryWrapper } from '../error/ErrorBoundaryWrapper';

interface LoadingStateContextValue {
  startLoading: (message: string, options?: any) => string;
  stopLoading: (id: string) => void;
  updateMessage: (id: string, message: string) => void;
  withLoading: <T>(operation: () => Promise<T>, message: string, options?: any) => Promise<T>;
  isLoading: boolean;
  currentMessage: string;
  networkAwareMessage: string;
}

const LoadingStateContext = createContext<LoadingStateContextValue | undefined>(undefined);

interface LoadingStateProviderProps {
  children: ReactNode;
  options?: {
    defaultTimeout?: number;
    showSlowConnectionWarning?: boolean;
    slowConnectionThreshold?: number;
    maxConcurrentOperations?: number;
  };
}

/**
 * Provider for centralized loading state management across the application
 */
export const LoadingStateProvider: React.FC<LoadingStateProviderProps> = ({
  children,
  options = {},
}) => {
  const loadingManager = useLoadingStateManager(options);

  const value: LoadingStateContextValue = {
    startLoading: loadingManager.startLoading,
    stopLoading: loadingManager.stopLoading,
    updateMessage: loadingManager.updateMessage,
    withLoading: loadingManager.withLoading,
    isLoading: loadingManager.isLoading,
    currentMessage: loadingManager.currentMessage,
    networkAwareMessage: loadingManager.networkAwareMessage,
  };

  return (
    <LoadingStateContext.Provider value={value}>
      {children}
    </LoadingStateContext.Provider>
  );
};

/**
 * Hook to use the loading state context
 */
export const useLoadingState = (): LoadingStateContextValue => {
  const context = useContext(LoadingStateContext);
  if (context === undefined) {
    throw new Error('useLoadingState must be used within a LoadingStateProvider');
  }
  return context;
};

interface WithLoadingProps {
  children: ReactNode;
  isLoading: boolean;
  error?: any;
  onRetry?: () => void;
  variant?: 'overlay' | 'page' | 'inline' | 'skeleton';
  message?: string;
  className?: string;
  skeletonCount?: number;
  showNetworkStatus?: boolean;
  showRetryButton?: boolean;
  retryCount?: number;
  maxRetries?: number;
}

/**
 * Component that wraps children with loading states and error boundaries
 */
export const WithLoading: React.FC<WithLoadingProps> = ({
  children,
  isLoading,
  error,
  onRetry,
  variant = 'overlay',
  message = 'Loading...',
  className = '',
  skeletonCount = 3,
  showNetworkStatus = true,
  showRetryButton = true,
  retryCount = 0,
  maxRetries = 3,
}) => {
  return (
    <EnhancedLoading
      isLoading={isLoading}
      error={error}
      variant={variant}
      message={message}
      {...(onRetry && { onRetry })}
      showNetworkStatus={showNetworkStatus}
      showRetryButton={showRetryButton}
      retryCount={retryCount}
      maxRetries={maxRetries}
      className={className}
      skeletonCount={skeletonCount}
    >
      {children}
    </EnhancedLoading>
  );
};

interface LoadingWrapperProps {
  children: ReactNode;
  operationId?: string;
  fallback?: ReactNode;
  variant?: 'overlay' | 'page' | 'inline' | 'skeleton';
  className?: string;
}

/**
 * Component that automatically manages loading states using operation IDs
 */
export const LoadingWrapper: React.FC<LoadingWrapperProps> = ({
  children,
  operationId,
  fallback,
  variant = 'overlay',
  className = '',
}) => {
  const loadingState = useLoadingState();

  if (!operationId) {
    return <>{children}</>;
  }

  const isLoading = loadingState.isLoading;

  if (isLoading && fallback) {
    return <>{fallback}</>;
  }

  if (isLoading) {
    const message = loadingState.networkAwareMessage;
    
    switch (variant) {
      case 'page':
        return (
          <div className={`flex flex-col items-center justify-center min-h-96 ${className}`}>
            <EnhancedLoading
              isLoading={true}
              variant="page"
              message={message}
              showNetworkStatus={true}
            >
              {children}
            </EnhancedLoading>
          </div>
        );
      
      case 'inline':
        return (
          <EnhancedLoading
            isLoading={true}
            variant="inline"
            message={message}
            className={className}
          >
            {children}
          </EnhancedLoading>
        );
      
      case 'skeleton':
        return (
          <EnhancedLoading
            isLoading={true}
            variant="skeleton"
            className={className}
            skeletonCount={3}
          >
            {children}
          </EnhancedLoading>
        );
      
      case 'overlay':
      default:
        return (
          <EnhancedLoading
            isLoading={true}
            variant="overlay"
            message={message}
            showNetworkStatus={true}
            className={className}
          >
            {children}
          </EnhancedLoading>
        );
    }
  }

  return <>{children}</>;
};

/**
 * HOC for wrapping components with loading states
 */
export const withLoadingState = <P extends object>(
  Component: React.ComponentType<P>,
  options: {
    variant?: 'overlay' | 'page' | 'inline' | 'skeleton';
    className?: string;
    getLoadingProps?: (props: P) => {
      isLoading: boolean;
      error?: any;
      onRetry?: () => void;
      message?: string;
    };
  } = {}
) => {
  const WrappedComponent: React.FC<P> = (props) => {
    const loadingProps = options.getLoadingProps ? options.getLoadingProps(props) : {
      isLoading: false,
    };

    return (
      <WithLoading
        variant={options.variant || 'overlay'}
        className={options.className || ''}
        {...loadingProps}
      >
        <Component {...props} />
      </WithLoading>
    );
  };

  WrappedComponent.displayName = `withLoadingState(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default LoadingStateProvider;