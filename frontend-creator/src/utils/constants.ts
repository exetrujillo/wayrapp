// BCP 47 language codes for common languages
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'eu', name: 'Basque (Euskera)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'qu', name: 'Quechua' },
  { code: 'aym', name: 'Aymara' },
  { code: 'nah', name: 'Nahuatl' },
  { code: 'gn', name: 'Guaraní' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)' },
  { code: 'en-CA', name: 'English (Canada)' },
];

// API endpoints
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

// Module types
export const MODULE_TYPES = [
  { value: 'informative', label: 'Informative' },
  { value: 'basic_lesson', label: 'Basic Lesson' },
  { value: 'reading', label: 'Reading' },
  { value: 'dialogue', label: 'Dialogue' },
  { value: 'exam', label: 'Exam' },
];

// Exercise types
export const EXERCISE_TYPES = [
  { value: 'translation', label: 'Translation' },
  { value: 'fill-in-the-blank', label: 'Fill in the Blank' },
  { value: 'vof', label: 'Verify or False' },
  { value: 'pairs', label: 'Pairs' },
  { value: 'informative', label: 'Informative' },
  { value: 'ordering', label: 'Ordering' },
];

// Local storage keys
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