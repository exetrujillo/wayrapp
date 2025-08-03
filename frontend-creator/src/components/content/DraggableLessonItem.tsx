import React, { useEffect, useRef, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';
import { Lesson } from '../../utils/types';
import { LessonCard } from './LessonCard';

interface DraggableLessonItemProps {
  lesson: Lesson;
  index: number;
  onView?: (lesson: Lesson) => void;
  onPreview?: (lesson: Lesson) => void;
  onEdit?: (lesson: Lesson) => void;
  onDelete?: (lesson: Lesson) => void;
  showActions?: boolean;
  showSelection?: boolean;
  isDragDisabled?: boolean;
}

export const DraggableLessonItem: React.FC<DraggableLessonItemProps> = ({
  lesson,
  index,
  onView,
  onPreview,
  onEdit,
  onDelete,
  showActions = true,
  showSelection = false,
  isDragDisabled = false,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<'top' | 'bottom' | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || isDragDisabled) return;

    return combine(
      draggable({
        element,
        getInitialData: () => ({ type: 'lesson', lessonId: lesson.id, index }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source.data.type === 'lesson',
        getData: ({ input }) => 
          attachClosestEdge({ type: 'lesson', lessonId: lesson.id, index }, {
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
  }, [lesson.id, index, isDragDisabled]);

  return (
    <div
      ref={ref}
      className={`relative ${isDragging ? 'opacity-50' : ''}`}
      data-testid={`draggable-lesson-${lesson.id}`}
    >
      {closestEdge === 'top' && <DropIndicator edge="top" />}
      
      <LessonCard
        lesson={lesson}
        {...(onView && { onView })}
        {...(onPreview && { onPreview })}
        {...(onEdit && { onEdit })}
        {...(onDelete && { onDelete })}
        showActions={showActions}
        showSelection={showSelection}
        isDragging={isDragging}
      />
      
      {closestEdge === 'bottom' && <DropIndicator edge="bottom" />}
    </div>
  );
};