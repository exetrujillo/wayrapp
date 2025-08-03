/**
 * Unified Entity Form Component
 * 
 * This component provides a comprehensive, production-ready form system with
 * Zod validation, auto-save functionality, dynamic field generation, and
 * enhanced state management. It replaces all individual Enhanced*Form components
 * with a unified, feature-complete solution.
 * 
 * @module UnifiedEntityForm
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FieldValues, UseFormReturn, Control, FieldErrors, Controller } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormSubmission } from './FormHooks';
import { getEntityFields, createInitialValues, validateLanguageDifference } from './FormUtils';
import { getEntitySchema } from '../../utils/validation/schemas';
import { AutoSaveProvider, AutoSaveStatus } from './AutoSaveProvider';
import { DynamicFieldGenerator } from './DynamicFieldGenerator';
// import { FormStateManager } from './FormStateManager';
// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Supported entity types for form generation
 */
export type EntityType = 'course' | 'level' | 'section' | 'module' | 'lesson' | 'exercise';

/**
 * Form mode - create or edit
 */
export type FormMode = 'create' | 'edit';

// ============================================================================
// Type Definitions
// ============================================================================

export interface UnifiedEntityFormProps<T extends FieldValues = FieldValues> {
  /** Entity type */
  entityType: EntityType;
  /** Form mode */
  mode: FormMode;
  /** Initial form data */
  initialData?: Partial<T>;
  /** Parent entity ID (for hierarchical entities) */
  parentId?: string;
  /** Form submission handler */
  onSubmit: (data: T) => Promise<any>;
  /** Success callback */
  onSuccess?: (result: any, data: T) => void;
  /** Cancel callback */
  onCancel?: () => void;
  /** Error callback */
  onError?: (error: string, data: T) => void;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Enable auto-save (default: true for edit mode) */
  autoSave?: boolean;
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number;
  /** Custom form title */
  title?: string;
  /** Custom form description */
  description?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show form actions */
  showActions?: boolean;
  /** Custom action buttons */
  customActions?: React.ReactNode;
  /** Enable form state management */
  enableStateManagement?: boolean;
  /** Show recovery banner */
  showRecoveryBanner?: boolean;
  /** Show unsaved changes indicator */
  showUnsavedIndicator?: boolean;
  /** Show undo/redo controls */
  showUndoRedo?: boolean;
  /** Custom field configurations */
  customFields?: Record<string, any>;
  /** Fields to exclude from form */
  excludeFields?: string[];
  /** Fields to include (if specified, only these will be shown) */
  includeFields?: string[];
  /** Custom field order */
  fieldOrder?: string[];
  /** Enable real-time validation */
  enableRealtimeValidation?: boolean;
}

// ============================================================================
// Entity-Specific Validation
// ============================================================================

/**
 * Validates form data before submission based on entity type
 */
const validateEntityData = async <T extends FieldValues>(
  entityType: EntityType,
  data: T
): Promise<string | null> => {
  switch (entityType) {
    case 'course':
      // Validate that source and target languages are different
      if (data.sourceLanguage && data.targetLanguage) {
        return validateLanguageDifference(data.sourceLanguage, data.targetLanguage);
      }
      break;

    case 'level':
      // Additional level-specific validation could go here
      break;

    case 'section':
      // Additional section-specific validation could go here
      break;

    case 'module':
      // Additional module-specific validation could go here
      break;

    case 'lesson':
      // Additional lesson-specific validation could go here
      break;

    case 'exercise':
      // Additional exercise-specific validation could go here
      break;
  }

  return null;
};

/**
 * Gets entity-specific success message
 */
const getSuccessMessage = (entityType: EntityType, mode: FormMode, t: any): string => {
  const action = mode === 'create' ? 'created' : 'updated';
  return t(`creator.forms.${entityType}.${action}Success`, `${entityType} ${action} successfully!`);
};



// ============================================================================
// Main Component
// ============================================================================

