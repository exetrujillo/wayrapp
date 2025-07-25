import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { ContentList, CourseCard } from '../components/content';

import { WithLoading } from '../components/ui/LoadingStateProvider';
import { useTranslation } from 'react-i18next';
import { useDeleteCourseMutation, useUpdateCourseMutation } from '../hooks/useCourses';
import { Course, PaginationParams } from '../utils/types';
import { useQuery } from '@tanstack/react-query';
import { courseService } from '../services/courseService';
import { queryKeys } from '../hooks/queryKeys';

const CoursesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageTitle = t('common.navigation.courses');

  const [currentParams, setCurrentParams] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    search: '',
  });

  // --- TEMPORARY DEBUGGING CODE ---
  // We are using the raw `useQuery` hook, bypassing any custom wrappers like `useEnhancedQuery`.
  const { data: paginatedResponse, isLoading, isError, error } = useQuery({
    queryKey: queryKeys.courses.lists(), // Use the standard query key
    queryFn: () => courseService.getCourses({ page: 1, limit: 10 }),
  });

  console.log('[CoursesPage Debug] Raw Query State:', { isLoading, isError, data: paginatedResponse });
  // --- END OF TEMPORARY DEBUGGING CODE ---

  const deleteCourseMutation = useDeleteCourseMutation();
  const updateCourseMutation = useUpdateCourseMutation();

  const coursesResponse = paginatedResponse;

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
        <WithLoading
          isLoading={isLoading}
          error={error}
          onRetry={() => { }}
          variant="page"
          message="Loading courses..."
          showNetworkStatus={true}
          retryCount={0}
          maxRetries={3}
        >
          <ContentList
            title={pageTitle}
            items={courses}
            isLoading={isLoading}
            error={error}
            pagination={pagination}
            onRefresh={() => { }}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onBulkAction={handleBulkAction}
            renderItem={renderCourseItem}
            retryCount={0}
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
      </Layout>
    </>
  );
};

export default CoursesPage;