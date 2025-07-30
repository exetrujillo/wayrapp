import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { WithLoading } from '../components/ui/LoadingStateProvider';
import { PageErrorBoundary } from '../components/error/ErrorBoundaryWrapper';
import { SectionsSection } from '../components/content/SectionsSection';
import { CreateOrEditSectionModal } from '../components/content/CreateOrEditSectionModal';
import { useLevelQuery } from '../hooks/useLevels';
import { useCourseQuery } from '../hooks/useCourses';
import { useDeleteSectionMutation } from '../hooks/useSections';
import { useEnhancedQuery } from '../hooks/useApiOperation';
import { Section } from '../utils/types';

/**
 * Level detail page that shows sections within a specific level
 * Provides a dedicated page for managing sections within a level
 */
const LevelDetailPage: React.FC = () => {
    const { t } = useTranslation();
    // SECURITY_AUDIT_TODO: Potential Insecure Direct Object Reference (IDOR) vulnerability
    // The courseId and levelId are extracted directly from URL parameters without client-side
    // authorization checks. While the backend should handle authorization, consider adding
    // client-side validation to verify the user has permission to access this specific course
    // and level before making API calls. This would provide better UX and prevent unauthorized
    // API requests. Consider using useAuth() to check user.role and ownership of the course.
    const { courseId, levelId } = useParams<{ courseId: string; levelId: string }>();
    const navigate = useNavigate();

    // Modal states
    const [sectionModalOpen, setSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<Section | undefined>();

    // Fetch level and course data
    // SECURITY_AUDIT_TODO: Missing role-based authorization checks
    // The component doesn't verify if the current user has the appropriate role (content_creator or admin)
    // to access and manage levels/sections. Consider adding useAuth() hook and checking user.role before
    // making API calls. While ProtectedRoute handles basic authentication, role-specific authorization
    // should be implemented at the component level for better security and user experience.
    const levelQuery = useLevelQuery(courseId || '', levelId || '', !!levelId && !!courseId);
    const courseQuery = useCourseQuery(courseId || '', !!courseId);

    // Mutations
    const deleteSectionMutation = useDeleteSectionMutation();

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

    const { data: level, isLoading: levelLoading, error: levelError } = enhancedLevelQuery;
    const { data: course, isLoading: courseLoading, error: courseError } = enhancedCourseQuery;

    const isLoading = levelLoading || courseLoading;
    const error = levelError || courseError;

    // Section handlers
    const handleSectionSelect = useCallback((sectionId: string) => {
        // SECURITY_AUDIT_TODO: Potential Insecure Direct Object Reference (IDOR) vulnerability
        // The navigation to section detail uses URL parameters directly without verifying the user
        // has permission to access the specific section. While the target page should handle
        // authorization, consider adding client-side checks to prevent navigation to unauthorized
        // resources and improve user experience.
        navigate(`/courses/${courseId}/levels/${levelId}/sections/${sectionId}`);
    }, [navigate, courseId, levelId]);

    const handleCreateSection = useCallback(() => {
        // SECURITY_AUDIT_TODO: Missing role-based authorization check for create operations
        // The create section handler doesn't verify if the current user has the appropriate role
        // (content_creator or admin) to create sections. Consider adding useAuth() hook and
        // checking user.role before allowing access to the create modal.
        setEditingSection(undefined);
        setSectionModalOpen(true);
    }, []);

    const handleEditSection = useCallback((section: Section) => {
        // SECURITY_AUDIT_TODO: Missing authorization check for edit operations
        // The edit handler doesn't verify if the current user has permission to edit this
        // specific section. Consider adding authorization checks to verify user.role and
        // ownership of the parent course/level before allowing access to the edit modal.
        setEditingSection(section);
        setSectionModalOpen(true);
    }, []);

    const handleDeleteSection = useCallback(async (section: Section) => {
        // SECURITY_AUDIT_TODO: Missing authorization check for delete operations
        // The delete handler doesn't verify if the current user has permission to delete this
        // specific section. Consider adding authorization checks before allowing delete operations,
        // especially since delete operations are irreversible and high-risk. Verify user.role
        // and ownership of the parent course/level before proceeding with deletion.

        // SECURITY_AUDIT_TODO: Missing confirmation dialog for destructive operations
        // Delete operations should always require explicit user confirmation to prevent
        // accidental data loss. Consider implementing a confirmation modal or dialog
        // before executing the delete mutation.

        try {
            await deleteSectionMutation.mutateAsync({
                levelId: section.levelId,
                id: section.id
            });
            // Success feedback will be handled by the mutation's onSuccess callback
        } catch (error) {
            // Error feedback will be handled by the mutation's onError callback
            console.error('Failed to delete section:', error);
        }
    }, [deleteSectionMutation]);

    const handleCloseSectionModal = useCallback(() => {
        setSectionModalOpen(false);
        setEditingSection(undefined);
    }, []);

    const handleSectionSuccess = useCallback(() => {
        // Modal will close automatically via onSuccess callback
        // TanStack Query will handle cache invalidation
    }, []);

    // Handle loading and error states
    if (isLoading || error || !level || !course) {
        return (
            <Layout title={error ? t('creator.pages.levelDetail.error', 'Level Not Found') : t('creator.pages.levelDetail.loading', 'Loading Level...')}>
                <PageErrorBoundary>
                    <WithLoading
                        isLoading={isLoading}
                        error={error}
                        onRetry={() => {
                            enhancedLevelQuery.retry();
                            enhancedCourseQuery.retry();
                        }}
                        variant="page"
                        message="Loading level details..."
                        showNetworkStatus={true}
                        retryCount={enhancedLevelQuery.retryCount + enhancedCourseQuery.retryCount}
                        maxRetries={3}
                    >
                        <div className="min-h-64" />
                    </WithLoading>
                </PageErrorBoundary>
            </Layout>
        );
    }

    const pageTitle = `${level.name} - ${course.name}`;

    return (
        <>
            <PageTitle title={pageTitle} />
            <Layout title={pageTitle}>
                <PageErrorBoundary>

                    {/* Level Header */}
                    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center space-x-4 mb-2">
                                    <button
                                        onClick={() => navigate(`/courses/${courseId}`)}
                                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                    >
                                        ← {t('creator.navigation.backToCourse', 'Back to Course')}
                                    </button>
                                </div>
                                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                                    {level.name}
                                </h1>
                                <div className="flex items-center space-x-4 text-sm text-neutral-600 mb-4">
                                    <span>
                                        {t('creator.level.code', 'Code')}: <span className="font-medium">{level.code}</span>
                                    </span>
                                    <span>
                                        {t('creator.level.order', 'Order')}: <span className="font-medium">{level.order}</span>
                                    </span>
                                </div>
                                <p className="text-neutral-600">
                                    {t('creator.pages.levelDetail.description', 'Manage sections within this level')}
                                </p>
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => navigate(`/courses/${courseId}/levels/${levelId}/edit`)}
                                    className="bg-neutral-100 text-neutral-700 px-4 py-2 rounded-md hover:bg-neutral-200 transition-colors"
                                >
                                    {t('common.buttons.edit', 'Edit')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sections Management */}
                    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
                        <SectionsSection
                            levelId={level.id}
                            onSectionSelect={handleSectionSelect}
                            onCreateSection={handleCreateSection}
                            onEditSection={handleEditSection}
                            onDeleteSection={handleDeleteSection}
                        />
                    </div>

                    {/* Section Modal */}
                    <CreateOrEditSectionModal
                        isOpen={sectionModalOpen}
                        onClose={handleCloseSectionModal}
                        levelId={level.id}
                        {...(editingSection && { initialData: editingSection })}
                        onSuccess={handleSectionSuccess}
                    />
                </PageErrorBoundary>
            </Layout>
        </>
    );
};

export default LevelDetailPage;