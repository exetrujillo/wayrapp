import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sectionSchema } from '../../utils/validation';
import { FormField } from '../ui/FormField';
import { FormWrapper } from './FormWrapper';
import { ValidationStatus } from '../ui/ValidationStatus';
import { FormProgress } from '../ui/FormProgress';
import { Section } from '../../utils/types';
import { SectionFormData } from '../../utils/validation';

interface SectionFormProps {
  levelId: string;
  initialData?: Partial<Section> | undefined;
  onSuccess?: (section: Section) => void;
  onCancel?: () => void;
  onSubmit: (data: SectionFormData) => Promise<Section>;
}

/**
 * Form component for creating and editing sections
 * Follows the same pattern as LessonForm for consistency
 */
export const SectionForm: React.FC<SectionFormProps> = ({ 
  levelId: _levelId, 
  initialData, 
  onSuccess, 
  onCancel,
  onSubmit
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isValid, touchedFields },
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: initialData?.name || '',
      order: initialData?.order || 0,
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  // Validation rules for real-time feedback
  const validationRules = [
    {
      key: 'name-required',
      label: t('creator.forms.section.validation.nameRequired', 'Section name is required'),
      isValid: !!watchedValues.name && watchedValues.name.trim().length > 0,
      isRequired: true,
    },
    {
      key: 'name-length',
      label: t('creator.forms.section.validation.nameLength', 'Name must be 3-150 characters'),
      isValid: !!watchedValues.name && watchedValues.name.trim().length >= 3 && watchedValues.name.length <= 150,
      isRequired: true,
    },
    {
      key: 'order-valid',
      label: t('creator.forms.section.validation.orderValid', 'Order must be a valid number (0-999)'),
      isValid: watchedValues.order !== undefined && watchedValues.order >= 0 && watchedValues.order <= 999,
      isRequired: true,
    },
  ];

  const validFields = validationRules.filter(rule => rule.isValid).length;
  const requiredFields = validationRules.filter(rule => rule.isRequired).length;
  const validRequiredFields = validationRules.filter(rule => rule.isRequired && rule.isValid).length;

  const handleFormSubmit = async (data: SectionFormData) => {
    setIsSubmitting(true);
    setFeedback(null);
    
    try {
      const response = await onSubmit(data);
      
      setFeedback({
        type: 'success',
        message: initialData?.id 
          ? t('creator.forms.section.updateSuccessMessage', 'Section updated successfully!')
          : t('creator.forms.section.createSuccessMessage', 'Section created successfully!'),
      });
      
      reset();
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error: any) {
      setFeedback({
        type: 'error',
        message: error.message || t('common.messages.error', 'An error occurred'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Progress */}
      <FormProgress
        totalFields={validationRules.length}
        validFields={validFields}
        requiredFields={requiredFields}
        validRequiredFields={validRequiredFields}
        showDetails={false}
      />

      <FormWrapper
        onSubmit={handleSubmit(handleFormSubmit)}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
        isValid={isValid}
        submitText={initialData?.id 
          ? t('creator.forms.section.update', 'Update Section')
          : t('creator.forms.section.create', 'Create Section')
        }
        cancelText={t('common.buttons.cancel', 'Cancel')}
        feedback={feedback}
        onFeedbackDismiss={() => setFeedback(null)}
        showActions={false}
      >
        {/* Section Name */}
        <FormField
          id="name"
          label={t('creator.forms.section.name', 'Section Name')}
          type="text"
          placeholder="Greetings"
          {...register('name')}
          error={errors.name?.message || undefined}
          isRequired
          fullWidth
          maxLength={150}
          isValid={touchedFields.name && !errors.name && watchedValues.name?.trim().length >= 3}
          showValidationIcon
          helperText={t('creator.forms.section.nameHelp', 'Descriptive name for the section (3-150 characters)')}
        />
        
        {/* Order */}
        <FormField
          id="order"
          label={t('creator.forms.section.order', 'Order')}
          type="number"
          min={0}
          max={999}
          placeholder="0"
          {...register('order', { valueAsNumber: true })}
          error={errors.order?.message || undefined}
          isRequired
          fullWidth
          isValid={touchedFields.order && !errors.order && watchedValues.order !== undefined && watchedValues.order >= 0}
          showValidationIcon
          helperText={t('creator.forms.section.orderHelp', 'Display order within the level (0-999)')}
        />

        {/* Validation Status */}
        <ValidationStatus
          rules={validationRules}
          showOnlyErrors={true}
          className="mt-4"
        />
      </FormWrapper>
    </div>
  );
};

export default SectionForm;