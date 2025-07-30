/**
 * Enhanced Lesson Form using DynamicForm
 * 
 * This component demonstrates the DRY implementation by using the
 * centralized DynamicForm for lesson management.
 * 
 * @module EnhancedLessonForm
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lesson } from '../../utils/types';
import { LessonFormData } from '../../utils/validation';
import { DynamicForm, FormField } from './DynamicForm';

interface EnhancedLessonFormProps {
  moduleId: string;
  initialData?: Partial<Lesson> | undefined;
  onSuccess?: (lesson: Lesson) => void;
  onCancel?: () => void;
  onSubmit: (data: LessonFormData) => Promise<Lesson>;
}

/**
 * Enhanced Lesson Form component using DynamicForm architecture
 */
export const EnhancedLessonForm: React.FC<EnhancedLessonFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom field configurations
  const customFields: FormField<LessonFormData>[] = [
    {
      name: 'experiencePoints',
      type: 'number',
      label: t('creator.forms.lesson.experiencePoints', 'Experience Points'),
      placeholder: '10',
      description: t('creator.forms.lesson.experiencePointsHelp', 'Points awarded for completing this lesson (1-1000)'),
      required: true,
      span: 6,
      props: { min: 1, max: 1000, step: 1 },
    },
    {
      name: 'order',
      type: 'number',
      label: t('creator.forms.lesson.order', 'Order'),
      placeholder: '0',
      description: t('creator.forms.lesson.orderHelp', 'Display order within the module'),
      required: true,
      span: 6,
      props: { min: 0, max: 999, step: 1 },
    },
  ];

  // Prepare initial values
  const initialValues: Partial<LessonFormData> = {
    experiencePoints: initialData?.experiencePoints || 10,
    order: initialData?.order || 0,
  };

  // Enhanced form submission
  const handleFormSubmit = async (data: LessonFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await onSubmit(data);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error: any) {
      console.error('Lesson form submission failed:', error);
      setError(error.message || t('common.messages.error', 'An error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DynamicForm<LessonFormData>
      entityType="lesson"
      customFields={customFields}
      initialValues={initialValues}
      onSubmit={handleFormSubmit}
      onCancel={onCancel || undefined}
      loading={isSubmitting}
      error={error}
      config={{
        entityType: 'lesson',
        title: initialData?.id 
          ? t('creator.modals.lesson.editTitle', 'Edit Lesson')
          : t('creator.modals.lesson.createTitle', 'Create New Lesson'),
        description: t('creator.forms.lesson.description', 'Configure the lesson details for this module.'),
        fields: customFields,
        schema: undefined as any, // Will use entitySchemas.lesson
        layout: {
          columns: 2,
          className: 'space-y-6',
        },
        autoSave: undefined,
      }}
    />
  );
};

export default EnhancedLessonForm;