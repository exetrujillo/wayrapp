/**
 * Schema exports
 * Centralized exports for all validation schemas
 */

export {
  PaginationSchema,
  IdParamSchema,
  UuidParamSchema,
  LanguageCodeSchema,
  CountryCodeSchema,
  EmailSchema,
  UsernameSchema,
  UrlSchema,
  ExperiencePointsSchema,
  OrderSchema,
  ScoreSchema,
  TimeSecondsSchema,
  BooleanStringSchema,
  RoleSchema,
  ModuleTypeSchema,
  ExerciseTypeSchema,
  TextFieldSchema,
  OptionalTextFieldSchema,
  JsonSchema,
  type PaginationQuery,
  type IdParam,
  type UuidParam
} from './common';

// Auth schemas
export {
  PasswordSchema,
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  PasswordUpdateSchema,
  type RegisterRequest,
  type LoginRequest,
  type RefreshTokenRequest,
  type PasswordUpdateRequest
} from './auth.schemas';

// User schemas
export {
  UserProfileUpdateSchema,
  UserRoleUpdateSchema,
  UserQuerySchema,
  type UserProfileUpdateRequest,
  type UserRoleUpdateRequest,
  type UserQueryParams
} from './user.schemas';

// Content schemas
export {
  CourseSchema,
  LevelSchema,
  SectionSchema,
  ModuleSchema,
  LessonSchema,
  ExerciseSchema,
  LessonExerciseSchema,
  ExerciseReorderSchema,
  ContentQuerySchema,
  type CourseRequest,
  type LevelRequest,
  type SectionRequest,
  type ModuleRequest,
  type LessonRequest,
  type ExerciseRequest,
  type LessonExerciseRequest,
  type ExerciseReorderRequest,
  type ContentQueryParams
} from './content.schemas';

// Progress schemas
export {
  LessonCompletionSchema,
  ProgressSyncSchema,
  ProgressQuerySchema,
  type LessonCompletionRequest,
  type ProgressSyncRequest,
  type ProgressQueryParams
} from './progress.schemas';