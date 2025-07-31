import React from 'react';
import { useTranslation } from 'react-i18next';
import { Lesson } from '../../utils/types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface LessonPreviewModalProps {
  lesson: Lesson | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (lesson: Lesson) => void;
}

/**
 * Modal component for previewing lesson details
 * Provides a quick overview of lesson information without navigating away
 */
export const LessonPreviewModal: React.FC<LessonPreviewModalProps> = ({
  lesson,
  isOpen,
  onClose,
  onEdit,
}) => {
  const { t } = useTranslation();

  if (!lesson) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleEdit = () => {
    onEdit?.(lesson);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('creator.components.lessonPreview.title', 'Lesson Preview')}
      size="lg"
    >
      <div className="space-y-6">
        {/* Lesson Header */}
        <Card className="bg-gradient-to-r from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary-900">
                {t('creator.components.lessonPreview.lessonNumber', 'Lesson')} #{lesson.order}
              </h2>
              <p className="text-primary-700 mt-1">
                {t('creator.components.lessonPreview.moduleId', 'Module')}: {lesson.moduleId}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-primary-800 font-semibold">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {lesson.experiencePoints} {t('creator.components.lessonPreview.xp', 'XP')}
              </div>
            </div>
          </div>
        </Card>

        {/* Lesson Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              {t('creator.components.lessonPreview.basicInfo', 'Basic Information')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">
                  {t('creator.components.lessonPreview.id', 'Lesson ID')}:
                </span>
                <span className="font-mono text-sm bg-neutral-100 px-2 py-1 rounded">
                  {lesson.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">
                  {t('creator.components.lessonPreview.order', 'Order')}:
                </span>
                <span className="font-semibold">#{lesson.order}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">
                  {t('creator.components.lessonPreview.experiencePoints', 'Experience Points')}:
                </span>
                <span className="font-semibold text-primary-600">{lesson.experiencePoints} XP</span>
              </div>
            </div>
          </Card>

          {/* Metadata */}
          <Card>
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">
              {t('creator.components.lessonPreview.metadata', 'Metadata')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">
                  {t('creator.components.lessonPreview.created', 'Created')}:
                </span>
                <span className="text-sm">{formatDate(lesson.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">
                  {t('creator.components.lessonPreview.updated', 'Last Updated')}:
                </span>
                <span className="text-sm">{formatDate(lesson.updatedAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">
                  {t('creator.components.lessonPreview.moduleId', 'Module ID')}:
                </span>
                <span className="font-mono text-sm bg-neutral-100 px-2 py-1 rounded">
                  {lesson.moduleId}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            {t('common.buttons.close', 'Close')}
          </Button>
          {onEdit && (
            <Button
              variant="primary"
              onClick={handleEdit}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {t('common.buttons.edit', 'Edit')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default LessonPreviewModal;