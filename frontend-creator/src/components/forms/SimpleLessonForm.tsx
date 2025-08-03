import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { lessonSchema, LessonFormData } from '../../utils/validation';
import { Button } from '../ui/Button';

// Create a form schema without the ID field (similar to level and section forms)
const lessonFormSchema = lessonSchema;

// Form data type (lessons don't have ID in creation, just experiencePoints and order)
type LessonFormInput = LessonFormData;

interface SimpleLessonFormProps {
  initialData?: Partial<LessonFormInput>;
  onSubmit: (data: LessonFormInput) => Promise<any>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const SimpleLessonForm: React.FC<SimpleLessonFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<LessonFormInput>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      experiencePoints: initialData?.experiencePoints || 10,
      order: initialData?.order || 1,
    },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  const handleFormSubmit = async (data: LessonFormInput) => {
    setError(null);
    try {
      await onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'Failed to save lesson');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Lesson Name <span className="text-red-500">*</span>
          </label>
          <input
            {...register('name')}
            type="text"
            id="name"
            placeholder="e.g., Introduction to Greetings"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={3}
            placeholder="Optional description of what this lesson covers..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Optional description (max 500 characters)
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="experiencePoints" className="block text-sm font-medium text-gray-700">
              Experience Points <span className="text-red-500">*</span>
            </label>
            <input
              {...register('experiencePoints', { valueAsNumber: true })}
              type="number"
              id="experiencePoints"
              min="0"
              placeholder="10"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isSubmitting}
            />
            {errors.experiencePoints && (
              <p className="mt-1 text-sm text-red-600">{errors.experiencePoints.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Points awarded for completing this lesson (0 or more)
            </p>
          </div>

          <div>
            <label htmlFor="order" className="block text-sm font-medium text-gray-700">
              Order <span className="text-red-500">*</span>
            </label>
            <input
              {...register('order', { valueAsNumber: true })}
              type="number"
              id="order"
              min="1"
              placeholder="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isSubmitting}
            />
            {errors.order && (
              <p className="mt-1 text-sm text-red-600">{errors.order.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Display order (lower numbers appear first)
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t('common.cancel', 'Cancel')}
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {isSubmitting ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SimpleLessonForm;