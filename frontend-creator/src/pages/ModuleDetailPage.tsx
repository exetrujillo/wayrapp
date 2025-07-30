import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';

import { WithLoading } from '../components/ui/LoadingStateProvider';
import { PageErrorBoundary } from '../components/error/ErrorBoundaryWrapper';
import { LessonsSection } from '../components/content/LessonsSection';
import { CreateOrEditLessonModal } from '../components/content/CreateOrEditLessonModal';
import { useModuleQuery } from '../hooks/useModules';
import { useSectionQuery } from '../hooks/useSections';
import { useLevelQuery } from '../hooks/useLevels';
import { useCourseQuery } from '../hooks/useCourses';
import { useEnhancedQuery } from '../hooks/useApiOperation';
import { Lesson } from '../utils/types';

/**
 * Module detail page that shows lessons within a specific module
 * Provides a dedicated page for managing lessons within a module
 */
const ModuleDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { courseId, levelId, sectionId, moduleId } = useParams<{ 
    courseId: string; 
    levelId: string; 
    sectionId: string; 
    moduleId: string; 
  }>();
  const navigate = useNavigate();

  // Modal states
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | undefined>();

  // Fetch module, section, level, and course data
  const moduleQuery = useModuleQuery(moduleId || '', !!moduleId);
  const sectionQuery = useSectionQuery(sectionId || '', !!sectionId);
  const levelQuery = useLevelQuery(courseId || '', levelId || '', !!levelId && !!courseId);
  const courseQuery = useCourseQuery(courseId || '', !!courseId);
  
  const enhancedModuleQuery = useEnhancedQuery(moduleQuery, {
    context: 'module-detail',
    showErrorToast: true,
    maxRetries: 3,
  });

  const enhancedSectionQuery = useEnhancedQuery(sectionQuery, {
    context: 'section-detail',
    showErrorToast: true,
    maxRetries: 3,
  });

  const enhancedLevelQuery = useEnhancedQuery(levelQuery, {
    context: 'level-detail',
    showErrorToast: true,
    maxRetries: 3,
  });

  const enhancedCourseQuery = useEnhancedQuery(courseQuery, {
    context: 'course-detail',
    showErrorToast: true,
    maxRetries: 3,
  });
  
  const { data: module, isLoading: moduleLoading, error: moduleError } = enhancedModuleQuery;
  const { data: section, isLoading: sectionLoading, error: sectionError } = enhancedSectionQuery;
  const { data: level, isLoading: levelLoading, error: levelError } = enhancedLevelQuery;
  const { data: course, isLoading: courseLoading, error: courseError } = enhancedCourseQuery;

  const isLoading = moduleLoading || sectionLoading || levelLoading || courseLoading;
  const error = moduleError || sectionError || levelError || courseError;

  // Lesson handlers
  const handleLessonClick = useCallback((lessonId: string) => {
    navigate(`/lessons/${lessonId}`);
  }, [navigate]);

  const handleCreateLesson = useCallback(() => {
    setEditingLesson(undefined);
    setLessonModalOpen(true);
  }, []);

  const handleEditLesson = useCallback((lesson: Lesson) => {
    setEditingLesson(lesson);
    setLessonModalOpen(true);
  }, []);

  const handleDeleteLesson = useCallback((lesson: Lesson) => {
    // TODO: Implement delete confirmation and API call
    console.log('Delete lesson:', lesson);
  }, []);

  const handleCloseLessonModal = useCallback(() => {
    setLessonModalOpen(false);
    setEditingLesson(undefined);
  }, []);

  const handleLessonSuccess = useCallback(() => {
    // Modal will close automatically via onSuccess callback
    // TanStack Query will handle cache invalidation
  }, []);

  // Handle loading and error states
  if (isLoading || error || !module || !section || !level || !course) {
    return (
      <Layout title={error ? t('creator.pages.moduleDetail.error', 'Module Not Found') : t('creator.pages.moduleDetail.loading', 'Loading Module...')}>
        <PageErrorBoundary>
          <WithLoading
            isLoading={isLoading}
            error={error}
            onRetry={() => {
              enhancedModuleQuery.retry();
              enhancedSectionQuery.retry();
              enhancedLevelQuery.retry();
              enhancedCourseQuery.retry();
            }}
            variant="page"
            message="Loading module details..."
            showNetworkStatus={true}
            retryCount={enhancedModuleQuery.retryCount + enhancedSectionQuery.retryCount + enhancedLevelQuery.retryCount + enhancedCourseQuery.retryCount}
            maxRetries={3}
          >
            <div className="min-h-64" />
          </WithLoading>
        </PageErrorBoundary>
      </Layout>
    );
  }

  const pageTitle = `${module.name} - ${section.name} - ${level.name} - ${course.name}`;

  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <PageErrorBoundary>

          {/* Module Header */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-4 mb-2">
                  <button
                    onClick={() => navigate(`/courses/${courseId}/levels/${levelId}/sections/${sectionId}`)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    ← {t('creator.navigation.backToSection', 'Back to Section')}
                  </button>
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  {module.name}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-4">
                  <span>
                    {t('creator.module.type', 'Type')}: <span className="font-medium">{module.moduleType}</span>
                  </span>
                  <span>
                    {t('creator.module.order', 'Order')}: <span className="font-medium">{module.order}</span>
                  </span>
                  <span>
                    {t('creator.module.section', 'Section')}: <span className="font-medium">{section.name}</span>
                  </span>
                </div>
                <p className="text-neutral-600">
                  {t('creator.pages.moduleDetail.description', 'Manage lessons within this module')}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/courses/${courseId}/levels/${levelId}/sections/${sectionId}/modules/${moduleId}/edit`)}
                  className="bg-neutral-100 text-neutral-700 px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors"
                >
                  {t('common.buttons.edit', 'Edit')}
                </button>
              </div>
            </div>
          </div>

          {/* Lessons Management */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <LessonsSection
              moduleId={module.id}
              onLessonClick={handleLessonClick}
              onCreateLesson={handleCreateLesson}
              onEditLesson={handleEditLesson}
              onDeleteLesson={handleDeleteLesson}
            />
          </div>

          {/* Lesson Modal */}
          <CreateOrEditLessonModal
            isOpen={lessonModalOpen}
            onClose={handleCloseLessonModal}
            moduleId={module.id}
            {...(editingLesson && { initialData: editingLesson })}
            onSuccess={handleLessonSuccess}
          />
        </PageErrorBoundary>
      </Layout>
    </>
  );
};

export default ModuleDetailPage;