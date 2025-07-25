import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
import { 
  ValidationState, 
  createInitialValidationState, 
  validateField, 
  createDebouncedValidator,
  formatValidationError,
  createSubmissionHandlers,
  getSuccessMessage
} from '../utils/validation';

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  initialValues?: Partial<T>;
  onSubmit?: (data: T) => Promise<void> | void;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

interface UseFormValidationReturn<T> {
  values: Partial<T>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  
  // Field operations
  setValue: (field: keyof T, value: any) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  
  // Form operations
  handleChange: (field: keyof T) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: (field: keyof T) => (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleSubmit: (event: React.FormEvent) => void;
  reset: (newValues?: Partial<T>) => void;
  validate: (field?: keyof T) => Promise<boolean>;
  
  // Validation state
  getFieldError: (field: keyof T) => string | undefined;
  isFieldTouched: (field: keyof T) => boolean;
  isFieldValid: (field: keyof T) => boolean;
  
  // Success feedback
  showSuccess: (message?: string) => void;
  clearSuccess: () => void;
  successMessage: string | null;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  initialValues = {},
  onSubmit,
  onSuccess,
  onError,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [values, setValues] = useState<Partial<T>>(initialValues);
  const [validationState, setValidationState] = useState<ValidationState>(createInitialValidationState());
  const [isDirty, setIsDirty] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create debounced validator
  const debouncedValidate = useCallback(
    createDebouncedValidator(async (data: Partial<T>) => {
      try {
        await schema.parseAsync(data);
        return null;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = formatValidationError(error);
          return Object.keys(errors).length > 0 ? Object.values(errors)[0] : null;
        }
        return 'Validation error';
      }
    }, debounceMs),
    [schema, debounceMs]
  );

  // Validate entire form
  const validate = useCallback(async (field?: keyof T): Promise<boolean> => {
    if (field) {
      // Validate single field
      const fieldValue = values[field];
      const error = await validateField(schema, field as string, fieldValue, values);
      
      setValidationState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [field]: error || '',
        },
      }));
      
      return !error;
    } else {
      // Validate entire form
      try {
        await schema.parseAsync(values);
        setValidationState(prev => ({
          ...prev,
          errors: {},
          isValid: true,
        }));
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors = formatValidationError(error);
          setValidationState(prev => ({
            ...prev,
            errors,
            isValid: false,
          }));
        }
        return false;
      }
    }
  }, [schema, values]);

  // Real-time validation on value changes
  useEffect(() => {
    if (validateOnChange && isDirty) {
      const validateAsync = async () => {
        const errors = await debouncedValidate(values);
        if (errors) {
          setValidationState(prev => ({
            ...prev,
            errors: typeof errors === 'string' ? { general: errors } : errors,
            isValid: false,
          }));
        } else {
          setValidationState(prev => ({
            ...prev,
            errors: {},
            isValid: true,
          }));
        }
      };
      
      validateAsync();
    }
  }, [values, validateOnChange, isDirty, debouncedValidate]);

  // Field operations
  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setSuccessMessage(null); // Clear success message on change
    
    // Clear field error when user starts typing
    if (validationState.errors[field as string]) {
      setValidationState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [field]: '',
        },
      }));
    }
  }, [validationState.errors]);

  const setError = useCallback((field: keyof T, error: string) => {
    setValidationState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: error,
      },
      isValid: false,
    }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setValidationState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [field]: '',
      },
    }));
  }, []);

  const setTouched = useCallback((field: keyof T, touched = true) => {
    setValidationState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [field]: touched,
      },
    }));
  }, []);

  // Event handlers
  const handleChange = useCallback((field: keyof T) => {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { value, type, checked } = event.target as HTMLInputElement;
      const fieldValue = type === 'checkbox' ? checked : value;
      setValue(field, fieldValue);
    };
  }, [setValue]);

  const handleBlur = useCallback((field: keyof T) => {
    return async () => {
      setTouched(field, true);
      
      if (validateOnBlur) {
        await validate(field);
      }
    };
  }, [setTouched, validateOnBlur, validate]);

  // Form submission
  const submissionHandlers = createSubmissionHandlers(
    () => setValidationState(prev => ({ ...prev, isSubmitting: true })),
    () => setValidationState(prev => ({ ...prev, isSubmitting: false })),
    (data: T) => {
      setSuccessMessage(getSuccessMessage('create', 'item'));
      if (onSuccess) onSuccess(data);
    },
    (error: string) => {
      if (onError) onError(error);
    }
  );

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccessMessage(null);
    
    submissionHandlers.handleSubmissionStart();
    
    try {
      // Validate all fields
      const isValid = await validate();
      
      if (!isValid) {
        submissionHandlers.handleSubmissionEnd();
        return;
      }

      // Parse and submit data
      const validatedData = schema.parse(values) as T;
      
      if (onSubmit) {
        await onSubmit(validatedData);
        submissionHandlers.handleSubmissionSuccess(validatedData);
      }
    } catch (error: any) {
      submissionHandlers.handleSubmissionError(error);
    }
  }, [validate, schema, values, onSubmit, submissionHandlers]);

  // Reset form
  const reset = useCallback((newValues?: Partial<T>) => {
    const resetValues = newValues || initialValues;
    setValues(resetValues);
    setValidationState(createInitialValidationState());
    setIsDirty(false);
    setSuccessMessage(null);
  }, [initialValues]);

  // Helper functions
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    const error = validationState.errors[field as string];
    const isTouched = validationState.touched[field as string];
    return (isTouched && error) ? error : undefined;
  }, [validationState.errors, validationState.touched]);

  const isFieldTouched = useCallback((field: keyof T): boolean => {
    return !!validationState.touched[field as string];
  }, [validationState.touched]);

  const isFieldValid = useCallback((field: keyof T): boolean => {
    const error = validationState.errors[field as string];
    const isTouched = validationState.touched[field as string];
    return isTouched && !error;
  }, [validationState.errors, validationState.touched]);

  const showSuccess = useCallback((message?: string) => {
    setSuccessMessage(message || 'Operation completed successfully!');
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  return {
    values,
    errors: validationState.errors,
    touched: validationState.touched,
    isValid: validationState.isValid,
    isSubmitting: validationState.isSubmitting,
    isDirty,
    
    setValue,
    setError,
    clearError,
    setTouched,
    
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    validate,
    
    getFieldError,
    isFieldTouched,
    isFieldValid,
    
    showSuccess,
    clearSuccess,
    successMessage,
  };
}

export default useFormValidation;