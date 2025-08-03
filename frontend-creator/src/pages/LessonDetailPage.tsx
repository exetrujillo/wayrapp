import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Layout } from '../components/layout/Layout';


import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Feedback } from '../components/ui/Feedback';
import { AssignedExercisesList, ExerciseAssignmentModal } from '../components/content';
import { useLessonQuery, useLessonExercisesQuery } from '../hooks/useLessons';

/**
 * LessonDetailPage - Dedicated page for lesson exercise management
 * 
 * Features:
 * - Lesson metadata and edit options
 * - Assigned exercises list with drag-and-drop reordering
 * - Exercise assignment modal for selecting from global bank
 * - Exercise unassignment functionality
 */
export const LessonDetailPage: React.FC = () => {
  const { moduleId, lessonId } = useParams<{ 
    courseId: string; 
    levelId: string; 
    sectionId: string; 
    moduleId: string; 
    lessonId: string; 
  }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  // State for modal management
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  // Fetch lesson data and exercises
  const {
    data: lesson,
    isLoading: isLessonLoading,
    error: lessonError,
  } = useLessonQuery(moduleId || '', lessonId || '', !!lessonId && !!moduleId);

  const {
    data: exercises,
    isLoading: isExercisesLoading,
    error: exercisesError,
  } = useLessonExercisesQuery(lessonId || '', !!lessonId);

  // Handle loading states
  if (isLessonLoading || isExercisesLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  // Handle errors
  if (lessonError || exercisesError || !lesson) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="space-y-4">
            <Feedback
              type="error"
              message={
                lessonError?.message || 
                exercisesError?.message || 
                t('creator.pages.lessonDetail.error.notFound', 'Lesson not found')
              }
            />
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
            >
              {t('common.buttons.goBack', 'Go Back')}
            </Button>
          </div>
        </div>
      </Layout>
    );
  }



  const handleAssignExercises = () => {
    setIsAssignmentModalOpen(true);
  };

  const handleCloseAssignmentModal = () => {
    setIsAssignmentModalOpen(false);
  };

  return (
    <>
      <Helmet>
        <title>
          {t('creator.pages.lessonDetail.title', 'Lesson {{id}} - Exercise Management', { id: lesson.id })} | WayrApp Creator
        </title>
        <meta 
          name="description" 
          content={t('creator.pages.lessonDetail.description', 'Manage exercises for lesson {{id}}', { id: lesson.id })} 
        />
      </Helmet>

      <Layout>
        <div className="max-w-6xl mx-auto px-4 py-8">

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">
              {t('creator.pages.lessonDetail.heading', 'Lesson Exercise Management')}
            </h1>
            <p className="text-lg text-neutral-600">
              {t('creator.pages.lessonDetail.subheading', 'Assign and manage exercises for this lesson')}
            </p>
          </div>

          {/* Lesson Information Card */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6 mb-8">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                  {t('creator.pages.lessonDetail.lessonInfo.title', 'Lesson Information')}
                </h2>
                <div className="space-y-2 text-sm text-neutral-600">
                  <div>
                    <span className="font-medium">
                      {t('creator.pages.lessonDetail.lessonInfo.id', 'Lesson ID')}:
                    </span>{' '}
                    {lesson.id}
                  </div>
                  <div>
                    <span className="font-medium">
                      {t('creator.pages.lessonDetail.lessonInfo.experiencePoints', 'Experience Points')}:
                    </span>{' '}
                    {lesson.experiencePoints}
                  </div>
                  <div>
                    <span className="font-medium">
                      {t('creator.pages.lessonDetail.lessonInfo.order', 'Order')}:
                    </span>{' '}
                    {lesson.order}
                  </div>
                  <div>
                    <span className="font-medium">
                      {t('creator.pages.lessonDetail.lessonInfo.moduleId', 'Module ID')}:
                    </span>{' '}
                    {lesson.moduleId}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  variant="primary"
                  onClick={handleAssignExercises}
                  className="flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>{t('creator.pages.lessonDetail.buttons.assignExercise', 'Assign Exercise')}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Assigned Exercises Section */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900">
                    {t('creator.pages.lessonDetail.exercises.title', 'Assigned Exercises')}
                  </h2>
                  <p className="text-sm text-neutral-600 mt-1">
                    {t('creator.pages.lessonDetail.exercises.subtitle', 'Drag and drop to reorder exercises')}
                  </p>
                </div>
                <div className="text-sm text-neutral-500">
                  {exercises?.length || 0} {t('creator.pages.lessonDetail.exercises.count', 'exercises')}
                </div>
              </div>
            </div>

            <div className="p-6">
              <AssignedExercisesList
                lessonId={lessonId!}
                exercises={exercises || []}
              />
            </div>
          </div>
        </div>

        {/* Exercise Assignment Modal */}
        <ExerciseAssignmentModal
          lessonId={lessonId!}
          isOpen={isAssignmentModalOpen}
          onClose={handleCloseAssignmentModal}
        />
      </Layout>
    </>
  );
};

export default LessonDetailPage;