import React, { useEffect, useRef, useState } from 'react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

interface DroppableContainerProps {
  children: React.ReactNode;
  onReorder: (startIndex: number, endIndex: number) => void;
  className?: string;
  acceptedTypes?: string[]; // Allow specifying which drag types to accept
}

export const DroppableContainer: React.FC<DroppableContainerProps> = ({
  children,
  onReorder,
  className = '',
  acceptedTypes = ['level', 'section', 'module', 'lesson', 'exercise', 'item'], // Accept all types by default
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isDraggedOver, setIsDraggedOver] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    return dropTargetForElements({
      element,
      canDrop: ({ source }) => acceptedTypes.includes(source.data.type as string),
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
      className={`${className} ${isDraggedOver ? 'bg-blue-50 rounded-lg' : ''}`}
    >
      {children}
    </div>
  );
};