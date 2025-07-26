// frontend-creator/src/components/ui/LoadingStates.tsx

/**
 * @fileoverview UI Components Layer - Visual Loading Components
 * 
 * This file provides the visual presentation layer for loading states throughout the creator
 * application. It contains pure UI components that handle the visual representation of
 * loading states, including spinners, overlays, skeletons, and error displays.
 * 
 * ARCHITECTURE ROLE:
 * This file serves as the UI/Presentation layer in a three-tier loading architecture:
 * 
 * 1. LoadingStateProvider.tsx (State Management Layer)
 *    - Manages loading operation state and context
 *    - Tracks concurrent operations with unique IDs
 *    - Provides hooks for state management
 * 
 * 2. EnhancedLoadingStates.tsx (Integration Layer)
 *    - Bridges state management and UI components
 *    - Combines multiple loading components with enhanced features
 * 
 * 3. LoadingStates.tsx (UI Components Layer) ← THIS FILE
 *    - Pure visual components for different loading scenarios
 *    - Network-aware messaging and error handling
 *    - Reusable skeleton and loading indicators
 * 
 * WHY NO DUPLICATION:
 * - LoadingStateProvider manages WHEN to show loading (state management)
 * - LoadingStates defines HOW loading looks (visual presentation)
 * - Each layer has distinct responsibilities and can be used independently
 * - UI components can be used without the provider for simple cases
 * - Provider can work with different UI implementations
 * 
 * COMPONENTS PROVIDED:
 * - LoadingOverlay: Semi-transparent overlay with centered loading indicator
 * - PageLoading: Full-page loading with comprehensive error handling
 * - InlineLoading: Compact loading for buttons and small areas
 * - Skeleton variants: Placeholder components for different content types
 * - Network-aware messaging and error states with retry functionality
 * 
 * USAGE PATTERNS:
 * - Direct usage: <PageLoading message="Loading..." />
 * - With provider: Components automatically receive state from LoadingStateProvider
 * - Skeleton loading: <CardSkeleton />, <ListSkeleton />, <TableSkeleton />
 * - Error handling: Built-in error states with retry functionality
 * 
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

/**
 * Props for the LoadingOverlay component.
 */
interface LoadingOverlayProps {
  /** Whether the loading state is active */
  isLoading: boolean;
  /** Loading message to display */
  message?: string;
  /** Child components to overlay with loading state */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show network status information */
  showNetworkStatus?: boolean;
  /** Function to call when retry button is clicked */
  onRetry?: () => void;
  /** Error object if an error occurred */
  error?: any;
}

/**
 * Enhanced loading overlay component with network awareness and error handling.
 * 
 * This component provides a full overlay loading experience that covers child components
 * with a semi-transparent background and centered loading indicator. It includes intelligent
 * network status detection, slow connection warnings, offline handling, and error states
 * with retry functionality. Used by EnhancedLoadingStates and LoadingStateProvider for
 * consistent overlay loading experiences throughout the application.
 * 
 * Features:
 * - Network-aware loading messages and spinner colors
 * - Slow connection detection with automatic warnings after 5 seconds
 * - Offline detection with appropriate messaging
 * - Error state display with retry functionality
 * - Semi-transparent overlay that preserves underlying content visibility
 * - Responsive design with centered loading indicators
 * 
 * @param {LoadingOverlayProps} props - Component props
 * @param {boolean} props.isLoading - Whether the loading state is active
 * @param {string} [props.message='Loading...'] - Loading message to display
 * @param {React.ReactNode} props.children - Child components to overlay
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {boolean} [props.showNetworkStatus=true] - Whether to show network status
 * @param {Function} [props.onRetry] - Function to call when retry button is clicked
 * @param {any} [props.error] - Error object if an error occurred
 * @returns {JSX.Element} Overlay component with loading and error states
 * 
 * @example
 * // Basic overlay usage
 * <LoadingOverlay isLoading={isSubmitting} message="Saving changes...">
 *   <form onSubmit={handleSubmit}>
 *     <input type="text" />
 *     <button type="submit">Save</button>
 *   </form>
 * </LoadingOverlay>
 * 
 * @example
 * // With error handling and retry
 * <LoadingOverlay
 *   isLoading={isLoading}
 *   error={error}
 *   onRetry={refetch}
 *   message="Loading data..."
 *   showNetworkStatus={true}
 * >
 *   <DataTable data={data} />
 * </LoadingOverlay>
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

/**
 * Props for the Skeleton component.
 */
