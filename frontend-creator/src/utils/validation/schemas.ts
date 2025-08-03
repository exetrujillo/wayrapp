/**
 * Comprehensive Zod Validation Schemas
 * 
 * This module provides comprehensive Zod schemas for all entity types with
 * real-time validation, cross-field validation rules, and helpful error messages.
 * 
 * @module ValidationSchemas
 * @category Validation
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { z } from 'zod';
import { FIELD_CONSTRAINTS, VALIDATION_PATTERNS } from '../../components/forms/FormConstants';

// ============================================================================
// Base Schemas and Utilities
// ============================================================================

/**
 * Schema for optional description field
 */
const descriptionSchema = z.string()
    .max(FIELD_CONSTRAINTS.COURSE_DESCRIPTION_MAX_LENGTH, 'Description is too long')
    .optional()
    .or(z.literal(''));

// ============================================================================
// Course Schema
// ============================================================================

/**
 * Base course schema without refinements
 */
const baseCourseSchema = z.object({
    id: z.string()
        .min(1, 'Course ID is required')
        .max(FIELD_CONSTRAINTS.COURSE_ID_MAX_LENGTH, `Course ID must be ${FIELD_CONSTRAINTS.COURSE_ID_MAX_LENGTH} characters or less`)
        .regex(VALIDATION_PATTERNS.ID_PATTERN, 'Course ID can only contain lowercase letters, numbers, and hyphens')
        .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Course ID cannot start or end with a hyphen'),

    name: z.string()
        .min(1, 'Course name is required')
        .max(FIELD_CONSTRAINTS.COURSE_NAME_MAX_LENGTH, `Course name must be ${FIELD_CONSTRAINTS.COURSE_NAME_MAX_LENGTH} characters or less`)
        .refine(val => val.trim().length > 0, 'Course name cannot be just whitespace'),

    sourceLanguage: z.string()
        .min(2, 'Please select a source language')
        .max(20, 'Source language code is too long'),

    targetLanguage: z.string()
        .min(2, 'Please select a target language')
        .max(20, 'Target language code is too long'),

    description: descriptionSchema,

    isPublic: z.boolean()
        .default(false),

    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

/**
 * Course validation schema with cross-field validation
 */
export const courseSchema = baseCourseSchema.refine(
    data => data.sourceLanguage !== data.targetLanguage,
    {
        message: 'Target language must be different from source language',
        path: ['targetLanguage'],
    }
);

// ============================================================================
// Level Schema
// ============================================================================

/**
 * Base level schema for form validation (without id and courseId for create mode)
 */
const baseLevelFormSchema = z.object({
    code: z.string()
        .min(1, 'Level code is required')
        .max(FIELD_CONSTRAINTS.LEVEL_CODE_MAX_LENGTH, `Level code must be ${FIELD_CONSTRAINTS.LEVEL_CODE_MAX_LENGTH} characters or less`)
        .regex(VALIDATION_PATTERNS.LEVEL_CODE_PATTERN, 'Level code can only contain uppercase letters and numbers'),

    name: z.string()
        .min(1, 'Level name is required')
        .max(FIELD_CONSTRAINTS.LEVEL_NAME_MAX_LENGTH, `Level name must be ${FIELD_CONSTRAINTS.LEVEL_NAME_MAX_LENGTH} characters or less`)
        .refine(val => val.trim().length > 0, 'Level name cannot be just whitespace'),

    order: z.number()
        .min(FIELD_CONSTRAINTS.LEVEL_ORDER_MIN, `Order must be at least ${FIELD_CONSTRAINTS.LEVEL_ORDER_MIN}`)
        .max(FIELD_CONSTRAINTS.ORDER_MAX, `Order cannot exceed ${FIELD_CONSTRAINTS.ORDER_MAX}`)
        .int('Order must be a whole number'),
});

/**
 * Complete level schema with all required fields
 */
export const levelSchema = baseLevelFormSchema.extend({
    id: z.string()
        .min(1, 'Level ID is required')
        .max(30, 'Level ID must be 30 characters or less')
        .regex(VALIDATION_PATTERNS.ID_PATTERN, 'Level ID can only contain lowercase letters, numbers, and hyphens')
        .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Level ID cannot start or end with a hyphen'),

    courseId: z.string()
        .min(1, 'Course ID is required'),

    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

/**
 * Level form schema for create mode (without id and courseId)
 */
export const levelFormSchema = baseLevelFormSchema;

// ============================================================================
// Section Schema
// ============================================================================

/**
 * Section validation schema
 */
export const sectionSchema = z.object({
    id: z.string()
        .min(1, 'Section ID is required')
        .max(FIELD_CONSTRAINTS.SECTION_ID_MAX_LENGTH, `Section ID must be ${FIELD_CONSTRAINTS.SECTION_ID_MAX_LENGTH} characters or less`)
        .regex(VALIDATION_PATTERNS.ID_PATTERN, 'Section ID can only contain lowercase letters, numbers, and hyphens')
        .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Section ID cannot start or end with a hyphen'),

    levelId: z.string()
        .min(1, 'Level ID is required'),

    name: z.string()
        .min(1, 'Section name is required')
        .max(FIELD_CONSTRAINTS.SECTION_NAME_MAX_LENGTH, `Section name must be ${FIELD_CONSTRAINTS.SECTION_NAME_MAX_LENGTH} characters or less`)
        .refine(val => val.trim().length > 0, 'Section name cannot be just whitespace'),

    order: z.number()
        .min(FIELD_CONSTRAINTS.ORDER_MIN, `Order must be at least ${FIELD_CONSTRAINTS.ORDER_MIN}`)
        .max(FIELD_CONSTRAINTS.ORDER_MAX, `Order cannot exceed ${FIELD_CONSTRAINTS.ORDER_MAX}`)
        .int('Order must be a whole number'),

    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

// ============================================================================
// Module Schema
// ============================================================================

/**
 * Module validation schema with type-specific validation
 */
export const moduleSchema = z.object({
    id: z.string()
        .min(1, 'Module ID is required')
        .max(FIELD_CONSTRAINTS.MODULE_ID_MAX_LENGTH, `Module ID must be ${FIELD_CONSTRAINTS.MODULE_ID_MAX_LENGTH} characters or less`)
        .regex(VALIDATION_PATTERNS.ID_PATTERN, 'Module ID can only contain lowercase letters, numbers, and hyphens')
        .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Module ID cannot start or end with a hyphen'),

    sectionId: z.string()
        .min(1, 'Section ID is required'),

    name: z.string()
        .min(1, 'Module name is required')
        .max(FIELD_CONSTRAINTS.MODULE_NAME_MAX_LENGTH, `Module name must be ${FIELD_CONSTRAINTS.MODULE_NAME_MAX_LENGTH} characters or less`)
        .refine(val => val.trim().length > 0, 'Module name cannot be just whitespace'),

    moduleType: z.enum(['informative', 'basic_lesson', 'reading', 'dialogue', 'exam'], {
        errorMap: () => ({ message: 'Please select a valid module type' }),
    }),

    order: z.number()
        .min(FIELD_CONSTRAINTS.ORDER_MIN, `Order must be at least ${FIELD_CONSTRAINTS.ORDER_MIN}`)
        .max(FIELD_CONSTRAINTS.ORDER_MAX, `Order cannot exceed ${FIELD_CONSTRAINTS.ORDER_MAX}`)
        .int('Order must be a whole number'),

    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

// ============================================================================
// Lesson Schema
// ============================================================================

/**
 * Lesson validation schema with experience points validation
 */
export const lessonSchema = z.object({
    id: z.string()
        .min(1, 'Lesson ID is required')
        .max(FIELD_CONSTRAINTS.LESSON_ID_MAX_LENGTH, `Lesson ID must be ${FIELD_CONSTRAINTS.LESSON_ID_MAX_LENGTH} characters or less`)
        .regex(VALIDATION_PATTERNS.ID_PATTERN, 'Lesson ID can only contain lowercase letters, numbers, and hyphens')
        .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Lesson ID cannot start or end with a hyphen'),

    moduleId: z.string()
        .min(1, 'Module ID is required'),

    name: z.string()
        .min(1, 'Lesson name is required')
        .max(FIELD_CONSTRAINTS.LESSON_NAME_MAX_LENGTH, `Lesson name must be ${FIELD_CONSTRAINTS.LESSON_NAME_MAX_LENGTH} characters or less`)
        .refine(val => val.trim().length > 0, 'Lesson name cannot be just whitespace'),

    description: z.string()
        .max(FIELD_CONSTRAINTS.COURSE_DESCRIPTION_MAX_LENGTH, 'Description is too long')
        .optional()
        .or(z.literal('')),

    experiencePoints: z.number()
        .min(FIELD_CONSTRAINTS.EXPERIENCE_POINTS_MIN, `Experience points must be at least ${FIELD_CONSTRAINTS.EXPERIENCE_POINTS_MIN}`)
        .max(FIELD_CONSTRAINTS.EXPERIENCE_POINTS_MAX, `Experience points cannot exceed ${FIELD_CONSTRAINTS.EXPERIENCE_POINTS_MAX}`)
        .int('Experience points must be a whole number'),

    order: z.number()
        .min(FIELD_CONSTRAINTS.ORDER_MIN, `Order must be at least ${FIELD_CONSTRAINTS.ORDER_MIN}`)
        .max(FIELD_CONSTRAINTS.ORDER_MAX, `Order cannot exceed ${FIELD_CONSTRAINTS.ORDER_MAX}`)
        .int('Order must be a whole number'),

    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

// ============================================================================
// Exercise Schemas
// ============================================================================

/**
 * Base exercise data schemas for different types
 */
const translationExerciseDataSchema = z.object({
    sourceText: z.string()
        .min(1, 'Source text is required')
        .max(FIELD_CONSTRAINTS.EXERCISE_TEXT_MAX_LENGTH, 'Source text is too long'),

    targetText: z.string()
        .min(1, 'Target text is required')
        .max(FIELD_CONSTRAINTS.EXERCISE_TEXT_MAX_LENGTH, 'Target text is too long'),

    hints: z.array(z.string().max(FIELD_CONSTRAINTS.HINT_MAX_LENGTH, 'Hint is too long')).optional(),
});

const fillInTheBlankExerciseDataSchema = z.object({
    text: z.string()
        .min(1, 'Exercise text is required')
        .max(FIELD_CONSTRAINTS.EXERCISE_TEXT_MAX_LENGTH, 'Exercise text is too long'),

    blanks: z.array(z.object({
        position: z.number().min(0, 'Position must be non-negative'),
        correctAnswer: z.string().min(1, 'Correct answer is required'),
        alternatives: z.array(z.string()).optional(),
    })).min(1, 'At least one blank is required'),
});

const vofExerciseDataSchema = z.object({
    statement: z.string()
        .min(1, 'Statement is required')
        .max(FIELD_CONSTRAINTS.EXERCISE_TEXT_MAX_LENGTH, 'Statement is too long'),

    isTrue: z.boolean(),

    explanation: z.string()
        .max(FIELD_CONSTRAINTS.EXERCISE_TEXT_MAX_LENGTH, 'Explanation is too long')
        .optional(),
});

const pairsExerciseDataSchema = z.object({
    pairs: z.array(z.object({
        left: z.string().min(1, 'Left item is required'),
        right: z.string().min(1, 'Right item is required'),
    })).min(2, 'At least two pairs are required'),
});

const informativeExerciseDataSchema = z.object({
    title: z.string()
        .min(1, 'Title is required')
        .max(200, 'Title is too long'),

    content: z.string()
        .min(1, 'Content is required')
        .max(FIELD_CONSTRAINTS.EXERCISE_TEXT_MAX_LENGTH, 'Content is too long'),

    media: z.array(z.object({
        type: z.enum(['image', 'video', 'audio']),
        url: z.string().url('Invalid media URL'),
        caption: z.string().optional(),
    })).optional(),
});

const orderingExerciseDataSchema = z.object({
    items: z.array(z.object({
        id: z.string(),
        text: z.string().min(1, 'Item text is required'),
        order: z.number().min(0, 'Order must be non-negative'),
    })).min(2, 'At least two items are required'),

    correctOrder: z.array(z.number()).min(2, 'Correct order must be specified'),
});

/**
 * Base exercise schema without refinements
 */
const baseExerciseSchema = z.object({
    id: z.string()
        .min(1, 'Exercise ID is required')
        .max(FIELD_CONSTRAINTS.EXERCISE_ID_MAX_LENGTH, `Exercise ID must be ${FIELD_CONSTRAINTS.EXERCISE_ID_MAX_LENGTH} characters or less`)
        .regex(VALIDATION_PATTERNS.ID_PATTERN, 'Exercise ID can only contain lowercase letters, numbers, and hyphens')
        .refine(val => !val.startsWith('-') && !val.endsWith('-'), 'Exercise ID cannot start or end with a hyphen'),

    exerciseType: z.enum(['translation', 'fill-in-the-blank', 'vof', 'pairs', 'informative', 'ordering'], {
        errorMap: () => ({ message: 'Please select a valid exercise type' }),
    }),

    data: z.union([
        translationExerciseDataSchema,
        fillInTheBlankExerciseDataSchema,
        vofExerciseDataSchema,
        pairsExerciseDataSchema,
        informativeExerciseDataSchema,
        orderingExerciseDataSchema,
    ]),

    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
});

/**
 * Exercise validation schema with type-specific data validation
 */
export const exerciseSchema = baseExerciseSchema.refine(
    (data) => {
        // Type-specific data validation
        switch (data.exerciseType) {
            case 'translation':
                return translationExerciseDataSchema.safeParse(data.data).success;
            case 'fill-in-the-blank':
                return fillInTheBlankExerciseDataSchema.safeParse(data.data).success;
            case 'vof':
                return vofExerciseDataSchema.safeParse(data.data).success;
            case 'pairs':
                return pairsExerciseDataSchema.safeParse(data.data).success;
            case 'informative':
                return informativeExerciseDataSchema.safeParse(data.data).success;
            case 'ordering':
                return orderingExerciseDataSchema.safeParse(data.data).success;
            default:
                return false;
        }
    },
    {
        message: 'Exercise data does not match the selected exercise type',
        path: ['data'],
    }
);

// ============================================================================
// Schema Map and Utilities
// ============================================================================

/**
 * Map of entity types to their base schemas (without refinements)
 */
export const BASE_ENTITY_SCHEMAS = {
    course: baseCourseSchema,
    level: levelSchema,
    section: sectionSchema,
    module: moduleSchema,
    lesson: lessonSchema,
    exercise: baseExerciseSchema,
} as const;

/**
 * Map of entity types to their validation schemas (with refinements)
 */
export const ENTITY_SCHEMAS = {
    course: courseSchema,
    level: levelSchema,
    section: sectionSchema,
    module: moduleSchema,
    lesson: lessonSchema,
    exercise: exerciseSchema,
} as const;

/**
 * Map of entity types to their form schemas (for create mode)
 */
export const FORM_SCHEMAS = {
    course: courseSchema, // Course form schema is the same as full schema
    level: levelFormSchema, // Level form schema excludes id and courseId
    section: sectionSchema, // TODO: Create form schema if needed
    module: moduleSchema, // TODO: Create form schema if needed
    lesson: lessonSchema, // TODO: Create form schema if needed
    exercise: exerciseSchema, // TODO: Create form schema if needed
} as const;

/**
 * Get validation schema for an entity type
 */
export const getEntitySchema = (entityType: string, mode?: 'create' | 'edit') => {
    // For create mode, use form schemas that may exclude certain fields
    if (mode === 'create') {
        const formSchema = FORM_SCHEMAS[entityType as keyof typeof FORM_SCHEMAS];
        if (formSchema) {
            return formSchema;
        }
    }
    
    // Default to full validation schema
    const schema = ENTITY_SCHEMAS[entityType as keyof typeof ENTITY_SCHEMAS];
    if (!schema) {
        throw new Error(`Unknown entity type: ${entityType}`);
    }
    return schema;
};

/**
 * Validate entity data with appropriate schema
 */
export const validateEntityData = async (entityType: string, data: any) => {
    const schema = getEntitySchema(entityType);
    return schema.safeParseAsync(data);
};

/**
 * Get base schema for an entity type (without refinements)
 */
export const getBaseEntitySchema = (entityType: string) => {
    const schema = BASE_ENTITY_SCHEMAS[entityType as keyof typeof BASE_ENTITY_SCHEMAS];
    if (!schema) {
        throw new Error(`Unknown entity type: ${entityType}`);
    }
    return schema;
};

/**
 * Get field-level validation for a specific field
 */
export const getFieldValidation = (entityType: string, fieldName: string) => {
    const baseSchema = getBaseEntitySchema(entityType);
    
    if ('shape' in baseSchema) {
        return (baseSchema as any).shape[fieldName];
    }
    
    return undefined;
};

/**
 * Create partial schema for form validation (allows incomplete data during editing)
 */
export const createPartialSchema = (entityType: string) => {
    const baseSchema = getBaseEntitySchema(entityType);
    
    if ('partial' in baseSchema && typeof baseSchema.partial === 'function') {
        return (baseSchema as any).partial();
    }
    
    // Fallback: return the original schema if partial is not available
    return baseSchema;
};

/**
 * Reusable validation utilities
 */
export const validationUtils = {
    /**
     * Check if ID is unique (would need API call in real implementation)
     */
    isIdUnique: async (): Promise<boolean> => {
        // This would make an API call to check uniqueness
        // For now, return true as placeholder
        return true;
    },

    /**
     * Validate cross-field dependencies
     */
    validateCrossFields: (data: any, rules: Array<{ fields: string[]; validator: (values: any[]) => boolean; message: string }>) => {
        const errors: Array<{ field: string; message: string }> = [];

        rules.forEach(rule => {
            const values = rule.fields.map(field => data[field]);
            if (!rule.validator(values)) {
                errors.push({ field: rule.fields[0], message: rule.message });
            }
        });

        return errors;
    },

    /**
     * Generate helpful error messages with suggestions
     */
    enhanceErrorMessage: (error: string, fieldName: string, value: any): string => {
        // Add contextual suggestions based on common errors
        if (error.includes('required')) {
            return `${error}. Please provide a ${fieldName}.`;
        }
        if (error.includes('too long')) {
            return `${error}. Current length: ${value?.length || 0} characters.`;
        }
        if (error.includes('invalid')) {
            return `${error}. Please check the format and try again.`;
        }
        return error;
    },
};

export default {
    courseSchema,
    levelSchema,
    levelFormSchema,
    sectionSchema,
    moduleSchema,
    lessonSchema,
    exerciseSchema,
    BASE_ENTITY_SCHEMAS,
    ENTITY_SCHEMAS,
    FORM_SCHEMAS,
    getEntitySchema,
    getBaseEntitySchema,
    validateEntityData,
    getFieldValidation,
    createPartialSchema,
    validationUtils,
};