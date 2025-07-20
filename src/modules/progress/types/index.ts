import { z } from "zod";
import {
  ScoreSchema,
  TimeSecondsSchema,
  ExperiencePointsSchema,
} from "@/shared/schemas";

// Progress module types and interfaces

export interface UserProgress {
  user_id: string;
  experience_points: number;
  lives_current: number;
  streak_current: number;
  last_completed_lesson_id?: string;
  last_activity_date: Date;
  updated_at: Date;
}

export interface LessonCompletion {
  user_id: string;
  lesson_id: string;
  completed_at: Date;
  score?: number;
  time_spent_seconds?: number;
}

export interface UpdateProgressDto {
  lesson_id: string;
  score?: number | undefined;
  time_spent_seconds?: number | undefined;
}

export interface OfflineProgressSync {
  completions: Array<{
    lesson_id: string;
    completed_at: string;
    score?: number | undefined;
    time_spent_seconds?: number | undefined;
  }>;
  last_sync_timestamp: string;
}

export interface ProgressSummary {
  user_id: string;
  experience_points: number;
  lives_current: number;
  streak_current: number;
  lessons_completed: number;
  courses_started: number;
  courses_completed: number;
  last_activity_date: Date;
}

export interface CreateUserProgressDto {
  user_id: string;
  experience_points?: number;
  lives_current?: number;
  streak_current?: number;
  last_completed_lesson_id?: string;
}

export interface UpdateUserProgressDto {
  experience_points?: number | undefined;
  lives_current?: number | undefined;
  streak_current?: number | undefined;
  last_completed_lesson_id?: string | undefined;
}

export interface CreateLessonCompletionDto {
  user_id: string;
  lesson_id: string;
  score?: number | undefined;
  time_spent_seconds?: number | undefined;
  completed_at?: string | Date | undefined;
}

// Validation Schemas

export const UpdateProgressSchema = z.object({
  lesson_id: z
    .string()
    .min(1, "Lesson ID is required")
    .max(60, "Lesson ID too long"),
  score: ScoreSchema.optional(),
  time_spent_seconds: TimeSecondsSchema.optional(),
});

export const OfflineProgressSyncSchema = z.object({
  completions: z.array(
    z.object({
      lesson_id: z
        .string()
        .min(1, "Lesson ID is required")
        .max(60, "Lesson ID too long"),
      completed_at: z.string().datetime("Invalid datetime format"),
      score: ScoreSchema.optional(),
      time_spent_seconds: TimeSecondsSchema.optional(),
    }),
  ),
  last_sync_timestamp: z.string().datetime("Invalid datetime format"),
});

export const CreateUserProgressSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
  experience_points: ExperiencePointsSchema.optional(),
  lives_current: z.number().int().min(0).max(10).optional(),
  streak_current: z.number().int().min(0).optional(),
  last_completed_lesson_id: z.string().max(60).optional(),
});

export const UpdateUserProgressSchema = z.object({
  experience_points: ExperiencePointsSchema.optional(),
  lives_current: z.number().int().min(0).max(10).optional(),
  streak_current: z.number().int().min(0).optional(),
  last_completed_lesson_id: z.string().max(60).optional(),
});

export const CreateLessonCompletionSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
  lesson_id: z
    .string()
    .min(1, "Lesson ID is required")
    .max(60, "Lesson ID too long"),
  score: ScoreSchema.optional(),
  time_spent_seconds: TimeSecondsSchema.optional(),
});

export const LessonIdParamSchema = z.object({
  id: z.string().min(1, "Lesson ID is required").max(60, "Lesson ID too long"),
});

// Type exports for validation schemas
export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>;
export type OfflineProgressSyncInput = z.infer<
  typeof OfflineProgressSyncSchema
>;
export type CreateUserProgressInput = z.infer<typeof CreateUserProgressSchema>;
export type UpdateUserProgressInput = z.infer<typeof UpdateUserProgressSchema>;
export type CreateLessonCompletionInput = z.infer<
  typeof CreateLessonCompletionSchema
>;
export type LessonIdParam = z.infer<typeof LessonIdParamSchema>;
