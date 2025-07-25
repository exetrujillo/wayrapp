import { useState, useCallback } from 'react';
import { useForm, UseFormProps, FieldValues } from 'react-hook-form';
import { useFormErrorHandling } from './useEnhancedErrorHandling';
import { useApiErrorHandler } from '../contexts/ErrorContext';
import { useLoadingState } from '../components/ui/LoadingStateProvider';

interface FormErrorHandlingOptions<T extends FieldValues> extends UseFormProps<T> {
  onSubmit: (data: T) => Promise<any>;
  onSuccess?: (result: any, data: T) => void;
  onError?: (error: any, data: T) => void;
  showLoadingToast?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  loadingMessage?: string;
  successMessage?: string;
  context?: string;
  resetOnSuccess?: boolean;
  maxRetries?: number;
}

interface FormState {
  isSubmitting: boolean;
  submitError: any;
  hasSubmitError: boolean;
  canRetry: boolean;
  retryCount: number;
  lastSubmittedData: any;
}

/**
 * Enhanced form hook that combines react-hook-form with comprehensive error handling and loading states
 */
export const useFormWithErrorHandling = <T extends FieldValues>(
  options: FormErrorHandlingOptions<T>
) => {
  const {
    onSubmit,
    onSuccess,
    onError,
    showLoadingToast = false,
    showSuccessToast = true,
    showErrorToast = true,
    loadingMessage = 'Submitting...',
    successMessage = 'Form submitted successfully!',
    context = 'form-submission',
    resetOnSuccess = false,
    maxRetries = 3,
    ...formOptions
  } = options;

  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    submitError: null,
    hasSubmitError: false,
    canRetry: true,
    retryCount: 0,
    lastSubmittedData: null,
  });

  const form = useForm<T>(formOptions);
  const loadingState = useLoadingState();
  const { handleError, handleSuccess } = useApiErrorHandler();
  
  const errorHandling = useFormErrorHandling({
    maxRetries,
    context,
    onError: (error, attempt) => {
      setFormState(prev => ({
        ...prev,
        submitError: error,
        hasSubmitError: true,
        retryCount: attempt,
        canRetry: attempt < maxRetries,
      }));
    },
  });

  const handleSubmit = useCallback(async (data: T) => {
    setFormState(prev => ({
      ...prev,
      isSubmitting: true,
      submitError: null,
      hasSubmitError: false,
      lastSubmittedData: data,
    }));

    let loadingOperationId: string | undefined;

    try {
      // Start loading state
      if (showLoadingToast) {
        loadingOperationId = loadingState.startLoading(loadingMessage, {
          priority: 'high',
          cancellable: false,
        });
      }

      // Submit form with error handling
      const result = await errorHandling.executeWithErrorHandling(
        () => onSubmit(data),
        showLoadingToast
      );

      // Handle success
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        submitError: null,
        hasSubmitError: false,
        retryCount: 0,
      }));

      if (showSuccessToast) {
        handleSuccess(successMessage);
      }

      if (resetOnSuccess) {
        form.reset();
      }

      if (onSuccess) {
        onSuccess(result, data);
      }

      return result;
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        isSubmitting: false,
        submitError: error,
        hasSubmitError: true,
      }));

      // Handle form validation errors differently
      const fieldErrors = errorHandling.handleSubmissionError(error);
      
      // Set field errors in form
      if (fieldErrors && typeof fieldErrors === 'object') {
        Object.entries(fieldErrors).forEach(([field, message]) => {
          form.setError(field as any, {
            type: 'server',
            message: message as string,
          });
        });
      }

      if (showErrorToast && !fieldErrors) {
        handleError(error, () => retrySubmit(), context);
      }

      if (onError) {
        onError(error, data);
      }

      throw error;
    } finally {
      // Stop loading state
      if (loadingOperationId) {
        loadingState.stopLoading(loadingOperationId);
      }
    }
  }, [
    onSubmit,
    onSuccess,
    onError,
    showLoadingToast,
    showSuccessToast,
    showErrorToast,
    loadingMessage,
    successMessage,
    context,
    resetOnSuccess,
    loadingState,
    handleError,
    handleSuccess,
    errorHandling,
    form,
  ]);

  const retrySubmit = useCallback(async () => {
    if (!formState.canRetry || !formState.lastSubmittedData) {
      return;
    }

    try {
      await handleSubmit(formState.lastSubmittedData);
    } catch (error) {
      // Error is already handled by handleSubmit
    }
  }, [formState.canRetry, formState.lastSubmittedData, handleSubmit]);

  const resetSubmitState = useCallback(() => {
    setFormState({
      isSubmitting: false,
      submitError: null,
      hasSubmitError: false,
      canRetry: true,
      retryCount: 0,
      lastSubmittedData: null,
    });
    
    errorHandling.clearError();
  }, [errorHandling]);

  const clearSubmitError = useCallback(() => {
    setFormState(prev => ({
      ...prev,
      submitError: null,
      hasSubmitError: false,
    }));
    
    errorHandling.clearError();
  }, [errorHandling]);

  // Enhanced form submission handler
  const onSubmitWithErrorHandling = form.handleSubmit(handleSubmit);

  return {
    // React Hook Form
    ...form,
    
    // Enhanced submission
    handleSubmit: onSubmitWithErrorHandling,
    onSubmit: onSubmitWithErrorHandling,
    
    // Form state
    ...formState,
    
    // Enhanced error state
    isNetworkError: errorHandling.isNetworkError,
    errorMessage: errorHandling.getErrorMessage(),
    isWaitingForRetry: errorHandling.isWaitingForRetry,
    nextRetryIn: errorHandling.nextRetryIn,
    
    // Actions
    retrySubmit,
    resetSubmitState,
    clearSubmitError,
    
    // Utilities
    isFormValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    canSubmit: !formState.isSubmitting && form.formState.isValid,
  };
};