/**
 * Unified Entity Form Component
 * 
 * @example
 * // Create a course with full features
 * <UnifiedEntityForm
 *   entityType="course"
 *   mode="create"
 *   onSubmit={createCourse}
 *   onSuccess={(course) => navigate(`/courses/${course.id}`)}
 *   autoSave={true}
 *   enableStateManagement={true}
 *   showRecoveryBanner={true}
 * />
 * 
 * @example
 * // Edit a level with custom fields and validation
 * <UnifiedEntityForm
 *   entityType="level"
 *   mode="edit"
 *   initialData={existingLevel}
 *   parentId={courseId}
 *   onSubmit={updateLevel}
 *   customFields={{ code: { disabled: true } }}
 *   excludeFields={['createdAt', 'updatedAt']}
 *   enableRealtimeValidation={true}
 * />
 */
export const UnifiedEntityForm = <T extends FieldValues = FieldValues>({
  entityType,
  mode,
  initialData,
  parentId: _parentId,
  onSubmit,
  onSuccess,
  onCancel,
  onError,
  successMessage,
  errorMessage,
  autoSave = mode === 'edit',
  autoSaveInterval = 30000,
  title,
  description,
  className,
  showActions = true,
  customActions,
  enableStateManagement: _enableStateManagement = true,
  showRecoveryBanner: _showRecoveryBanner = true,
  showUnsavedIndicator: _showUnsavedIndicator = true,
  showUndoRedo: _showUndoRedo = false,
  customFields = {},
  excludeFields = [],
  includeFields,
  fieldOrder,
  enableRealtimeValidation = true,
}: UnifiedEntityFormProps<T>) => {
  const { t } = useTranslation();

  // Get validation schema for the entity type
  const validationSchema = useMemo(() => {
    try {
      return getEntitySchema(entityType);
    } catch (error) {
      console.warn(`No validation schema found for entity type: ${entityType}`);
      return null;
    }
  }, [entityType]);

  // Create initial values with defaults
  const initialValues = useMemo(() => {
    return createInitialValues<T>(entityType, initialData);
  }, [entityType, initialData]);

  // Initialize form with react-hook-form and Zod validation
  const form = useForm<T>({
    ...(validationSchema ? { resolver: zodResolver(validationSchema as any) } : {}),
    defaultValues: initialValues as any,
    mode: enableRealtimeValidation ? 'onChange' : 'onSubmit',
  });

  // Form submission with consistent error handling
  const {
    isSubmitting,
    error,
    success,
    handleSubmit,
    clearMessages,
  } = useFormSubmission<T>({
    onSubmit,
    ...(onSuccess ? { onSuccess } : {}),
    ...(onError ? { onError } : {}),
    successMessage: successMessage || getSuccessMessage(entityType, mode, t),
    ...(errorMessage ? { errorMessage } : {}),
    validateBeforeSubmit: (data) => validateEntityData(entityType, data),
  });

  // Form state management
  // const formStateConfig = useMemo(() => ({
  //   formId: `${entityType}-${initialData?.id || 'new'}`,
  //   entityType,
  //   enablePersistence: enableStateManagement,
  //   enableUnsavedChanges: enableStateManagement,
  // }), [entityType, initialData?.id, enableStateManagement]);

  // Auto-save configuration
  const autoSaveConfig = useMemo(() => ({
    interval: autoSaveInterval,
    enabled: autoSave,
    maxRetries: 3,
    debounceDelay: 1000,
    enableBackup: true,
    conflictResolution: 'manual' as const,
  }), [autoSave, autoSaveInterval]);

  // Handle auto-save
  const handleAutoSave = async (data: any) => {
    try {
      await onSubmit(data.data);
    } catch (error) {
      console.warn('Auto-save failed:', error);
      throw error;
    }
  };

  // Handle form recovery
  // const handleFormRecover = (recoveredData: T) => {
  //   form.reset(recoveredData);
  // };

  // Clear messages when component unmounts or entity changes
  useEffect(() => {
    return () => clearMessages();
  }, [entityType, clearMessages]);

  // Auto-save provider wrapper
  const FormContent = () => (
    <AutoSaveProvider
      defaultConfig={autoSaveConfig}
      onSave={handleAutoSave}
      onError={(error: Error, data: any) => {
        console.error('Auto-save error:', error);
        onError?.(error.message, data);
      }}
    >
      <EnhancedEntityForm<T>
        entityType={entityType}
        mode={mode}
        form={form as any}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        onCancel={onCancel || undefined}
        isSubmitting={isSubmitting}
        showActions={showActions}
        customActions={customActions}
        customFields={customFields}
        excludeFields={excludeFields}
        includeFields={includeFields}
        fieldOrder={fieldOrder || undefined}
      />
    </AutoSaveProvider>
  );

  return (
    <div className={className}>
      {/* Form Title and Description */}
      {(title || description) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-sm text-gray-600">
              {description}
            </p>
          )}
        </div>
      )}

      {/* Success/Error Messages */}
      {(success || error) && (
        <div className="mb-6">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-800">{success}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    type="button"
                    onClick={clearMessages}
                    className="text-green-400 hover:text-green-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    type="button"
                    onClick={clearMessages}
                    className="text-red-400 hover:text-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Auto-save Status */}
      {autoSave && (
        <div className="mb-4">
          <AutoSaveStatus showText={true} />
        </div>
      )}

      {/* Form Content */}
      <FormContent />
    </div>
  );
};

