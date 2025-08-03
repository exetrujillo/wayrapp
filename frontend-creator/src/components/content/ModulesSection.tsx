import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Module } from '../../utils/types';
import { useModulesQuery, useReorderModulesMutation } from '../../hooks/useModules';
import { ModuleCard } from './ModuleCard';
import { DroppableContainer } from './DroppableContainer';
import { DraggableModuleItem } from './DraggableModuleItem';
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
 * Uses ModuleCard for consistent UI patterns and supports drag-and-drop reordering with Pragmatic Drag and Drop
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

  const handleReorder = useCallback(async (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex || !enableDragDrop) {
      return;
    }

    // Create new order array
    const reorderedModules = [...modules];
    const [removed] = reorderedModules.splice(startIndex, 1);
    reorderedModules.splice(endIndex, 0, removed);

    // Extract module IDs in new order
    const module_ids = reorderedModules.map(module => module.id);

    try {
      setDragDisabled(true);
      await reorderModulesMutation.mutateAsync({
        sectionId,
        moduleIds: module_ids, // Hook expects camelCase, service handles snake_case conversion
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
        <DroppableContainer onReorder={handleReorder} className="space-y-3">
          {modules.map((module, index) => (
            <DraggableModuleItem
              key={module.id}
              module={module}
              index={index}
              isSelected={selectedModule === module.id}
              onSelect={() => onModuleSelect(module.id)}
              onView={handleModuleView}
              onEdit={onEditModule}
              onDelete={onDeleteModule}
              showActions={true}
              showSelection={false}
              isDragDisabled={dragDisabled}
            />
          ))}
        </DroppableContainer>
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