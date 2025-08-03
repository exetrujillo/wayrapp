/**
 * Form Constants and Shared Configurations
 * 
 * This module centralizes all shared constants, options, and configurations
 * used across different forms to eliminate duplication and ensure consistency.
 * 
 * @module FormConstants
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { LANGUAGES, getLanguageDisplayName } from '../../utils/languages';

// ============================================================================
// Language Options
// ============================================================================

/**
 * Language options for form dropdowns
 * Generated from the comprehensive LANGUAGES list for consistency
 */
export const LANGUAGE_OPTIONS = LANGUAGES.map(language => ({
  value: language.code,
  label: getLanguageDisplayName(language),
}));

// ============================================================================
// Module Type Options
// ============================================================================

export const MODULE_TYPE_OPTIONS = [
  { value: 'informative', label: 'Informative' },
  { value: 'basic_lesson', label: 'Basic Lesson' },
  { value: 'reading', label: 'Reading' },
  { value: 'dialogue', label: 'Dialogue' },
  { value: 'exam', label: 'Exam' },
] as const;

// ============================================================================
// Exercise Type Options
// ============================================================================

export const EXERCISE_TYPE_OPTIONS = [
  { value: 'translation', label: 'Translation' },
  { value: 'fill-in-the-blank', label: 'Fill in the Blank' },
  { value: 'vof', label: 'True/False' },
  { value: 'pairs', label: 'Matching Pairs' },
  { value: 'informative', label: 'Informative' },
  { value: 'ordering', label: 'Ordering' },
] as const;

// ============================================================================
// Common Field Constraints
// ============================================================================

export const FIELD_CONSTRAINTS = {
  // ID fields
  COURSE_ID_MAX_LENGTH: 20,
  SECTION_ID_MAX_LENGTH: 40,
  MODULE_ID_MAX_LENGTH: 50,
  LESSON_ID_MAX_LENGTH: 60,
  EXERCISE_ID_MAX_LENGTH: 15,

  // Name fields
  COURSE_NAME_MAX_LENGTH: 100,
  LEVEL_NAME_MAX_LENGTH: 100,
  SECTION_NAME_MAX_LENGTH: 150,
  MODULE_NAME_MAX_LENGTH: 150,
  LESSON_NAME_MAX_LENGTH: 150,

  // Description fields
  COURSE_DESCRIPTION_MAX_LENGTH: 255,
  LEVEL_DESCRIPTION_MAX_LENGTH: 255,

  // Order fields
  ORDER_MIN: 0,
  ORDER_MAX: 999,
  ORDER_STEP: 1,

  // Level specific
  LEVEL_CODE_MAX_LENGTH: 10,
  LEVEL_ORDER_MIN: 1,

  // Lesson specific
  EXPERIENCE_POINTS_MIN: 1,
  EXPERIENCE_POINTS_MAX: 1000,

  // Exercise specific
  EXERCISE_TEXT_MAX_LENGTH: 1000,
  HINT_MAX_LENGTH: 200,
} as const;

// ============================================================================
// Common Field Props
// ============================================================================

export const COMMON_FIELD_PROPS = {
  // ID field props
  ID_FIELD: {
    pattern: '^[a-z0-9-]+$',
    style: { textTransform: 'lowercase' as const },
  },

  // Level code props
  LEVEL_CODE: {
    style: { textTransform: 'uppercase' as const },
  },

  // Order field props
  ORDER_FIELD: {
    min: FIELD_CONSTRAINTS.ORDER_MIN,
    max: FIELD_CONSTRAINTS.ORDER_MAX,
    step: FIELD_CONSTRAINTS.ORDER_STEP,
  },

  // Level order props
  LEVEL_ORDER_FIELD: {
    min: FIELD_CONSTRAINTS.LEVEL_ORDER_MIN,
    max: FIELD_CONSTRAINTS.ORDER_MAX,
    step: FIELD_CONSTRAINTS.ORDER_STEP,
  },

  // Experience points props
  EXPERIENCE_POINTS_FIELD: {
    min: FIELD_CONSTRAINTS.EXPERIENCE_POINTS_MIN,
    max: FIELD_CONSTRAINTS.EXPERIENCE_POINTS_MAX,
    step: 1,
  },
} as const;

