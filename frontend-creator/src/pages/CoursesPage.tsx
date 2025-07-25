import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { ContentList, CourseCard } from '../components/content';
import { PageErrorBoundary } from '../components/error/ErrorBoundaryWrapper';
import { WithLoading } from '../components/ui/LoadingStateProvider';
import { useTranslation } from 'react-i18next';
import { useCoursesQuery, useDeleteCourseMutation, useUpdateCourseMutation } from '../hooks/useCourses';
import { useEnhancedQuery } from '../hooks/useApiOperation';
import { Course, PaginationParams } from '../utils/types';

const CoursesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageTitle = t('common.navigation.courses');
  
  const [currentParams, setCurrentParams] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    search: '',
  });

  // Use TanStack Query for data fetching with enhanced error handling
  const coursesQuery = useCoursesQuery(currentParams);
  const enhancedQuery = useEnhancedQuery(coursesQuery, {
    context: 'courses-list',
    showErrorToast: true,
    maxRetries: 3,
  });
  
  const deleteCourseMutation = useDeleteCourseMutation();
  const updateCourseMutation = useUpdateCourseMutation();
  
  const { data: coursesResponse, isLoading, error } = enhancedQuery;

  const courses = coursesResponse?.data || [];
  const pagination = coursesResponse?.meta || null;

  // Handle search
  const handleSearch = useCallback((query: string) => {
    const newParams = { ...currentParams, search: query, page: 1 };
    setCurrentParams(newParams);
  }, [currentParams]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    const newParams = { ...currentParams, page };
    setCurrentParams(newParams);
  }, [currentParams]);

  // Handle course actions
  const handleViewCourse = (course: Course) => {
    navigate(`/courses/${course.id}`);
  };

  const handleEditCourse = (course: Course) => {
    navigate(`/courses/${course.id}/edit`);
  };

  const handleDeleteCourse = async (course: Course) => {
    deleteCourseMutation.mutate(course.id);
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string, selectedCourses: Course[]) => {
    if (action === 'delete') {
      // Delete courses sequentially to avoid overwhelming the server
      for (const course of selectedCourses) {
        deleteCourseMutation.mutate(course.id);
      }
    } else if (action === 'publish') {
      // Update courses to be public
      for (const course of selectedCourses) {
        updateCourseMutation.mutate({ 
          id: course.id, 
          courseData: { isPublic: true } 
        });
      }
    } else if (action === 'unpublish') {
      // Update courses to be private
      for (const course of selectedCourses) {
        updateCourseMutation.mutate({ 
          id: course.id, 
          courseData: { isPublic: false } 
        });
      }
    }
  };

  // Render course item
  const renderCourseItem = (course: Course, isSelected: boolean, onSelect: (course: Course) => void) => (
    <CourseCard
      key={course.id}
      course={course}
      isSelected={isSelected}
      onSelect={onSelect}
      onView={handleViewCourse}
      onEdit={handleEditCourse}
      onDelete={handleDeleteCourse}
      showSelection={true}
      showActions={true}
    />
  );

  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <PageErrorBoundary>
          <WithLoading
            isLoading={isLoading}
            error={error}
            onRetry={enhancedQuery.retry}
            variant="page"
            message="Loading courses..."
            showNetworkStatus={true}
            retryCount={enhancedQuery.retryCount}
            maxRetries={3}
          >
            <ContentList
              title={pageTitle}
              items={courses}
              isLoading={isLoading}
              error={error}
              pagination={pagination}
              onRefresh={enhancedQuery.refetch}
              onSearch={handleSearch}
              onPageChange={handlePageChange}
              onBulkAction={handleBulkAction}
              renderItem={renderCourseItem}
              retryCount={enhancedQuery.retryCount}
              maxRetries={3}
              showSkeletonOnLoad={true}
              skeletonCount={5}
              createButton={{
                label: t('creator.forms.course.create', 'Create Course'),
                onClick: () => navigate('/courses/create'),
              }}
              bulkActions={[
                {
                  id: 'publish',
                  label: t('creator.pages.courses.publish', 'Publish'),
                  variant: 'primary',
                },
                {
                  id: 'unpublish',
                  label: t('creator.pages.courses.unpublish', 'Unpublish'),
                  variant: 'outline',
                },
                {
                  id: 'delete',
                  label: t('common.buttons.delete', 'Delete'),
                  variant: 'outline',
                  requiresConfirmation: true,
                },
              ]}
              searchPlaceholder={t('creator.pages.courses.searchPlaceholder', 'Search courses...')}
              emptyMessage={t('creator.pages.courses.noCourses', 'No courses found. Create your first course!')}
              emptyAction={{
                label: t('creator.forms.course.create', 'Create Course'),
                onClick: () => navigate('/courses/create'),
              }}
            />
          </WithLoading>
        </PageErrorBoundary>
      </Layout>
    </>
  );
};

export default CoursesPage;