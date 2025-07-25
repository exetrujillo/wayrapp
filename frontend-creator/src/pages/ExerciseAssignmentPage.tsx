import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ExerciseAssignmentForm } from '../components/forms';
import { lessonService } from '../services/lessonService';
import { Feedback } from '../components/ui/Feedback';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Lesson } from '../utils/types';

const ExerciseAssignmentPage: React.FC = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [lesson, setLesson] = useState<Lesson | null>(null);
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
        const lessonData = await lessonService.getLesson(lessonId);
        setLesson(lessonData);
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