// ============================================================================
// Auto-save Configurations
// ============================================================================

export const AUTO_SAVE_CONFIG = {
  DEFAULT_INTERVAL: 30000, // 30 seconds
  QUICK_INTERVAL: 15000,   // 15 seconds
  SLOW_INTERVAL: 60000,    // 60 seconds
} as const;

// ============================================================================
// Form Layout Constants
// ============================================================================

export const FORM_LAYOUT = {
  GRID_COLS_1: 1,
  GRID_COLS_2: 2,
  GRID_COLS_12: 12,
  
  SPAN_HALF: 6,
  SPAN_FULL: 12,
  
  TEXTAREA_ROWS_SMALL: 3,
  TEXTAREA_ROWS_MEDIUM: 4,
  TEXTAREA_ROWS_LARGE: 8,
} as const;

// ============================================================================
// Exercise Type Descriptions
// ============================================================================

export const EXERCISE_TYPE_DESCRIPTIONS = {
  translation: 'Students translate text from source language to target language.',
  'fill-in-the-blank': 'Students fill in missing words or phrases in a sentence or paragraph.',
  vof: 'Students determine whether a statement is true or false.',
  pairs: 'Students match items from two columns or groups.',
  ordering: 'Students arrange items in the correct sequence or order.',
  informative: 'Informational content with optional media (images, videos, audio).',
} as const;

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_VALUES = {
  // Course defaults
  COURSE: {
    sourceLanguage: 'en',
    targetLanguage: 'es',
    isPublic: false,
  },

  // Level defaults
  LEVEL: {
    order: 1,
  },

  // Section defaults
  SECTION: {
    order: 1,
  },

  // Module defaults
  MODULE: {
    moduleType: 'basic_lesson',
    order: 0,
  },

  // Lesson defaults
  LESSON: {
    experiencePoints: 10,
    order: 0,
  },

  // Exercise defaults
  EXERCISE: {
    exerciseType: 'translation',
  },
} as const;

// ============================================================================
// Validation Patterns
// ============================================================================

export const VALIDATION_PATTERNS = {
  ID_PATTERN: /^[a-z0-9-]+$/,
  LEVEL_CODE_PATTERN: /^[A-Z0-9]+$/,
  EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL_PATTERN: /^https?:\/\/.+/,
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get language option by value
 */
export const getLanguageOption = (value: string) => {
  return LANGUAGE_OPTIONS.find(option => option.value === value);
};

/**
 * Get module type option by value
 */
export const getModuleTypeOption = (value: string) => {
  return MODULE_TYPE_OPTIONS.find(option => option.value === value);
};

/**
 * Get exercise type option by value
 */
export const getExerciseTypeOption = (value: string) => {
  return EXERCISE_TYPE_OPTIONS.find(option => option.value === value);
};

/**
 * Get exercise type description
 */
export const getExerciseTypeDescription = (type: string): string => {
  return EXERCISE_TYPE_DESCRIPTIONS[type as keyof typeof EXERCISE_TYPE_DESCRIPTIONS] || 
         'Select an exercise type to see its description.';
};

export default {
  LANGUAGE_OPTIONS,
  MODULE_TYPE_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  FIELD_CONSTRAINTS,
  COMMON_FIELD_PROPS,
  AUTO_SAVE_CONFIG,
  FORM_LAYOUT,
  EXERCISE_TYPE_DESCRIPTIONS,
  DEFAULT_VALUES,
  VALIDATION_PATTERNS,
  getLanguageOption,
  getModuleTypeOption,
  getExerciseTypeOption,
  getExerciseTypeDescription,
};