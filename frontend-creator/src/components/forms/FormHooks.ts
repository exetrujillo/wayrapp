/**
 * Shared Form Hooks
 * 
 * This module provides reusable hooks for common form functionality
 * to eliminate duplicate logic across different form components.
 * 
 * @module FormHooks
 * @category Hooks
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldValues } from 'react-hook-form';

// ============================================================================
// Form State Hook
// ============================================================================

export interface FormState {
  isSubmitting: boolean;
  error: string | null;
  success: string | null;
}

export interface FormStateActions {
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  clearMessages: () => void;
  reset: () => void;
}

/**
 * Hook for managing common form state (loading, error, success)
 */
export const useFormState = (): [FormState, FormStateActions] => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const setSubmitting = useCallback((submitting: boolean) => {
    setIsSubmitting(submitting);
  }, []);

  const setErrorMessage = useCallback((errorMessage: string | null) => {
    setError(errorMessage);
    if (errorMessage) {
      setSuccess(null); // Clear success when setting error
    }
  }, []);

  const setSuccessMessage = useCallback((successMessage: string | null) => {
    setSuccess(successMessage);
    if (successMessage) {
      setError(null); // Clear error when setting success
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const reset = useCallback(() => {
    setIsSubmitting(false);
    setError(null);
    setSuccess(null);
  }, []);

  return [
    { isSubmitting, error, success },
    {
      setSubmitting,
      setError: setErrorMessage,
      setSuccess: setSuccessMessage,
      clearMessages,
      reset,
    },
  ];
};

// ============================================================================
// Form Submission Hook
// ============================================================================

export interface FormSubmissionOptions<T extends FieldValues> {
  onSubmit: (data: T) => Promise<any>;
  onSuccess?: (result: any, data: T) => void;
  onError?: (error: string, data: T) => void;
  successMessage?: string;
  errorMessage?: string;
  validateBeforeSubmit?: (data: T) => Promise<string | null>;
}

/**
 * Hook for handling form submission with consistent error handling and feedback
 */
export const useFormSubmission = <T extends FieldValues>({
  onSubmit,
  onSuccess,
  onError,
  successMessage,
  errorMessage,
  validateBeforeSubmit,
}: FormSubmissionOptions<T>) => {
  const { t } = useTranslation();
  const [formState, formActions] = useFormState();

  const handleSubmit = useCallback(async (data: T) => {
    console.log('🔧 FormHooks handleSubmit called with data:', data);
    formActions.setSubmitting(true);
    formActions.clearMessages();

    try {
      // Pre-submission validation
      if (validateBeforeSubmit) {
        console.log('🔧 Running pre-submission validation');
        const validationError = await validateBeforeSubmit(data);
        if (validationError) {
          throw new Error(validationError);
        }
      }

      // Submit the form
      console.log('🔧 Calling onSubmit with data:', data);
      const result = await onSubmit(data);

      // Handle success
      console.log('🔧 Form submission successful, result:', result);
      const defaultSuccessMessage = t('common.messages.success', 'Operation completed successfully');
      formActions.setSuccess(successMessage || defaultSuccessMessage);
      
      onSuccess?.(result, data);

      return result;
    } catch (error: any) {
      // Handle error
      console.error('🔧 Form submission failed:', error);
      const defaultErrorMessage = errorMessage || error.message || t('common.messages.error', 'An error occurred');
      formActions.setError(defaultErrorMessage);
      
      onError?.(defaultErrorMessage, data);
      
      throw error; // Re-throw for form-specific handling if needed
    } finally {
      formActions.setSubmitting(false);
    }
  }, [onSubmit, onSuccess, onError, successMessage, errorMessage, validateBeforeSubmit, formActions, t]);

  return {
    ...formState,
    ...formActions,
    handleSubmit,
  };
};

// ============================================================================
// Array Field Management Hook
// ============================================================================

export interface ArrayFieldActions<T> {
  add: (item?: T) => void;
  remove: (index: number) => void;
  update: (index: number, item: T) => void;
  move: (fromIndex: number, toIndex: number) => void;
  clear: () => void;
}

/**
 * Hook for managing array fields (hints, options, pairs, etc.)
 */
export const useArrayField = <T>(
  initialValue: T[] = [],
  onChange: (items: T[]) => void,
  createDefaultItem: () => T
): [T[], ArrayFieldActions<T>] => {
  const [items, setItems] = useState<T[]>(initialValue);

  const updateItems = useCallback((newItems: T[]) => {
    setItems(newItems);
    onChange(newItems);
  }, [onChange]);

  const add = useCallback((item?: T) => {
    const newItem = item || createDefaultItem();
    updateItems([...items, newItem]);
  }, [items, updateItems, createDefaultItem]);

  const remove = useCallback((index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    updateItems(newItems);
  }, [items, updateItems]);

  const update = useCallback((index: number, item: T) => {
    const newItems = [...items];
    newItems[index] = item;
    updateItems(newItems);
  }, [items, updateItems]);

  const move = useCallback((fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    updateItems(newItems);
  }, [items, updateItems]);

  const clear = useCallback(() => {
    updateItems([]);
  }, [updateItems]);

  return [
    items,
    { add, remove, update, move, clear }
  ];
};

// ============================================================================
// Form Validation Hook
// ============================================================================

export interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any, data: T) => string | null;
  dependencies?: (keyof T)[];
}

/**
 * Hook for custom form validation beyond schema validation
 */
export const useFormValidation = <T extends FieldValues>(
  rules: ValidationRule<T>[]
) => {
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof T, string>>>({});

  const validateField = useCallback((field: keyof T, value: any, data: T) => {
    const rule = rules.find(r => r.field === field);
    if (!rule) return null;

    return rule.validator(value, data);
  }, [rules]);

  const validateForm = useCallback((data: T): Partial<Record<keyof T, string>> => {
    const errors: Partial<Record<keyof T, string>> = {};

    rules.forEach(rule => {
      const value = data[rule.field];
      const error = rule.validator(value, data);
      if (error) {
        errors[rule.field] = error;
      }
    });

    setValidationErrors(errors);
    return errors;
  }, [rules]);

  const clearValidationErrors = useCallback(() => {
    setValidationErrors({});
  }, []);

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return {
    validationErrors,
    validateField,
    validateForm,
    clearValidationErrors,
    hasValidationErrors,
  };
};

// ============================================================================
// Auto-save Hook
// ============================================================================

export interface AutoSaveOptions<T> {
  enabled: boolean;
  interval?: number;
  onSave: (data: T) => Promise<void>;
  onSaveStatus?: (status: 'saving' | 'saved' | 'error') => void;
}

/**
 * Hook for auto-save functionality
 */
export const useAutoSave = <T extends FieldValues>(
  _watchedData: T,
  options: AutoSaveOptions<T>
) => {
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const performAutoSave = useCallback(async (data: T) => {
    if (!options.enabled) return;

    try {
      setAutoSaveStatus('saving');
      options.onSaveStatus?.('saving');
      
      await options.onSave(data);
      
      setAutoSaveStatus('saved');
      options.onSaveStatus?.('saved');

      // Reset status after 2 seconds
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
      options.onSaveStatus?.('error');
    }
  }, [options]);

  // Auto-save effect would be implemented in the component using this hook
  // to avoid dependency on useEffect here

  return {
    autoSaveStatus,
    performAutoSave,
  };
};

export default {
  useFormState,
  useFormSubmission,
  useArrayField,
  useFormValidation,
  useAutoSave,
};