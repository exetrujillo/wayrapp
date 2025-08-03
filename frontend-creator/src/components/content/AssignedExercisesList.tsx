import React, { useEffect, useRef, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';
import { useTranslation } from 'react-i18next';
import { ExerciseAssignment } from '../../utils/types';
import { Button } from '../ui/Button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Feedback } from '../ui/Feedback';
import { useReorderExercisesMutation, useRemoveExerciseAssignmentMutation } from '../../hooks/useLessons';
import { useExerciseQuery } from '../../hooks/useExercises';

interface AssignedExercisesListProps {
  lessonId: string;
  exercises: ExerciseAssignment[];
}

interface DraggableExerciseItemProps {
  assignment: ExerciseAssignment;
  index: number;
  onUnassign: (assignmentId: string) => void;
  isDragDisabled?: boolean;
}

/**
 * Individual draggable exercise item component with drag handle and actions
 */
const DraggableExerciseItem: React.FC<DraggableExerciseItemProps> = ({ 
  assignment, 
  index, 
  onUnassign,
  isDragDisabled = false 
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<'top' | 'bottom' | null>(null);
  const { t } = useTranslation();
  
  // Fetch exercise details
  const { data: exercise, isLoading } = useExerciseQuery(assignment.exercise_id);

  // Set up drag and drop with Pragmatic Drag and Drop
  useEffect(() => {
    const element = ref.current;
    if (!element || isDragDisabled) return;

    return combine(
      draggable({
        element,
        getInitialData: () => ({ type: 'exercise', assignmentId: assignment.id, index }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source.data.type === 'exercise',
        getData: ({ input }) => 
          attachClosestEdge({ type: 'exercise', assignmentId: assignment.id, index }, {
            element,
            input,
            allowedEdges: ['top', 'bottom'],
          }),
        onDragEnter: ({ self }) => {
          const edge = extractClosestEdge(self.data);
          setClosestEdge(edge === 'top' || edge === 'bottom' ? edge : null);
        },
        onDragLeave: () => setClosestEdge(null),
        onDrop: () => setClosestEdge(null),
      })
    );
  }, [assignment.id, index, isDragDisabled]);

  const handleUnassign = () => {
    if (window.confirm(t('creator.components.assignedExercisesList.unassignConfirm', 'Are you sure you want to unassign this exercise?'))) {
      onUnassign(assignment.id);
    }
  };

  // Get exercise type icon
  const getExerciseTypeIcon = (type: string) => {
    switch (type) {
      case 'translation':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        );
      case 'vof':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'fill-in-the-blank':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'pairs':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'informative':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'ordering':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  // Get preview content from exercise data
  const getPreviewContent = () => {
    if (!exercise) return '';
    
    const { data } = exercise;
    switch (exercise.exerciseType) {
      case 'translation':
        return data['source_text'] || data['text'] || '';
      case 'vof':
        return data['statement'] || data['question'] || '';
      case 'fill-in-the-blank':
        return data['text'] || data['sentence'] || '';
      case 'pairs':
        return data['pairs'] ? `${data['pairs'].length} pairs` : '';
      case 'informative':
        return data['title'] || data['content'] || '';
      case 'ordering':
        return data['items'] ? `${data['items'].length} items to order` : '';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4 bg-neutral-50 rounded-lg">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="p-4 bg-error-50 border border-error-200 rounded-lg">
        <p className="text-error-600 text-sm">
          {t('creator.components.assignedExercisesList.exerciseNotFound', 'Exercise not found')}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`relative ${isDragging ? 'opacity-50' : ''}`}
      data-testid={`draggable-exercise-${assignment.id}`}
    >
      {closestEdge === 'top' && <DropIndicator edge="top" />}
      
      <div
        className={`bg-white border border-neutral-200 rounded-lg p-4 mb-3 transition-all duration-200 ${
          isDragging ? 'shadow-lg ring-2 ring-primary-500 ring-opacity-50' : 'hover:shadow-md'
        }`}
      >
        <div className="flex items-start space-x-4">
          {/* Drag Handle */}
          {!isDragDisabled && (
            <div
              className="flex-shrink-0 p-2 text-neutral-400 hover:text-neutral-600 cursor-grab active:cursor-grabbing"
              title={t('creator.components.assignedExercisesList.dragHandle', 'Drag to reorder')}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </div>
          )}

          {/* Order Number */}
          <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
            {assignment.order}
            </div>

            {/* Exercise Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex-shrink-0 p-2 bg-neutral-100 rounded-lg text-neutral-600">
                    {getExerciseTypeIcon(exercise.exerciseType)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 capitalize">
                      {exercise.exerciseType.replace(/[-_]/g, ' ')}
                    </h4>
                    <p className="text-xs text-neutral-500">
                      {t('creator.components.assignedExercisesList.exerciseId', 'ID')}: {exercise.id}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUnassign}
                    className="text-error border-error hover:bg-error hover:text-white"
                    title={t('creator.components.assignedExercisesList.unassign', 'Unassign')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="text-sm text-neutral-600 line-clamp-2">
                {getPreviewContent()}
              </div>
          </div>
        </div>
      </div>
      
      {closestEdge === 'bottom' && <DropIndicator edge="bottom" />}
    </div>
  );
};

/**
 * Droppable container for exercise assignments
 */
interface DroppableExerciseContainerProps {
  children: React.ReactNode;
  onReorder: (startIndex: number, endIndex: number) => void;
  className?: string;
}

const DroppableExerciseContainer: React.FC<DroppableExerciseContainerProps> = ({
  children,
  onReorder,
  className = '',
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      canDrop: ({ source }) => source.data.type === 'exercise',
      onDragEnter: () => setIsDraggedOver(true),
      onDragLeave: () => setIsDraggedOver(false),
      onDrop: ({ source, location }) => {
        setIsDraggedOver(false);
        
        const destination = location.current.dropTargets[0];
        if (!destination) return;

        const sourceIndex = source.data.index as number;
        const destinationIndex = destination.data.index as number;
        const edge = extractClosestEdge(destination.data);

        let finalIndex = destinationIndex;
        if (edge === 'bottom') {
          finalIndex = destinationIndex + 1;
        }

        // Adjust for moving items down
        if (sourceIndex < finalIndex) {
          finalIndex = finalIndex - 1;
        }

        if (sourceIndex !== finalIndex) {
          onReorder(sourceIndex, finalIndex);
        }
      },
    });
  }, [onReorder]);

  return (
    <div
      ref={ref}
      className={`${className} ${isDraggedOver ? 'bg-primary-50 rounded-lg' : ''}`}
    >
      {children}
    </div>
  );
};

/**
 * AssignedExercisesList - Drag-and-drop list for managing lesson exercises
 * 
 * Features:
 * - Shows exercise details and order controls
 * - Handles reordering and unassignment actions
 * - Drag-and-drop interface using Pragmatic Drag and Drop
 */
export const AssignedExercisesList: React.FC<AssignedExercisesListProps> = ({
  lessonId,
  exercises,
}) => {
  const { t } = useTranslation();
  
  // Mutations for reordering and removing exercises
  const reorderMutation = useReorderExercisesMutation();
  const removeAssignmentMutation = useRemoveExerciseAssignmentMutation();

  // Sort exercises by order
  const sortedExercises = [...exercises].sort((a, b) => a.order - b.order);

  const handleReorder = (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) {
      return;
    }

    // Create new order based on drag result
    const reorderedExercises = [...sortedExercises];
    const [removed] = reorderedExercises.splice(startIndex, 1);
    reorderedExercises.splice(endIndex, 0, removed);

    // Extract exercise IDs in new order
    const exercise_ids = reorderedExercises.map(assignment => assignment.exercise_id);

    // Call reorder mutation
    reorderMutation.mutate({
      lessonId,
      exerciseIds: exercise_ids, // Hook expects camelCase, service handles snake_case conversion
    });
  };

  const handleUnassign = (assignmentId: string) => {
    removeAssignmentMutation.mutate({
      lessonId,
      assignmentId,
    });
  };

  // Show empty state if no exercises
  if (exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-neutral-900 mb-2">
          {t('creator.components.assignedExercisesList.empty.title', 'No exercises assigned')}
        </h3>
        <p className="text-neutral-600 mb-4">
          {t('creator.components.assignedExercisesList.empty.description', 'Start building your lesson by assigning exercises from the global exercise bank.')}
        </p>
      </div>
    );
  }

  // Show error state if mutations failed
  if (reorderMutation.isError || removeAssignmentMutation.isError) {
    return (
      <div className="space-y-4">
        <Feedback
          type="error"
          message={
            reorderMutation.error?.message || 
            removeAssignmentMutation.error?.message || 
            t('creator.components.assignedExercisesList.error.message', 'Failed to update exercises')
          }
        />
        <Button
          variant="outline"
          onClick={() => {
            reorderMutation.reset();
            removeAssignmentMutation.reset();
          }}
        >
          {t('common.buttons.retry', 'Retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Loading overlay */}
      {(reorderMutation.isPending || removeAssignmentMutation.isPending) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Instructions */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-primary-900 mb-1">
              {t('creator.components.assignedExercisesList.instructions.title', 'How to manage exercises')}
            </h4>
            <ul className="text-sm text-primary-700 space-y-1">
              <li>• {t('creator.components.assignedExercisesList.instructions.drag', 'Drag exercises by the handle to reorder them')}</li>
              <li>• {t('creator.components.assignedExercisesList.instructions.unassign', 'Click the X button to unassign an exercise')}</li>
              <li>• {t('creator.components.assignedExercisesList.instructions.order', 'The order number shows the sequence students will see')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Drag and Drop Container */}
      <DroppableExerciseContainer 
        onReorder={handleReorder}
        className="min-h-32 transition-colors duration-200"
      >
        {sortedExercises.map((assignment, index) => (
          <DraggableExerciseItem
            key={assignment.id}
            assignment={assignment}
            index={index}
            onUnassign={handleUnassign}
            isDragDisabled={reorderMutation.isPending || removeAssignmentMutation.isPending}
          />
        ))}
      </DroppableExerciseContainer>
    </div>
  );
};

export default AssignedExercisesList;