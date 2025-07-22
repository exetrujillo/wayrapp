import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { lessonSchema, LessonFormData } from '../../utils/validation';
import { moduleService } from '../../services/moduleService';
import { lessonService } from '../../services/lessonService';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import { Module } from '../../utils/types';

interface LessonFormProps {
  onSuccess?: (lesson: any) => void;
  onCancel?: () => void;
}

export const LessonForm: React.FC<LessonFormProps> = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [moduleError, setModuleError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      name: '',
      experience_points: 10,
      order: 0,
      moduleId: '',
    },
  });

  // Fetch modules for the dropdown
  useEffect(() => {
    const fetchModules = async () => {
      setIsLoadingModules(true);
      setModuleError(null);
      
      try {
        const response = await moduleService.getModules();
        setModules(response.data);
      } catch (error: any) {
        setModuleError(error.message || t('common.messages.error', 'An error occurred'));
      } finally {
        setIsLoadingModules(false);
      }
    };

    fetchModules();
  }, [t]);

  const onSubmit = async (data: LessonFormData) => {
    setIsSubmitting(true);
    setFeedback(null);
    
    try {
      const response = await lessonService.createLesson(data.moduleId, {
        name: data.name,
        experience_points: data.experience_points,
        order: data.order,
        moduleId: data.moduleId,
      });
      
      setFeedback({
        type: 'success',
        message: t('creator.forms.lesson.successMessage', 'Lesson created successfully!'),
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
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-6">{t('creator.forms.lesson.title', 'Create Lesson')}</h2>
      
      {feedback && (
        <div className="mb-6">
          <Feedback
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback(null)}
          />
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Lesson ID (optional) */}
        <Input
          id="id"
          label={t('creator.forms.lesson.id', 'Lesson ID')}
          placeholder={t('creator.forms.lesson.idPlaceholder', 'e.g., intro-lesson-1')}
          {...register('id')}
          error={errors.id?.message}
          fullWidth
        />
        
        {/* Lesson Name */}
        <Input
          id="name"
          label={t('creator.forms.lesson.name', 'Lesson Name')}
          placeholder={t('creator.forms.lesson.namePlaceholder', 'e.g., Introduction to Greetings')}
          {...register('name')}
          error={errors.name?.message}
          isRequired
          fullWidth
        />
        
        {/* Module Selection */}
        <div className="mb-4">
          <label htmlFor="moduleId" className="block text-sm font-medium text-neutral-700 mb-1">
            {t('creator.forms.lesson.module', 'Module')}
            <span className="text-error ml-1">*</span>
          </label>
          <Controller
            name="moduleId"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <select
                  id="moduleId"
                  className={`input w-full ${errors.moduleId ? 'border-error focus:border-error focus:ring-error' : 'border-neutral-300 focus:border-primary-500 focus:ring-primary-500'}`}
                  disabled={isLoadingModules}
                  {...field}
                >
                  <option value="">{t('creator.forms.lesson.selectModule', 'Select a module')}</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))}
                </select>
                {isLoadingModules && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="animate-spin h-5 w-5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                {errors.moduleId && (
                  <p className="mt-1 text-sm text-error">
                    {errors.moduleId.message}
                  </p>
                )}
                {moduleError && !errors.moduleId && (
                  <p className="mt-1 text-sm text-error">
                    {moduleError}
                  </p>
                )}
              </div>
            )}
          />
        </div>
        
        {/* Experience Points */}
        <Input
          id="experience_points"
          label={t('creator.forms.lesson.experiencePoints', 'Experience Points')}
          type="number"
          min={1}
          placeholder="10"
          {...register('experience_points', { valueAsNumber: true })}
          error={errors.experience_points?.message}
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
          error={errors.order?.message}
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
            {t('creator.forms.lesson.submit', 'Create Lesson')}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default LessonForm;