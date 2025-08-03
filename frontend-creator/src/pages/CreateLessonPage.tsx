import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { UnifiedEntityForm } from '../components/forms/UnifiedEntityForm';
import { useCreateLessonMutation } from '../hooks/useLessons';
import { LessonFormData } from '../utils/validation';

const CreateLessonPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get moduleId from URL params
  const moduleId = searchParams.get('moduleId') || '';

  const createLessonMutation = useCreateLessonMutation();

  const handleSubmit = async (data: LessonFormData) => {
    return await createLessonMutation.mutateAsync({
      moduleId,
      lessonData: data
    });
  };

  const handleSuccess = () => {
    // Navigate to lessons list page after successful creation
    navigate('/lessons');
  };

  const handleCancel = () => {
    // Navigate back to lessons list page on cancel
    navigate('/lessons');
  };

  if (!moduleId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-error mb-4">
            {t('creator.pages.createLesson.noModuleError', 'Module ID Required')}
          </h1>
          <p className="text-neutral-600 mb-4">
            {t('creator.pages.createLesson.noModuleDescription', 'A module ID is required to create a lesson.')}
          </p>
          <button 
            onClick={() => navigate('/lessons')}
            className="btn btn-primary"
          >
            {t('common.buttons.back', 'Back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('creator.pages.createLesson.title', 'Create New Lesson')}</h1>
        <p className="text-neutral-600">
          {t('creator.pages.createLesson.description', 'Create a new lesson and assign it to a module.')}
        </p>
      </div>
      
      <div className="max-w-3xl">
        <UnifiedEntityForm<LessonFormData>
          entityType="lesson"
          mode="create"
          parentId={moduleId}
          onSubmit={handleSubmit}
          onSuccess={handleSuccess} 
          onCancel={handleCancel} 
        />
      </div>
    </div>
  );
};

export default CreateLessonPage;