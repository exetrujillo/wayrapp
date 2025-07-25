import React from 'react';
import { useTranslation } from 'react-i18next';
import { Level } from '../../utils/types';
import { useLevelsQuery } from '../../hooks/useLevels';
// import { ContentList } from './ContentList'; // TODO: Use when implementing search/pagination
import { LevelCard } from './LevelCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Feedback } from '../ui/Feedback';

interface LevelsSectionProps {
  courseId: string;
  selectedLevel?: string | undefined;
  onLevelSelect: (levelId: string) => void;
  onCreateLevel: () => void;
  onEditLevel: (level: Level) => void;
  onDeleteLevel: (level: Level) => void;
}

/**
 * Section component for displaying and managing levels within a course
 * Uses ContentList with LevelCard for consistent UI patterns
 */
export const LevelsSection: React.FC<LevelsSectionProps> = ({
  courseId,
  selectedLevel,
  onLevelSelect,
  onCreateLevel,
  onEditLevel,
  onDeleteLevel,
}) => {
  const { t } = useTranslation();
  
  const {
    data: levelsResponse,
    isLoading,
    error,
    refetch,
  } = useLevelsQuery(courseId);

  const levels = levelsResponse?.data || [];
  // const pagination = levelsResponse?.meta || null; // TODO: Use when implementing pagination

  const handleLevelView = (level: Level) => {
    onLevelSelect(level.id);
  };

  // const handleSearch = (query: string) => {
  //   // TODO: Implement search functionality when backend supports it
  //   console.log('Search levels:', query);
  // };

  // const handlePageChange = (page: number) => {
  //   // TODO: Implement pagination when needed
  //   console.log('Change page:', page);
  // };

  const renderLevelItem = (
    level: Level,
    _isSelected: boolean,
    onSelect: (level: Level) => void
  ) => (
    <LevelCard
      key={level.id}
      level={level}
      isSelected={selectedLevel === level.id}
      onSelect={onSelect}
      onView={handleLevelView}
      onEdit={onEditLevel}
      onDelete={onDeleteLevel}
      showSelection={false}
      showActions={true}
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

  return (
    <div className="levels-section">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-neutral-900">
          {t('creator.components.levelsSection.title', 'Course Levels')}
        </h2>
        <button
          onClick={onCreateLevel}
          className="btn btn-primary"
        >
          {t('creator.components.levelsSection.addLevel', 'Add Level')}
        </button>
      </div>

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
          <button
            onClick={onCreateLevel}
            className="btn btn-primary"
          >
            {t('creator.components.levelsSection.createFirst', 'Create First Level')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {levels.map((level) => renderLevelItem(level, false, () => {}))}
        </div>
      )}
    </div>
  );
};

export default LevelsSection;