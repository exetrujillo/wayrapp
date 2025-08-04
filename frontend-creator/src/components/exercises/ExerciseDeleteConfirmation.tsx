import React from 'react';
import { useTranslation } from 'react-i18next';
import { useExerciseDeleteImpactQuery } from '../../hooks/useExercises';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Feedback } from '../ui/Feedback';
import { Button } from '../ui/Button';

interface ExerciseDeleteConfirmationProps {
  exerciseId: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export const ExerciseDeleteConfirmation: React.FC<ExerciseDeleteConfirmationProps> = ({
  exerciseId,
  onConfirm,
  onCancel,
  isDeleting = false,
}) => {
  const { t } = useTranslation();

  // Fetch delete impact analysis
  const {
    data: deleteImpact,
    isLoading,
    error,
  } = useExerciseDeleteImpactQuery(exerciseId, true);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
        <p className="text-center text-gray-600">
          {t('exercises.delete.analyzingImpact', 'Analyzing deletion impact...')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Feedback
          type="error"
          message={error.message || t('exercises.delete.analysisError', 'Failed to analyze deletion impact')}
        />
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onCancel}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button 
            variant="primary" 
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting 
              ? t('exercises.delete.deleting', 'Deleting...')
              : t('exercises.delete.forceDelete', 'Delete Anyway')
            }
          </Button>
        </div>
      </div>
    );
  }

  if (!deleteImpact) {
    return (
      <div className="space-y-4">
        <p className="text-gray-600">
          {t('exercises.delete.noImpactData', 'Unable to determine deletion impact')}
        </p>
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onCancel}>
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button 
            variant="primary" 
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting 
              ? t('exercises.delete.deleting', 'Deleting...')
              : t('common.delete', 'Delete')
            }
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Impact Summary */}
      <div className={`p-4 rounded-lg ${deleteImpact.canDelete ? 'bg-green-50' : 'bg-red-50'}`}>
        <div className="flex items-center">
          <div className={`w-4 h-4 rounded-full mr-3 ${deleteImpact.canDelete ? 'bg-green-500' : 'bg-red-500'}`} />
          <div>
            <div className={`font-medium ${deleteImpact.canDelete ? 'text-green-800' : 'text-red-800'}`}>
              {deleteImpact.canDelete 
                ? t('exercises.delete.safeToDelete', 'Safe to delete')
                : t('exercises.delete.notRecommended', 'Deletion not recommended')
              }
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {deleteImpact.canDelete
                ? t('exercises.delete.safeDescription', 'This exercise has minimal usage and can be safely deleted.')
                : t('exercises.delete.notRecommendedDescription', 'This exercise is widely used and deletion may impact content.')
              }
            </div>
          </div>
        </div>
      </div>

      {/* Impact Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{deleteImpact.affectedLessons}</div>
          <div className="text-sm text-gray-600">
            {t('exercises.delete.affectedLessons', 'Affected Lessons')}
          </div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{deleteImpact.affectedCourses}</div>
          <div className="text-sm text-gray-600">
            {t('exercises.delete.affectedCourses', 'Affected Courses')}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {deleteImpact.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {t('exercises.delete.warnings', 'Warnings')}
          </h4>
          <ul className="space-y-1">
            {deleteImpact.warnings.map((warning: string, index: number) => (
              <li key={index} className="text-sm text-yellow-700 flex items-start">
                <span className="mr-2">•</span>
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Affected Lessons Details */}
      {deleteImpact.lessons.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-3">
            {t('exercises.delete.affectedLessonsList', 'Lessons that will be affected:')}
          </h4>
          <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
            {deleteImpact.lessons.map((lesson: any) => (
              <div key={lesson.lessonId} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                <div>
                  <div className="font-medium text-gray-900">{lesson.lessonName}</div>
                  <div className="text-gray-600">{lesson.courseName}</div>
                </div>
                {lesson.studentCount && lesson.studentCount > 0 && (
                  <div className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                    {t('exercises.delete.studentCount', '{{count}} students', { count: lesson.studentCount })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Message */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          {deleteImpact.canDelete
            ? t('exercises.delete.confirmSafe', 'Are you sure you want to delete this exercise? This action cannot be undone.')
            : t('exercises.delete.confirmRisky', 'Are you sure you want to delete this exercise? This will remove it from {{lessonCount}} lessons and may disrupt learning content. This action cannot be undone.', {
                lessonCount: deleteImpact.affectedLessons
              })
          }
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>
          {t('common.cancel', 'Cancel')}
        </Button>
        <Button 
          variant="primary" 
          onClick={onConfirm}
          disabled={isDeleting}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isDeleting 
            ? t('exercises.delete.deleting', 'Deleting...')
            : deleteImpact.canDelete
              ? t('common.delete', 'Delete')
              : t('exercises.delete.forceDelete', 'Delete Anyway')
          }
        </Button>
      </div>
    </div>
  );
};