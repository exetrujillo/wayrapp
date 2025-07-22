/**
 * WayrApp Shared Constants
 * 
 * This file contains centralized constants used across the WayrApp frontend suite,
 * including BCP 47 language codes, API endpoints, and validation schemas.
 */

/**
 * BCP 47 Language Codes
 * Common language codes used in the application
 * Format: ISO 639-1 or ISO 639-1-ISO 3166-1
 */
const LANGUAGE_CODES = {
    // Indigenous languages
    eu: { code: 'eu', name: 'Euskera', nativeName: 'Euskara', region: 'Europe' },
    qu: { code: 'qu', name: 'Quechua', nativeName: 'Runasimi', region: 'South America' },
    aym: { code: 'aym', name: 'Aymara', nativeName: 'Aymar aru', region: 'South America' },
    nah: { code: 'nah', name: 'Nahuatl', nativeName: 'Nāhuatl', region: 'North America' },
    gn: { code: 'gn', name: 'Guaraní', nativeName: 'Avañe\'ẽ', region: 'South America' },
    arn: { code: 'arn', name: 'Mapudungun', nativeName: 'Mapudungun', region: 'South America' },

    // Major languages
    en: { code: 'en', name: 'English', nativeName: 'English', region: 'Global' },
    'en-US': { code: 'en-US', name: 'English (US)', nativeName: 'English (US)', region: 'North America' },
    'en-CA': { code: 'en-CA', name: 'English (Canada)', nativeName: 'English (Canada)', region: 'North America' },
    es: { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'Global' },
    'es-MX': { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', region: 'North America' },
    'es-ES': { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)', region: 'Europe' },
    fr: { code: 'fr', name: 'French', nativeName: 'Français', region: 'Global' },
    'fr-CA': { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Canada)', region: 'North America' },
    'fr-FR': { code: 'fr-FR', name: 'French (France)', nativeName: 'Français (France)', region: 'Europe' },
    pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'Global' },
    'pt-BR': { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', region: 'South America' },
};

/**
 * API Endpoints
 * Centralized API endpoints used across applications
 */
const API_ENDPOINTS = {
    // Authentication
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH_TOKEN: '/api/v1/auth/refresh',

    // Courses
    COURSES: '/api/v1/courses',
    COURSE_BY_ID: (id) => `/api/v1/courses/${id}`,
    COURSE_PACKAGE: (id) => `/api/v1/courses/${id}/package`,

    // Modules
    MODULES: '/api/v1/modules',
    MODULE_BY_ID: (id) => `/api/v1/modules/${id}`,
    MODULE_LESSONS: (moduleId) => `/api/v1/modules/${moduleId}/lessons`,

    // Sections
    SECTIONS: '/api/v1/sections',
    SECTION_BY_ID: (id) => `/api/v1/sections/${id}`,
    SECTION_MODULES: (sectionId) => `/api/v1/sections/${sectionId}/modules`,

    // Lessons
    LESSONS: '/api/v1/lessons',
    LESSON_BY_ID: (id) => `/api/v1/lessons/${id}`,
    LESSON_EXERCISES: (lessonId) => `/api/v1/lessons/${lessonId}/exercises`,

    // Exercises
    EXERCISES: '/api/v1/exercises',
    EXERCISE_BY_ID: (id) => `/api/v1/exercises/${id}`,

    // Progress
    PROGRESS: '/api/v1/progress',
    COMPLETE_LESSON: (lessonId) => `/api/v1/progress/lessons/${lessonId}/complete`,
    USER_PROGRESS: '/api/v1/progress/user',
};

/**
 * Validation Schemas
 * Common validation patterns and rules
 */
const VALIDATION_PATTERNS = {
    // Email validation regex
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,

    // Password requirements: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,

    // BCP 47 language code validation
    // Simple pattern for language-region format (e.g., en-US)
    BCP47: /^[a-z]{2,3}(-[A-Z]{2})?$/,

    // URL validation
    URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
};

/**
 * Exercise Types
 * Supported exercise types in the application
 */
const EXERCISE_TYPES = {
    TRANSLATION: 'translation',
    MULTIPLE_CHOICE: 'multiple_choice',
    FILL_IN_BLANK: 'fill_in_blank',
    MATCHING: 'matching',
    LISTENING: 'listening',
    SPEAKING: 'speaking',
};

/**
 * Server Regions
 * Geographic regions for server categorization
 */
const SERVER_REGIONS = {
    GLOBAL: 'Global',
    NORTH_AMERICA: 'North America',
    SOUTH_AMERICA: 'South America',
    EUROPE: 'Europe',
    ASIA: 'Asia',
    AFRICA: 'Africa',
    OCEANIA: 'Oceania',
};

module.exports = {
    LANGUAGE_CODES,
    API_ENDPOINTS,
    VALIDATION_PATTERNS,
    EXERCISE_TYPES,
    SERVER_REGIONS,
};