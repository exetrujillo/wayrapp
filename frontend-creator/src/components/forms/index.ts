// ============================================================================
// ENHANCED FORMS - DRY DynamicForm Architecture (RECOMMENDED)
// ============================================================================

export { default as EnhancedCourseForm } from './EnhancedCourseForm';
export { default as EnhancedLevelForm } from './EnhancedLevelForm';
export { default as EnhancedSectionForm } from './EnhancedSectionForm';
export { default as EnhancedModuleForm } from './EnhancedModuleForm';
export { default as EnhancedLessonForm } from './EnhancedLessonForm';

// Core DynamicForm system
export { DynamicForm, entitySchemas, entityFieldConfigs } from './DynamicForm';
export type { 
  DynamicFormProps, 
  FormField, 
  FormConfig, 
  FormLayout, 
  FormGroup, 
  AutoSaveConfig,
  FieldType 
} from './DynamicForm';

// ============================================================================
// REMAINING FORMS - Not yet migrated to DRY architecture
// ============================================================================
// These forms will be migrated in future iterations

export { default as ExerciseForm } from './ExerciseForm';
export { default as DynamicExerciseForm } from './DynamicExerciseForm';
export { default as ExerciseAssignmentForm } from './ExerciseAssignmentForm';
export { default as FormWrapper } from './FormWrapper';