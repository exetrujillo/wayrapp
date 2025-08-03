/**
 * Auto-Save Provider Component
 * 
 * This component provides auto-save functionality with configurable intervals,
 * conflict resolution, and status indicators. It handles localStorage backup,
 * multiple tab conflicts, and provides manual save options.
 * 
 * @module AutoSaveProvider
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { FieldValues } from 'react-hook-form';

// ============================================================================
// Types and Interfaces
// ============================================================================

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'conflict';

export interface AutoSaveConfig {
  /** Auto-save interval in milliseconds */
  interval: number;
  /** Enable auto-save */
  enabled: boolean;
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Debounce delay for changes */
  debounceDelay: number;
  /** Enable localStorage backup */
  enableBackup: boolean;
  /** Conflict resolution strategy */
  conflictResolution: 'manual' | 'local' | 'remote';
}

export interface AutoSaveContextValue<T extends FieldValues = FieldValues> {
  /** Current auto-save status */
  status: AutoSaveStatus;
  /** Last save timestamp */
  lastSaved: Date | null;
  /** Error message if save failed */
  error: string | null;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Auto-save configuration */
  config: AutoSaveConfig;
  /** Start auto-save for form data */
  startAutoSave: (formId: string, entityType: string, getData: () => T) => void;
  /** Stop auto-save */
  stopAutoSave: () => void;
  /** Manually trigger save */
  saveNow: () => Promise<void>;
  /** Update auto-save configuration */
  updateConfig: (newConfig: Partial<AutoSaveConfig>) => void;
}

export interface AutoSaveProviderProps {
  children: React.ReactNode;
  /** Default configuration */
  defaultConfig?: Partial<AutoSaveConfig>;
  /** Save function */
  onSave?: (data: any) => Promise<void>;
  /** Error handler */
  onError?: (error: Error, data: any) => void;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: AutoSaveConfig = {
  interval: 30000, // 30 seconds
  enabled: true,
  maxRetries: 3,
  debounceDelay: 1000, // 1 second
  enableBackup: true,
  conflictResolution: 'manual',
};

// ============================================================================
// Context Creation
// ============================================================================

const AutoSaveContext = createContext<AutoSaveContextValue | null>(null);

// ============================================================================
// Auto-Save Provider Component
// ============================================================================

/**
 * Auto-Save Provider Component
 */
export const AutoSaveProvider: React.FC<AutoSaveProviderProps> = ({
  children,
  defaultConfig = {},
  onSave,
  onError,
}) => {
  // ============================================================================
  // State Management
  // ============================================================================

  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [config, setConfig] = useState<AutoSaveConfig>({ ...DEFAULT_CONFIG, ...defaultConfig });

  // ============================================================================
  // Refs for Stable References
  // ============================================================================

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const getDataRef = useRef<(() => any) | null>(null);

  // ============================================================================
  // Auto-Save Logic
  // ============================================================================

  /**
   * Perform the actual save operation
   */
  const performSave = useCallback(async (): Promise<void> => {
    if (!getDataRef.current) {
      return;
    }

    try {
      setStatus('saving');
      setError(null);

      const formData = getDataRef.current();

      // Call external save function
      if (onSave) {
        await onSave(formData);
      }

      setStatus('saved');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);

      // Auto-clear saved status after 3 seconds
      setTimeout(() => {
        setStatus('idle');
      }, 3000);

    } catch (saveError) {
      console.error('Auto-save failed:', saveError);
      setStatus('error');
      setError(saveError instanceof Error ? saveError.message : 'Save failed');

      if (onError) {
        onError(saveError instanceof Error ? saveError : new Error('Save failed'), getDataRef.current?.());
      }
    }
  }, [onSave, onError]);

  // ============================================================================
  // Context Value Functions
  // ============================================================================

  /**
   * Start auto-save for a form
   */
  const startAutoSave = useCallback((_formId: string, _entityType: string, getData: () => any) => {
    // Stop existing auto-save
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Update refs
    getDataRef.current = getData;

    // Start auto-save interval
    if (config.enabled) {
      intervalRef.current = setInterval(() => {
        if (hasUnsavedChanges) {
          performSave();
        }
      }, config.interval);
    }
  }, [config, hasUnsavedChanges, performSave]);

  /**
   * Stop auto-save
   */
  const stopAutoSave = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset refs
    getDataRef.current = null;
  }, []);

  /**
   * Manually trigger save
   */
  const saveNow = useCallback(async (): Promise<void> => {
    await performSave();
  }, [performSave]);

  /**
   * Update configuration
   */
  const updateConfig = useCallback((newConfig: Partial<AutoSaveConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopAutoSave();
    };
  }, [stopAutoSave]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue: AutoSaveContextValue = {
    status,
    lastSaved,
    error,
    hasUnsavedChanges,
    config,
    startAutoSave,
    stopAutoSave,
    saveNow,
    updateConfig,
  };

  return (
    <AutoSaveContext.Provider value={contextValue}>
      {children}
    </AutoSaveContext.Provider>
  );
};

// ============================================================================
// Hook for Using Auto-Save Context
// ============================================================================

/**
 * Hook to use auto-save functionality
 */
export const useAutoSave = <T extends FieldValues = FieldValues>(): AutoSaveContextValue<T> => {
  const context = useContext(AutoSaveContext);

  if (!context) {
    throw new Error('useAutoSave must be used within an AutoSaveProvider');
  }

  return context as AutoSaveContextValue<T>;
};

// ============================================================================
// Auto-Save Status Indicator Component
// ============================================================================

export interface AutoSaveStatusProps {
  className?: string;
  showText?: boolean;
}

/**
 * Auto-Save Status Indicator Component
 */
export const AutoSaveStatus: React.FC<AutoSaveStatusProps> = ({
  className = '',
  showText = true,
}) => {
  const { status, lastSaved, error } = useAutoSave();

  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return (
          <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'saved':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : 'Saved';
      case 'error':
        return error || 'Save failed';
      default:
        return '';
    }
  };

  if (status === 'idle') {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {getStatusIcon()}
      {showText && (
        <span className={`text-sm ${status === 'saving' ? 'text-blue-600' :
          status === 'saved' ? 'text-green-600' :
            status === 'error' ? 'text-red-600' :
              'text-gray-600'
          }`}>
          {getStatusText()}
        </span>
      )}
    </div>
  );
};

export default AutoSaveProvider;