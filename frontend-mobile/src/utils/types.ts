/**
 * Type definitions for the WayrApp Mobile application
 */

// Authentication
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  nativeLanguage: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// User
export interface User {
  id: string;
  email: string;
  fullName: string;
  nativeLanguage: string;
  createdAt: string;
  updatedAt: string;
}

// Server
export interface Server {
  id: string;
  name: string;
  description: string;
  url: string;
  languages: string[];
  region: string;
}

// Course
export interface Course {
  id: string;
  name: string;
  description: string;
  source_language: string;
  target_language: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

// Module
export interface Module {
  id: string;
  name: string;
  course_id: string;
  order: number;
  created_at: string;
  updated_at: string;
}

// Lesson
export interface Lesson {
  id: string;
  name: string;
  module_id: string;
  experience_points: number;
  order: number;
  created_at: string;
  updated_at: string;
}

// Exercise
export interface Exercise {
  id: string;
  exercise_type: string;
  data: any;
  created_at: string;
  updated_at: string;
}

// LessonExercise (junction)
export interface LessonExercise {
  lesson_id: string;
  exercise_id: string;
  order: number;
}

// Progress
export interface Progress {
  user_id: string;
  lesson_id: string;
  completed: boolean;
  score: number;
  completed_at: string;
}

// Course Package
export interface CoursePackage {
  course: Course;
  modules: Module[];
  lessons: Lesson[];
  exercises: Exercise[];
  lesson_exercises: LessonExercise[];
}

// Answer
export interface Answer {
  exercise_id: string;
  user_input: any;
  is_correct: boolean;
  score: number;
}

// Progress Response
export interface ProgressResponse {
  lesson_id: string;
  completed: boolean;
  score: number;
  experience_points: number;
  streak_days: number;
}

export default {
  AuthCredentials,
  RegisterData,
  AuthResponse,
  User,
  Server,
  Course,
  Module,
  Lesson,
  Exercise,
  LessonExercise,
  Progress,
  CoursePackage,
  Answer,
  ProgressResponse,
};