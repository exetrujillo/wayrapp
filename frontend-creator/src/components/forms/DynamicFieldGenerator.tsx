/**
 * Dynamic Field Generator Component
 * 
 * This component generates form fields dynamically based on Zod schemas,
 * supporting conditional fields, field ordering, grouping, and type-specific
 * rendering. It replaces hardcoded field configurations with schema-driven
 * field generation.
 * 
 * @module DynamicFieldGenerator
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { useMemo, useCallback } from 'react';
import { Controller, Control, FieldValues, FieldErrors } from 'react-hook-form';
import { z } from 'zod';
// import { useTranslation } from 'react-i18next';
import {
  LANGUAGE_OPTIONS,
  MODULE_TYPE_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  getExerciseTypeDescription
} from './FormConstants';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface FieldConfig {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'checkbox' | 'radio' | 'file' | 'custom';
  label: string;
  placeholder?: string;
  description?: string;
  required: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string; description?: string }>;
  validation?: z.ZodTypeAny;
  component?: React.ComponentType<any>;
  dependsOn?: string[];
  showWhen?: (values: any) => boolean;
  span?: number;
  group?: string;
  order?: number;
  props?: Record<string, any>;
}

export interface FieldGroup {
  name: string;
  label: string;
  description?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  order?: number;
}

export interface DynamicFieldGeneratorProps<T extends FieldValues = FieldValues> {
  /** Zod schema to generate fields from */
  schema: z.ZodTypeAny;
  /** Entity type for context */
  entityType: string;
  /** Form mode (create/edit) */
  mode?: 'create' | 'edit';
  /** Form control from react-hook-form */
  control: Control<T>;
  /** Form errors */
  errors: FieldErrors<T>;
  /** Current form values */
  values: T;
  /** Field change handler */
  onChange?: (name: string, value: any) => void;
  /** Custom field configurations */
  customFields?: Record<string, Partial<FieldConfig>>;
  /** Field groups configuration */
  fieldGroups?: Record<string, FieldGroup>;
  /** Fields to exclude */
  excludeFields?: string[];
  /** Fields to include (if specified, only these will be shown) */
  includeFields?: string[];
  /** Custom field order */
  fieldOrder?: string[];
  /** Additional CSS classes */
  className?: string;
  /** Disable all fields */
  disabled?: boolean;
  /** Disable HTML5 validation patterns */
  disableHtmlValidation?: boolean;
}

// ============================================================================
// Schema Analysis Utilities
// ============================================================================

/**
 * Extract field information from Zod schema
 */
const analyzeZodSchema = (schema: z.ZodTypeAny, entityType: string, disableHtmlValidation = false): Record<string, FieldConfig> => {
  const fields: Record<string, FieldConfig> = {};

  // Handle ZodEffects by getting the underlying schema
  let actualSchema = schema;
  if ('_def' in schema && 'schema' in schema._def) {
    actualSchema = schema._def.schema;
  }

  // Handle different schema types
  if (actualSchema instanceof z.ZodObject) {
    const shape = actualSchema.shape;

    Object.entries(shape).forEach(([fieldName, fieldSchema]) => {
      const fieldConfig = analyzeFieldSchema(fieldName, fieldSchema as z.ZodTypeAny, entityType, disableHtmlValidation);
      if (fieldConfig) {
        fields[fieldName] = fieldConfig;
      }
    });
  }

  return fields;
};

/**
 * Analyze individual field schema
 */
