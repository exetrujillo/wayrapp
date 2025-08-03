/**
 * Form Utility Functions
 * 
 * This module provides utility functions for common form operations
 * to eliminate duplicate logic and ensure consistency across forms.
 * 
 * @module FormUtils
 * @category Utils
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { FieldValues } from 'react-hook-form';
// FormFieldConfig type definition moved here since FormFieldComponents was deleted
interface FormFieldConfig<T extends FieldValues = FieldValues> {
  name: string;
  type: string;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: any;
  component?: React.ComponentType<any>;
  dependsOn?: string[];
  showWhen?: (values: T) => boolean;
  span?: number;
  props?: Record<string, any>;
}
import { 
  LANGUAGE_OPTIONS, 
  MODULE_TYPE_OPTIONS, 
  EXERCISE_TYPE_OPTIONS,
  FIELD_CONSTRAINTS,
  COMMON_FIELD_PROPS,
  DEFAULT_VALUES,
} from './FormConstants';

// ============================================================================
// Field Configuration Builders
// ============================================================================

/**
 * Creates a standardized ID field configuration
 */
export const createIdField = (
  name: string,
  label: string,
  placeholder: string,
  maxLength: number,
  description?: string,
  disabled: boolean = false
): FormFieldConfig => ({
  name,
  type: 'text',
  label,
  placeholder,
  description: description || `Unique identifier (lowercase, hyphens allowed, max ${maxLength} chars)`,
  required: true,
  span: 6,
  props: {
    maxLength,
    ...COMMON_FIELD_PROPS.ID_FIELD,
  },
  disabled,
});

/**
 * Creates a standardized name field configuration
 */
export const createNameField = (
  name: string,
  label: string,
  placeholder: string,
  maxLength: number,
  description?: string,
  span: number = 6
): FormFieldConfig => ({
  name,
  type: 'text',
  label,
  placeholder,
  description: description || `Display name (max ${maxLength} characters)`,
  required: true,
  span,
  props: { maxLength },
});

/**
 * Creates a standardized order field configuration
 */
export const createOrderField = (
  name: string = 'order',
  label: string = 'Order',
  description?: string,
  min: number = FIELD_CONSTRAINTS.ORDER_MIN,
  span: number = 12
): FormFieldConfig => ({
  name,
  type: 'number',
  label,
  placeholder: min.toString(),
  description: description || `Display order (${min}-${FIELD_CONSTRAINTS.ORDER_MAX})`,
  required: true,
  span,
  props: {
    min,
    max: FIELD_CONSTRAINTS.ORDER_MAX,
    step: FIELD_CONSTRAINTS.ORDER_STEP,
  },
});

/**
 * Creates a standardized description field configuration
 */
export const createDescriptionField = (
  name: string = 'description',
  label: string = 'Description',
  placeholder: string,
  maxLength: number,
  required: boolean = false,
  span: number = 12
): FormFieldConfig => ({
  name,
  type: 'textarea',
  label,
  placeholder,
  description: `${required ? 'Required' : 'Optional'} description (max ${maxLength} characters)`,
  required,
  span,
  props: { 
    maxLength, 
    rows: 3,
  },
});

/**
 * Creates a language select field configuration
 */
export const createLanguageField = (
  name: string,
  label: string,
  description: string,
  span: number = 6
): FormFieldConfig => ({
  name,
  type: 'select',
  label,
  description,
  required: true,
  span,
  options: [...LANGUAGE_OPTIONS],
});

/**
 * Creates a module type select field configuration
 */
export const createModuleTypeField = (
  name: string = 'moduleType',
  label: string = 'Module Type',
  description: string = 'Type of content in this module',
  span: number = 6
): FormFieldConfig => ({
  name,
  type: 'select',
  label,
  description,
  required: true,
  span,
  options: [...MODULE_TYPE_OPTIONS],
});

/**
 * Creates an exercise type select field configuration
 */
