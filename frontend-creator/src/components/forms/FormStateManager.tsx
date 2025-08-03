/**
 * Form State Manager Component
 * 
 * This component provides UI for managing form state including unsaved changes
 * warnings, form recovery interface, state persistence, and navigation warnings.
 * It works with the useFormState hook to provide a complete form state management
 * solution.
 * 
 * @module FormStateManager
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { useState, useEffect } from 'react';
// import { useTranslation } from 'react-i18next';
import { UseFormReturn, FieldValues } from 'react-hook-form';
import { useFormState, FormStateReturn } from '../../hooks/useFormState';
// import { AutoSaveStatus } from './AutoSaveProvider';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface FormStateManagerProps<T extends FieldValues = FieldValues> {
  /** Form instance from react-hook-form */
  form: UseFormReturn<T>;
  /** Form state configuration */
  formStateConfig: {
    formId: string;
    entityType: string;
    enablePersistence?: boolean;
    enableUnsavedChanges?: boolean;
  };
  /** Children components */
  children: React.ReactNode;
  /** Callback when form is recovered */
  onRecover?: (data: T) => void;
  /** Callback when unsaved changes are detected */
  onUnsavedChanges?: (hasChanges: boolean) => void;
  /** Custom navigation warning message */
  navigationWarningMessage?: string;
  /** Show recovery banner */
  showRecoveryBanner?: boolean;
  /** Show unsaved changes indicator */
  showUnsavedIndicator?: boolean;
  /** Show undo/redo controls */
  showUndoRedo?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  onDiscard: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  saveButtonText?: string;
  discardButtonText?: string;
  cancelButtonText?: string;
}

export interface RecoveryBannerProps<T extends FieldValues = FieldValues> {
  formState: FormStateReturn<T>;
  onRecover: (data: T) => void;
  onDismiss: () => void;
  className?: string;
}

export interface UndoRedoControlsProps<T extends FieldValues = FieldValues> {
  formState: FormStateReturn<T>;
  className?: string;
}

// ============================================================================
// Unsaved Changes Modal Component
// ============================================================================

/**
 * Modal for handling unsaved changes when user tries to navigate away
 */
