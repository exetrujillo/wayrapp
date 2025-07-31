import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lesson } from '../../utils/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface LessonCardProps {
  lesson: Lesson;
  isSelected?: boolean;
  onSelect?: (lesson: Lesson) => void;
  onEdit?: (lesson: Lesson) => void;
  onDelete?: (lesson: Lesson) => void;
  onView?: (lesson: Lesson) => void;
  onPreview?: (lesson: Lesson) => void;
  showActions?: boolean;
  showSelection?: boolean;
  dragHandleProps?: any;
  isDragging?: boolean;
}

/**
 * Card component for displaying Lesson information
 * Follows the same pattern as CourseCard for consistency
 * Enhanced with drag-and-drop support for reordering
 */
export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onView,
  onPreview,
  showActions = true,
  showSelection = false,
  dragHandleProps,
  isDragging = false,
}) => {
  const { t } = useTranslation();

  const handleCardClick = () => {
    if (showSelection && onSelect) {
      onSelect(lesson);
    } else if (onView) {
      onView(lesson);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(lesson);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('creator.components.lessonCard.deleteConfirm', 'Are you sure you want to delete this lesson?'))) {
      onDelete?.(lesson);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card
      className={`lesson-card transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-lg'
      } ${showSelection || onView ? 'cursor-pointer' : ''} ${
        isDragging ? 'shadow-xl bg-white border-primary-300' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between">
        {/* Drag Handle */}
        {dragHandleProps && (
          <div 
            {...dragHandleProps}
            className="mr-3 pt-1 cursor-grab active:cursor-grabbing"
            title={t('creator.components.lessonCard.dragToReorder', 'Drag to reorder')}
          >
            <svg className="w-5 h-5 text-neutral-400 hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              onChange={() => onSelect?.(lesson)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
          </div>
        )}

        {/* Lesson Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-neutral-900 truncate">
                {t('creator.components.lessonCard.lesson', 'Lesson')} #{lesson.order}
              </h3>
              <div className="flex items-center mt-1 space-x-4">
                <div className="flex items-center text-sm text-neutral-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                  {t('creator.components.lessonCard.order', 'Order')}: {lesson.order}
                </div>
                <div className="flex items-center text-sm text-neutral-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {t('creator.components.lessonCard.xp', 'XP')}: {lesson.experiencePoints}
                </div>
              </div>
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex space-x-2 ml-4">
                {onPreview && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(lesson);
                    }}
                    title={t('creator.components.lessonCard.preview', 'Preview')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Button>
                )}
                {onView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(lesson);
                    }}
                    title={t('common.buttons.view', 'View')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                {t('creator.components.lessonCard.id', 'ID')}: {lesson.id}
              </span>
              <span>
                {t('creator.components.lessonCard.created', 'Created')}: {formatDate(lesson.createdAt)}
              </span>
            </div>
            <div className="flex space-x-2">
              <Link
                to={`/lessons/${lesson.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('creator.components.lessonCard.manageExercises', 'Manage Exercises')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default LessonCard;