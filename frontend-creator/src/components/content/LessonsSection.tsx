import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Lesson } from '../../utils/types';
import { useLessonsQuery, useReorderLessonsMutation } from '../../hooks/useLessons';
import { LessonCard } from './LessonCard';
import { LessonPreviewModal } from './LessonPreviewModal';
import { DroppableContainer } from './DroppableContainer';
import { DraggableLessonItem } from './DraggableLessonItem';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Feedback } from '../ui/Feedback';

interface LessonsSectionProps {
  moduleId: string;
  onLessonClick: (lessonId: string) => void;
  onCreateLesson: () => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lesson: Lesson) => void;
  enableDragDrop?: boolean;
}

/**
 * Enhanced section component for displaying and managing lessons within a module
 * Features:
 * - Drag-and-drop reordering with Pragmatic Drag and Drop
 * - Experience points configuration and validation
 * - Lesson preview functionality
 * - Uses LessonCard for consistent UI patterns
 */
export const LessonsSection: React.FC<LessonsSectionProps> = ({
  moduleId,
  onLessonClick,
  onCreateLesson,
  onEditLesson,
  onDeleteLesson,
  enableDragDrop = true,
}) => {
  const { t } = useTranslation();
  const [dragDisabled, setDragDisabled] = useState(false);
  const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const {
    data: lessonsResponse,
    isLoading,
    error,
    refetch,
  } = useLessonsQuery(moduleId);

  const reorderLessonsMutation = useReorderLessonsMutation();
  const lessons = lessonsResponse?.data || [];

  const handleLessonView = (lesson: Lesson) => {
    onLessonClick(lesson.id);
  };

  const handleLessonPreview = (lesson: Lesson) => {
    setPreviewLesson(lesson);
    setIsPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setIsPreviewOpen(false);
    setPreviewLesson(null);
  };

  /**
   * Handle drag and drop reordering of lessons with Pragmatic Drag and Drop
   */
  const handleReorder = useCallback(async (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) {
      return;
    }

    // Create a new array with reordered lessons
    const reorderedLessons = [...lessons];
    const [removed] = reorderedLessons.splice(startIndex, 1);
    reorderedLessons.splice(endIndex, 0, removed);

    // Extract lesson IDs in the new order
    const lesson_ids = reorderedLessons.map(lesson => lesson.id);

    try {
      setDragDisabled(true);
      await reorderLessonsMutation.mutateAsync({
        moduleId,
        lessonIds: lesson_ids, // Hook expects camelCase, service handles snake_case conversion
      });
    } catch (error) {
      console.error('Failed to reorder lessons:', error);
      // The mutation will handle rollback via onError
    } finally {
      setDragDisabled(false);
    }
  }, [lessons, moduleId, reorderLessonsMutation]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Feedback
        type="error"
        message={error.message || t('creator.components.lessonsSection.loadError', 'Failed to load lessons')}
        onDismiss={() => refetch()}
      />
    );
  }

  return (
    <div className="lessons-section">
      <div className="flex justify-between items-center mb-6">
        <h5 className="text-lg font-semibold text-neutral-900">
          {t('creator.components.lessonsSection.title', 'Module Lessons')}
        </h5>
        <button
          onClick={onCreateLesson}
          className="btn btn-primary btn-sm"
        >
          {t('creator.components.lessonsSection.addLesson', 'Add Lesson')}
        </button>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="text-neutral-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-neutral-500 mb-4">
            {t('creator.components.lessonsSection.noLessons', 'No lessons found. Create your first lesson!')}
          </p>
          <button
            onClick={onCreateLesson}
            className="btn btn-primary btn-sm"
          >
            {t('creator.components.lessonsSection.createFirst', 'Create First Lesson')}
          </button>
        </div>
      ) : enableDragDrop ? (
        // Drag and drop enabled with Pragmatic Drag and Drop
        <DroppableContainer onReorder={handleReorder} className="space-y-3">
          {lessons.map((lesson, index) => (
            <DraggableLessonItem
              key={lesson.id}
              lesson={lesson}
              index={index}
              onView={handleLessonView}
              onPreview={handleLessonPreview}
              onEdit={onEditLesson}
              onDelete={onDeleteLesson}
              showActions={true}
              showSelection={false}
              isDragDisabled={dragDisabled}
            />
          ))}
        </DroppableContainer>
      ) : (
        // Drag and drop disabled
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              onView={handleLessonView}
              onPreview={handleLessonPreview}
              onEdit={onEditLesson}
              onDelete={onDeleteLesson}
              showSelection={false}
              showActions={true}
            />
          ))}
        </div>
      )}

      {/* Lesson Preview Modal */}
      <LessonPreviewModal
        lesson={previewLesson}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        onEdit={onEditLesson}
      />
    </div>
  );
};

export default LessonsSection;