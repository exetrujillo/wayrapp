import React, { forwardRef, useState } from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | undefined;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  isSuccess?: boolean;
  isRequired?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    label, 
    error, 
    helperText, 
    options,
    placeholder,
    fullWidth = false, 
    className = '', 
    isSuccess = false,
    isRequired = false,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const getValidationStateClasses = () => {
      if (error) return 'border-error focus:border-error focus:ring-error';
      if (isSuccess) return 'border-success focus:border-success focus:ring-success';
      return 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500';
    };

    const selectClasses = `
      input
      pr-10
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

    const handleFocus = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(true);
      if (props.onFocus) props.onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setIsFocused(false);
      if (props.onBlur) props.onBlur(e);
    };

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={props.id} className={labelClasses}>
            {label}
            {isRequired && <span className="text-error ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select 
            ref={ref} 
            className={selectClasses}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={props.id ? `${props.id}-description` : undefined}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props} 
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option 
                key={option.value} 
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-neutral-400" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </div>
          
          {/* Success icon */}
          {isSuccess && (
            <div className="absolute inset-y-0 right-8 flex items-center pr-3 pointer-events-none text-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p 
            className={`mt-1 text-sm ${error ? 'text-error' : 'text-neutral-500'}`}
            id={props.id ? `${props.id}-description` : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;