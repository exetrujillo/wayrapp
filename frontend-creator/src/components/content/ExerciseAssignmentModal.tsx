import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Feedback } from '../ui/Feedback';
import { ExerciseCard } from './ExerciseCard';
import { DraggableItem } from './DraggableItem';
import { DroppableContainer } from './DroppableContainer';
import { useExercisesQuery } from '../../hooks/useExercises';
import { useAssignExerciseMutation, useLessonExercisesQuery } from '../../hooks/useLessons';
import { Exercise, ExerciseType } from '../../utils/types';
import { EXERCISE_TYPES } from '../../utils/constants';
import { monitorForElements, draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

interface ExerciseAssignmentModalProps {
  lessonId: string;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Enhanced ExerciseAssignmentModal - Modal for selecting and assigning exercises from global bank
 * 
 * Features:
 * - Search and filtering capabilities
 * - Drag-and-drop interface for exercise assignment
 * - Visual indicators for already-assigned exercises
 * - Assignment conflict resolution
 * - Multi-select with order specification
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
  const [showAssignedExercises, setShowAssignedExercises] = useState(true);
  const [conflictResolution, setConflictResolution] = useState<'skip' | 'reassign' | 'ask'>('ask');
  const [pendingConflicts, setPendingConflicts] = useState<Exercise[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);

  // Drag and drop state
  const [assignmentQueue, setAssignmentQueue] = useState<Exercise[]>([]);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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

  // Filter exercises based on settings and apply type filter
  const filteredExercises = useMemo(() => {
    let filtered = exercisesResponse?.data || [];

    // Filter out assigned exercises if showAssignedExercises is false
    if (!showAssignedExercises) {
      filtered = filtered.filter(exercise => !assignedExerciseIds.has(exercise.id));
    }

    // Apply type filter if selected
    if (selectedType) {
      filtered = filtered.filter(exercise => exercise.exerciseType === selectedType);
    }

    return filtered;
  }, [exercisesResponse?.data, assignedExerciseIds, selectedType, showAssignedExercises]);

  // Separate assigned and unassigned exercises for better UX
  const { assignedExercises: assignedExercisesList, unassignedExercises } = useMemo((): {
    assignedExercises: Exercise[];
    unassignedExercises: Exercise[];
  } => {
    const assigned: Exercise[] = [];
    const unassigned: Exercise[] = [];

    filteredExercises.forEach(exercise => {
      if (assignedExerciseIds.has(exercise.id)) {
        assigned.push(exercise);
      } else {
        unassigned.push(exercise);
      }
    });

    return { assignedExercises: assigned, unassignedExercises: unassigned };
  }, [filteredExercises, assignedExerciseIds]);

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
      // Check for conflicts when selecting assigned exercises
      if (assignedExerciseIds.has(exercise.id) && conflictResolution === 'ask') {
        setPendingConflicts([exercise]);
        setShowConflictDialog(true);
        return;
      }
      newSelected.add(exercise.id);
    }
    setSelectedExercises(newSelected);
  };

  // Handle select all/none
  const handleSelectAll = () => {
    const selectableExercises = showAssignedExercises ? filteredExercises : unassignedExercises;
    if (selectedExercises.size === selectableExercises.length) {
      setSelectedExercises(new Set());
    } else {
      const conflicts = selectableExercises.filter((ex: Exercise) => assignedExerciseIds.has(ex.id));
      if (conflicts.length > 0 && conflictResolution === 'ask') {
        setPendingConflicts(conflicts);
        setShowConflictDialog(true);
        return;
      }
      setSelectedExercises(new Set(selectableExercises.map((ex: Exercise) => ex.id)));
    }
  };

  // Handle drag start
  const handleDragStart = (_exercise: Exercise) => {
    // Drag start handled by drag-and-drop library
  };

  // Handle drag end
  const handleDragEnd = () => {
    // Drag end handled by drag-and-drop library
  };

  // Handle drop on assignment queue
  const handleDropOnQueue = (exercise: Exercise) => {
    if (assignedExerciseIds.has(exercise.id) && conflictResolution === 'ask') {
      setPendingConflicts([exercise]);
      setShowConflictDialog(true);
      return;
    }

    if (!assignmentQueue.find(ex => ex.id === exercise.id)) {
      setAssignmentQueue(prev => [...prev, exercise]);
    }
  };

  // Handle remove from assignment queue
  const handleRemoveFromQueue = (exerciseId: string) => {
    setAssignmentQueue(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  // Handle reorder in assignment queue
  const handleReorderQueue = (startIndex: number, endIndex: number) => {
    const newQueue = [...assignmentQueue];
    const [removed] = newQueue.splice(startIndex, 1);
    newQueue.splice(endIndex, 0, removed);
    setAssignmentQueue(newQueue);
  };

  // Handle conflict resolution
  const handleConflictResolution = (action: 'skip' | 'reassign') => {
    if (action === 'reassign') {
      // Add conflicted exercises to selection/queue
      pendingConflicts.forEach(exercise => {
        if (showConflictDialog) {
          // If from dialog, add to assignment queue
          if (!assignmentQueue.find(ex => ex.id === exercise.id)) {
            setAssignmentQueue(prev => [...prev, exercise]);
          }
        } else {
          // If from selection, add to selected exercises
          setSelectedExercises(prev => new Set([...prev, exercise.id]));
        }
      });
    }

    setPendingConflicts([]);
    setShowConflictDialog(false);
  };

  // Handle assignment
  const handleAssign = async () => {
    const exercisesToAssign = [
      ...Array.from(selectedExercises).map(id => filteredExercises.find(ex => ex.id === id)!).filter(Boolean),
      ...assignmentQueue
    ];

    if (exercisesToAssign.length === 0) return;

    const nextOrder = (assignedExercises?.length || 0) + 1;

    try {
      // Assign exercises one by one with incremental order
      for (let i = 0; i < exercisesToAssign.length; i++) {
        const exercise = exercisesToAssign[i];

        // Skip if already assigned and conflict resolution is 'skip'
        if (assignedExerciseIds.has(exercise.id) && conflictResolution === 'skip') {
          continue;
        }

        await assignMutation.mutateAsync({
          lessonId,
          assignmentData: {
            exercise_id: exercise.id,
            order: nextOrder + i,
          },
        });
      }

      // Reset state and close modal
      handleClose();
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
    setShowAssignedExercises(true);
    setConflictResolution('ask');
    setPendingConflicts([]);
    setShowConflictDialog(false);
    setAssignmentQueue([]);
    onClose();
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Set up drag and drop monitoring
  useEffect(() => {
    if (!isOpen) return;

    return monitorForElements({
      onDrop({ source, location }) {
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceData = source.data;
        const destinationData = destination.data;

        // Handle drop on assignment queue
        if (destinationData.type === 'assignment-queue' && sourceData.type === 'exercise') {
          const exercise = filteredExercises.find(ex => ex.id === sourceData.exerciseId);
          if (exercise) {
            handleDropOnQueue(exercise);
          }
        }
      },
    });
  }, [isOpen, filteredExercises]);

  const isLoading = isExercisesLoading || isAssignedLoading;
  const hasError = exercisesError;
  const totalExercisesToAssign = selectedExercises.size + assignmentQueue.length;

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

          {/* Additional Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showAssignedExercises}
                  onChange={(e) => setShowAssignedExercises(e.target.checked)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                />
                <span className="text-sm text-neutral-700">
                  {t('creator.components.exerciseAssignmentModal.showAssigned', 'Show already assigned exercises')}
                </span>
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-neutral-700">
                {t('creator.components.exerciseAssignmentModal.conflictResolution', 'When exercise is already assigned:')}
              </label>
              <select
                value={conflictResolution}
                onChange={(e) => setConflictResolution(e.target.value as 'skip' | 'reassign' | 'ask')}
                className="px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ask">{t('creator.components.exerciseAssignmentModal.conflictAsk', 'Ask me')}</option>
                <option value="skip">{t('creator.components.exerciseAssignmentModal.conflictSkip', 'Skip it')}</option>
                <option value="reassign">{t('creator.components.exerciseAssignmentModal.conflictReassign', 'Reassign it')}</option>
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
                disabled={filteredExercises.length === 0}
              >
                {selectedExercises.size === (showAssignedExercises ? filteredExercises.length : unassignedExercises.length)
                  ? t('creator.components.exerciseAssignmentModal.selectNone', 'Select None')
                  : t('creator.components.exerciseAssignmentModal.selectAll', 'Select All')
                }
              </Button>
              <span className="text-sm text-neutral-600">
                {selectedExercises.size} {t('creator.components.exerciseAssignmentModal.selected', 'selected')}
              </span>
              {assignmentQueue.length > 0 && (
                <span className="text-sm text-primary-600">
                  + {assignmentQueue.length} {t('creator.components.exerciseAssignmentModal.queued', 'queued')}
                </span>
              )}
            </div>

            <div className="text-sm text-neutral-500">
              {filteredExercises.length} {t('creator.components.exerciseAssignmentModal.available', 'available exercises')}
              {showAssignedExercises && assignedExercisesList.length > 0 && (
                <span className="ml-2 text-amber-600">
                  ({assignedExercisesList.length} {t('creator.components.exerciseAssignmentModal.alreadyAssigned', 'already assigned')})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-96">
          {/* Exercise List */}
          <div className="lg:col-span-2">
            <div className="border border-neutral-200 rounded-lg">
              <div className="p-3 border-b border-neutral-200 bg-neutral-50">
                <h3 className="text-sm font-medium text-neutral-900">
                  {t('creator.components.exerciseAssignmentModal.exerciseBank', 'Exercise Bank')}
                </h3>
                <p className="text-xs text-neutral-600">
                  {t('creator.components.exerciseAssignmentModal.dragToAssign', 'Select exercises or drag them to the assignment queue')}
                </p>
              </div>

              <div className="max-h-80 overflow-y-auto p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : hasError ? (
                  <Feedback
                    type="error"
                    message={exercisesError?.message || t('creator.components.exerciseAssignmentModal.error.message', 'Failed to load exercises')}
                  />
                ) : filteredExercises.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-medium text-neutral-900 mb-1">
                      {searchQuery || selectedType
                        ? t('creator.components.exerciseAssignmentModal.noResults.title', 'No exercises found')
                        : t('creator.components.exerciseAssignmentModal.noExercises.title', 'No exercises available')
                      }
                    </h4>
                    <p className="text-xs text-neutral-600">
                      {searchQuery || selectedType
                        ? t('creator.components.exerciseAssignmentModal.noResults.description', 'Try adjusting your search or filter criteria.')
                        : t('creator.components.exerciseAssignmentModal.noExercises.description', 'Create some exercises first.')
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Unassigned Exercises */}
                    {unassignedExercises.map((exercise) => (
                      <DraggableExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        isSelected={selectedExercises.has(exercise.id)}
                        onSelect={handleExerciseSelect}
                        isAssigned={false}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                      />
                    ))}

                    {/* Assigned Exercises (if showing) */}
                    {showAssignedExercises && assignedExercisesList.length > 0 && (
                      <>
                        <div className="border-t border-neutral-200 pt-3 mt-3">
                          <h4 className="text-xs font-medium text-amber-700 mb-2 flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            {t('creator.components.exerciseAssignmentModal.alreadyAssignedSection', 'Already Assigned to This Lesson')}
                          </h4>
                        </div>
                        {assignedExercisesList.map((exercise) => (
                          <DraggableExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            isSelected={selectedExercises.has(exercise.id)}
                            onSelect={handleExerciseSelect}
                            isAssigned={true}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                          />
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assignment Queue */}
          <div className="lg:col-span-1">
            <div className="border border-neutral-200 rounded-lg">
              <div className="p-3 border-b border-neutral-200 bg-primary-50">
                <h3 className="text-sm font-medium text-primary-900">
                  {t('creator.components.exerciseAssignmentModal.assignmentQueue', 'Assignment Queue')}
                </h3>
                <p className="text-xs text-primary-700">
                  {t('creator.components.exerciseAssignmentModal.queueDescription', 'Exercises to be assigned')}
                </p>
              </div>

              <div
                ref={dropZoneRef}
                className="min-h-80 max-h-80 overflow-y-auto p-4"
                data-type="assignment-queue"
              >
                <AssignmentQueue
                  exercises={assignmentQueue}
                  onRemove={handleRemoveFromQueue}
                  onReorder={handleReorderQueue}
                />
              </div>
            </div>
          </div>
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
        <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
          <div className="text-sm text-neutral-600">
            {totalExercisesToAssign > 0 && (
              <span>
                {t('creator.components.exerciseAssignmentModal.totalToAssign', 'Total to assign: {{count}} exercise(s)', {
                  count: totalExercisesToAssign,
                })}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-3">
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
              disabled={totalExercisesToAssign === 0 || assignMutation.isPending}
              className="flex items-center space-x-2"
            >
              {assignMutation.isPending && <LoadingSpinner size="sm" />}
              <span>
                {t('creator.components.exerciseAssignmentModal.assignButton', 'Assign {{count}} Exercise(s)', {
                  count: totalExercisesToAssign,
                })}
              </span>
            </Button>
          </div>
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

        {/* Conflict Resolution Dialog */}
        {showConflictDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-neutral-900">
                    {t('creator.components.exerciseAssignmentModal.conflictDialog.title', 'Assignment Conflict')}
                  </h3>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-neutral-600 mb-3">
                  {t('creator.components.exerciseAssignmentModal.conflictDialog.message',
                    'The following exercise(s) are already assigned to this lesson:')}
                </p>
                <div className="bg-neutral-50 rounded-md p-3 max-h-32 overflow-y-auto">
                  {pendingConflicts.map((exercise) => (
                    <div key={exercise.id} className="text-sm text-neutral-800 py-1">
                      • {EXERCISE_TYPES.find(t => t.value === exercise.exerciseType)?.label || exercise.exerciseType}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-neutral-600 mt-3">
                  {t('creator.components.exerciseAssignmentModal.conflictDialog.question',
                    'What would you like to do?')}
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => handleConflictResolution('skip')}
                  size="sm"
                >
                  {t('creator.components.exerciseAssignmentModal.conflictDialog.skip', 'Skip These')}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleConflictResolution('reassign')}
                  size="sm"
                >
                  {t('creator.components.exerciseAssignmentModal.conflictDialog.reassign', 'Reassign Anyway')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

// Enhanced Exercise Card with drag-and-drop support
interface DraggableExerciseCardProps {
  exercise: Exercise;
  isSelected: boolean;
  onSelect: (exercise: Exercise) => void;
  isAssigned: boolean;
  onDragStart: (exercise: Exercise) => void;
  onDragEnd: () => void;
}

const DraggableExerciseCard: React.FC<DraggableExerciseCardProps> = ({
  exercise,
  isSelected,
  onSelect,
  isAssigned,
  onDragStart,
  onDragEnd,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return draggable({
      element,
      getInitialData: () => ({
        type: 'exercise',
        exerciseId: exercise.id,
        exercise: exercise
      }),
      onDragStart: () => {
        setIsDragging(true);
        onDragStart(exercise);
      },
      onDrop: () => {
        setIsDragging(false);
        onDragEnd();
      },
    });
  }, [exercise, onDragStart, onDragEnd]);

  return (
    <div
      ref={ref}
      className={`relative cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      <ExerciseCard
        exercise={exercise}
        isSelected={isSelected}
        onSelect={onSelect}
        showActions={false}
        showSelection={true}
      />

      {/* Assignment indicator */}
      {isAssigned && (
        <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full flex items-center">
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          Assigned
        </div>
      )}

      {/* Drag handle */}
      <div className="absolute top-2 left-2 text-neutral-400 hover:text-neutral-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>
    </div>
  );
};

// Assignment Queue Component
interface AssignmentQueueProps {
  exercises: Exercise[];
  onRemove: (exerciseId: string) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
}

const AssignmentQueue: React.FC<AssignmentQueueProps> = ({
  exercises,
  onRemove,
  onReorder,
}) => {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      canDrop: ({ source }) => source.data.type === 'exercise',
      getData: () => ({ type: 'assignment-queue' }),
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: () => setIsDraggedOver(false),
    });
  }, []);

  if (exercises.length === 0) {
    return (
      <div
        ref={ref}
        className={`flex flex-col items-center justify-center h-full text-center p-4 border-2 border-dashed rounded-lg transition-colors ${isDraggedOver
          ? 'border-primary-400 bg-primary-50'
          : 'border-neutral-300 bg-neutral-50'
          }`}
      >
        <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h4 className="text-sm font-medium text-neutral-700 mb-1">
          {t('creator.components.exerciseAssignmentModal.emptyQueue.title', 'No exercises queued')}
        </h4>
        <p className="text-xs text-neutral-500">
          {t('creator.components.exerciseAssignmentModal.emptyQueue.description', 'Drag exercises here to queue them for assignment')}
        </p>
      </div>
    );
  }

  return (
    <div ref={ref} className={`space-y-2 ${isDraggedOver ? 'bg-primary-50 rounded-lg p-2' : ''}`}>
      <DroppableContainer onReorder={onReorder} acceptedTypes={['exercise']}>
        {exercises.map((exercise, index) => (
          <DraggableItem
            key={exercise.id}
            item={exercise}
            index={index}
            isSelected={false}
            onSelect={() => { }}
            renderItem={(item) => (
              <div className="bg-white border border-neutral-200 rounded-lg p-3 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-primary-100 rounded flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary-700">{index + 1}</span>
                      </div>
                      <h4 className="text-sm font-medium text-neutral-900 truncate">
                        {EXERCISE_TYPES.find(t => t.value === item.exerciseType)?.label || item.exerciseType}
                      </h4>
                    </div>
                    <p className="text-xs text-neutral-600 line-clamp-2">
                      {item.id}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemove(item.id)}
                    className="ml-2 text-error border-error hover:bg-error hover:text-white"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
            )}
          />
        ))}
      </DroppableContainer>
    </div>
  );
};

export default ExerciseAssignmentModal;