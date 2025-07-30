import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { EnhancedModuleForm } from '../forms/EnhancedModuleForm';
import { useCreateModuleMutation, useUpdateModuleMutation } from '../../hooks/useModules';
import { Module } from '../../utils/types';
import { ModuleFormData } from '../../utils/validation';

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

  const handleSubmit = async (data: ModuleFormData): Promise<Module> => {
    if (isEditing && initialData?.id) {
      return updateModuleMutation.mutateAsync({
        id: initialData.id,
        moduleData: data,
      });
    } else {
      return createModuleMutation.mutateAsync({
        sectionId,
        moduleData: {
          ...data,
          sectionId,
        },
      });
    }
  };

  const handleSuccess = (_module: Module) => {
    onSuccess();
    onClose();
  };

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
      <EnhancedModuleForm
        sectionId={sectionId}
        initialData={initialData}
        onSubmit={handleSubmit}
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </Modal>
  );
};

export default CreateOrEditModuleModal;