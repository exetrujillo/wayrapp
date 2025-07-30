import React from 'react';
import { useTranslation } from 'react-i18next';
import { Module } from '../../utils/types';
import { useModulesQuery } from '../../hooks/useModules';
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
 * Uses ModuleCard for consistent UI patterns
 */
export const ModulesSection: React.FC<ModulesSectionProps> = ({
  sectionId,
  selectedModule,
  onModuleSelect,
  onCreateModule,
  onEditModule,
  onDeleteModule,
}) => {
  const { t } = useTranslation();
  
  const {
    data: modulesResponse,
    isLoading,
    error,
    refetch,
  } = useModulesQuery(sectionId);

  const modules = modulesResponse?.data || [];

  const handleModuleView = (module: Module) => {
    onModuleSelect(module.id);
  };

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