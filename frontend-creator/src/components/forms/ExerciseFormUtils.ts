/**
 * Exercise Form Utilities
 * 
 * This module provides utilities for exercise forms to eliminate
 * duplicate logic in exercise type-specific components.
 * 
 * @module ExerciseFormUtils
 * @category Utils
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import { useCallback } from 'react';

// ============================================================================
// Exercise Data Structures
// ============================================================================

export interface TranslationExerciseData {
  source_text: string;
  target_text: string;
  hints: string[];
}

export interface FillInTheBlankExerciseData {
  text: string;
  blanks: Array<{
    position: number;
    correctAnswers: string[];
    hints: string[];
  }>;
}

export interface VOFExerciseData {
  statement: string;
  isTrue: boolean;
  explanation: string;
}

export interface PairsExerciseData {
  pairs: Array<{
    left: string;
    right: string;
  }>;
}

export interface OrderingExerciseData {
  items: Array<{
    id: string;
    text: string;
  }>;
}

export interface InformativeExerciseData {
  title: string;
  content: string;
  media?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    alt?: string;
  };
}

export type ExerciseData = 
  | TranslationExerciseData
  | FillInTheBlankExerciseData
  | VOFExerciseData
  | PairsExerciseData
  | OrderingExerciseData
  | InformativeExerciseData;

// ============================================================================
// Default Data Creators
// ============================================================================

/**
 * Creates default data structure for each exercise type
 */
export const createDefaultExerciseData = (exerciseType: string): ExerciseData => {
  switch (exerciseType) {
    case 'translation':
      return {
        source_text: '',
        target_text: '',
        hints: [],
      };
    
    case 'fill-in-the-blank':
      return {
        text: '',
        blanks: [
          {
            position: 0,
            correctAnswers: [''],
            hints: [],
          },
        ],
      };
    
    case 'vof':
      return {
        statement: '',
        isTrue: true,
        explanation: '',
      };
    
    case 'pairs':
      return {
        pairs: [
          { left: '', right: '' },
          { left: '', right: '' },
        ],
      };
    
    case 'ordering':
      return {
        items: [
          { id: crypto.randomUUID(), text: '' },
          { id: crypto.randomUUID(), text: '' },
        ],
      };
    
    case 'informative':
      return {
        title: '',
        content: '',
      };
    
    default:
      return {} as ExerciseData;
  }
};

// ============================================================================
// Array Management Hooks
// ============================================================================

/**
 * Hook for managing hints arrays
 */
export const useHintsManager = (
  hints: string[],
  onChange: (field: string, value: any) => void,
  fieldPath: string = 'hints'
) => {
  const addHint = useCallback(() => {
    const newHints = [...hints, ''];
    onChange(fieldPath, newHints);
  }, [hints, onChange, fieldPath]);

  const updateHint = useCallback((index: number, value: string) => {
    const newHints = [...hints];
    newHints[index] = value;
    onChange(fieldPath, newHints);
  }, [hints, onChange, fieldPath]);

  const removeHint = useCallback((index: number) => {
    const newHints = hints.filter((_, i) => i !== index);
    onChange(fieldPath, newHints);
  }, [hints, onChange, fieldPath]);

  return { addHint, updateHint, removeHint };
};

/**
 * Hook for managing pairs arrays
 */
export const usePairsManager = (
  pairs: Array<{ left: string; right: string }>,
  onChange: (field: string, value: any) => void,
  fieldPath: string = 'pairs'
) => {
  const addPair = useCallback(() => {
    const newPairs = [...pairs, { left: '', right: '' }];
    onChange(fieldPath, newPairs);
  }, [pairs, onChange, fieldPath]);

  const updatePair = useCallback((index: number, side: 'left' | 'right', value: string) => {
    const newPairs = [...pairs];
    newPairs[index] = { ...newPairs[index], [side]: value };
    onChange(fieldPath, newPairs);
  }, [pairs, onChange, fieldPath]);

  const removePair = useCallback((index: number) => {
    if (pairs.length <= 2) return; // Minimum 2 pairs
    const newPairs = pairs.filter((_, i) => i !== index);
    onChange(fieldPath, newPairs);
  }, [pairs, onChange, fieldPath]);

  return { addPair, updatePair, removePair };
};

