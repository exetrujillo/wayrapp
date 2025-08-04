/**
 * Dynamic Exercise Form Component
 * 
 * This component provides a comprehensive exercise creation and editing form
 * with type-specific forms, live preview, validation, and templates.
 * 
 * @module DynamicExerciseForm
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ExerciseType, Exercise, CreateExerciseRequest } from '../../utils/types';
import { EXERCISE_TYPE_OPTIONS, getExerciseTypeDescription } from './FormConstants';
import { Button } from '../ui/Button';

import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';

// Import type-specific forms
import { TranslationExerciseForm } from './exercise-types/TranslationExerciseForm';
import { FillInTheBlankExerciseForm } from './exercise-types/FillInTheBlankExerciseForm';
import { VOFExerciseForm } from './exercise-types/VOFExerciseForm';
import { PairsExerciseForm } from './exercise-types/PairsExerciseForm';
import { InformativeExerciseForm } from './exercise-types/InformativeExerciseForm';
import { OrderingExerciseForm } from './exercise-types/OrderingExerciseForm';

// ============================================================================
// Type Definitions
// ============================================================================

export interface DynamicExerciseFormProps {
    /** Initial exercise data for editing */
    initialData?: Exercise | undefined;
    /** Form submission handler */
    onSubmit: (data: CreateExerciseRequest) => Promise<Exercise>;
    /** Success callback */
    onSuccess?: ((exercise: Exercise) => void) | undefined;
    /** Cancel callback */
    onCancel?: (() => void) | undefined;
    /** Error callback */
    onError?: ((error: string) => void) | undefined;
    /** Enable live preview */
    enablePreview?: boolean;
    /** Enable templates */
    enableTemplates?: boolean;
    /** Show form in modal mode */
    isModal?: boolean;
    /** Custom CSS classes */
    className?: string;
}

// ============================================================================
// Default Data Structures
// ============================================================================

const getDefaultExerciseData = (exerciseType: ExerciseType): Record<string, any> => {
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
                blanks: [],
            };
        case 'vof':
            return {
                statement: '',
                isTrue: null,
                explanation: '',
            };
        case 'pairs':
            return {
                pairs: [
                    { left: '', right: '' },
                    { left: '', right: '' },
                ],
            };
        case 'informative':
            return {
                title: '',
                content: '',
                media: null,
            };
        case 'ordering':
            return {
                items: [],
            };
        default:
            return {};
    }
};

// ============================================================================
// Main Component
// ============================================================================