const analyzeFieldSchema = (fieldName: string, fieldSchema: z.ZodTypeAny, entityType: string, disableHtmlValidation = false): FieldConfig | null => {
  // Skip internal fields
  if (['createdAt', 'updatedAt'].includes(fieldName)) {
    return null;
  }

  let baseSchema = fieldSchema;
  let isOptional = false;
  let isNullable = false;

  // Unwrap optional and nullable schemas
  if (fieldSchema instanceof z.ZodOptional) {
    isOptional = true;
    baseSchema = fieldSchema._def.innerType;
  }

  if (baseSchema instanceof z.ZodNullable) {
    isNullable = true;
    baseSchema = baseSchema._def.innerType;
  }

  // Handle union types (like optional strings)
  if (baseSchema instanceof z.ZodUnion) {
    const types = baseSchema._def.options;
    const nonLiteralType = types.find((type: any) => !(type instanceof z.ZodLiteral));
    if (nonLiteralType) {
      baseSchema = nonLiteralType;
    }
  }

  const fieldConfig: FieldConfig = {
    name: fieldName,
    type: 'text',
    label: generateFieldLabel(fieldName),
    required: !isOptional && !isNullable,
    validation: fieldSchema,
    span: 12,
    order: getFieldOrder(fieldName, entityType),
    group: getFieldGroup(fieldName, entityType),
  };

  // Determine field type and configuration based on schema
  if (baseSchema instanceof z.ZodString) {
    configureStringField(fieldConfig, baseSchema, fieldName, entityType, disableHtmlValidation);
  } else if (baseSchema instanceof z.ZodNumber) {
    configureNumberField(fieldConfig, baseSchema, fieldName);
  } else if (baseSchema instanceof z.ZodBoolean) {
    configureBooleanField(fieldConfig, fieldName);
  } else if (baseSchema instanceof z.ZodEnum) {
    configureEnumField(fieldConfig, baseSchema, fieldName);
  } else if (baseSchema instanceof z.ZodArray) {
    configureArrayField(fieldConfig, baseSchema, fieldName);
  } else if (baseSchema instanceof z.ZodObject) {
    configureObjectField(fieldConfig, baseSchema, fieldName);
  }

  return fieldConfig;
};

/**
 * Configure string field
 */
const configureStringField = (config: FieldConfig, schema: z.ZodString, fieldName: string, _entityType: string, disableHtmlValidation = false) => {
  const checks = schema._def.checks || [];

  // Determine field type based on name and constraints
  if (fieldName.includes('description') || fieldName.includes('content')) {
    config.type = 'textarea';
    config.span = 12;
    config.props = { rows: 4 };
  } else if (fieldName.includes('email')) {
    config.type = 'text';
    config.props = { type: 'email' };
  } else if (fieldName.includes('url')) {
    config.type = 'text';
    config.props = { type: 'url' };
  } else if (fieldName.includes('password')) {
    config.type = 'text';
    config.props = { type: 'password' };
  }

  // Handle specific field names
  if (fieldName === 'sourceLanguage' || fieldName === 'targetLanguage') {
    config.type = 'select';
    config.options = LANGUAGE_OPTIONS.map(opt => ({ ...opt }));
    config.span = 6;
  } else if (fieldName === 'moduleType') {
    config.type = 'select';
    config.options = MODULE_TYPE_OPTIONS.map(opt => ({ ...opt }));
    config.span = 6;
  } else if (fieldName === 'exerciseType') {
    config.type = 'select';
    config.options = EXERCISE_TYPE_OPTIONS.map(opt => ({
      ...opt,
      description: getExerciseTypeDescription(opt.value),
    }));
    config.span = 6;
  }

  // Apply constraints from schema
  checks.forEach((check: any) => {
    switch (check.kind) {
      case 'min':
        if (!config.props) config.props = {};
        config.props.minLength = check.value;
        break;
      case 'max':
        if (!config.props) config.props = {};
        config.props.maxLength = check.value;
        break;
      case 'regex':
        if (!disableHtmlValidation) {
          if (!config.props) config.props = {};
          config.props.pattern = check.regex.source;
        }
        break;
    }
  });

  // Set placeholder
  config.placeholder = generatePlaceholder(fieldName, config.type);
};

/**
 * Configure number field
 */
const configureNumberField = (config: FieldConfig, schema: z.ZodNumber, fieldName: string) => {
  config.type = 'number';
  config.span = fieldName === 'order' ? 6 : 12;

  const checks = schema._def.checks || [];
  const props: Record<string, any> = {};

  checks.forEach((check: any) => {
    switch (check.kind) {
      case 'min':
        props.min = check.value;
        break;
      case 'max':
        props.max = check.value;
        break;
      case 'int':
        props.step = 1;
        break;
    }
  });

  config.props = props;
  config.placeholder = generatePlaceholder(fieldName, config.type);
};

