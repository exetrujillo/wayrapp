import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Feedback } from '../ui/Feedback';
import { ExerciseCard } from './ExerciseCard';
import { useExercisesQuery } from '../../hooks/useExercises';
import { useAssignExerciseMutation, useLessonExercisesQuery } from '../../hooks/useLessons';
import { Exercise, ExerciseType } from '../../utils/types';
import { EXERCISE_TYPES } from '../../utils/constants';

interface ExerciseAssignmentModalProps {
  lessonId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * ExerciseAssignmentModal - Modal for selecting exercises from global bank
 * 
 * Features:
 * - Search and filtering capabilities
 * - Multi-select with order specification
 * - Shows already assigned exercises
 * - Handles exercise assignment to lesson
 */
export const ExerciseAssignmentModal: React.FC<ExerciseAssignmentModalProps> = ({
  lessonId,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  
  // State for search and filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ExerciseType | ''>('');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch exercises from global bank
  const {
    data: exercisesResponse,
    isLoading: isExercisesLoading,
    error: exercisesError,
  } = useExercisesQuery({
    page: currentPage,
    limit: 20,
    ...(searchQuery && { search: searchQuery }),
  });

  // Fetch currently assigned exercises
  const {
    data: assignedExercises,
    isLoading: isAssignedLoading,
  } = useLessonExercisesQuery(lessonId);

  // Assignment mutation
  const assignMutation = useAssignExerciseMutation();

  // Get IDs of already assigned exercises
  const assignedExerciseIds = useMemo(() => {
    return new Set(assignedExercises?.map(assignment => assignment.exercise_id) || []);
  }, [assignedExercises]);

  // Filter out already assigned exercises and apply type filter
  const availableExercises = useMemo(() => {
    let filtered = exercisesResponse?.data.filter(exercise => !assignedExerciseIds.has(exercise.id)) || [];
    
    // Apply type filter if selected
    if (selectedType) {
      filtered = filtered.filter(exercise => exercise.exerciseType === selectedType);
    }
    
    return filtered;
  }, [exercisesResponse?.data, assignedExerciseIds, selectedType]);

  // Handle search input change with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle exercise type filter change
  const handleTypeChange = (type: ExerciseType | '') => {
    setSelectedType(type);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle exercise selection
  const handleExerciseSelect = (exercise: Exercise) => {
    const newSelected = new Set(selectedExercises);
    if (newSelected.has(exercise.id)) {
      newSelected.delete(exercise.id);
    } else {
      newSelected.add(exercise.id);
    }
    setSelectedExercises(newSelected);
  };

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedExercises.size === availableExercises.length) {
      setSelectedExercises(new Set());
    } else {
      setSelectedExercises(new Set(availableExercises.map(ex => ex.id)));
    }
  };

  // Handle assignment
  const handleAssign = async () => {
    if (selectedExercises.size === 0) return;

    const exerciseIds = Array.from(selectedExercises);
    const nextOrder = (assignedExercises?.length || 0) + 1;

    try {
      // Assign exercises one by one with incremental order
      for (let i = 0; i < exerciseIds.length; i++) {
        await assignMutation.mutateAsync({
          lessonId,
          assignmentData: {
            exercise_id: exerciseIds[i],
            order: nextOrder + i,
          },
        });
      }

      // Reset state and close modal
      setSelectedExercises(new Set());
      setSearchQuery('');
      setSelectedType('');
      setCurrentPage(1);
      onClose();
    } catch (error) {
      console.error('Failed to assign exercises:', error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setSelectedExercises(new Set());
    setSearchQuery('');
    setSelectedType('');
    setCurrentPage(1);
    onClose();
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const isLoading = isExercisesLoading || isAssignedLoading;
  const hasError = exercisesError;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('creator.components.exerciseAssignmentModal.title', 'Assign Exercises')}
      size="xl"
    >
      <div className="space-y-6">
        {/* Search and Filter Controls */}
        <div className="space-y-4">
          <div className="flex space-x-4">
            {/* Search Input */}
            <div className="flex-1">
              <Input
                type="text"
                placeholder={t('creator.components.exerciseAssignmentModal.searchPlaceholder', 'Search exercises...')}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Type Filter */}
            <div className="w-48">
              <select
                value={selectedType}
                onChange={(e) => handleTypeChange(e.target.value as ExerciseType | '')}
                className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">
                  {t('creator.components.exerciseAssignmentModal.allTypes', 'All Types')}
                </option>
                {EXERCISE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={availableExercises.length === 0}
              >
                {selectedExercises.size === availableExercises.length
                  ? t('creator.components.exerciseAssignmentModal.selectNone', 'Select None')
                  : t('creator.components.exerciseAssignmentModal.selectAll', 'Select All')
                }
              </Button>
              <span className="text-sm text-neutral-600">
                {selectedExercises.size} {t('creator.components.exerciseAssignmentModal.selected', 'selected')}
              </span>
            </div>

            <div className="text-sm text-neutral-500">
              {availableExercises.length} {t('creator.components.exerciseAssignmentModal.available', 'available exercises')}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="min-h-96 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : hasError ? (
            <Feedback
              type="error"
              message={exercisesError?.message || t('creator.components.exerciseAssignmentModal.error.message', 'Failed to load exercises')}
            />
          ) : availableExercises.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                {searchQuery || selectedType
                  ? t('creator.components.exerciseAssignmentModal.noResults.title', 'No exercises found')
                  : t('creator.components.exerciseAssignmentModal.noExercises.title', 'No exercises available')
                }
              </h3>
              <p className="text-neutral-600">
                {searchQuery || selectedType
                  ? t('creator.components.exerciseAssignmentModal.noResults.description', 'Try adjusting your search or filter criteria.')
                  : t('creator.components.exerciseAssignmentModal.noExercises.description', 'All exercises have been assigned to this lesson or no exercises exist in the global bank.')
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  isSelected={selectedExercises.has(exercise.id)}
                  onSelect={handleExerciseSelect}
                  showActions={false}
                  showSelection={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {exercisesResponse && exercisesResponse.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
            <div className="text-sm text-neutral-600">
              {t('creator.components.exerciseAssignmentModal.pagination.showing', 'Showing {{start}} to {{end}} of {{total}} exercises', {
                start: (exercisesResponse.meta.page - 1) * exercisesResponse.meta.limit + 1,
                end: Math.min(exercisesResponse.meta.page * exercisesResponse.meta.limit, exercisesResponse.meta.total),
                total: exercisesResponse.meta.total,
              })}
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                {t('common.buttons.previous', 'Previous')}
              </Button>
              
              <span className="flex items-center px-3 py-1 text-sm text-neutral-600">
                {currentPage} / {exercisesResponse.meta.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === exercisesResponse.meta.totalPages}
              >
                {t('common.buttons.next', 'Next')}
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 border-t border-neutral-200 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={assignMutation.isPending}
          >
            {t('common.buttons.cancel', 'Cancel')}
          </Button>
          
          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={selectedExercises.size === 0 || assignMutation.isPending}
            className="flex items-center space-x-2"
          >
            {assignMutation.isPending && <LoadingSpinner size="sm" />}
            <span>
              {t('creator.components.exerciseAssignmentModal.assignButton', 'Assign {{count}} Exercise(s)', {
                count: selectedExercises.size,
              })}
            </span>
          </Button>
        </div>

        {/* Assignment Error */}
        {assignMutation.isError && (
          <div className="border-t border-neutral-200 pt-4">
            <Feedback
              type="error"
              message={assignMutation.error?.message || t('creator.components.exerciseAssignmentModal.assignError.message', 'Failed to assign exercises')}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ExerciseAssignmentModal;