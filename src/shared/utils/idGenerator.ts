/**
 * Server-side ID generation utilities for automatic content ID creation from names.
 * 
 * This module provides backend ID generation functionality that converts human-readable
 * names into URL-safe, database-compatible identifiers. It mirrors the frontend
 * implementation but is optimized for server-side use with additional validation
 * and database constraint awareness.
 * 
 * @module IdGenerator
 * @category Utils
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Generate course ID from name
 * const courseId = generateIdFromName('Advanced Spanish Grammar', 20);
 * // Result: "adva-span-gram"
 */

/**
 * Maximum lengths for different entity types based on database schema constraints.
 */
export const ID_MAX_LENGTHS = {
  COURSE: 20,
  LEVEL: 30,
  SECTION: 40,
  MODULE: 50,
  LESSON: 60,
  EXERCISE: 15,
} as const;

/**
 * Configuration options for ID generation behavior.
 */
export interface IdGenerationOptions {
  /** Maximum length for the generated ID */
  maxLength: number;
  /** Whether to preserve word boundaries when truncating */
  preserveWords?: boolean;
  /** Minimum word length to include (shorter words are skipped) */
  minWordLength?: number;
  /** Maximum number of words to include */
  maxWords?: number;
  /** Custom separator between words (default: '-') */
  separator?: string;
}

/**
 * Default configuration for ID generation.
 */
const DEFAULT_OPTIONS: Required<Omit<IdGenerationOptions, 'maxLength'>> = {
  preserveWords: true,
  minWordLength: 2,
  maxWords: 6,
  separator: '-',
};

/**
 * Generates a URL-safe, database-compatible ID from a human-readable name.
 * 
 * @param {string} name - The human-readable name to convert to an ID
 * @param {number} maxLength - Maximum length for the generated ID
 * @param {Partial<IdGenerationOptions>} [options] - Additional configuration options
 * @returns {string} Generated ID that matches BCP 47 pattern requirements
 */
export function generateIdFromName(
  name: string,
  maxLength: number,
  options: Partial<IdGenerationOptions> = {}
): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Name must be a non-empty string');
  }

  if (maxLength < 1) {
    throw new Error('Maximum length must be at least 1');
  }

  const config = { ...DEFAULT_OPTIONS, ...options, maxLength };

  // Step 1: Normalize and clean the input
  let processed = name
    .toLowerCase()
    .trim()
    // Normalize Unicode characters (decompose accented characters)
    .normalize('NFD')
    // Remove diacritics (accent marks)
    .replace(/[\u0300-\u036f]/g, '')
    // Replace common special characters with spaces
    .replace(/[&+]/g, ' and ')
    .replace(/[@#$%^*()]/g, ' ')
    // Keep only alphanumeric characters, spaces, and hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();

  if (!processed) {
    // Fallback for names with no valid characters
    return 'item-' + Date.now().toString(36).slice(-6);
  }

  // Step 2: Split into words and filter
  const words = processed
    .split(/[\s-]+/)
    .filter(word => word.length >= config.minWordLength)
    .slice(0, config.maxWords);

  if (words.length === 0) {
    // Fallback for very short words
    return processed.replace(/[^a-z0-9]/g, '').slice(0, maxLength) || 'item';
  }

  // Step 3: Generate ID with intelligent truncation
  let result = '';
  const separatorLength = config.separator.length;
  let remainingLength = maxLength;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!word) continue; // Skip undefined words
    
    const isLastWord = i === words.length - 1;
    const needsSeparator = i > 0;
    
    // Calculate available space for this word
    let availableSpace = remainingLength;
    if (needsSeparator) {
      availableSpace -= separatorLength;
    }
    
    // If this isn't the last word, reserve space for future words and separators
    if (!isLastWord) {
      const remainingWords = words.length - i - 1;
      const minSpaceForRemainingWords = remainingWords * (config.minWordLength + separatorLength);
      availableSpace -= minSpaceForRemainingWords;
    }

    // Ensure we have at least minimum space for this word
    const minWordSpace = Math.min(word.length, config.minWordLength);
    availableSpace = Math.max(availableSpace, minWordSpace);

    if (availableSpace <= 0) {
      break; // No more space available
    }

    // Add separator if needed
    if (needsSeparator) {
      result += config.separator;
      remainingLength -= separatorLength;
    }

    // Truncate word to fit available space
    const truncatedWord = word.slice(0, Math.min(word.length, availableSpace));
    result += truncatedWord;
    remainingLength -= truncatedWord.length;

    if (remainingLength <= 0) {
      break;
    }
  }

  // Step 4: Final cleanup and validation
  result = result
    .replace(/^-+|-+$/g, '') // Remove leading/trailing separators
    .replace(/-+/g, '-') // Collapse multiple separators
    .slice(0, maxLength);

  // Ensure result is not empty and doesn't end with separator
  if (!result || result.endsWith(config.separator)) {
    result = result.replace(/-+$/, '') || 'item';
  }

  return result;
}

