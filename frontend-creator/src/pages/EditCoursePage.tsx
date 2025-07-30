import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';

import { EnhancedCourseForm } from '../components/forms/EnhancedCourseForm';
import { WithLoading } from '../components/ui/LoadingStateProvider';
import { PageErrorBoundary } from '../components/error/ErrorBoundaryWrapper';
import { useCourseQuery } from '../hooks/useCourses';
import { useEnhancedQuery } from '../hooks/useApiOperation';
import { Course } from '../utils/types';
import { CourseFormData } from '../utils/validation';
import { courseService } from '../services/courseService';

const EditCoursePage: React.FC = () => {
  const { t } = useTranslation();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  // Fetch course data for editing
  const courseQuery = useCourseQuery(courseId || '', !!courseId);
  const enhancedQuery = useEnhancedQuery(courseQuery, {
    context: 'course-edit',
    showErrorToast: true,
    maxRetries: 3,
  });
  
  const { data: course, isLoading, error } = enhancedQuery;

  const pageTitle = course 
    ? t('creator.pages.editCourse.title', 'Edit Course: {{courseName}}', { courseName: course.name })
    : t('creator.pages.editCourse.titleLoading', 'Edit Course');

  const handleSubmit = async (data: CourseFormData): Promise<Course> => {
    if (!courseId) {
      throw new Error('Course ID is required for updating');
    }

    // Transform the form data to match the API format
    const updateData = {
      name: data.name,
      description: data.description || '',
      isPublic: data.isPublic,
    };

    return courseService.updateCourse(courseId, updateData);
  };

  const handleSuccess = (updatedCourse: Course) => {
    // Navigate back to the course detail page after successful update
    navigate(`/courses/${updatedCourse.id}`, { 
      replace: true,
      state: { 
        message: t('creator.pages.editCourse.successMessage', 'Course updated successfully!'),
        type: 'success'
      }
    });
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
  if (isLoading || error || !course) {
    return (
      <Layout title={error ? t('creator.pages.editCourse.error', 'Course Not Found') : t('creator.pages.editCourse.loading', 'Loading Course...')}>
        <PageErrorBoundary>
          <WithLoading
            isLoading={isLoading}
            error={error}
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
            
            <EnhancedCourseForm 
              initialData={course}
              onSubmit={handleSubmit}
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </PageErrorBoundary>
      </Layout>
    </>
  );
};

export default EditCoursePage;