import React, { useEffect, useRef, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';
import { Module } from '../../utils/types';
import { ModuleCard } from './ModuleCard';

interface DraggableModuleItemProps {
  module: Module;
  index: number;
  isSelected?: boolean;
  onSelect?: (module: Module) => void;
  onView?: (module: Module) => void;
  onEdit?: (module: Module) => void;
  onDelete?: (module: Module) => void;
  showActions?: boolean;
  showSelection?: boolean;
  isDragDisabled?: boolean;
}

export const DraggableModuleItem: React.FC<DraggableModuleItemProps> = ({
  module,
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
        getInitialData: () => ({ type: 'module', moduleId: module.id, index }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source.data.type === 'module',
        getData: ({ input }) => 
          attachClosestEdge({ type: 'module', moduleId: module.id, index }, {
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
  }, [module.id, index, isDragDisabled]);

  return (
    <div
      ref={ref}
      className={`relative ${isDragging ? 'opacity-50' : ''}`}
      data-testid={`draggable-module-${module.id}`}
    >
      {closestEdge === 'top' && <DropIndicator edge="top" />}
      
      <ModuleCard
        module={module}
        isSelected={isSelected}
        {...(onSelect && { onSelect })}
        {...(onView && { onView })}
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