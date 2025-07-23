import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { ContentList, CourseCard } from '../components/content';
import { useTranslation } from 'react-i18next';
import { courseService } from '../services/courseService';
import { Course, PaginationParams, PaginatedResponse } from '../utils/types';

const CoursesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageTitle = t('common.navigation.courses');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginatedResponse<Course>['meta'] | null>(null);
  const [currentParams, setCurrentParams] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    search: '',
  });

  // Fetch courses
  const fetchCourses = useCallback(async (params?: PaginationParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const finalParams = { ...currentParams, ...params };
      setCurrentParams(finalParams);
      
      const response = await courseService.getCourses(finalParams);
      setCourses(response.data);
      setPagination(response.meta);
    } catch (err: any) {
      setError(err.message || t('common.messages.error', 'An error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [currentParams, t]);

  // Initial load
  useEffect(() => {
    fetchCourses();
  }, []);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    fetchCourses({ ...currentParams, search: query, page: 1 });
  }, [currentParams, fetchCourses]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    fetchCourses({ ...currentParams, page });
  }, [currentParams, fetchCourses]);

  // Handle course actions
  const handleViewCourse = (course: Course) => {
    navigate(`/courses/${course.id}`);
  };

  const handleEditCourse = (course: Course) => {
    navigate(`/courses/${course.id}/edit`);
  };

  const handleDeleteCourse = async (course: Course) => {
    try {
      await courseService.deleteCourse(course.id);
      fetchCourses(); // Refresh the list
    } catch (err: any) {
      setError(err.message || t('common.messages.error', 'An error occurred'));
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action: string, selectedCourses: Course[]) => {
    try {
      if (action === 'delete') {
        await Promise.all(selectedCourses.map(course => courseService.deleteCourse(course.id)));
        fetchCourses(); // Refresh the list
      } else if (action === 'publish') {
        await Promise.all(selectedCourses.map(course => 
          courseService.updateCourse(course.id, { is_public: true })
        ));
        fetchCourses(); // Refresh the list
      } else if (action === 'unpublish') {
        await Promise.all(selectedCourses.map(course => 
          courseService.updateCourse(course.id, { is_public: false })
        ));
        fetchCourses(); // Refresh the list
      }
    } catch (err: any) {
      setError(err.message || t('common.messages.error', 'An error occurred'));
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
        <ContentList
          title={pageTitle}
          items={courses}
          isLoading={isLoading}
          error={error}
          pagination={pagination}
          onRefresh={fetchCourses}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
          onBulkAction={handleBulkAction}
          renderItem={renderCourseItem}
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
      </Layout>
    </>
  );
};

export default CoursesPage;