/**
 * Enhanced Form State Management Hook
 * 
 * This hook provides comprehensive form state management including unsaved changes
 * detection, form data recovery, state persistence, and optimistic updates with
 * rollback capabilities.
 * 
 * @module useFormState
 * @category Hooks
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
// import { useAutoSave } from '../components/forms/AutoSaveProvider';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface FormStateConfig {
  /** Form identifier for persistence */
  formId: string;
  /** Entity type */
  entityType: string;
  /** Enable state persistence */
  enablePersistence: boolean;
  /** Enable unsaved changes detection */
  enableUnsavedChanges: boolean;
  /** Enable optimistic updates */
  enableOptimisticUpdates: boolean;
  /** Debounce delay for change detection */
  changeDebounceDelay: number;
  /** Maximum number of undo states to keep */
  maxUndoStates: number;
}

export interface FormStateSnapshot<T = any> {
  /** Form data */
  data: T;
  /** Timestamp */
  timestamp: number;
  /** Description of the change */
  description?: string | undefined;
}

export interface FormStateHistory<T = any> {
  /** Current state index */
  currentIndex: number;
  /** Array of state snapshots */
  states: FormStateSnapshot<T>[];
}

export interface FormStateReturn<T extends FieldValues = FieldValues> {
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
  /** Whether form data has been recovered */
  isRecovered: boolean;
  /** Current form state history */
  history: FormStateHistory<T>;
  /** Whether undo is available */
  canUndo: boolean;
  /** Whether redo is available */
  canRedo: boolean;
  /** Save current form state */
  saveFormState: (description?: string) => void;
  /** Recover form state from persistence */
  recoverFormState: () => T | null;
  /** Clear persisted form state */
  clearPersistedState: () => void;
  /** Mark form as saved (clears unsaved changes) */
  markAsSaved: () => void;
  /** Reset unsaved changes flag */
  resetUnsavedChanges: () => void;
  /** Undo last change */
  undo: () => T | null;
  /** Redo last undone change */
  redo: () => T | null;
  /** Get form state at specific index */
  getStateAt: (index: number) => T | null;
  /** Create optimistic update */
  createOptimisticUpdate: <R>(
    updateFn: (currentData: T) => T,
    revertFn: () => void,
    description?: string
  ) => Promise<R>;
  /** Commit optimistic update */
  commitOptimisticUpdate: () => void;
  /** Rollback optimistic update */
  rollbackOptimisticUpdate: () => void;
  /** Check if form has been modified from initial state */
  isModified: () => boolean;
  /** Get changes from initial state */
  getChanges: () => Partial<T>;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: FormStateConfig = {
  formId: '',
  entityType: '',
  enablePersistence: true,
  enableUnsavedChanges: true,
  enableOptimisticUpdates: true,
  changeDebounceDelay: 500,
  maxUndoStates: 10,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get storage key for form state
 */
const getStorageKey = (formId: string): string => {
  return `form_state_${formId}`;
};

/**
 * Deep compare two objects
 */
const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return obj1 === obj2;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return obj1 === obj2;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
};

/**
 * Deep clone an object
 */
const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const cloned: any = {};
    Object.keys(obj).forEach(key => {
      cloned[key] = deepClone((obj as any)[key]);
    });
    return cloned;
  }
  return obj;
};

/**
 * Get object differences
 */
const getObjectDifferences = <T extends Record<string, any>>(original: T, current: T): Partial<T> => {
  const differences: Partial<T> = {};
  
  Object.keys(current).forEach(key => {
    if (!deepEqual(original[key], current[key])) {
      differences[key as keyof T] = current[key];
    }
  });
  
  return differences;
};

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Enhanced Form State Management Hook
 * 
 * @example
 * const formState = useFormState({
 *   formId: 'course-123',
 *   entityType: 'course',
 *   enablePersistence: true,
 * });
 * 
 * const form = useForm({
 *   defaultValues: formState.recoverFormState() || initialValues,
 * });
 */
