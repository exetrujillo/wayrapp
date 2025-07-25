import { z } from 'zod';
import { LANGUAGES } from './constants';

// Helper to check if a language code is valid BCP 47
const isValidBCP47 = (code: string) => {
  // Simple validation for now - check if it's in our list or matches a basic pattern
  return LANGUAGES.some(lang => lang.code === code) || 
         /^[a-z]{2,3}(-[A-Z]{2})?$/.test(code);
};

// Login form schema
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

// Course creation schema
export const courseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Course name must be at least 3 characters'),
  sourceLanguage: z.string().refine(isValidBCP47, {
    message: 'Please enter a valid BCP 47 language code',
  }),
  targetLanguage: z.string().refine(isValidBCP47, {
    message: 'Please enter a valid BCP 47 language code',
  }),
  description: z.string().optional(),
  isPublic: z.boolean(),
});

// Level creation schema
export const levelSchema = z.object({
  code: z.string().min(1, 'Level code is required').max(10, 'Level code must be 10 characters or less'),
  name: z.string().min(3, 'Level name must be at least 3 characters').max(100, 'Level name must be 100 characters or less'),
  order: z.number().int().nonnegative('Order must be a non-negative number'),
});

// Section creation schema
export const sectionSchema = z.object({
  name: z.string().min(3, 'Section name must be at least 3 characters').max(150, 'Section name must be 150 characters or less'),
  order: z.number().int().nonnegative('Order must be a non-negative number'),
});

// Module creation schema
export const moduleSchema = z.object({
  moduleType: z.enum(['informative', 'basic_lesson', 'reading', 'dialogue', 'exam'], {
    errorMap: () => ({ message: 'Please select a valid module type' }),
  }),
  name: z.string().min(3, 'Module name must be at least 3 characters').max(150, 'Module name must be 150 characters or less'),
  order: z.number().int().nonnegative('Order must be a non-negative number'),
});

// Lesson creation schema (updated to match Prisma schema - no name field)
export const lessonSchema = z.object({
  experiencePoints: z.number().int().positive('Experience points must be a positive number'),
  order: z.number().int().nonnegative('Order must be a non-negative number'),
});

// Exercise creation schema
export const exerciseSchema = z.object({
  id: z.string().optional(),
  exerciseType: z.enum([
    'translation',
    'fill-in-the-blank',
    'vof',
    'pairs',
    'informative',
    'ordering'
  ]),
  data: z.record(z.unknown()),
});

// Exercise assignment schema
export const exerciseAssignmentSchema = z.object({
  lessonId: z.string().min(1, 'Lesson ID is required'),
  exercise_id: z.string().min(1, 'Exercise ID is required'),
  order: z.number().int().nonnegative(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type CourseFormData = z.infer<typeof courseSchema>;
export type LevelFormData = z.infer<typeof levelSchema>;
export type SectionFormData = z.infer<typeof sectionSchema>;
export type ModuleFormData = z.infer<typeof moduleSchema>;
export type LessonFormData = z.infer<typeof lessonSchema>;
export type ExerciseFormData = z.infer<typeof exerciseSchema>;
export type ExerciseAssignmentFormData = z.infer<typeof exerciseAssignmentSchema>;