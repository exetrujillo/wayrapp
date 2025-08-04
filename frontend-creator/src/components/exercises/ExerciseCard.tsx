import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Exercise } from '../../utils/types';
import { Button } from '../ui/Button';
import { useExerciseUsageQuery } from '../../hooks/useExercises';
import { ExerciseUsageDashboard } from './ExerciseUsageDashboard';
import { Modal } from '../ui/Modal';

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect?: (exercise: Exercise) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
  showUsageIndicator?: boolean;
  showUsageDashboard?: boolean;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onSelect,
  selectionMode = false,
  isSelected = false,
  onSelectionChange,
  showUsageIndicator = true,
  showUsageDashboard = false,
}) => {
  const { t } = useTranslation();
  const [showUsageModal, setShowUsageModal] = useState(false);

  // Fetch usage data if usage indicator is enabled
  const {
    data: usageData,
    isLoading: usageLoading,
  } = useExerciseUsageQuery(exercise.id, showUsageIndicator);

  const getExerciseTypeIcon = (type: string) => {
    switch (type) {
      case 'translation':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        );
      case 'fill_in_the_blank':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'vof':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'pairs':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'informative':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'ordering':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getExerciseTypeColor = (type: string) => {
    switch (type) {
      case 'translation':
        return 'bg-blue-100 text-blue-800';
      case 'fill_in_the_blank':
        return 'bg-green-100 text-green-800';
      case 'vof':
        return 'bg-purple-100 text-purple-800';
      case 'pairs':
        return 'bg-orange-100 text-orange-800';
      case 'informative':
        return 'bg-gray-100 text-gray-800';
      case 'ordering':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExercisePreview = (exercise: Exercise): string => {
    const { exerciseType, data } = exercise;

    switch (exerciseType) {
      case 'translation':
        return data.source_text || 'Translation exercise';
      case 'fill-in-the-blank':
        return data.text || 'Fill in the blank exercise';
      case 'vof':
        return data.statement || 'True/False exercise';
      case 'pairs':
        return `Match ${data.pairs?.length || 0} pairs`;
      case 'informative':
        return data.content ? data.content.substring(0, 100) + '...' : 'Informative content';
      case 'ordering':
        return `Order ${data.items?.length || 0} items`;
      default:
        return 'Exercise content';
    }
  };

  const handleCardClick = () => {
    if (selectionMode && onSelectionChange) {
      onSelectionChange(!isSelected);
    } else if (onSelect) {
      onSelect(exercise);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onSelectionChange) {
      onSelectionChange(e.target.checked);
    }
  };

  return (
    <div
      className={`relative bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 ${selectionMode ? 'cursor-pointer' : ''
        } ${isSelected ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200'}`}
      onClick={handleCardClick}
    >
      {/* Selection Checkbox */}
      {selectionMode && (
        <div className="absolute top-3 left-3 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExerciseTypeColor(exercise.exerciseType)}`}>
              {getExerciseTypeIcon(exercise.exerciseType)}
              <span className="ml-1">
                {t(`exercises.types.${exercise.exerciseType}`, exercise.exerciseType.replace('_', ' ').toUpperCase())}
              </span>
            </div>
          </div>

          {showUsageIndicator && (
            <div 
              className="flex items-center text-xs text-gray-500 hover:text-blue-600 cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (showUsageDashboard) {
                  setShowUsageModal(true);
                }
              }}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              {usageLoading ? (
                <span>{t('exercises.card.loadingUsage', 'Loading...')}</span>
              ) : usageData ? (
                <span>
                  {t('exercises.card.usedInLessons', 'Used in {{count}} lessons', { 
                    count: usageData.totalLessons 
                  })}
                </span>
              ) : (
                <span>{t('exercises.card.usedInLessons', 'Used in {{count}} lessons', { count: 0 })}</span>
              )}
              {showUsageDashboard && (
                <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              )}
            </div>
          )}
        </div>

        {/* Content Preview */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-3">
            {getExercisePreview(exercise)}
          </p>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <span>
            {t('exercises.card.id', 'ID: {{id}}', { id: exercise.id.substring(0, 8) })}
          </span>
          <span>
            {t('exercises.card.created', 'Created {{date}}', {
              date: new Date(exercise.createdAt).toLocaleDateString()
            })}
          </span>
        </div>

        {/* Actions */}
        {!selectionMode && (
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement preview functionality
              }}
            >
              {t('exercises.card.preview', 'Preview')}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement edit functionality
              }}
            >
              {t('exercises.card.edit', 'Edit')}
            </Button>

            {showUsageDashboard && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowUsageModal(true);
                }}
              >
                {t('exercises.card.usage', 'Usage')}
              </Button>
            )}

            {onSelect && (
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(exercise);
                }}
              >
                {t('exercises.card.select', 'Select')}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Usage Dashboard Modal */}
      {showUsageModal && (
        <Modal
          isOpen={showUsageModal}
          onClose={() => setShowUsageModal(false)}
          title={t('exercises.usage.title', 'Exercise Usage Dashboard')}
          size="xl"
        >
          <ExerciseUsageDashboard
            exerciseId={exercise.id}
            onClose={() => setShowUsageModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};