/**
 * Hook for handling file upload forms with progress tracking
 */
export const useFileUploadForm = <T extends FieldValues>(
  options: FormErrorHandlingOptions<T> & {
    onProgress?: (percentage: number) => void;
    maxFileSize?: number;
    allowedFileTypes?: string[];
  }
) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useFormWithErrorHandling({
    ...options,
    loadingMessage: 'Uploading file...',
    onSubmit: async (data) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      try {
        // Simulate progress updates if onProgress is provided
        if (options.onProgress) {
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              const newProgress = Math.min(prev + 10, 90);
              options.onProgress!(newProgress);
              return newProgress;
            });
          }, 200);
          
          const result = await options.onSubmit(data);
          
          clearInterval(progressInterval);
          setUploadProgress(100);
          options.onProgress(100);
          
          return result;
        } else {
          return await options.onSubmit(data);
        }
      } finally {
        setIsUploading(false);
      }
    },
  });

  const validateFile = useCallback((file: File) => {
    const errors: string[] = [];
    
    if (options.maxFileSize && file.size > options.maxFileSize) {
      errors.push(`File size must be less than ${options.maxFileSize / 1024 / 1024}MB`);
    }
    
    if (options.allowedFileTypes && !options.allowedFileTypes.includes(file.type)) {
      errors.push(`File type must be one of: ${options.allowedFileTypes.join(', ')}`);
    }
    
    return errors;
  }, [options.maxFileSize, options.allowedFileTypes]);

  return {
    ...form,
    
    // Upload state
    uploadProgress,
    isUploading,
    
    // File validation
    validateFile,
    
    // Enhanced submission state
    isSubmitting: form.isSubmitting || isUploading,
  };
};

/**
 * Hook for multi-step forms with error handling
 */
export const useMultiStepForm = <T extends FieldValues>(
  steps: Array<{
    name: string;
    validation?: any;
    onSubmit?: (data: Partial<T>) => Promise<any>;
  }>,
  options: Omit<FormErrorHandlingOptions<T>, 'onSubmit'> & {
    onFinalSubmit: (data: T) => Promise<any>;
  }
) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepData, setStepData] = useState<Partial<T>>({});
  
  const form = useFormWithErrorHandling({
    ...options,
    onSubmit: async (data) => {
      const currentStepConfig = steps[currentStep];
      
      // If current step has its own submit handler, use it
      if (currentStepConfig.onSubmit) {
        await currentStepConfig.onSubmit(data);
      }
      
      // Update step data
      const updatedStepData = { ...stepData, ...data };
      setStepData(updatedStepData);
      
      // If this is the last step, submit the entire form
      if (currentStep === steps.length - 1) {
        return await options.onFinalSubmit(updatedStepData as T);
      } else {
        // Move to next step
        setCurrentStep(prev => prev + 1);
        form.reset();
        return updatedStepData;
      }
    },
  });

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < steps.length) {
      setCurrentStep(step);
    }
  }, [steps.length]);

  const nextStep = useCallback(() => {
    goToStep(currentStep + 1);
  }, [currentStep, goToStep]);

  const prevStep = useCallback(() => {
    goToStep(currentStep - 1);
  }, [currentStep, goToStep]);

  const resetForm = useCallback(() => {
    setCurrentStep(0);
    setStepData({});
    form.reset();
    form.resetSubmitState();
  }, [form]);

  return {
    ...form,
    
    // Step management
    currentStep,
    totalSteps: steps.length,
    currentStepName: steps[currentStep]?.name,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
    stepData,
    
    // Step navigation
    goToStep,
    nextStep,
    prevStep,
    resetForm,
    
    // Progress
    progress: ((currentStep + 1) / steps.length) * 100,
  };
};

export default useFormWithErrorHandling;