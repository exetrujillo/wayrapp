// Content module types and interfaces

export interface Course {
  id: string;
  source_language: string;
  target_language: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
  levels_count?: number;
}

export interface Level {
  id: string;
  course_id: string;
  code: string;
  name: string;
  order: number;
  created_at: Date;
  updated_at: Date;
  sections_count?: number;
}

export interface Section {
  id: string;
  level_id: string;
  name: string;
  order: number;
  created_at: Date;
  updated_at: Date;
  modules_count?: number;
}

export interface Module {
  id: string;
  section_id: string;
  module_type: "informative" | "basic_lesson" | "reading" | "dialogue" | "exam";
  name: string;
  order: number;
  created_at: Date;
  updated_at: Date;
  lessons_count?: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  experience_points: number;
  order: number;
  created_at: Date;
  updated_at: Date;
  exercises?: LessonExercise[];
}

export interface Exercise {
  id: string;
  exercise_type:
    | "translation"
    | "fill-in-the-blank"
    | "vof"
    | "pairs"
    | "informative"
    | "ordering";
  data: any;
  created_at: Date;
  updated_at: Date;
}

export interface LessonExercise {
  lesson_id: string;
  exercise_id: string;
  order: number;
  exercise?: Exercise;
}

// DTOs for creating content
export interface CreateCourseDto {
  id: string;
  source_language: string;
  target_language: string;
  name: string;
  description?: string | undefined;
  is_public?: boolean | undefined;
}

export interface CreateLevelDto {
  id: string;
  course_id: string;
  code: string;
  name: string;
  order: number;
}

export interface CreateSectionDto {
  id: string;
  level_id: string;
  name: string;
  order: number;
}

export interface CreateModuleDto {
  id: string;
  section_id: string;
  module_type: "informative" | "basic_lesson" | "reading" | "dialogue" | "exam";
  name: string;
  order: number;
}

export interface CreateLessonDto {
  id: string;
  module_id: string;
  experience_points?: number;
  order: number;
}

export interface CreateExerciseDto {
  id: string;
  exercise_type:
    | "translation"
    | "fill-in-the-blank"
    | "vof"
    | "pairs"
    | "informative"
    | "ordering";
  data: any;
}

export interface AssignExerciseToLessonDto {
  exercise_id: string;
  order: number;
}

// Packaged content for offline support
export interface PackagedCourse {
  course: Course;
  levels: PackagedLevel[];
  package_version: string;
}

export interface PackagedLevel extends Level {
  sections: PackagedSection[];
}

export interface PackagedSection extends Section {
  modules: PackagedModule[];
}

export interface PackagedModule extends Module {
  lessons: PackagedLesson[];
}

export interface PackagedLesson extends Lesson {
  exercises: LessonExercise[];
}

// Re-export schema types
export * from "../schemas";
