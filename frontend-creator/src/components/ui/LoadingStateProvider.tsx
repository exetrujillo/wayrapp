// frontend-creator/src/components/ui/LoadingStateProvider.tsx

/**
 * @fileoverview State Management Layer - Loading State Context and Operations
 * 
 * This file provides the state management layer for loading operations throughout the
 * creator application. It manages the lifecycle of loading states, tracks concurrent
 * operations, and provides a context-based API for components to interact with loading
 * states consistently across the application.
 * 
 * ARCHITECTURE ROLE:
 * This file serves as the State Management layer in a three-tier loading architecture:
 * 
 * 1. LoadingStateProvider.tsx (State Management Layer) ← THIS FILE
 *    - React Context provider for global loading state
 *    - Operation lifecycle management (start, stop, update)
 *    - Concurrent operation tracking with unique IDs
 *    - Integration with useLoadingStateManager hook
 *    - Higher-order components and wrapper utilities
 * 
 * 2. EnhancedLoadingStates.tsx (Integration Layer)
 *    - Bridges state management and UI components
 *    - Combines multiple loading features with timeout handling
 * 
 * 3. LoadingStates.tsx (UI Components Layer)
 *    - Pure visual components for loading presentation
 *    - Network-aware UI elements and error displays
 * 
 * WHY NO DUPLICATION:
 * - LoadingStateProvider manages WHEN to show loading (operation state)
 * - LoadingStates defines HOW loading looks (visual presentation)
 * - Clear separation of concerns: state logic vs. UI presentation
 * - Provider can work with any UI implementation
 * - UI components can be used independently for simple cases
 * - Enables testing of state logic separate from UI rendering
 * 
 * FEATURES PROVIDED:
 * - Global loading state context with React Context API
 * - Operation tracking with unique IDs and concurrent operation support
 * - Automatic timeout handling and slow connection detection
 * - Network-aware loading messages and status updates
 * - Integration with error handling and retry mechanisms
 * - Higher-order components for automatic loading state management
 * 
 * COMPONENTS PROVIDED:
 * - LoadingStateProvider: Context provider for global state management
 * - useLoadingState: Hook to access loading context methods
 * - WithLoading: Wrapper component for loading states and error handling
 * - LoadingWrapper: Automatic loading management using operation IDs
 * - withLoadingState: HOC for wrapping components with loading behavior
 * 
 * USAGE PATTERNS:
 * - Provider setup: <LoadingStateProvider><App /></LoadingStateProvider>
 * - Hook usage: const { withLoading, startLoading } = useLoadingState()
 * - Wrapper usage: <WithLoading isLoading={loading}><Content /></WithLoading>
 * - HOC usage: const LoadingComponent = withLoadingState(MyComponent)
 * 
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useLoadingStateManager } from '../../hooks/useLoadingStateManager';
import { EnhancedLoading } from './EnhancedLoadingStates';
// import { ErrorBoundaryWrapper } from '../error/ErrorBoundaryWrapper';

/**
 * Context value interface for centralized loading state management.
 * 
 * Provides methods and state for managing loading operations throughout the application
 * with network awareness, operation tracking, and automatic timeout handling.
 */
interface LoadingStateContextValue {
  /** Start a new loading operation and return its unique ID */
  startLoading: (message: string, options?: any) => string;
  /** Stop a specific loading operation by ID */
  stopLoading: (id: string) => void;
  /** Update the message for an active loading operation */
  updateMessage: (id: string, message: string) => void;
  /** Wrap an async operation with automatic loading state management */
  withLoading: <T>(operation: () => Promise<T>, message: string, options?: any) => Promise<T>;
  /** Whether any loading operations are currently active */
  isLoading: boolean;
  /** Current loading message from active operations */
  currentMessage: string;
  /** Network-aware loading message with connection status */
  networkAwareMessage: string;
}

const LoadingStateContext = createContext<LoadingStateContextValue | undefined>(undefined);

/**
 * Props for the LoadingStateProvider component.
 */
interface LoadingStateProviderProps {
  /** Child components that will have access to the loading state context */
  children: ReactNode;
  /** Configuration options for loading behavior */
  options?: {
    /** Default timeout for loading operations in milliseconds */
    defaultTimeout?: number;
    /** Whether to show warnings for slow connections */
    showSlowConnectionWarning?: boolean;
    /** Threshold in milliseconds to consider a connection slow */
    slowConnectionThreshold?: number;
    /** Maximum number of concurrent loading operations */
    maxConcurrentOperations?: number;
  };
}

