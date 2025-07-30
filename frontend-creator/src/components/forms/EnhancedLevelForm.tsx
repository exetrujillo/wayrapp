/**
 * Enhanced Level Form using DynamicForm
 * 
 * This component demonstrates the proper DRY implementation by using the
 * centralized DynamicForm instead of a custom form component. It includes
 * all the enhanced validation features from the original LevelForm but
 * leverages the unified form architecture.
 * 
 * @module EnhancedLevelForm
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Level } from '../../utils/types';
import { LevelFormData } from '../../utils/validation';
import { useLevelValidation } from '../../hooks/useLevelValidation';
import { DynamicForm, FormField } from './DynamicForm';

interface EnhancedLevelFormProps {
  courseId: string;
  initialData?: Partial<Level> | undefined;
  onSuccess?: (level: Level) => void;
  onCancel?: () => void;
  onSubmit: (data: LevelFormData) => Promise<Level>;
}

/**
 * Enhanced Level Form component using DynamicForm architecture
 * Features:
 * - Uses centralized DynamicForm for consistency
 * - Real-time validation with useLevelValidation hook
 * - Smart order suggestions
 * - Code uniqueness validation
 * - Proper error handling and user feedback
 */
export const EnhancedLevelForm: React.FC<EnhancedLevelFormProps> = ({
  courseId,
  initialData,
  onSuccess,
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Enhanced validation
  const {
    validateLevelCode,
    validateLevelOrder,
    isValidating,
    getNextOrder,
    getExistingCodes,
    getExistingOrders,
  } = useLevelValidation(courseId);

  // Custom field configurations with enhanced validation
  const customFields: FormField<LevelFormData>[] = [
    {
      name: 'code',
      type: 'text',
      label: t('creator.forms.level.code', 'Level Code'),
      placeholder: 'A1',
      description: t('creator.forms.level.codeHelp', 'Uppercase letters and numbers only (e.g., A1, B2)'),
      required: true,
      span: 6,
      props: { 
        maxLength: 10,
        style: { textTransform: 'uppercase' }
      },
    },
    {
      name: 'name',
      type: 'text',
      label: t('creator.forms.level.name', 'Level Name'),
      placeholder: 'Beginner Level',
      description: t('creator.forms.level.nameHelp', 'Descriptive name for the level (min 3 characters)'),
      required: true,
      span: 6,
      props: { maxLength: 100 },
    },
    {
      name: 'order',
      type: 'number',
      label: t('creator.forms.level.order', 'Order'),
      placeholder: getNextOrder().toString(),
      description: `${t('creator.forms.level.orderHelp', 'Display order (1-999)')} - ${t('creator.forms.level.suggestedOrder', 'Suggested: {{order}}', { order: getNextOrder() })}`,
      required: true,
      span: 12,
      props: { 
        min: 1, 
        max: 999, 
        step: 1 
      },
    },
  ];

  // Prepare initial values with smart defaults
  const initialValues: Partial<LevelFormData> = {
    code: initialData?.code || '',
    name: initialData?.name || '',
    order: initialData?.order || getNextOrder(),
  };

  // Enhanced form submission with validation
  const handleFormSubmit = async (data: LevelFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Final validation before submit
      const codeError = await validateLevelCode(data.code, initialData?.id);
      const orderError = await validateLevelOrder(data.order, initialData?.id);
      
      if (codeError || orderError) {
        throw new Error(codeError || orderError || 'Validation failed');
      }

      const response = await onSubmit(data);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error: any) {
      console.error('Level form submission failed:', error);
      setError(error.message || t('common.messages.error', 'An error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show existing codes and orders as context
  const existingCodes = getExistingCodes();
  const existingOrders = getExistingOrders();

  return (
    <div className="space-y-4">
      {/* Context Information */}
      {(existingCodes.length > 0 || existingOrders.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            {t('creator.forms.level.contextInfo', 'Course Context')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-700">
            {existingCodes.length > 0 && (
              <div>
                <span className="font-medium">
                  {t('creator.forms.level.existingCodes', 'Existing codes:')}
                </span>
                <span className="ml-2">{existingCodes.join(', ')}</span>
              </div>
            )}
            {existingOrders.length > 0 && (
              <div>
                <span className="font-medium">
                  {t('creator.forms.level.existingOrders', 'Existing orders:')}
                </span>
                <span className="ml-2">{existingOrders.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Form */}
      <DynamicForm<LevelFormData>
        entityType="level"
        customFields={customFields}
        initialValues={initialValues}
        onSubmit={handleFormSubmit}
        onCancel={onCancel}
        loading={isSubmitting || isValidating}
        error={error}
        config={{
          entityType: 'level',
          title: initialData?.id 
            ? t('creator.modals.level.editTitle', 'Edit Level')
            : t('creator.modals.level.createTitle', 'Create New Level'),
          description: t('creator.forms.level.description', 'Configure the level details for this course.'),
          fields: customFields,
          schema: undefined as any, // Will use entitySchemas.level
          layout: {
            columns: 2,
            className: 'space-y-6',
          },
          autoSave: undefined,
        }}
      />
    </div>
  );
};

export default EnhancedLevelForm;