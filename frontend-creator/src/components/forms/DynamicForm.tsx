/**
 * Dynamic Form System for WayrApp Creator
 * 
 * This module provides a comprehensive, reusable form system that adapts to different
 * entity types with dynamic field generation, real-time validation, and auto-save
 * functionality. The system follows DRY principles by providing a single form
 * component that can handle all entity types in the application.
 * 
 * Key features:
 * - Dynamic field generation based on entity schemas
 * - Real-time validation with Zod schemas
 * - Auto-save functionality for long forms
 * - Type-safe form handling with React Hook Form
 * - Consistent styling and behavior across all forms
 * - Support for complex field types and relationships
 * 
 * @module DynamicForm
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic form usage
 * <DynamicForm
 *   entityType="course"
 *   initialValues={courseData}
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * />
 * 
 * // Form with custom fields
 * <DynamicForm
 *   entityType="exercise"
 *   initialValues={exerciseData}
 *   customFields={customExerciseFields}
 *   onSubmit={handleSubmit}
 *   autoSave={true}
 *   autoSaveInterval={30000}
 * />
 */

import React, { useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller, FieldValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  courseSchema,
  levelSchema,
  sectionSchema,
  moduleSchema,
  lessonSchema,
  exerciseSchema
} from '../../utils/validation';


// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Supported field types for dynamic form generation
 */
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'password'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'file'
  | 'rich-text'
  | 'json'
  | 'custom';

/**
 * Field configuration for dynamic form generation
 */
export interface FormField<T = any> {
  /** Unique field identifier */
  name: string;
  /** Field type */
  type: FieldType;
  /** Display label */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Help text or description */
  description?: string;
  /** Whether field is required */
  required?: boolean;
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether field is read-only */
  readOnly?: boolean;
  /** Options for select/radio fields */
  options?: Array<{ value: any; label: string; disabled?: boolean }>;
  /** Validation rules */
  validation?: z.ZodSchema<any>;
  /** Custom component for rendering */
  component?: React.ComponentType<any>;
  /** Field dependencies */
  dependsOn?: string[];
  /** Conditional visibility */
  showWhen?: (values: T) => boolean;
  /** Field grid span (1-12) */
  span?: number;
  /** Additional props for the field component */
  props?: Record<string, any>;
}

/**
 * Form configuration for different entity types
 */
export interface FormConfig<T extends FieldValues = FieldValues> {
  /** Entity type identifier */
  entityType: string;
  /** Form title */
  title: string | undefined;
  /** Form description */
  description: string | undefined;
  /** Field definitions */
  fields: FormField<T>[];
  /** Validation schema */
  schema: z.ZodSchema<T>;
  /** Form layout configuration */
  layout: FormLayout | undefined;
  /** Auto-save configuration */
  autoSave: AutoSaveConfig | undefined;
}

/**
 * Form layout configuration
 */
export interface FormLayout {
  /** Number of columns (1-4) */
  columns?: number;
  /** Field grouping */
  groups?: FormGroup[];
  /** Custom CSS classes */
  className?: string;
}

/**
 * Form field grouping
 */
export interface FormGroup {
  /** Group title */
  title: string;
  /** Group description */
  description?: string;
  /** Fields in this group */
  fields: string[];
  /** Whether group is collapsible */
  collapsible?: boolean;
  /** Whether group starts collapsed */
  defaultCollapsed?: boolean;
}

/**
 * Auto-save configuration
 */
export interface AutoSaveConfig {
  /** Whether auto-save is enabled */
  enabled: boolean;
  /** Auto-save interval in milliseconds */
  interval?: number;
  /** Auto-save callback */
  onAutoSave?: (data: any) => Promise<void>;
  /** Auto-save status callback */
  onAutoSaveStatus?: (status: 'saving' | 'saved' | 'error') => void;
}

/**
 * Dynamic form props
 */
export interface DynamicFormProps<T extends FieldValues = FieldValues> {
  /** Entity type or custom form configuration */
  entityType?: string;
  /** Custom form configuration */
  config?: FormConfig<T>;
  /** Initial form values */
  initialValues?: Partial<T>;
  /** Custom fields to override defaults */
  customFields?: FormField<T>[];
  /** Form submission handler */
  onSubmit: (data: T) => Promise<void> | void;
  /** Form cancellation handler */
  onCancel?: (() => void) | undefined;
  /** Loading state */
  loading?: boolean;
  /** Form error */
  error?: string | null;
  /** Auto-save configuration */
  autoSave?: boolean;
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show form actions */
  showActions?: boolean;
  /** Custom action buttons */
  customActions?: React.ReactNode;
}

