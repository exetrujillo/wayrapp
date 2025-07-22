import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import CourseForm from '../components/forms/CourseForm';
import { Button } from '../components/ui/Button';
import { useTranslation } from 'react-i18next';

const CoursesPage: React.FC = () => {
  const { t } = useTranslation();
  const pageTitle = t('common.navigation.courses');
  const [showForm, setShowForm] = useState(false);
  
  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-neutral-900">{pageTitle}</h1>
          <Button 
            onClick={() => setShowForm(!showForm)}
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                {showForm ? (
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                )}
              </svg>
            }
          >
            {showForm ? t('common.buttons.hideForm', 'Hide Form') : t('creator.forms.course.create', 'Create Course')}
          </Button>
        </div>
        
        {showForm && (
          <div className="mb-6">
            <CourseForm 
              onSuccess={() => {
                // Refresh course list or navigate to the new course
                setShowForm(false);
              }}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg p-6">
          <p>Course list will be displayed here</p>
        </div>
      </Layout>
    </>
  );
};

export default CoursesPage;