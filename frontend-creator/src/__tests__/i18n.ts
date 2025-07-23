/**
 * i18n configuration for Jest tests
 * Provides actual translations instead of mocked keys
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import the actual translations from the main app
import enTranslations from '../locales/en.json';

i18n
    .use(initReactI18next)
    .init({
        lng: 'en',
        fallbackLng: 'en',

        // Use the actual translation resources with additional validation messages
        resources: {
            en: {
                translation: {
                    ...enTranslations,
                    // Add validation messages as direct keys for compatibility with Zod
                    "Please enter a valid email address": "Please enter a valid email address",
                    "Password must be at least 8 characters": "Password must be at least 8 characters"
                }
            }
        },

        interpolation: {
            escapeValue: false, // React already safes from xss
        },

        // Disable language detection for tests
        detection: {
            order: [],
        },

        // Disable debug mode for cleaner test output
        debug: false,
    });

export default i18n;