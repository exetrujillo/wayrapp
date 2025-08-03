import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { SimpleLevelForm } from '../forms/SimpleLevelForm';
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

  // Add stable success handler
  const handleSuccess = useCallback((level: Level) => {
    console.log('🔧 Level creation/update successful:', level);
    onSuccess();
    onClose();
  }, [onSuccess, onClose]);

  const handleSubmit = useCallback(async (data: LevelFormData): Promise<void> => {
    console.log('🔧 Level form submitted with data:', data);
    console.log('🔧 Course ID:', courseId);
    console.log('🔧 Is editing:', isEditing);

    try {
      let result: Level;

      if (isEditing && initialData?.id) {
        console.log('🔧 Updating existing level');
        result = await updateLevelMutation.mutateAsync({
          courseId,
          id: initialData.id,
          levelData: data,
        });
      } else {
        // Generate a unique ID for the level based on course ID and level code
        const levelId = `${courseId}-${data.code.toLowerCase()}`;
        console.log('🔧 Creating new level with ID:', levelId);

        result = await createLevelMutation.mutateAsync({
          courseId,
          levelData: {
            ...data,
            id: levelId,
          },
        });
      }

      console.log('🔧 Level creation/update successful:', result);
      handleSuccess(result);
    } catch (error) {
      console.error('🔧 Level creation/update failed:', error);
      throw error; // Re-throw so the form can handle the error
    }
  }, [courseId, isEditing, initialData?.id, updateLevelMutation, createLevelMutation, handleSuccess]);

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
      <SimpleLevelForm
        initialData={initialData as Partial<LevelFormData>}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createLevelMutation.isPending || updateLevelMutation.isPending}
      />
    </Modal>
  );
};

export default CreateOrEditLevelModal;