// ============================================================================
// Enhanced Entity Form Component
// ============================================================================

interface EnhancedEntityFormProps<T extends FieldValues> {
  entityType: EntityType;
  mode: FormMode;
  form: UseFormReturn<T>;
  validationSchema: any;
  onSubmit: (data: T) => Promise<void>;
  onCancel?: (() => void) | undefined;
  isSubmitting: boolean;
  showActions?: boolean;
  customActions?: React.ReactNode;
  customFields?: Record<string, any>;
  excludeFields?: string[];
  includeFields?: string[] | undefined;
  fieldOrder?: string[] | undefined;
}

/**
 * Enhanced form component with dynamic field generation and Zod validation
 */
function EnhancedEntityForm<T extends FieldValues>({
  entityType,
  mode,
  form,
  validationSchema,
  onSubmit,
  onCancel,
  isSubmitting,
  showActions = true,
  customActions,
  customFields = {},
  excludeFields = [],
  includeFields,
  fieldOrder,
}: EnhancedEntityFormProps<T>) {
  const { t } = useTranslation();
  const { control, handleSubmit: formHandleSubmit, formState: { errors }, watch } = form;

  // Watch all form values for dynamic field generation
  const formValues = watch();

  // Handle form submission
  const handleFormSubmit = async (data: any) => {
    try {
      await onSubmit(data as T);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={formHandleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Dynamic Field Generation */}
      {validationSchema ? (
        <DynamicFieldGenerator<T>
          schema={validationSchema}
          entityType={entityType}
          control={control}
          errors={errors}
          values={formValues}
          customFields={customFields}
          excludeFields={[...excludeFields, 'createdAt', 'updatedAt']}
          includeFields={includeFields || []}
          fieldOrder={fieldOrder || []}
          disabled={isSubmitting}
        />
      ) : (
        // Fallback to legacy field configuration if no schema available
        <LegacyFieldRenderer<T>
          entityType={entityType}
          control={control}
          errors={errors}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Form Actions */}
      {showActions && (
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.cancel')}
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t('common.saving')}
              </>
            ) : (
              mode === 'create' ? t('common.create') : t('common.save')
            )}
          </button>

          {customActions}
        </div>
      )}
    </form>
  );
}

// ============================================================================
// Legacy Field Renderer (Fallback)
// ============================================================================

