import React from 'react';
import { useTranslation } from 'react-i18next';
import { Section } from '../../utils/types';
import { useSectionsQuery } from '../../hooks/useSections';
import { SectionCard } from './SectionCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Feedback } from '../ui/Feedback';

interface SectionsSectionProps {
  levelId: string;
  selectedSection?: string | undefined;
  onSectionSelect: (sectionId: string) => void;
  onCreateSection: () => void;
  onEditSection: (section: Section) => void;
  onDeleteSection: (section: Section) => void;
}

/**
 * Section component for displaying and managing sections within a level
 * Uses SectionCard for consistent UI patterns
 */
export const SectionsSection: React.FC<SectionsSectionProps> = ({
  levelId,
  selectedSection,
  onSectionSelect,
  onCreateSection,
  onEditSection,
  onDeleteSection,
}) => {
  const { t } = useTranslation();
  
  const {
    data: sectionsResponse,
    isLoading,
    error,
    refetch,
  } = useSectionsQuery(levelId);

  const sections = sectionsResponse?.data || [];

  const handleSectionView = (section: Section) => {
    onSectionSelect(section.id);
  };

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

  return (
    <div className="sections-section">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-neutral-900">
          {t('creator.components.sectionsSection.title', 'Level Sections')}
        </h3>
        <button
          onClick={onCreateSection}
          className="btn btn-primary btn-sm"
        >
          {t('creator.components.sectionsSection.addSection', 'Add Section')}
        </button>
      </div>

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
      ) : (
        <div className="space-y-3">
          {sections.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              isSelected={selectedSection === section.id}
              onView={handleSectionView}
              onEdit={onEditSection}
              onDelete={onDeleteSection}
              showSelection={false}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SectionsSection;