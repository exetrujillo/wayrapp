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

// Lesson creation schema
export const lessonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Lesson name must be at least 3 characters'),
  experience_points: z.number().int().positive().default(10),
  order: z.number().int().nonnegative(),
  moduleId: z.string().min(1, 'Module ID is required'),
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
export type LessonFormData = z.infer<typeof lessonSchema>;
export type ExerciseFormData = z.infer<typeof exerciseSchema>;
export type ExerciseAssignmentFormData = z.infer<typeof exerciseAssignmentSchema>;