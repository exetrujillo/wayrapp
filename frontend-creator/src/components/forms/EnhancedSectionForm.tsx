/**
 * Enhanced Section Form using DynamicForm
 * 
 * This component demonstrates the DRY implementation by using the
 * centralized DynamicForm for section management.
 * 
 * @module EnhancedSectionForm
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Section } from '../../utils/types';
import { SectionFormData } from '../../utils/validation';
import { DynamicForm, FormField } from './DynamicForm';

interface EnhancedSectionFormProps {
  levelId: string;
  initialData?: Partial<Section> | undefined;
  onSuccess?: (section: Section) => void;
  onCancel?: () => void;
  onSubmit: (data: SectionFormData) => Promise<Section>;
}

/**
 * Enhanced Section Form component using DynamicForm architecture
 */
export const EnhancedSectionForm: React.FC<EnhancedSectionFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom field configurations
  const customFields: FormField<SectionFormData>[] = [
    {
      name: 'id',
      type: 'text',
      label: t('creator.forms.section.id', 'Section ID'),
      placeholder: 'grammar-basics',
      description: t('creator.forms.section.idHelp', 'Unique identifier (lowercase, hyphens allowed)'),
      required: true,
      span: 6,
      props: { maxLength: 40 },
    },
    {
      name: 'name',
      type: 'text',
      label: t('creator.forms.section.name', 'Section Name'),
      placeholder: 'Grammar Basics',
      description: t('creator.forms.section.nameHelp', 'Descriptive name for the section'),
      required: true,
      span: 6,
      props: { maxLength: 150 },
    },
    {
      name: 'order',
      type: 'number',
      label: t('creator.forms.section.order', 'Order'),
      placeholder: '1',
      description: t('creator.forms.section.orderHelp', 'Display order within the level'),
      required: true,
      span: 12,
      props: { min: 1, max: 999, step: 1 },
    },
  ];

  // Prepare initial values
  const initialValues: Partial<SectionFormData> = {
    id: initialData?.id || '',
    name: initialData?.name || '',
    order: initialData?.order || 1,
  };

  // Enhanced form submission
  const handleFormSubmit = async (data: SectionFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await onSubmit(data);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error: any) {
      console.error('Section form submission failed:', error);
      setError(error.message || t('common.messages.error', 'An error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DynamicForm<SectionFormData>
      entityType="section"
      customFields={customFields}
      initialValues={initialValues}
      onSubmit={handleFormSubmit}
      onCancel={onCancel || undefined}
      loading={isSubmitting}
      error={error}
      config={{
        entityType: 'section',
        title: initialData?.id 
          ? t('creator.modals.section.editTitle', 'Edit Section')
          : t('creator.modals.section.createTitle', 'Create New Section'),
        description: t('creator.forms.section.description', 'Configure the section details for this level.'),
        fields: customFields,
        schema: undefined as any, // Will use entitySchemas.section
        layout: {
          columns: 2,
          className: 'space-y-6',
        },
        autoSave: undefined,
      }}
    />
  );
};

export default EnhancedSectionForm;