import { useState, useCallback, useRef, useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface LoadingOperation {
    id: string;
    message: string;
    startTime: number;
    timeout?: number;
    priority: 'low' | 'normal' | 'high';
    cancellable: boolean;
    onCancel?: (() => void) | undefined;
}

interface LoadingStateManagerOptions {
    defaultTimeout?: number;
    showSlowConnectionWarning?: boolean;
    slowConnectionThreshold?: number;
    maxConcurrentOperations?: number;
}

/**
 * Comprehensive loading state manager with network awareness and operation tracking
 */
export const useLoadingStateManager = (options: LoadingStateManagerOptions = {}) => {
    const {
        defaultTimeout = 30000, // 30 seconds
        showSlowConnectionWarning = true,
        slowConnectionThreshold = 5000, // 5 seconds
        maxConcurrentOperations = 10,
    } = options;

    const { isOnline, isSlowConnection } = useNetworkStatus();
    const [operations, setOperations] = useState<Map<string, LoadingOperation>>(new Map());
    const [slowOperations, setSlowOperations] = useState<Set<string>>(new Set());
    const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const slowWarningTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
            slowWarningTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        };
    }, []);

    const stopLoadingOperation = useCallback((operationId: string) => {
        setOperations(prev => {
            const newMap = new Map(prev);
            newMap.delete(operationId);
            return newMap;
        });

        setSlowOperations(prev => {
            const newSet = new Set(prev);
            newSet.delete(operationId);
            return newSet;
        });

        // Clear timeouts
        const timeout = timeoutsRef.current.get(operationId);
        if (timeout) {
            clearTimeout(timeout);
            timeoutsRef.current.delete(operationId);
        }

        const slowTimeout = slowWarningTimeoutsRef.current.get(operationId);
        if (slowTimeout) {
            clearTimeout(slowTimeout);
            slowWarningTimeoutsRef.current.delete(operationId);
        }
    }, []);

    // Auto-cancel operations when going offline (for non-critical operations)
    useEffect(() => {
        if (!isOnline) {
            operations.forEach((operation, operationId) => {
                if (operation.priority === 'low' && operation.cancellable) {
                    stopLoadingOperation(operationId);
                }
            });
        }
    }, [isOnline, operations, stopLoadingOperation]);

    const generateOperationId = useCallback((): string => {
        return `op_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }, []);

    const startLoading = useCallback((
        message: string,
        options: {
            id?: string;
            timeout?: number;
            priority?: 'low' | 'normal' | 'high';
            cancellable?: boolean;
            onCancel?: () => void;
        } = {}
    ): string => {
        const {
            id = generateOperationId(),
            timeout = defaultTimeout,
            priority = 'normal',
            cancellable = false,
            onCancel,
        } = options;

        // Check if we've reached max concurrent operations
        if (operations.size >= maxConcurrentOperations) {
            console.warn(`Maximum concurrent operations (${maxConcurrentOperations}) reached. Operation "${message}" may be delayed.`);
        }

        const operation: LoadingOperation = {
            id,
            message,
            startTime: Date.now(),
            timeout,
            priority,
            cancellable,
            onCancel,
        };

        setOperations(prev => new Map(prev).set(id, operation));

        // Set timeout for operation
        if (timeout > 0) {
            const timeoutId = setTimeout(() => {
                console.warn(`Operation "${message}" timed out after ${timeout}ms`);
                stopLoadingOperation(id);
            }, timeout);
            timeoutsRef.current.set(id, timeoutId);
        }

        // Set slow connection warning
        if (showSlowConnectionWarning) {
            const warningTimeout = setTimeout(() => {
                setSlowOperations(prev => new Set(prev).add(id));
            }, slowConnectionThreshold);
            slowWarningTimeoutsRef.current.set(id, warningTimeout);
        }

        return id;
    }, [
        generateOperationId,
        defaultTimeout,
        maxConcurrentOperations,
        showSlowConnectionWarning,
        slowConnectionThreshold,
        operations.size,
        stopLoadingOperation,
    ]);

    const stopLoading = stopLoadingOperation;

    const cancelOperation = useCallback((operationId: string) => {
        const operation = operations.get(operationId);
        if (operation?.cancellable && operation.onCancel) {
            operation.onCancel();
        }
        stopLoadingOperation(operationId);
    }, [operations, stopLoadingOperation]);

    const updateMessage = useCallback((operationId: string, message: string) => {
        setOperations(prev => {
            const operation = prev.get(operationId);
            if (!operation) return prev;

            const newMap = new Map(prev);
            newMap.set(operationId, { ...operation, message });
            return newMap;
        });
    }, []);

    const withLoading = useCallback(async <T>(
        operation: () => Promise<T>,
        message: string,
        options: Parameters<typeof startLoading>[1] = {}
    ): Promise<T> => {
        const operationId = startLoading(message, options);
        try {
            const result = await operation();
            stopLoadingOperation(operationId);
            return result;
        } catch (error) {
            stopLoadingOperation(operationId);
            throw error;
        }
    }, [startLoading, stopLoadingOperation]);

    // Computed values
    const isLoading = operations.size > 0;
    const operationsArray = Array.from(operations.values());
    const highPriorityOperations = operationsArray.filter(op => op.priority === 'high');
    const currentMessage = highPriorityOperations.length > 0
        ? highPriorityOperations[0].message
        : operationsArray[0]?.message || '';

    const hasSlowOperations = slowOperations.size > 0;
    const longestRunningOperation = operationsArray.reduce((longest, current) => {
        return !longest || current.startTime < longest.startTime ? current : longest;
    }, null as LoadingOperation | null);

    const getLoadingStats = useCallback(() => {
        const now = Date.now();
        return {
            totalOperations: operations.size,
            slowOperations: slowOperations.size,
            averageDuration: operationsArray.length > 0
                ? operationsArray.reduce((sum, op) => sum + (now - op.startTime), 0) / operationsArray.length
                : 0,
            longestDuration: longestRunningOperation
                ? now - longestRunningOperation.startTime
                : 0,
        };
    }, [operations.size, slowOperations.size, operationsArray, longestRunningOperation]);

    const getNetworkAwareMessage = useCallback(() => {
        if (!isOnline) {
            return 'You appear to be offline. Waiting for connection...';
        }

        if (hasSlowOperations && isSlowConnection) {
            return 'This is taking longer than usual due to slow connection...';
        }

        if (hasSlowOperations) {
            return 'This is taking longer than expected...';
        }

        return currentMessage;
    }, [isOnline, hasSlowOperations, isSlowConnection, currentMessage]);

    const clearAllOperations = useCallback(() => {
        // Cancel all cancellable operations
        operations.forEach((operation) => {
            if (operation.cancellable && operation.onCancel) {
                operation.onCancel();
            }
        });

        // Clear all operations
        setOperations(new Map());
        setSlowOperations(new Set());

        // Clear all timeouts
        timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current.clear();
        slowWarningTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
        slowWarningTimeoutsRef.current.clear();
    }, [operations]);

    return {
        // State
        isLoading,
        currentMessage,
        operations: operationsArray,
        hasSlowOperations,
        longestRunningOperation,

        // Network-aware state
        networkAwareMessage: getNetworkAwareMessage(),
        isOffline: !isOnline,
        isSlowConnection,

        // Actions
        startLoading,
        stopLoading,
        cancelOperation,
        updateMessage,
        withLoading,
        clearAllOperations,

        // Utilities
        getLoadingStats,

        // Computed helpers
        canShowRetry: !isOnline || hasSlowOperations,
        shouldShowNetworkWarning: !isOnline,
        shouldShowSlowWarning: hasSlowOperations && isSlowConnection,
    };
};

/**
 * Simple loading state hook for single operations
 */
export const useSimpleLoading = (initialMessage = 'Loading...') => {
    const manager = useLoadingStateManager();
    const [currentOperationId, setCurrentOperationId] = useState<string | null>(null);

    const startLoading = useCallback((message = initialMessage) => {
        if (currentOperationId) {
            manager.stopLoading(currentOperationId);
        }
        const id = manager.startLoading(message);
        setCurrentOperationId(id);
        return id;
    }, [manager, currentOperationId, initialMessage]);

    const stopLoading = useCallback(() => {
        if (currentOperationId) {
            manager.stopLoading(currentOperationId);
            setCurrentOperationId(null);
        }
    }, [manager, currentOperationId]);

    const updateMessage = useCallback((message: string) => {
        if (currentOperationId) {
            manager.updateMessage(currentOperationId, message);
        }
    }, [manager, currentOperationId]);

    return {
        isLoading: !!currentOperationId && manager.isLoading,
        message: manager.networkAwareMessage,
        startLoading,
        stopLoading,
        updateMessage,
        withLoading: manager.withLoading,
    };
};

export default useLoadingStateManager;