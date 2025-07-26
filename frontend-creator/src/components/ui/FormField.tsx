// frontend-creator/src/components/ui/FormField.tsx
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
 * A comprehensive form field component that wraps a base `Input` to provide
 * automatic validation feedback (success/error icons) and consistent styling.
 *
 * It's designed to be a drop-in replacement for a standard `<input>`, accepting all
 * standard input attributes. It should be used with a form management library
 * like `react-hook-form` which provides the `error` and `isValid` states.
 *
 * This component uses `React.forwardRef` to correctly pass a `ref` to the
 * underlying `Input` element, making it fully compatible with `react-hook-form`'s `register`.
 *
 * @param label - Text label displayed above the input field.
 * @param error - An error message. If provided, the input border will turn red and an error icon will be displayed.
 * @param helperText - Additional text displayed below the input field for guidance (e.g., character limits, format requirements).
 * @param leftIcon - An icon to display on the left side of the input.
 * @param rightIcon - An icon to display on the right side. This will be overridden by validation icons unless `showValidationIcon` is false.
 * @param fullWidth - If true, the input will take the full width of its container.
 * @param isRequired - If true, adds a visual indicator (e.g., an asterisk) to the label.
 * @param isValid=false - If true and an `error` is NOT present, the input border will turn green and a success icon will be displayed. Note: Success icon only appears when the field has a non-empty value.
 * @param showValidationIcon=true - If false, the automatic success/error icons will not be shown, and `rightIcon` will be displayed instead.
 * @param validationMessage - A message specifically for validation, which might be displayed differently from a general `helperText`.
 * @param interactiveRightIcon - If true, makes the right icon interactive (clickable).
 *
 * @example
 * // Basic usage with react-hook-form
 * const { register, formState: { errors, touchedFields } } = useForm();
 *
 * return (
 *   <FormField
 *     label="Course Name"
 *     isRequired
 *     error={errors.courseName?.message}
 *     isValid={touchedFields.courseName && !errors.courseName}
 *     helperText="Display name for the course (max 100 characters)"
 *     maxLength={100}
 *     fullWidth
 *     {...register('courseName')}
 *   />
 * );
 *
 * @example
 * // With datalist for autocomplete functionality
 * <FormField
 *   label="Language"
 *   list="languages"
 *   placeholder="Search or enter language code"
 *   {...register('language')}
 * />
 * <datalist id="languages">
 *   <option value="en">English</option>
 *   <option value="es">Spanish</option>
 * </datalist>
 *
 * @example
 * // With Controller for complex validation logic
 * <Controller
 *   name="sourceLanguage"
 *   control={control}
 *   render={({ field }) => (
 *     <FormField
 *       {...field}
 *       label="Source Language"
 *       error={errors.sourceLanguage?.message}
 *       isValid={touchedFields.sourceLanguage && !errors.sourceLanguage && field.value?.trim().length > 0}
 *       showValidationIcon
 *     />
 *   )}
 * />
 *
 * @example
 * // Disabling validation icons to show custom right icon
 * <FormField
 *   label="Search"
 *   rightIcon={<SearchIcon />}
 *   showValidationIcon={false}
 *   interactiveRightIcon
 *   {...register('search')}
 * />
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