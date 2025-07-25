import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { DynamicExerciseForm } from '../components/forms';

const CreateExercisePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageTitle = t('creator.pages.createExercise.title', 'Create Exercise');
  
  const handleSuccess = () => {
    navigate('/exercises');
  };
  
  const handleCancel = () => {
    navigate('/exercises');
  };
  
  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <DynamicExerciseForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </Layout>
    </>
  );
};

export default CreateExercisePage;