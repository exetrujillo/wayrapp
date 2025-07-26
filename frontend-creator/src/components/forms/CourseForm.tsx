// frontend-creator/src/components/forms/CourseForm.tsx
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

/**
 * A comprehensive form component for creating new language learning courses in the content creator interface.
 * 
 * This component provides a complete course creation workflow with real-time validation, internationalization support,
 * and integrated error handling. It manages the entire course creation process from form input validation to API
 * submission, transforming form data to match backend API requirements (converting camelCase to snake_case field names).
 * The form includes fields for course identification, naming, language selection with BCP 47 compliance, optional
 * descriptions, and visibility settings.
 * 
 * The component integrates with the application's form validation system using Zod schemas, provides comprehensive
 * error handling for various HTTP status codes, and offers real-time feedback to users during the creation process.
 * It follows the application's design patterns by using the FormWrapper component for consistent styling and behavior
 * across all forms in the creator interface.
 * 
 * @param {CourseFormProps} props - The component props
 * @param {(course: any) => void} [props.onSuccess] - Optional callback function invoked when course creation succeeds. Receives the newly created course object as a parameter. Typically used by parent components to handle navigation or state updates after successful creation.
 * @param {() => void} [props.onCancel] - Optional callback function invoked when the user cancels the form. Usually handles navigation back to the previous page or closes a modal. If not provided, the cancel button functionality is disabled.
 * 
 * @example
 * // Basic usage in a course creation page
 * import { CourseForm } from '../components/forms/CourseForm';
 * import { useNavigate } from 'react-router-dom';
 * 
 * const CreateCoursePage = () => {
 *   const navigate = useNavigate();
 * 
 *   const handleCourseCreated = (newCourse) => {
 *     console.log('Course created:', newCourse);
 *     navigate(`/courses/${newCourse.id}`);
 *   };
 * 
 *   const handleCancel = () => {
 *     navigate('/courses');
 *   };
 * 
 *   return (
 *     <div className="max-w-2xl mx-auto p-6">
 *       <h1 className="text-2xl font-bold mb-6">Create New Course</h1>
 *       <CourseForm 
 *         onSuccess={handleCourseCreated}
 *         onCancel={handleCancel}
 *       />
 *     </div>
 *   );
 * };
 * 
 * @example
 * // Usage in a modal dialog
 * import { CourseForm } from '../components/forms/CourseForm';
 * import { Modal } from '../components/ui/Modal';
 * 
 * const CourseCreationModal = ({ isOpen, onClose, onCourseCreated }) => {
 *   return (
 *     <Modal isOpen={isOpen} onClose={onClose} title="Create New Course">
 *       <CourseForm 
 *         onSuccess={(course) => {
 *           onCourseCreated(course);
 *           onClose();
 *         }}
 *         onCancel={onClose}
 *       />
 *     </Modal>
 *   );
 * };
 * 
 * @example
 * // Minimal usage without callbacks (form handles its own state)
 * const SimpleCourseCreation = () => {
 *   return (
 *     <div className="container">
 *       <CourseForm />
 *     </div>
 *   );
 * };
 */
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