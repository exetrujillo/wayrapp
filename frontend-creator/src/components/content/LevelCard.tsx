import React from 'react';
import { useTranslation } from 'react-i18next';
import { Level } from '../../utils/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface LevelCardProps {
  level: Level;
  isSelected?: boolean;
  onSelect?: (level: Level) => void;
  onEdit?: (level: Level) => void;
  onDelete?: (level: Level) => void;
  onView?: (level: Level) => void;
  showActions?: boolean;
  showSelection?: boolean;
  enableDragHandle?: boolean;
  dragHandleProps?: any;
}

/**
 * Enhanced card component for displaying Level information
 * Features:
 * - Drag handle for reordering
 * - Selection checkbox for bulk operations
 * - Level-specific validation indicators
 * - Responsive design with touch-friendly interactions
 */
export const LevelCard: React.FC<LevelCardProps> = ({
  level,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  showSelection = false,
  enableDragHandle = false,
  dragHandleProps,
}) => {
  const { t } = useTranslation();

  const handleCardClick = () => {
    if (showSelection && onSelect) {
      onSelect(level);
    } else if (onView) {
      onView(level);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(level);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('creator.components.levelCard.deleteConfirm', 'Are you sure you want to delete this level?'))) {
      onDelete?.(level);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card
      className={`level-card relative transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-lg'
      } ${showSelection || onView ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        {/* Drag Handle */}
        {enableDragHandle && (
          <div 
            {...dragHandleProps}
            className="mr-3 pt-1 cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600" 
            title="Drag to reorder"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
        )}

        {/* Selection Checkbox */}
        {showSelection && (
          <div className="mr-4 pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect?.(level)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
              aria-label={t('creator.components.levelCard.selectLevel', 'Select level {{name}}', { name: level.name })}
            />
          </div>
        )}

        {/* Level Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-neutral-900 truncate">
                {level.name}
              </h3>
              <div className="flex items-center mt-1 space-x-4">
                <div className="flex items-center text-sm text-neutral-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {t('creator.components.levelCard.code', 'Code')}: {level.code}
                </div>
                <div className="flex items-center text-sm text-neutral-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  {t('creator.components.levelCard.order', 'Order')}: {level.order}
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
                      onView(level);
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
                {t('creator.components.levelCard.id', 'ID')}: {level.id}
              </span>
              <span>
                {t('creator.components.levelCard.created', 'Created')}: {formatDate(level.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LevelCard;