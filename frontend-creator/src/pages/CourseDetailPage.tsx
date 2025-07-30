import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';

import { Feedback } from '../components/ui';
import { PageErrorBoundary } from '../components/error/ErrorBoundaryWrapper';
import { WithLoading } from '../components/ui/LoadingStateProvider';
import { LevelsSection } from '../components/content/LevelsSection';
import { CreateOrEditLevelModal } from '../components/content/CreateOrEditLevelModal';
import { useCourseQuery } from '../hooks/useCourses';
import { useEnhancedQuery } from '../hooks/useApiOperation';
import { Level } from '../utils/types';

/**
 * Central CourseDetailPage hub that manages the entire course hierarchy
 * Features:
 * - Course header with metadata and edit options
 * - Hierarchical navigator with contextual sections
 * - Breadcrumb navigation for current selection
 * - Modal-based CRUD operations for all entities
 * - State management for current selection (level/section/module)
 * - URL synchronization for deep linking
 */
const CourseDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle navigation state messages (e.g., from course creation)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    if (location.state?.message) {
      setFeedback({
        type: location.state.type || 'success',
        message: location.state.message
      });
      // Clear the state to prevent showing the message on refresh
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, location.search, navigate]);

  // Fetch course data with enhanced error handling
  const courseQuery = useCourseQuery(courseId || '', !!courseId);
  const enhancedQuery = useEnhancedQuery(courseQuery, {
    context: 'course-detail',
    showErrorToast: true,
    maxRetries: 3,
  });
  
  const { data: course, isLoading, error } = enhancedQuery;

  // Modal states for CRUD operations
  const [levelModalOpen, setLevelModalOpen] = useState(false);

  // Edit states - store the entity being edited
  const [editingLevel, setEditingLevel] = useState<Level | undefined>();



  // Handle level selection - navigate to level detail page
  const handleLevelSelect = useCallback((levelId: string) => {
    navigate(`/courses/${course?.id}/levels/${levelId}`);
  }, [navigate, course?.id]);



  // Level modal handlers
  const handleCreateLevel = useCallback(() => {
    setEditingLevel(undefined);
    setLevelModalOpen(true);
  }, []);

  const handleEditLevel = useCallback((level: Level) => {
    setEditingLevel(level);
    setLevelModalOpen(true);
  }, []);

  const handleDeleteLevel = useCallback((level: Level) => {
    // TODO: Implement delete confirmation and API call
    console.log('Delete level:', level);
  }, []);



  // Modal close handlers
  const handleCloseLevelModal = useCallback(() => {
    setLevelModalOpen(false);
    setEditingLevel(undefined);
  }, []);

  // Success handlers for modal operations
  const handleLevelSuccess = useCallback(() => {
    // Modal will close automatically via onSuccess callback
    // TanStack Query will handle cache invalidation
  }, []);

  // Handle loading and error states
  if (isLoading || error || !course) {
    return (
      <Layout title={error ? t('creator.pages.courseDetail.error', 'Course Not Found') : t('creator.pages.courseDetail.loading', 'Loading Course...')}>
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

  const pageTitle = course.name;

  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <PageErrorBoundary>

          {/* Success/Error Feedback */}
          {feedback && (
            <div className="mb-6">
              <Feedback
                type={feedback.type}
                message={feedback.message}
                onDismiss={() => setFeedback(null)}
              />
            </div>
          )}

          {/* Course Header */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  {course.name}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-4">
                  <span>
                    {t('creator.course.sourceLanguage', 'Source')}: {course.sourceLanguage}
                  </span>
                  <span>→</span>
                  <span>
                    {t('creator.course.targetLanguage', 'Target')}: {course.targetLanguage}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.isPublic 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {course.isPublic 
                      ? t('creator.course.public', 'Public') 
                      : t('creator.course.private', 'Private')
                    }
                  </span>
                </div>
                {course.description && (
                  <p className="text-neutral-700">
                    {course.description}
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/courses/${course.id}/edit`)}
                  className="bg-neutral-100 text-neutral-700 px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors"
                >
                  {t('common.buttons.edit', 'Edit')}
                </button>
              </div>
            </div>
          </div>

          {/* Levels Management */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <LevelsSection
              courseId={course.id}
              selectedLevel={undefined}
              onLevelSelect={handleLevelSelect}
              onCreateLevel={handleCreateLevel}
              onEditLevel={handleEditLevel}
              onDeleteLevel={handleDeleteLevel}
            />
          </div>

          {/* Level Modal */}
          <CreateOrEditLevelModal
            isOpen={levelModalOpen}
            onClose={handleCloseLevelModal}
            courseId={course.id}
            {...(editingLevel && { initialData: editingLevel })}
            onSuccess={handleLevelSuccess}
          />
        </PageErrorBoundary>
      </Layout>
    </>
  );
};

export default CourseDetailPage;