/**
 * Configure boolean field
 */
const configureBooleanField = (config: FieldConfig, fieldName: string) => {
  config.type = 'checkbox';
  config.span = 12;
  config.description = generateFieldDescription(fieldName);
};

/**
 * Configure enum field
 */
const configureEnumField = (config: FieldConfig, schema: z.ZodEnum<any>, fieldName: string) => {
  config.type = 'select';
  config.options = schema._def.values.map((value: string) => ({
    value,
    label: generateOptionLabel(value),
    description: generateOptionDescription(value, fieldName),
  }));
  config.span = 6;
};

/**
 * Configure array field
 */
const configureArrayField = (config: FieldConfig, schema: z.ZodArray<any>, _fieldName: string) => {
  config.type = 'custom';
  config.span = 12;
  config.component = ArrayFieldComponent;
  config.props = { itemSchema: schema._def.type };
};

/**
 * Configure object field
 */
const configureObjectField = (config: FieldConfig, schema: z.ZodObject<any>, _fieldName: string) => {
  config.type = 'custom';
  config.span = 12;
  config.component = ObjectFieldComponent;
  config.props = { objectSchema: schema };
};

// ============================================================================
// Field Generation Utilities
// ============================================================================

/**
 * Generate human-readable field label
 */
const generateFieldLabel = (fieldName: string): string => {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/Id$/, ' ID')
    .replace(/Url$/, ' URL');
};

/**
 * Generate field placeholder
 */
const generatePlaceholder = (fieldName: string, _fieldType: string): string => {
  const placeholders: Record<string, string> = {
    id: 'unique-identifier',
    name: 'Enter name',
    code: 'A1',
    description: 'Enter description...',
    sourceLanguage: 'Select source language',
    targetLanguage: 'Select target language',
    moduleType: 'Select module type',
    exerciseType: 'Select exercise type',
    order: '1',
    experiencePoints: '10',
  };

  return placeholders[fieldName] || `Enter ${fieldName.toLowerCase()}`;
};

/**
 * Generate field description
 */
const generateFieldDescription = (fieldName: string): string => {
  const descriptions: Record<string, string> = {
    id: 'Unique identifier (lowercase, hyphens allowed)',
    isPublic: 'Make this item visible to all users',
    sourceLanguage: 'The language students will learn from',
    targetLanguage: 'The language students will learn',
    moduleType: 'Type of content in this module',
    exerciseType: 'Type of exercise',
    order: 'Display order (lower numbers appear first)',
    experiencePoints: 'Points awarded for completing this item',
  };

  return descriptions[fieldName] || '';
};

/**
 * Generate option label
 */
