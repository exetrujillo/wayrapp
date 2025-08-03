import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Level } from '../../utils/types';
import { useLevelsQuery, useDeleteLevelMutation, useReorderLevelsMutation } from '../../hooks/useLevels';
import { ContentList } from './ContentList';
import { LevelCard } from './LevelCard';
import { DraggableLevelItem } from './DraggableLevelItem';
import { DroppableContainer } from './DroppableContainer';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Feedback } from '../ui/Feedback';
import { Button } from '../ui/Button';


interface LevelsSectionProps {
  courseId: string;
  selectedLevel?: string | undefined;
  onLevelSelect: (levelId: string) => void;
  onCreateLevel: () => void;
  onEditLevel: (level: Level) => void;
  onDeleteLevel: (level: Level) => void;
  enableDragDrop?: boolean;
  enableBulkOperations?: boolean;
}

/**
 * Enhanced section component for displaying and managing levels within a course
 * Features:
 * - Drag-and-drop reordering with Pragmatic Drag and Drop
 * - Bulk operations (delete, publish, etc.)
 * - Level-specific validation and error handling
 * - Integration with generic CRUD patterns
 * - Responsive design with mobile-friendly interactions
 */
export const LevelsSection: React.FC<LevelsSectionProps> = ({
  courseId,
  selectedLevel,
  onLevelSelect,
  onCreateLevel,
  onEditLevel,
  onDeleteLevel,
  enableDragDrop = true,
  enableBulkOperations = true,
}) => {
  const { t } = useTranslation();
  const [dragDisabled, setDragDisabled] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  
  // Use both existing hooks and new generic CRUD hooks
  const {
    data: levelsResponse,
    isLoading,
    error,
    refetch,
  } = useLevelsQuery(courseId);

  const deleteLevelMutation = useDeleteLevelMutation();
  const reorderLevelsMutation = useReorderLevelsMutation();

  const levels = useMemo(() => levelsResponse?.data || [], [levelsResponse?.data]);
  const pagination = levelsResponse?.meta || null;

  // Handle drag and drop reordering with Pragmatic Drag and Drop
  const handleReorder = useCallback(async (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) {
      return;
    }

    // Create new order array
    const reorderedLevels = [...levels];
    const [removed] = reorderedLevels.splice(startIndex, 1);
    reorderedLevels.splice(endIndex, 0, removed);

    // Update order values based on new positions
    const orderedIds = reorderedLevels.map(level => level.id);

    try {
      setDragDisabled(true);
      setReorderError(null);
      
      // SECURITY_AUDIT_TODO: Potential Insecure Direct Object Reference (IDOR) in reorder operation.
      // The reorder operation sends level IDs from client-side state without validating that all
      // levels actually belong to the specified courseId. A malicious user could manipulate the
      // frontend state to include level IDs from other courses, potentially causing unauthorized
      // modifications to course structures they don't have access to.
      // Recommendation: Ensure the backend API validates that all orderedIds belong to the specified
      // courseId and that the user has reorder permissions for that course before processing the operation.
      await reorderLevelsMutation.mutateAsync({
        courseId,
        orderedIds, // Hook expects camelCase, service handles snake_case conversion
      });
    } catch (error: any) {
      console.error('Failed to reorder levels:', error);
      setReorderError(error.message || t('creator.components.levelsSection.reorderError', 'Failed to reorder levels'));
      // Refetch to restore original order
      refetch();
    } finally {
      setDragDisabled(false);
    }
  }, [levels, courseId, reorderLevelsMutation, refetch, t]);

  const handleLevelView = (level: Level) => {
    // SECURITY_AUDIT_TODO: Potential Insecure Direct Object Reference (IDOR) in level selection.
    // The level selection uses level.id from client-side state without validating that the level
    // actually belongs to the current courseId. While this is primarily a navigation action,
    // it could lead to unauthorized access to level details if the frontend state is manipulated.
    // Recommendation: Add validation to ensure the selected level belongs to the current course
    // before allowing navigation, or ensure the backend validates access permissions.
    onLevelSelect(level.id);
  };

  // Handle bulk operations
  const handleBulkAction = async (action: string, selectedLevels: Level[]) => {
    if (action === 'delete') {
      // SECURITY_AUDIT_TODO: Potential for unauthorized bulk deletion without proper validation.
      // The bulk delete operation relies solely on client-side confirmation and doesn't validate
      // if the user has permission to delete all selected levels or if the levels belong to the
      // specified course. This could lead to unauthorized data deletion if the frontend state is
      // manipulated or if there are race conditions in the level data.
      // Recommendation: Add server-side validation to ensure all levels belong to the course and
      // the user has delete permissions for each level before processing the bulk operation.
      const confirmMessage = t('creator.components.levelsSection.bulkDeleteConfirm', 
        `Are you sure you want to delete ${selectedLevels.length} level(s)? This action cannot be undone.`
      );
      
      if (window.confirm(confirmMessage)) {
        try {
          // Delete levels sequentially to avoid overwhelming the server
          for (const level of selectedLevels) {
            // SECURITY_AUDIT_TODO: Potential Insecure Direct Object Reference (IDOR) in bulk operations.
            // Each level deletion uses level.id from client-side state without validating that the level
            // actually belongs to the specified courseId. A malicious user could manipulate the frontend
            // state to include level IDs from other courses they don't have access to.
            // Recommendation: Ensure the backend API validates that each level.id belongs to the specified
            // courseId and that the user has delete permissions for that specific course-level combination.
            await deleteLevelMutation.mutateAsync({
              courseId,
              id: level.id,
            });
          }
        } catch (error: any) {
          console.error('Failed to delete levels:', error);
        }
      }
    }
  };

  const handleSearch = (query: string) => {
    // TODO: Implement search functionality when backend supports it
    console.log('Search levels:', query);
  };

  const handlePageChange = (page: number) => {
    // TODO: Implement pagination when needed
    console.log('Change page:', page);
  };

  const renderLevelItem = (
    level: Level,
    isSelected: boolean,
    onSelect: (level: Level) => void,
    dragHandleProps?: any
  ) => (
    <LevelCard
      key={level.id}
      level={level}
      isSelected={selectedLevel === level.id || isSelected}
      onSelect={onSelect}
      onView={handleLevelView}
      onEdit={onEditLevel}
      onDelete={onDeleteLevel}
      showSelection={enableBulkOperations}
      showActions={true}
      enableDragHandle={enableDragDrop}
      dragHandleProps={dragHandleProps}
    />
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Feedback
        type="error"
        message={error.message || t('creator.components.levelsSection.loadError', 'Failed to load levels')}
        onDismiss={() => refetch()}
      />
    );
  }

  // Show reorder error if it exists
  const errorToShow = reorderError || error?.message;

  return (
    <div className="levels-section">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          {t('creator.components.levelsSection.title', 'Course Levels')}
        </h2>
        {enableDragDrop && levels.length > 1 && (
          <p className="text-sm text-neutral-600 mt-1">
            {t('creator.components.levelsSection.dragHint', 'Drag and drop to reorder levels')}
          </p>
        )}
      </div>

      {/* Error Display */}
      {errorToShow && (
        <Feedback
          type="error"
          message={errorToShow}
          onDismiss={() => {
            setReorderError(null);
            if (error) refetch();
          }}
          className="mb-4"
        />
      )}

      {/* Content */}
      {levels.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-12 text-center">
          <div className="text-neutral-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <p className="text-neutral-500 mb-4">
            {t('creator.components.levelsSection.noLevels', 'No levels found. Create your first level!')}
          </p>
          <Button
            onClick={onCreateLevel}
            variant="primary"
            size="md"
          >
            {t('creator.components.levelsSection.createFirst', 'Create First Level')}
          </Button>
        </div>
      ) : enableBulkOperations ? (
        // Use ContentList for bulk operations
        <ContentList<Level>
          data={levels}
          isLoading={isLoading}
          error={error}
          pagination={pagination}
          onSearch={handleSearch}
          onPageChange={handlePageChange}
          onBulkAction={handleBulkAction}
          renderItem={renderLevelItem}
          createButton={{
            label: t('creator.components.levelsSection.addLevel', 'Add Level'),
            onClick: onCreateLevel,
          }}
          bulkActions={[
            {
              id: 'delete',
              label: t('creator.components.levelsSection.bulkDelete', 'Delete Selected'),
              variant: 'outline',
              requiresConfirmation: true,
            },
          ]}
          searchPlaceholder={t('creator.components.levelsSection.searchPlaceholder', 'Search levels...')}
          emptyMessage={t('creator.components.levelsSection.noLevels', 'No levels found')}
          enableDragDrop={enableDragDrop}
          onDragEnd={handleReorder}
          dragDisabled={dragDisabled}
        />
      ) : enableDragDrop ? (
        // Drag and drop with Pragmatic Drag and Drop
        <DroppableContainer onReorder={handleReorder} className="space-y-4">
          {levels.map((level, index) => (
            <DraggableLevelItem
              key={level.id}
              level={level}
              index={index}
              isSelected={selectedLevel === level.id}
              onSelect={() => onLevelSelect(level.id)}
              onView={handleLevelView}
              onEdit={onEditLevel}
              onDelete={onDeleteLevel}
              showActions={true}
              showSelection={false}
              isDragDisabled={dragDisabled}
            />
          ))}
        </DroppableContainer>
      ) : (
        // Simple list without drag-and-drop or bulk operations
        <div className="space-y-4">
          {levels.map((level) => renderLevelItem(level, false, () => {}, undefined))}
        </div>
      )}
    </div>
  );
};

export default LevelsSection;