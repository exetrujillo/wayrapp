// ============================================================================
// NEW UNIFIED FORM SYSTEM (Recommended - Eliminates Duplicates)
// ============================================================================

// Main unified form component that replaces all Enhanced*Form components
export { 
  UnifiedEntityForm, 
  CourseForm as UnifiedCourseForm, 
  LevelForm as UnifiedLevelForm, 
  SectionForm as UnifiedSectionForm, 
  ModuleForm as UnifiedModuleForm, 
  LessonForm as UnifiedLessonForm 
} from './UnifiedEntityForm';

// Form utilities and constants (eliminates duplicate configurations)
export { 
  LANGUAGE_OPTIONS,
  MODULE_TYPE_OPTIONS,
  EXERCISE_TYPE_OPTIONS,
  FIELD_CONSTRAINTS,
  AUTO_SAVE_CONFIG,
  DEFAULT_VALUES
} from './FormConstants';

export { 
  useFormState,
  useFormSubmission,
  useArrayField,
  useFormValidation,
  useAutoSave
} from './FormHooks';

export { 
  getEntityFields,
  createInitialValues,
  validateLanguageDifference,
  generateIdFromName
} from './FormUtils';

export {
  createDefaultExerciseData,
  useHintsManager,
  usePairsManager,
  useOrderingItemsManager,
  useBlanksManager,
  getExercisePreview,
  getExerciseTypeName
} from './ExerciseFormUtils';

// ============================================================================
// LEGACY UNIFIED FORM SYSTEM (Deprecated - Use UnifiedEntityForm instead)
// ============================================================================

// Enhanced forms using the old unified system (DELETED - use UnifiedEntityForm instead)
// export { default as EnhancedCourseForm } from './EnhancedCourseForm'; // DELETED - use UnifiedCourseForm
// export { default as EnhancedLevelForm } from './EnhancedLevelForm'; // DELETED - use UnifiedLevelForm  
// export { default as EnhancedSectionForm } from './EnhancedSectionForm'; // DELETED - use UnifiedSectionForm
// export { default as EnhancedModuleForm } from './EnhancedModuleForm'; // DELETED - use UnifiedModuleForm
// export { default as EnhancedLessonForm } from './EnhancedLessonForm'; // DELETED - use UnifiedLessonForm

// Legacy components have been deleted - use UnifiedEntityForm instead

// ============================================================================
// LEGACY FORMS - Deprecated, use unified system instead
// ============================================================================

export { default as LegacyExerciseForm } from './ExerciseForm';
export { default as ExerciseAssignmentForm } from './ExerciseAssignmentForm';
export { default as FormWrapper } from './FormWrapper';