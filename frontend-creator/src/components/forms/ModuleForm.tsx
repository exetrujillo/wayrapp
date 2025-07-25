import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { moduleSchema } from '../../utils/validation';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import { Module } from '../../utils/types';
import { ModuleFormData } from '../../utils/validation';
import { MODULE_TYPES } from '../../utils/constants';

interface ModuleFormProps {
  sectionId: string;
  initialData?: Partial<Module> | undefined;
  onSuccess?: (module: Module) => void;
  onCancel?: () => void;
  onSubmit: (data: ModuleFormData) => Promise<Module>;
}

/**
 * Form component for creating and editing modules
 * Follows the same pattern as LessonForm for consistency
 */
export const ModuleForm: React.FC<ModuleFormProps> = ({ 
  sectionId: _sectionId, 
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
  } = useForm<ModuleFormData>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      moduleType: initialData?.moduleType || 'basic_lesson',
      name: initialData?.name || '',
      order: initialData?.order || 0,
    },
  });

  const handleFormSubmit = async (data: ModuleFormData) => {
    setIsSubmitting(true);
    setFeedback(null);
    
    try {
      const response = await onSubmit(data);
      
      setFeedback({
        type: 'success',
        message: initialData?.id 
          ? t('creator.forms.module.updateSuccessMessage', 'Module updated successfully!')
          : t('creator.forms.module.createSuccessMessage', 'Module created successfully!'),
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
        {/* Module Type */}
        <div className="space-y-2">
          <label htmlFor="moduleType" className="block text-sm font-medium text-neutral-700">
            {t('creator.forms.module.moduleType', 'Module Type')}
            <span className="text-error ml-1">*</span>
          </label>
          <select
            id="moduleType"
            {...register('moduleType')}
            className="input w-full"
          >
            {MODULE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.moduleType && (
            <p className="mt-1 text-sm text-error">{errors.moduleType.message}</p>
          )}
        </div>
        
        {/* Module Name */}
        <Input
          id="name"
          label={t('creator.forms.module.name', 'Module Name')}
          type="text"
          placeholder="Basic Greetings"
          {...register('name')}
          error={errors.name?.message || ''}
          isRequired
          fullWidth
        />
        
        {/* Order */}
        <Input
          id="order"
          label={t('creator.forms.module.order', 'Order')}
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
              ? t('creator.forms.module.update', 'Update Module')
              : t('creator.forms.module.create', 'Create Module')
            }
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ModuleForm;