const generateOptionLabel = (value: string): string => {
  return value
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Generate option description
 */
const generateOptionDescription = (value: string, fieldName: string): string => {
  if (fieldName === 'exerciseType') {
    return getExerciseTypeDescription(value);
  }
  return '';
};

/**
 * Get field order for layout
 */
const getFieldOrder = (fieldName: string, entityType: string): number => {
  const orderMap: Record<string, Record<string, number>> = {
    course: {
      id: 1,
      name: 2,
      sourceLanguage: 3,
      targetLanguage: 4,
      description: 5,
      isPublic: 6,
    },
    level: {
      code: 1,
      name: 2,
      order: 3,
    },
    section: {
      id: 1,
      name: 2,
      order: 3,
    },
    module: {
      name: 1,
      moduleType: 2,
      order: 3,
    },
    lesson: {
      name: 1,
      description: 2,
      experiencePoints: 3,
      order: 4,
    },
    exercise: {
      exerciseType: 1,
      data: 2,
    },
  };

  return orderMap[entityType]?.[fieldName] || 999;
};

/**
 * Get field group
 */
const getFieldGroup = (fieldName: string, _entityType: string): string => {
  if (['id', 'name', 'code'].includes(fieldName)) {
    return 'basic';
  }
  if (['sourceLanguage', 'targetLanguage', 'moduleType', 'exerciseType'].includes(fieldName)) {
    return 'configuration';
  }
  if (['description', 'content'].includes(fieldName)) {
    return 'content';
  }
  if (['order', 'experiencePoints'].includes(fieldName)) {
    return 'settings';
  }
  if (['isPublic', 'enabled'].includes(fieldName)) {
    return 'visibility';
  }
  return 'general';
};

// ============================================================================
// Field Components
// ============================================================================

/**
 * Array field component for handling array inputs
 */
const ArrayFieldComponent: React.FC<{
  value: any[];
  onChange: (value: any[]) => void;
  itemSchema: z.ZodTypeAny;
  disabled?: boolean;
}> = ({ value = [], onChange, itemSchema, disabled }) => {
  // const { t } = useTranslation();

  const addItem = () => {
    const newItem = itemSchema instanceof z.ZodString ? '' :
      itemSchema instanceof z.ZodNumber ? 0 :
        itemSchema instanceof z.ZodObject ? {} : null;
    onChange([...value, newItem]);
  };

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, newValue: any) => {
    const newArray = [...value];
    newArray[index] = newValue;
    onChange(newArray);
  };

  return (
    <div className="space-y-2">
      {value.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            disabled={disabled}
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            type="button"
            onClick={() => removeItem(index)}
            disabled={disabled}
            className="text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        disabled={disabled}
        className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
      >
        Add Item
      </button>
    </div>
  );
};

/**
 * Object field component for handling nested objects
 */
const ObjectFieldComponent: React.FC<{
  value: any;
  onChange: (value: any) => void;
  objectSchema: z.ZodObject<any>;
  disabled?: boolean;
}> = ({ value = {}, onChange, objectSchema, disabled }) => {
  const fields = analyzeZodSchema(objectSchema, 'nested');

  const updateField = (fieldName: string, fieldValue: any) => {
    onChange({ ...value, [fieldName]: fieldValue });
  };

  return (
    <div className="space-y-4 p-4 border border-gray-200 rounded-md">
      {Object.entries(fields).map(([fieldName, fieldConfig]) => (
        <div key={fieldName}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {fieldConfig.label}
            {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type={fieldConfig.type === 'number' ? 'number' : 'text'}
            value={value[fieldName] || ''}
            onChange={(e) => updateField(fieldName, e.target.value)}
            disabled={disabled}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      ))}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

/**
 * Dynamic Field Generator Component
 * 
 * @example
 * <DynamicFieldGenerator
 *   schema={courseSchema}
 *   entityType="course"
 *   control={control}
 *   errors={errors}
 *   values={watch()}
 * />
 */
export const DynamicFieldGenerator = <T extends FieldValues = FieldValues>({
  schema,
  entityType,
  mode,
  control,
  errors,
  values,
  // onChange, // Commented out to prevent focus loss issues
  customFields = {},
  fieldGroups = {},
  excludeFields = [],
  includeFields,
  fieldOrder,
  className = '',
  disabled = false,
  disableHtmlValidation = false,
}: DynamicFieldGeneratorProps<T>) => {
  // const { t } = useTranslation();

  // Add stable field configs
  const fieldConfigs = useMemo(() =>
    analyzeZodSchema(schema, entityType, disableHtmlValidation),
    [schema, entityType, disableHtmlValidation]
  );

  // Generate field configurations from schema
  const generatedFields = useMemo(() => {
    const fields = { ...fieldConfigs };

    // Apply custom field overrides
    Object.entries(customFields).forEach(([fieldName, customConfig]) => {
      if (fields[fieldName]) {
        fields[fieldName] = { ...fields[fieldName], ...customConfig };
      }
    });

    // Disable ID field in edit mode
    if (mode === 'edit' && fields['id']) {
      fields['id'].disabled = true;
    }

    return fields;
  }, [fieldConfigs, mode, customFields]);

  // Check if any fields have conditional visibility
  const hasConditionalFields = useMemo(() => {
    return Object.values(generatedFields).some(config => config.showWhen);
  }, [generatedFields]);

  // Filter and sort fields
  const visibleFields = useMemo(() => {
    let fields = Object.entries(generatedFields);

    // Filter fields
    if (includeFields && includeFields.length > 0) {
      fields = fields.filter(([name]) => includeFields.includes(name));
    }
    fields = fields.filter(([name]) => !excludeFields.includes(name));

    // Apply conditional visibility only if there are conditional fields
    if (hasConditionalFields) {
      fields = fields.filter(([_name, config]) => {
        if (config.showWhen) {
          return config.showWhen(values);
        }
        return true;
      });
    }

    // Sort fields
    if (fieldOrder) {
      fields.sort(([a], [b]) => {
        const aIndex = fieldOrder.indexOf(a);
        const bIndex = fieldOrder.indexOf(b);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
    } else {
      fields.sort(([, a], [, b]) => (a.order || 999) - (b.order || 999));
    }

    return fields;
  }, [
    generatedFields, 
    includeFields, 
    excludeFields, 
    fieldOrder,
    hasConditionalFields,
    // Only include values as dependency if there are conditional fields
    ...(hasConditionalFields ? [values] : [])
  ]);

  // Group fields
  const groupedFields = useMemo(() => {
    const groups: Record<string, Array<[string, FieldConfig]>> = {};

    visibleFields.forEach(([name, config]) => {
      const groupName = config.group || 'general';
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      groups[groupName].push([name, config]);
    });

    return groups;
  }, [visibleFields]);

  /**
   * Render individual field
   */
  const renderField = useCallback((fieldName: string, fieldConfig: FieldConfig) => {
    const error = errors[fieldName as keyof T];
    const fieldId = `field-${fieldName}`;

    // Map span to proper Tailwind classes
    const getColSpanClass = (span: number) => {
      switch (span) {
        case 1: return 'col-span-1';
        case 2: return 'col-span-2';
        case 3: return 'col-span-3';
        case 4: return 'col-span-4';
        case 5: return 'col-span-5';
        case 6: return 'col-span-6';
        case 7: return 'col-span-7';
        case 8: return 'col-span-8';
        case 9: return 'col-span-9';
        case 10: return 'col-span-10';
        case 11: return 'col-span-11';
        case 12: return 'col-span-12';
        default: return 'col-span-12';
      }
    };

    return (
      <div key={`field-${fieldName}-${entityType}`} className={`${getColSpanClass(fieldConfig.span || 12)} space-y-2`}>
        <label htmlFor={fieldId} className="block text-sm font-medium text-neutral-700">
          {fieldConfig.label}
          {fieldConfig.required && <span className="text-error ml-1">*</span>}
        </label>

        {fieldConfig.description && (
          <p className="text-xs text-neutral-500">{fieldConfig.description}</p>
        )}

        <Controller
          key={`controller-${fieldName}`} // Add stable key
          name={fieldName as any}
          control={control}
          render={({ field }) => {


            if (fieldConfig.component) {
              const CustomComponent = fieldConfig.component;
              return (
                <CustomComponent
                  {...field}
                  {...fieldConfig.props}
                  disabled={disabled || fieldConfig.disabled}
                  onChange={(value: any) => {
                    field.onChange(value);
                    // Note: Removed onChange callback to prevent focus loss
                    // onChange?.(fieldName, value);
                  }}
                />
              );
            }



            switch (fieldConfig.type) {
              case 'textarea':

                return (
                  <textarea
                    {...field}
                    id={fieldId}
                    placeholder={fieldConfig.placeholder}
                    disabled={disabled || fieldConfig.disabled}
                    className="block w-full min-h-20 px-3 py-2 rounded-md border border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-neutral-50 disabled:text-neutral-500 text-sm"
                    style={{ minHeight: '80px' }}
                    {...fieldConfig.props}
                  />
                );

              case 'select':

                return (
                  <select
                    {...field}
                    id={fieldId}
                    disabled={disabled || fieldConfig.disabled}
                    className="block w-full h-10 px-3 py-2 rounded-md border border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-neutral-50 disabled:text-neutral-500 text-sm"
                    style={{ minHeight: '40px', height: '40px' }}
                    {...fieldConfig.props}
                  >
                    <option value="">{fieldConfig.placeholder || `Select ${fieldConfig.label}`}</option>
                    {fieldConfig.options?.map((option) => (
                      <option key={option.value} value={option.value} title={option.description}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                );

              case 'checkbox':
                return (
                  <div className="flex items-center">
                    <input
                      {...field}
                      type="checkbox"
                      id={fieldId}
                      checked={field.value || false}
                      disabled={disabled || fieldConfig.disabled}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded disabled:opacity-50"
                      {...fieldConfig.props}
                    />
                    <label htmlFor={fieldId} className="ml-2 text-sm text-neutral-700">
                      {fieldConfig.description || fieldConfig.label}
                    </label>
                  </div>
                );

              case 'number':
                return (
                  <input
                    {...field}
                    type="number"
                    id={fieldId}
                    placeholder={fieldConfig.placeholder}
                    disabled={disabled || fieldConfig.disabled}
                    className="block w-full h-10 px-3 py-2 rounded-md border border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-neutral-50 disabled:text-neutral-500 text-sm"
                    style={{ minHeight: '40px', height: '40px' }}
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '') {
                        field.onChange(undefined);
                      } else {
                        const numericValue = parseFloat(value);
                        if (!isNaN(numericValue)) {
                          field.onChange(numericValue);
                          // Note: Removed onChange callback to prevent focus loss
                          // onChange?.(fieldName, numericValue);
                        }
                      }
                    }}
                    {...fieldConfig.props}
                  />
                );

              default:
                return (
                  <input
                    {...field}
                    type="text"
                    id={fieldId}
                    placeholder={fieldConfig.placeholder}
                    disabled={disabled || fieldConfig.disabled}
                    className="block w-full h-10 px-3 py-2 rounded-md border border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:bg-neutral-50 disabled:text-neutral-500 text-sm"
                    style={{ minHeight: '40px', height: '40px' }}
                    {...fieldConfig.props}
                  />
                );
            }
          }}
        />

        {error && (
          <p className="mt-1 text-sm text-error">
            {error.message as string}
          </p>
        )}
      </div>
    );
  }, [control, errors, disabled]);

  /**
   * Render field group
   */
  const renderFieldGroup = (groupName: string, fields: Array<[string, FieldConfig]>) => {
    const groupConfig = fieldGroups[groupName];

    if (!groupConfig) {
      return fields.map(([name, config]) => renderField(name, config));
    }

    return (
      <div key={groupName} className="space-y-4">
        <div className="border-b border-gray-200 pb-2">
          <h3 className="text-lg font-medium text-gray-900">{groupConfig.label}</h3>
          {groupConfig.description && (
            <p className="text-sm text-gray-500">{groupConfig.description}</p>
          )}
        </div>
        <div className="grid grid-cols-12 gap-6">
          {fields.map(([name, config]) => renderField(name, config))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>

      {Object.keys(fieldGroups).length > 0 ? (
        // Render grouped fields
        Object.entries(groupedFields)
          .sort(([, a], [, b]) => {
            const aOrder = fieldGroups[a[0]?.[1]?.group || 'general']?.order || 999;
            const bOrder = fieldGroups[b[0]?.[1]?.group || 'general']?.order || 999;
            return aOrder - bOrder;
          })
          .map(([groupName, fields]) => renderFieldGroup(groupName, fields))
      ) : (
        // Render ungrouped fields
        <div className="grid grid-cols-12 gap-6">
          {visibleFields.map(([name, config]) => renderField(name, config))}
        </div>
      )}
    </div>
  );
};

export default DynamicFieldGenerator;