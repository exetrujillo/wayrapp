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
  is_public?: boolean;
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
  username?: string;
  countryCode?: string;
  registrationDate: string;
  lastLoginDate?: string;
  profilePictureUrl?: string;
  isActive: boolean;
  role: 'student' | 'content_creator' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

// Full API response wrapper
export interface FullApiResponse<T> {
  success: boolean;
  timestamp: string;
  data: T;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// Course Types
export interface Course {
  id: string;
  name: string;
  sourceLanguage: string;
  targetLanguage: string;
  description?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseRequest {
  id: string;
  name: string;
  source_language: string;
  target_language: string;
  description?: string;
  is_public: boolean;
}

export interface UpdateCourseRequest {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

// Level Types
export interface Level {
  id: string;
  courseId: string;
  code: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLevelRequest {
  id: string;
  code: string;
  name: string;
  order: number;
}

export interface UpdateLevelRequest {
  code?: string;
  name?: string;
  order?: number;
}

// Section Types
export interface Section {
  id: string;
  levelId: string;
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSectionRequest {
  id: string;
  name: string;
  order: number;
}

export interface UpdateSectionRequest {
  name?: string;
  order?: number;
}

// Module Types
export interface Module {
  id: string;
  sectionId: string;
  moduleType: 'informative' | 'basic_lesson' | 'reading' | 'dialogue' | 'exam';
  name: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateModuleRequest {
  sectionId: string;
  moduleType: 'informative' | 'basic_lesson' | 'reading' | 'dialogue' | 'exam';
  name: string;
  order: number;
}

export interface UpdateModuleRequest {
  moduleType?: 'informative' | 'basic_lesson' | 'reading' | 'dialogue' | 'exam';
  name?: string;
  order?: number;
}

// Lesson Types
export interface Lesson {
  id: string;
  experiencePoints: number;
  order: number;
  moduleId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLessonRequest {
  experiencePoints: number;
  order: number;
}

export interface UpdateLessonRequest {
  experiencePoints?: number;
  order?: number;
}

// Exercise Types
export type ExerciseType = 
  | 'translation'
  | 'fill-in-the-blank'
  | 'vof'
  | 'pairs'
  | 'informative'
  | 'ordering';

export interface Exercise {
  id: string;
  exerciseType: ExerciseType;
  data: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExerciseRequest {
  exerciseType: ExerciseType;
  data: Record<string, any>;
}

export interface UpdateExerciseRequest {
  exerciseType?: ExerciseType;
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