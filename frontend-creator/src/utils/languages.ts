/**
 * Comprehensive BCP 47 Language Codes for WayrApp
 * 
 * This module provides a comprehensive list of BCP 47 compliant language codes
 * with native names and English names for use in language selection dropdowns
 * and course creation forms. The list includes major world languages, regional
 * variants, and indigenous languages with special focus on underrepresented
 * languages that align with WayrApp's mission.
 * 
 * @module Languages
 * @category Utils
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Import and use in a React component
 * import { LANGUAGES, getLanguageByCode, getLanguageDisplayName } from './languages';
 * 
 * // Use in a select dropdown
 * const languageOptions = LANGUAGES.map(lang => (
 *   <option key={lang.code} value={lang.code}>
 *     {getLanguageDisplayName(lang)}
 *   </option>
 * ));
 */

/**
 * Language interface defining the structure of each language entry
 * 
 * @interface Language
 * @property {string} code - BCP 47 compliant language code (e.g., 'en', 'es-MX', 'zh-CN')
 * @property {string} name - English name of the language
 * @property {string} nativeName - Native name of the language in its own script
 * @property {string} [region] - Geographic region or country (optional)
 */
export interface Language {
  /** BCP 47 compliant language code */
  code: string;
  /** English name of the language */
  name: string;
  /** Native name of the language in its own script */
  nativeName: string;
  /** Geographic region or country (optional) */
  region?: string;
}

/**
 * Comprehensive list of BCP 47 compliant languages
 * 
 * Organized alphabetically by English name for better UX.
 * Includes major world languages, regional variants, and indigenous languages.
 * Special emphasis on underrepresented languages aligned with WayrApp's mission.
 */
