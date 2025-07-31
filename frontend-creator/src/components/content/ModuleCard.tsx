import React from 'react';
import { useTranslation } from 'react-i18next';
import { Module } from '../../utils/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { MODULE_TYPES } from '../../utils/constants';

interface ModuleCardProps {
  module: Module;
  isSelected?: boolean;
  onSelect?: (module: Module) => void;
  onEdit?: (module: Module) => void;
  onDelete?: (module: Module) => void;
  onView?: (module: Module) => void;
  showActions?: boolean;
  showSelection?: boolean;
  dragHandleProps?: any;
  isDragging?: boolean;
}

/**
 * Card component for displaying Module information
 * Follows the same pattern as CourseCard for consistency
 * Supports drag-and-drop functionality when dragHandleProps are provided
 */
export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  showSelection = false,
  dragHandleProps,
  isDragging = false,
}) => {
  const { t } = useTranslation();

  const handleCardClick = () => {
    if (showSelection && onSelect) {
      onSelect(module);
    } else if (onView) {
      onView(module);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(module);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('creator.components.moduleCard.deleteConfirm', 'Are you sure you want to delete this module?'))) {
      onDelete?.(module);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get module type label
  const getModuleTypeLabel = (type: string) => {
    const moduleType = MODULE_TYPES.find(mt => mt.value === type);
    return moduleType ? moduleType.label : type;
  };

  // Get module type icon
  const getModuleTypeIcon = (type: string) => {
    switch (type) {
      case 'informative':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        );
      case 'basic_lesson':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        );
      case 'reading':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        );
      case 'dialogue':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        );
      case 'exam':
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        );
      default:
        return (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
        );
    }
  };

  return (
    <Card
      className={`module-card transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-lg'
      } ${showSelection || onView ? 'cursor-pointer' : ''} ${
        isDragging ? 'shadow-xl bg-white' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        {/* Drag Handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="mr-3 pt-1 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600"
            title="Drag to reorder"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
        )}

        {/* Selection Checkbox */}
        {showSelection && (
          <div className="mr-4 pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect?.(module)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
          </div>
        )}

        {/* Module Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-neutral-900 truncate">
                {module.name}
              </h3>
              <div className="flex items-center mt-1 space-x-4">
                <div className="flex items-center text-sm text-neutral-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {getModuleTypeIcon(module.moduleType)}
                  </svg>
                  {getModuleTypeLabel(module.moduleType)}
                </div>
                <div className="flex items-center text-sm text-neutral-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  {t('creator.components.moduleCard.order', 'Order')}: {module.order}
                </div>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex space-x-2 ml-4">
                {onView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(module);
                    }}
                    title={t('common.buttons.view', 'View')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    title={t('common.buttons.edit', 'Edit')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDelete}
                    className="text-error border-error hover:bg-error hover:text-white"
                    title={t('common.buttons.delete', 'Delete')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-3 border-t border-neutral-100">
            <div className="flex items-center space-x-4">
              <span>
                {t('creator.components.moduleCard.id', 'ID')}: {module.id}
              </span>
              <span>
                {t('creator.components.moduleCard.created', 'Created')}: {formatDate(module.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ModuleCard;