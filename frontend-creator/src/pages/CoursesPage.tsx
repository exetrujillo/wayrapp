import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { CourseCard } from '../components/content/CourseCard';
import { Button } from '../components/ui/Button';
import { useCoursesQuery, useDeleteCourseMutation } from '../hooks/useCourses';
import { Course } from '../utils/types';
import { useTranslation } from 'react-i18next';

const CoursesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageTitle = t('common.navigation.courses');

  // State for search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Fetch courses with pagination and search
  const queryParams = {
    page: currentPage,
    limit: pageSize,
    ...(searchTerm && { search: searchTerm }),
  };
  const { data: coursesResponse, isLoading, error } = useCoursesQuery(queryParams);

  // Delete course mutation
  const deleteCourseMutation = useDeleteCourseMutation();

  // Handle course actions
  const handleAddCourse = () => {
    navigate('/courses/create');
  };

  const handleViewCourse = (course: Course) => {
    navigate(`/courses/${course.id}`);
  };

  const handleEditCourse = (course: Course) => {
    navigate(`/courses/${course.id}/edit`);
  };

  const handleDeleteCourse = async (course: Course) => {
    try {
      await deleteCourseMutation.mutateAsync(course.id);
    } catch (error) {
      console.error('Failed to delete course:', error);
    }
  };

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const courses = coursesResponse?.data || [];
  const totalPages = coursesResponse?.meta?.totalPages || 1;

  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <div className="space-y-6">
          {/* Header with search and add button */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder={t('creator.pages.courses.searchPlaceholder', 'Search courses...')}
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md leading-5 bg-white placeholder-neutral-500 focus:outline-none focus:placeholder-neutral-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <Button
              variant="primary"
              onClick={handleAddCourse}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              }
            >
              {t('creator.pages.courses.addCourse', 'Add Course')}
            </Button>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-neutral-600">{t('common.loading', 'Loading...')}</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-error-50 border border-error-200 rounded-md p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-error-800">
                    {t('creator.pages.courses.errorTitle', 'Error loading courses')}
                  </h3>
                  <p className="mt-1 text-sm text-error-700">
                    {t('creator.pages.courses.errorMessage', 'There was a problem loading your courses. Please try again.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Courses grid */}
          {!isLoading && !error && (
            <>
              {courses.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-neutral-900">
                    {searchTerm
                      ? t('creator.pages.courses.noSearchResults', 'No courses found')
                      : t('creator.pages.courses.noCourses', 'No courses yet')
                    }
                  </h3>
                  <p className="mt-2 text-neutral-500">
                    {searchTerm
                      ? t('creator.pages.courses.noSearchResultsDesc', 'Try adjusting your search terms.')
                      : t('creator.pages.courses.noCoursesDesc', 'Get started by creating your first course.')
                    }
                  </p>
                  {!searchTerm && (
                    <div className="mt-6">
                      <Button variant="primary" onClick={handleAddCourse}>
                        {t('creator.pages.courses.createFirstCourse', 'Create Your First Course')}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onView={handleViewCourse}
                      onEdit={handleEditCourse}
                      onDelete={handleDeleteCourse}
                      showActions={true}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-neutral-200 bg-white px-4 py-3 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      {t('common.pagination.previous', 'Previous')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      {t('common.pagination.next', 'Next')}
                    </Button>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-neutral-700">
                        {t('common.pagination.showing', 'Showing')}{' '}
                        <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>{' '}
                        {t('common.pagination.to', 'to')}{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pageSize, coursesResponse?.meta?.total || 0)}
                        </span>{' '}
                        {t('common.pagination.of', 'of')}{' '}
                        <span className="font-medium">{coursesResponse?.meta?.total || 0}</span>{' '}
                        {t('common.pagination.results', 'results')}
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="rounded-r-none"
                        >
                          {t('common.pagination.previous', 'Previous')}
                        </Button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={page === currentPage ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className="rounded-none"
                          >
                            {page}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="rounded-l-none"
                        >
                          {t('common.pagination.next', 'Next')}
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Layout>
    </>
  );
};

export default CoursesPage;