import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { levelSchema } from '../../utils/validation';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
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
    formState: { errors },
  } = useForm<LevelFormData>({
    resolver: zodResolver(levelSchema),
    defaultValues: {
      code: initialData?.code || '',
      name: initialData?.name || '',
      order: initialData?.order || 0,
    },
  });

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
    <div className="space-y-4">
      {feedback && (
        <Feedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {/* Level Code */}
        <Input
          id="code"
          label={t('creator.forms.level.code', 'Level Code')}
          type="text"
          placeholder="A1"
          {...register('code')}
          error={errors.code?.message || ''}
          isRequired
          fullWidth
        />
        
        {/* Level Name */}
        <Input
          id="name"
          label={t('creator.forms.level.name', 'Level Name')}
          type="text"
          placeholder="Beginner Level"
          {...register('name')}
          error={errors.name?.message || ''}
          isRequired
          fullWidth
        />
        
        {/* Order */}
        <Input
          id="order"
          label={t('creator.forms.level.order', 'Order')}
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
              ? t('creator.forms.level.update', 'Update Level')
              : t('creator.forms.level.create', 'Create Level')
            }
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LevelForm;