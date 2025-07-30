import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { EnhancedLevelForm } from '../forms/EnhancedLevelForm';
import { useCreateLevelMutation, useUpdateLevelMutation } from '../../hooks/useLevels';
import { Level } from '../../utils/types';
import { LevelFormData } from '../../utils/validation';

interface CreateOrEditLevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  initialData?: Partial<Level>;
  onSuccess: () => void;
}

/**
 * Modal component for creating or editing levels
 * Uses Modal component from src/components/ui and EnhancedLevelForm (DRY implementation)
 */
export const CreateOrEditLevelModal: React.FC<CreateOrEditLevelModalProps> = ({
  isOpen,
  onClose,
  courseId,
  initialData,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const createLevelMutation = useCreateLevelMutation();
  const updateLevelMutation = useUpdateLevelMutation();

  const isEditing = !!initialData?.id;

  const handleSubmit = async (data: LevelFormData): Promise<Level> => {
    if (isEditing && initialData?.id) {
      return updateLevelMutation.mutateAsync({
        courseId,
        id: initialData.id,
        levelData: data,
      });
    } else {
      // Generate a unique ID for the level based on course ID and level code
      const levelId = `${courseId}-${data.code.toLowerCase()}`;
      
      return createLevelMutation.mutateAsync({
        courseId,
        levelData: {
          ...data,
          id: levelId,
        },
      });
    }
  };

  const handleSuccess = (_level: Level) => {
    onSuccess();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const title = isEditing
    ? t('creator.modals.level.editTitle', 'Edit Level')
    : t('creator.modals.level.createTitle', 'Create New Level');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <EnhancedLevelForm
        courseId={courseId}
        initialData={initialData}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </Modal>
  );
};

export default CreateOrEditLevelModal;