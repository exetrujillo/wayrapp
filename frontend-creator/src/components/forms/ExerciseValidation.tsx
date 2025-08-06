/**
 * Exercise Validation Component and Utilities
 * 
 * This module provides comprehensive validation for different exercise types,
 * including type-specific validation rules and real-time feedback.
 * 
 * @module ExerciseValidation
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { ExerciseType } from '../../utils/types';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  score: number; // 0-100, quality score
}

// ============================================================================
// Validation Rules
// ============================================================================

const VALIDATION_RULES = {
  translation: {
    required: ['source_text', 'target_text'],
    minLength: {
      source_text: 1,
      target_text: 1,
    },
    maxLength: {
      source_text: 1000,
      target_text: 1000,
      hints: 200, // per hint
    },
    custom: {
      maxHints: 5,
      minSourceWords: 1,
      maxSourceWords: 100,
    },
  },
  'fill-in-the-blank': {
    required: ['text', 'blanks'],
    minLength: {
      text: 1,
    },
    maxLength: {
      text: 1000,
    },
    custom: {
      minBlanks: 1,
      maxBlanks: 10,
      maxAnswersPerBlank: 5,
      maxHintsPerBlank: 3,
    },
  },
  vof: {
    required: ['statement', 'is_true'],
    minLength: {
      statement: 1,
    },
    maxLength: {
      statement: 1000,
      explanation: 500,
    },
  },
  pairs: {
    required: ['pairs'],
    custom: {
      minPairs: 2,
      maxPairs: 10,
    },
  },
  informative: {
    required: ['title', 'content'],
    minLength: {
      title: 1,
      content: 1,
    },
    maxLength: {
      title: 200,
      content: 5000,
    },
  },
  ordering: {
    required: ['items'],
    custom: {
      minItems: 2,
      maxItems: 10,
    },
  },
  'translation-word-bank': {
    required: ['source_text', 'target_text', 'word_bank', 'correct_words'],
    custom: {
      minWords: 1,
      maxWords: 20,
      maxSentenceWords: 15,
      minDistractors: 1,
    },
  },
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validates translation exercise data
 */
const validateTranslationExercise = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  const rules = VALIDATION_RULES.translation;

  // Required fields
  if (!data.source_text || data.source_text.trim().length === 0) {
    errors.push({
      field: 'source_text',
      message: 'Source text is required',
      severity: 'error',
    });
  }

  if (!data.target_text || data.target_text.trim().length === 0) {
    errors.push({
      field: 'target_text',
      message: 'Target text is required',
      severity: 'error',
    });
  }

  // Length validations
  if (data.source_text && data.source_text.length > rules.maxLength.source_text) {
    errors.push({
      field: 'source_text',
      message: `Source text must be ${rules.maxLength.source_text} characters or less`,
      severity: 'error',
    });
  }

  if (data.target_text && data.target_text.length > rules.maxLength.target_text) {
    errors.push({
      field: 'target_text',
      message: `Target text must be ${rules.maxLength.target_text} characters or less`,
      severity: 'error',
    });
  }

  // Hints validation
  if (data.hints && Array.isArray(data.hints)) {
    if (data.hints.length > rules.custom.maxHints) {
      errors.push({
        field: 'hints',
        message: `Maximum ${rules.custom.maxHints} hints allowed`,
        severity: 'error',
      });
    }

    data.hints.forEach((hint: string, index: number) => {
      if (hint && hint.length > rules.maxLength.hints) {
        errors.push({
          field: 'hints',
          message: `Hint ${index + 1} must be ${rules.maxLength.hints} characters or less`,
          severity: 'error',
        });
      }
    });

    // Warning for empty hints
    const emptyHints = data.hints.filter((hint: string) => !hint || hint.trim().length === 0);
    if (emptyHints.length > 0) {
      errors.push({
        field: 'hints',
        message: 'Some hints are empty and will be ignored',
        severity: 'warning',
      });
    }
  }

  // Quality checks
  if (data.source_text && data.target_text) {
    if (data.source_text.trim() === data.target_text.trim()) {
      errors.push({
        field: 'target_text',
        message: 'Target text should be different from source text',
        severity: 'warning',
      });
    }

    const sourceWords = data.source_text.trim().split(/\s+/).length;
    if (sourceWords > rules.custom.maxSourceWords) {
      errors.push({
        field: 'source_text',
        message: `Consider breaking down text with more than ${rules.custom.maxSourceWords} words`,
        severity: 'warning',
      });
    }
  }

  return errors;
};