export const createExerciseTypeField = (
  name: string = 'exerciseType',
  label: string = 'Exercise Type',
  description: string = 'Type of exercise',
  span: number = 6
): FormFieldConfig => ({
  name,
  type: 'select',
  label,
  description,
  required: true,
  span,
  options: [...EXERCISE_TYPE_OPTIONS],
});

/**
 * Creates a checkbox field configuration
 */
export const createCheckboxField = (
  name: string,
  label: string,
  description: string,
  span: number = 12
): FormFieldConfig => ({
  name,
  type: 'checkbox',
  label,
  description,
  span,
});

// ============================================================================
// Entity-Specific Field Builders
// ============================================================================

/**
 * Creates course-specific field configurations
 */
export const createCourseFields = (isEditing: boolean = false): FormFieldConfig[] => [
  createIdField(
    'id',
    'Course ID',
    'spanish-basics',
    FIELD_CONSTRAINTS.COURSE_ID_MAX_LENGTH,
    undefined,
    isEditing
  ),
  createNameField(
    'name',
    'Course Name',
    'Spanish Basics',
    FIELD_CONSTRAINTS.COURSE_NAME_MAX_LENGTH
  ),
  createLanguageField(
    'sourceLanguage',
    'Source Language',
    'The language students will learn from'
  ),
  createLanguageField(
    'targetLanguage',
    'Target Language',
    'The language students will learn'
  ),
  createDescriptionField(
    'description',
    'Description',
    'Brief description of the course content and objectives',
    FIELD_CONSTRAINTS.COURSE_DESCRIPTION_MAX_LENGTH
  ),
  createCheckboxField(
    'isPublic',
    'Make course public',
    'Public courses are visible to all users'
  ),
];

/**
 * Creates level-specific field configurations
 */
export const createLevelFields = (): FormFieldConfig[] => [
  {
    name: 'code',
    type: 'text',
    label: 'Level Code',
    placeholder: 'A1',
    description: 'Uppercase letters and numbers only (e.g., A1, B2)',
    required: true,
    span: 6,
    props: {
      maxLength: FIELD_CONSTRAINTS.LEVEL_CODE_MAX_LENGTH,
      ...COMMON_FIELD_PROPS.LEVEL_CODE,
    },
  },
  createNameField(
    'name',
    'Level Name',
    'Beginner Level',
    FIELD_CONSTRAINTS.LEVEL_NAME_MAX_LENGTH
  ),
  createOrderField(
    'order',
    'Order',
    'Display order within the course',
    FIELD_CONSTRAINTS.LEVEL_ORDER_MIN
  ),
];

/**
 * Creates section-specific field configurations
 */
export const createSectionFields = (): FormFieldConfig[] => [
  createIdField(
    'id',
    'Section ID',
    'grammar-basics',
    FIELD_CONSTRAINTS.SECTION_ID_MAX_LENGTH
  ),
  createNameField(
    'name',
    'Section Name',
    'Grammar Basics',
    FIELD_CONSTRAINTS.SECTION_NAME_MAX_LENGTH
  ),
  createOrderField(
    'order',
    'Order',
    'Display order within the level'
  ),
];

/**
 * Creates module-specific field configurations
 */
export const createModuleFields = (): FormFieldConfig[] => [
  createNameField(
    'name',
    'Module Name',
    'Present Tense',
    FIELD_CONSTRAINTS.MODULE_NAME_MAX_LENGTH
  ),
  createModuleTypeField(),
  createOrderField(
    'order',
    'Order',
    'Display order within the section'
  ),
];

/**
 * Creates lesson-specific field configurations
 */
export const createLessonFields = (): FormFieldConfig[] => [
  {
    name: 'experiencePoints',
    type: 'number',
    label: 'Experience Points',
    placeholder: '10',
    description: 'Points awarded for completing this lesson (1-1000)',
    required: true,
    span: 6,
    props: COMMON_FIELD_PROPS.EXPERIENCE_POINTS_FIELD,
  },
  createOrderField(
    'order',
    'Order',
    'Display order within the module',
    FIELD_CONSTRAINTS.ORDER_MIN,
    6
  ),
];

