import React from 'react';
import { useTranslation } from 'react-i18next';

interface FormProgressProps {
  totalFields: number;
  validFields: number;
  requiredFields: number;
  validRequiredFields: number;
  className?: string;
  showDetails?: boolean;
}

/**
 * Component that shows form completion progress
 */
export const FormProgress: React.FC<FormProgressProps> = ({
  totalFields,
  validFields,
  requiredFields,
  validRequiredFields,
  className = '',
  showDetails = true,
}) => {
  const { t } = useTranslation();

  const overallProgress = totalFields > 0 ? (validFields / totalFields) * 100 : 0;
  const requiredProgress = requiredFields > 0 ? (validRequiredFields / requiredFields) * 100 : 100;
  
  const isFormValid = requiredProgress === 100;

  return (
    <div className={`bg-white border border-neutral-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-neutral-700">
          {t('common.form.progress', 'Form Progress')}
        </h4>
        <span className={`text-sm font-medium ${
          isFormValid ? 'text-success' : 'text-neutral-600'
        }`}>
          {Math.round(requiredProgress)}%
        </span>
      </div>

      {/* Required fields progress bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
          <span>{t('common.form.requiredFields', 'Required Fields')}</span>
          <span>{validRequiredFields}/{requiredFields}</span>
        </div>
        <div className="w-full bg-neutral-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              isFormValid ? 'bg-success' : 'bg-primary-500'
            }`}
            style={{ width: `${requiredProgress}%` }}
          />
        </div>
      </div>

      {showDetails && (
        <>
          {/* Overall progress bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs text-neutral-600 mb-1">
              <span>{t('common.form.allFields', 'All Fields')}</span>
              <span>{validFields}/{totalFields}</span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-1.5">
              <div
                className="bg-neutral-400 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          {/* Status message */}
          <div className="text-xs text-neutral-600">
            {isFormValid ? (
              <span className="text-success flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {t('common.form.readyToSubmit', 'Ready to submit')}
              </span>
            ) : (
              <span>
                {t('common.form.completeRequired', 'Complete required fields to continue')}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FormProgress;