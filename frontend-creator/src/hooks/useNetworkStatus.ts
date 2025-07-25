import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

interface UseNetworkStatusOptions {
  onOnline?: () => void;
  onOffline?: () => void;
  onSlowConnection?: () => void;
  slowConnectionThreshold?: number; // RTT threshold in ms
}

/**
 * Hook for monitoring network status and connection quality
 */
export const useNetworkStatus = (options: UseNetworkStatusOptions = {}) => {
  const {
    onOnline,
    onOffline,
    onSlowConnection,
    slowConnectionThreshold = 1000,
  } = options;

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      isOnline: navigator.onLine,
      isSlowConnection: false,
      connectionType: connection?.type,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    };
  });

  const updateNetworkInfo = useCallback(() => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    const newStatus: NetworkStatus = {
      isOnline: navigator.onLine,
      isSlowConnection: connection?.rtt > slowConnectionThreshold || connection?.effectiveType === 'slow-2g',
      connectionType: connection?.type,
      effectiveType: connection?.effectiveType,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
    };

    setNetworkStatus(prevStatus => {
      // Trigger callbacks on status changes
      if (prevStatus.isOnline !== newStatus.isOnline) {
        if (newStatus.isOnline && onOnline) {
          onOnline();
        } else if (!newStatus.isOnline && onOffline) {
          onOffline();
        }
      }

      if (!prevStatus.isSlowConnection && newStatus.isSlowConnection && onSlowConnection) {
        onSlowConnection();
      }

      return newStatus;
    });
  }, [onOnline, onOffline, onSlowConnection, slowConnectionThreshold]);

  useEffect(() => {
    const handleOnline = () => updateNetworkInfo();
    const handleOffline = () => updateNetworkInfo();
    const handleConnectionChange = () => updateNetworkInfo();

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes if supported
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Initial update
    updateNetworkInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [updateNetworkInfo]);

  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // Try to fetch a small resource to verify actual connectivity
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }, []);

  return {
    ...networkStatus,
    checkConnectivity,
    updateNetworkInfo,
  };
};

/**
 * Hook for automatic retry with exponential backoff on network errors
 */
export const useNetworkRetry = () => {
  const { isOnline, checkConnectivity } = useNetworkStatus();

  const retryWithBackoff = useCallback(async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> => {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check connectivity before attempting
        if (!isOnline || !(await checkConnectivity())) {
          throw new Error('No network connection');
        }

        return await operation();
      } catch (error: any) {
        lastError = error;

        // Don't retry on non-network errors
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 401 && error?.status !== 408) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }, [isOnline, checkConnectivity]);

  return {
    retryWithBackoff,
    isOnline,
    checkConnectivity,
  };
};

export default useNetworkStatus;