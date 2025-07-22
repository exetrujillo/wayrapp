/**
 * Application-wide constants
 */

// BCP 47 language codes for common languages
export const LANGUAGES = {
  ENGLISH: 'en',
  SPANISH: 'es',
  EUSKERA: 'eu',
  QUECHUA: 'qu',
  GUARANI: 'gn',
  NAHUATL: 'nah',
  AYMARA: 'aym',
  PORTUGUESE_BR: 'pt-BR',
  ENGLISH_CA: 'en-CA',
  FRENCH: 'fr',
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
  },
  COURSES: {
    LIST: '/api/v1/courses',
    DETAIL: (id: string) => `/api/v1/courses/${id}`,
    PACKAGE: (id: string) => `/api/v1/courses/${id}/package`,
  },
  LESSONS: {
    LIST: (moduleId: string) => `/api/v1/modules/${moduleId}/lessons`,
    DETAIL: (id: string) => `/api/v1/lessons/${id}`,
    COMPLETE: (id: string) => `/api/v1/progress/lessons/${id}/complete`,
  },
  EXERCISES: {
    LIST: '/api/v1/exercises',
    DETAIL: (id: string) => `/api/v1/exercises/${id}`,
  },
  SERVER: {
    HEALTH: '/api/v1/health',
  },
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_ID: 'user_id',
  SERVER_URL: 'server_url',
  USER_LANGUAGE: 'user-language',
  OFFLINE_COURSES: 'offline_courses',
  OFFLINE_PROGRESS: 'offline_progress',
};

// Exercise types
export const EXERCISE_TYPES = {
  TRANSLATION: 'translation',
  FILL_IN_BLANK: 'fill_in_the_blank',
  MULTIPLE_CHOICE: 'multiple_choice',
  MATCHING: 'matching',
  LISTENING: 'listening',
  SPEAKING: 'speaking',
};

// Regions
export const REGIONS = {
  ALL: 'all',
  EUROPE: 'europe',
  AMERICAS: 'americas',
  ASIA: 'asia',
  AFRICA: 'africa',
};

export default {
  LANGUAGES,
  API_ENDPOINTS,
  STORAGE_KEYS,
  EXERCISE_TYPES,
  REGIONS,
};