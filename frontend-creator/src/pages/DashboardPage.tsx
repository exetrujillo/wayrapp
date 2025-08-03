import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { HierarchicalNavigator } from '../components/navigation/HierarchicalNavigator';
import { HierarchyPath } from '../utils/breadcrumbUtils';
// TODO: Uncomment these imports when re-enabling the stats API calls
// import { courseService } from '../services/courseService';
// import { lessonService } from '../services/lessonService';
// import { exerciseService } from '../services/exerciseService';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pageTitle = t('creator.dashboard.title', 'Creator Dashboard');

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

  // Load dashboard stats
  useEffect(() => {
    // TODO: Re-enable this when the proper /api/v1/stats endpoint is implemented.
    // The current logic calls non-existent or incorrect endpoints causing 400 Bad Request errors.
    /*
    const loadStats = async () => {
      try {
        const [coursesResponse, lessonsResponse, exercisesResponse] = await Promise.all([
          courseService.getCourses({ limit: 1 }),
          lessonService.getLessons({ limit: 1 }),
          exerciseService.getExercises({ limit: 1 }),
        ]);

        // Count public courses
        const publicCoursesResponse = await courseService.getCourses({ limit: 1000 });
        const publicCount = publicCoursesResponse.data.filter(course => course.isPublic).length;

        setStats(prevStats => [
          {
            label: prevStats[0]?.label ?? t('creator.dashboard.totalCourses', 'Total Courses'),
            icon: prevStats[0]?.icon ?? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            ),
            value: coursesResponse.meta.total.toString(),
          },
          {
            label: prevStats[1]?.label ?? t('creator.dashboard.totalLessons', 'Total Lessons'),
            icon: prevStats[1]?.icon ?? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            value: lessonsResponse.meta.total.toString(),
          },
          {
            label: prevStats[2]?.label ?? t('creator.dashboard.totalExercises', 'Total Exercises'),
            icon: prevStats[2]?.icon ?? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ),
            value: exercisesResponse.meta.total.toString(),
          },
          {
            label: prevStats[3]?.label ?? t('creator.dashboard.publicCourses', 'Public Courses'),
            icon: prevStats[3]?.icon ?? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            value: publicCount.toString(),
          },
        ]);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      }
    };

    loadStats();
    */
  }, []);

  return (
    <>
      <PageTitle title={pageTitle} />
      <Layout title={pageTitle}>
        <div className="space-y-8">

          {/* Content Navigator Section */}
          <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
            <div className="px-6 py-4 border-b border-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">
                {t('creator.dashboard.contentNavigator', 'Content Navigator')}
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                {t('creator.dashboard.contentNavigatorDesc', 'Browse and manage your course content hierarchy')}
              </p>
            </div>
            <div className="p-6">
              <HierarchicalNavigator
                currentPath={currentPath}
                onNavigate={handleNavigate}
                showSearch={true}
                showStatistics={true}
              />
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default DashboardPage;