/**
 * Creates exercise-specific field configurations
 */
export const createExerciseFields = (): FormFieldConfig[] => [
  createExerciseTypeField(),
  {
    name: 'data',
    type: 'json',
    label: 'Exercise Data',
    description: 'JSON data specific to the exercise type',
    required: true,
    span: 12,
  },
];

// ============================================================================
// Form Data Utilities
// ============================================================================

/**
 * Creates initial values for a form based on entity type and existing data
 */
export const createInitialValues = <T extends FieldValues>(
  entityType: string,
  existingData?: Partial<T>
): Partial<T> => {
  const defaults = DEFAULT_VALUES[entityType.toUpperCase() as keyof typeof DEFAULT_VALUES] || {};
  
  return {
    ...(defaults as any),
    ...existingData,
  };
};

/**
 * Validates that source and target languages are different
 */
export const validateLanguageDifference = (sourceLanguage: string, targetLanguage: string): string | null => {
  if (sourceLanguage === targetLanguage) {
    return 'Source and target languages must be different';
  }
  return null;
};

/**
 * Generates a suggested ID from a name
 */
export const generateIdFromName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Validates an ID format
 */
export const validateIdFormat = (id: string, maxLength: number): string | null => {
  if (!id) return 'ID is required';
  if (id.length > maxLength) return `ID must be ${maxLength} characters or less`;
  if (!/^[a-z0-9-]+$/.test(id)) return 'ID can only contain lowercase letters, numbers, and hyphens';
  if (id.startsWith('-') || id.endsWith('-')) return 'ID cannot start or end with a hyphen';
  return null;
};

/**
 * Validates a level code format
 */
export const validateLevelCodeFormat = (code: string): string | null => {
  if (!code) return 'Level code is required';
  if (code.length > FIELD_CONSTRAINTS.LEVEL_CODE_MAX_LENGTH) {
    return `Level code must be ${FIELD_CONSTRAINTS.LEVEL_CODE_MAX_LENGTH} characters or less`;
  }
  if (!/^[A-Z0-9]+$/.test(code)) return 'Level code can only contain uppercase letters and numbers';
  return null;
};

/**
 * Gets the parent ID field name for hierarchical entities
 */
export const getParentIdField = (entityType: string): string => {
  switch (entityType) {
    case 'level': return 'courseId';
    case 'section': return 'levelId';
    case 'module': return 'sectionId';
    case 'lesson': return 'moduleId';
    case 'exercise': return 'lessonId';
    default: return '';
  }
};

/**
 * Creates auto-save configuration
 */
export const createAutoSaveConfig = (enabled: boolean, interval?: number) => ({
  enabled,
  interval: interval || 30000,
});

// ============================================================================
// Field Configuration Map
// ============================================================================

export const ENTITY_FIELD_BUILDERS = {
  course: createCourseFields,
  level: createLevelFields,
  section: createSectionFields,
  module: createModuleFields,
  lesson: createLessonFields,
  exercise: createExerciseFields,
} as const;

/**
 * Gets field configurations for an entity type
 */
export const getEntityFields = (entityType: string, isEditing: boolean = false): FormFieldConfig[] => {
  const builder = ENTITY_FIELD_BUILDERS[entityType as keyof typeof ENTITY_FIELD_BUILDERS];
  if (!builder) {
    throw new Error(`Unknown entity type: ${entityType}`);
  }
  
  // Pass isEditing parameter for entities that need it (like course)
  return entityType === 'course' ? builder(isEditing) : builder();
};

export default {
  createIdField,
  createNameField,
  createOrderField,
  createDescriptionField,
  createLanguageField,
  createModuleTypeField,
  createExerciseTypeField,
  createCheckboxField,
  createCourseFields,
  createLevelFields,
  createSectionFields,
  createModuleFields,
  createLessonFields,
  createExerciseFields,
  createInitialValues,
  validateLanguageDifference,
  generateIdFromName,
  validateIdFormat,
  validateLevelCodeFormat,
  getParentIdField,
  createAutoSaveConfig,
  getEntityFields,
};