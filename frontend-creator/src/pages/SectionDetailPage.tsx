import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';

import { WithLoading } from '../components/ui/LoadingStateProvider';
import { PageErrorBoundary } from '../components/error/ErrorBoundaryWrapper';
import { ModulesSection } from '../components/content/ModulesSection';
import { CreateOrEditModuleModal } from '../components/content/CreateOrEditModuleModal';
import { useSectionQuery } from '../hooks/useSections';
import { useLevelQuery } from '../hooks/useLevels';
import { useCourseQuery } from '../hooks/useCourses';
import { useEnhancedQuery } from '../hooks/useApiOperation';
import { Module } from '../utils/types';

/**
 * Section detail page that shows modules within a specific section
 * Provides a dedicated page for managing modules within a section
 */
const SectionDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { courseId, levelId, sectionId } = useParams<{ 
    courseId: string; 
    levelId: string; 
    sectionId: string; 
  }>();
  const navigate = useNavigate();

  // Modal states
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | undefined>();

  // Fetch section, level, and course data
  const sectionQuery = useSectionQuery(sectionId || '', !!sectionId);
  const levelQuery = useLevelQuery(courseId || '', levelId || '', !!levelId && !!courseId);
  const courseQuery = useCourseQuery(courseId || '', !!courseId);
  
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
  
  const { data: section, isLoading: sectionLoading, error: sectionError } = enhancedSectionQuery;
  const { data: level, isLoading: levelLoading, error: levelError } = enhancedLevelQuery;
  const { data: course, isLoading: courseLoading, error: courseError } = enhancedCourseQuery;

  const isLoading = sectionLoading || levelLoading || courseLoading;
  const error = sectionError || levelError || courseError;

  // Module handlers
  const handleModuleSelect = useCallback((moduleId: string) => {
    navigate(`/courses/${courseId}/levels/${levelId}/sections/${sectionId}/modules/${moduleId}`);
  }, [navigate, courseId, levelId, sectionId]);

  const handleCreateModule = useCallback(() => {
    setEditingModule(undefined);
    setModuleModalOpen(true);
  }, []);

  const handleEditModule = useCallback((module: Module) => {
    setEditingModule(module);
    setModuleModalOpen(true);
  }, []);

  const handleDeleteModule = useCallback((module: Module) => {
    // TODO: Implement delete confirmation and API call
    console.log('Delete module:', module);
  }, []);

  const handleCloseModuleModal = useCallback(() => {
    setModuleModalOpen(false);
    setEditingModule(undefined);
  }, []);

  const handleModuleSuccess = useCallback(() => {
    // Modal will close automatically via onSuccess callback
    // TanStack Query will handle cache invalidation
  }, []);

  // Handle loading and error states
  if (isLoading || error || !section || !level || !course) {
    return (
      <Layout title={error ? t('creator.pages.sectionDetail.error', 'Section Not Found') : t('creator.pages.sectionDetail.loading', 'Loading Section...')}>
        <PageErrorBoundary>
          <WithLoading
            isLoading={isLoading}
            error={error}
            onRetry={() => {
              enhancedSectionQuery.retry();
              enhancedLevelQuery.retry();
              enhancedCourseQuery.retry();
            }}
            variant="page"
            message="Loading section details..."
            showNetworkStatus={true}
            retryCount={enhancedSectionQuery.retryCount + enhancedLevelQuery.retryCount + enhancedCourseQuery.retryCount}
            maxRetries={3}
          >
            <div className="min-h-64" />
          </WithLoading>
        </PageErrorBoundary>
      </Layout>
    );
  }

  const pageTitle = `${section.name} - ${level.name} - ${course.name}`;

  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <PageErrorBoundary>

          {/* Section Header */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center space-x-4 mb-2">
                  <button
                    onClick={() => navigate(`/courses/${courseId}/levels/${levelId}`)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    ← {t('creator.navigation.backToLevel', 'Back to Level')}
                  </button>
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                  {section.name}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-4">
                  <span>
                    {t('creator.section.order', 'Order')}: <span className="font-medium">{section.order}</span>
                  </span>
                  <span>
                    {t('creator.section.level', 'Level')}: <span className="font-medium">{level.name}</span>
                  </span>
                </div>
                <p className="text-neutral-600">
                  {t('creator.pages.sectionDetail.description', 'Manage modules within this section')}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/courses/${courseId}/levels/${levelId}/sections/${sectionId}/edit`)}
                  className="bg-neutral-100 text-neutral-700 px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors"
                >
                  {t('common.buttons.edit', 'Edit')}
                </button>
              </div>
            </div>
          </div>

          {/* Modules Management */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <ModulesSection
              sectionId={section.id}
              selectedModule={undefined}
              onModuleSelect={handleModuleSelect}
              onCreateModule={handleCreateModule}
              onEditModule={handleEditModule}
              onDeleteModule={handleDeleteModule}
            />
          </div>

          {/* Module Modal */}
          <CreateOrEditModuleModal
            isOpen={moduleModalOpen}
            onClose={handleCloseModuleModal}
            sectionId={section.id}
            {...(editingModule && { initialData: editingModule })}
            onSuccess={handleModuleSuccess}
          />
        </PageErrorBoundary>
      </Layout>
    </>
  );
};

export default SectionDetailPage;