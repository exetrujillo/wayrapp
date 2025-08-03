import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { Button } from '../components/ui/Button';
import { CourseCreationFormData, courseCreationSchema } from '../utils/validation';
import { courseService } from '../services/courseService';
import { LANGUAGES, getLanguageDisplayName } from '../utils/languages';
import { idValidationService } from '../services/idValidationService';
import { generateEntityId } from '../utils/idGenerator';

const CreateCoursePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedId, setGeneratedId] = useState<string>('');
  const [idValidationStatus, setIdValidationStatus] = useState<{
    isValidating: boolean;
    isAvailable: boolean | null;
    suggestedId?: string | undefined;
  }>({
    isValidating: false,
    isAvailable: null,
  });

  const pageTitle = t('creator.pages.createCourse.title', 'Create Course');

  const form = useForm<CourseCreationFormData>({
    resolver: zodResolver(courseCreationSchema),
    defaultValues: {
      name: '',
      sourceLanguage: 'en',
      targetLanguage: 'es',
      description: '',
      isPublic: false,
    },
  });

  const { register, handleSubmit, formState: { errors }, watch } = form;
  const watchedName = watch('name');

  // Auto-generate ID from course name
  useEffect(() => {
    const generateId = async () => {
      // Only validate when we have a meaningful course name
      if (!watchedName || watchedName.trim().length < 5) {
        setGeneratedId('');
        setIdValidationStatus({ isValidating: false, isAvailable: null });
        return;
      }

      // Check if the name looks complete (ends with space or has multiple words)
      const trimmedName = watchedName.trim();
      const words = trimmedName.split(/\s+/);
      
      // Only validate if:
      // - Name has 5+ characters AND
      // - (Has multiple words OR ends with space OR hasn't been typed for 1 second)
      if (trimmedName.length < 5 || (words.length === 1 && !trimmedName.endsWith(' '))) {
        // Generate preview ID without validation
        const previewId = generateEntityId(trimmedName, 'COURSE');
        setGeneratedId(previewId);
        setIdValidationStatus({ isValidating: false, isAvailable: null });
        return;
      }

      // Generate base ID
      const baseId = generateEntityId(trimmedName, 'COURSE');
      setGeneratedId(baseId);

      // Validate uniqueness
      setIdValidationStatus({ isValidating: true, isAvailable: null });

      try {
        const uniqueId = await idValidationService.generateUniqueCourseId(trimmedName);
        setGeneratedId(uniqueId);
        setIdValidationStatus({
          isValidating: false,
          isAvailable: true,
          suggestedId: uniqueId !== baseId ? uniqueId : undefined
        });
      } catch (error) {
        console.error('ID validation failed:', error);
        setIdValidationStatus({
          isValidating: false,
          isAvailable: false
        });
      }
    };

    // Increase debounce delay to 800ms for better UX
    const timeoutId = setTimeout(generateId, 800);
    return () => clearTimeout(timeoutId);
  }, [watchedName]);

  const onSubmit = async (data: CourseCreationFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Use the generated ID
      const courseData = {
        id: generatedId,
        name: data.name,
        source_language: data.sourceLanguage,
        target_language: data.targetLanguage,
        description: data.description || '',
        is_public: data.isPublic,
      };

      await courseService.createCourse(courseData);

      // Navigate to the courses list page after successful creation
      navigate('/courses', {
        replace: true,
        state: {
          message: t('creator.pages.createCourse.successMessage', 'Course created successfully!'),
          type: 'success'
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/courses');
  };

  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <p className="text-neutral-600">
              {t('creator.pages.createCourse.description', 'Create a new course to start building educational content for your students.')}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Course Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  type="text"
                  id="name"
                  placeholder="e.g., Spanish Basics"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="generated-id" className="block text-sm font-medium text-gray-700">
                  Generated Course ID
                </label>
                <div className="mt-1 relative">
                  <input
                    type="text"
                    id="generated-id"
                    value={generatedId}
                    readOnly
                    placeholder="ID will be generated from course name"
                    className="block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-600"
                  />
                  {idValidationStatus.isValidating && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                    </div>
                  )}
                  {!idValidationStatus.isValidating && idValidationStatus.isAvailable === true && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {!idValidationStatus.isValidating && idValidationStatus.isAvailable === false && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {idValidationStatus.suggestedId && (
                  <p className="mt-1 text-sm text-blue-600">
                    Using alternative ID: {idValidationStatus.suggestedId}
                  </p>
                )}
                {!generatedId && watchedName && watchedName.trim().length >= 5 && (
                  <p className="mt-1 text-sm text-gray-500">
                    Generating ID from course name...
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  The course ID is automatically generated from the course name and will be used in URLs.
                </p>
              </div>

              <div>
                <label htmlFor="sourceLanguage" className="block text-sm font-medium text-gray-700">
                  Source Language <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('sourceLanguage')}
                  id="sourceLanguage"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {getLanguageDisplayName(language)}
                    </option>
                  ))}
                </select>
                {errors.sourceLanguage && (
                  <p className="mt-1 text-sm text-red-600">{errors.sourceLanguage.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700">
                  Target Language <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('targetLanguage')}
                  id="targetLanguage"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  {LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {getLanguageDisplayName(language)}
                    </option>
                  ))}
                </select>
                {errors.targetLanguage && (
                  <p className="mt-1 text-sm text-red-600">{errors.targetLanguage.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={4}
                placeholder="Brief description of the course content and objectives"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            <div className="flex items-center">
              <input
                {...register('isPublic')}
                id="isPublic"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                Make course public
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
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
                {isSubmitting ? t('common.saving', 'Saving...') : t('common.create', 'Create')}
              </Button>
            </div>
          </form>
        </div>
      </Layout>
    </>
  );
};

export default CreateCoursePage;