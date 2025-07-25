import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import Breadcrumb from '../components/layout/Breadcrumb';
import { Feedback } from '../components/ui';
import { PageErrorBoundary } from '../components/error/ErrorBoundaryWrapper';
import { WithLoading } from '../components/ui/LoadingStateProvider';
import { HierarchicalNavigator } from '../components/content/HierarchicalNavigator';
import { CreateOrEditLevelModal } from '../components/content/CreateOrEditLevelModal';
import { CreateOrEditSectionModal } from '../components/content/CreateOrEditSectionModal';
import { CreateOrEditModuleModal } from '../components/content/CreateOrEditModuleModal';
import { CreateOrEditLessonModal } from '../components/content/CreateOrEditLessonModal';
import { useCourseQuery } from '../hooks/useCourses';
import { useEnhancedQuery } from '../hooks/useApiOperation';
import { Level, Section, Module, Lesson } from '../utils/types';

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
  const [searchParams, setSearchParams] = useSearchParams();

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

  // Selection state - synchronized with URL params
  const [selectedLevel, setSelectedLevel] = useState<string | undefined>(
    searchParams.get('level') || undefined
  );
  const [selectedSection, setSelectedSection] = useState<string | undefined>(
    searchParams.get('section') || undefined
  );
  const [selectedModule, setSelectedModule] = useState<string | undefined>(
    searchParams.get('module') || undefined
  );

  // Modal states for CRUD operations
  const [levelModalOpen, setLevelModalOpen] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);

  // Edit states - store the entity being edited
  const [editingLevel, setEditingLevel] = useState<Level | undefined>();
  const [editingSection, setEditingSection] = useState<Section | undefined>();
  const [editingModule, setEditingModule] = useState<Module | undefined>();
  const [editingLesson, setEditingLesson] = useState<Lesson | undefined>();

  // Sync URL params with state changes
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (selectedLevel) {
      params.set('level', selectedLevel);
    }
    if (selectedSection) {
      params.set('section', selectedSection);
    }
    if (selectedModule) {
      params.set('module', selectedModule);
    }

    // Only update URL if params have changed
    const currentParams = searchParams.toString();
    const newParams = params.toString();
    if (currentParams !== newParams) {
      setSearchParams(params, { replace: true });
    }
  }, [selectedLevel, selectedSection, selectedModule, searchParams, setSearchParams]);

  // Handle level selection
  const handleLevelSelect = useCallback((levelId: string) => {
    setSelectedLevel(levelId);
    // Clear child selections when parent changes
    setSelectedSection(undefined);
    setSelectedModule(undefined);
  }, []);

  // Handle section selection
  const handleSectionSelect = useCallback((sectionId: string) => {
    setSelectedSection(sectionId);
    // Clear child selections when parent changes
    setSelectedModule(undefined);
  }, []);

  // Handle module selection
  const handleModuleSelect = useCallback((moduleId: string) => {
    setSelectedModule(moduleId);
  }, []);

  // Handle lesson click - navigate to lesson detail page
  const handleLessonClick = useCallback((lessonId: string) => {
    navigate(`/lessons/${lessonId}`);
  }, [navigate]);

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

  // Section modal handlers
  const handleCreateSection = useCallback(() => {
    setEditingSection(undefined);
    setSectionModalOpen(true);
  }, []);

  const handleEditSection = useCallback((section: Section) => {
    setEditingSection(section);
    setSectionModalOpen(true);
  }, []);

  const handleDeleteSection = useCallback((section: Section) => {
    // TODO: Implement delete confirmation and API call
    console.log('Delete section:', section);
  }, []);

  // Module modal handlers
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

  // Lesson modal handlers
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

  // Modal close handlers
  const handleCloseLevelModal = useCallback(() => {
    setLevelModalOpen(false);
    setEditingLevel(undefined);
  }, []);

  const handleCloseSectionModal = useCallback(() => {
    setSectionModalOpen(false);
    setEditingSection(undefined);
  }, []);

  const handleCloseModuleModal = useCallback(() => {
    setModuleModalOpen(false);
    setEditingModule(undefined);
  }, []);

  const handleCloseLessonModal = useCallback(() => {
    setLessonModalOpen(false);
    setEditingLesson(undefined);
  }, []);

  // Success handlers for modal operations
  const handleLevelSuccess = useCallback(() => {
    // Modal will close automatically via onSuccess callback
    // TanStack Query will handle cache invalidation
  }, []);

  const handleSectionSuccess = useCallback(() => {
    // Modal will close automatically via onSuccess callback
    // TanStack Query will handle cache invalidation
  }, []);

  const handleModuleSuccess = useCallback(() => {
    // Modal will close automatically via onSuccess callback
    // TanStack Query will handle cache invalidation
  }, []);

  const handleLessonSuccess = useCallback(() => {
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
          {/* Breadcrumb Navigation */}
          <Breadcrumb title={pageTitle} />

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

          {/* Hierarchical Navigator */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">
              {t('creator.pages.courseDetail.courseStructure', 'Course Structure')}
            </h2>
            
            <HierarchicalNavigator
              courseId={course.id}
              {...(selectedLevel && { selectedLevel })}
              {...(selectedSection && { selectedSection })}
              {...(selectedModule && { selectedModule })}
              onLevelSelect={handleLevelSelect}
              onSectionSelect={handleSectionSelect}
              onModuleSelect={handleModuleSelect}
              onLessonClick={handleLessonClick}
              onCreateLevel={handleCreateLevel}
              onEditLevel={handleEditLevel}
              onDeleteLevel={handleDeleteLevel}
              onCreateSection={handleCreateSection}
              onEditSection={handleEditSection}
              onDeleteSection={handleDeleteSection}
              onCreateModule={handleCreateModule}
              onEditModule={handleEditModule}
              onDeleteModule={handleDeleteModule}
              onCreateLesson={handleCreateLesson}
              onEditLesson={handleEditLesson}
              onDeleteLesson={handleDeleteLesson}
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

          {/* Section Modal */}
          {selectedLevel && (
            <CreateOrEditSectionModal
              isOpen={sectionModalOpen}
              onClose={handleCloseSectionModal}
              levelId={selectedLevel}
              {...(editingSection && { initialData: editingSection })}
              onSuccess={handleSectionSuccess}
            />
          )}

          {/* Module Modal */}
          {selectedSection && (
            <CreateOrEditModuleModal
              isOpen={moduleModalOpen}
              onClose={handleCloseModuleModal}
              sectionId={selectedSection}
              {...(editingModule && { initialData: editingModule })}
              onSuccess={handleModuleSuccess}
            />
          )}

          {/* Lesson Modal */}
          {selectedModule && (
            <CreateOrEditLessonModal
              isOpen={lessonModalOpen}
              onClose={handleCloseLessonModal}
              moduleId={selectedModule}
              {...(editingLesson && { initialData: editingLesson })}
              onSuccess={handleLessonSuccess}
            />
          )}
        </PageErrorBoundary>
      </Layout>
    </>
  );
};

export default CourseDetailPage;