/**
 * Validates fill-in-the-blank exercise data
 */
const validateFillInTheBlankExercise = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  const rules = VALIDATION_RULES['fill-in-the-blank'];

  // Required fields
  if (!data.text || data.text.trim().length === 0) {
    errors.push({
      field: 'text',
      message: 'Exercise text is required',
      severity: 'error',
    });
  }

  if (!data.blanks || !Array.isArray(data.blanks) || data.blanks.length === 0) {
    errors.push({
      field: 'blanks',
      message: 'At least one blank is required',
      severity: 'error',
    });
  }

  // Text validation
  if (data.text) {
    if (data.text.length > rules.maxLength.text) {
      errors.push({
        field: 'text',
        message: `Text must be ${rules.maxLength.text} characters or less`,
        severity: 'error',
      });
    }

    // Check if text contains blank markers
    const blankCount = (data.text.match(/___/g) || []).length;
    const configuredBlanks = data.blanks ? data.blanks.length : 0;

    if (blankCount === 0) {
      errors.push({
        field: 'text',
        message: 'Text must contain blank markers (___)',
        severity: 'error',
      });
    } else if (blankCount !== configuredBlanks) {
      errors.push({
        field: 'blanks',
        message: `Number of blank markers (${blankCount}) doesn't match configured blanks (${configuredBlanks})`,
        severity: 'error',
      });
    }
  }

  // Blanks validation
  if (data.blanks && Array.isArray(data.blanks)) {
    if (data.blanks.length > rules.custom.maxBlanks) {
      errors.push({
        field: 'blanks',
        message: `Maximum ${rules.custom.maxBlanks} blanks allowed`,
        severity: 'error',
      });
    }

    data.blanks.forEach((blank: any, index: number) => {
      if (!blank.correct_answers || !Array.isArray(blank.correct_answers) || blank.correct_answers.length === 0) {
        errors.push({
          field: 'blanks',
          message: `Blank ${index + 1} must have at least one correct answer`,
          severity: 'error',
        });
      } else {
        // Check for empty answers
        const emptyAnswers = blank.correct_answers.filter((answer: string) => !answer || answer.trim().length === 0);
        if (emptyAnswers.length > 0) {
          errors.push({
            field: 'blanks',
            message: `Blank ${index + 1} has empty answers`,
            severity: 'error',
          });
        }

        if (blank.correct_answers.length > rules.custom.maxAnswersPerBlank) {
          errors.push({
            field: 'blanks',
            message: `Blank ${index + 1} has too many answers (max ${rules.custom.maxAnswersPerBlank})`,
            severity: 'warning',
          });
        }
      }

      // Hints validation
      if (blank.hints && Array.isArray(blank.hints)) {
        if (blank.hints.length > rules.custom.maxHintsPerBlank) {
          errors.push({
            field: 'blanks',
            message: `Blank ${index + 1} has too many hints (max ${rules.custom.maxHintsPerBlank})`,
            severity: 'warning',
          });
        }
      }
    });
  }

  return errors;
};

/**
 * Validates true/false exercise data
 */
const validateVOFExercise = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  const rules = VALIDATION_RULES.vof;

  // Required fields
  if (!data.statement || data.statement.trim().length === 0) {
    errors.push({
      field: 'statement',
      message: 'Statement is required',
      severity: 'error',
    });
  }

  if (data.is_true === null || data.is_true === undefined) {
    errors.push({
      field: 'is_true',
      message: 'Please select whether the statement is true or false',
      severity: 'error',
    });
  }

  // Length validations
  if (data.statement && data.statement.length > rules.maxLength.statement) {
    errors.push({
      field: 'statement',
      message: `Statement must be ${rules.maxLength.statement} characters or less`,
      severity: 'error',
    });
  }

  if (data.explanation && data.explanation.length > rules.maxLength.explanation) {
    errors.push({
      field: 'explanation',
      message: `Explanation must be ${rules.maxLength.explanation} characters or less`,
      severity: 'error',
    });
  }

  // Quality checks
  if (!data.explanation || data.explanation.trim().length === 0) {
    errors.push({
      field: 'explanation',
      message: 'Adding an explanation helps students understand the answer',
      severity: 'info',
    });
  }

  return errors;
};