interface SkeletonProps {
  /** Additional CSS classes */
  className?: string;
  /** Width CSS class (e.g., 'w-full', 'w-1/2') */
  width?: string;
  /** Height CSS class (e.g., 'h-4', 'h-8') */
  height?: string;
  /** Whether to use rounded corners */
  rounded?: boolean;
}

/**
 * Basic skeleton loading component for placeholder content during loading states.
 * 
 * This component provides a simple animated placeholder that mimics the shape and size
 * of content that will be loaded. It uses CSS animations to create a pulsing effect
 * that indicates loading activity. Used as a building block for more complex skeleton
 * components like CardSkeleton, ListSkeleton, TableSkeleton, and FormSkeleton.
 * 
 * @param {SkeletonProps} props - Component props
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {string} [props.width='w-full'] - Width CSS class
 * @param {string} [props.height='h-4'] - Height CSS class
 * @param {boolean} [props.rounded=false] - Whether to use rounded corners
 * @returns {JSX.Element} Animated skeleton placeholder
 * 
 * @example
 * // Basic text skeleton
 * <Skeleton width="w-3/4" height="h-4" />
 * 
 * @example
 * // Avatar skeleton
 * <Skeleton width="w-12" height="h-12" rounded={true} />
 * 
 * @example
 * // Button skeleton
 * <Skeleton width="w-24" height="h-10" className="bg-gray-300" />
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = false,
}) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 ${width} ${height} ${rounded ? 'rounded-full' : 'rounded'
        } ${className}`}
    />
  );
};

/**
 * Card skeleton component for loading course and content cards.
 * 
 * This component provides a skeleton placeholder that matches the typical structure
 * of content cards used throughout the application (courses, lessons, exercises).
 * It includes placeholders for avatar, title, description, metadata, and action buttons
 * to provide a realistic loading experience that matches the final content layout.
 * 
 * @param {Object} props - Component props
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {JSX.Element} Card-shaped skeleton with typical content structure
 * 
 * @example
 * // Used in course listings
 * <CardSkeleton className="mb-4" />
 * 
 * @example
 * // Multiple cards for list loading
 * {Array.from({ length: 3 }).map((_, i) => (
 *   <CardSkeleton key={i} className="mb-4" />
 * ))}
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
 * List skeleton component for loading content lists with multiple items.
 * 
 * This component generates multiple CardSkeleton components to simulate loading
 * lists of content such as courses, lessons, or exercises. It's used by ContentList
 * and other list components to provide consistent loading experiences. The component
 * allows customization of item count and styling for different list contexts.
 * 
 * @param {Object} props - Component props
 * @param {number} [props.count=3] - Number of skeleton items to display
 * @param {string} [props.className=''] - Additional CSS classes for the container
 * @param {string} [props.itemClassName=''] - Additional CSS classes for each item
 * @returns {JSX.Element} List of card skeletons with spacing
 * 
 * @example
 * // Used in ContentList component
 * <ListSkeleton count={5} className="mt-4" />
 * 
 * @example
 * // Custom styling for different contexts
 * <ListSkeleton
 *   count={10}
 *   className="grid grid-cols-2 gap-4"
 *   itemClassName="h-32"
 * />
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
 * Table skeleton component for loading tabular data.
 * 
 * This component provides a skeleton placeholder that mimics table structure with
 * header row and data rows. It's useful for loading states in data tables, reports,
 * and other tabular content where users expect to see structured data. The component
 * generates appropriate spacing and borders to match typical table layouts.
 * 
 * @param {Object} props - Component props
 * @param {number} [props.rows=5] - Number of data rows to display
 * @param {number} [props.columns=4] - Number of columns to display
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {JSX.Element} Table-structured skeleton with header and rows
 * 
 * @example
 * // Basic table skeleton
 * <TableSkeleton rows={8} columns={5} />
 * 
 * @example
 * // Compact table for dashboard widgets
 * <TableSkeleton
 *   rows={3}
 *   columns={3}
 *   className="bg-gray-50 p-4 rounded"
 * />
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
 * Form skeleton component for loading form interfaces.
 * 
 * This component provides a skeleton placeholder that mimics typical form structure
 * with labels, input fields, and action buttons. It's useful for loading states in
 * create/edit forms for courses, lessons, exercises, and other content where users
 * expect to see form fields. The component includes proper spacing and sizing to
 * match real form layouts.
 * 
 * @param {Object} props - Component props
 * @param {number} [props.fields=4] - Number of form fields to display
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {JSX.Element} Form-structured skeleton with fields and buttons
 * 
 * @example
 * // Basic form skeleton
 * <FormSkeleton fields={6} />
 * 
 * @example
 * // Compact form for modals
 * <FormSkeleton
 *   fields={3}
 *   className="p-6 bg-white rounded-lg"
 * />
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
 * Enhanced page loading component with network awareness and comprehensive error handling.
 * 
 * This component provides a full-page loading experience with intelligent network status
 * detection, slow connection warnings, offline handling, and comprehensive error states.
 * It's used in App.tsx for lazy-loaded route fallbacks and throughout the application
 * for page-level loading states. The component includes automatic retry functionality
 * and page refresh options for error recovery.
 * 
 * Features:
 * - Full-page centered loading with minimum height
 * - Network-aware messaging and spinner colors
 * - Slow connection warnings after 8 seconds
 * - Offline detection with appropriate messaging
 * - Comprehensive error display with retry and refresh options
 * - Responsive design for all screen sizes
 * 
 * @param {Object} props - Component props
 * @param {string} [props.message='Loading page...'] - Loading message to display
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {any} [props.error] - Error object if an error occurred
 * @param {Function} [props.onRetry] - Function to call when retry button is clicked
 * @param {boolean} [props.showNetworkStatus=true] - Whether to show network status
 * @returns {JSX.Element} Full-page loading or error component
 * 
 * @example
 * // Used in App.tsx for lazy route fallbacks
 * const LoadingFallback = () => (
 *   <PageLoading
 *     message="Loading application..."
 *     showNetworkStatus={true}
 *     className="min-h-screen"
 *   />
 * );
 * 
 * @example
 * // Page-level loading with error handling
 * <PageLoading
 *   message="Loading course data..."
 *   error={error}
 *   onRetry={refetch}
 *   className="min-h-96"
 * />
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
 * Inline loading component for buttons, form fields, and small content areas.
 * 
 * This component provides a compact loading indicator that can be embedded within
 * other components without taking up significant space. It's ideal for button loading
 * states, inline form validation, small content sections, and anywhere a subtle
 * loading indicator is needed. The component uses horizontal layout with spinner
 * and optional message.
 * 
 * @param {Object} props - Component props
 * @param {string} [props.message] - Optional loading message to display
 * @param {'sm'|'md'|'lg'} [props.size='sm'] - Size of the loading spinner
 * @param {string} [props.className=''] - Additional CSS classes
 * @returns {JSX.Element} Compact horizontal loading indicator
 * 
 * @example
 * // Button loading state
 * <button disabled={isSubmitting}>
 *   {isSubmitting ? (
 *     <InlineLoading message="Saving..." size="sm" />
 *   ) : (
 *     'Save Changes'
 *   )}
 * </button>
 * 
 * @example
 * // Inline content loading
 * <div className="flex items-center justify-between">
 *   <h3>User Profile</h3>
 *   {isLoading && <InlineLoading size="sm" />}
 * </div>
 * 
 * @example
 * // Form field validation loading
 * <div className="relative">
 *   <input type="email" />
 *   {isValidating && (
 *     <div className="absolute right-2 top-2">
 *       <InlineLoading size="sm" />
 *     </div>
 *   )}
 * </div>
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

/**
 * Default export object containing all loading state components.
 * 
 * This export provides a convenient way to import all loading components as a single
 * object, though individual named exports are preferred for better tree-shaking.
 * 
 * @example
 * // Import all components as object (not recommended)
 * import LoadingStates from './LoadingStates';
 * <LoadingStates.PageLoading message="Loading..." />
 * 
 * @example
 * // Preferred: Import individual components
 * import { PageLoading, CardSkeleton } from './LoadingStates';
 * <PageLoading message="Loading..." />
 */
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