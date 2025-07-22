import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { useTranslation } from 'react-i18next';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <>
      <PageTitle title="Page Not Found" />
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="text-6xl font-bold text-primary-500 mb-4">404</div>
          <h1 className="text-2xl font-semibold text-neutral-800 mb-6">Page Not Found</h1>
          <p className="text-neutral-600 mb-8 text-center max-w-md">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('common.navigation.dashboard')}
          </Link>
        </div>
      </Layout>
    </>
  );
};

export default NotFoundPage;