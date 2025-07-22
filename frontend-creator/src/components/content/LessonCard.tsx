import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lesson } from '../../utils/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface LessonCardProps {
  lesson: Lesson;
  onEdit?: (lesson: Lesson) => void;
  onDelete?: (lesson: Lesson) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onEdit, onDelete }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{lesson.name}</h3>
            <p className="text-sm text-neutral-500">
              {t('creator.components.lessonCard.moduleId', 'Module')}: {lesson.moduleId}
            </p>
            <p className="text-sm text-neutral-500">
              {t('creator.components.lessonCard.order', 'Order')}: {lesson.order}
            </p>
            <p className="text-sm text-neutral-500">
              {t('creator.components.lessonCard.xp', 'XP')}: {lesson.experience_points}
            </p>
          </div>
          <div className="flex space-x-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(lesson)}
              >
                {t('common.buttons.edit', 'Edit')}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-error border-error hover:bg-error hover:text-white"
                onClick={() => onDelete(lesson)}
              >
                {t('common.buttons.delete', 'Delete')}
              </Button>
            )}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-between items-center">
          <span className="text-xs text-neutral-500">
            {t('creator.components.lessonCard.id', 'ID')}: {lesson.id}
          </span>
          <Link to={`/lessons/${lesson.id}/exercises`}>
            <Button variant="primary" size="sm">
              {t('creator.components.lessonCard.manageExercises', 'Manage Exercises')}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};

export default LessonCard;