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
  },
  COURSES: {
    BASE: '/courses',
    DETAIL: (id: string) => `/courses/${id}`,
    PACKAGE: (id: string) => `/courses/${id}/package`,
  },
  MODULES: {
    BASE: '/modules',
    DETAIL: (id: string) => `/modules/${id}`,
    LESSONS: (id: string) => `/modules/${id}/lessons`,
  },
  SECTIONS: {
    BASE: '/sections',
    DETAIL: (id: string) => `/sections/${id}`,
    MODULES: (id: string) => `/sections/${id}/modules`,
  },
  LESSONS: {
    BASE: '/lessons',
    DETAIL: (id: string) => `/lessons/${id}`,
    EXERCISES: (id: string) => `/lessons/${id}/exercises`,
    COMPLETE: (id: string) => `/progress/lessons/${id}/complete`,
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

// Exercise types
export const EXERCISE_TYPES = [
  { value: 'translation', label: 'Translation' },
  { value: 'fill_in_the_blank', label: 'Fill in the Blank' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'matching', label: 'Matching' },
  { value: 'listening', label: 'Listening' },
  { value: 'speaking', label: 'Speaking' },
];

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  AUTH_USER: 'auth_user',
  LANGUAGE: 'user_language',
  TOKEN_EXPIRY: 'token_expiry',
};

export default {
  LANGUAGES,
  API_ENDPOINTS,
  EXERCISE_TYPES,
  STORAGE_KEYS,
};