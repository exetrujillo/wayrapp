// frontend-creator/src/utils/constants.ts

/**
 * Application-wide constants and configuration values for the language learning platform.
 * 
 * This module serves as the central repository for all static configuration values used throughout
 * the frontend application. It provides standardized constants for API endpoints, supported languages,
 * content type definitions, and local storage keys. The constants are organized into logical groups
 * to maintain consistency across the application and facilitate easy maintenance and updates.
 * 
 * This file is extensively used across the application in services (auth.ts, courseService.ts, etc.),
 * components (LanguageSelector, CourseForm, ModuleForm), and forms (DynamicExerciseForm) to ensure
 * consistent data handling and API communication. It plays a critical role in maintaining type safety
 * and preventing magic strings throughout the codebase.
 * 
 * Key architectural benefits:
 * - Centralized configuration management
 * - Type-safe constant definitions with proper TypeScript support
 * - Consistent API endpoint structure across all services
 * - Standardized content type definitions for educational modules and exercises
 * - Secure local storage key management for authentication and user preferences
 * 
 * @example
 * // Using API endpoints in a service
 * import { API_ENDPOINTS } from '../utils/constants';
 * const response = await apiClient.get(API_ENDPOINTS.COURSES.BASE);
 * 
 * @example
 * // Using language constants in a component
 * import { LANGUAGES } from '../utils/constants';
 * const languageOptions = LANGUAGES.map(lang => ({ value: lang.code, label: lang.name }));
 * 
 * @example
 * // Using storage keys for authentication
 * import { STORAGE_KEYS } from '../utils/constants';
 * localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
 */

/**
 * BCP 47 language codes for supported languages in the platform.
 * Each language object contains a standardized language code and display name.
 * 
 * @constant {Array<{code: string, name: string}>} LANGUAGES
 * @example
 * // Used in LanguageSelector component and CourseForm
 * const selectedLanguage = LANGUAGES.find(lang => lang.code === 'en');
 */
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'eu', name: 'Basque (Euskera)' },
  // Add more languages as needed
];

/**
 * Comprehensive API endpoint definitions organized by resource type.
 * Provides a centralized, type-safe way to access all backend API routes used throughout the application.
 * 
 * The endpoints follow RESTful conventions and support both static routes and dynamic route generators
 * that accept parameters for resource-specific operations. This structure ensures consistency across
 * all service classes and prevents endpoint URL duplication or typos.
 * 
 * @constant {Object} API_ENDPOINTS
 * @property {Object} AUTH - Authentication-related endpoints
 * @property {Object} COURSES - Course management endpoints with dynamic ID support
 * @property {Object} LEVELS - Level management endpoints within courses
 * @property {Object} SECTIONS - Section management endpoints within levels
 * @property {Object} MODULES - Module management endpoints within sections
 * @property {Object} LESSONS - Lesson management endpoints within modules
 * @property {Object} EXERCISES - Exercise management endpoints
 * @property {Object} PROGRESS - User progress tracking endpoints
 * 
 * @example
 * // Static endpoint usage
 * const courses = await apiClient.get(API_ENDPOINTS.COURSES.BASE);
 * 
 * @example
 * // Dynamic endpoint usage with parameters
 * const courseDetail = await apiClient.get(API_ENDPOINTS.COURSES.DETAIL('course-123'));
 * const courseLevels = await apiClient.get(API_ENDPOINTS.COURSES.LEVELS('course-123'));
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    PROFILE: '/auth/profile',
    ME: '/auth/me',
  },
  COURSES: {
    BASE: '/courses',
    DETAIL: (id: string) => `/courses/${id}`,
    PACKAGE: (id: string) => `/courses/${id}/package`,
    LEVELS: (courseId: string) => `/courses/${courseId}/levels`,
  },
  LEVELS: {
    BASE: '/levels',
    DETAIL: (id: string) => `/levels/${id}`,
    SECTIONS: (levelId: string) => `/levels/${levelId}/sections`,
  },
  SECTIONS: {
    BASE: '/sections',
    DETAIL: (id: string) => `/sections/${id}`,
    MODULES: (id: string) => `/sections/${id}/modules`,
  },
  MODULES: {
    BASE: '/modules',
    DETAIL: (id: string) => `/modules/${id}`,
    LESSONS: (id: string) => `/modules/${id}/lessons`,
  },
  LESSONS: {
    BASE: '/lessons',
    DETAIL: (id: string) => `/lessons/${id}`,
    EXERCISES: (id: string) => `/lessons/${id}/exercises`,
    COMPLETE: (id: string) => `/progress/lessons/${id}/complete`,
    REORDER_EXERCISES: (id: string) => `/lessons/${id}/exercises/reorder`,
  },
  EXERCISES: {
    BASE: '/exercises',
    DETAIL: (id: string) => `/exercises/${id}`,
  },
  PROGRESS: {
    BASE: '/progress',
    USER: '/progress/user',
  },
};

/**
 * Available module types for educational content creation.
 * Defines the different types of learning modules that can be created within the platform,
 * each with specific characteristics and learning objectives.
 * 
 * Used primarily in ModuleForm component and ModuleCard component for content creation
 * and display. Each type represents a different pedagogical approach to content delivery.
 * 
 * @constant {Array<{value: string, label: string}>} MODULE_TYPES
 * @property {string} value - The internal identifier used in API calls and data storage
 * @property {string} label - The human-readable display name shown in the UI
 * 
 * @example
 * // Used in ModuleForm for dropdown options
 * const moduleTypeOptions = MODULE_TYPES.map(type => ({
 *   value: type.value,
 *   label: type.label
 * }));
 */
