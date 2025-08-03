import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { Button } from '../components/ui/Button';
import { WithLoading } from '../components/ui/LoadingStateProvider';
import { PageErrorBoundary } from '../components/error/ErrorBoundaryWrapper';
import { useCourseQuery } from '../hooks/useCourses';
import { useEnhancedQuery } from '../hooks/useApiOperation';
import { CourseFormData, courseSchema } from '../utils/validation';
import { courseService } from '../services/courseService';
import { LANGUAGES, getLanguageDisplayName } from '../utils/languages';

const EditCoursePage: React.FC = () => {
  const { t } = useTranslation();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch course data for editing
  const courseQuery = useCourseQuery(courseId || '', !!courseId);
  const enhancedQuery = useEnhancedQuery(courseQuery, {
    context: 'course-edit',
    showErrorToast: true,
    maxRetries: 3,
  });
  
  const { data: course, isLoading, error: fetchError } = enhancedQuery;

  const pageTitle = course 
    ? t('creator.pages.editCourse.title', 'Edit Course: {{courseName}}', { courseName: course.name })
    : t('creator.pages.editCourse.titleLoading', 'Edit Course');

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      id: course?.id || '',
      name: course?.name || '',
      sourceLanguage: course?.sourceLanguage || 'en',
      targetLanguage: course?.targetLanguage || 'es',
      description: course?.description || '',
      isPublic: course?.isPublic || false,
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = form;

  // Reset form when course data is loaded
  React.useEffect(() => {
    if (course) {
      reset({
        id: course.id,
        name: course.name,
        sourceLanguage: course.sourceLanguage,
        targetLanguage: course.targetLanguage,
        description: course.description || '',
        isPublic: course.isPublic,
      });
    }
  }, [course, reset]);

  const onSubmit = async (data: CourseFormData) => {
    if (!courseId) {
      setError('Course ID is required for updating');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Transform the form data to match the API format
      const updateData = {
        name: data.name,
        description: data.description || '',
        isPublic: data.isPublic,
      };

      await courseService.updateCourse(courseId, updateData);

      // Navigate back to the course detail page after successful update
      navigate(`/courses/${courseId}`, { 
        replace: true,
        state: { 
          message: t('creator.pages.editCourse.successMessage', 'Course updated successfully!'),
          type: 'success'
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to update course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Navigate back to course detail page
    if (courseId) {
      navigate(`/courses/${courseId}`);
    } else {
      navigate('/courses');
    }
  };

  // Handle loading and error states
  if (isLoading || fetchError || !course) {
    return (
      <Layout title={fetchError ? t('creator.pages.editCourse.error', 'Course Not Found') : t('creator.pages.editCourse.loading', 'Loading Course...')}>
        <PageErrorBoundary>
          <WithLoading
            isLoading={isLoading}
            error={fetchError}
            onRetry={enhancedQuery.retry}
            variant="page"
            message="Loading course details..."
            showNetworkStatus={true}
            retryCount={enhancedQuery.retryCount}
            maxRetries={3}
          >
            <div className="min-h-64" />
          </WithLoading>
        </PageErrorBoundary>
      </Layout>
    );
  }

  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <PageErrorBoundary>
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                {pageTitle}
              </h1>
              <p className="text-neutral-600">
                {t('creator.pages.editCourse.description', 'Update your course information and settings.')}
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
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="id" className="block text-sm font-medium text-neutral-700">
                    Course ID
                  </label>
                  <input
                    {...register('id')}
                    type="text"
                    id="id"
                    disabled
                    className="mt-1 block w-full rounded-md border-neutral-300 bg-neutral-50 shadow-sm text-neutral-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-neutral-500">
                    Course ID cannot be changed after creation.
                  </p>
                </div>

                <div>
                  <label htmlFor="sourceLanguage" className="block text-sm font-medium text-neutral-700">
                    Source Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('sourceLanguage')}
                    id="sourceLanguage"
                    className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
                  <label htmlFor="targetLanguage" className="block text-sm font-medium text-neutral-700">
                    Target Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('targetLanguage')}
                    id="targetLanguage"
                    className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={4}
                  placeholder="Brief description of the course content and objectives"
                  className="mt-1 block w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-neutral-900">
                  Make course public
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
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
                  {isSubmitting ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                </Button>
              </div>
            </form>
          </div>
        </PageErrorBoundary>
      </Layout>
    </>
  );
};

export default EditCoursePage;