import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { lessonSchema } from '../../utils/validation';
import { lessonService } from '../../services/lessonService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import { Lesson } from '../../utils/types';
import { LessonFormData } from '../../utils/validation';

interface LessonFormProps {
  moduleId: string;
  initialData?: Partial<Lesson> | undefined;
  onSuccess?: (lesson: Lesson) => void;
  onCancel?: () => void;
  onSubmit?: (data: LessonFormData) => Promise<Lesson>;
}

export const LessonForm: React.FC<LessonFormProps> = ({ 
  moduleId, 
  initialData, 
  onSuccess, 
  onCancel,
  onSubmit: onSubmitProp
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      experiencePoints: initialData?.experiencePoints || 10,
      order: initialData?.order || 0,
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setFeedback(null);
    
    try {
      let response: Lesson;
      
      if (onSubmitProp) {
        // Use provided submit handler (for modal usage)
        response = await onSubmitProp(data);
      } else {
        // Use direct service calls (for standalone usage)
        if (initialData?.id) {
          response = await lessonService.updateLesson(initialData.id, data);
        } else {
          response = await lessonService.createLesson(moduleId, data);
        }
      }
      
      setFeedback({
        type: 'success',
        message: initialData?.id
          ? t('creator.forms.lesson.updateSuccessMessage', 'Lesson updated successfully!')
          : t('creator.forms.lesson.createSuccessMessage', 'Lesson created successfully!'),
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
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Experience Points */}
        <Input
          id="experiencePoints"
          label={t('creator.forms.lesson.experiencePoints', 'Experience Points')}
          type="number"
          min={1}
          placeholder="10"
          {...register('experiencePoints', { valueAsNumber: true })}
          error={errors.experiencePoints?.message || ''}
          isRequired
          fullWidth
        />
        
        {/* Order */}
        <Input
          id="order"
          label={t('creator.forms.lesson.order', 'Order')}
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
              ? t('creator.forms.lesson.update', 'Update Lesson')
              : t('creator.forms.lesson.create', 'Create Lesson')
            }
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LessonForm;