const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  onCancel,
  title = 'Unsaved Changes',
  message = 'You have unsaved changes. What would you like to do?',
  saveButtonText = 'Save Changes',
  discardButtonText = 'Discard Changes',
  cancelButtonText = 'Cancel',
}) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      onClose();
    } catch (error) {
      console.error('Failed to save changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onCancel} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {title}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {message}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                saveButtonText
              )}
            </button>
            <button
              type="button"
              onClick={onDiscard}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {discardButtonText}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              {cancelButtonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Recovery Banner Component
// ============================================================================

/**
 * Banner for showing form recovery options
 */
const RecoveryBanner = <T extends FieldValues = FieldValues>({
  formState,
  onRecover,
  onDismiss,
  className = '',
}: RecoveryBannerProps<T>) => {
  // const { t } = useTranslation();
  const [isRecovering, setIsRecovering] = useState(false);

  const handleRecover = async () => {
    setIsRecovering(true);
    try {
      const recoveredData = formState.recoverFormState();
      if (recoveredData) {
        onRecover(recoveredData);
      }
    } catch (error) {
      console.error('Failed to recover form data:', error);
    } finally {
      setIsRecovering(false);
    }
  };

  if (!formState.isRecovered) return null;

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-md p-4 mb-6 ${className}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Form Data Recovered
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>
              We found unsaved changes from a previous session. Would you like to restore them?
            </p>
          </div>
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex">
              <button
                type="button"
                onClick={handleRecover}
                disabled={isRecovering}
                className="bg-blue-50 px-2 py-1.5 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600 disabled:opacity-50"
              >
                {isRecovering ? 'Restoring...' : 'Restore Changes'}
              </button>
              <button
                type="button"
                onClick={onDismiss}
                className="ml-3 bg-blue-50 px-2 py-1.5 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-50 focus:ring-blue-600"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Undo/Redo Controls Component
// ============================================================================

/**
 * Controls for undo/redo functionality
 */
const UndoRedoControls = <T extends FieldValues = FieldValues>({
  formState,
  className = '',
}: UndoRedoControlsProps<T>) => {
  // const { t } = useTranslation();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        type="button"
        onClick={() => formState.undo()}
        disabled={!formState.canUndo}
        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Undo (Ctrl+Z)"
      >
        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        Undo
      </button>
      <button
        type="button"
        onClick={() => formState.redo()}
        disabled={!formState.canRedo}
        className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Redo (Ctrl+Y)"
      >
        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6" />
        </svg>
        Redo
      </button>
      <div className="text-xs text-gray-500">
        {formState.history.states.length > 0 && (
          <span>
            {formState.history.currentIndex + 1} of {formState.history.states.length}
          </span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Unsaved Changes Indicator Component
// ============================================================================

/**
 * Indicator showing unsaved changes status
 */
const UnsavedChangesIndicator: React.FC<{
  hasUnsavedChanges: boolean;
  className?: string;
}> = ({ hasUnsavedChanges, className = '' }) => {
  if (!hasUnsavedChanges) return null;

  return (
    <div className={`flex items-center space-x-2 text-sm text-orange-600 ${className}`}>
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
      <span>Unsaved changes</span>
    </div>
  );
};

// ============================================================================
// Main Form State Manager Component
// ============================================================================

/**
 * Form State Manager Component
 * 
 * @example
 * <FormStateManager
 *   form={form}
 *   formStateConfig={{
 *     formId: 'course-123',
 *     entityType: 'course',
 *     enablePersistence: true,
 *   }}
 *   onRecover={(data) => form.reset(data)}
 *   showRecoveryBanner={true}
 *   showUnsavedIndicator={true}
 * >
 *   <MyFormFields />
 * </FormStateManager>
 */
export const FormStateManager = <T extends FieldValues = FieldValues>({
  form,
  formStateConfig,
  children,
  onRecover,
  onUnsavedChanges,
  navigationWarningMessage = 'You have unsaved changes. Are you sure you want to leave?',
  showRecoveryBanner = true,
  showUnsavedIndicator = true,
  showUndoRedo = false,
  className = '',
}: FormStateManagerProps<T>) => {
  // const { t } = useTranslation();
  const formState = useFormState(form, formStateConfig);
  
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Notify parent of unsaved changes
   */
  useEffect(() => {
    onUnsavedChanges?.(formState.hasUnsavedChanges);
  }, [formState.hasUnsavedChanges, onUnsavedChanges]);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'z':
            if (!event.shiftKey && formState.canUndo) {
              event.preventDefault();
              formState.undo();
            }
            break;
          case 'y':
            if (formState.canRedo) {
              event.preventDefault();
              formState.redo();
            }
            break;
          case 'Z':
            if (event.shiftKey && formState.canRedo) {
              event.preventDefault();
              formState.redo();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formState]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle form recovery
   */
  const handleRecover = (data: T) => {
    form.reset(data);
    formState.markAsSaved();
    onRecover?.(data);
  };

  /**
   * Handle recovery banner dismiss
   */
  const handleRecoveryDismiss = () => {
    formState.clearPersistedState();
  };

  // /**
  //  * Handle navigation with unsaved changes
  //  */
  // const handleNavigationWithUnsavedChanges = (navigationFn: () => void) => {
  //   if (formState.hasUnsavedChanges) {
  //     setPendingNavigation(() => navigationFn);
  //     setShowUnsavedModal(true);
  //   } else {
  //     navigationFn();
  //   }
  // };

  /**
   * Handle save and navigate
   */
  const handleSaveAndNavigate = async () => {
    try {
      // This would typically call the form's onSubmit handler
      // For now, we'll just mark as saved
      formState.markAsSaved();
      
      if (pendingNavigation) {
        pendingNavigation();
        setPendingNavigation(null);
      }
      setShowUnsavedModal(false);
    } catch (error) {
      console.error('Failed to save before navigation:', error);
      throw error;
    }
  };

  /**
   * Handle discard and navigate
   */
  const handleDiscardAndNavigate = () => {
    formState.resetUnsavedChanges();
    
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
    setShowUnsavedModal(false);
  };

  /**
   * Handle cancel navigation
   */
  const handleCancelNavigation = () => {
    setPendingNavigation(null);
    setShowUnsavedModal(false);
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={className}>
      {/* Recovery Banner */}
      {showRecoveryBanner && (
        <RecoveryBanner
          formState={formState}
          onRecover={handleRecover}
          onDismiss={handleRecoveryDismiss}
        />
      )}

      {/* Form State Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Unsaved Changes Indicator */}
          {showUnsavedIndicator && (
            <UnsavedChangesIndicator hasUnsavedChanges={formState.hasUnsavedChanges} />
          )}
        </div>

        <div className="flex items-center space-x-4">
          {/* Undo/Redo Controls */}
          {showUndoRedo && <UndoRedoControls formState={formState} />}
        </div>
      </div>

      {/* Form Content */}
      {children}

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onClose={() => setShowUnsavedModal(false)}
        onSave={handleSaveAndNavigate}
        onDiscard={handleDiscardAndNavigate}
        onCancel={handleCancelNavigation}
        message={navigationWarningMessage}
      />
    </div>
  );
};

// ============================================================================
// Hook for Navigation with Unsaved Changes
// ============================================================================

/**
 * Hook for handling navigation with unsaved changes
 */
export const useNavigationGuard = <T extends FieldValues = FieldValues>(
  formState: FormStateReturn<T>
) => {
  const [showWarning, setShowWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  const navigate = (navigationFn: () => void) => {
    if (formState.hasUnsavedChanges) {
      setPendingNavigation(() => navigationFn);
      setShowWarning(true);
    } else {
      navigationFn();
    }
  };

  const confirmNavigation = () => {
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
    setShowWarning(false);
  };

  const cancelNavigation = () => {
    setPendingNavigation(null);
    setShowWarning(false);
  };

  return {
    navigate,
    showWarning,
    confirmNavigation,
    cancelNavigation,
    hasUnsavedChanges: formState.hasUnsavedChanges,
  };
};

export default FormStateManager;