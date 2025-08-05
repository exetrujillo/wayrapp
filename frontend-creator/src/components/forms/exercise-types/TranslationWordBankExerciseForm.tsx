import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import { Textarea } from '../../ui/Textarea';

interface TranslationWordBankExerciseFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: any;
}

export const TranslationWordBankExerciseForm: React.FC<TranslationWordBankExerciseFormProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { t } = useTranslation();

  // Auto-generate correct words from target text
  const generateCorrectWords = () => {
    if (!data.target_text) return;

    const words = data.target_text
      .trim()
      .split(/\s+/)
      .filter((word: string) => word.length > 0)
      .map((word: string) => word.replace(/[.,!?;:]$/, '')); // Remove punctuation

    console.log('Generated correct words:', words);
    console.log('Current data.correct_words:', data.correct_words);

    console.log('Calling onChange with correct_words:', words);
    onChange('correct_words', words);
    
    // Also log after a small delay to see if it updated
    setTimeout(() => {
      console.log('After onChange - data.correct_words:', data.correct_words);
    }, 100);

    // If word bank is empty, start with correct words
    if (!data.word_bank || data.word_bank.length === 0) {
      onChange('word_bank', [...words]);
    }
  };

  const handleWordBankAdd = () => {
    const wordBank = data.word_bank || [];
    if (wordBank.length < 20) { // Max 20 words
      onChange('word_bank', [...wordBank, '']);
    }
  };

  const handleWordBankRemove = (index: number) => {
    const wordBank = [...(data.word_bank || [])];
    wordBank.splice(index, 1);
    onChange('word_bank', wordBank);
  };

  const handleWordBankChange = (index: number, value: string) => {
    const wordBank = [...(data.word_bank || [])];
    wordBank[index] = value.trim();
    onChange('word_bank', wordBank);
  };

  const handleWordBankMove = (index: number, direction: 'up' | 'down') => {
    const wordBank = [...(data.word_bank || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < wordBank.length) {
      [wordBank[index], wordBank[newIndex]] = [wordBank[newIndex], wordBank[index]];
      onChange('word_bank', wordBank);
    }
  };

  // Calculate word counts
  const sourceWordCount = data.source_text ? data.source_text.trim().split(/\s+/).filter(Boolean).length : 0;
  const targetWordCount = data.target_text ? data.target_text.trim().split(/\s+/).filter(Boolean).length : 0;
  const correctWordsCount = data.correct_words ? data.correct_words.length : 0;
  const wordBankCount = data.word_bank ? data.word_bank.filter((word: string) => word.trim().length > 0).length : 0;

  // Debug logging for word counts
  console.log('Word counts debug:', {
    'data.correct_words': data.correct_words,
    correctWordsCount,
    'data.word_bank': data.word_bank,
    wordBankCount
  });

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
            'Enter text in source language (e.g., "Yo estoy aprendiendo español")'
          )}
          error={errors?.source_text}
          isRequired
          fullWidth
          maxLength={500}
          showCharCount
          minHeight="80px"
          isSuccess={!errors?.source_text && data.source_text && data.source_text.trim().length > 0}
        />
        {sourceWordCount > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {t('creator.forms.exercise.wordCount', '{{count}} words', { count: sourceWordCount })}
            {sourceWordCount > 20 && (
              <span className="text-yellow-600 ml-2">
                {t('creator.forms.exercise.longTextWarning', 'Consider shorter sentences for word bank exercises')}
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
            'Enter expected translation (e.g., "I am learning Spanish")'
          )}
          error={errors?.target_text}
          isRequired
          fullWidth
          maxLength={500}
          showCharCount
          minHeight="80px"
          isSuccess={!errors?.target_text && data.target_text && data.target_text.trim().length > 0}
        />
        {targetWordCount > 0 && (
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              {t('creator.forms.exercise.wordCount', '{{count}} words', { count: targetWordCount })}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateCorrectWords}
              disabled={!data.target_text || data.target_text.trim().length === 0}
            >
              {t('creator.forms.exercise.generateWords', 'Generate Words')}
            </Button>
          </div>
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

      {/* Word Bank */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('creator.forms.exercise.wordBank', 'Word Bank')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <span className="text-xs text-gray-500">
              {wordBankCount}/20 words ({correctWordsCount} correct + {wordBankCount - correctWordsCount} distractors)
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleWordBankAdd}
            disabled={wordBankCount >= 20}
          >
            {t('creator.forms.exercise.addWord', 'Add Word')}
          </Button>
        </div>

        <div className="text-sm text-neutral-600 mb-3">
          {t(
            'creator.forms.exercise.wordBankHelp',
            'Include the correct words plus distractor words. Students will select and arrange the correct words to form the translation.'
          )}
        </div>

        {data.word_bank && data.word_bank.length > 0 ? (
          <div className="space-y-2">
            {data.word_bank.map((word: string, index: number) => {
              const isCorrectWord = data.correct_words && data.correct_words.includes(word);
              return (
                <div
                  key={index}
                  className={`flex items-center space-x-3 p-3 border rounded-lg ${isCorrectWord
                      ? 'border-green-200 bg-green-50'
                      : 'border-neutral-200 bg-neutral-50'
                    }`}
                >
                  <div className="flex flex-col space-y-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleWordBankMove(index, 'up')}
                      disabled={index === 0}
                      className="p-1 h-6 w-6"
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleWordBankMove(index, 'down')}
                      disabled={index === data.word_bank.length - 1}
                      className="p-1 h-6 w-6"
                    >
                      ↓
                    </Button>
                  </div>

                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${isCorrectWord
                      ? 'bg-green-100 text-green-600'
                      : 'bg-neutral-100 text-neutral-600'
                    }`}>
                    {index + 1}
                  </div>

                  <input
                    type="text"
                    className="input flex-1"
                    value={word || ''}
                    onChange={(e) => handleWordBankChange(index, e.target.value)}
                    placeholder={t(
                      'creator.forms.exercise.wordPlaceholder',
                      `Word ${index + 1}`
                    )}
                  />

                  {isCorrectWord && (
                    <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-100 rounded">
                      {t('creator.forms.exercise.correctWord', 'Correct')}
                    </span>
                  )}

                  {data.word_bank.length > correctWordsCount && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleWordBankRemove(index)}
                      className="text-error border-error hover:bg-error hover:text-white"
                    >
                      {t('common.buttons.remove', 'Remove')}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-neutral-500 border border-dashed border-neutral-300 rounded-lg">
            {t('creator.forms.exercise.noWords', 'No words configured. Add words to get started.')}
          </div>
        )}

        {errors?.word_bank && (
          <p className="mt-1 text-sm text-error">{errors.word_bank}</p>
        )}
      </div>

      {/* Language Info - Read-only display */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          {t('creator.forms.exercise.languageInfo', 'Language Information')}
        </h4>
        <p className="text-sm text-gray-600">
          {t('creator.forms.exercise.languageInheritance', 'This exercise will inherit the source and target languages from the course it belongs to.')}
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
            <span className={`mr-2 ${correctWordsCount >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
              {correctWordsCount >= 1 ? '✓' : '○'}
            </span>
            <span className="text-gray-700">
              {t('creator.forms.exercise.hasCorrectWords', 'Has correct words ({{count}})', { count: correctWordsCount })}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className={`mr-2 ${wordBankCount >= correctWordsCount + 1 ? 'text-green-600' : 'text-gray-400'}`}>
              {wordBankCount >= correctWordsCount + 1 ? '✓' : '○'}
            </span>
            <span className="text-gray-700">
              {t('creator.forms.exercise.hasDistractors', 'Has distractor words ({{count}})', { count: Math.max(0, wordBankCount - correctWordsCount) })}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className={`mr-2 ${sourceWordCount > 0 && sourceWordCount <= 15 ? 'text-green-600' : sourceWordCount > 15 ? 'text-yellow-600' : 'text-gray-400'}`}>
              {sourceWordCount > 0 && sourceWordCount <= 15 ? '✓' : sourceWordCount > 15 ? '!' : '○'}
            </span>
            <span className="text-gray-700">
              {t('creator.forms.exercise.appropriateLength', 'Appropriate sentence length')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationWordBankExerciseForm;