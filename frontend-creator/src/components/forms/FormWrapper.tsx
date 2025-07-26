// frontend-creator/src/components/forms/FormWrapper.tsx
import React from 'react';
import { Feedback } from '../ui/Feedback';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface FormWrapperProps {
  title?: string;
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isValid?: boolean;
  submitText?: string;
  cancelText?: string;
  feedback?: {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  } | null;
  onFeedbackDismiss?: (() => void) | undefined;
  className?: string;
  showActions?: boolean;
}

/**
 * Renders a standardized wrapper for forms, providing a consistent layout,
 * action buttons (Submit/Cancel), and integrated feedback/loading states.
 *
 * This component is responsible for the "shell" of the form, but not the form
 * fields themselves. Form fields should be passed as `children`. It is designed
 * to be used with form management libraries like `react-hook-form` and data
 * fetching libraries like `TanStack Query`.
 *
 * @param title - An optional title to be displayed at the top of the form card. If omitted, no title section is rendered.
 * @param children - The form fields and content to be rendered inside the `<form>` tag.
 * @param onSubmit - The function to call when the form is submitted. Typically, this will be the `handleSubmit` function from `react-hook-form`.
 * @param onCancel - An optional function to call when the "Cancel" button is clicked. If not provided, the button will not be rendered.
 * @param isSubmitting - When true, disables the action buttons and shows a loading spinner on the submit button. Connect this to local state or mutation `isPending`.
 * @param isValid - When false, the submit button will be disabled. Connect this to the `isValid` state from your form library.
 * @param submitText - The text to display on the submit button. Often dynamic based on create/update operations.
 * @param cancelText - The text to display on the cancel button.
 * @param feedback - An object to render a Feedback component at the top of the form. Pass `null` to hide it. Typically managed with local state.
 * @param onFeedbackDismiss - An optional function to call when the user dismisses the feedback message. Usually clears local feedback state.
 * @param className - Additional CSS classes to apply to the main wrapper div.
 * @param showActions - When false, the entire action button section (Submit/Cancel) will not be rendered. Useful for custom action layouts.
 *
 * @example
 * // Basic usage with react-hook-form and local state management
 * const { register, handleSubmit, formState: { isValid } } = useForm();
 * const [isSubmitting, setIsSubmitting] = useState(false);
 * const [feedback, setFeedback] = useState(null);
 *
 * const onSubmit = async (data) => {
 *   setIsSubmitting(true);
 *   try {
 *     await createCourse(data);
 *     setFeedback({ type: 'success', message: 'Course created successfully!' });
 *   } catch (error) {
 *     setFeedback({ type: 'error', message: error.message });
 *   } finally {
 *     setIsSubmitting(false);
 *   }
 * };
 *
 * return (
 *   <FormWrapper
 *     title="Create Course"
 *     onSubmit={handleSubmit(onSubmit)}
 *     onCancel={() => navigate('/courses')}
 *     isSubmitting={isSubmitting}
 *     isValid={isValid}
 *     submitText="Create Course"
 *     feedback={feedback}
 *     onFeedbackDismiss={() => setFeedback(null)}
 *   >
 *     <FormField {...register('name')} label="Course Name" />
 *   </FormWrapper>
 * );
 *
 * @example
 * // Form without title and with dynamic submit text
 * <FormWrapper
 *   onSubmit={handleSubmit(onSubmit)}
 *   onCancel={handleCancel}
 *   isSubmitting={isSubmitting}
 *   isValid={isValid}
 *   submitText={initialData?.id ? 'Update Level' : 'Create Level'}
 *   cancelText="Cancel"
 *   feedback={feedback}
 *   onFeedbackDismiss={() => setFeedback(null)}
 * >
 *   <FormField {...register('code')} label="Level Code" />
 * </FormWrapper>
 *
 * @example
 * // Custom action layout with showActions={false}
 * <div className="space-y-6">
 *   <FormProgress totalFields={5} validFields={3} />
 *   <FormWrapper
 *     onSubmit={handleSubmit(onSubmit)}
 *     showActions={false}
 *     feedback={feedback}
 *   >
 *     <FormField {...register('name')} />
 *     <ValidationStatus rules={validationRules} />
 *   </FormWrapper>
 * </div>
 *
 * @example
 * // With i18n translation integration
 * const { t } = useTranslation();
 * 
 * <FormWrapper
 *   title={t('creator.forms.course.title', 'Create Course')}
 *   submitText={isSubmitting 
 *     ? t('creator.forms.course.submitting', 'Creating...') 
 *     : t('creator.forms.course.submit', 'Create Course')
 *   }
 *   cancelText={t('common.buttons.cancel', 'Cancel')}
 *   feedback={feedback}
 * >
 *   {children}
 * </FormWrapper>
 */
export const FormWrapper: React.FC<FormWrapperProps> = ({
  title,
  children,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isValid = true,
  submitText = 'Submit',
  cancelText = 'Cancel',
  feedback,
  onFeedbackDismiss,
  className = '',
  showActions = true,
}) => {
  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      {title && (
        <h2 className="text-xl font-semibold mb-6">{title}</h2>
      )}

      {feedback && (
        <div className="mb-6">
          <Feedback
            type={feedback.type}
            message={feedback.message}
            onDismiss={onFeedbackDismiss || undefined}
          />
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {children}

        {showActions && (
          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {cancelText}
              </Button>
            )}
            <Button
              type="submit"
              variant="primary"
              disabled={!isValid || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                submitText
              )}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};

export default FormWrapper;