// ============================================================================
// Entity Schema Definitions
// ============================================================================

/**
 * Validation schemas for different entity types
 * Uses the centralized schemas from utils/validation.ts
 */
export const entitySchemas = {
  course: courseSchema,
  level: levelSchema,
  section: sectionSchema,
  module: moduleSchema,
  lesson: lessonSchema,
  exercise: exerciseSchema,
} as const;

/**
 * Field configurations for different entity types
 */
export const entityFieldConfigs: Record<string, FormField[]> = {
  course: [
    {
      name: 'id',
      type: 'text',
      label: 'Course ID',
      placeholder: 'e.g., spanish-basics',
      description: 'Unique identifier for the course (max 20 characters)',
      required: true,
      span: 6,
    },
    {
      name: 'name',
      type: 'text',
      label: 'Course Name',
      placeholder: 'e.g., Spanish Basics',
      description: 'Display name for the course (max 100 characters)',
      required: true,
      span: 6,
    },
    {
      name: 'sourceLanguage',
      type: 'select',
      label: 'Source Language',
      description: 'The language students will learn from',
      required: true,
      span: 6,
      options: [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
        { value: 'it', label: 'Italian' },
        { value: 'pt', label: 'Portuguese' },
      ],
    },
    {
      name: 'targetLanguage',
      type: 'select',
      label: 'Target Language',
      description: 'The language students will learn',
      required: true,
      span: 6,
      options: [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Spanish' },
        { value: 'fr', label: 'French' },
        { value: 'de', label: 'German' },
        { value: 'it', label: 'Italian' },
        { value: 'pt', label: 'Portuguese' },
        { value: 'qu', label: 'Quechua' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Brief description of the course content and objectives',
      description: 'Optional course description (max 255 characters)',
      span: 12,
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      label: 'Make course public',
      description: 'Public courses are visible to all users',
      span: 12,
    },
  ],

  level: [
    {
      name: 'id',
      type: 'text',
      label: 'Level ID',
      placeholder: 'e.g., beginner-level-1',
      description: 'Unique identifier for the level (max 30 characters)',
      required: true,
      span: 6,
    },
    {
      name: 'code',
      type: 'text',
      label: 'Level Code',
      placeholder: 'e.g., A1',
      description: 'Short code for the level (max 10 characters)',
      required: true,
      span: 6,
    },
    {
      name: 'name',
      type: 'text',
      label: 'Level Name',
      placeholder: 'e.g., Beginner Level 1',
      description: 'Display name for the level (max 100 characters)',
      required: true,
      span: 8,
    },
    {
      name: 'order',
      type: 'number',
      label: 'Order',
      placeholder: '1',
      description: 'Display order within the course',
      required: true,
      span: 4,
      props: { min: 0, step: 1 },
    },
  ],

  section: [
    {
      name: 'id',
      type: 'text',
      label: 'Section ID',
      placeholder: 'e.g., grammar-basics-section',
      description: 'Unique identifier for the section (max 40 characters)',
      required: true,
      span: 6,
    },
    {
      name: 'name',
      type: 'text',
      label: 'Section Name',
      placeholder: 'e.g., Grammar Basics',
      description: 'Display name for the section (max 100 characters)',
      required: true,
      span: 6,
    },
    {
      name: 'order',
      type: 'number',
      label: 'Order',
      placeholder: '1',
      description: 'Display order within the level',
      required: true,
      span: 12,
      props: { min: 0, step: 1 },
    },
  ],

  module: [
    {
      name: 'id',
      type: 'text',
      label: 'Module ID',
      placeholder: 'e.g., present-tense-module',
      description: 'Unique identifier for the module (max 50 characters)',
      required: true,
      span: 6,
    },
    {
      name: 'name',
      type: 'text',
      label: 'Module Name',
      placeholder: 'e.g., Present Tense',
      description: 'Display name for the module (max 100 characters)',
      required: true,
      span: 6,
    },
    {
      name: 'moduleType',
      type: 'select',
      label: 'Module Type',
      description: 'Type of content in this module',
      required: true,
      span: 6,
      options: [
        { value: 'informative', label: 'Informative' },
        { value: 'basic_lesson', label: 'Basic Lesson' },
        { value: 'reading', label: 'Reading' },
        { value: 'dialogue', label: 'Dialogue' },
        { value: 'exam', label: 'Exam' },
      ],
    },
    {
      name: 'order',
      type: 'number',
      label: 'Order',
      placeholder: '1',
      description: 'Display order within the section',
      required: true,
      span: 6,
      props: { min: 0, step: 1 },
    },
  ],

  lesson: [
    {
      name: 'id',
      type: 'text',
      label: 'Lesson ID',
      placeholder: 'e.g., present-tense-lesson-1',
      description: 'Unique identifier for the lesson (max 60 characters)',
      required: true,
      span: 6,
    },
    {
      name: 'name',
      type: 'text',
      label: 'Lesson Name',
      placeholder: 'e.g., Present Tense - Introduction',
      description: 'Display name for the lesson (max 100 characters)',
      required: true,
      span: 6,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Brief description of the lesson content',
      description: 'Optional lesson description (max 255 characters)',
      span: 12,
    },
    {
      name: 'experiencePoints',
      type: 'number',
      label: 'Experience Points',
      placeholder: '10',
      description: 'Points awarded for completing this lesson (0-1000)',
      required: true,
      span: 6,
      props: { min: 0, max: 1000, step: 1 },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Order',
      placeholder: '1',
      description: 'Display order within the module',
      required: true,
      span: 6,
      props: { min: 0, step: 1 },
    },
  ],

  exercise: [
    {
      name: 'id',
      type: 'text',
      label: 'Exercise ID',
      placeholder: 'e.g., trans-001',
      description: 'Unique identifier for the exercise (max 15 characters)',
      required: true,
      span: 6,
    },
    {
      name: 'exerciseType',
      type: 'select',
      label: 'Exercise Type',
      description: 'Type of exercise',
      required: true,
      span: 6,
      options: [
        { value: 'translation', label: 'Translation' },
        { value: 'fill-in-the-blank', label: 'Fill in the Blank' },
        { value: 'vof', label: 'True/False' },
        { value: 'pairs', label: 'Matching Pairs' },
        { value: 'informative', label: 'Informative' },
        { value: 'ordering', label: 'Ordering' },
      ],
    },
    {
      name: 'data',
      type: 'json',
      label: 'Exercise Data',
      description: 'JSON data specific to the exercise type',
      required: true,
      span: 12,
    },
  ],
};

// ============================================================================
// Field Components
// ============================================================================

/**
 * Text input field component
 */
const TextField: React.FC<{
  field: any;
  fieldConfig: FormField;
  error?: string;
}> = ({ field, fieldConfig, error }) => {
  const fieldId = `field-${fieldConfig.name}`;

  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
        {fieldConfig.label}
        {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        {...field}
        id={fieldId}
        type={fieldConfig.type === 'email' ? 'email' : fieldConfig.type === 'password' ? 'password' : 'text'}
        placeholder={fieldConfig.placeholder}
        disabled={fieldConfig.disabled}
        readOnly={fieldConfig.readOnly}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
        `}
        {...fieldConfig.props}
      />
      {fieldConfig.description && (
        <p className="text-xs text-gray-500">{fieldConfig.description}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

/**
 * Textarea field component
 */
const TextareaField: React.FC<{
  field: any;
  fieldConfig: FormField;
  error?: string;
}> = ({ field, fieldConfig, error }) => {
  const fieldId = `field-${fieldConfig.name}`;

  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
        {fieldConfig.label}
        {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        {...field}
        id={fieldId}
        placeholder={fieldConfig.placeholder}
        disabled={fieldConfig.disabled}
        readOnly={fieldConfig.readOnly}
        rows={4}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
        `}
        {...fieldConfig.props}
      />
      {fieldConfig.description && (
        <p className="text-xs text-gray-500">{fieldConfig.description}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

/**
 * Number input field component
 */
const NumberField: React.FC<{
  field: any;
  fieldConfig: FormField;
  error?: string;
}> = ({ field, fieldConfig, error }) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {fieldConfig.label}
        {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        {...field}
        type="number"
        placeholder={fieldConfig.placeholder}
        disabled={fieldConfig.disabled}
        readOnly={fieldConfig.readOnly}
        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : '')}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
        `}
        {...fieldConfig.props}
      />
      {fieldConfig.description && (
        <p className="text-xs text-gray-500">{fieldConfig.description}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

/**
 * Select field component
 */
const SelectField: React.FC<{
  field: any;
  fieldConfig: FormField;
  error?: string;
}> = ({ field, fieldConfig, error }) => {
  const fieldId = `field-${fieldConfig.name}`;

  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700">
        {fieldConfig.label}
        {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        {...field}
        id={fieldId}
        disabled={fieldConfig.disabled}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
        `}
        {...fieldConfig.props}
      >
        <option value="">Select {fieldConfig.label}</option>
        {fieldConfig.options?.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {fieldConfig.description && (
        <p className="text-xs text-gray-500">{fieldConfig.description}</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

/**
 * Checkbox field component
 */
const CheckboxField: React.FC<{
  field: any;
  fieldConfig: FormField;
  error?: string;
}> = ({ field, fieldConfig, error }) => {
  const fieldId = `field-${fieldConfig.name}`;

  return (
    <div className="space-y-1">
      <div className="flex items-center">
        <input
          {...field}
          id={fieldId}
          type="checkbox"
          checked={field.value || false}
          disabled={fieldConfig.disabled}
          className={`
            h-4 w-4 text-blue-600 border-gray-300 rounded
            focus:ring-2 focus:ring-blue-500
            disabled:opacity-50
            ${error ? 'border-red-500' : ''}
          `}
          {...fieldConfig.props}
        />
        <label htmlFor={fieldId} className="ml-2 block text-sm text-gray-700">
          {fieldConfig.label}
        </label>
      </div>
      {fieldConfig.description && (
        <p className="text-xs text-gray-500 ml-6">{fieldConfig.description}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 ml-6">{error}</p>
      )}
    </div>
  );
};

/**
 * JSON field component for complex data
 */
const JsonField: React.FC<{
  field: any;
  fieldConfig: FormField;
  error?: string;
}> = ({ field, fieldConfig, error }) => {
  const [jsonString, setJsonString] = React.useState(() => {
    try {
      return JSON.stringify(field.value || {}, null, 2);
    } catch {
      return '{}';
    }
  });

  const [jsonError, setJsonError] = React.useState<string | null>(null);

  const handleJsonChange = (value: string) => {
    setJsonString(value);
    try {
      const parsed = JSON.parse(value);
      field.onChange(parsed);
      setJsonError(null);
    } catch (err) {
      setJsonError('Invalid JSON format');
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {fieldConfig.label}
        {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        value={jsonString}
        onChange={(e) => handleJsonChange(e.target.value)}
        placeholder={fieldConfig.placeholder || '{}'}
        disabled={fieldConfig.disabled}
        readOnly={fieldConfig.readOnly}
        rows={6}
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm font-mono text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${error || jsonError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
        `}
        {...fieldConfig.props}
      />
      {fieldConfig.description && (
        <p className="text-xs text-gray-500">{fieldConfig.description}</p>
      )}
      {(error || jsonError) && (
        <p className="text-xs text-red-600">{error || jsonError}</p>
      )}
    </div>
  );
};

// ============================================================================
// Main Dynamic Form Component
// ============================================================================

/**
 * Dynamic form component that adapts to different entity types
 */
export const DynamicForm = <T extends FieldValues = FieldValues>({
  entityType,
  config,
  initialValues,
  customFields,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  autoSave = false,
  autoSaveInterval = 30000,
  className = '',
  showActions = true,
  customActions,
}: DynamicFormProps<T>) => {

  // Determine form configuration
  const formConfig = useMemo(() => {
    if (config) return config;
    if (!entityType) throw new Error('Either entityType or config must be provided');

    const schema = entitySchemas[entityType as keyof typeof entitySchemas];
    const fields = customFields || entityFieldConfigs[entityType] || [];

    if (!schema) {
      console.warn(`No schema found for entity type: ${entityType}. Available schemas:`, Object.keys(entitySchemas));
      // Return a minimal config without schema for testing purposes
      return {
        entityType,
        fields,
        schema: undefined,
        title: `${entityType} Form`,
        description: `Form for ${entityType}`,
        layout: { columns: 1 },
        autoSave: false,
      } as unknown as FormConfig<T>;
    }

    return {
      entityType,
      fields,
      schema: schema as any, // Type assertion to handle generic constraint
    } as FormConfig<T>;
  }, [entityType, config, customFields]);

  // Initialize form with React Hook Form
  const form = useForm<T>({
    ...(formConfig.schema && { resolver: zodResolver(formConfig.schema as any) }), // Only include resolver if schema exists
    defaultValues: initialValues as any,
    mode: 'onChange',
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = form;

  // Watch all form values for auto-save
  const watchedValues = watch();

  // Auto-save functionality
  const [autoSaveStatus, setAutoSaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const performAutoSave = useCallback(async (data: T) => {
    if (!autoSave || !isDirty) return;

    try {
      setAutoSaveStatus('saving');
      if (formConfig.autoSave?.onAutoSave) {
        await formConfig.autoSave.onAutoSave(data);
      }
      setAutoSaveStatus('saved');

      // Reset status after 2 seconds
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Auto-save failed:', error);
      setAutoSaveStatus('error');
    }
  }, [autoSave, isDirty, formConfig.autoSave]);

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !isDirty) return;

    const timeoutId = setTimeout(() => {
      performAutoSave(watchedValues);
    }, autoSaveInterval);

    return () => clearTimeout(timeoutId);
  }, [watchedValues, autoSave, isDirty, autoSaveInterval, performAutoSave]);

  // Form submission handler
  const handleFormSubmit = async (data: any) => {
    try {
      await onSubmit(data as T);
      reset(data); // Reset form state after successful submission
    } catch (error) {
      console.error('Form submission failed:', error);
      // Error handling is managed by parent component
    }
  };

  // Render field component based on type
  const renderField = (fieldConfig: FormField<T>) => {
    const fieldError = errors[fieldConfig.name as Path<T>]?.message as string;

    // Check conditional visibility
    if (fieldConfig.showWhen && !fieldConfig.showWhen(watchedValues)) {
      return null;
    }

    return (
      <Controller
        key={fieldConfig.name}
        name={fieldConfig.name as Path<T>}
        control={control}
        render={({ field }) => {
          // Use custom component if provided
          if (fieldConfig.component) {
            const CustomComponent = fieldConfig.component;
            return (
              <CustomComponent
                field={field}
                fieldConfig={fieldConfig}
                error={fieldError}
                form={form}
              />
            );
          }

          // Render built-in field types
          switch (fieldConfig.type) {
            case 'textarea':
              return <TextareaField field={field} fieldConfig={fieldConfig} error={fieldError} />;
            case 'number':
              return <NumberField field={field} fieldConfig={fieldConfig} error={fieldError} />;
            case 'select':
              return <SelectField field={field} fieldConfig={fieldConfig} error={fieldError} />;
            case 'checkbox':
              return <CheckboxField field={field} fieldConfig={fieldConfig} error={fieldError} />;
            case 'json':
              return <JsonField field={field} fieldConfig={fieldConfig} error={fieldError} />;
            default:
              return <TextField field={field} fieldConfig={fieldConfig} error={fieldError} />;
          }
        }}
      />
    );
  };

  // Calculate grid columns
  const gridCols = formConfig.layout?.columns || 2;
  const gridClass = `grid grid-cols-1 md:grid-cols-${gridCols} gap-6`;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Form Header */}
      {(formConfig.title || formConfig.description) && (
        <div className="space-y-2">
          {formConfig.title && (
            <h2 className="text-lg font-semibold text-gray-900">{formConfig.title}</h2>
          )}
          {formConfig.description && (
            <p className="text-sm text-gray-600">{formConfig.description}</p>
          )}
        </div>
      )}

      {/* Auto-save Status */}
      {autoSave && autoSaveStatus !== 'idle' && (
        <div className="flex items-center space-x-2 text-sm">
          {autoSaveStatus === 'saving' && (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span className="text-blue-600">Saving...</span>
            </>
          )}
          {autoSaveStatus === 'saved' && (
            <>
              <div className="h-4 w-4 text-green-500">✓</div>
              <span className="text-green-600">Saved</span>
            </>
          )}
          {autoSaveStatus === 'error' && (
            <>
              <div className="h-4 w-4 text-red-500">✗</div>
              <span className="text-red-600">Save failed</span>
            </>
          )}
        </div>
      )}

      {/* Form Error */}
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
          </div>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className={gridClass}>
          {formConfig.fields.map((fieldConfig) => (
            <div
              key={fieldConfig.name}
              className={fieldConfig.span ? `md:col-span-${fieldConfig.span}` : ''}
            >
              {renderField(fieldConfig)}
            </div>
          ))}
        </div>

        {/* Form Actions */}
        {showActions && (
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            {customActions || (
              <>
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting || loading ? (
                    <>
                      <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full inline-block" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default DynamicForm;