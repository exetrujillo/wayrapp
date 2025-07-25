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
    onChange('blanks', [
      ...blanks,
      {
        position: blanks.length,
        correctAnswers: [''],
        hints: [],
      },
    ]);
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
    const answers = [...(blanks[blankIndex].correctAnswers || [])];
    answers.push('');
    blanks[blankIndex] = { ...blanks[blankIndex], correctAnswers: answers };
    onChange('blanks', blanks);
  };

  const handleAnswerChange = (blankIndex: number, answerIndex: number, value: string) => {
    const blanks = [...(data.blanks || [])];
    const answers = [...(blanks[blankIndex].correctAnswers || [])];
    answers[answerIndex] = value;
    blanks[blankIndex] = { ...blanks[blankIndex], correctAnswers: answers };
    onChange('blanks', blanks);
  };

  const handleAnswerRemove = (blankIndex: number, answerIndex: number) => {
    const blanks = [...(data.blanks || [])];
    const answers = [...(blanks[blankIndex].correctAnswers || [])];
    answers.splice(answerIndex, 1);
    blanks[blankIndex] = { ...blanks[blankIndex], correctAnswers: answers };
    onChange('blanks', blanks);
  };

  const handleHintAdd = (blankIndex: number) => {
    const blanks = [...(data.blanks || [])];
    const hints = [...(blanks[blankIndex].hints || [])];
    hints.push('');
    blanks[blankIndex] = { ...blanks[blankIndex], hints };
    onChange('blanks', blanks);
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

  return (
    <div className="space-y-4">
      {/* Text with Blanks */}
      <div>
        <label
          htmlFor="text"
          className="block text-sm font-medium text-neutral-700 mb-1"
        >
          {t('creator.forms.exercise.fillText', 'Text with Blanks')}
          <span className="text-error ml-1">*</span>
        </label>
        <textarea
          id="text"
          className="input w-full min-h-[100px]"
          value={data.text || ''}
          onChange={(e) => onChange('text', e.target.value)}
          placeholder={t(
            'creator.forms.exercise.fillTextPlaceholder',
            'Enter text with ___ for blanks'
          )}
        />
        <p className="mt-1 text-xs text-neutral-500">
          {t(
            'creator.forms.exercise.fillTextHelp',
            'Use ___ (three underscores) to indicate blanks in the text'
          )}
        </p>
        {errors?.text && (
          <p className="mt-1 text-sm text-error">{errors.text}</p>
        )}
      </div>

      {/* Blanks Configuration */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-neutral-700">
            {t('creator.forms.exercise.blanks', 'Blanks Configuration')}
            <span className="text-error ml-1">*</span>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBlankAdd}
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
                    <label className="block text-sm font-medium text-neutral-700">
                      {t('creator.forms.exercise.correctAnswers', 'Correct Answers')}
                      <span className="text-error ml-1">*</span>
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnswerAdd(blankIndex)}
                    >
                      {t('creator.forms.exercise.addAnswer', 'Add Answer')}
                    </Button>
                  </div>

                  {blank.correctAnswers && blank.correctAnswers.length > 0 && (
                    <div className="space-y-2">
                      {blank.correctAnswers.map((answer: string, answerIndex: number) => (
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
                          {blank.correctAnswers.length > 1 && (
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
                    <label className="block text-sm font-medium text-neutral-700">
                      {t('creator.forms.exercise.hints', 'Hints (Optional)')}
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleHintAdd(blankIndex)}
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