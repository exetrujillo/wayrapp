import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';

interface FillInTheBlankExerciseFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: any;
}

export const FillInTheBlankExerciseForm: React.FC<FillInTheBlankExerciseFormProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { t } = useTranslation();

  const handleBlankAdd = () => {
    const blanks = data.blanks || [];
    if (blanks.length < 10) { // Max 10 blanks
      onChange('blanks', [
        ...blanks,
        {
          position: blanks.length,
          correct_answers: [''],
          hints: [],
        },
      ]);
    }
  };

  const handleBlankRemove = (index: number) => {
    const blanks = [...(data.blanks || [])];
    blanks.splice(index, 1);
    // Update positions
    blanks.forEach((blank, i) => {
      blank.position = i;
    });
    onChange('blanks', blanks);
  };



  const handleAnswerAdd = (blankIndex: number) => {
    const blanks = [...(data.blanks || [])];
    const answers = [...(blanks[blankIndex].correct_answers || [])];
    if (answers.length < 5) { // Max 5 answers per blank
      answers.push('');
      blanks[blankIndex] = { ...blanks[blankIndex], correct_answers: answers };
      onChange('blanks', blanks);
    }
  };

  const handleAnswerChange = (blankIndex: number, answerIndex: number, value: string) => {
    const blanks = [...(data.blanks || [])];
    const answers = [...(blanks[blankIndex].correct_answers || [])];
    answers[answerIndex] = value;
    blanks[blankIndex] = { ...blanks[blankIndex], correct_answers: answers };
    onChange('blanks', blanks);
  };

  const handleAnswerRemove = (blankIndex: number, answerIndex: number) => {
    const blanks = [...(data.blanks || [])];
    const answers = [...(blanks[blankIndex].correct_answers || [])];
    answers.splice(answerIndex, 1);
    blanks[blankIndex] = { ...blanks[blankIndex], correct_answers: answers };
    onChange('blanks', blanks);
  };

  const handleHintAdd = (blankIndex: number) => {
    const blanks = [...(data.blanks || [])];
    const hints = [...(blanks[blankIndex].hints || [])];
    if (hints.length < 3) { // Max 3 hints per blank
      hints.push('');
      blanks[blankIndex] = { ...blanks[blankIndex], hints };
      onChange('blanks', blanks);
    }
  };

  const handleHintChange = (blankIndex: number, hintIndex: number, value: string) => {
    const blanks = [...(data.blanks || [])];
    const hints = [...(blanks[blankIndex].hints || [])];
    hints[hintIndex] = value;
    blanks[blankIndex] = { ...blanks[blankIndex], hints };
    onChange('blanks', blanks);
  };

  const handleHintRemove = (blankIndex: number, hintIndex: number) => {
    const blanks = [...(data.blanks || [])];
    const hints = [...(blanks[blankIndex].hints || [])];
    hints.splice(hintIndex, 1);
    blanks[blankIndex] = { ...blanks[blankIndex], hints };
    onChange('blanks', blanks);
  };

  // Count blanks in text
  const blankCount = data.text ? (data.text.match(/___/g) || []).length : 0;
  const configuredBlanks = data.blanks ? data.blanks.length : 0;
  const blanksMatch = blankCount === configuredBlanks;

  return (
    <div className="space-y-6">
      {/* Text with Blanks */}
      <div>
        <label
          htmlFor="text"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {t('creator.forms.exercise.fillText', 'Text with Blanks')}
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          id="text"
          className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={data.text || ''}
          onChange={(e) => onChange('text', e.target.value)}
          placeholder={t(
            'creator.forms.exercise.fillTextPlaceholder',
            'Enter text with ___ for blanks'
          )}
          maxLength={1000}
        />
        <div className="flex justify-between items-center mt-1">
          <p className="text-xs text-gray-500">
            {t(
              'creator.forms.exercise.fillTextHelp',
              'Use ___ (three underscores) to indicate blanks in the text'
            )}
          </p>
          <span className="text-xs text-gray-500">
            {data.text ? data.text.length : 0}/1000
          </span>
        </div>
        
        {/* Blank count indicator */}
        {data.text && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-800">
                {t('creator.forms.exercise.blanksFound', 'Blanks found in text: {{count}}', { count: blankCount })}
              </span>
              <span className={`font-medium ${blanksMatch ? 'text-green-600' : 'text-yellow-600'}`}>
                {blanksMatch ? '✓' : '!'}
                {t('creator.forms.exercise.blanksConfigured', 'Configured: {{count}}', { count: configuredBlanks })}
              </span>
            </div>
            {!blanksMatch && blankCount > 0 && (
              <p className="text-xs text-yellow-700 mt-1">
                {t('creator.forms.exercise.blanksMismatch', 'Number of blanks in text doesn\'t match configured blanks')}
              </p>
            )}
          </div>
        )}
        
        {errors?.text && (
          <p className="mt-1 text-sm text-red-600">{errors.text}</p>
        )}
      </div>

      {/* Blanks Configuration */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('creator.forms.exercise.blanks', 'Blanks Configuration')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <span className="text-xs text-gray-500">
              {configuredBlanks}/10 blanks configured
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBlankAdd}
            disabled={configuredBlanks >= 10}
          >
            {t('creator.forms.exercise.addBlank', 'Add Blank')}
          </Button>
        </div>

        {data.blanks && data.blanks.length > 0 ? (
          <div className="space-y-4">
            {data.blanks.map((blank: any, blankIndex: number) => (
              <div
                key={blankIndex}
                className="p-4 border border-neutral-200 rounded-lg bg-neutral-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">
                    {t('creator.forms.exercise.blank', 'Blank')} #{blankIndex + 1}
                  </h4>
                  {data.blanks.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleBlankRemove(blankIndex)}
                    >
                      {t('common.buttons.remove', 'Remove')}
                    </Button>
                  )}
                </div>

                {/* Correct Answers */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('creator.forms.exercise.correctAnswers', 'Correct Answers')}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <span className="text-xs text-gray-500">
                        {blank.correct_answers ? blank.correct_answers.length : 0}/5 answers
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnswerAdd(blankIndex)}
                      disabled={(blank.correct_answers?.length || 0) >= 5}
                    >
                      {t('creator.forms.exercise.addAnswer', 'Add Answer')}
                    </Button>
                  </div>

                  {blank.correct_answers && blank.correct_answers.length > 0 && (
                    <div className="space-y-2">
                      {blank.correct_answers.map((answer: string, answerIndex: number) => (
                        <div key={answerIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            className="input flex-1"
                            value={answer}
                            onChange={(e) => handleAnswerChange(blankIndex, answerIndex, e.target.value)}
                            placeholder={t(
                              'creator.forms.exercise.answerPlaceholder',
                              `Answer ${answerIndex + 1}`
                            )}
                          />
                          {blank.correct_answers.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAnswerRemove(blankIndex, answerIndex)}
                            >
                              {t('common.buttons.remove', 'Remove')}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hints */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        {t('creator.forms.exercise.hints', 'Hints (Optional)')}
                      </label>
                      <span className="text-xs text-gray-500">
                        {blank.hints ? blank.hints.length : 0}/3 hints
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleHintAdd(blankIndex)}
                      disabled={(blank.hints?.length || 0) >= 3}
                    >
                      {t('creator.forms.exercise.addHint', 'Add Hint')}
                    </Button>
                  </div>

                  {blank.hints && blank.hints.length > 0 && (
                    <div className="space-y-2">
                      {blank.hints.map((hint: string, hintIndex: number) => (
                        <div key={hintIndex} className="flex items-center space-x-2">
                          <input
                            type="text"
                            className="input flex-1"
                            value={hint}
                            onChange={(e) => handleHintChange(blankIndex, hintIndex, e.target.value)}
                            placeholder={t(
                              'creator.forms.exercise.hintPlaceholder',
                              `Hint ${hintIndex + 1}`
                            )}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleHintRemove(blankIndex, hintIndex)}
                          >
                            {t('common.buttons.remove', 'Remove')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-neutral-500 border border-dashed border-neutral-300 rounded-lg">
            {t('creator.forms.exercise.noBlanks', 'No blanks configured. Add a blank to get started.')}
          </div>
        )}

        {errors?.blanks && (
          <p className="mt-1 text-sm text-error">{errors.blanks}</p>
        )}
      </div>
    </div>
  );
};

export default FillInTheBlankExerciseForm;