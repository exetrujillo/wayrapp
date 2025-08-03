import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExerciseAssignmentForm } from '../components/forms';
// import { lessonService } from '../services/lessonService'; // Temporarily disabled
import { Feedback } from '../components/ui/Feedback';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Lesson } from '../utils/types';

const ExerciseAssignmentPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [lesson] = useState<Lesson | null>(null); // setLesson temporarily disabled
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) {
        setError(t('common.messages.missingId', 'Lesson ID is missing'));
        setIsLoading(false);
        return;
      }

      try {
        // TODO: This page needs to be updated to use hierarchical routes
        // The new lessonService.getLesson requires both moduleId and lessonId
        // For now, we'll need to either:
        // 1. Update the route to include moduleId: /modules/:moduleId/lessons/:lessonId/exercises
        // 2. Create a separate method for flat lesson access
        // 3. Deprecate this page in favor of the hierarchical lesson detail page
        
        // Temporarily disabled - needs moduleId
        // const lessonData = await lessonService.getLesson(lessonId);
        // setLesson(lessonData);
        
        setError('This page needs to be updated for the new hierarchical API structure');
      } catch (err: any) {
        setError(err.message || t('common.messages.error', 'An error occurred'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, t]);

  const handleBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !lessonId) {
    return (
      <div className="p-6">
        <Feedback
          type="error"
          message={error || t('common.messages.missingId', 'Lesson ID is missing')}
        />
        <div className="mt-4">
          <Button variant="outline" onClick={handleBack}>
            {t('common.buttons.back', 'Back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            {t('creator.pages.exerciseAssignment.title', 'Assign Exercises to Lesson')}
          </h1>
          {lesson && (
            <p className="text-neutral-600">
              {t('creator.pages.exerciseAssignment.lessonName', 'Lesson')}: #{lesson.order} ({lesson.experiencePoints} XP)
            </p>
          )}
        </div>
        <Button variant="outline" onClick={handleBack}>
          {t('common.buttons.back', 'Back')}
        </Button>
      </div>

      <ExerciseAssignmentForm
        lessonId={lessonId}
        onSuccess={() => {
          // Success is handled within the form
        }}
      />
    </div>
  );
};

export default ExerciseAssignmentPage;