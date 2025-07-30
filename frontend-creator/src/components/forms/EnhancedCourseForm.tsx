/**
 * Enhanced Course Form using DynamicForm
 * 
 * This component demonstrates the DRY implementation by using the
 * centralized DynamicForm for course management.
 * 
 * @module EnhancedCourseForm
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Course } from '../../utils/types';
import { CourseFormData } from '../../utils/validation';
import { DynamicForm, FormField } from './DynamicForm';

interface EnhancedCourseFormProps {
  initialData?: Partial<Course> | undefined;
  onSuccess?: (course: Course) => void;
  onCancel?: () => void;
  onSubmit: (data: CourseFormData) => Promise<Course>;
}

/**
 * Enhanced Course Form component using DynamicForm architecture
 */
export const EnhancedCourseForm: React.FC<EnhancedCourseFormProps> = ({
  initialData,
  onSuccess,
  onCancel,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom field configurations with enhanced language options
  const customFields: FormField<CourseFormData>[] = [
    {
      name: 'id',
      type: 'text',
      label: t('creator.forms.course.id', 'Course ID'),
      placeholder: 'spanish-basics',
      description: t('creator.forms.course.idHelp', 'Unique identifier (lowercase, hyphens allowed, max 20 chars)'),
      required: true,
      span: 6,
      props: { 
        maxLength: 20,
        pattern: '^[a-z0-9-]+$',
        style: { textTransform: 'lowercase' }
      },
      disabled: !!initialData?.id, // Disable editing ID for existing courses
    },
    {
      name: 'name',
      type: 'text',
      label: t('creator.forms.course.name', 'Course Name'),
      placeholder: 'Spanish Basics',
      description: t('creator.forms.course.nameHelp', 'Display name for the course'),
      required: true,
      span: 6,
      props: { maxLength: 100 },
    },
    {
      name: 'sourceLanguage',
      type: 'select',
      label: t('creator.forms.course.sourceLanguage', 'Source Language'),
      description: t('creator.forms.course.sourceLanguageHelp', 'The language students will learn from'),
      required: true,
      span: 6,
      options: [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Español (Spanish)' },
        { value: 'fr', label: 'Français (French)' },
        { value: 'de', label: 'Deutsch (German)' },
        { value: 'it', label: 'Italiano (Italian)' },
        { value: 'pt', label: 'Português (Portuguese)' },
        { value: 'qu', label: 'Runasimi (Quechua)' },
      ],
    },
    {
      name: 'targetLanguage',
      type: 'select',
      label: t('creator.forms.course.targetLanguage', 'Target Language'),
      description: t('creator.forms.course.targetLanguageHelp', 'The language students will learn'),
      required: true,
      span: 6,
      options: [
        { value: 'en', label: 'English' },
        { value: 'es', label: 'Español (Spanish)' },
        { value: 'fr', label: 'Français (French)' },
        { value: 'de', label: 'Deutsch (German)' },
        { value: 'it', label: 'Italiano (Italian)' },
        { value: 'pt', label: 'Português (Portuguese)' },
        { value: 'qu', label: 'Runasimi (Quechua)' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      label: t('creator.forms.course.description', 'Description'),
      placeholder: t('creator.forms.course.descriptionPlaceholder', 'Brief description of the course content and objectives'),
      description: t('creator.forms.course.descriptionHelp', 'Optional course description (max 255 characters)'),
      span: 12,
      props: { maxLength: 255, rows: 3 },
    },
    {
      name: 'isPublic',
      type: 'checkbox',
      label: t('creator.forms.course.isPublic', 'Make course public'),
      description: t('creator.forms.course.isPublicHelp', 'Public courses are visible to all users'),
      span: 12,
    },
  ];

  // Prepare initial values
  const initialValues: Partial<CourseFormData> = {
    id: initialData?.id || '',
    name: initialData?.name || '',
    sourceLanguage: initialData?.sourceLanguage || 'en',
    targetLanguage: initialData?.targetLanguage || 'es',
    description: initialData?.description || '',
    isPublic: initialData?.isPublic || false,
  };

  // Enhanced form submission
  const handleFormSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Additional validation
      if (data.sourceLanguage === data.targetLanguage) {
        throw new Error(t('creator.forms.course.validation.languagesSame', 'Source and target languages must be different'));
      }

      const response = await onSubmit(data);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error: any) {
      console.error('Course form submission failed:', error);
      setError(error.message || t('common.messages.error', 'An error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DynamicForm<CourseFormData>
      entityType="course"
      customFields={customFields}
      initialValues={initialValues}
      onSubmit={handleFormSubmit}
      onCancel={onCancel}
      loading={isSubmitting}
      error={error}
      config={{
        entityType: 'course',
        title: initialData?.id 
          ? t('creator.modals.course.editTitle', 'Edit Course')
          : t('creator.modals.course.createTitle', 'Create New Course'),
        description: t('creator.forms.course.description', 'Configure the course details and settings.'),
        fields: customFields,
        schema: undefined as any, // Will use entitySchemas.course
        layout: {
          columns: 2,
          className: 'space-y-6',
        },
        autoSave: undefined,
      }}
    />
  );
};

export default EnhancedCourseForm;