export const LANGUAGES: Language[] = [
  // A
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', region: 'Middle East' },
  { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', nativeName: 'العربية (السعودية)', region: 'Saudi Arabia' },
  { code: 'ar-EG', name: 'Arabic (Egypt)', nativeName: 'العربية (مصر)', region: 'Egypt' },
  { code: 'hy', name: 'Armenian', nativeName: 'Հայերեն', region: 'Armenia' },
  { code: 'aym', name: 'Aymara', nativeName: 'Aymar aru', region: 'South America' },

  // B
  { code: 'eu', name: 'Basque', nativeName: 'Euskera', region: 'Spain' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', region: 'Bangladesh' },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', region: 'Bulgaria' },

  // C
  { code: 'ca', name: 'Catalan', nativeName: 'Català', region: 'Spain' },
  { code: 'chr', name: 'Cherokee', nativeName: 'ᏣᎳᎩ', region: 'North America' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '中文 (简体)', region: 'China' },
  { code: 'zh-CN', name: 'Chinese (China)', nativeName: '中文 (中国)', region: 'China' },
  { code: 'zh-TW', name: 'Chinese (Taiwan)', nativeName: '中文 (台灣)', region: 'Taiwan' },
  { code: 'zh-HK', name: 'Chinese (Hong Kong)', nativeName: '中文 (香港)', region: 'Hong Kong' },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', region: 'Croatia' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', region: 'Czech Republic' },

  // D
  { code: 'da', name: 'Danish', nativeName: 'Dansk', region: 'Denmark' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', region: 'Netherlands' },
  { code: 'nl-BE', name: 'Dutch (Belgium)', nativeName: 'Nederlands (België)', region: 'Belgium' },

  // E
  { code: 'en', name: 'English', nativeName: 'English', region: 'Global' },
  { code: 'en-US', name: 'English (United States)', nativeName: 'English (United States)', region: 'United States' },
  { code: 'en-GB', name: 'English (United Kingdom)', nativeName: 'English (United Kingdom)', region: 'United Kingdom' },
  { code: 'en-CA', name: 'English (Canada)', nativeName: 'English (Canada)', region: 'Canada' },
  { code: 'en-AU', name: 'English (Australia)', nativeName: 'English (Australia)', region: 'Australia' },
  { code: 'et', name: 'Estonian', nativeName: 'Eesti', region: 'Estonia' },

  // F
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', region: 'Finland' },
  { code: 'fr', name: 'French', nativeName: 'Français', region: 'Global' },
  { code: 'fr-FR', name: 'French (France)', nativeName: 'Français (France)', region: 'France' },
  { code: 'fr-CA', name: 'French (Canada)', nativeName: 'Français (Canada)', region: 'Canada' },
  { code: 'fr-BE', name: 'French (Belgium)', nativeName: 'Français (Belgique)', region: 'Belgium' },
  { code: 'fr-CH', name: 'French (Switzerland)', nativeName: 'Français (Suisse)', region: 'Switzerland' },

  // G
  { code: 'gl', name: 'Galician', nativeName: 'Galego', region: 'Spain' },
  { code: 'ka', name: 'Georgian', nativeName: 'ქართული', region: 'Georgia' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', region: 'Germany' },
  { code: 'de-DE', name: 'German (Germany)', nativeName: 'Deutsch (Deutschland)', region: 'Germany' },
  { code: 'de-AT', name: 'German (Austria)', nativeName: 'Deutsch (Österreich)', region: 'Austria' },
  { code: 'de-CH', name: 'German (Switzerland)', nativeName: 'Deutsch (Schweiz)', region: 'Switzerland' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', region: 'Greece' },
  { code: 'gn', name: 'Guaraní', nativeName: 'Avañe\'ẽ', region: 'South America' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', region: 'India' },

  // H
  { code: 'ht', name: 'Haitian Creole', nativeName: 'Kreyòl Ayisyen', region: 'Haiti' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', region: 'Israel' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', region: 'India' },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', region: 'Hungary' },

  // I
  { code: 'is', name: 'Icelandic', nativeName: 'Íslenska', region: 'Iceland' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', region: 'Indonesia' },
  { code: 'ga', name: 'Irish', nativeName: 'Gaeilge', region: 'Ireland' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', region: 'Italy' },
  { code: 'it-IT', name: 'Italian (Italy)', nativeName: 'Italiano (Italia)', region: 'Italy' },
  { code: 'it-CH', name: 'Italian (Switzerland)', nativeName: 'Italiano (Svizzera)', region: 'Switzerland' },

  // J
  { code: 'ja', name: 'Japanese', nativeName: '日本語', region: 'Japan' },

  // K
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', region: 'India' },
  { code: 'kk', name: 'Kazakh', nativeName: 'Қазақ тілі', region: 'Kazakhstan' },
  { code: 'km', name: 'Khmer', nativeName: 'ភាសាខ្មែរ', region: 'Cambodia' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', region: 'South Korea' },
  { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', region: 'Kurdistan' },

  // L
  { code: 'lo', name: 'Lao', nativeName: 'ລາວ', region: 'Laos' },
  { code: 'lv', name: 'Latvian', nativeName: 'Latviešu', region: 'Latvia' },
  { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių', region: 'Lithuania' },

  // M
  { code: 'mk', name: 'Macedonian', nativeName: 'Македонски', region: 'North Macedonia' },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', region: 'Malaysia' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', region: 'India' },
  { code: 'mt', name: 'Maltese', nativeName: 'Malti', region: 'Malta' },
  { code: 'arn', name: 'Mapudungun', nativeName: 'Mapudungun', region: 'South America' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', region: 'India' },
  { code: 'mn', name: 'Mongolian', nativeName: 'Монгол', region: 'Mongolia' },

  // N
  { code: 'nah', name: 'Nahuatl', nativeName: 'Nāhuatl', region: 'North America' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', region: 'Nepal' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', region: 'Norway' },
  { code: 'nb', name: 'Norwegian Bokmål', nativeName: 'Norsk Bokmål', region: 'Norway' },
  { code: 'nn', name: 'Norwegian Nynorsk', nativeName: 'Norsk Nynorsk', region: 'Norway' },

  // P
  { code: 'ps', name: 'Pashto', nativeName: 'پښتو', region: 'Afghanistan' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', region: 'Iran' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', region: 'Poland' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', region: 'Global' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', region: 'Brazil' },
  { code: 'pt-PT', name: 'Portuguese (Portugal)', nativeName: 'Português (Portugal)', region: 'Portugal' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', region: 'India' },

  // Q
  { code: 'qu', name: 'Quechua', nativeName: 'Runasimi', region: 'South America' },

  // R
  { code: 'ro', name: 'Romanian', nativeName: 'Română', region: 'Romania' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', region: 'Russia' },

  // S
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', region: 'India' },
  { code: 'sr', name: 'Serbian', nativeName: 'Српски', region: 'Serbia' },
  { code: 'si', name: 'Sinhala', nativeName: 'සිංහල', region: 'Sri Lanka' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', region: 'Slovakia' },
  { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina', region: 'Slovenia' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', region: 'Global' },
  { code: 'es-ES', name: 'Spanish (Spain)', nativeName: 'Español (España)', region: 'Spain' },
  { code: 'es-MX', name: 'Spanish (Mexico)', nativeName: 'Español (México)', region: 'Mexico' },
  { code: 'es-AR', name: 'Spanish (Argentina)', nativeName: 'Español (Argentina)', region: 'Argentina' },
  { code: 'es-CO', name: 'Spanish (Colombia)', nativeName: 'Español (Colombia)', region: 'Colombia' },
  { code: 'es-PE', name: 'Spanish (Peru)', nativeName: 'Español (Perú)', region: 'Peru' },
  { code: 'es-CL', name: 'Spanish (Chile)', nativeName: 'Español (Chile)', region: 'Chile' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', region: 'East Africa' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', region: 'Sweden' },

  // T
  { code: 'tl', name: 'Tagalog', nativeName: 'Tagalog', region: 'Philippines' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', region: 'India' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', region: 'India' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย', region: 'Thailand' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', region: 'Turkey' },

  // U
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', region: 'Ukraine' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', region: 'Pakistan' },
  { code: 'uz', name: 'Uzbek', nativeName: 'Oʻzbekcha', region: 'Uzbekistan' },

  // V
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', region: 'Vietnam' },

  // W
  { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg', region: 'Wales' },

  // Y
  { code: 'yi', name: 'Yiddish', nativeName: 'ייִדיש', region: 'Global' },
  { code: 'yo', name: 'Yoruba', nativeName: 'Yorùbá', region: 'Nigeria' },

  // Z
  { code: 'zu', name: 'Zulu', nativeName: 'isiZulu', region: 'South Africa' },
];

/**
 * Get a language object by its BCP 47 code
 * 
 * @param {string} code - The BCP 47 language code to search for
 * @returns {Language | undefined} The language object if found, undefined otherwise
 * 
 * @example
 * const spanish = getLanguageByCode('es');
 * console.log(spanish?.nativeName); // "Español"
 */
export const getLanguageByCode = (code: string): Language | undefined => {
  return LANGUAGES.find(lang => lang.code === code);
};

/**
 * Get the display name for a language in the format "Native Name (English Name)"
 * If the native name and English name are the same, returns just the name.
 * 
 * @param {Language} language - The language object
 * @returns {string} Formatted display name
 * 
 * @example
 * const spanish = getLanguageByCode('es');
 * console.log(getLanguageDisplayName(spanish)); // "Español (Spanish)"
 * 
 * const english = getLanguageByCode('en');
 * console.log(getLanguageDisplayName(english)); // "English"
 */
export const getLanguageDisplayName = (language: Language): string => {
  if (language.nativeName === language.name) {
    return language.name;
  }
  return `${language.nativeName} (${language.name})`;
};

/**
 * Get all language codes as a simple array
 * 
 * @returns {string[]} Array of BCP 47 language codes
 * 
 * @example
 * const codes = getLanguageCodes();
 * console.log(codes.includes('qu')); // true
 */
export const getLanguageCodes = (): string[] => {
  return LANGUAGES.map(lang => lang.code);
};

/**
 * Filter languages by region
 * 
 * @param {string} region - The region to filter by
 * @returns {Language[]} Array of languages in the specified region
 * 
 * @example
 * const southAmericanLanguages = getLanguagesByRegion('South America');
 * console.log(southAmericanLanguages.length); // Number of South American languages
 */
export const getLanguagesByRegion = (region: string): Language[] => {
  return LANGUAGES.filter(lang => lang.region === region);
};

/**
 * Search languages by name (both English and native names)
 * 
 * @param {string} query - The search query
 * @returns {Language[]} Array of matching languages
 * 
 * @example
 * const spanishLanguages = searchLanguages('spanish');
 * console.log(spanishLanguages.length); // All Spanish variants
 */
export const searchLanguages = (query: string): Language[] => {
  const lowercaseQuery = query.toLowerCase();
  return LANGUAGES.filter(lang => 
    lang.name.toLowerCase().includes(lowercaseQuery) ||
    lang.nativeName.toLowerCase().includes(lowercaseQuery) ||
    lang.code.toLowerCase().includes(lowercaseQuery)
  );
};

/**
 * Validate if a language code exists in our supported languages
 * 
 * @param {string} code - The BCP 47 language code to validate
 * @returns {boolean} True if the language code is supported
 * 
 * @example
 * console.log(isValidLanguageCode('qu')); // true
 * console.log(isValidLanguageCode('xyz')); // false
 */
export const isValidLanguageCode = (code: string): boolean => {
  return LANGUAGES.some(lang => lang.code === code);
};

/**
 * Get languages sorted alphabetically by display name
 * 
 * @returns {Language[]} Array of languages sorted by display name
 * 
 * @example
 * const sortedLanguages = getLanguagesSortedByDisplayName();
 * // Languages will be sorted by their display names
 */
export const getLanguagesSortedByDisplayName = (): Language[] => {
  return [...LANGUAGES].sort((a, b) => {
    const displayA = getLanguageDisplayName(a);
    const displayB = getLanguageDisplayName(b);
    return displayA.localeCompare(displayB);
  });
};

export default LANGUAGES;