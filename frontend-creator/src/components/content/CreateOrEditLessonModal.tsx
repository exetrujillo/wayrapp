import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { SimpleLessonForm } from '../forms/SimpleLessonForm';
import { useCreateLessonMutation, useUpdateLessonMutation } from '../../hooks/useLessons';
import { Lesson } from '../../utils/types';
import { LessonFormData } from '../../utils/validation';

// Helper function to generate lesson ID from module ID and name
const generateLessonId = (moduleId: string, name: string): string => {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  const fullId = `${moduleId}-${slug}`;

  // Ensure the ID doesn't exceed 60 characters (backend limit)
  if (fullId.length > 60) {
    const maxSlugLength = 60 - moduleId.length - 1; // -1 for the hyphen
    const truncatedSlug = slug.substring(0, maxSlugLength);
    return `${moduleId}-${truncatedSlug}`;
  }

  return fullId;
};

// Form data type (lessons use the full LessonFormData since they don't have ID in creation)
type LessonFormInput = LessonFormData;

interface CreateOrEditLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  initialData?: Partial<Lesson>;
  onSuccess: () => void;
}

/**
 * Modal component for creating or editing lessons
 * Uses Modal component from src/components/ui and SimpleLessonForm (DRY implementation)
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

  // Add stable success handler
  const handleSuccess = useCallback((lesson: Lesson) => {
    console.log('🔧 Lesson creation/update successful:', lesson);
    onSuccess();
    onClose();
  }, [onSuccess, onClose]);

  const handleSubmit = useCallback(async (data: LessonFormInput): Promise<void> => {
    console.log('🔧 Lesson form submitted with data:', data);
    console.log('🔧 Module ID:', moduleId);
    console.log('🔧 Is editing:', isEditing);

    try {
      let result: Lesson;

      if (isEditing && initialData?.id) {
        console.log('🔧 Updating existing lesson');
        result = await updateLessonMutation.mutateAsync({
          moduleId,
          id: initialData.id,
          lessonData: {
            ...data,
            description: data.description || undefined,
          },
        });
      } else {
        // Generate a unique ID for the lesson based on module ID and lesson name
        const lessonId = generateLessonId(moduleId, data.name);
        console.log('🔧 Creating new lesson with ID:', lessonId);

        result = await createLessonMutation.mutateAsync({
          moduleId,
          lessonData: {
            ...data,
            id: lessonId,
            description: data.description || undefined,
          },
        });
      }

      console.log('🔧 Lesson creation/update successful:', result);
      handleSuccess(result);
    } catch (error) {
      console.error('🔧 Lesson creation/update failed:', error);
      throw error; // Re-throw so the form can handle the error
    }
  }, [moduleId, isEditing, initialData?.id, updateLessonMutation, createLessonMutation, handleSuccess]);

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
      <SimpleLessonForm
        initialData={initialData as Partial<LessonFormInput>}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isSubmitting={createLessonMutation.isPending || updateLessonMutation.isPending}
      />
    </Modal>
  );
};

export default CreateOrEditLessonModal;