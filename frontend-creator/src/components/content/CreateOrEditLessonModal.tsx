import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { EnhancedLessonForm } from '../forms/EnhancedLessonForm';
import { useCreateLessonMutation, useUpdateLessonMutation } from '../../hooks/useLessons';
import { Lesson } from '../../utils/types';
import { LessonFormData } from '../../utils/validation';

interface CreateOrEditLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  initialData?: Partial<Lesson>;
  onSuccess: () => void;
}

/**
 * Modal component for creating or editing lessons
 * Uses Modal component from src/components/ui and EnhancedLessonForm (DRY implementation)
 */
export const CreateOrEditLessonModal: React.FC<CreateOrEditLessonModalProps> = ({
  isOpen,
  onClose,
  moduleId,
  initialData,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const createLessonMutation = useCreateLessonMutation();
  const updateLessonMutation = useUpdateLessonMutation();

  const isEditing = !!initialData?.id;

  const handleSubmit = async (data: LessonFormData): Promise<Lesson> => {
    if (isEditing && initialData?.id) {
      return updateLessonMutation.mutateAsync({
        id: initialData.id,
        lessonData: data,
      });
    } else {
      return createLessonMutation.mutateAsync({
        moduleId,
        lessonData: data,
      });
    }
  };

  const handleSuccess = (_lesson: Lesson) => {
    onSuccess();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const title = isEditing
    ? t('creator.modals.lesson.editTitle', 'Edit Lesson')
    : t('creator.modals.lesson.createTitle', 'Create New Lesson');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <EnhancedLessonForm
        moduleId={moduleId}
        initialData={initialData}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </Modal>
  );
};

export default CreateOrEditLessonModal;