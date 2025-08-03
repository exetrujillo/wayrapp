import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Course } from '../../utils/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { LANGUAGES, getLanguageDisplayName } from '../../utils/languages';

interface CourseCardProps {
  course: Course;
  isSelected?: boolean;
  onSelect?: (course: Course) => void;
  onEdit?: (course: Course) => void;
  onDelete?: (course: Course) => void;
  onView?: (course: Course) => void;
  showActions?: boolean;
  showSelection?: boolean;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  isSelected = false,
  onSelect,
  onEdit,
  onDelete,
  onView,
  showActions = true,
  showSelection = false,
}) => {
  const { t } = useTranslation();

  // Get language names from codes
  const getLanguageName = (code: string) => {
    const language = LANGUAGES.find(lang => lang.code === code);
    return language ? getLanguageDisplayName(language) : code;
  };

  const handleCardClick = () => {
    if (showSelection && onSelect) {
      onSelect(course);
    } else if (onView) {
      onView(course);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(course);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('creator.components.courseCard.deleteConfirm', 'Are you sure you want to delete this course?'))) {
      onDelete?.(course);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card
      className={`course-card transition-all duration-200 ${
        isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-lg'
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
              onChange={() => onSelect?.(course)}
              onClick={(e) => e.stopPropagation()}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
            />
          </div>
        )}

        {/* Course Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-neutral-900 truncate">
                {course.name}
              </h3>
              <div className="flex items-center mt-1 space-x-4">
                <div className="flex items-center text-sm text-neutral-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  {getLanguageName(course.sourceLanguage)} → {getLanguageName(course.targetLanguage)}
                </div>
                <div className="flex items-center text-sm text-neutral-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {course.isPublic ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    )}
                  </svg>
                  {course.isPublic 
                    ? t('creator.components.courseCard.public', 'Public')
                    : t('creator.components.courseCard.private', 'Private')
                  }
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
                      onView(course);
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

          {/* Description */}
          {course.description && (
            <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
              {course.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-3 border-t border-neutral-100">
            <div className="flex items-center space-x-4">
              <span>
                {t('creator.components.courseCard.id', 'ID')}: {course.id}
              </span>
              <span>
                {t('creator.components.courseCard.created', 'Created')}: {formatDate(course.createdAt)}
              </span>
            </div>
            <div className="flex space-x-2">
              <Link
                to={`/courses/${course.id}`}
                onClick={(e) => e.stopPropagation()}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {t('creator.components.courseCard.manageContent', 'Manage Content')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CourseCard;