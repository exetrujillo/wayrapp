import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';

interface ExerciseBulkActionsProps {
  selectedCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkDelete?: () => void;
  onBulkDuplicate?: () => void;
  onBulkExport?: () => void;
}

export const ExerciseBulkActions: React.FC<ExerciseBulkActionsProps> = ({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onBulkDelete,
  onBulkDuplicate,
  onBulkExport,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        {/* Selection Info */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-blue-900">
              {t('exercises.bulk.selected', '{{count}} exercises selected', { count: selectedCount })}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {t('exercises.bulk.selectAll', 'Select All')}
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={onClearSelection}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {t('exercises.bulk.clearSelection', 'Clear Selection')}
            </button>
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="flex items-center space-x-2">
          {onBulkDuplicate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onBulkDuplicate}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {t('exercises.bulk.duplicate', 'Duplicate')}
            </Button>
          )}

          {onBulkExport && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onBulkExport}
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('exercises.bulk.export', 'Export')}
            </Button>
          )}

          {onBulkDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkDelete}
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('exercises.bulk.delete', 'Delete')}
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Action Descriptions */}
      <div className="mt-3 text-xs text-blue-700">
        <p>
          {t('exercises.bulk.description', 'Bulk actions will be applied to all selected exercises. Use with caution.')}
        </p>
      </div>
    </div>
  );
};