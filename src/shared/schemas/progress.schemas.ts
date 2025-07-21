import { z } from 'zod';
import { 
  ExperiencePointsSchema,
  ScoreSchema,
  TimeSecondsSchema
} from './common';

/**
 * Progress validation schemas
 */

// Lesson completion schema
export const LessonCompletionSchema = z.object({
  lesson_id: z.string().min(1, 'Lesson ID is required'),
  completed_at: z.string().datetime({ offset: true }),
  score: ScoreSchema.optional(),
  time_spent_seconds: TimeSecondsSchema.optional()
});

// Progress sync schema for offline progress
export const ProgressSyncSchema = z.object({
  completions: z.array(LessonCompletionSchema)
    .min(1, 'At least one lesson completion is required'),
  experience_gained: ExperiencePointsSchema.optional(),
  last_activity: z.string().datetime({ offset: true }).optional()
});

// Progress query parameters
export const ProgressQuerySchema = z.object({
  // Include base pagination fields
  page: z.string().optional().transform((val) => val ? parseInt(val, 10) : 1),
  limit: z.string().optional().transform((val) => val ? parseInt(val, 10) : 20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  // Add progress-specific fields
  from_date: z.string().datetime({ offset: true }).optional(),
  to_date: z.string().datetime({ offset: true }).optional(),
  min_score: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  max_score: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined)
}).refine((data) => {
  return data.page >= 1 && data.limit >= 1 && data.limit <= 100;
}, {
  message: 'Page must be >= 1 and limit must be between 1 and 100'
});

// Export types
export type LessonCompletionRequest = z.infer<typeof LessonCompletionSchema>;
export type ProgressSyncRequest = z.infer<typeof ProgressSyncSchema>;
export type ProgressQueryParams = z.infer<typeof ProgressQuerySchema>;