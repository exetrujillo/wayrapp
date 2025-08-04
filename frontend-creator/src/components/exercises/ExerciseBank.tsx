import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useExercisesQuery } from '../../hooks/useExercises';
import { ExerciseType, Exercise } from '../../utils/types';
import { advancedSearchExercises, ExerciseSearchCriteria } from '../../utils/exerciseSearch';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Feedback } from '../ui/Feedback';
import { Button } from '../ui/Button';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseFilters } from './ExerciseFilters';
import { ExerciseBulkActions } from './ExerciseBulkActions';

interface ExerciseBankProps {
  onSelectExercise?: (exercise: Exercise) => void;
  onCreateExercise?: () => void;
  selectionMode?: boolean;
  selectedExercises?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const ExerciseBank: React.FC<ExerciseBankProps> = ({
  onSelectExercise,
  onCreateExercise,
  selectionMode = false,
  selectedExercises = [],
  onSelectionChange,
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<ExerciseType | 'all'>('all');
  const [usageFilter, setUsageFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  // Fetch exercises with pagination
  const {
    data: exercisesResponse,
    isLoading,
    error,
    refetch,
  } = useExercisesQuery({
    page: 1,
    limit: 50, // Start with reasonable limit
  });

  const exercises = exercisesResponse?.data || [];

  // Filter exercises based on current filters
  const filteredExercises = useMemo(() => {
    // Start with advanced search for content and type filtering
    const searchCriteria: ExerciseSearchCriteria = {
      ...(searchTerm && { searchTerm }),
      ...(typeFilter !== 'all' && { exerciseTypes: [typeFilter] }),
      caseSensitive: false,
      contentOnly: false,
    };

    let filtered = advancedSearchExercises(exercises, searchCriteria);

    // Apply usage filter (placeholder - would need actual usage data)
    if (usageFilter !== 'all') {
      // TODO: Implement usage filtering when usage tracking is available
      // For now, show all exercises
      // filtered = filtered.filter(exercise => {
      //   const usageCount = getExerciseUsageCount(exercise.id);
      //   return usageFilter === 'used' ? usageCount > 0 : usageCount === 0;
      // });
    }

    // Apply difficulty filter (placeholder - would need difficulty metadata)
    if (difficultyFilter !== 'all') {
      // TODO: Implement difficulty filtering when difficulty metadata is available
      // For now, show all exercises
      // filtered = filtered.filter(exercise => {
      //   const difficulty = getExerciseDifficulty(exercise);
      //   return difficulty === difficultyFilter;
      // });
    }

    return filtered;
  }, [exercises, searchTerm, typeFilter, usageFilter, difficultyFilter]);

  const handleSelectAll = () => {
    if (!onSelectionChange) return;

    const allIds = filteredExercises.map(ex => ex.id);
    const allSelected = allIds.every(id => selectedExercises.includes(id));

    if (allSelected) {
      // Deselect all
      onSelectionChange(selectedExercises.filter(id => !allIds.includes(id)));
    } else {
      // Select all
      onSelectionChange([...new Set([...selectedExercises, ...allIds])]);
    }
  };

  const handleExerciseSelection = (exerciseId: string, selected: boolean) => {
    if (!onSelectionChange) return;

    if (selected) {
      onSelectionChange([...selectedExercises, exerciseId]);
    } else {
      onSelectionChange(selectedExercises.filter(id => id !== exerciseId));
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Feedback
          type="error"
          message={error.message || t('exercises.bank.loadError', 'Failed to load exercises')}
        />
        <div className="flex justify-center">
          <Button variant="secondary" onClick={() => refetch()}>
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t('exercises.bank.title', 'Exercise Bank')}
          </h2>
          <p className="text-gray-600 mt-1">
            {t('exercises.bank.subtitle', 'Manage and organize your exercises')}
          </p>
        </div>

        {onCreateExercise && (
          <Button variant="primary" onClick={onCreateExercise}>
            {t('exercises.bank.createNew', 'Create Exercise')}
          </Button>
        )}
      </div>

      {/* Filters */}
      <ExerciseFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        usageFilter={usageFilter}
        onUsageFilterChange={setUsageFilter}
        difficultyFilter={difficultyFilter}
        onDifficultyFilterChange={setDifficultyFilter}
      />

      {/* Bulk Actions */}
      {selectionMode && selectedExercises.length > 0 && (
        <ExerciseBulkActions
          selectedCount={selectedExercises.length}
          onSelectAll={handleSelectAll}
          onClearSelection={() => onSelectionChange?.([])}
        />
      )}

      {/* Results Summary */}
      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          {t('exercises.bank.showing', 'Showing {{count}} of {{total}} exercises', {
            count: filteredExercises.length,
            total: exercises.length,
          })}
        </span>

        {selectionMode && (
          <span>
            {t('exercises.bank.selected', '{{count}} selected', {
              count: selectedExercises.length,
            })}
          </span>
        )}
      </div>

      {/* Exercise Grid */}
      {filteredExercises.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || typeFilter !== 'all'
              ? t('exercises.bank.noResults', 'No exercises match your filters')
              : t('exercises.bank.empty', 'No exercises yet')
            }
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || typeFilter !== 'all'
              ? t('exercises.bank.tryDifferentFilters', 'Try adjusting your search or filters')
              : t('exercises.bank.createFirst', 'Create your first exercise to get started')
            }
          </p>
          {onCreateExercise && (
            <Button variant="primary" onClick={onCreateExercise}>
              {t('exercises.bank.createNew', 'Create Exercise')}
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              {...(onSelectExercise && { onSelect: onSelectExercise })}
              selectionMode={selectionMode}
              isSelected={selectedExercises.includes(exercise.id)}
              onSelectionChange={(selected: boolean) => handleExerciseSelection(exercise.id, selected)}
              showUsageIndicator={true}
              showUsageDashboard={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};