import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { SimpleSectionForm } from '../forms/SimpleSectionForm';
import { useCreateSectionMutation, useUpdateSectionMutation } from '../../hooks/useSections';
import { Section } from '../../utils/types';
import { SectionFormData } from '../../utils/validation';

// Helper function to generate section ID from name (similar to level ID generation)
const generateSectionId = (levelId: string, name: string): string => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  return `${levelId}-${slug}`;
};

// Form data type without ID (similar to level form)
type SectionFormInput = Omit<SectionFormData, 'id'>;

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

  // Add stable success handler
  const handleSuccess = useCallback((section: Section) => {
    console.log('🔧 Section creation/update successful:', section);
    onSuccess();
    onClose();
  }, [onSuccess, onClose]);

  const handleSubmit = useCallback(async (data: SectionFormInput): Promise<void> => {
    console.log('🔧 Section form submitted with data:', data);
    console.log('🔧 Level ID:', levelId);
    console.log('🔧 Is editing:', isEditing);

    try {
      let result: Section;

      if (isEditing && initialData?.id) {
        console.log('🔧 Updating existing section');
        result = await updateSectionMutation.mutateAsync({
          levelId: levelId,
          id: initialData.id,
          sectionData: data,
        });
      } else {
        // Generate a unique ID for the section based on level ID and section name
        const sectionId = generateSectionId(levelId, data.name);
        console.log('🔧 Creating new section with ID:', sectionId);

        result = await createSectionMutation.mutateAsync({
          levelId,
          sectionData: {
            ...data,
            id: sectionId,
          },
        });
      }

      console.log('🔧 Section creation/update successful:', result);
      handleSuccess(result);
    } catch (error) {
      console.error('🔧 Section creation/update failed:', error);
      throw error; // Re-throw so the form can handle the error
    }
  }, [levelId, isEditing, initialData?.id, updateSectionMutation, createSectionMutation, handleSuccess]);

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
      <SimpleSectionForm
        initialData={initialData as Partial<SectionFormInput>}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createSectionMutation.isPending || updateSectionMutation.isPending}
      />
    </Modal>
  );
};

export default CreateOrEditSectionModal;