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
    onChange('hints', [...hints, '']);
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

  return (
    <div className="space-y-4">
      {/* Source Text */}
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

      {/* Target Text */}
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

      {/* Hints */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('creator.forms.exercise.hints', 'Hints (Optional)')}
        </label>
        
        {data.hints && data.hints.length > 0 && (
          <div className="space-y-2 mb-3">
            {data.hints.map((hint: string, index: number) => (
              <div key={index} className="flex items-center space-x-2">
                <FormField
                  type="text"
                  className="flex-1"
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleHintRemove(index)}
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
        >
          {t('creator.forms.exercise.addHint', 'Add Hint')}
        </Button>
        
        {errors?.hints && (
          <p className="mt-1 text-sm text-error">{errors.hints}</p>
        )}
      </div>
    </div>
  );
};

export default TranslationExerciseForm;