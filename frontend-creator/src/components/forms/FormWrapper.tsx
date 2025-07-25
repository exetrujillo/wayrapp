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
 * Wrapper component for forms with consistent styling and feedback handling
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