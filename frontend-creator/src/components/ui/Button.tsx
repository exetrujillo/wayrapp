// frontend-creator/src/components/ui/Button.tsx
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean; // Alternative prop name for consistency
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * A versatile, accessible button component that serves as the primary interactive element throughout the application.
 * 
 * This is a foundational UI component that provides consistent styling, behavior, and accessibility features
 * across the entire creator platform. It supports multiple visual variants (primary, secondary, outline, text),
 * different sizes, loading states, and icon placement. The component extends native HTML button attributes
 * while adding custom styling through Tailwind CSS classes and maintaining full keyboard and screen reader
 * accessibility. It's used extensively throughout forms, modals, page actions, and navigation elements.
 * 
 * The component is used across critical user flows including course creation, lesson management, authentication,
 * error handling, and content management interfaces. It integrates seamlessly with form libraries like
 * react-hook-form and supports both controlled and uncontrolled usage patterns.
 * 
 * @param {ButtonProps} props - The button component props
 * @param {ButtonVariant} [props.variant='primary'] - The visual style variant of the button. 'primary' for main actions (blue background), 'secondary' for secondary actions (light gray), 'outline' for bordered buttons, 'text' for minimal text-only buttons
 * @param {ButtonSize} [props.size='md'] - The size of the button affecting padding and text size. 'sm' for compact buttons, 'md' for standard buttons, 'lg' for prominent buttons
 * @param {boolean} [props.isLoading=false] - When true, displays a loading spinner and disables the button. Primary loading state prop
 * @param {boolean} [props.loading=false] - Alternative loading prop name for consistency with different form libraries and components
 * @param {boolean} [props.fullWidth=false] - When true, the button expands to fill the full width of its container
 * @param {React.ReactNode} [props.leftIcon] - Optional icon or element to display on the left side of the button text
 * @param {React.ReactNode} [props.rightIcon] - Optional icon or element to display on the right side of the button text
 * @param {React.ReactNode} props.children - The button text or content to display. Required prop that defines what the user sees
 * @param {string} [props.className=''] - Additional CSS classes to apply to the button for custom styling
 * @param {boolean} [props.disabled] - When true, disables the button and applies disabled styling
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - The HTML button type attribute. Defaults to 'button' to prevent accidental form submissions, but can be set to 'submit' for form submission buttons
 * 
 * @example
 * // Primary action button (most common usage)
 * <Button variant="primary" onClick={handleSubmit}>
 *   Create Course
 * </Button>
 * 
 * @example
 * // Form submission button (type="submit" properly handled)
 * <Button 
 *   variant="primary" 
 *   isLoading={isSubmitting} 
 *   disabled={!isValid}
 *   type="submit"
 * >
 *   {isSubmitting ? 'Creating...' : 'Create Course'}
 * </Button>
 * 
 * @example
 * // Secondary action with icon
 * <Button 
 *   variant="outline" 
 *   leftIcon={<ArrowLeftIcon />}
 *   onClick={handleBack}
 * >
 *   Back to Lessons
 * </Button>
 * 
 * @example
 * // Full-width button in modal footer
 * <Button 
 *   variant="secondary" 
 *   fullWidth 
 *   onClick={onCancel}
 * >
 *   Cancel
 * </Button>
 * 
 * @example
 * // Small button with custom styling
 * <Button 
 *   variant="text" 
 *   size="sm"
 *   className="text-red-600 hover:text-red-700"
 *   onClick={handleDelete}
 * >
 *   Delete
 * </Button>
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) => {
  const isLoadingState = isLoading || loading;
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-component transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-primary-400 text-white hover:bg-primary-500 active:bg-primary-600 focus:ring-primary-500 focus:ring-opacity-50',
    secondary: 'bg-secondary-100 text-neutral-900 hover:bg-secondary-200 active:bg-secondary-300 focus:ring-secondary-200 focus:ring-opacity-50',
    outline: 'bg-transparent border border-primary-400 text-primary-400 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500',
    text: 'bg-transparent text-primary-400 hover:bg-primary-50 hover:text-primary-500 focus:ring-primary-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const disabledClass = disabled || isLoadingState ? 'opacity-70 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${disabledClass} ${className}`}
      disabled={disabled || isLoadingState}
      aria-disabled={disabled || isLoadingState}
      {...props}
    >
      {isLoadingState && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      <span>{children}</span>
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

export default Button;