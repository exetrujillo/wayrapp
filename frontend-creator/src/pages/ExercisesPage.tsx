import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui';

const ExercisesPage: React.FC = () => {
  const { t } = useTranslation();
  const pageTitle = t('common.navigation.exercises');
  
  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">{pageTitle}</h1>
          <Link to="/exercises/create">
            <Button variant="primary">
              {t('creator.exercises.createNew', 'Create New Exercise')}
            </Button>
          </Link>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <p>Exercises content will go here</p>
        </div>
      </Layout>
    </>
  );
};

export default ExercisesPage;