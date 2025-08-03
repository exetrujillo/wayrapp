import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { SimpleModuleForm } from '../forms/SimpleModuleForm';
import { useCreateModuleMutation, useUpdateModuleMutation } from '../../hooks/useModules';
import { Module } from '../../utils/types';
import { ModuleFormData } from '../../utils/validation';

// Helper function to generate module ID from name (similar to section ID generation)
const generateModuleId = (sectionId: string, name: string): string => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  return `${sectionId}-${slug}`;
};

// Form data type (module schema doesn't include ID, so we can use it directly)
type ModuleFormInput = ModuleFormData;

interface CreateOrEditModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  initialData?: Partial<Module>;
  onSuccess: () => void;
}

/**
 * Modal component for creating or editing modules
 * Uses Modal component from src/components/ui and EnhancedModuleForm (DRY implementation)
 */
export const CreateOrEditModuleModal: React.FC<CreateOrEditModuleModalProps> = ({
  isOpen,
  onClose,
  sectionId,
  initialData,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const createModuleMutation = useCreateModuleMutation();
  const updateModuleMutation = useUpdateModuleMutation();

  const isEditing = !!initialData?.id;

  // Add stable success handler
  const handleSuccess = useCallback((module: Module) => {
    console.log('🔧 Module creation/update successful:', module);
    onSuccess();
    onClose();
  }, [onSuccess, onClose]);

  const handleSubmit = useCallback(async (data: ModuleFormInput): Promise<void> => {
    console.log('🔧 Module form submitted with data:', data);
    console.log('🔧 Section ID:', sectionId);
    console.log('🔧 Is editing:', isEditing);

    try {
      let result: Module;

      if (isEditing && initialData?.id) {
        console.log('🔧 Updating existing module');
        result = await updateModuleMutation.mutateAsync({
          sectionId,
          id: initialData.id,
          moduleData: data,
        });
      } else {
        // Generate a unique ID for the module based on section ID and module name
        const moduleId = generateModuleId(sectionId, data.name);
        console.log('🔧 Creating new module with ID:', moduleId);

        result = await createModuleMutation.mutateAsync({
          sectionId,
          moduleData: {
            ...data,
            id: moduleId,
            sectionId,
          },
        });
      }

      console.log('🔧 Module creation/update successful:', result);
      handleSuccess(result);
    } catch (error) {
      console.error('🔧 Module creation/update failed:', error);
      throw error; // Re-throw so the form can handle the error
    }
  }, [sectionId, isEditing, initialData?.id, updateModuleMutation, createModuleMutation, handleSuccess]);

  const handleCancel = () => {
    onClose();
  };

  const title = isEditing
    ? t('creator.modals.module.editTitle', 'Edit Module')
    : t('creator.modals.module.createTitle', 'Create New Module');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <SimpleModuleForm
        initialData={initialData as Partial<ModuleFormInput>}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createModuleMutation.isPending || updateModuleMutation.isPending}
      />
    </Modal>
  );
};

export default CreateOrEditModuleModal;