/**
 * Centralized loading state management provider for the creator application.
 * 
 * This provider manages all loading states throughout the application, providing network-aware
 * loading indicators, operation tracking, automatic timeouts, and slow connection warnings.
 * It wraps the useLoadingStateManager hook to provide a context-based API for components
 * to manage loading states consistently. The provider is used in App.tsx as part of the
 * application's provider hierarchy and is consumed by hooks like useApiOperation,
 * useFormWithErrorHandling, and components like CoursesPage and CourseDetailPage.
 * 
 * Features:
 * - Network-aware loading messages and indicators
 * - Concurrent operation tracking with configurable limits
 * - Automatic timeout handling with customizable thresholds
 * - Slow connection detection and warnings
 * - Operation priority management
 * - Cancellable operations support
 * - Integration with error handling and retry mechanisms
 * 
 * @param {LoadingStateProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components that will have access to loading context
 * @param {Object} [props.options] - Configuration options for loading behavior
 * @param {number} [props.options.defaultTimeout=30000] - Default timeout for operations in ms
 * @param {boolean} [props.options.showSlowConnectionWarning=true] - Show slow connection warnings
 * @param {number} [props.options.slowConnectionThreshold=5000] - Slow connection threshold in ms
 * @param {number} [props.options.maxConcurrentOperations=10] - Max concurrent operations
 * @returns {JSX.Element} Provider component with loading state management
 * 
 * @example
 * // Used in App.tsx as part of the provider hierarchy
 * <LoadingStateProvider
 *   options={{
 *     defaultTimeout: 30000,
 *     showSlowConnectionWarning: true,
 *     slowConnectionThreshold: 5000,
 *     maxConcurrentOperations: 10,
 *   }}
 * >
 *   <AuthProvider>
 *     <AppRoutes />
 *   </AuthProvider>
 * </LoadingStateProvider>
 * 
 * @example
 * // Consumed by hooks for automatic loading management
 * const { withLoading, startLoading, stopLoading } = useLoadingState();
 * 
 * const handleSubmit = async () => {
 *   await withLoading(
 *     () => submitData(),
 *     'Saving your changes...',
 *     { priority: 'high', cancellable: true }
 *   );
 * };
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
 * Hook to access the loading state context for managing loading operations.
 * 
 * Provides access to all loading state management methods including starting/stopping
 * operations, updating messages, and wrapping async operations with automatic loading
 * states. This hook must be used within a LoadingStateProvider component tree and is
 * extensively used by hooks like useApiOperation and useFormWithErrorHandling.
 * 
 * @returns {LoadingStateContextValue} Object containing loading state methods and current state
 * @throws {Error} When used outside of LoadingStateProvider
 * 
 * @example
 * // Basic usage in a component
 * const MyComponent = () => {
 *   const { withLoading, isLoading, currentMessage } = useLoadingState();
 *   
 *   const handleAction = async () => {
 *     await withLoading(
 *       () => performAsyncAction(),
 *       'Processing your request...'
 *     );
 *   };
 *   
 *   return (
 *     <div>
 *       {isLoading && <p>{currentMessage}</p>}
 *       <button onClick={handleAction}>Perform Action</button>
 *     </div>
 *   );
 * };
 * 
 * @example
 * // Manual operation management
 * const { startLoading, stopLoading, updateMessage } = useLoadingState();
 * 
 * const handleComplexOperation = async () => {
 *   const operationId = startLoading('Starting process...');
 *   
 *   try {
 *     updateMessage(operationId, 'Processing data...');
 *     await processData();
 *     
 *     updateMessage(operationId, 'Finalizing...');
 *     await finalize();
 *   } finally {
 *     stopLoading(operationId);
 *   }
 * };
 */
export const useLoadingState = (): LoadingStateContextValue => {
  const context = useContext(LoadingStateContext);
  if (context === undefined) {
    throw new Error('useLoadingState must be used within a LoadingStateProvider');
  }
  return context;
};

/**
 * Props for the WithLoading component wrapper.
 */
interface WithLoadingProps {
  /** Child components to wrap with loading states */
  children: ReactNode;
  /** Whether loading state is active */
  isLoading: boolean;
  /** Error object if an error occurred */
  error?: any;
  /** Function to call when retry button is clicked */
  onRetry?: () => void;
  /** Visual variant of the loading indicator */
  variant?: 'overlay' | 'page' | 'inline' | 'skeleton';
  /** Loading message to display */
  message?: string;
  /** Additional CSS classes */
  className?: string;
  /** Number of skeleton items to show in skeleton variant */
  skeletonCount?: number;
  /** Whether to show network status information */
  showNetworkStatus?: boolean;
  /** Whether to show retry button on errors */
  showRetryButton?: boolean;
  /** Current retry attempt count */
  retryCount?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
}

