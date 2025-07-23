import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseSchema, CourseFormData } from '../../utils/validation';
import { LANGUAGES } from '../../utils/constants';
import { courseService } from '../../services/courseService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import { CreateCourseRequest } from '@/utils/types';

interface CourseFormProps {
  onSuccess?: (course: any) => void;
  onCancel?: () => void;
}

export const CourseForm: React.FC<CourseFormProps> = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      source_language: '',
      target_language: '',
      description: undefined,
      is_public: false,
    },
  });

  const onSubmit: SubmitHandler<CourseFormData> = async (data) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      // Transform form data to match API expectations
      const courseData: CreateCourseRequest = {
        name: data.name,
        source_language: data.source_language,
        target_language: data.target_language,
        is_public: data.is_public,
        ...(data.id && { id: data.id }),
        ...(data.description && { description: data.description }),
      };

      const response = await courseService.createCourse(courseData);
      setFeedback({
        type: 'success',
        message: t('creator.forms.course.successMessage', 'Course created successfully!'),
      });
      reset();
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error: any) {
      setFeedback({
        type: 'error',
        message: error.message || t('common.messages.error', 'An error occurred'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">{t('creator.forms.course.title', 'Create Course')}</h2>

      {feedback && (
        <div className="mb-6">
          <Feedback
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Course ID */}
        <Input
          id="id"
          label={t('creator.forms.course.id', 'Course ID')}
          placeholder={t('creator.forms.course.idPlaceholder', 'e.g., basic-spanish')}
          {...register('id')}
          {...(errors.id?.message && { error: errors.id.message })}
          isRequired
          fullWidth
        />

        {/* Course Name */}
        <Input
          id="name"
          label={t('creator.forms.course.name', 'Course Name')}
          placeholder={t('creator.forms.course.namePlaceholder', 'e.g., Basic Spanish')}
          {...register('name')}
          {...(errors.name?.message && { error: errors.name.message })}
          isRequired
          fullWidth
        />

        {/* Source Language */}
        <div className="mb-4">
          <label htmlFor="source_language" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('creator.forms.course.sourceLanguage', 'Source Language')}
            <span className="text-error ml-1">*</span>
          </label>
          <Controller
            name="source_language"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <input
                  id="source_language"
                  list="source_languages"
                  className={`input w-full ${errors.source_language ? 'border-error focus:border-error focus:ring-error' : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'}`}
                  placeholder={t('creator.forms.course.languagePlaceholder', 'Search or enter BCP 47 code (e.g., en, es-MX)')}
                  {...field}
                />
                <datalist id="source_languages">
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </datalist>
                {errors.source_language && (
                  <p className="mt-1 text-sm text-error">
                    {errors.source_language.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        {/* Target Language */}
        <div className="mb-4">
          <label htmlFor="target_language" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('creator.forms.course.targetLanguage', 'Target Language')}
            <span className="text-error ml-1">*</span>
          </label>
          <Controller
            name="target_language"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <input
                  id="target_language"
                  list="target_languages"
                  className={`input w-full ${errors.target_language ? 'border-error focus:border-error focus:ring-error' : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'}`}
                  placeholder={t('creator.forms.course.languagePlaceholder', 'Search or enter BCP 47 code (e.g., en, es-MX)')}
                  {...field}
                />
                <datalist id="target_languages">
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </datalist>
                {errors.target_language && (
                  <p className="mt-1 text-sm text-error">
                    {errors.target_language.message}
                  </p>
                )}
              </div>
            )}
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('creator.forms.course.description', 'Description')}
          </label>
          <textarea
            id="description"
            className={`input w-full min-h-[100px] ${errors.description ? 'border-error focus:border-error focus:ring-error' : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'}`}
            placeholder={t('creator.forms.course.descriptionPlaceholder', 'Enter course description...')}
            {...register('description')}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-error">
              {errors.description.message}
            </p>
          )}
        </div>

        {/* Is Public */}
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            id="is_public"
            className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
            {...register('is_public')}
          />
          <label htmlFor="is_public" className="ml-2 block text-sm text-neutral-700">
            {t('creator.forms.course.isPublic', 'Make this course public')}
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            {t('common.buttons.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            {t('creator.forms.course.submit', 'Create Course')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;