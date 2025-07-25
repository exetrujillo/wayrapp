import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { exerciseSchema, ExerciseFormData, getExerciseDataSchema } from '../../utils/validation';
import { EXERCISE_TYPES } from '../../utils/constants';
import { useCreateExerciseMutation, useUpdateExerciseMutation } from '../../hooks/useExercises';
import { Exercise } from '../../utils/types';
import { Button } from '../ui/Button';
import { Feedback } from '../ui/Feedback';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Select } from '../ui/Select';


// Import exercise type-specific form components
import { TranslationExerciseForm } from './exercise-types/TranslationExerciseForm';
import { FillInTheBlankExerciseForm } from './exercise-types/FillInTheBlankExerciseForm';
import { VOFExerciseForm } from './exercise-types/VOFExerciseForm';
import { PairsExerciseForm } from './exercise-types/PairsExerciseForm';
import { OrderingExerciseForm } from './exercise-types/OrderingExerciseForm';
import { InformativeExerciseForm } from './exercise-types/InformativeExerciseForm';

interface DynamicExerciseFormProps {
  initialData?: Exercise | undefined;
  onSuccess?: ((exercise: Exercise) => void) | undefined;
  onCancel?: (() => void) | undefined;
  isModal?: boolean;
}

export const DynamicExerciseForm: React.FC<DynamicExerciseFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  isModal = false,
}) => {
  const { t } = useTranslation();
  const [showPreview, setShowPreview] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const createExerciseMutation = useCreateExerciseMutation();
  const updateExerciseMutation = useUpdateExerciseMutation();

  const isEditing = !!initialData;
  const isSubmitting = createExerciseMutation.isPending || updateExerciseMutation.isPending;

  const {
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isValid, touchedFields },
  } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      exerciseType: initialData?.exerciseType || 'translation',
      data: initialData?.data || {},
    },
    mode: 'onChange',
  });

  const exerciseType = watch('exerciseType');
  const exerciseData = watch('data') || {};

  // Initialize default data structure when exercise type changes
  useEffect(() => {
    if (!isEditing) {
      let defaultData = {};

      switch (exerciseType) {
        case 'translation':
          defaultData = {
            source_text: '',
            target_text: '',
            hints: [],
          };
          break;
        case 'fill-in-the-blank':
          defaultData = {
            text: '',
            blanks: [{ position: 0, correctAnswers: [''], hints: [] }],
          };
          break;
        case 'vof':
          defaultData = {
            statement: '',
            isTrue: true,
            explanation: '',
          };
          break;
        case 'pairs':
          defaultData = {
            pairs: [
              { left: '', right: '' },
              { left: '', right: '' },
            ],
          };
          break;
        case 'ordering':
          defaultData = {
            items: [
              { id: crypto.randomUUID(), text: '' },
              { id: crypto.randomUUID(), text: '' },
            ],
          };
          break;
        case 'informative':
          defaultData = {
            title: '',
            content: '',
            media: undefined,
          };
          break;
      }

      setValue('data', defaultData);
    }
  }, [exerciseType, setValue, isEditing]);

  const onSubmit = async (data: ExerciseFormData) => {
    setFeedback(null);

    try {
      // Validate exercise data with type-specific schema
      const dataSchema = getExerciseDataSchema(data.exerciseType);
      const validatedData = dataSchema.parse(data.data);

      const exerciseData = {
        exerciseType: data.exerciseType,
        data: validatedData,
      };

      let result: Exercise;

      if (isEditing && initialData) {
        result = await updateExerciseMutation.mutateAsync({
          id: initialData.id,
          exerciseData,
        });
        setFeedback({
          type: 'success',
          message: t('creator.forms.exercise.updateSuccess', 'Exercise updated successfully!'),
        });
      } else {
        result = await createExerciseMutation.mutateAsync(exerciseData);
        setFeedback({
          type: 'success',
          message: t('creator.forms.exercise.createSuccess', 'Exercise created successfully!'),
        });
      }

      if (onSuccess) {
        onSuccess(result);
      }

      if (!isModal) {
        reset();
      }
    } catch (error: any) {
      console.error('Exercise form submission error:', error);
      setFeedback({
        type: 'error',
        message: error.message || t('common.messages.error', 'An error occurred'),
      });
    }
  };

  const handleCancel = () => {
    reset();
    setFeedback(null);
    if (onCancel) {
      onCancel();
    }
  };

  const handleDataChange = (field: string, value: any) => {
    const updatedData = { ...exerciseData };
    
    // Handle nested fields with dot notation
    if (field.includes('.')) {
      const parts = field.split('.');
      let current: any = updatedData;

      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!isNaN(Number(part))) {
          const index = Number(part);
          if (!Array.isArray(current)) {
            current = [];
          }
          while (current.length <= index) {
            current.push({});
          }
          current = current[index];
        } else {
          if (!current[part]) {
            current[part] = {};
          }
          current = current[part];
        }
      }

      const lastPart = parts[parts.length - 1];
      current[lastPart] = value;
    } else {
      updatedData[field] = value;
    }

    setValue('data', updatedData);
  };

  const renderExerciseTypeForm = () => {
    const commonProps = {
      data: exerciseData,
      onChange: handleDataChange,
      errors: errors.data as any,
    };

    switch (exerciseType) {
      case 'translation':
        return <TranslationExerciseForm {...commonProps} />;
      case 'fill-in-the-blank':
        return <FillInTheBlankExerciseForm {...commonProps} />;
      case 'vof':
        return <VOFExerciseForm {...commonProps} />;
      case 'pairs':
        return <PairsExerciseForm {...commonProps} />;
      case 'ordering':
        return <OrderingExerciseForm {...commonProps} />;
      case 'informative':
        return <InformativeExerciseForm {...commonProps} />;
      default:
        return (
          <div className="text-center py-8 text-neutral-500">
            {t('creator.forms.exercise.unsupportedType', 'Unsupported exercise type')}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback */}
      {feedback && (
        <Feedback
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback(null)}
        />
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Exercise Type Selection */}
        <Card className="p-6">
          <Controller
            name="exerciseType"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                id="exerciseType"
                label={t('creator.forms.exercise.exerciseType', 'Exercise Type')}
                options={EXERCISE_TYPES.map(type => ({
                  value: type.value,
                  label: type.label,
                }))}
                disabled={isEditing} // Don't allow changing type when editing
                error={errors.exerciseType?.message || undefined}
                isRequired
                fullWidth
                isSuccess={!!(touchedFields.exerciseType && !errors.exerciseType && field.value)}
              />
            )}
          />

          {/* Exercise Type Description */}
          <div className="mb-4 p-3 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-600">
              {t(`creator.forms.exercise.descriptions.${exerciseType}`, getExerciseTypeDescription(exerciseType || 'translation'))}
            </p>
          </div>
        </Card>

        {/* Exercise Type-Specific Form */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {t('creator.forms.exercise.exerciseDetails', 'Exercise Details')}
          </h3>
          {renderExerciseTypeForm()}
          {errors.data && (
            <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-lg">
              <p className="text-sm text-error">{String(errors.data?.message || 'Invalid data')}</p>
            </div>
          )}
        </Card>

        {/* Preview Toggle */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview 
              ? t('creator.forms.exercise.hidePreview', 'Hide Preview')
              : t('creator.forms.exercise.showPreview', 'Show Preview')
            }
          </Button>
        </div>

        {/* Exercise Preview */}
        {showPreview && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {t('creator.forms.exercise.preview', 'Exercise Preview')}
            </h3>
            <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
              {renderExercisePreview(exerciseType || 'translation', exerciseData)}
            </div>
          </Card>
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-neutral-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {t('common.buttons.cancel', 'Cancel')}
          </Button>
          <Button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <LoadingSpinner size="sm" />
            ) : isEditing ? (
              t('common.buttons.update', 'Update')
            ) : (
              t('common.buttons.create', 'Create')
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

// Helper function to get exercise type descriptions
function getExerciseTypeDescription(exerciseType: string): string {
  switch (exerciseType) {
    case 'translation':
      return 'Students translate text from source language to target language.';
    case 'fill-in-the-blank':
      return 'Students fill in missing words or phrases in a sentence or paragraph.';
    case 'vof':
      return 'Students determine whether a statement is true or false.';
    case 'pairs':
      return 'Students match items from two columns or groups.';
    case 'ordering':
      return 'Students arrange items in the correct sequence or order.';
    case 'informative':
      return 'Informational content with optional media (images, videos, audio).';
    default:
      return 'Select an exercise type to see its description.';
  }
}

// Helper function to render exercise preview
function renderExercisePreview(exerciseType: string, data: any): React.ReactNode {
  switch (exerciseType) {
    case 'translation':
      return (
        <div>
          <h4 className="font-medium mb-2">Translation Exercise</h4>
          <p className="mb-3 p-3 bg-white rounded border">
            {data.source_text || 'No source text provided'}
          </p>
          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Your Translation:</label>
            <textarea
              className="input w-full"
              disabled
              placeholder="Enter your translation here"
            />
          </div>
          {data.hints && data.hints.length > 0 && (
            <div className="text-sm text-neutral-600">
              <strong>Hints:</strong> {data.hints.join(', ')}
            </div>
          )}
        </div>
      );
    case 'vof':
      return (
        <div>
          <h4 className="font-medium mb-2">True or False</h4>
          <p className="mb-3 p-3 bg-white rounded border">
            {data.statement || 'No statement provided'}
          </p>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input type="radio" name="preview" disabled />
              <span>True</span>
            </div>
            <div className="flex items-center space-x-2">
              <input type="radio" name="preview" disabled />
              <span>False</span>
            </div>
          </div>
        </div>
      );
    default:
      return (
        <div className="text-center py-4 text-neutral-500">
          Preview not available for this exercise type
        </div>
      );
  }
}

export default DynamicExerciseForm;