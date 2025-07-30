/**
 * Dynamic Form Hook for WayrApp Creator
 * 
 * This hook provides a convenient interface for using the dynamic form system
 * with automatic integration to the CRUD hooks and cache management. It handles
 * form state, validation, submission, and auto-save functionality.
 * 
 * @module useDynamicForm
 * @category Hooks
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic usage for creating a new entity
 * const courseForm = useDynamicForm({
 *   entityType: 'course',
 *   mode: 'create',
 *   onSuccess: (course) => navigate(`/courses/${course.id}`),
 * });
 * 
 * // Usage for editing an existing entity
 * const courseForm = useDynamicForm({
 *   entityType: 'course',
 *   mode: 'edit',
 *   entityId: 'course-id',
 *   onSuccess: () => showSuccessMessage('Course updated!'),
 * });
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useCourseHooks, 
  useLevelHooks, 
  useSectionHooks, 
  useModuleHooks, 
  useLessonHooks, 
  useExerciseHooks 
} from './useCrudHooks';
import { FormConfig, FormField, entitySchemas, entityFieldConfigs } from '../components/forms/DynamicForm';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Form mode - create or edit
 */
export type FormMode = 'create' | 'edit';

/**
 * Entity types supported by the dynamic form
 */
export type EntityType = 'course' | 'level' | 'section' | 'module' | 'lesson' | 'exercise';

/**
 * Configuration for the dynamic form hook
 */
export interface UseDynamicFormConfig<T extends Record<string, any> = any> {
  /** Entity type */
  entityType: EntityType;
  /** Form mode */
  mode: FormMode;
  /** Entity ID (required for edit mode) */
  entityId?: string;
  /** Parent entity ID (for hierarchical entities) */
  parentId?: string;
  /** Initial form values */
  initialValues?: Partial<T>;
  /** Custom form fields */
  customFields?: FormField<T>[];
  /** Custom form configuration */
  customConfig?: Partial<FormConfig<T>>;
  /** Auto-save configuration */
  autoSave?: boolean;
  /** Auto-save interval in milliseconds */
  autoSaveInterval?: number;
  /** Success callback */
  onSuccess?: (data: T) => void;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Cancel callback */
  onCancel?: () => void;
}

/**
 * Return type for the dynamic form hook
 */