/**
 * Component wrapper that provides loading states and error handling for child components.
 * 
 * This component wraps child components with enhanced loading indicators, error boundaries,
 * and retry functionality. It supports multiple visual variants (overlay, page, inline, skeleton)
 * and integrates with the application's error handling system. Used extensively in pages like
 * CoursesPage and CourseDetailPage to provide consistent loading experiences.
 * 
 * @param {WithLoadingProps} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 * @param {boolean} props.isLoading - Whether loading state is active
 * @param {any} [props.error] - Error object if an error occurred
 * @param {Function} [props.onRetry] - Function to call when retry button is clicked
 * @param {'overlay'|'page'|'inline'|'skeleton'} [props.variant='overlay'] - Visual variant
 * @param {string} [props.message='Loading...'] - Loading message to display
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {number} [props.skeletonCount=3] - Number of skeleton items in skeleton variant
 * @param {boolean} [props.showNetworkStatus=true] - Whether to show network status
 * @param {boolean} [props.showRetryButton=true] - Whether to show retry button on errors
 * @param {number} [props.retryCount=0] - Current retry attempt count
 * @param {number} [props.maxRetries=3] - Maximum number of retry attempts
 * @returns {JSX.Element} Enhanced loading wrapper component
 * 
 * @example
 * // Used in pages for loading states
 * <WithLoading
 *   isLoading={isLoading}
 *   error={error}
 *   onRetry={refetch}
 *   variant="page"
 *   message="Loading courses..."
 * >
 *   <CourseList courses={courses} />
 * </WithLoading>
 * 
 * @example
 * // Inline loading for smaller components
 * <WithLoading
 *   isLoading={submitting}
 *   variant="inline"
 *   message="Saving..."
 *   showNetworkStatus={false}
 * >
 *   <form onSubmit={handleSubmit}>
 *     <input type="text" />
 *     <button type="submit">Save</button>
 *   </form>
 * </WithLoading>
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

/**
 * Props for the LoadingWrapper component.
 */
interface LoadingWrapperProps {
  /** Child components to wrap with automatic loading management */
  children: ReactNode;
  /** Operation ID to track for loading state */
  operationId?: string;
  /** Fallback component to show during loading */
  fallback?: ReactNode;
  /** Visual variant of the loading indicator */
  variant?: 'overlay' | 'page' | 'inline' | 'skeleton';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Component that automatically manages loading states using operation IDs from the loading context.
 * 
 * This component automatically tracks loading operations by ID and displays appropriate loading
 * indicators without requiring manual loading state management. It integrates with the
 * LoadingStateProvider context to automatically show/hide loading states based on active
 * operations, making it ideal for components that need automatic loading management.
 * 
 * @param {LoadingWrapperProps} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 * @param {string} [props.operationId] - Operation ID to track for loading state
 * @param {ReactNode} [props.fallback] - Custom fallback component during loading
 * @param {'overlay'|'page'|'inline'|'skeleton'} [props.variant='overlay'] - Visual variant
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {JSX.Element} Automatic loading wrapper component
 * 
 * @example
 * // Automatic loading based on operation ID
 * const MyComponent = () => {
 *   const { startLoading } = useLoadingState();
 *   const [operationId, setOperationId] = useState<string>();
 *   
 *   const handleAction = async () => {
 *     const id = startLoading('Processing...');
 *     setOperationId(id);
 *     // Operation will automatically show loading
 *   };
 *   
 *   return (
 *     <LoadingWrapper operationId={operationId} variant="page">
 *       <div>Content that will be wrapped with loading</div>
 *     </LoadingWrapper>
 *   );
 * };
 * 
 * @example
 * // With custom fallback
 * <LoadingWrapper
 *   operationId={currentOperation}
 *   fallback={<CustomSpinner />}
 *   variant="inline"
 * >
 *   <DataTable data={data} />
 * </LoadingWrapper>
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
 * Higher-Order Component (HOC) for wrapping components with automatic loading state management.
 * 
 * This HOC wraps any component with the WithLoading component, providing automatic loading
 * states based on props or custom logic. It's useful for creating reusable components that
 * need consistent loading behavior without manually wrapping each usage with WithLoading.
 * 
 * @template P - Props type of the wrapped component
 * @param {React.ComponentType<P>} Component - Component to wrap with loading states
 * @param {Object} [options] - Configuration options for the HOC
 * @param {'overlay'|'page'|'inline'|'skeleton'} [options.variant='overlay'] - Loading variant
 * @param {string} [options.className=''] - Additional CSS classes
 * @param {Function} [options.getLoadingProps] - Function to extract loading props from component props
 * @returns {React.FC<P>} Enhanced component with loading state management
 * 
 * @example
 * // Create a loading-aware data table component
 * const DataTable = ({ data, isLoading, error, onRetry }) => (
 *   <table>
 *     {data.map(item => <tr key={item.id}>{item.name}</tr>)}
 *   </table>
 * );
 * 
 * const LoadingDataTable = withLoadingState(DataTable, {
 *   variant: 'skeleton',
 *   getLoadingProps: (props) => ({
 *     isLoading: props.isLoading,
 *     error: props.error,
 *     onRetry: props.onRetry,
 *     message: 'Loading data...'
 *   })
 * });
 * 
 * @example
 * // Simple usage with default loading detection
 * const MyComponent = ({ data, loading }) => <div>{data}</div>;
 * const EnhancedComponent = withLoadingState(MyComponent, {
 *   variant: 'page',
 *   getLoadingProps: (props) => ({ isLoading: props.loading })
 * });
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