import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Module } from '../../utils/types';
import { useModulesQuery, useReorderModulesMutation } from '../../hooks/useModules';
import { ModuleCard } from './ModuleCard';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Feedback } from '../ui/Feedback';

interface ModulesSectionProps {
  sectionId: string;
  selectedModule?: string | undefined;
  onModuleSelect: (moduleId: string) => void;
  onCreateModule: () => void;
  onEditModule: (module: Module) => void;
  onDeleteModule: (module: Module) => void;
  enableDragDrop?: boolean;
}

/**
 * Section component for displaying and managing modules within a section
 * Uses ModuleCard for consistent UI patterns and supports drag-and-drop reordering
 */
export const ModulesSection: React.FC<ModulesSectionProps> = ({
  sectionId,
  selectedModule,
  onModuleSelect,
  onCreateModule,
  onEditModule,
  onDeleteModule,
  enableDragDrop = true,
}) => {
  const { t } = useTranslation();
  const [dragDisabled, setDragDisabled] = useState(false);
  
  const {
    data: modulesResponse,
    isLoading,
    error,
    refetch,
  } = useModulesQuery(sectionId);

  const reorderModulesMutation = useReorderModulesMutation();

  const modules = modulesResponse?.data || [];

  const handleModuleView = (module: Module) => {
    onModuleSelect(module.id);
  };

  const handleDragEnd = useCallback(async (result: DropResult) => {
    if (!result.destination || !enableDragDrop) {
      return;
    }

    const { source, destination } = result;

    // If dropped in the same position, do nothing
    if (source.index === destination.index) {
      return;
    }

    // Create new order array
    const reorderedModules = Array.from(modules);
    const [removed] = reorderedModules.splice(source.index, 1);
    reorderedModules.splice(destination.index, 0, removed);

    // Extract module IDs in new order
    const moduleIds = reorderedModules.map(module => module.id);

    try {
      setDragDisabled(true);
      await reorderModulesMutation.mutateAsync({
        sectionId,
        moduleIds,
      });
    } catch (error) {
      console.error('Failed to reorder modules:', error);
      // Error handling is managed by the mutation's onError callback
    } finally {
      setDragDisabled(false);
    }
  }, [modules, sectionId, reorderModulesMutation, enableDragDrop]);

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
        message={error.message || t('creator.components.modulesSection.loadError', 'Failed to load modules')}
        onDismiss={() => refetch()}
      />
    );
  }

  return (
    <div className="modules-section">
      <div className="flex justify-between items-center mb-6">
        <h4 className="text-lg font-semibold text-neutral-900">
          {t('creator.components.modulesSection.title', 'Section Modules')}
        </h4>
        <button
          onClick={onCreateModule}
          className="btn btn-primary btn-sm"
        >
          {t('creator.components.modulesSection.addModule', 'Add Module')}
        </button>
      </div>

      {modules.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="text-neutral-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14-7H5m14 14H5" />
            </svg>
          </div>
          <p className="text-neutral-500 mb-4">
            {t('creator.components.modulesSection.noModules', 'No modules found. Create your first module!')}
          </p>
          <button
            onClick={onCreateModule}
            className="btn btn-primary btn-sm"
          >
            {t('creator.components.modulesSection.createFirst', 'Create First Module')}
          </button>
        </div>
      ) : enableDragDrop ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="modules-list" isDropDisabled={dragDisabled}>
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-3 ${
                  snapshot.isDraggingOver ? 'bg-primary-50 rounded-lg p-2' : ''
                }`}
              >
                {modules.map((module, index) => (
                  <Draggable
                    key={module.id}
                    draggableId={module.id}
                    index={index}
                    isDragDisabled={dragDisabled}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${
                          snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                        }`}
                      >
                        <ModuleCard
                          module={module}
                          isSelected={selectedModule === module.id}
                          onView={handleModuleView}
                          onEdit={onEditModule}
                          onDelete={onDeleteModule}
                          showSelection={false}
                          showActions={true}
                          dragHandleProps={provided.dragHandleProps}
                          isDragging={snapshot.isDragging}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="space-y-3">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              isSelected={selectedModule === module.id}
              onView={handleModuleView}
              onEdit={onEditModule}
              onDelete={onDeleteModule}
              showSelection={false}
              showActions={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ModulesSection;