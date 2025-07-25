import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';

interface PairsExerciseFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: any;
}

export const PairsExerciseForm: React.FC<PairsExerciseFormProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { t } = useTranslation();

  const handlePairAdd = () => {
    const pairs = data.pairs || [];
    onChange('pairs', [...pairs, { left: '', right: '' }]);
  };

  const handlePairRemove = (index: number) => {
    const pairs = [...(data.pairs || [])];
    pairs.splice(index, 1);
    onChange('pairs', pairs);
  };

  const handlePairChange = (index: number, side: 'left' | 'right', value: string) => {
    const pairs = [...(data.pairs || [])];
    pairs[index] = { ...pairs[index], [side]: value };
    onChange('pairs', pairs);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-neutral-700">
          {t('creator.forms.exercise.matchingPairs', 'Matching Pairs')}
          <span className="text-error ml-1">*</span>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePairAdd}
        >
          {t('creator.forms.exercise.addPair', 'Add Pair')}
        </Button>
      </div>

      {data.pairs && data.pairs.length > 0 ? (
        <div className="space-y-4">
          {data.pairs.map((pair: any, index: number) => (
            <div
              key={index}
              className="p-4 border border-neutral-200 rounded-lg bg-neutral-50"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">
                  {t('creator.forms.exercise.pair', 'Pair')} #{index + 1}
                </h4>
                {data.pairs.length > 2 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handlePairRemove(index)}
                  >
                    {t('common.buttons.remove', 'Remove')}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor={`pair-${index}-left`}
                    className="block text-sm font-medium text-neutral-700 mb-1"
                  >
                    {t('creator.forms.exercise.leftItem', 'Left Item')}
                    <span className="text-error ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id={`pair-${index}-left`}
                    className="input w-full"
                    value={pair.left || ''}
                    onChange={(e) => handlePairChange(index, 'left', e.target.value)}
                    placeholder={t(
                      'creator.forms.exercise.leftItemPlaceholder',
                      'Enter left item'
                    )}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`pair-${index}-right`}
                    className="block text-sm font-medium text-neutral-700 mb-1"
                  >
                    {t('creator.forms.exercise.rightItem', 'Right Item')}
                    <span className="text-error ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    id={`pair-${index}-right`}
                    className="input w-full"
                    value={pair.right || ''}
                    onChange={(e) => handlePairChange(index, 'right', e.target.value)}
                    placeholder={t(
                      'creator.forms.exercise.rightItemPlaceholder',
                      'Enter right item'
                    )}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500 border border-dashed border-neutral-300 rounded-lg">
          {t('creator.forms.exercise.noPairs', 'No pairs configured. Add a pair to get started.')}
        </div>
      )}

      {errors?.pairs && (
        <p className="mt-1 text-sm text-error">{errors.pairs}</p>
      )}
    </div>
  );
};

export default PairsExerciseForm;