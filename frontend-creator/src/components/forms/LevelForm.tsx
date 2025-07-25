import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { levelSchema } from '../../utils/validation';
import { FormField } from '../ui/FormField';
import { FormWrapper } from './FormWrapper';
import { Level } from '../../utils/types';
import { LevelFormData } from '../../utils/validation';

interface LevelFormProps {
  courseId: string;
  initialData?: Partial<Level> | undefined;
  onSuccess?: (level: Level) => void;
  onCancel?: () => void;
  onSubmit: (data: LevelFormData) => Promise<Level>;
}

/**
 * Form component for creating and editing levels
 * Follows the same pattern as LessonForm for consistency
 */
export const LevelForm: React.FC<LevelFormProps> = ({ 
  courseId: _courseId, 
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
  } = useForm<LevelFormData>({
    resolver: zodResolver(levelSchema),
    defaultValues: {
      code: initialData?.code || '',
      name: initialData?.name || '',
      order: initialData?.order || 0,
    },
    mode: 'onChange',
  });

  const watchedValues = watch();

  const handleFormSubmit = async (data: LevelFormData) => {
    setIsSubmitting(true);
    setFeedback(null);
    
    try {
      const response = await onSubmit(data);
      
      setFeedback({
        type: 'success',
        message: initialData?.id 
          ? t('creator.forms.level.updateSuccessMessage', 'Level updated successfully!')
          : t('creator.forms.level.createSuccessMessage', 'Level created successfully!'),
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
    <FormWrapper
      onSubmit={handleSubmit(handleFormSubmit)}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
      isValid={isValid}
      submitText={initialData?.id 
        ? t('creator.forms.level.update', 'Update Level')
        : t('creator.forms.level.create', 'Create Level')
      }
      cancelText={t('common.buttons.cancel', 'Cancel')}
      feedback={feedback}
      onFeedbackDismiss={() => setFeedback(null)}
    >
      {/* Level Code */}
      <FormField
        id="code"
        label={t('creator.forms.level.code', 'Level Code')}
        type="text"
        placeholder="A1"
        {...register('code')}
        error={errors.code?.message || undefined}
        isRequired
        fullWidth
        maxLength={10}
        isValid={touchedFields.code && !errors.code && watchedValues.code?.trim().length > 0}
        showValidationIcon
        helperText={t('creator.forms.level.codeHelp', 'Uppercase letters and numbers only (e.g., A1, B2)')}
      />
      
      {/* Level Name */}
      <FormField
        id="name"
        label={t('creator.forms.level.name', 'Level Name')}
        type="text"
        placeholder="Beginner Level"
        {...register('name')}
        error={errors.name?.message || undefined}
        isRequired
        fullWidth
        maxLength={100}
        isValid={touchedFields.name && !errors.name && watchedValues.name?.trim().length >= 3}
        showValidationIcon
        helperText={t('creator.forms.level.nameHelp', 'Descriptive name for the level (min 3 characters)')}
      />
      
      {/* Order */}
      <FormField
        id="order"
        label={t('creator.forms.level.order', 'Order')}
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
        helperText={t('creator.forms.level.orderHelp', 'Display order (0-999)')}
      />
    </FormWrapper>
  );
};

export default LevelForm;