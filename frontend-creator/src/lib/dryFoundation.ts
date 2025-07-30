/**
 * DRY Foundation Architecture - Main Export File
 * 
 * This module provides a centralized export for all DRY foundation components,
 * hooks, and utilities. It serves as the main entry point for the unified
 * architecture system.
 * 
 * @module DryFoundation
 * @category Library
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Import everything from the DRY foundation
 * import {
 *   apiClient,
 *   createCrudHooks,
 *   queryKeyFactory,
 *   DynamicForm,
 *   useDynamicForm
 * } from '../lib/dryFoundation';
 */

import React from 'react';

// ============================================================================
// API Client Exports
// ============================================================================
export {
  apiClient,
  ApiClientError,
  type ApiResponse,
  type PaginatedResponse,
  type ListParams,
  type AssignmentData,
  type UnassignmentData,
} from '../services/apiClient';

// ============================================================================
// CRUD Hooks Exports
// ============================================================================
export {
  createCrudHooks,
  useCourseHooks,
  useLevelHooks,
  useSectionHooks,
  useModuleHooks,
  useLessonHooks,
  useExerciseHooks,
  type CrudHooks,
  type CrudHooksConfig,
  type AssignParams,
  type UnassignParams,
} from '../hooks/useCrudHooks';

// ============================================================================
// Query Key Factory Exports
// ============================================================================
export {
  queryKeyFactory,
  CacheManager,
  useCacheManager,
  generateQueryKey,
  areQueryKeysRelated,
  getRelatedQueryKeys,
  type EntityType,
  type BaseQueryKey,
  type HierarchyMap,
  type ManyToManyRelation,
} from '../hooks/queryKeyFactory';

// ============================================================================
// Dynamic Form Exports
// ============================================================================
export {
  DynamicForm,
  entitySchemas,
  entityFieldConfigs,
  type FormField,
  type FormConfig,
  type FormLayout,
  type FormGroup,
  type AutoSaveConfig,
  type DynamicFormProps,
  type FieldType,
} from '../components/forms/DynamicForm';

// ============================================================================
// Dynamic Form Hook Exports
// ============================================================================
export {
  useDynamicForm,
  useCourseForm,
  useLevelForm,
  useSectionForm,
  useModuleForm,
  useLessonForm,
  useExerciseForm,
  type FormMode,
  type UseDynamicFormConfig,
  type UseDynamicFormReturn,
} from '../hooks/useDynamicForm';

// ============================================================================
// Import for internal use
// ============================================================================
import { apiClient } from '../services/apiClient';
import { createCrudHooks, useCourseHooks, useLevelHooks, useSectionHooks, useModuleHooks, useLessonHooks, useExerciseHooks } from '../hooks/useCrudHooks';
import { queryKeyFactory } from '../hooks/queryKeyFactory';
import { DynamicForm, entitySchemas } from '../components/forms/DynamicForm';
import { useDynamicForm, useCourseForm, useLevelForm, useSectionForm, useModuleForm, useLessonForm, useExerciseForm } from '../hooks/useDynamicForm';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a complete CRUD system for a new entity type
 * @param entityType - The entity type name
 * @param config - CRUD hooks configuration
 * @returns Complete CRUD system with hooks and utilities
 * 
 * @example
 * const userCrud = createEntityCrud('users', {
 *   endpoint: 'users',
 *   supportsReorder: false,
 *   supportsAssignment: false,
 * });
 * 
 * // Use the generated hooks
 * const { useList, useCreate, useUpdate, useDelete } = userCrud.hooks;
 */
export function createEntityCrud<T>(
  entityType: string,
  config: import('../hooks/useCrudHooks').CrudHooksConfig
) {
  const hooks = createCrudHooks<T>(config);
  const queryKeys = (queryKeyFactory as any)[entityType] || {
    all: [entityType] as const,
    lists: () => [entityType, 'list'] as const,
    list: (params?: any) => [entityType, 'list', params] as const,
    details: () => [entityType, 'detail'] as const,
    detail: (id: string) => [entityType, 'detail', id] as const,
  };

  return {
    hooks,
    queryKeys,
    entityType,
    config,
  };
}

/**
 * Creates a complete form system for a new entity type
 * @param entityType - The entity type name
 * @param schema - Zod validation schema
 * @param fields - Form field configuration
 * @returns Complete form system with components and hooks
 * 
 * @example
 * const userForm = createEntityForm('user', userSchema, userFields);
 * 
 * // Use the generated form
 * const UserForm = userForm.component;
 * const useUserForm = userForm.hook;
 */
export function createEntityForm<T extends Record<string, any>>(
  entityType: string,
  schema: import('zod').ZodSchema<T>,
  fields: import('../components/forms/DynamicForm').FormField<T>[]
) {
  const formConfig: import('../components/forms/DynamicForm').FormConfig<T> = {
    entityType,
    fields,
    schema,
    title: undefined,
    description: undefined,
    layout: undefined,
    autoSave: undefined,
  };

  const FormComponent: React.FC<Omit<import('../components/forms/DynamicForm').DynamicFormProps<T>, 'config'>> = (props) => {
    return React.createElement(DynamicForm as any, { ...props, config: formConfig });
  };

  const useFormHook = (config: Omit<import('../hooks/useDynamicForm').UseDynamicFormConfig<T>, 'entityType'>) => {
    return useDynamicForm<T>({ ...config, entityType: entityType as any });
  };

  return {
    component: FormComponent,
    hook: useFormHook,
    config: formConfig,
    entityType,
  };
}

/**
 * Validates that all DRY foundation components are properly configured
 * @returns Validation result with any issues found
 */
export function validateDryFoundation() {
  const issues: string[] = [];

  // Check API client
  try {
    if (!apiClient) {
      issues.push('API client is not properly initialized');
    }
  } catch (error) {
    issues.push(`API client error: ${error}`);
  }

  // Check query key factory
  try {
    const testKey = queryKeyFactory.courses.all;
    if (!Array.isArray(testKey)) {
      issues.push('Query key factory is not generating proper keys');
    }
  } catch (error) {
    issues.push(`Query key factory error: ${error}`);
  }

  // Check entity schemas
  try {
    const courseSchema = entitySchemas.course;
    if (!courseSchema) {
      issues.push('Entity schemas are not properly defined');
    }
  } catch (error) {
    issues.push(`Entity schemas error: ${error}`);
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

// ============================================================================
// Default Export
// ============================================================================

/**
 * Default export containing the most commonly used DRY foundation components
 */
const dryFoundation = {
  // Core components
  apiClient,
  createCrudHooks,
  queryKeyFactory,
  DynamicForm,
  useDynamicForm,
  
  // Utilities
  createEntityCrud,
  createEntityForm,
  validateDryFoundation,
  
  // Predefined hooks
  hooks: {
    course: useCourseHooks,
    level: useLevelHooks,
    section: useSectionHooks,
    module: useModuleHooks,
    lesson: useLessonHooks,
    exercise: useExerciseHooks,
  },
  
  // Predefined forms
  forms: {
    course: useCourseForm,
    level: useLevelForm,
    section: useSectionForm,
    module: useModuleForm,
    lesson: useLessonForm,
    exercise: useExerciseForm,
  },
};

export default dryFoundation;