export const useFormState = <T extends FieldValues = FieldValues>(
  form: UseFormReturn<T>,
  config: Partial<FormStateConfig> = {}
): FormStateReturn<T> => {
  const fullConfig: FormStateConfig = { ...DEFAULT_CONFIG, ...config };
  // const { startAutoSave, stopAutoSave } = useAutoSave<T>();

  // ============================================================================
  // State Management
  // ============================================================================

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRecovered, setIsRecovered] = useState(false);
  const [history, setHistory] = useState<FormStateHistory<T>>({
    currentIndex: -1,
    states: [],
  });

  // ============================================================================
  // Refs for Stable References
  // ============================================================================

  const initialDataRef = useRef<T | null>(null);
  const lastSavedDataRef = useRef<T | null>(null);
  const changeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const optimisticUpdateRef = useRef<{
    originalData: T;
    revertFn: () => void;
    description?: string;
  } | null>(null);

  // ============================================================================
  // Form State Persistence
  // ============================================================================

  /**
   * Save form state to localStorage
   */
  const saveFormState = useCallback((description?: string) => {
    if (!fullConfig.enablePersistence) return;

    try {
      const currentData = form.getValues();
      const snapshot: FormStateSnapshot<T> = {
        data: deepClone(currentData),
        timestamp: Date.now(),
        ...(description ? { description } : {}),
      };

      // Save to localStorage
      const storageKey = getStorageKey(fullConfig.formId);
      localStorage.setItem(storageKey, JSON.stringify(snapshot));

      // Update history
      setHistory(prev => {
        const newStates = prev.states.slice(0, prev.currentIndex + 1);
        newStates.push(snapshot);
        
        // Limit history size
        if (newStates.length > fullConfig.maxUndoStates) {
          newStates.shift();
        }

        return {
          currentIndex: newStates.length - 1,
          states: newStates,
        };
      });

    } catch (error) {
      console.warn('Failed to save form state:', error);
    }
  }, [form, fullConfig]);

  /**
   * Recover form state from localStorage
   */
  const recoverFormState = useCallback((): T | null => {
    if (!fullConfig.enablePersistence) return null;

    try {
      const storageKey = getStorageKey(fullConfig.formId);
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const snapshot: FormStateSnapshot<T> = JSON.parse(stored);
        setIsRecovered(true);
        return snapshot.data;
      }
    } catch (error) {
      console.warn('Failed to recover form state:', error);
    }

    return null;
  }, [fullConfig]);

  /**
   * Clear persisted form state
   */
  const clearPersistedState = useCallback(() => {
    try {
      const storageKey = getStorageKey(fullConfig.formId);
      localStorage.removeItem(storageKey);
      setIsRecovered(false);
      setHistory({ currentIndex: -1, states: [] });
    } catch (error) {
      console.warn('Failed to clear persisted state:', error);
    }
  }, [fullConfig]);

  // ============================================================================
  // Unsaved Changes Detection
  // ============================================================================

  /**
   * Mark form as saved
   */
  const markAsSaved = useCallback(() => {
    const currentData = form.getValues();
    lastSavedDataRef.current = deepClone(currentData);
    setHasUnsavedChanges(false);
  }, [form]);

  /**
   * Reset unsaved changes flag
   */
  const resetUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(false);
  }, []);

  /**
   * Check if form has been modified from initial state
   */
  const isModified = useCallback((): boolean => {
    if (!initialDataRef.current) return false;
    const currentData = form.getValues();
    return !deepEqual(initialDataRef.current, currentData);
  }, [form]);

  /**
   * Get changes from initial state
   */
  const getChanges = useCallback((): Partial<T> => {
    if (!initialDataRef.current) return {};
    const currentData = form.getValues();
    return getObjectDifferences(initialDataRef.current, currentData);
  }, [form]);

  // ============================================================================
  // History Management (Undo/Redo)
  // ============================================================================

  /**
   * Undo last change
   */
  const undo = useCallback((): T | null => {
    if (history.currentIndex <= 0) return null;

    const newIndex = history.currentIndex - 1;
    const targetState = history.states[newIndex];
    
    if (targetState) {
      form.reset(targetState.data);
      setHistory(prev => ({ ...prev, currentIndex: newIndex }));
      return targetState.data;
    }

    return null;
  }, [form, history]);

  /**
   * Redo last undone change
   */
  const redo = useCallback((): T | null => {
    if (history.currentIndex >= history.states.length - 1) return null;

    const newIndex = history.currentIndex + 1;
    const targetState = history.states[newIndex];
    
    if (targetState) {
      form.reset(targetState.data);
      setHistory(prev => ({ ...prev, currentIndex: newIndex }));
      return targetState.data;
    }

    return null;
  }, [form, history]);

  /**
   * Get form state at specific index
   */
  const getStateAt = useCallback((index: number): T | null => {
    if (index < 0 || index >= history.states.length) return null;
    return history.states[index].data;
  }, [history]);

  // ============================================================================
  // Optimistic Updates
  // ============================================================================

  /**
   * Create optimistic update
   */
  const createOptimisticUpdate = useCallback(async <R>(
    updateFn: (currentData: T) => T,
    revertFn: () => void,
    description?: string
  ): Promise<R> => {
    if (!fullConfig.enableOptimisticUpdates) {
      throw new Error('Optimistic updates are disabled');
    }

    const currentData = form.getValues();
    const originalData = deepClone(currentData);
    
    // Store optimistic update info
    optimisticUpdateRef.current = {
      originalData,
      revertFn,
      ...(description ? { description } : {}),
    };

    // Apply optimistic update
    const updatedData = updateFn(currentData);
    form.reset(updatedData);

    // Save state for potential rollback
    saveFormState(`Optimistic: ${description || 'Update'}`);

    // Return a promise that resolves when the update is committed or rejected
    return new Promise((resolve) => {
      // This would typically be resolved by the calling code after API success/failure
      // For now, we'll resolve immediately
      resolve({} as R);
    });
  }, [form, fullConfig, saveFormState]);

  /**
   * Commit optimistic update
   */
  const commitOptimisticUpdate = useCallback(() => {
    if (optimisticUpdateRef.current) {
      // Mark as saved since the optimistic update was successful
      markAsSaved();
      optimisticUpdateRef.current = null;
    }
  }, [markAsSaved]);

  /**
   * Rollback optimistic update
   */
  const rollbackOptimisticUpdate = useCallback(() => {
    if (optimisticUpdateRef.current) {
      const { originalData, revertFn } = optimisticUpdateRef.current;
      
      // Restore original data
      form.reset(originalData);
      
      // Call revert function if provided
      revertFn();
      
      // Clear optimistic update
      optimisticUpdateRef.current = null;
      
      // Save rollback state
      saveFormState('Rollback: Optimistic update failed');
    }
  }, [form, saveFormState]);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Initialize form state
   */
  useEffect(() => {
    const currentData = form.getValues();
    initialDataRef.current = deepClone(currentData);
    lastSavedDataRef.current = deepClone(currentData);

    // Start auto-save if enabled
    // if (fullConfig.formId && fullConfig.entityType) {
    //   startAutoSave(fullConfig.formId, fullConfig.entityType, () => form.getValues());
    // }

    // return () => {
    //   stopAutoSave();
    // };
  }, [form, fullConfig]);

  /**
   * Watch for form changes
   */
  useEffect(() => {
    if (!fullConfig.enableUnsavedChanges) return;

    const subscription = form.watch((data) => {
      // Debounce change detection
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }

      changeTimeoutRef.current = setTimeout(() => {
        if (lastSavedDataRef.current && !deepEqual(lastSavedDataRef.current, data)) {
          setHasUnsavedChanges(true);
        }
      }, fullConfig.changeDebounceDelay);
    });

    return () => {
      subscription.unsubscribe();
      if (changeTimeoutRef.current) {
        clearTimeout(changeTimeoutRef.current);
      }
    };
  }, [form, fullConfig]);

  /**
   * Handle page visibility changes
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasUnsavedChanges) {
        // Save state when page becomes hidden
        saveFormState('Auto-save on page hide');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasUnsavedChanges, saveFormState]);

  /**
   * Handle beforeunload event
   */
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
      return undefined;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // ============================================================================
  // Return Value
  // ============================================================================

  return {
    hasUnsavedChanges,
    isRecovered,
    history,
    canUndo: history.currentIndex > 0,
    canRedo: history.currentIndex < history.states.length - 1,
    saveFormState,
    recoverFormState,
    clearPersistedState,
    markAsSaved,
    resetUnsavedChanges,
    undo,
    redo,
    getStateAt,
    createOptimisticUpdate,
    commitOptimisticUpdate,
    rollbackOptimisticUpdate,
    isModified,
    getChanges,
  };
};

export default useFormState;