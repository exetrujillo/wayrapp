/**
 * Enhanced Module Form using DynamicForm
 * 
 * This component demonstrates the DRY implementation by using the
 * centralized DynamicForm for module management.
 * 
 * @module EnhancedModuleForm
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Module } from '../../utils/types';
import { ModuleFormData } from '../../utils/validation';
import { DynamicForm, FormField } from './DynamicForm';

interface EnhancedModuleFormProps {
  sectionId: string;
  initialData?: Partial<Module> | undefined;
  onSuccess?: (module: Module) => void;
  onCancel?: () => void;
  onSubmit: (data: ModuleFormData) => Promise<Module>;
}

/**
 * Enhanced Module Form component using DynamicForm architecture
 */
export const EnhancedModuleForm: React.FC<EnhancedModuleFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom field configurations
  const customFields: FormField<ModuleFormData>[] = [
    {
      name: 'moduleType',
      type: 'select',
      label: t('creator.forms.module.type', 'Module Type'),
      description: t('creator.forms.module.typeHelp', 'Type of content in this module'),
      required: true,
      span: 6,
      options: [
        { value: 'informative', label: t('creator.forms.module.types.informative', 'Informative') },
        { value: 'basic_lesson', label: t('creator.forms.module.types.basicLesson', 'Basic Lesson') },
        { value: 'reading', label: t('creator.forms.module.types.reading', 'Reading') },
        { value: 'dialogue', label: t('creator.forms.module.types.dialogue', 'Dialogue') },
        { value: 'exam', label: t('creator.forms.module.types.exam', 'Exam') },
      ],
    },
    {
      name: 'name',
      type: 'text',
      label: t('creator.forms.module.name', 'Module Name'),
      placeholder: 'Present Tense',
      description: t('creator.forms.module.nameHelp', 'Descriptive name for the module'),
      required: true,
      span: 6,
      props: { maxLength: 150 },
    },
    {
      name: 'order',
      type: 'number',
      label: t('creator.forms.module.order', 'Order'),
      placeholder: '0',
      description: t('creator.forms.module.orderHelp', 'Display order within the section'),
      required: true,
      span: 12,
      props: { min: 0, max: 999, step: 1 },
    },
  ];

  // Prepare initial values
  const initialValues: Partial<ModuleFormData> = {
    moduleType: initialData?.moduleType || 'basic_lesson',
    name: initialData?.name || '',
    order: initialData?.order || 0,
  };

  // Enhanced form submission
  const handleFormSubmit = async (data: ModuleFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await onSubmit(data);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error: any) {
      console.error('Module form submission failed:', error);
      setError(error.message || t('common.messages.error', 'An error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DynamicForm<ModuleFormData>
      entityType="module"
      customFields={customFields}
      initialValues={initialValues}
      onSubmit={handleFormSubmit}
      onCancel={onCancel || undefined}
      loading={isSubmitting}
      error={error}
      config={{
        entityType: 'module',
        title: initialData?.id 
          ? t('creator.modals.module.editTitle', 'Edit Module')
          : t('creator.modals.module.createTitle', 'Create New Module'),
        description: t('creator.forms.module.description', 'Configure the module details for this section.'),
        fields: customFields,
        schema: undefined as any, // Will use entitySchemas.module
        layout: {
          columns: 2,
          className: 'space-y-6',
        },
        autoSave: undefined,
      }}
    />
  );
};

export default EnhancedModuleForm;