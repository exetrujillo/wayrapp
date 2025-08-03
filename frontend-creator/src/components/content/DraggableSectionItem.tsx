import React, { useEffect, useRef, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';
import { Section } from '../../utils/types';
import { SectionCard } from './SectionCard';

interface DraggableSectionItemProps {
  section: Section;
  index: number;
  isSelected?: boolean;
  onSelect?: (section: Section) => void;
  onView?: (section: Section) => void;
  onEdit?: (section: Section) => void;
  onDelete?: (section: Section) => void;
  showActions?: boolean;
  showSelection?: boolean;
  isDragDisabled?: boolean;
}

export const DraggableSectionItem: React.FC<DraggableSectionItemProps> = ({
  section,
  index,
  isSelected = false,
  onSelect,
  onView,
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
        getInitialData: () => ({ type: 'section', sectionId: section.id, index }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source.data.type === 'section',
        getData: ({ input }) => 
          attachClosestEdge({ type: 'section', sectionId: section.id, index }, {
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
  }, [section.id, index, isDragDisabled]);

  return (
    <div
      ref={ref}
      className={`relative ${isDragging ? 'opacity-50' : ''}`}
      data-testid={`draggable-section-${section.id}`}
    >
      {closestEdge === 'top' && <DropIndicator edge="top" />}
      
      <SectionCard
        section={section}
        isSelected={isSelected}
        {...(onSelect && { onSelect })}
        {...(onView && { onView })}
        {...(onEdit && { onEdit })}
        {...(onDelete && { onDelete })}
        showActions={showActions}
        showSelection={showSelection}
        enableDragHandle={!isDragDisabled}
      />
      
      {closestEdge === 'bottom' && <DropIndicator edge="bottom" />}
    </div>
  );
};