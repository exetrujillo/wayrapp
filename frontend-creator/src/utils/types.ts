// API Response Types

// Common Types
export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Course Types
export interface Course {
  id: string;
  name: string;
  source_language: string;
  target_language: string;
  description?: string;
  is_public: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseRequest {
  name: string;
  source_language: string;
  target_language: string;
  description?: string;
  is_public: boolean;
}

export interface UpdateCourseRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
}

// Module Types
export interface Module {
  id: string;
  name: string;
  description?: string;
  order: number;
  sectionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModuleRequest {
  name: string;
  description?: string;
  order: number;
  sectionId: string;
}

export interface UpdateModuleRequest {
  name?: string;
  description?: string;
  order?: number;
}

// Lesson Types
export interface Lesson {
  id: string;
  name: string;
  experience_points: number;
  order: number;
  moduleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonRequest {
  name: string;
  experience_points: number;
  order: number;
  moduleId: string;
}

export interface UpdateLessonRequest {
  name?: string;
  experience_points?: number;
  order?: number;
}

// Exercise Types
export type ExerciseType = 
  | 'translation'
  | 'fill_in_the_blank'
  | 'multiple_choice'
  | 'matching'
  | 'listening'
  | 'speaking';

export interface Exercise {
  id: string;
  exercise_type: ExerciseType;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExerciseRequest {
  exercise_type: ExerciseType;
  data: Record<string, any>;
}

export interface UpdateExerciseRequest {
  exercise_type?: ExerciseType;
  data?: Record<string, any>;
}

// Exercise Assignment Types
export interface ExerciseAssignment {
  id: string;
  lessonId: string;
  exercise_id: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExerciseAssignmentRequest {
  exercise_id: string;
  order: number;
}

export interface UpdateExerciseAssignmentRequest {
  order: number;
}