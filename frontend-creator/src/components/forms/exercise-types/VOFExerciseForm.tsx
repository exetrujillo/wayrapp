import React from 'react';
import { useTranslation } from 'react-i18next';
import { Textarea } from '../../ui/Textarea';

interface VOFExerciseFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: any;
}

export const VOFExerciseForm: React.FC<VOFExerciseFormProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Statement */}
      <Textarea
        id="statement"
        label={t('creator.forms.exercise.statement', 'Statement')}
        value={data.statement || ''}
        onChange={(e) => onChange('statement', e.target.value)}
        placeholder={t(
          'creator.forms.exercise.statementPlaceholder',
          'Enter the statement to be evaluated'
        )}
        error={errors?.statement}
        isRequired
        fullWidth
        maxLength={1000}
        showCharCount
        minHeight="80px"
        isSuccess={!errors?.statement && data.statement && data.statement.trim().length > 0}
      />

      {/* Correct Answer */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          {t('creator.forms.exercise.correctAnswer', 'Correct Answer')}
          <span className="text-error ml-1">*</span>
        </label>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="is_true"
              name="is_true"
              checked={data.is_true === true}
              onChange={() => onChange('is_true', true)}
              className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300"
            />
            <label htmlFor="is_true" className="text-sm font-medium text-neutral-700">
              {t('creator.forms.exercise.true', 'True')}
            </label>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="radio"
              id="isFalse"
              name="is_true"
              checked={data.is_true === false}
              onChange={() => onChange('is_true', false)}
              className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-neutral-300"
            />
            <label htmlFor="isFalse" className="text-sm font-medium text-neutral-700">
              {t('creator.forms.exercise.false', 'False')}
            </label>
          </div>
        </div>
        {errors?.is_true && (
          <p className="mt-1 text-sm text-error">{errors.is_true}</p>
        )}
      </div>

      {/* Explanation */}
      <Textarea
        id="explanation"
        label={t('creator.forms.exercise.explanation', 'Explanation (Optional)')}
        value={data.explanation || ''}
        onChange={(e) => onChange('explanation', e.target.value)}
        placeholder={t(
          'creator.forms.exercise.explanationPlaceholder',
          'Explain why the statement is true or false'
        )}
        error={errors?.explanation}
        fullWidth
        maxLength={500}
        showCharCount
        minHeight="80px"
        isSuccess={!errors?.explanation && data.explanation && data.explanation.trim().length > 0}
      />
    </div>
  );
};

export default VOFExerciseForm;