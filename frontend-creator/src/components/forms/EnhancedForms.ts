/**
 * Enhanced Forms Index
 * 
 * This module exports all the enhanced form components that use the
 * DRY DynamicForm architecture. These forms replace the individual
 * entity-specific forms and provide a consistent, maintainable approach
 * to form management across the application.
 * 
 * @module EnhancedForms
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

// Enhanced form components using DynamicForm
export { EnhancedCourseForm } from './EnhancedCourseForm';
export { EnhancedLevelForm } from './EnhancedLevelForm';
export { EnhancedSectionForm } from './EnhancedSectionForm';
export { EnhancedModuleForm } from './EnhancedModuleForm';
export { EnhancedLessonForm } from './EnhancedLessonForm';

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

// Remaining forms (not yet migrated to DynamicForm)
export { ExerciseForm } from './ExerciseForm';

/**
 * Migration guide for developers:
 * 
 * OLD APPROACH:
 * import { LevelForm } from './forms/LevelForm';
 * <LevelForm courseId={courseId} onSubmit={handleSubmit} />
 * 
 * NEW APPROACH:
 * import { EnhancedLevelForm } from './forms/EnhancedForms';
 * <EnhancedLevelForm courseId={courseId} onSubmit={handleSubmit} />
 * 
 * OR DIRECT DYNAMIC FORM:
 * import { DynamicForm } from './forms/EnhancedForms';
 * <DynamicForm entityType="level" onSubmit={handleSubmit} />
 */