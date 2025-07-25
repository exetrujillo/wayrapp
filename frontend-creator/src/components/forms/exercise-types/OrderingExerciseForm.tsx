import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';

interface OrderingExerciseFormProps {
  data: any;
  onChange: (field: string, value: any) => void;
  errors?: any;
}

export const OrderingExerciseForm: React.FC<OrderingExerciseFormProps> = ({
  data,
  onChange,
  errors,
}) => {
  const { t } = useTranslation();

  const handleItemAdd = () => {
    const items = data.items || [];
    onChange('items', [
      ...items,
      {
        id: crypto.randomUUID(),
        text: '',
      },
    ]);
  };

  const handleItemRemove = (index: number) => {
    const items = [...(data.items || [])];
    items.splice(index, 1);
    onChange('items', items);
  };

  const handleItemChange = (index: number, value: string) => {
    const items = [...(data.items || [])];
    items[index] = { ...items[index], text: value };
    onChange('items', items);
  };

  const handleItemMove = (index: number, direction: 'up' | 'down') => {
    const items = [...(data.items || [])];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < items.length) {
      [items[index], items[newIndex]] = [items[newIndex], items[index]];
      onChange('items', items);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-neutral-700">
          {t('creator.forms.exercise.itemsToOrder', 'Items to Order')}
          <span className="text-error ml-1">*</span>
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleItemAdd}
        >
          {t('creator.forms.exercise.addItem', 'Add Item')}
        </Button>
      </div>

      <div className="text-sm text-neutral-600 mb-3">
        {t(
          'creator.forms.exercise.orderingHelp',
          'Items will be presented to students in random order. The correct order is determined by the sequence below.'
        )}
      </div>

      {data.items && data.items.length > 0 ? (
        <div className="space-y-3">
          {data.items.map((item: any, index: number) => (
            <div
              key={item.id}
              className="flex items-center space-x-3 p-3 border border-neutral-200 rounded-lg bg-neutral-50"
            >
              <div className="flex flex-col space-y-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleItemMove(index, 'up')}
                  disabled={index === 0}
                  className="p-1 h-6 w-6"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleItemMove(index, 'down')}
                  disabled={index === data.items.length - 1}
                  className="p-1 h-6 w-6"
                >
                  ↓
                </Button>
              </div>

              <div className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm font-medium">
                {index + 1}
              </div>

              <input
                type="text"
                className="input flex-1"
                value={item.text || ''}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={t(
                  'creator.forms.exercise.itemPlaceholder',
                  `Item ${index + 1}`
                )}
              />

              {data.items.length > 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleItemRemove(index)}
                  className="text-error border-error hover:bg-error hover:text-white"
                >
                  {t('common.buttons.remove', 'Remove')}
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-neutral-500 border border-dashed border-neutral-300 rounded-lg">
          {t('creator.forms.exercise.noItems', 'No items configured. Add items to get started.')}
        </div>
      )}

      {errors?.items && (
        <p className="mt-1 text-sm text-error">{errors.items}</p>
      )}
    </div>
  );
};

export default OrderingExerciseForm;