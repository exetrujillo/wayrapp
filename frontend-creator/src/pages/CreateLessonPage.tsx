import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LessonForm } from '../components/forms';

const CreateLessonPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate to lessons list page after successful creation
    navigate('/lessons');
  };

  const handleCancel = () => {
    // Navigate back to lessons list page on cancel
    navigate('/lessons');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('creator.pages.createLesson.title', 'Create New Lesson')}</h1>
        <p className="text-neutral-600">
          {t('creator.pages.createLesson.description', 'Create a new lesson and assign it to a module.')}
        </p>
      </div>
      
      <div className="max-w-3xl">
        <LessonForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  );
};

export default CreateLessonPage;