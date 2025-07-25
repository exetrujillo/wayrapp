import React from 'react';
import { useTranslation } from 'react-i18next';

interface ValidationRule {
  key: string;
  label: string;
  isValid: boolean;
  isRequired?: boolean;
}

interface ValidationStatusProps {
  rules: ValidationRule[];
  className?: string;
  showOnlyErrors?: boolean;
}

/**
 * Component that displays real-time validation status for form fields
 * Shows a checklist of validation rules with their current status
 */
export const ValidationStatus: React.FC<ValidationStatusProps> = ({
  rules,
  className = '',
  showOnlyErrors = false,
}) => {
  const { t } = useTranslation();

  const visibleRules = showOnlyErrors 
    ? rules.filter(rule => !rule.isValid)
    : rules;

  if (visibleRules.length === 0) {
    return null;
  }

  return (
    <div className={`bg-neutral-50 border border-neutral-200 rounded-lg p-4 ${className}`}>
      <h4 className="text-sm font-medium text-neutral-700 mb-3">
        {t('common.validation.requirements', 'Requirements')}
      </h4>
      <ul className="space-y-2">
        {visibleRules.map((rule) => (
          <li key={rule.key} className="flex items-center space-x-2">
            <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
              rule.isValid 
                ? 'bg-success text-white' 
                : rule.isRequired 
                  ? 'bg-error text-white' 
                  : 'bg-neutral-300 text-neutral-600'
            }`}>
              {rule.isValid ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <span className={`text-sm ${
              rule.isValid 
                ? 'text-success' 
                : rule.isRequired 
                  ? 'text-error' 
                  : 'text-neutral-600'
            }`}>
              {rule.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ValidationStatus;