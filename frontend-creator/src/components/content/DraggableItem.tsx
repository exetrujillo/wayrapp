import React, { useEffect, useRef, useState } from 'react';
import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { DropIndicator } from '@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box';

interface DraggableItemProps<T> {
  item: T & { id: string };
  index: number;
  isSelected: boolean;
  onSelect: (item: T) => void;
  renderItem: (item: T, isSelected: boolean, onSelect: (item: T) => void, dragHandleProps?: any) => React.ReactNode;
  isDragDisabled?: boolean;
}

export function DraggableItem<T extends { id: string }>({
  item,
  index,
  isSelected,
  onSelect,
  renderItem,
  isDragDisabled = false,
}: DraggableItemProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [closestEdge, setClosestEdge] = useState<'top' | 'bottom' | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || isDragDisabled) return;

    return combine(
      draggable({
        element,
        getInitialData: () => ({ type: 'item', itemId: item.id, index }),
        onDragStart: () => setIsDragging(true),
        onDrop: () => setIsDragging(false),
      }),
      dropTargetForElements({
        element,
        canDrop: ({ source }) => source.data.type === 'item',
        getData: ({ input }) => 
          attachClosestEdge({ type: 'item', itemId: item.id, index }, {
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
  }, [item.id, index, isDragDisabled]);

  return (
    <div
      ref={ref}
      className={`relative ${isDragging ? 'opacity-50' : ''}`}
      data-testid={`draggable-item-${item.id}`}
    >
      {closestEdge === 'top' && <DropIndicator edge="top" />}
      
      {renderItem(item, isSelected, onSelect, undefined)}
      
      {closestEdge === 'bottom' && <DropIndicator edge="bottom" />}
    </div>
  );
}