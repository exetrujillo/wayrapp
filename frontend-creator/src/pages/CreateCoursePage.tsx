import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { EnhancedCourseForm } from '../components/forms/EnhancedCourseForm';
import { Course } from '../utils/types';
import { CourseFormData } from '../utils/validation';
import { courseService } from '../services/courseService';

const CreateCoursePage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageTitle = t('creator.pages.createCourse.title', 'Create Course');

  const handleSubmit = async (data: CourseFormData): Promise<Course> => {
    // Transform the form data to match the API format
    const courseData = {
      id: data.id,
      name: data.name,
      source_language: data.sourceLanguage,
      target_language: data.targetLanguage,
      description: data.description || '',
      is_public: data.isPublic,
    };

    return courseService.createCourse(courseData);
  };

  const handleSuccess = (_course: Course) => {
    // Navigate to the courses list page after successful creation
    // This allows the user to see their new course in the list
    navigate('/courses', { 
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
          
          <EnhancedCourseForm 
            onSubmit={handleSubmit}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </Layout>
    </>
  );
};

export default CreateCoursePage;