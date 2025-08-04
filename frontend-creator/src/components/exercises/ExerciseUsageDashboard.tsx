import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    useExerciseUsageQuery,
    useExerciseDeleteImpactQuery,
    useExerciseAnalyticsQuery,
    useDuplicateExerciseMutation
} from '../../hooks/useExercises';
import { ExerciseDuplicationOptions } from '../../utils/types';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Feedback } from '../ui/Feedback';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';

interface ExerciseUsageDashboardProps {
    exerciseId: string;
    onClose?: () => void;
}

export const ExerciseUsageDashboard: React.FC<ExerciseUsageDashboardProps> = ({
    exerciseId,
    onClose,
}) => {
    const { t } = useTranslation();
    const [showDeleteImpact, setShowDeleteImpact] = useState(false);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);
    const [duplicateId, setDuplicateId] = useState('');
    const [duplicateModifications, setDuplicateModifications] = useState('{}');

    // Fetch exercise usage data
    const {
        data: usage,
        isLoading: usageLoading,
        error: usageError,
    } = useExerciseUsageQuery(exerciseId);

    // Fetch analytics data
    const {
        data: analytics,
        isLoading: analyticsLoading,
        error: analyticsError,
    } = useExerciseAnalyticsQuery(exerciseId);

    // Fetch delete impact (only when requested)
    const {
        data: deleteImpact,
        isLoading: deleteImpactLoading,
        error: deleteImpactError,
    } = useExerciseDeleteImpactQuery(exerciseId, showDeleteImpact);

    // Duplicate exercise mutation
    const duplicateExerciseMutation = useDuplicateExerciseMutation();

    const handleDuplicate = async () => {
        if (!duplicateId.trim()) return;

        try {
            const modifications = duplicateModifications.trim()
                ? JSON.parse(duplicateModifications)
                : {};

            const options: ExerciseDuplicationOptions = {
                id: duplicateId.trim(),
                modifications,
                preserveUsage: false
            };

            await duplicateExerciseMutation.mutateAsync({ id: exerciseId, options });
            setShowDuplicateModal(false);
            setDuplicateId('');
            setDuplicateModifications('{}');
        } catch (error) {
            console.error('Failed to duplicate exercise:', error);
        }
    };

    if (usageLoading || analyticsLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (usageError || analyticsError) {
        return (
            <div className="space-y-4">
                <Feedback
                    type="error"
                    message={usageError?.message || analyticsError?.message || t('exercises.usage.loadError', 'Failed to load usage data')}
                />
                {onClose && (
                    <div className="flex justify-center">
                        <Button variant="secondary" onClick={onClose}>
                            {t('common.close', 'Close')}
                        </Button>
                    </div>
                )}
            </div>
        );
    }

    if (!usage || !analytics) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">
                    {t('exercises.usage.noData', 'No usage data available')}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {t('exercises.usage.title', 'Exercise Usage Dashboard')}
                    </h2>
                    <p className="text-gray-600 mt-1">
                        {t('exercises.usage.subtitle', 'Usage statistics and analytics for exercise {{id}}', {
                            id: exerciseId
                        })}
                    </p>
                </div>

                <div className="flex space-x-2">
                    <Button
                        variant="secondary"
                        onClick={() => setShowDuplicateModal(true)}
                    >
                        {t('exercises.usage.duplicate', 'Duplicate')}
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setShowDeleteImpact(true)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {t('exercises.usage.analyzeDelete', 'Analyze Delete Impact')}
                    </Button>
                    {onClose && (
                        <Button variant="secondary" onClick={onClose}>
                            {t('common.close', 'Close')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Usage Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                            {usage.totalLessons}
                        </div>
                        <div className="text-sm text-gray-600">
                            {t('exercises.usage.totalLessons', 'Total Lessons')}
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                            {analytics.usageStats.uniqueCourses}
                        </div>
                        <div className="text-sm text-gray-600">
                            {t('exercises.usage.uniqueCourses', 'Unique Courses')}
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                            {usage.usageFrequency.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">
                            {t('exercises.usage.frequency', 'Usage/Month')}
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600 mb-2">
                            {analytics.usageStats.averagePosition.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600">
                            {t('exercises.usage.avgPosition', 'Avg Position')}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Performance Metrics */}
            {analytics.performanceMetrics.completionRate && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        {t('exercises.usage.performance', 'Performance Metrics')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 mb-1">
                                {analytics.performanceMetrics.completionRate}%
                            </div>
                            <div className="text-sm text-gray-600">
                                {t('exercises.usage.completionRate', 'Completion Rate')}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600 mb-1">
                                {analytics.performanceMetrics.averageScore}%
                            </div>
                            <div className="text-sm text-gray-600">
                                {t('exercises.usage.averageScore', 'Average Score')}
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600 mb-1">
                                {analytics.performanceMetrics.averageTimeSpent}s
                            </div>
                            <div className="text-sm text-gray-600">
                                {t('exercises.usage.averageTime', 'Average Time')}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Lessons Using This Exercise */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('exercises.usage.lessonsUsing', 'Lessons Using This Exercise')}
                </h3>
                {usage.lessons.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">
                        {t('exercises.usage.noLessons', 'This exercise is not currently used in any lessons')}
                    </p>
                ) : (
                    <div className="space-y-3">
                        {usage.lessons.map((lesson: any) => (
                            <div
                                key={lesson.lessonId}
                                className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                            >
                                <div>
                                    <div className="font-medium text-gray-900">
                                        {lesson.lessonName}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {lesson.courseName} → {lesson.levelName} → {lesson.sectionName} → {lesson.moduleName}
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500">
                                    {t('exercises.usage.position', 'Position {{order}}', { order: lesson.order })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* Usage Trends */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('exercises.usage.trends', 'Usage Trends')}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Weekly Usage */}
                    <div>
                        <h4 className="text-md font-medium text-gray-700 mb-3">
                            {t('exercises.usage.weeklyTrend', 'Weekly Usage')}
                        </h4>
                        <div className="space-y-2">
                            {analytics.trends.weeklyUsage.slice(-6).map((week: any) => (
                                <div key={week.week} className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">{week.week}</span>
                                    <div className="flex items-center">
                                        <div
                                            className="bg-blue-200 h-2 rounded mr-2"
                                            style={{ width: `${Math.max(week.count * 10, 10)}px` }}
                                        />
                                        <span className="text-sm font-medium">{week.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Monthly Usage */}
                    <div>
                        <h4 className="text-md font-medium text-gray-700 mb-3">
                            {t('exercises.usage.monthlyTrend', 'Monthly Usage')}
                        </h4>
                        <div className="space-y-2">
                            {analytics.trends.monthlyUsage.map((month: any) => (
                                <div key={month.month} className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">{month.month}</span>
                                    <div className="flex items-center">
                                        <div
                                            className="bg-green-200 h-2 rounded mr-2"
                                            style={{ width: `${Math.max(month.count * 3, 10)}px` }}
                                        />
                                        <span className="text-sm font-medium">{month.count}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Delete Impact Modal */}
            {showDeleteImpact && (
                <Modal
                    isOpen={showDeleteImpact}
                    onClose={() => setShowDeleteImpact(false)}
                    title={t('exercises.usage.deleteImpact', 'Delete Impact Analysis')}
                >
                    <div className="space-y-4">
                        {deleteImpactLoading ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner size="md" />
                            </div>
                        ) : deleteImpactError ? (
                            <Feedback
                                type="error"
                                message={deleteImpactError.message || t('exercises.usage.deleteImpactError', 'Failed to analyze delete impact')}
                            />
                        ) : deleteImpact ? (
                            <>
                                <div className={`p-4 rounded-lg ${deleteImpact.canDelete ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <div className="flex items-center">
                                        <div className={`w-4 h-4 rounded-full mr-3 ${deleteImpact.canDelete ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <span className={`font-medium ${deleteImpact.canDelete ? 'text-green-800' : 'text-red-800'}`}>
                                            {deleteImpact.canDelete
                                                ? t('exercises.usage.safeToDelete', 'Safe to delete')
                                                : t('exercises.usage.notSafeToDelete', 'Not recommended to delete')
                                            }
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-600">{deleteImpact.affectedLessons}</div>
                                        <div className="text-sm text-gray-600">{t('exercises.usage.affectedLessons', 'Affected Lessons')}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">{deleteImpact.affectedCourses}</div>
                                        <div className="text-sm text-gray-600">{t('exercises.usage.affectedCourses', 'Affected Courses')}</div>
                                    </div>
                                </div>

                                {deleteImpact.warnings.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            {t('exercises.usage.warnings', 'Warnings')}
                                        </h4>
                                        <ul className="space-y-1">
                                            {deleteImpact.warnings.map((warning: string, index: number) => (
                                                <li key={index} className="text-sm text-red-600 flex items-start">
                                                    <span className="mr-2">•</span>
                                                    {warning}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {deleteImpact.lessons.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">
                                            {t('exercises.usage.affectedLessonsList', 'Affected Lessons')}
                                        </h4>
                                        <div className="max-h-40 overflow-y-auto space-y-2">
                                            {deleteImpact.lessons.map((lesson: any) => (
                                                <div key={lesson.lessonId} className="text-sm bg-gray-50 p-2 rounded">
                                                    <div className="font-medium">{lesson.lessonName}</div>
                                                    <div className="text-gray-600">{lesson.courseName}</div>
                                                    {lesson.studentCount && (
                                                        <div className="text-xs text-gray-500">
                                                            {t('exercises.usage.studentCount', '{{count}} students', { count: lesson.studentCount })}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : null}

                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="secondary"
                                onClick={() => setShowDeleteImpact(false)}
                            >
                                {t('common.close', 'Close')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Duplicate Exercise Modal */}
            {showDuplicateModal && (
                <Modal
                    isOpen={showDuplicateModal}
                    onClose={() => setShowDuplicateModal(false)}
                    title={t('exercises.usage.duplicateExercise', 'Duplicate Exercise')}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('exercises.usage.newExerciseId', 'New Exercise ID')}
                            </label>
                            <input
                                type="text"
                                value={duplicateId}
                                onChange={(e) => setDuplicateId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={t('exercises.usage.enterNewId', 'Enter new exercise ID')}
                                maxLength={15}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('exercises.usage.modifications', 'Modifications (JSON)')}
                            </label>
                            <textarea
                                value={duplicateModifications}
                                onChange={(e) => setDuplicateModifications(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={4}
                                placeholder='{"difficulty": "hard", "timeLimit": 30}'
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {t('exercises.usage.modificationsHelp', 'Optional JSON object with modifications to apply to the exercise data')}
                            </p>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button
                                variant="secondary"
                                onClick={() => setShowDuplicateModal(false)}
                            >
                                {t('common.cancel', 'Cancel')}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleDuplicate}
                                disabled={!duplicateId.trim() || duplicateExerciseMutation.isPending}
                            >
                                {duplicateExerciseMutation.isPending
                                    ? t('exercises.usage.duplicating', 'Duplicating...')
                                    : t('exercises.usage.duplicate', 'Duplicate')
                                }
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};