/**
 * Hook for managing ordering items arrays
 */
export const useOrderingItemsManager = (
  items: Array<{ id: string; text: string }>,
  onChange: (field: string, value: any) => void,
  fieldPath: string = 'items'
) => {
  const addItem = useCallback(() => {
    const newItems = [...items, { id: crypto.randomUUID(), text: '' }];
    onChange(fieldPath, newItems);
  }, [items, onChange, fieldPath]);

  const updateItem = useCallback((index: number, text: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], text };
    onChange(fieldPath, newItems);
  }, [items, onChange, fieldPath]);

  const removeItem = useCallback((index: number) => {
    if (items.length <= 2) return; // Minimum 2 items
    const newItems = items.filter((_, i) => i !== index);
    onChange(fieldPath, newItems);
  }, [items, onChange, fieldPath]);

  const moveItem = useCallback((fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    onChange(fieldPath, newItems);
  }, [items, onChange, fieldPath]);

  return { addItem, updateItem, removeItem, moveItem };
};

/**
 * Hook for managing fill-in-the-blank blanks
 */
export const useBlanksManager = (
  blanks: Array<{ position: number; correctAnswers: string[]; hints: string[] }>,
  onChange: (field: string, value: any) => void,
  fieldPath: string = 'blanks'
) => {
  const addBlank = useCallback(() => {
    const newBlanks = [
      ...blanks,
      {
        position: blanks.length,
        correctAnswers: [''],
        hints: [],
      },
    ];
    onChange(fieldPath, newBlanks);
  }, [blanks, onChange, fieldPath]);

  const removeBlank = useCallback((index: number) => {
    const newBlanks = blanks.filter((_, i) => i !== index);
    // Update positions
    newBlanks.forEach((blank, i) => {
      blank.position = i;
    });
    onChange(fieldPath, newBlanks);
  }, [blanks, onChange, fieldPath]);

  const addAnswer = useCallback((blankIndex: number) => {
    const newBlanks = [...blanks];
    newBlanks[blankIndex] = {
      ...newBlanks[blankIndex],
      correctAnswers: [...newBlanks[blankIndex].correctAnswers, ''],
    };
    onChange(fieldPath, newBlanks);
  }, [blanks, onChange, fieldPath]);

  const updateAnswer = useCallback((blankIndex: number, answerIndex: number, value: string) => {
    const newBlanks = [...blanks];
    const newAnswers = [...newBlanks[blankIndex].correctAnswers];
    newAnswers[answerIndex] = value;
    newBlanks[blankIndex] = {
      ...newBlanks[blankIndex],
      correctAnswers: newAnswers,
    };
    onChange(fieldPath, newBlanks);
  }, [blanks, onChange, fieldPath]);

  const removeAnswer = useCallback((blankIndex: number, answerIndex: number) => {
    const newBlanks = [...blanks];
    const newAnswers = newBlanks[blankIndex].correctAnswers.filter((_, i) => i !== answerIndex);
    newBlanks[blankIndex] = {
      ...newBlanks[blankIndex],
      correctAnswers: newAnswers,
    };
    onChange(fieldPath, newBlanks);
  }, [blanks, onChange, fieldPath]);

  const addBlankHint = useCallback((blankIndex: number) => {
    const newBlanks = [...blanks];
    newBlanks[blankIndex] = {
      ...newBlanks[blankIndex],
      hints: [...newBlanks[blankIndex].hints, ''],
    };
    onChange(fieldPath, newBlanks);
  }, [blanks, onChange, fieldPath]);

  const updateBlankHint = useCallback((blankIndex: number, hintIndex: number, value: string) => {
    const newBlanks = [...blanks];
    const newHints = [...newBlanks[blankIndex].hints];
    newHints[hintIndex] = value;
    newBlanks[blankIndex] = {
      ...newBlanks[blankIndex],
      hints: newHints,
    };
    onChange(fieldPath, newBlanks);
  }, [blanks, onChange, fieldPath]);

  const removeBlankHint = useCallback((blankIndex: number, hintIndex: number) => {
    const newBlanks = [...blanks];
    const newHints = newBlanks[blankIndex].hints.filter((_, i) => i !== hintIndex);
    newBlanks[blankIndex] = {
      ...newBlanks[blankIndex],
      hints: newHints,
    };
    onChange(fieldPath, newBlanks);
  }, [blanks, onChange, fieldPath]);

  return {
    addBlank,
    removeBlank,
    addAnswer,
    updateAnswer,
    removeAnswer,
    addBlankHint,
    updateBlankHint,
    removeBlankHint,
  };
};