export const MODULE_TYPES = [
  { value: 'informative', label: 'Informative' },
  { value: 'basic_lesson', label: 'Basic Lesson' },
  { value: 'reading', label: 'Reading' },
  { value: 'dialogue', label: 'Dialogue' },
  { value: 'exam', label: 'Exam' },
];

/**
 * Available exercise types for interactive learning activities.
 * Defines the different types of exercises that can be created within lessons,
 * each providing unique interaction patterns and assessment methods.
 * 
 * Used extensively in DynamicExerciseForm, ExerciseCard, and ExerciseAssignmentModal
 * components for exercise creation, display, and assignment. Each type corresponds
 * to a specific UI component and validation schema.
 * 
 * @constant {Array<{value: string, label: string}>} EXERCISE_TYPES
 * @property {string} value - The internal identifier used in API calls and component routing
 * @property {string} label - The human-readable display name shown in forms and UI
 * 
 * @example
 * // Used in DynamicExerciseForm for exercise type selection
 * const exerciseTypeOptions = EXERCISE_TYPES.map(type => ({
 *   value: type.value,
 *   label: type.label
 * }));
 * 
 * @example
 * // Used for type-specific form validation
 * const selectedType = EXERCISE_TYPES.find(type => type.value === 'translation');
 */
export const EXERCISE_TYPES = [
  { value: 'translation', label: 'Translation' },
  { value: 'fill-in-the-blank', label: 'Fill in the Blank' },
  { value: 'vof', label: 'Verify or False' },
  { value: 'pairs', label: 'Pairs' },
  { value: 'informative', label: 'Informative' },
  { value: 'ordering', label: 'Ordering' },
];

/**
 * Local storage keys for client-side data persistence.
 * Provides standardized keys for storing user authentication data, preferences,
 * and session information in the browser's local storage.
 * 
 * Used primarily in the auth service (auth.ts) and API client (api.ts) for managing
 * user sessions, token storage, and authentication state persistence across browser
 * sessions. Critical for maintaining user login state and enabling automatic token refresh.
 * 
 * @constant {Object} STORAGE_KEYS
 * @property {string} ACCESS_TOKEN - Key for storing JWT access tokens
 * @property {string} REFRESH_TOKEN - Key for storing JWT refresh tokens
 * @property {string} AUTH_USER - Key for storing authenticated user profile data
 * @property {string} LANGUAGE - Key for storing user's preferred language setting
 * @property {string} TOKEN_EXPIRY - Key for storing access token expiration timestamp
 * 
 * @example
 * // Used in auth service for token management
 * localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.accessToken);
 * const storedToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
 * 
 * @example
 * // Used in session persistence tests
 * localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(userProfile));
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  AUTH_USER: 'auth_user',
  LANGUAGE: 'user_language',
  TOKEN_EXPIRY: 'token_expiry',
};

export default {
  LANGUAGES,
  API_ENDPOINTS,
  MODULE_TYPES,
  EXERCISE_TYPES,
  STORAGE_KEYS,
};