import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { CourseForm } from '../components/forms/CourseForm';
import { Course } from '../utils/types';

const CreateCoursePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageTitle = t('creator.pages.createCourse.title', 'Create Course');

  const handleSuccess = (course: Course) => {
    // Navigate to the course detail page after successful creation
    // This ensures the user can immediately start managing the course structure
    navigate(`/courses/${course.id}`, { 
      replace: true,
      state: { 
        message: t('creator.pages.createCourse.successMessage', 'Course created successfully!'),
        type: 'success'
      }
    });
  };

  const handleCancel = () => {
    // Navigate back to courses list
    navigate('/courses');
  };

  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              {pageTitle}
            </h1>
            <p className="text-neutral-600">
              {t('creator.pages.createCourse.description', 'Create a new course to start building educational content for your students.')}
            </p>
          </div>
          
          <CourseForm 
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </Layout>
    </>
  );
};

export default CreateCoursePage;