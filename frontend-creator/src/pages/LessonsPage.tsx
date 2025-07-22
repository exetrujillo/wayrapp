import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Feedback } from '../components/ui/Feedback';
import { lessonService } from '../services/lessonService';
import { Lesson } from '../utils/types';
import LessonCard from '../components/content/LessonCard';

const LessonsPage: React.FC = () => {
  const { t } = useTranslation();
  const pageTitle = t('common.navigation.lessons');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const response = await lessonService.getLessons();
        setLessons(response.data);
      } catch (err: any) {
        setError(err.message || t('common.messages.error', 'An error occurred'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLessons();
  }, [t]);
  
  const handleEditLesson = (lesson: Lesson) => {
    // Implement edit functionality
    console.log('Edit lesson:', lesson);
  };
  
  const handleDeleteLesson = async (lesson: Lesson) => {
    if (window.confirm(t('creator.pages.lessons.deleteConfirm', 'Are you sure you want to delete this lesson?'))) {
      try {
        await lessonService.deleteLesson(lesson.id);
        setLessons(lessons.filter(l => l.id !== lesson.id));
      } catch (err: any) {
        setError(err.message || t('common.messages.error', 'An error occurred'));
      }
    }
  };
  
  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{pageTitle}</h1>
          <Link to="/lessons/create">
            <Button variant="primary">
              {t('creator.pages.lessons.createButton', 'Create Lesson')}
            </Button>
          </Link>
        </div>
        
        {error && (
          <div className="mb-6">
            <Feedback
              type="error"
              message={error}
              onDismiss={() => setError(null)}
            />
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : lessons.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 text-center">
            <p className="text-neutral-500">
              {t('creator.pages.lessons.noLessons', 'No lessons found. Create your first lesson!')}
            </p>
            <div className="mt-4">
              <Link to="/lessons/create">
                <Button variant="primary">
                  {t('creator.pages.lessons.createButton', 'Create Lesson')}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onEdit={handleEditLesson}
                onDelete={handleDeleteLesson}
              />
            ))}
          </div>
        )}
      </Layout>
    </>
  );
};

export default LessonsPage;