export const DynamicExerciseForm: React.FC<DynamicExerciseFormProps> = ({
    initialData,
    onSubmit,
    onSuccess,
    onCancel,
    onError,
    enablePreview = true,
    enableTemplates: _enableTemplates = true,
    isModal: _isModal = false,
    className = '',
}) => {
    const { t } = useTranslation();

    // ============================================================================
    // State Management
    // ============================================================================

    const [exerciseType, setExerciseType] = useState<ExerciseType>(
        initialData?.exerciseType || 'translation'
    );
    const [exerciseData, setExerciseData] = useState<Record<string, any>>(
        initialData?.data || getDefaultExerciseData(exerciseType)
    );
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // ============================================================================
    // Effects
    // ============================================================================

    // Reset exercise data when type changes
    useEffect(() => {
        if (!initialData) {
            setExerciseData(getDefaultExerciseData(exerciseType));
            setErrors({});
        }
    }, [exerciseType, initialData]);

    // ============================================================================
    // Event Handlers
    // ============================================================================

    const handleExerciseTypeChange = useCallback((newType: ExerciseType) => {
        setExerciseType(newType);
    }, []);

    const handleDataChange = useCallback((field: string, value: any) => {
        setExerciseData(prev => ({
            ...prev,
            [field]: value,
        }));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            setErrors({});

            // Submit the exercise
            const submissionData: CreateExerciseRequest = {
                exerciseType,
                data: exerciseData,
            };

            const result = await onSubmit(submissionData);

            if (onSuccess) {
                onSuccess(result);
            }
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to save exercise';
            setErrors({ general: errorMessage });

            if (onError) {
                onError(errorMessage);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // ============================================================================
    // Memoized Values
    // ============================================================================

    const currentTypeDescription = useMemo(() => {
        return getExerciseTypeDescription(exerciseType);
    }, [exerciseType]);

    const hasUnsavedChanges = useMemo(() => {
        if (!initialData) return Object.keys(exerciseData).length > 0;
        return JSON.stringify(exerciseData) !== JSON.stringify(initialData.data);
    }, [exerciseData, initialData]);

    // ============================================================================
    // Render Type-Specific Form
    // ============================================================================

    const renderTypeSpecificForm = () => {
        const commonProps = {
            data: exerciseData,
            onChange: handleDataChange,
            errors,
        };

        switch (exerciseType) {
            case 'translation':
                return <TranslationExerciseForm {...commonProps} />;
            case 'fill-in-the-blank':
                return <FillInTheBlankExerciseForm {...commonProps} />;
            case 'vof':
                return <VOFExerciseForm {...commonProps} />;
            case 'pairs':
                return <PairsExerciseForm {...commonProps} />;
            case 'informative':
                return <InformativeExerciseForm {...commonProps} />;
            case 'ordering':
                return <OrderingExerciseForm {...commonProps} />;
            default:
                return (
                    <div className="text-center py-8 text-gray-500">
                        {t('creator.forms.exercise.unsupportedType', 'Unsupported exercise type')}
                    </div>
                );
        }
    };

    // ============================================================================
    // Render
    // ============================================================================

    return (
        <div className={`dynamic-exercise-form ${className}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-medium text-gray-900">
                            {initialData
                                ? t('creator.forms.exercise.editTitle', 'Edit Exercise')
                                : t('creator.forms.exercise.createTitle', 'Create Exercise')
                            }
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {currentTypeDescription}
                        </p>
                    </div>

                    <div className="flex items-center space-x-2">
                        {enablePreview && (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPreview(!showPreview)}
                                disabled={isSubmitting}
                            >
                                {showPreview
                                    ? t('creator.forms.exercise.hidePreview', 'Hide Preview')
                                    : t('creator.forms.exercise.showPreview', 'Show Preview')
                                }
                            </Button>
                        )}
                    </div>
                </div>

                {/* General Error */}
                {errors.general && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-800">{errors.general}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Exercise Type Selection */}
                <Card className="p-4">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="exerciseType" className="block text-sm font-medium text-gray-700 mb-2">
                                {t('creator.forms.exercise.type', 'Exercise Type')}
                                <span className="text-red-500 ml-1">*</span>
                            </label>
                            <select
                                id="exerciseType"
                                value={exerciseType}
                                onChange={(e) => handleExerciseTypeChange(e.target.value as ExerciseType)}
                                disabled={isSubmitting || !!initialData}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {EXERCISE_TYPE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <p className="text-sm text-gray-500 mt-1">
                                {currentTypeDescription}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Form Section */}
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-md font-medium text-gray-900 mb-4">
                                {t('creator.forms.exercise.configuration', 'Exercise Configuration')}
                            </h3>
                            {renderTypeSpecificForm()}
                        </Card>
                    </div>

                    {/* Preview Section */}
                    {enablePreview && showPreview && (
                        <div className="space-y-6">
                            <Card className="p-6">
                                <h3 className="text-md font-medium text-gray-900 mb-4">
                                    {t('creator.forms.exercise.preview', 'Live Preview')}
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-md">
                                    <p className="text-sm text-gray-600">
                                        Preview functionality will be implemented here
                                    </p>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
                        {hasUnsavedChanges && (
                            <span className="text-sm text-yellow-600">
                                {t('creator.forms.exercise.unsavedChanges', 'You have unsaved changes')}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        {onCancel && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                        )}

                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="min-w-[120px]"
                        >
                            {isSubmitting ? (
                                <>
                                    <LoadingSpinner size="sm" className="mr-2" />
                                    {t('common.saving', 'Saving...')}
                                </>
                            ) : (
                                initialData
                                    ? t('common.save', 'Save Changes')
                                    : t('common.create', 'Create Exercise')
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default DynamicExerciseForm;