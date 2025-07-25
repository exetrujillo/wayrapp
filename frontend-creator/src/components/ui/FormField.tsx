import React, { forwardRef } from 'react';
import { Input } from './Input';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  isRequired?: boolean;
  isValid?: boolean | undefined;
  showValidationIcon?: boolean;
  validationMessage?: string;
  interactiveRightIcon?: boolean;
}

/**
 * Enhanced form field component with comprehensive validation feedback
 * Extends the base Input component with additional validation states
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    error, 
    isValid = false,
    showValidationIcon = true,
    validationMessage,
    rightIcon,
    ...props 
  }, ref) => {
    // Determine validation state and icon
    const getValidationIcon = () => {
      if (!showValidationIcon) return rightIcon;
      
      if (error) {
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-error" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          </svg>
        );
      }
      
      if (isValid && props.value && String(props.value).trim() !== '') {
        return (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-success" 
            viewBox="0 0 20 20" 
            fill="currentColor"
            aria-hidden="true"
          >
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          </svg>
        );
      }
      
      return rightIcon;
    };

    return (
      <Input
        ref={ref}
        error={error || undefined}
        isSuccess={isValid && !error}
        rightIcon={getValidationIcon()}
        {...props}
      />
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;