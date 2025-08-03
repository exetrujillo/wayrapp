import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { HierarchicalNavigator } from '../components/navigation/HierarchicalNavigator';
import { HierarchyPath } from '../utils/breadcrumbUtils';
import { useTranslation } from 'react-i18next';

const CoursesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageTitle = t('common.navigation.courses');

  // State for hierarchical navigation
  const [currentPath, setCurrentPath] = useState<HierarchyPath>({});

  // Handle navigation within the hierarchy
  const handleNavigate = useCallback((path: HierarchyPath) => {
    setCurrentPath(path);
    
    // Navigate to the appropriate route based on the path
    if (path.courseId && path.levelId && path.sectionId && path.moduleId) {
      navigate(`/courses/${path.courseId}/levels/${path.levelId}/sections/${path.sectionId}/modules/${path.moduleId}`);
    } else if (path.courseId && path.levelId && path.sectionId) {
      navigate(`/courses/${path.courseId}/levels/${path.levelId}/sections/${path.sectionId}`);
    } else if (path.courseId && path.levelId) {
      navigate(`/courses/${path.courseId}/levels/${path.levelId}`);
    } else if (path.courseId) {
      navigate(`/courses/${path.courseId}`);
    } else {
      navigate('/courses');
    }
  }, [navigate]);

  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <div className="h-full">
          <HierarchicalNavigator
            currentPath={currentPath}
            onNavigate={handleNavigate}
            showSearch={true}
            showStatistics={true}
          />
        </div>
      </Layout>
    </>
  );
};

export default CoursesPage;