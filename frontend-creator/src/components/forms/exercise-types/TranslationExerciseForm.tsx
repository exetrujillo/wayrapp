import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import { Textarea } from '../../ui/Textarea';
import { FormField } from '../../ui/FormField';

interface TranslationExerciseFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: any;
}

export const TranslationExerciseForm: React.FC<TranslationExerciseFormProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { t } = useTranslation();

  const handleHintAdd = () => {
    const hints = data.hints || [];
    if (hints.length < 5) { // Max 5 hints
      onChange('hints', [...hints, '']);
    }
  };

  const handleHintChange = (index: number, value: string) => {
    const hints = [...(data.hints || [])];
    hints[index] = value;
    onChange('hints', hints);
  };

  const handleHintRemove = (index: number) => {
    const hints = [...(data.hints || [])];
    hints.splice(index, 1);
    onChange('hints', hints);
  };

  // Calculate word count for source text
  const sourceWordCount = data.source_text ? data.source_text.trim().split(/\s+/).filter(Boolean).length : 0;
  const targetWordCount = data.target_text ? data.target_text.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="space-y-6">
      {/* Source Text */}
      <div>
        <Textarea
          id="source_text"
          label={t('creator.forms.exercise.sourceText', 'Source Text')}
          value={data.source_text || ''}
          onChange={(e) => onChange('source_text', e.target.value)}
          placeholder={t(
            'creator.forms.exercise.sourceTextPlaceholder',
            'Enter text in source language'
          )}
          error={errors?.source_text}
          isRequired
          fullWidth
          maxLength={1000}
          showCharCount
          minHeight="80px"
          isSuccess={!errors?.source_text && data.source_text && data.source_text.trim().length > 0}
        />
        {sourceWordCount > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {t('creator.forms.exercise.wordCount', '{{count}} words', { count: sourceWordCount })}
            {sourceWordCount > 50 && (
              <span className="text-yellow-600 ml-2">
                {t('creator.forms.exercise.longTextWarning', 'Consider breaking into shorter segments')}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Target Text */}
      <div>
        <Textarea
          id="target_text"
          label={t('creator.forms.exercise.targetText', 'Target Text (Expected Translation)')}
          value={data.target_text || ''}
          onChange={(e) => onChange('target_text', e.target.value)}
          placeholder={t(
            'creator.forms.exercise.targetTextPlaceholder',
            'Enter expected translation'
          )}
          error={errors?.target_text}
          isRequired
          fullWidth
          maxLength={1000}
          showCharCount
          minHeight="80px"
          isSuccess={!errors?.target_text && data.target_text && data.target_text.trim().length > 0}
        />
        {targetWordCount > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {t('creator.forms.exercise.wordCount', '{{count}} words', { count: targetWordCount })}
          </p>
        )}
        
        {/* Same text warning */}
        {data.source_text && data.target_text && data.source_text.trim() === data.target_text.trim() && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ {t('creator.forms.exercise.sameTextWarning', 'Source and target text are identical')}
            </p>
          </div>
        )}
      </div>

      {/* Hints */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('creator.forms.exercise.hints', 'Hints (Optional)')}
          </label>
          <span className="text-xs text-gray-500">
            {data.hints ? data.hints.length : 0}/5
          </span>
        </div>
        
        {data.hints && data.hints.length > 0 && (
          <div className="space-y-2 mb-3">
            {data.hints.map((hint: string, index: number) => (
              <div key={index} className="flex items-start space-x-2">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mt-2">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <FormField
                    type="text"
                    className="w-full"
                    value={hint}
                    onChange={(e) => handleHintChange(index, e.target.value)}
                    placeholder={t(
                      'creator.forms.exercise.hintPlaceholder',
                      `Hint ${index + 1}`
                    )}
                    maxLength={200}
                    isValid={hint.trim().length > 0 && hint.length <= 200}
                    showValidationIcon
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-500">
                      {hint.length}/200
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleHintRemove(index)}
                  className="mt-2"
                >
                  {t('common.buttons.remove', 'Remove')}
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleHintAdd}
          disabled={(data.hints?.length || 0) >= 5}
        >
          {t('creator.forms.exercise.addHint', 'Add Hint')}
        </Button>
        
        {errors?.hints && (
          <p className="mt-1 text-sm text-red-600">{errors.hints}</p>
        )}

        {/* Hints help text */}
        <p className="text-xs text-gray-500 mt-2">
          {t('creator.forms.exercise.hintsHelp', 'Hints help students when they\'re stuck. Keep them concise and helpful.')}
        </p>
      </div>

      {/* Quality Indicators */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          {t('creator.forms.exercise.qualityChecks', 'Quality Checks')}
        </h4>
        <div className="space-y-1">
          <div className="flex items-center text-sm">
            <span className={`mr-2 ${data.source_text && data.source_text.trim().length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {data.source_text && data.source_text.trim().length > 0 ? '✓' : '○'}
            </span>
            <span className="text-gray-700">
              {t('creator.forms.exercise.hasSourceText', 'Has source text')}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className={`mr-2 ${data.target_text && data.target_text.trim().length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {data.target_text && data.target_text.trim().length > 0 ? '✓' : '○'}
            </span>
            <span className="text-gray-700">
              {t('creator.forms.exercise.hasTargetText', 'Has target text')}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className={`mr-2 ${data.hints && data.hints.length > 0 ? 'text-green-600' : 'text-gray-400'}`}>
              {data.hints && data.hints.length > 0 ? '✓' : '○'}
            </span>
            <span className="text-gray-700">
              {t('creator.forms.exercise.hasHints', 'Has helpful hints')}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className={`mr-2 ${sourceWordCount > 0 && sourceWordCount <= 30 ? 'text-green-600' : sourceWordCount > 30 ? 'text-yellow-600' : 'text-gray-400'}`}>
              {sourceWordCount > 0 && sourceWordCount <= 30 ? '✓' : sourceWordCount > 30 ? '!' : '○'}
            </span>
            <span className="text-gray-700">
              {t('creator.forms.exercise.appropriateLength', 'Appropriate text length')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationExerciseForm;