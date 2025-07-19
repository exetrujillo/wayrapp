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
  score?: number;
  time_spent_seconds?: number;
}

export interface OfflineProgressSync {
  completions: Array<{
    lesson_id: string;
    completed_at: string;
    score?: number;
    time_spent_seconds?: number;
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