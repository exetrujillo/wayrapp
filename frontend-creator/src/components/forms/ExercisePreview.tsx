/**
 * Exercise Preview Component
 * 
 * This component provides live preview functionality for different exercise types,
 * showing how the exercise will appear to students.
 * 
 * @module ExercisePreview
 * @category Components
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { ExerciseType } from '../../utils/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

// ============================================================================
// Type Definitions
// ============================================================================

export interface ExercisePreviewProps {
  /** Exercise type */
  exerciseType: ExerciseType;
  /** Exercise data */
  exerciseData: Record<string, any>;
  /** Whether the exercise data is valid */
  isValid: boolean;
  /** Custom CSS classes */
  className?: string;
}

// ============================================================================
// Preview Components for Each Exercise Type
// ============================================================================

const TranslationPreview: React.FC<{ data: any }> = ({ data }) => {
  const { t } = useTranslation();

  if (!data.source_text) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('creator.preview.enterSourceText', 'Enter source text to see preview')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="font-medium text-blue-900 mb-2">
          {t('creator.preview.translateThis', 'Translate this:')}
        </h4>
        <p className="text-blue-800">{data.source_text}</p>
      </div>

      <div className="border-2 border-dashed border-gray-300 p-4 rounded-md">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('creator.preview.yourTranslation', 'Your translation:')}
        </label>
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md"
          rows={3}
          placeholder={t('creator.preview.typeTranslation', 'Type your translation here...')}
          disabled
        />
      </div>

      {data.hints && data.hints.length > 0 && (
        <div className="bg-yellow-50 p-3 rounded-md">
          <h5 className="font-medium text-yellow-900 mb-2">
            {t('creator.preview.hints', 'Hints:')}
          </h5>
          <ul className="list-disc list-inside space-y-1">
            {data.hints.map((hint: string, index: number) => (
              <li key={index} className="text-yellow-800 text-sm">{hint}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const FillInTheBlankPreview: React.FC<{ data: any }> = ({ data }) => {
  const { t } = useTranslation();

  if (!data.text || !data.blanks || data.blanks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('creator.preview.configureBlanks', 'Configure text and blanks to see preview')}
      </div>
    );
  }

  // Replace blanks with input fields for preview
  const renderTextWithBlanks = () => {
    let text = data.text;
    const blankRegex = /___/g;
    const parts = text.split(blankRegex);
    const result = [];

    for (let i = 0; i < parts.length; i++) {
      result.push(parts[i]);
      if (i < parts.length - 1) {
        result.push(
          <input
            key={i}
            type="text"
            className="inline-block mx-1 px-2 py-1 border border-gray-300 rounded text-center min-w-[80px]"
            placeholder="..."
            disabled
          />
        );
      }
    }

    return result;
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="font-medium text-blue-900 mb-3">
          {t('creator.preview.fillBlanks', 'Fill in the blanks:')}
        </h4>
        <div className="text-blue-800 leading-relaxed">
          {renderTextWithBlanks()}
        </div>
      </div>

      {data.blanks.some((blank: any) => blank.hints && blank.hints.length > 0) && (
        <div className="bg-yellow-50 p-3 rounded-md">
          <h5 className="font-medium text-yellow-900 mb-2">
            {t('creator.preview.availableHints', 'Available hints:')}
          </h5>
          {data.blanks.map((blank: any, index: number) => (
            blank.hints && blank.hints.length > 0 && (
              <div key={index} className="mb-2">
                <span className="text-sm font-medium text-yellow-800">
                  {t('creator.preview.blankNumber', 'Blank {{number}}:', { number: index + 1 })}
                </span>
                <ul className="list-disc list-inside ml-4">
                  {blank.hints.map((hint: string, hintIndex: number) => (
                    <li key={hintIndex} className="text-yellow-700 text-sm">{hint}</li>
                  ))}
                </ul>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
};

const VOFPreview: React.FC<{ data: any }> = ({ data }) => {
  const { t } = useTranslation();

  if (!data.statement) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('creator.preview.enterStatement', 'Enter a statement to see preview')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="font-medium text-blue-900 mb-3">
          {t('creator.preview.trueOrFalse', 'True or False?')}
        </h4>
        <p className="text-blue-800 mb-4">{data.statement}</p>
        
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input type="radio" name="vof-preview" className="mr-2" disabled />
            <span className="text-blue-800">{t('creator.preview.true', 'True')}</span>
          </label>
          <label className="flex items-center">
            <input type="radio" name="vof-preview" className="mr-2" disabled />
            <span className="text-blue-800">{t('creator.preview.false', 'False')}</span>
          </label>
        </div>
      </div>

      {data.explanation && (
        <div className="bg-green-50 p-3 rounded-md">
          <h5 className="font-medium text-green-900 mb-2">
            {t('creator.preview.explanation', 'Explanation (shown after answer):')}
          </h5>
          <p className="text-green-800 text-sm">{data.explanation}</p>
        </div>
      )}
    </div>
  );
};

const PairsPreview: React.FC<{ data: any }> = ({ data }) => {
  const { t } = useTranslation();

  if (!data.pairs || data.pairs.length < 2) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('creator.preview.addPairs', 'Add at least 2 pairs to see preview')}
      </div>
    );
  }

  const validPairs = data.pairs.filter((pair: any) => pair.left && pair.right);

  if (validPairs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('creator.preview.completePairs', 'Complete the pairs to see preview')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="font-medium text-blue-900 mb-3">
          {t('creator.preview.matchPairs', 'Match the pairs:')}
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-blue-800 mb-2">
              {t('creator.preview.leftColumn', 'Left Column')}
            </h5>
            <div className="space-y-2">
              {validPairs.map((pair: any, index: number) => (
                <div
                  key={index}
                  className="bg-white p-2 rounded border border-blue-200 cursor-pointer hover:bg-blue-50"
                >
                  {pair.left}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-blue-800 mb-2">
              {t('creator.preview.rightColumn', 'Right Column')}
            </h5>
            <div className="space-y-2">
              {validPairs.map((pair: any, index: number) => (
                <div
                  key={index}
                  className="bg-white p-2 rounded border border-blue-200 cursor-pointer hover:bg-blue-50"
                >
                  {pair.right}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const InformativePreview: React.FC<{ data: any }> = ({ data }) => {
  const { t } = useTranslation();

  if (!data.title && !data.content) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('creator.preview.addContent', 'Add title and content to see preview')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md">
        {data.title && (
          <h4 className="font-bold text-blue-900 mb-3 text-lg">
            {data.title}
          </h4>
        )}
        
        {data.content && (
          <div className="text-blue-800 whitespace-pre-wrap">
            {data.content}
          </div>
        )}

        {data.media && data.media.url && (
          <div className="mt-4">
            {data.media.type === 'image' && (
              <div className="border border-gray-300 rounded-md p-2 bg-white">
                <div className="text-center text-gray-500 py-8">
                  📷 {t('creator.preview.imagePreview', 'Image: {{url}}', { url: data.media.url })}
                  {data.media.alt && (
                    <div className="text-sm mt-1">Alt: {data.media.alt}</div>
                  )}
                </div>
              </div>
            )}
            {data.media.type === 'video' && (
              <div className="border border-gray-300 rounded-md p-2 bg-white">
                <div className="text-center text-gray-500 py-8">
                  🎥 {t('creator.preview.videoPreview', 'Video: {{url}}', { url: data.media.url })}
                </div>
              </div>
            )}
            {data.media.type === 'audio' && (
              <div className="border border-gray-300 rounded-md p-2 bg-white">
                <div className="text-center text-gray-500 py-8">
                  🎵 {t('creator.preview.audioPreview', 'Audio: {{url}}', { url: data.media.url })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-center">
        <Button variant="outline" disabled>
          {t('creator.preview.continue', 'Continue')}
        </Button>
      </div>
    </div>
  );
};

const OrderingPreview: React.FC<{ data: any }> = ({ data }) => {
  const { t } = useTranslation();

  if (!data.items || data.items.length < 2) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('creator.preview.addItems', 'Add at least 2 items to see preview')}
      </div>
    );
  }

  const validItems = data.items.filter((item: any) => item.text);

  if (validItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {t('creator.preview.completeItems', 'Complete the items to see preview')}
      </div>
    );
  }

  // Shuffle items for preview (simulate random order)
  const shuffledItems = [...validItems].sort(() => Math.random() - 0.5);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-md">
        <h4 className="font-medium text-blue-900 mb-3">
          {t('creator.preview.arrangeOrder', 'Arrange in the correct order:')}
        </h4>
        
        <div className="space-y-2">
          {shuffledItems.map((item: any, index: number) => (
            <div
              key={index}
              className="bg-white p-3 rounded border border-blue-200 cursor-move hover:bg-blue-50 flex items-center"
            >
              <div className="mr-3 text-gray-400">
                ⋮⋮
              </div>
              <span className="flex-1">{item.text}</span>
            </div>
          ))}
        </div>
        
        <p className="text-sm text-blue-700 mt-3">
          {t('creator.preview.dragToReorder', 'Drag items to reorder them')}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// Main Preview Component
// ============================================================================

export const ExercisePreview: React.FC<ExercisePreviewProps> = ({
  exerciseType,
  exerciseData,
  isValid,
  className = '',
}) => {
  const { t } = useTranslation();

  const renderPreview = () => {
    if (!isValid) {
      return (
        <div className="text-center py-8 text-yellow-600">
          <div className="mb-2">⚠️</div>
          <p>{t('creator.preview.invalidData', 'Complete the form to see preview')}</p>
        </div>
      );
    }

    switch (exerciseType) {
      case 'translation':
        return <TranslationPreview data={exerciseData} />;
      case 'fill-in-the-blank':
        return <FillInTheBlankPreview data={exerciseData} />;
      case 'vof':
        return <VOFPreview data={exerciseData} />;
      case 'pairs':
        return <PairsPreview data={exerciseData} />;
      case 'informative':
        return <InformativePreview data={exerciseData} />;
      case 'ordering':
        return <OrderingPreview data={exerciseData} />;
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            {t('creator.preview.unsupportedType', 'Preview not available for this exercise type')}
          </div>
        );
    }
  };

  return (
    <div className={`exercise-preview ${className}`}>
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="mb-4 text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {t('creator.preview.studentView', 'Student View')}
          </span>
        </div>
        
        <Card className="bg-white">
          <div className="p-4">
            {renderPreview()}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExercisePreview;