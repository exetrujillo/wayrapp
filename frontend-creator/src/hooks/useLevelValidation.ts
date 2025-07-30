/**
 * Level Validation Hook
 * 
 * This hook provides enhanced validation for Level entities, including:
 * - Code uniqueness within a course
 * - Order management and validation
 * - Real-time validation feedback
 * - Integration with existing validation patterns
 * 
 * @module LevelValidation
 * @category Hooks
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * const { validateLevelCode, validateLevelOrder, isValidating } = useLevelValidation(courseId);
 * 
 * // Validate level code uniqueness
 * const codeError = await validateLevelCode('A1', existingLevelId);
 * 
 * // Validate level order
 * const orderError = await validateLevelOrder(1, existingLevelId);
 */

import { useState, useCallback } from 'react';
import { useLevelsQuery } from './useLevels';

import { useTranslation } from 'react-i18next';

/**
 * Level validation hook interface
 */
export interface UseLevelValidationReturn {
  /** Validate level code uniqueness within course */
  validateLevelCode: (code: string, excludeLevelId?: string) => Promise<string | null>;
  /** Validate level order within course */
  validateLevelOrder: (order: number, excludeLevelId?: string) => Promise<string | null>;
  /** Check if validation is in progress */
  isValidating: boolean;
  /** Get suggested next order value */
  getNextOrder: () => number;
  /** Get all existing level codes in course */
  getExistingCodes: () => string[];
  /** Get all existing level orders in course */
  getExistingOrders: () => number[];
}

/**
 * Enhanced validation hook for Level entities
 * @param courseId - The course ID to validate levels within
 * @returns Validation functions and state
 */
export const useLevelValidation = (courseId: string): UseLevelValidationReturn => {
  const { t } = useTranslation();
  const [isValidating, setIsValidating] = useState(false);
  
  // Fetch existing levels for validation
  const { data: levelsResponse } = useLevelsQuery(courseId, undefined, !!courseId);
  const existingLevels = levelsResponse?.data || [];

  /**
   * Validate level code uniqueness within the course
   */
  const validateLevelCode = useCallback(async (
    code: string, 
    excludeLevelId?: string
  ): Promise<string | null> => {
    if (!code || !code.trim()) {
      return t('creator.validation.level.codeRequired', 'Level code is required');
    }

    // Normalize code to uppercase for comparison
    const normalizedCode = code.trim().toUpperCase();
    
    // Check format
    if (!/^[A-Z0-9]+$/.test(normalizedCode)) {
      return t('creator.validation.level.codeFormat', 'Level code must contain only uppercase letters and numbers');
    }

    // Check length
    if (normalizedCode.length > 10) {
      return t('creator.validation.level.codeLength', 'Level code must be 10 characters or less');
    }

    setIsValidating(true);
    
    try {
      // Check uniqueness within course
      const isDuplicate = existingLevels.some(level => 
        level.code.toUpperCase() === normalizedCode && 
        level.id !== excludeLevelId
      );

      if (isDuplicate) {
        return t('creator.validation.level.codeDuplicate', 'A level with this code already exists in the course');
      }

      return null;
    } finally {
      setIsValidating(false);
    }
  }, [existingLevels, t]);

  /**
   * Validate level order within the course
   */
  const validateLevelOrder = useCallback(async (
    order: number, 
    excludeLevelId?: string
  ): Promise<string | null> => {
    if (typeof order !== 'number' || isNaN(order)) {
      return t('creator.validation.level.orderRequired', 'Order is required');
    }

    if (order < 1) {
      return t('creator.validation.level.orderMin', 'Order must be at least 1');
    }

    if (order > 999) {
      return t('creator.validation.level.orderMax', 'Order cannot exceed 999');
    }

    if (!Number.isInteger(order)) {
      return t('creator.validation.level.orderInteger', 'Order must be a whole number');
    }

    setIsValidating(true);
    
    try {
      // Check if order is already taken (optional warning, not error)
      const isDuplicate = existingLevels.some(level => 
        level.order === order && 
        level.id !== excludeLevelId
      );

      if (isDuplicate) {
        // This is a warning, not an error - levels can have the same order
        // The backend should handle reordering automatically
        console.warn(`Level order ${order} is already used by another level in the course`);
      }

      return null;
    } finally {
      setIsValidating(false);
    }
  }, [existingLevels, t]);

  /**
   * Get the next suggested order value
   */
  const getNextOrder = useCallback((): number => {
    if (existingLevels.length === 0) {
      return 1;
    }
    
    const maxOrder = Math.max(...existingLevels.map(level => level.order));
    return maxOrder + 1;
  }, [existingLevels]);

  /**
   * Get all existing level codes in the course
   */
  const getExistingCodes = useCallback((): string[] => {
    return existingLevels.map(level => level.code.toUpperCase());
  }, [existingLevels]);

  /**
   * Get all existing level orders in the course
   */
  const getExistingOrders = useCallback((): number[] => {
    return existingLevels.map(level => level.order).sort((a, b) => a - b);
  }, [existingLevels]);

  return {
    validateLevelCode,
    validateLevelOrder,
    isValidating,
    getNextOrder,
    getExistingCodes,
    getExistingOrders,
  };
};

export default useLevelValidation;