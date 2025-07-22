/**
 * Helper functions for the WayrApp Mobile application
 */

/**
 * Formats a date string to a localized date
 */
export const formatDate = (dateString: string, locale = 'en-US'): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Formats a language code to a human-readable language name
 */
export const formatLanguage = (languageCode: string): string => {
  const languages: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'eu': 'Basque (Euskera)',
    'qu': 'Quechua',
    'gn': 'Guaraní',
    'nah': 'Nahuatl',
    'aym': 'Aymara',
    'pt-BR': 'Brazilian Portuguese',
    'en-CA': 'Canadian English',
    'fr': 'French',
  };

  return languages[languageCode] || languageCode;
};

/**
 * Truncates text to a specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Validates an email address
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a password (minimum 8 characters, at least one letter and one number)
 */
export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Calculates the progress percentage
 */
export const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Formats a number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Generates a random color based on a string
 */
export const stringToColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
};

export default {
  formatDate,
  formatLanguage,
  truncateText,
  isValidEmail,
  isValidPassword,
  calculateProgress,
  formatNumber,
  stringToColor,
};