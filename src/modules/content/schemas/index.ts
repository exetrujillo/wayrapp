import { z } from "zod";
import {
  LanguageCodeSchema,
  TextFieldSchema,
  OptionalTextFieldSchema,
  OrderSchema,
  ExperiencePointsSchema,
  ModuleTypeSchema,
  ExerciseTypeSchema,
  JsonSchema,
  BasePaginationSchema,
  // IdParamSchema
} from "../../../shared/schemas/common";

// Course validation schemas
export const CreateCourseSchema = z.object({
  id: z.string().min(1, "Course ID is required").max(20, "Course ID too long"),
  source_language: LanguageCodeSchema,
  target_language: LanguageCodeSchema,
  name: TextFieldSchema(1, 100),
  description: OptionalTextFieldSchema(),
  is_public: z.boolean().optional().default(true),
});

export const UpdateCourseSchema = CreateCourseSchema.partial().omit({
  id: true,
});

export const CourseQuerySchema = BasePaginationSchema.extend({
  search: z.string().optional(),
  source_language: LanguageCodeSchema.optional(),
  target_language: LanguageCodeSchema.optional(),
  is_public: z
    .string()
    .optional()
    .transform((val) => val === undefined ? undefined : val === "true"),
});

// Level validation schemas
export const CreateLevelSchema = z.object({
  id: z.string().min(1, "Level ID is required").max(30, "Level ID too long"),
  course_id: z
    .string()
    .min(1, "Course ID is required")
    .max(20, "Course ID too long"),
  code: z
    .string()
    .min(1, "Level code is required")
    .max(10, "Level code too long"),
  name: TextFieldSchema(1, 100),
  order: OrderSchema,
});

export const UpdateLevelSchema = CreateLevelSchema.partial().omit({
  id: true,
  course_id: true,
});

export const LevelQuerySchema = BasePaginationSchema;

// Section validation schemas
export const CreateSectionSchema = z.object({
  id: z
    .string()
    .min(1, "Section ID is required")
    .max(40, "Section ID too long"),
  level_id: z
    .string()
    .min(1, "Level ID is required")
    .max(30, "Level ID too long"),
  name: TextFieldSchema(1, 150),
  order: OrderSchema,
});

export const UpdateSectionSchema = CreateSectionSchema.partial().omit({
  id: true,
  level_id: true,
});

export const SectionQuerySchema = BasePaginationSchema;

// Module validation schemas
export const CreateModuleSchema = z.object({
  id: z.string().min(1, "Module ID is required").max(50, "Module ID too long"),
  section_id: z
    .string()
    .min(1, "Section ID is required")
    .max(40, "Section ID too long"),
  module_type: ModuleTypeSchema,
  name: TextFieldSchema(1, 150),
  order: OrderSchema,
});

export const UpdateModuleSchema = CreateModuleSchema.partial().omit({
  id: true,
  section_id: true,
});

export const ModuleQuerySchema = BasePaginationSchema.extend({
  module_type: ModuleTypeSchema.optional(),
});

// Lesson validation schemas
export const CreateLessonSchema = z.object({
  id: z.string().min(1, "Lesson ID is required").max(60, "Lesson ID too long"),
  module_id: z
    .string()
    .min(1, "Module ID is required")
    .max(50, "Module ID too long"),
  name: TextFieldSchema(1, 150),
  description: OptionalTextFieldSchema(500),
  experience_points: ExperiencePointsSchema.optional().default(10),
  order: OrderSchema,
});

export const UpdateLessonSchema = CreateLessonSchema.partial().omit({
  id: true,
  module_id: true,
}).extend({
  description: z.union([
    z.string().max(500, "Description cannot exceed 500 characters"),
    z.null()
  ]).optional(),
});

export const LessonQuerySchema = BasePaginationSchema;

// Exercise validation schemas
export const CreateExerciseSchema = z.object({
  id: z
    .string()
    .min(1, "Exercise ID is required")
    .max(15, "Exercise ID too long"),
  exercise_type: ExerciseTypeSchema,
  data: JsonSchema,
});

export const UpdateExerciseSchema = CreateExerciseSchema.partial().omit({
  id: true,
});

export const ExerciseQuerySchema = BasePaginationSchema.extend({
  exercise_type: ExerciseTypeSchema.optional(),
});

// Lesson-Exercise assignment schema
export const AssignExerciseToLessonSchema = z.object({
  exercise_id: z
    .string()
    .min(1, "Exercise ID is required")
    .max(15, "Exercise ID too long"),
  order: OrderSchema,
});

export const ReorderExercisesSchema = z.object({
  exercise_ids: z
    .array(z.string().min(1).max(15))
    .min(1, "At least one exercise ID is required"),
});

export const ReorderLessonsSchema = z.object({
  lesson_ids: z
    .array(z.string().min(1).max(60))
    .min(1, "At least one lesson ID is required"),
});

// Parameter validation schemas
export const CourseParamSchema = z.object({
  courseId: z
    .string()
    .min(1, "Course ID is required")
    .max(20, "Course ID too long"),
});

export const LevelParamSchema = z.object({
  levelId: z
    .string()
    .min(1, "Level ID is required")
    .max(30, "Level ID too long"),
});

export const SectionParamSchema = z.object({
  sectionId: z
    .string()
    .min(1, "Section ID is required")
    .max(40, "Section ID too long"),
});

export const ModuleParamSchema = z.object({
  moduleId: z
    .string()
    .min(1, "Module ID is required")
    .max(50, "Module ID too long"),
});

export const LessonParamSchema = z.object({
  lessonId: z
    .string()
    .min(1, "Lesson ID is required")
    .max(60, "Lesson ID too long"),
});

export const ExerciseParamSchema = z.object({
  exerciseId: z
    .string()
    .min(1, "Exercise ID is required")
    .max(15, "Exercise ID too long"),
});

// Type exports
export type CreateCourseDto = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseDto = z.infer<typeof UpdateCourseSchema>;
export type CourseQuery = z.infer<typeof CourseQuerySchema>;

export type CreateLevelDto = z.infer<typeof CreateLevelSchema>;
export type UpdateLevelDto = z.infer<typeof UpdateLevelSchema>;
export type LevelQuery = z.infer<typeof LevelQuerySchema>;

export type CreateSectionDto = z.infer<typeof CreateSectionSchema>;
export type UpdateSectionDto = z.infer<typeof UpdateSectionSchema>;
export type SectionQuery = z.infer<typeof SectionQuerySchema>;

export type CreateModuleDto = z.infer<typeof CreateModuleSchema>;
export type UpdateModuleDto = z.infer<typeof UpdateModuleSchema>;
export type ModuleQuery = z.infer<typeof ModuleQuerySchema>;

export type CreateLessonDto = z.infer<typeof CreateLessonSchema>;
export type UpdateLessonDto = z.infer<typeof UpdateLessonSchema>;
export type LessonQuery = z.infer<typeof LessonQuerySchema>;

export type CreateExerciseDto = z.infer<typeof CreateExerciseSchema>;
export type UpdateExerciseDto = z.infer<typeof UpdateExerciseSchema>;
export type ExerciseQuery = z.infer<typeof ExerciseQuerySchema>;

export type AssignExerciseToLessonDto = z.infer<
  typeof AssignExerciseToLessonSchema
>;
export type ReorderExercisesDto = z.infer<typeof ReorderExercisesSchema>;
export type ReorderLessonsDto = z.infer<typeof ReorderLessonsSchema>;