/**
 * Validates pairs exercise data
 */
const validatePairsExercise = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  const rules = VALIDATION_RULES.pairs;

  // Required fields
  if (!data.pairs || !Array.isArray(data.pairs) || data.pairs.length === 0) {
    errors.push({
      field: 'pairs',
      message: 'At least two pairs are required',
      severity: 'error',
    });
    return errors;
  }

  // Pairs count validation
  if (data.pairs.length < rules.custom.minPairs) {
    errors.push({
      field: 'pairs',
      message: `At least ${rules.custom.minPairs} pairs are required`,
      severity: 'error',
    });
  }

  if (data.pairs.length > rules.custom.maxPairs) {
    errors.push({
      field: 'pairs',
      message: `Maximum ${rules.custom.maxPairs} pairs allowed`,
      severity: 'warning',
    });
  }

  // Individual pair validation
  data.pairs.forEach((pair: any, index: number) => {
    if (!pair.left || pair.left.trim().length === 0) {
      errors.push({
        field: 'pairs',
        message: `Pair ${index + 1} left item is required`,
        severity: 'error',
      });
    }

    if (!pair.right || pair.right.trim().length === 0) {
      errors.push({
        field: 'pairs',
        message: `Pair ${index + 1} right item is required`,
        severity: 'error',
      });
    }
  });

  // Check for duplicates
  const leftItems = data.pairs.map((pair: any) => pair.left?.trim().toLowerCase()).filter(Boolean);
  const rightItems = data.pairs.map((pair: any) => pair.right?.trim().toLowerCase()).filter(Boolean);

  const leftDuplicates = leftItems.filter((item: string, index: number) => leftItems.indexOf(item) !== index);
  const rightDuplicates = rightItems.filter((item: string, index: number) => rightItems.indexOf(item) !== index);

  if (leftDuplicates.length > 0) {
    errors.push({
      field: 'pairs',
      message: 'Duplicate items found in left column',
      severity: 'warning',
    });
  }

  if (rightDuplicates.length > 0) {
    errors.push({
      field: 'pairs',
      message: 'Duplicate items found in right column',
      severity: 'warning',
    });
  }

  return errors;
};

/**
 * Validates informative exercise data
 */
const validateInformativeExercise = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  const rules = VALIDATION_RULES.informative;

  // Required fields
  if (!data.title || data.title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: 'Title is required',
      severity: 'error',
    });
  }

  if (!data.content || data.content.trim().length === 0) {
    errors.push({
      field: 'content',
      message: 'Content is required',
      severity: 'error',
    });
  }

  // Length validations
  if (data.title && data.title.length > rules.maxLength.title) {
    errors.push({
      field: 'title',
      message: `Title must be ${rules.maxLength.title} characters or less`,
      severity: 'error',
    });
  }

  if (data.content && data.content.length > rules.maxLength.content) {
    errors.push({
      field: 'content',
      message: `Content must be ${rules.maxLength.content} characters or less`,
      severity: 'error',
    });
  }

  // Media validation
  if (data.media) {
    if (!data.media.type || !['image', 'video', 'audio'].includes(data.media.type)) {
      errors.push({
        field: 'media',
        message: 'Invalid media type',
        severity: 'error',
      });
    }

    if (!data.media.url || data.media.url.trim().length === 0) {
      errors.push({
        field: 'media',
        message: 'Media URL is required',
        severity: 'error',
      });
    } else {
      // Basic URL validation
      try {
        new URL(data.media.url);
      } catch {
        errors.push({
          field: 'media',
          message: 'Invalid media URL format',
          severity: 'error',
        });
      }
    }

    // Alt text for images
    if (data.media.type === 'image' && (!data.media.alt || data.media.alt.trim().length === 0)) {
      errors.push({
        field: 'media',
        message: 'Alt text is recommended for images (accessibility)',
        severity: 'info',
      });
    }
  }

  return errors;
};

/**
 * Validates ordering exercise data
 */
