import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { ContentDashboard } from '../components/content';
// TODO: Uncomment these imports when re-enabling the stats API calls
// import { courseService } from '../services/courseService';
// import { lessonService } from '../services/lessonService';
// import { exerciseService } from '../services/exerciseService';

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const pageTitle = t('creator.dashboard.title', 'Creator Dashboard');

  // const [stats, setStats] = useState<Array<{
  //   label: string;
  //   value: string;
  //   icon: React.ReactNode;
  const [stats] = useState<Array<{
    label: string;
    value: string;
    icon: React.ReactNode;
  }>>([
    {
      label: t('creator.dashboard.totalCourses', 'Total Courses'),
      value: '...',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      label: t('creator.dashboard.totalLessons', 'Total Lessons'),
      value: '...',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: t('creator.dashboard.totalExercises', 'Total Exercises'),
      value: '...',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      label: t('creator.dashboard.publicCourses', 'Public Courses'),
      value: '...',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ]);

  const [recentActivity] = useState([
    {
      id: '1',
      title: t('creator.dashboard.activity.courseCreated', 'New course created'),
      description: t('creator.dashboard.activity.courseCreatedDesc', 'Euskera Basics course was created'),
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      type: 'course' as const,
      href: '/courses',
    },
    {
      id: '2',
      title: t('creator.dashboard.activity.lessonAdded', 'Lesson added'),
      description: t('creator.dashboard.activity.lessonAddedDesc', 'Added "Greetings" lesson to Euskera Basics'),
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      type: 'lesson' as const,
      href: '/lessons',
    },
    {
      id: '3',
      title: t('creator.dashboard.activity.exerciseCreated', 'Exercise created'),
      description: t('creator.dashboard.activity.exerciseCreatedDesc', 'Translation exercise for "Hello" created'),
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      type: 'exercise' as const,
      href: '/exercises',
    },
  ]);

  const quickActions = [
    {
      id: 'create-course',
      title: t('creator.dashboard.actions.createCourse', 'Create Course'),
      description: t('creator.dashboard.actions.createCourseDesc', 'Start a new language learning course'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      href: '/courses/create',
      variant: 'primary' as const,
    },
    {
      id: 'create-lesson',
      title: t('creator.dashboard.actions.createLesson', 'Create Lesson'),
      description: t('creator.dashboard.actions.createLessonDesc', 'Add a new lesson to your course'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      href: '/lessons/create',
      variant: 'secondary' as const,
    },
    {
      id: 'create-exercise',
      title: t('creator.dashboard.actions.createExercise', 'Create Exercise'),
      description: t('creator.dashboard.actions.createExerciseDesc', 'Build interactive learning exercises'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      href: '/exercises/create',
      variant: 'secondary' as const,
    },
    {
      id: 'manage-courses',
      title: t('creator.dashboard.actions.manageCourses', 'Manage Courses'),
      description: t('creator.dashboard.actions.manageCoursesDesc', 'View and edit your existing courses'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      href: '/courses',
      variant: 'outline' as const,
    },
    {
      id: 'manage-lessons',
      title: t('creator.dashboard.actions.manageLessons', 'Manage Lessons'),
      description: t('creator.dashboard.actions.manageLessonsDesc', 'Organize and edit your lessons'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      href: '/lessons',
      variant: 'outline' as const,
    },
    {
      id: 'manage-exercises',
      title: t('creator.dashboard.actions.manageExercises', 'Manage Exercises'),
      description: t('creator.dashboard.actions.manageExercisesDesc', 'Review and update your exercises'),
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H9a2 2 0 00-2 2v10z" />
        </svg>
      ),
      href: '/exercises',
      variant: 'outline' as const,
    },
  ];

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
        <ContentDashboard
          title={t('creator.dashboard.welcome', 'Welcome to WayrApp Creator')}
          subtitle={t('creator.dashboard.subtitle', 'Create and manage language learning content')}
          quickActions={quickActions}
          stats={stats}
          recentActivity={recentActivity}
        />
      </Layout>
    </>
  );
};

export default DashboardPage;