import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseSchema, CourseFormData } from '../../utils/validation';
import { LANGUAGES } from '../../utils/constants';
import { useCreateCourseMutation } from '../../hooks/useCourses';
import { FormField } from '../ui/FormField';
import { Textarea } from '../ui/Textarea';

import { FormWrapper } from './FormWrapper';
import { CreateCourseRequest } from '@/utils/types';

interface CourseFormProps {
  onSuccess?: (course: any) => void;
  onCancel?: () => void;
}

export const CourseForm: React.FC<CourseFormProps> = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  const createCourseMutation = useCreateCourseMutation();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isValid, touchedFields },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      id: '',
      name: '',
      sourceLanguage: '',
      targetLanguage: '',
      description: undefined,
      isPublic: true,
    },
    mode: 'onChange',
  });

  const watchedValues = watch();
  const descriptionValue = watch('description');

  const onSubmit: SubmitHandler<CourseFormData> = async (data) => {
    setFeedback(null);

    // Transform form data to match API expectations (snake_case field names)
    const courseData: CreateCourseRequest = {
      id: data.id,
      name: data.name,
      source_language: data.sourceLanguage,
      target_language: data.targetLanguage,
      is_public: data.isPublic,
      ...(data.description && { description: data.description }),
    };

    createCourseMutation.mutate(courseData, {
      onSuccess: (response) => {
        setFeedback({
          type: 'success',
          message: t('creator.forms.course.successMessage', 'Course created successfully!'),
        });
        reset();
        if (onSuccess) {
          onSuccess(response);
        }
      },
      onError: (error: any) => {
        let errorMessage = t('common.messages.error', 'An error occurred');
        
        // Handle different types of errors
        if (error?.response?.status === 409) {
          errorMessage = t('creator.forms.course.errors.duplicate', 'A course with this ID already exists');
        } else if (error?.response?.status === 400) {
          errorMessage = t('creator.forms.course.errors.validation', 'Please check your input and try again');
        } else if (error?.response?.status === 401) {
          errorMessage = t('creator.forms.course.errors.unauthorized', 'You are not authorized to create courses');
        } else if (error?.response?.status >= 500) {
          errorMessage = t('creator.forms.course.errors.server', 'Server error. Please try again later');
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        setFeedback({
          type: 'error',
          message: errorMessage,
        });
      },
    });
  };

  const handleCancel = () => {
    reset();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <FormWrapper
      title={t('creator.forms.course.title', 'Create Course')}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={handleCancel}
      isSubmitting={createCourseMutation.isPending}
      isValid={isValid}
      submitText={createCourseMutation.isPending 
        ? t('creator.forms.course.submitting', 'Creating Course...') 
        : t('creator.forms.course.submit', 'Create Course')
      }
      cancelText={t('common.buttons.cancel', 'Cancel')}
      feedback={feedback}
      onFeedbackDismiss={() => setFeedback(null)}
    >
      {/* Course ID */}
      <FormField
        id="id"
        label={t('creator.forms.course.id', 'Course ID')}
        placeholder={t('creator.forms.course.idPlaceholder', 'e.g., basic-spanish')}
        helperText={t('creator.forms.course.idHelp', 'Unique identifier for the course (max 20 characters)')}
        {...register('id')}
        error={errors.id?.message || undefined}
        isRequired
        fullWidth
        maxLength={20}
        isValid={touchedFields.id && !errors.id && watchedValues.id?.trim().length > 0}
        showValidationIcon
      />

      {/* Course Name */}
      <FormField
        id="name"
        label={t('creator.forms.course.name', 'Course Name')}
        placeholder={t('creator.forms.course.namePlaceholder', 'e.g., Basic Spanish')}
        helperText={t('creator.forms.course.nameHelp', 'Display name for the course (max 100 characters)')}
        {...register('name')}
        error={errors.name?.message || undefined}
        isRequired
        fullWidth
        maxLength={100}
        isValid={touchedFields.name && !errors.name && watchedValues.name?.trim().length > 0}
        showValidationIcon
      />

      {/* Source Language */}
      <div className="mb-4">
        <label htmlFor="sourceLanguage" className="block text-sm font-medium text-neutral-700 mb-1">
          {t('creator.forms.course.sourceLanguage', 'Source Language')}
          <span className="text-error ml-1">*</span>
        </label>
        <Controller
          name="sourceLanguage"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <FormField
                id="sourceLanguage"
                list="source_languages"
                placeholder={t('creator.forms.course.languagePlaceholder', 'Search or enter BCP 47 code (e.g., en, es-MX)')}
                {...field}
                error={errors.sourceLanguage?.message || undefined}
                fullWidth
                maxLength={20}
                isValid={touchedFields.sourceLanguage && !errors.sourceLanguage && watchedValues.sourceLanguage?.trim().length > 0}
                showValidationIcon
              />
              <datalist id="source_languages">
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </datalist>
            </div>
          )}
        />
      </div>

      {/* Target Language */}
      <div className="mb-4">
        <label htmlFor="targetLanguage" className="block text-sm font-medium text-neutral-700 mb-1">
          {t('creator.forms.course.targetLanguage', 'Target Language')}
          <span className="text-error ml-1">*</span>
        </label>
        <Controller
          name="targetLanguage"
          control={control}
          render={({ field }) => (
            <div className="relative">
              <FormField
                id="targetLanguage"
                list="target_languages"
                placeholder={t('creator.forms.course.languagePlaceholder', 'Search or enter BCP 47 code (e.g., en, es-MX)')}
                {...field}
                error={errors.targetLanguage?.message || undefined}
                fullWidth
                maxLength={20}
                isValid={touchedFields.targetLanguage && !errors.targetLanguage && watchedValues.targetLanguage?.trim().length > 0}
                showValidationIcon
              />
              <datalist id="target_languages">
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </datalist>
            </div>
          )}
        />
      </div>

      {/* Description */}
      <Textarea
        id="description"
        label={t('creator.forms.course.description', 'Description')}
        placeholder={t('creator.forms.course.descriptionPlaceholder', 'Enter course description...')}
        {...register('description')}
        value={descriptionValue || ''}
        error={errors.description?.message || undefined}
        fullWidth
        maxLength={255}
        showCharCount
        minHeight="100px"
        isSuccess={!!(touchedFields.description && !errors.description && descriptionValue && descriptionValue.trim().length > 0)}
      />

      {/* Is Public */}
      <div className="mb-4 flex items-center">
        <input
          type="checkbox"
          id="isPublic"
          className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300 rounded"
          {...register('isPublic')}
        />
        <label htmlFor="isPublic" className="ml-2 block text-sm text-neutral-700">
          {t('creator.forms.course.isPublic', 'Make this course public')}
        </label>
      </div>
    </FormWrapper>
  );
};

export default CourseForm;