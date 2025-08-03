import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Section } from '../../utils/types';
import { useSectionsQuery, useReorderSectionsMutation } from '../../hooks/useSections';
import { SectionCard } from './SectionCard';
import { DroppableContainer } from './DroppableContainer';
import { DraggableSectionItem } from './DraggableSectionItem';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Feedback } from '../ui/Feedback';

interface SectionsSectionProps {
  levelId: string;
  selectedSection?: string | undefined;
  onSectionSelect: (sectionId: string) => void;
  onCreateSection: () => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
  enableDragDrop?: boolean;
}

/**
 * Section component for displaying and managing sections within a level
 * Uses SectionCard for consistent UI patterns
 * Features drag-and-drop reordering with Pragmatic Drag and Drop
 */
export const SectionsSection: React.FC<SectionsSectionProps> = ({
  levelId,
  selectedSection,
  onSectionSelect,
  onCreateSection,
  onEditSection,
  onDeleteSection,
  enableDragDrop = true,
}) => {
  const { t } = useTranslation();
  const [reorderError, setReorderError] = useState<string | null>(null);
  
  const {
    data: sectionsResponse,
    isLoading,
    error,
    refetch,
  } = useSectionsQuery(levelId);

  const reorderSectionsMutation = useReorderSectionsMutation();

  const sections = sectionsResponse?.data || [];
  const dragDisabled = reorderSectionsMutation?.isPending || isLoading;

  const handleSectionView = (section: Section) => {
    onSectionSelect(section.id);
  };

  // Handle drag and drop reordering with Pragmatic Drag and Drop
  const handleReorder = useCallback(async (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) {
      return;
    }

    setReorderError(null);

    try {
      // Create new order array
      const reorderedSections = [...sections];
      const [removed] = reorderedSections.splice(startIndex, 1);
      reorderedSections.splice(endIndex, 0, removed);

      // Extract section IDs in new order
      const section_ids = reorderedSections.map(section => section.id);

      // Execute reorder mutation
      await reorderSectionsMutation?.mutateAsync({
        levelId,
        sectionIds: section_ids, // Hook expects camelCase, service handles snake_case conversion
      });
    } catch (error: any) {
      console.error('Failed to reorder sections:', error);
      setReorderError(error.message || t('creator.components.sectionsSection.reorderError', 'Failed to reorder sections'));
      
      // Refetch to restore original order
      refetch();
    }
  }, [sections, levelId, reorderSectionsMutation, refetch, t]);

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
        message={error.message || t('creator.components.sectionsSection.loadError', 'Failed to load sections')}
        onDismiss={() => refetch()}
      />
    );
  }

  // Render section item for both drag-and-drop and regular lists
  const renderSectionItem = (section: Section, isDragging: boolean = false, dragHandleProps?: any) => (
    <SectionCard
      key={section.id}
      section={section}
      isSelected={selectedSection === section.id}
      onView={handleSectionView}
      onEdit={onEditSection}
      onDelete={onDeleteSection}
      showSelection={false}
      showActions={true}
      enableDragHandle={enableDragDrop}
      dragHandleProps={dragHandleProps}
      isDragging={isDragging}
    />
  );

  return (
    <div className="sections-section">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">
            {t('creator.components.sectionsSection.title', 'Level Sections')}
          </h3>
          {enableDragDrop && sections.length > 1 && (
            <p className="text-sm text-neutral-600 mt-1">
              {t('creator.components.sectionsSection.dragHint', 'Drag and drop to reorder sections')}
            </p>
          )}
        </div>
        <button
          onClick={onCreateSection}
          className="btn btn-primary btn-sm"
        >
          {t('creator.components.sectionsSection.addSection', 'Add Section')}
        </button>
      </div>

      {/* Reorder Error Display */}
      {reorderError && (
        <Feedback
          type="error"
          message={reorderError}
          onDismiss={() => setReorderError(null)}
          className="mb-4"
        />
      )}

      {sections.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="text-neutral-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14-7H5m14 14H5" />
            </svg>
          </div>
          <p className="text-neutral-500 mb-4">
            {t('creator.components.sectionsSection.noSections', 'No sections found. Create your first section!')}
          </p>
          <button
            onClick={onCreateSection}
            className="btn btn-primary btn-sm"
          >
            {t('creator.components.sectionsSection.createFirst', 'Create First Section')}
          </button>
        </div>
      ) : enableDragDrop ? (
        // Drag and drop enabled with Pragmatic Drag and Drop
        <DroppableContainer onReorder={handleReorder} className="space-y-3">
          {sections.map((section, index) => (
            <DraggableSectionItem
              key={section.id}
              section={section}
              index={index}
              isSelected={selectedSection === section.id}
              onSelect={() => onSectionSelect(section.id)}
              onView={handleSectionView}
              onEdit={onEditSection}
              onDelete={onDeleteSection}
              showActions={true}
              showSelection={false}
              isDragDisabled={dragDisabled}
            />
          ))}
        </DroppableContainer>
      ) : (
        // Simple list without drag-and-drop
        <div className="space-y-3">
          {sections.map((section) => renderSectionItem(section))}
        </div>
      )}
    </div>
  );
};

export default SectionsSection;