import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { UnifiedEntityForm } from '../forms/UnifiedEntityForm';
import { useCreateSectionMutation, useUpdateSectionMutation } from '../../hooks/useSections';
import { Section } from '../../utils/types';
import { SectionFormData } from '../../utils/validation';

interface CreateOrEditSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelId: string;
  initialData?: Partial<Section>;
  onSuccess: () => void;
}

/**
 * Modal component for creating or editing sections
 * Uses Modal component from src/components/ui and EnhancedSectionForm (DRY implementation)
 */
export const CreateOrEditSectionModal: React.FC<CreateOrEditSectionModalProps> = ({
  isOpen,
  onClose,
  levelId,
  initialData,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const createSectionMutation = useCreateSectionMutation();
  const updateSectionMutation = useUpdateSectionMutation();

  const isEditing = !!initialData?.id;

  const handleSubmit = async (data: SectionFormData): Promise<Section> => {
    if (isEditing && initialData?.id) {
      return updateSectionMutation.mutateAsync({
        id: initialData.id,
        sectionData: data,
      });
    } else {
      return createSectionMutation.mutateAsync({
        levelId,
        sectionData: data,
      });
    }
  };

  const handleSuccess = (_section: Section) => {
    onSuccess();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const title = isEditing
    ? t('creator.modals.section.editTitle', 'Edit Section')
    : t('creator.modals.section.createTitle', 'Create New Section');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <UnifiedEntityForm<SectionFormData>
        entityType="section"
        mode={initialData?.id ? 'edit' : 'create'}
        parentId={levelId}
        initialData={initialData as Partial<SectionFormData>}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </Modal>
  );
};

export default CreateOrEditSectionModal;