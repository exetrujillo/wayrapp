/**
 * Forms Module Exports
 * 
 * This module exports all form-related components and utilities.
 * 
 * @module Forms
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

// Main form components
export { default as ExerciseForm } from './ExerciseForm';
export { default as DynamicExerciseForm } from './DynamicExerciseForm';
export { default as UnifiedEntityForm } from './UnifiedEntityForm';

// Exercise type-specific forms
export { default as TranslationExerciseForm } from './exercise-types/TranslationExerciseForm';
export { default as FillInTheBlankExerciseForm } from './exercise-types/FillInTheBlankExerciseForm';
export { default as VOFExerciseForm } from './exercise-types/VOFExerciseForm';
export { default as PairsExerciseForm } from './exercise-types/PairsExerciseForm';
export { default as InformativeExerciseForm } from './exercise-types/InformativeExerciseForm';
export { default as OrderingExerciseForm } from './exercise-types/OrderingExerciseForm';

// Exercise utilities
export { default as ExercisePreview } from './ExercisePreview';
export { default as ExerciseTemplates } from './ExerciseTemplates';
export { default as ExerciseValidation } from './ExerciseValidation';

// Form utilities and constants
export { default as FormConstants } from './FormConstants';
export { default as FormUtils } from './FormUtils';
export { default as FormHooks } from './FormHooks';

// Other form components
export { default as AutoSaveProvider } from './AutoSaveProvider';
export { default as DynamicFieldGenerator } from './DynamicFieldGenerator';
export { default as FormWrapper } from './FormWrapper';

// Simple form components
export { default as SimpleLessonForm } from './SimpleLessonForm';
export { default as SimpleLevelForm } from './SimpleLevelForm';
export { default as SimpleModuleForm } from './SimpleModuleForm';
export { default as SimpleSectionForm } from './SimpleSectionForm';

// Legacy form components (for backward compatibility)
export { default as ExerciseAssignmentForm } from './ExerciseAssignmentForm';
export { default as FormStateManager } from './FormStateManager';

// Type definitions
export type { DynamicExerciseFormProps } from './DynamicExerciseForm';
export type { ExercisePreviewProps } from './ExercisePreview';
export type { ExerciseTemplatesProps } from './ExerciseTemplates';