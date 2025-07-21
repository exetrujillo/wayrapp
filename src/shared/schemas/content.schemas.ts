import { z } from 'zod';
import {
  LanguageCodeSchema,
  OrderSchema,
  ModuleTypeSchema,
  ExperiencePointsSchema,
  TextFieldSchema,
  OptionalTextFieldSchema,
  JsonSchema,
  BooleanStringSchema,
} from './common';

/**
 * Content validation schemas
 */

// Course schema
export const CourseSchema = z
  .object({
    id: z
      .string()
      .max(20, 'Course ID cannot exceed 20 characters')
      .regex(
        /^[a-z0-9-]+$/,
        'Course ID can only contain lowercase letters, numbers, and hyphens'
      ),
    source_language: LanguageCodeSchema,
    target_language: LanguageCodeSchema,
    name: TextFieldSchema(1, 100),
    description: OptionalTextFieldSchema(1000),
    is_public: z.boolean().default(true),
  })
  .refine((data) => data.source_language !== data.target_language, {
    message: 'Source and target languages must be different',
    path: ['target_language'],
  });

// Level schema
export const LevelSchema = z.object({
  id: z
    .string()
    .max(30, 'Level ID cannot exceed 30 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Level ID can only contain lowercase letters, numbers, and hyphens'
    ),
  code: TextFieldSchema(1, 10),
  name: TextFieldSchema(1, 100),
  order: OrderSchema,
});

// Section schema
export const SectionSchema = z.object({
  id: z
    .string()
    .max(40, 'Section ID cannot exceed 40 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Section ID can only contain lowercase letters, numbers, and hyphens'
    ),
  name: TextFieldSchema(1, 150),
  order: OrderSchema,
});

// Module schema
export const ModuleSchema = z.object({
  id: z
    .string()
    .max(50, 'Module ID cannot exceed 50 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Module ID can only contain lowercase letters, numbers, and hyphens'
    ),
  module_type: ModuleTypeSchema,
  name: TextFieldSchema(1, 150),
  order: OrderSchema,
});

// Lesson schema
export const LessonSchema = z.object({
  id: z
    .string()
    .max(60, 'Lesson ID cannot exceed 60 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Lesson ID can only contain lowercase letters, numbers, and hyphens'
    ),
  experience_points: ExperiencePointsSchema.default(10),
  order: OrderSchema,
});

// Exercise schema
export const ExerciseSchema = z.object({
  id: z
    .string()
    .max(15, 'Exercise ID cannot exceed 15 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Exercise ID can only contain lowercase letters, numbers, and hyphens'
    ),
  exercise_type: z.enum([
    'translation',
    'fill-in-the-blank',
    'vof',
    'pairs',
    'informative',
    'ordering',
  ]),
  data: JsonSchema,
});

// Lesson-Exercise assignment schema
export const LessonExerciseSchema = z.object({
  exercise_id: z.string().min(1, 'Exercise ID is required'),
  order: OrderSchema,
});

// Exercise reordering schema
export const ExerciseReorderSchema = z.object({
  exercise_ids: z
    .array(z.string().min(1, 'Exercise ID is required'))
    .min(1, 'At least one exercise ID is required'),
});

// Content query parameters
export const ContentQuerySchema = z
  .object({
    // Include base pagination fields
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20)),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
    // Add content-specific fields
    is_public: BooleanStringSchema,
    search: z.string().optional(),
    source_language: z.string().optional(),
    target_language: z.string().optional(),
  })
  .refine(
    (data) => {
      return data.page >= 1 && data.limit >= 1 && data.limit <= 100;
    },
    {
      message: 'Page must be >= 1 and limit must be between 1 and 100',
    }
  );

// Export types
export type CourseRequest = z.infer<typeof CourseSchema>;
export type LevelRequest = z.infer<typeof LevelSchema>;
export type SectionRequest = z.infer<typeof SectionSchema>;
export type ModuleRequest = z.infer<typeof ModuleSchema>;
export type LessonRequest = z.infer<typeof LessonSchema>;
export type ExerciseRequest = z.infer<typeof ExerciseSchema>;
export type LessonExerciseRequest = z.infer<typeof LessonExerciseSchema>;
export type ExerciseReorderRequest = z.infer<typeof ExerciseReorderSchema>;
export type ContentQueryParams = z.infer<typeof ContentQuerySchema>;