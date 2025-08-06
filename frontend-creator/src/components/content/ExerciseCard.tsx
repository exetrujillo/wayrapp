import React from 'react';
import { useTranslation } from 'react-i18next';
import { Exercise } from '../../utils/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { EXERCISE_TYPES } from '../../utils/constants';

interface ExerciseCardProps {
  exercise: Exercise;
  isSelected?: boolean;
  onSelect?: (exercise: Exercise) => void;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exercise: Exercise) => void;
  onView?: (exercise: Exercise) => void;
  onPreview?: (exercise: Exercise) => void;
  showActions?: boolean;
  showSelection?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onView,
  onPreview,
  showActions = true,
  showSelection = false,
}) => {
  const { t } = useTranslation();

  // Get exercise type label
  const getExerciseTypeLabel = (type: string) => {
    const exerciseType = EXERCISE_TYPES.find(et => et.value === type);
    return exerciseType ? exerciseType.label : type;
  };

  // Get exercise type icon
  const getExerciseTypeIcon = (type: string) => {
    switch (type) {
      case 'translation':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        );
      case 'multiple_choice':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'fill_in_the_blank':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'matching':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'listening':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        );
      case 'speaking':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  // Extract preview content from exercise data
  const getPreviewContent = () => {
    const { data } = exercise;

    switch (exercise.exerciseType) {
      case 'translation':
        return data['source_text'] || data['text'] || t('creator.components.exerciseCard.noPreview', 'No preview available');
      case 'translation-word-bank':
        return data['source_text'] || t('creator.components.exerciseCard.noPreview', 'No preview available');
      case 'vof':
        return data['question'] || t('creator.components.exerciseCard.noPreview', 'No preview available');
      case 'fill-in-the-blank':
        return data['sentence'] || data['text'] || t('creator.components.exerciseCard.noPreview', 'No preview available');
      case 'pairs':
        return data['pairs'] ? `${data['pairs'].length} pairs` : t('creator.components.exerciseCard.noPreview', 'No preview available');
      case 'informative':
        return data['content'] || t('creator.components.exerciseCard.noPreview', 'No preview available');
      case 'ordering':
        return data['items'] ? `${data['items'].length} items` : t('creator.components.exerciseCard.noPreview', 'No preview available');
      default:
        return t('creator.components.exerciseCard.noPreview', 'No preview available');
    }
  };

  const handleCardClick = () => {
    if (showSelection && onSelect) {
      onSelect(exercise);
    } else if (onView) {
      onView(exercise);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(exercise);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('creator.components.exerciseCard.deleteConfirm', 'Are you sure you want to delete this exercise?'))) {
      onDelete?.(exercise);
    }
  };

  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPreview?.(exercise);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card
      className={`exercise-card transition-all duration-200 ${isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-lg'
        } ${showSelection || onView ? 'cursor-pointer' : ''}`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        {/* Selection Checkbox */}
        {showSelection && (
          <div className="mr-4 pt-1">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect?.(exercise)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
          </div>
        )}

        {/* Exercise Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 p-2 bg-primary-100 rounded-lg text-primary-600">
                {getExerciseTypeIcon(exercise.exerciseType)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">
                  {getExerciseTypeLabel(exercise.exerciseType)}
                </h3>
                <p className="text-sm text-neutral-500">
                  {t('creator.components.exerciseCard.id', 'ID')}: {exercise.id}
                </p>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex space-x-2 ml-4">
                {onPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreview}
                    title={t('creator.components.exerciseCard.preview', 'Preview')}
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

          {/* Preview Content */}
          <div className="mb-3">
            <p className="text-sm text-neutral-600 line-clamp-2">
              {getPreviewContent()}
            </p>
          </div>

          {/* Data Summary */}
          <div className="mb-3">
            <div className="flex flex-wrap gap-2">
              {exercise.data && Object.keys(exercise.data).slice(0, 3).map((key) => (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800"
                >
                  {key}: {exercise.data[key] && typeof exercise.data[key] === 'object'
                    ? `${Object.keys(exercise.data[key]).length} items`
                    : String(exercise.data[key] || '').substring(0, 20) + (String(exercise.data[key] || '').length > 20 ? '...' : '')
                  }
                </span>
              ))}
              {exercise.data && Object.keys(exercise.data).length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">
                  +{Object.keys(exercise.data || {}).length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-3 border-t border-neutral-100">
            <div className="flex items-center space-x-4">
              <span>
                {t('creator.components.exerciseCard.created', 'Created')}: {formatDate(exercise.createdAt)}
              </span>
              <span>
                {t('creator.components.exerciseCard.updated', 'Updated')}: {formatDate(exercise.updatedAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ExerciseCard;