interface LegacyFieldRendererProps<T extends FieldValues> {
  entityType: EntityType;
  control: Control<T>;
  errors: FieldErrors<T>;
  isSubmitting: boolean;
}

/**
 * Legacy field renderer for backward compatibility
 */
function LegacyFieldRenderer<T extends FieldValues>({
  entityType,
  control,
  errors,
  isSubmitting,
}: LegacyFieldRendererProps<T>) {
  const fieldConfigs = getEntityFields(entityType, false);

  return (
    <>
      {fieldConfigs.map((fieldConfig) => (
        <div key={fieldConfig.name} className="space-y-2">
          <label htmlFor={fieldConfig.name} className="block text-sm font-medium text-gray-700">
            {fieldConfig.label}
            {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
          </label>

          <Controller
            name={fieldConfig.name as any}
            control={control}
            render={({ field }) => (
              <div>
                {fieldConfig.type === 'textarea' ? (
                  <textarea
                    {...field}
                    id={fieldConfig.name}
                    rows={4}
                    disabled={isSubmitting}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                    placeholder={fieldConfig.placeholder}
                  />
                ) : fieldConfig.type === 'select' ? (
                  <select
                    {...field}
                    id={fieldConfig.name}
                    disabled={isSubmitting}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                  >
                    <option value="">Select {fieldConfig.label}</option>
                    {fieldConfig.options?.map((option: any) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    {...field}
                    type={fieldConfig.type || 'text'}
                    id={fieldConfig.name}
                    disabled={isSubmitting}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm disabled:opacity-50"
                    placeholder={fieldConfig.placeholder}
                  />
                )}

                {errors[fieldConfig.name as keyof T] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors[fieldConfig.name as keyof T]?.message as string}
                  </p>
                )}
              </div>
            )}
          />
        </div>
      ))}
    </>
  );
}

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * Course Form Component
 */
export const CourseForm = <T extends FieldValues = FieldValues>(
  props: Omit<UnifiedEntityFormProps<T>, 'entityType'>
) => <UnifiedEntityForm<T> entityType="course" {...props} />;

/**
 * Level Form Component
 */
export const LevelForm = <T extends FieldValues = FieldValues>(
  props: Omit<UnifiedEntityFormProps<T>, 'entityType'> & { courseId: string }
) => {
  const { courseId, ...restProps } = props;
  return <UnifiedEntityForm<T> entityType="level" parentId={courseId} {...restProps} />;
};

/**
 * Section Form Component
 */
export const SectionForm = <T extends FieldValues = FieldValues>(
  props: Omit<UnifiedEntityFormProps<T>, 'entityType'> & { levelId: string }
) => {
  const { levelId, ...restProps } = props;
  return <UnifiedEntityForm<T> entityType="section" parentId={levelId} {...restProps} />;
};

/**
 * Module Form Component
 */
export const ModuleForm = <T extends FieldValues = FieldValues>(
  props: Omit<UnifiedEntityFormProps<T>, 'entityType'> & { sectionId: string }
) => {
  const { sectionId, ...restProps } = props;
  return <UnifiedEntityForm<T> entityType="module" parentId={sectionId} {...restProps} />;
};

/**
 * Lesson Form Component
 */
export const LessonForm = <T extends FieldValues = FieldValues>(
  props: Omit<UnifiedEntityFormProps<T>, 'entityType'> & { moduleId: string }
) => {
  const { moduleId, ...restProps } = props;
  return <UnifiedEntityForm<T> entityType="lesson" parentId={moduleId} {...restProps} />;
};

// Aliases for easier migration from Enhanced*Form components
export const UnifiedCourseForm = CourseForm;
export const UnifiedLevelForm = LevelForm;
export const UnifiedSectionForm = SectionForm;
export const UnifiedModuleForm = ModuleForm;
export const UnifiedLessonForm = LessonForm;

export default UnifiedEntityForm;