export interface UseDynamicFormReturn<T extends Record<string, any> = any> {
  /** Form configuration */
  formConfig: FormConfig<T>;
  /** Initial form values */
  initialValues: Partial<T>;
  /** Form submission handler */
  onSubmit: (data: T) => Promise<void>;
  /** Form cancellation handler */
  onCancel: () => void;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: string | null;
  /** Whether the entity is being loaded (edit mode) */
  entityLoading: boolean;
  /** Entity data (edit mode) */
  entityData: T | null;
  /** Auto-save configuration */
  autoSave: boolean;
  /** Auto-save interval */
  autoSaveInterval: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook for managing dynamic forms with automatic CRUD integration
 */
export function useDynamicForm<T extends Record<string, any> = any>({
  entityType,
  mode,
  entityId,
  parentId,
  initialValues = {},
  customFields,
  customConfig,
  autoSave = false,
  autoSaveInterval = 30000,
  onSuccess,
  onError,
  onCancel,
}: UseDynamicFormConfig<T>): UseDynamicFormReturn<T> {
  const navigate = useNavigate();

  // State management
  const [error, setError] = useState<string | null>(null);

  // Get appropriate CRUD hooks based on entity type
  const crudHooks = useMemo(() => {
    switch (entityType) {
      case 'course':
        return useCourseHooks();
      case 'level':
        return useLevelHooks();
      case 'section':
        return useSectionHooks();
      case 'module':
        return useModuleHooks();
      case 'lesson':
        return useLessonHooks();
      case 'exercise':
        return useExerciseHooks();
      default:
        throw new Error(`Unsupported entity type: ${entityType}`);
    }
  }, [entityType]);

  // Fetch entity data for edit mode
  const {
    data: entityResponse,
    isLoading: entityLoading,
    error: entityError,
  } = crudHooks.useGet(entityId || '', {
    enabled: mode === 'edit' && !!entityId,
  } as any);

  const entityData = entityResponse?.data || null;

  // Create mutation
  const createMutation = crudHooks.useCreate({
    onSuccess: (response) => {
      setError(null);
      onSuccess?.(response.data);
    },
    onError: (error) => {
      const errorMessage = error.message || `Failed to create ${entityType}`;
      setError(errorMessage);
      onError?.(error);
    },
  });

  // Update mutation
  const updateMutation = crudHooks.useUpdate({
    onSuccess: (response) => {
      setError(null);
      onSuccess?.(response.data);
    },
    onError: (error) => {
      const errorMessage = error.message || `Failed to update ${entityType}`;
      setError(errorMessage);
      onError?.(error);
    },
  });

  // Form configuration
  const formConfig = useMemo((): FormConfig<T> => {
    const baseSchema = entitySchemas[entityType];
    const baseFields = customFields || entityFieldConfigs[entityType] || [];

    const config: FormConfig<T> = {
      entityType,
      title: customConfig?.title || `${mode === 'create' ? 'Create' : 'Edit'} ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`,
      description: customConfig?.description || undefined,
      fields: baseFields as FormField<T>[],
      schema: baseSchema as any,
      layout: customConfig?.layout || { columns: 2 },
      autoSave: autoSave ? {
        enabled: true,
        interval: autoSaveInterval,
        onAutoSave: async (data: T) => {
          if (mode === 'edit' && entityId) {
            await updateMutation.mutateAsync({ id: entityId, data: data as Partial<T> });
          }
        },
      } : undefined,
      ...customConfig,
    };

    return config;
  }, [entityType, mode, customFields, customConfig, autoSave, autoSaveInterval, entityId, updateMutation]);

  // Initial values
  const computedInitialValues = useMemo(() => {
    let values = { ...initialValues };

    // In edit mode, use entity data as initial values
    if (mode === 'edit' && entityData) {
      values = { ...entityData, ...initialValues };
    }

    // Add parent ID for hierarchical entities
    if (parentId) {
      switch (entityType) {
        case 'level':
          values = { ...values, courseId: parentId };
          break;
        case 'section':
          values = { ...values, levelId: parentId };
          break;
        case 'module':
          values = { ...values, sectionId: parentId };
          break;
        case 'lesson':
          values = { ...values, moduleId: parentId };
          break;
      }
    }

    return values;
  }, [mode, entityData, initialValues, parentId, entityType]);

  // Form submission handler
  const handleSubmit = useCallback(async (data: T) => {
    try {
      setError(null);

      if (mode === 'create') {
        await createMutation.mutateAsync(data as Partial<T>);
      } else if (mode === 'edit' && entityId) {
        await updateMutation.mutateAsync({ id: entityId, data: data as Partial<T> });
      }
    } catch (error) {
      // Error handling is managed by the mutations
      console.error('Form submission error:', error);
    }
  }, [mode, entityId, createMutation, updateMutation]);

  // Form cancellation handler
  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      // Default navigation behavior
      navigate(-1);
    }
  }, [onCancel, navigate]);

  // Loading state
  const loading = createMutation.isPending || updateMutation.isPending;

  // Error state
  const computedError = error || (entityError?.message) || null;

  return {
    formConfig,
    initialValues: computedInitialValues,
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    loading,
    error: computedError,
    entityLoading,
    entityData,
    autoSave,
    autoSaveInterval,
  };
}

// ============================================================================
// Convenience Hooks for Specific Entity Types
// ============================================================================

/**
 * Hook for course forms
 */
export function useCourseForm(config: Omit<UseDynamicFormConfig, 'entityType'>) {
  return useDynamicForm({ ...config, entityType: 'course' });
}

/**
 * Hook for level forms
 */
export function useLevelForm(config: Omit<UseDynamicFormConfig, 'entityType'>) {
  return useDynamicForm({ ...config, entityType: 'level' });
}

/**
 * Hook for section forms
 */
export function useSectionForm(config: Omit<UseDynamicFormConfig, 'entityType'>) {
  return useDynamicForm({ ...config, entityType: 'section' });
}

/**
 * Hook for module forms
 */
export function useModuleForm(config: Omit<UseDynamicFormConfig, 'entityType'>) {
  return useDynamicForm({ ...config, entityType: 'module' });
}

/**
 * Hook for lesson forms
 */
export function useLessonForm(config: Omit<UseDynamicFormConfig, 'entityType'>) {
  return useDynamicForm({ ...config, entityType: 'lesson' });
}

/**
 * Hook for exercise forms
 */
export function useExerciseForm(config: Omit<UseDynamicFormConfig, 'entityType'>) {
  return useDynamicForm({ ...config, entityType: 'exercise' });
}

export default useDynamicForm;