// ============================================================================
// Exercise Preview Utilities
// ============================================================================

/**
 * Gets a preview text for an exercise based on its type and data
 */
export const getExercisePreview = (exerciseType: string, data: any): string => {
  if (!data) return 'No data provided';

  switch (exerciseType) {
    case 'translation':
      return data.source_text || 'No source text provided';
    
    case 'fill-in-the-blank':
      return data.text || 'No text provided';
    
    case 'vof':
      return data.statement || 'No statement provided';
    
    case 'pairs':
      const pairCount = data.pairs?.length || 0;
      return `${pairCount} pair${pairCount !== 1 ? 's' : ''}`;
    
    case 'ordering':
      const itemCount = data.items?.length || 0;
      return `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
    
    case 'informative':
      return data.title || data.content || 'No content provided';
    
    default:
      return 'Unknown exercise type';
  }
};

/**
 * Gets the display name for an exercise type
 */
export const getExerciseTypeName = (exerciseType: string, t?: any): string => {
  const typeMap: Record<string, string> = {
    translation: t?.('creator.exerciseTypes.translation', 'Translation') || 'Translation',
    'fill-in-the-blank': t?.('creator.exerciseTypes.fillInTheBlank', 'Fill in the Blank') || 'Fill in the Blank',
    vof: t?.('creator.exerciseTypes.vof', 'True/False') || 'True/False',
    pairs: t?.('creator.exerciseTypes.pairs', 'Matching Pairs') || 'Matching Pairs',
    informative: t?.('creator.exerciseTypes.informative', 'Informative') || 'Informative',
    ordering: t?.('creator.exerciseTypes.ordering', 'Ordering') || 'Ordering',
  };

  return typeMap[exerciseType] || exerciseType;
};

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validates exercise data based on type
 */
export const validateExerciseData = (exerciseType: string, data: any): string[] => {
  const errors: string[] = [];

  switch (exerciseType) {
    case 'translation':
      if (!data.source_text?.trim()) {
        errors.push('Source text is required');
      }
      if (!data.target_text?.trim()) {
        errors.push('Target text is required');
      }
      break;
    
    case 'fill-in-the-blank':
      if (!data.text?.trim()) {
        errors.push('Text is required');
      }
      if (!data.blanks || data.blanks.length === 0) {
        errors.push('At least one blank is required');
      } else {
        data.blanks.forEach((blank: any, index: number) => {
          if (!blank.correctAnswers || blank.correctAnswers.length === 0 || !blank.correctAnswers[0]?.trim()) {
            errors.push(`Blank ${index + 1} must have at least one correct answer`);
          }
        });
      }
      break;
    
    case 'vof':
      if (!data.statement?.trim()) {
        errors.push('Statement is required');
      }
      break;
    
    case 'pairs':
      if (!data.pairs || data.pairs.length < 2) {
        errors.push('At least 2 pairs are required');
      } else {
        data.pairs.forEach((pair: any, index: number) => {
          if (!pair.left?.trim() || !pair.right?.trim()) {
            errors.push(`Pair ${index + 1} must have both left and right values`);
          }
        });
      }
      break;
    
    case 'ordering':
      if (!data.items || data.items.length < 2) {
        errors.push('At least 2 items are required');
      } else {
        data.items.forEach((item: any, index: number) => {
          if (!item.text?.trim()) {
            errors.push(`Item ${index + 1} text is required`);
          }
        });
      }
      break;
    
    case 'informative':
      if (!data.title?.trim() && !data.content?.trim()) {
        errors.push('Either title or content is required');
      }
      break;
  }

  return errors;
};

export default {
  createDefaultExerciseData,
  useHintsManager,
  usePairsManager,
  useOrderingItemsManager,
  useBlanksManager,
  getExercisePreview,
  getExerciseTypeName,
  validateExerciseData,
};