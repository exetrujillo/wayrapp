import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sectionSchema } from '../../utils/validation';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
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
    formState: { errors },
  } = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: initialData?.name || '',
      order: initialData?.order || 0,
    },
  });

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
    <div className="space-y-4">
      {feedback && (
        <Feedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Section Name */}
        <Input
          id="name"
          label={t('creator.forms.section.name', 'Section Name')}
          type="text"
          placeholder="Greetings"
          {...register('name')}
          error={errors.name?.message || ''}
          isRequired
          fullWidth
        />
        
        {/* Order */}
        <Input
          id="order"
          label={t('creator.forms.section.order', 'Order')}
          type="number"
          min={0}
          placeholder="0"
          {...register('order', { valueAsNumber: true })}
          error={errors.order?.message || ''}
          isRequired
          fullWidth
        />
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
          >
            {t('common.buttons.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
          >
            {initialData?.id 
              ? t('creator.forms.section.update', 'Update Section')
              : t('creator.forms.section.create', 'Create Section')
            }
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SectionForm;