const validateOrderingExercise = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  const rules = VALIDATION_RULES.ordering;

  // Required fields
  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    errors.push({
      field: 'items',
      message: 'At least two items are required',
      severity: 'error',
    });
    return errors;
  }

  // Items count validation
  if (data.items.length < rules.custom.minItems) {
    errors.push({
      field: 'items',
      message: `At least ${rules.custom.minItems} items are required`,
      severity: 'error',
    });
  }

  if (data.items.length > rules.custom.maxItems) {
    errors.push({
      field: 'items',
      message: `Maximum ${rules.custom.maxItems} items allowed`,
      severity: 'warning',
    });
  }

  // Individual item validation
  data.items.forEach((item: any, index: number) => {
    if (!item.text || item.text.trim().length === 0) {
      errors.push({
        field: 'items',
        message: `Item ${index + 1} text is required`,
        severity: 'error',
      });
    }
  });

  // Check for duplicates
  const itemTexts = data.items.map((item: any) => item.text?.trim().toLowerCase()).filter(Boolean);
  const duplicates = itemTexts.filter((text: string, index: number) => itemTexts.indexOf(text) !== index);

  if (duplicates.length > 0) {
    errors.push({
      field: 'items',
      message: 'Duplicate items found',
      severity: 'warning',
    });
  }

  return errors;
};

/**
 * Validates translation word bank exercise data
 */
const validateTranslationWordBankExercise = (data: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  const rules = VALIDATION_RULES['translation-word-bank'];

  // Required fields
  if (!data.source_text || data.source_text.trim().length === 0) {
    errors.push({
      field: 'source_text',
      message: 'Source text is required',
      severity: 'error',
    });
  }

  if (!data.target_text || data.target_text.trim().length === 0) {
    errors.push({
      field: 'target_text',
      message: 'Target text is required',
      severity: 'error',
    });
  }

  if (!data.word_bank || !Array.isArray(data.word_bank) || data.word_bank.length === 0) {
    errors.push({
      field: 'word_bank',
      message: 'Word bank is required',
      severity: 'error',
    });
    return errors;
  }

  if (!data.correct_words || !Array.isArray(data.correct_words) || data.correct_words.length === 0) {
    errors.push({
      field: 'correct_words',
      message: 'Correct words are required',
      severity: 'error',
    });
    return errors;
  }

  // Filter out empty words
  const validWords = data.word_bank.filter((word: string) => word && word.trim().length > 0);
  const validCorrectWords = data.correct_words.filter((word: string) => word && word.trim().length > 0);

  // Word bank count validation
  if (validWords.length < rules.custom.minWords) {
    errors.push({
      field: 'word_bank',
      message: `At least ${rules.custom.minWords} word(s) are required in the word bank`,
      severity: 'error',
    });
  }

  if (validWords.length > rules.custom.maxWords) {
    errors.push({
      field: 'word_bank',
      message: `Maximum ${rules.custom.maxWords} words allowed in the word bank`,
      severity: 'warning',
    });
  }

  // Correct words validation
  if (validCorrectWords.length < rules.custom.minWords) {
    errors.push({
      field: 'correct_words',
      message: `At least ${rules.custom.minWords} correct word(s) are required`,
      severity: 'error',
    });
  }

  // Check if all correct words are in the word bank
  const missingWords = validCorrectWords.filter((word: string) =>
    !validWords.some((bankWord: string) => bankWord.trim().toLowerCase() === word.trim().toLowerCase())
  );

  if (missingWords.length > 0) {
    errors.push({
      field: 'word_bank',
      message: `Correct words not found in word bank: ${missingWords.join(', ')}`,
      severity: 'error',
    });
  }

  // Distractor words validation
  const distractorCount = validWords.length - validCorrectWords.length;
  if (distractorCount < rules.custom.minDistractors) {
    errors.push({
      field: 'word_bank',
      message: `At least ${rules.custom.minDistractors} distractor word(s) recommended`,
      severity: 'warning',
    });
  }

  // Sentence length validation
  if (data.source_text) {
    const sourceWordCount = data.source_text.trim().split(/\s+/).filter(Boolean).length;
    if (sourceWordCount > rules.custom.maxSentenceWords) {
      errors.push({
        field: 'source_text',
        message: `Source text should have maximum ${rules.custom.maxSentenceWords} words for word bank exercises`,
        severity: 'warning',
      });
    }
  }

  if (data.target_text) {
    const targetWordCount = data.target_text.trim().split(/\s+/).filter(Boolean).length;
    if (targetWordCount > rules.custom.maxSentenceWords) {
      errors.push({
        field: 'target_text',
        message: `Target text should have maximum ${rules.custom.maxSentenceWords} words for word bank exercises`,
        severity: 'warning',
      });
    }
  }

  // Check for duplicate words in word bank
  const wordTexts = validWords.map((word: string) => word.trim().toLowerCase());
  const duplicates = wordTexts.filter((word: string, index: number) => wordTexts.indexOf(word) !== index);

  if (duplicates.length > 0) {
    errors.push({
      field: 'word_bank',
      message: 'Duplicate words found in word bank',
      severity: 'warning',
    });
  }

  // Same text warning
  if (data.source_text && data.target_text &&
    data.source_text.trim().toLowerCase() === data.target_text.trim().toLowerCase()) {
    errors.push({
      field: 'target_text',
      message: 'Source and target text should be different for translation exercises',
      severity: 'warning',
    });
  }

  return errors;
};

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validates exercise data based on exercise type
 */
