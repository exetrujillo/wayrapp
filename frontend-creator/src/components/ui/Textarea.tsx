import React, { forwardRef, useState } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | undefined;
  helperText?: string;
  fullWidth?: boolean;
  isSuccess?: boolean;
  isRequired?: boolean;
  showCharCount?: boolean;
  maxLength?: number;
  minHeight?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    label, 
    error, 
    helperText, 
    fullWidth = false, 
    className = '', 
    isSuccess = false,
    isRequired = false,
    showCharCount = false,
    maxLength,
    minHeight = '80px',
    value = '',
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const getValidationStateClasses = () => {
      if (error) return 'border-error focus:border-error focus:ring-error';
      if (isSuccess) return 'border-success focus:border-success focus:ring-success';
      return 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500';
    };

    const textareaClasses = `
      input
      resize-y
      ${getValidationStateClasses()}
      ${fullWidth ? 'w-full' : ''}
      ${isFocused ? 'ring-2 ring-opacity-20' : ''}
      ${className}
    `;

    const containerClasses = `
      ${fullWidth ? 'w-full' : ''}
      ${props.disabled ? 'opacity-70' : ''}
      mb-4
    `;

    const labelClasses = `
      block text-sm font-medium mb-1 transition-colors duration-200
      ${isFocused && !error ? 'text-primary-600' : 'text-neutral-700'}
      ${error ? 'text-error' : ''}
    `;

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true);
      if (props.onFocus) props.onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false);
      if (props.onBlur) props.onBlur(e);
    };

    const currentLength = String(value).length;
    const isNearLimit = maxLength && currentLength > maxLength * 0.8;
    const isOverLimit = maxLength && currentLength > maxLength;

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={props.id} className={labelClasses}>
            {label}
            {isRequired && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea 
            ref={ref} 
            className={textareaClasses}
            style={{ minHeight }}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={props.id ? `${props.id}-description` : undefined}
            onFocus={handleFocus}
            onBlur={handleBlur}
            value={value}
            maxLength={maxLength}
            {...props} 
          />
          {isSuccess && (
            <div className="absolute top-2 right-2 text-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Error, helper text, and character count */}
        <div className="flex justify-between items-start mt-1">
          <div className="flex-1">
            {(error || helperText) && (
              <p 
                className={`text-sm ${error ? 'text-error' : 'text-neutral-500'}`}
                id={props.id ? `${props.id}-description` : undefined}
              >
                {error || helperText}
              </p>
            )}
          </div>
          
          {showCharCount && maxLength && (
            <div className={`text-xs ml-2 ${
              isOverLimit ? 'text-error' : 
              isNearLimit ? 'text-warning' : 
              'text-neutral-500'
            }`}>
              {currentLength}/{maxLength}
            </div>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;