/**
 * Predefined ID generation configurations for different entity types.
 */
export const ENTITY_ID_CONFIGS: Record<keyof typeof ID_MAX_LENGTHS, IdGenerationOptions> = {
  COURSE: {
    maxLength: ID_MAX_LENGTHS.COURSE,
    maxWords: 3,
    minWordLength: 3,
    preserveWords: true,
  },
  LEVEL: {
    maxLength: ID_MAX_LENGTHS.LEVEL,
    maxWords: 4,
    minWordLength: 2,
    preserveWords: true,
  },
  SECTION: {
    maxLength: ID_MAX_LENGTHS.SECTION,
    maxWords: 5,
    minWordLength: 2,
    preserveWords: true,
  },
  MODULE: {
    maxLength: ID_MAX_LENGTHS.MODULE,
    maxWords: 6,
    minWordLength: 2,
    preserveWords: true,
  },
  LESSON: {
    maxLength: ID_MAX_LENGTHS.LESSON,
    maxWords: 8,
    minWordLength: 2,
    preserveWords: true,
  },
  EXERCISE: {
    maxLength: ID_MAX_LENGTHS.EXERCISE,
    maxWords: 2,
    minWordLength: 3,
    preserveWords: false, // More aggressive truncation for short IDs
  },
};

/**
 * Convenience function to generate an ID using predefined entity configurations.
 * 
 * @param {string} name - The name to convert to an ID
 * @param {keyof typeof ID_MAX_LENGTHS} entityType - The type of entity
 * @returns {string} Generated ID optimized for the entity type
 */
export function generateEntityId(
  name: string,
  entityType: keyof typeof ID_MAX_LENGTHS
): string {
  const config = ENTITY_ID_CONFIGS[entityType];
  return generateIdFromName(name, config.maxLength, config);
}

/**
 * Generates a unique ID by checking for collisions and appending numeric suffixes.
 * 
 * @param {string} name - The human-readable name to convert to an ID
 * @param {number} maxLength - Maximum length for the generated ID
 * @param {function} checkExists - Function to check if an ID already exists
 * @param {string} [parentId] - Optional parent ID for hierarchical uniqueness checking
 * @param {Partial<IdGenerationOptions>} [options] - Additional configuration options
 * @returns {Promise<string>} Promise resolving to a unique ID
 */
export async function generateUniqueId(
  name: string,
  maxLength: number,
  checkExists: (id: string, parentId?: string) => Promise<boolean>,
  parentId?: string,
  options: Partial<IdGenerationOptions> = {}
): Promise<string> {
  const baseId = generateIdFromName(name, maxLength, options);
  let candidateId = baseId;
  let suffix = 1;

  // Check if base ID is unique
  const baseExists = await checkExists(candidateId, parentId);
  if (!baseExists) {
    return candidateId;
  }

  // Generate suffixed versions until we find a unique one
  const maxSuffixLength = 4; // Allow for suffixes up to -999
  const baseMaxLength = maxLength - maxSuffixLength;

  // Ensure base ID isn't too long for suffixes
  const truncatedBase = baseId.slice(0, baseMaxLength);

  while (suffix < 1000) { // Reasonable upper limit
    suffix++;
    candidateId = `${truncatedBase}-${suffix}`;

    const exists = await checkExists(candidateId, parentId);
    if (!exists) {
      return candidateId;
    }
  }

  // Fallback: use timestamp-based ID if we can't find a unique suffix
  const timestamp = Date.now().toString(36);
  return `${truncatedBase.slice(0, maxLength - timestamp.length - 1)}-${timestamp}`;
}