export const validateExerciseData = async (
  exerciseType: ExerciseType,
  data: any
): Promise<ValidationResult> => {
  let errors: ValidationError[] = [];

  // Type-specific validation
  switch (exerciseType) {
    case 'translation':
      errors = validateTranslationExercise(data);
      break;
    case 'translation-word-bank':
      errors = validateTranslationWordBankExercise(data);
      break;
    case 'fill-in-the-blank':
      errors = validateFillInTheBlankExercise(data);
      break;
    case 'vof':
      errors = validateVOFExercise(data);
      break;
    case 'pairs':
      errors = validatePairsExercise(data);
      break;
    case 'informative':
      errors = validateInformativeExercise(data);
      break;
    case 'ordering':
      errors = validateOrderingExercise(data);
      break;
    default:
      errors.push({
        field: 'exerciseType',
        message: 'Unsupported exercise type',
        severity: 'error',
      });
  }

  // Separate errors and warnings
  const actualErrors = errors.filter(e => e.severity === 'error');
  const warnings = errors.filter(e => e.severity === 'warning' || e.severity === 'info');

  // Calculate quality score
  const score = calculateQualityScore(exerciseType, data, errors);

  return {
    isValid: actualErrors.length === 0,
    errors: actualErrors,
    warnings,
    score,
  };
};

/**
 * Calculates a quality score for the exercise (0-100)
 */
const calculateQualityScore = (
  exerciseType: ExerciseType,
  data: any,
  errors: ValidationError[]
): number => {
  let score = 100;

  // Deduct points for errors and warnings
  errors.forEach(error => {
    switch (error.severity) {
      case 'error':
        score -= 20;
        break;
      case 'warning':
        score -= 10;
        break;
      case 'info':
        score -= 5;
        break;
    }
  });

  // Type-specific quality bonuses
  switch (exerciseType) {
    case 'translation':
      if (data.hints && data.hints.length > 0) score += 5;
      if (data.source_text && data.target_text) {
        const sourceWords = data.source_text.trim().split(/\s+/).length;
        if (sourceWords >= 3 && sourceWords <= 20) score += 5; // Good length
      }
      break;
    case 'translation-word-bank':
      if (data.word_bank && data.correct_words) {
        const validWords = data.word_bank.filter((word: string) => word && word.trim().length > 0);
        const validCorrectWords = data.correct_words.filter((word: string) => word && word.trim().length > 0);
        const distractorCount = validWords.length - validCorrectWords.length;

        // Bonus for having good number of distractors
        if (distractorCount >= 3 && distractorCount <= 8) score += 10;

        // Bonus for appropriate sentence length
        if (data.source_text && data.target_text) {
          const sourceWords = data.source_text.trim().split(/\s+/).length;
          const targetWords = data.target_text.trim().split(/\s+/).length;
          if (sourceWords >= 3 && sourceWords <= 10 && targetWords >= 3 && targetWords <= 10) {
            score += 5;
          }
        }
      }
      break;
    case 'fill-in-the-blank':
      if (data.blanks && data.blanks.some((blank: any) => blank.hints && blank.hints.length > 0)) {
        score += 5;
      }
      break;
    case 'vof':
      if (data.explanation && data.explanation.trim().length > 0) score += 10;
      break;
    case 'informative':
      if (data.media) score += 10;
      break;
  }

  return Math.max(0, Math.min(100, score));
};

// ============================================================================
// Export Validation Utilities
// ============================================================================

export const ExerciseValidation = {
  validateExerciseData,
  VALIDATION_RULES,
};

export default ExerciseValidation;