import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { FormValidationProvider } from './contexts/FormValidationContext';
import { GlobalErrorBoundary } from './components/error/ErrorBoundaryWrapper';
import { LoadingStateProvider } from './components/ui/LoadingStateProvider';
import { PageLoading } from './components/ui/LoadingStates';
import { ToastContainer } from './components/ui/ToastContainer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { queryClient } from './config/queryClient';
import { env } from './config/environment';
import './styles/globals.css';

// Lazy-loaded pages for better performance
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CreateCoursePage = lazy(() => import('./pages/CreateCoursePage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const LessonsPage = lazy(() => import('./pages/LessonsPage'));
const CreateLessonPage = lazy(() => import('./pages/CreateLessonPage'));
const LessonDetailPage = lazy(() => import('./pages/LessonDetailPage'));
const ExercisesPage = lazy(() => import('./pages/ExercisesPage'));
const CreateExercisePage = lazy(() => import('./pages/CreateExercisePage'));
const ExerciseAssignmentPage = lazy(() => import('./pages/ExerciseAssignmentPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Enhanced loading fallback with network awareness
const LoadingFallback = () => (
  <div className="min-h-screen bg-secondary-100">
    <PageLoading
      message="Loading application..."
      showNetworkStatus={true}
      className="min-h-screen"
    />
  </div>
);

const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        <Route path="/courses" element={
          <ProtectedRoute>
            <CoursesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/courses/create" element={
          <ProtectedRoute>
            <CreateCoursePage />
          </ProtectedRoute>
        } />
        
        <Route path="/courses/:courseId" element={
          <ProtectedRoute>
            <CourseDetailPage />
          </ProtectedRoute>
        } />
        
        <Route path="/lessons" element={
          <ProtectedRoute>
            <LessonsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/lessons/create" element={
          <ProtectedRoute>
            <CreateLessonPage />
          </ProtectedRoute>
        } />
        
        <Route path="/lessons/:lessonId" element={
          <ProtectedRoute>
            <LessonDetailPage />
          </ProtectedRoute>
        } />
        
        <Route path="/exercises" element={
          <ProtectedRoute>
            <ExercisesPage />
          </ProtectedRoute>
        } />
        
        <Route path="/exercises/create" element={
          <ProtectedRoute>
            <CreateExercisePage />
          </ProtectedRoute>
        } />
        
        <Route path="/lessons/:lessonId/exercises" element={
          <ProtectedRoute>
            <ExerciseAssignmentPage />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        
        {/* Redirects */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 404 page */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

const App: React.FC = () => {
  return (
    <GlobalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router basename="/creator">
          <HelmetProvider>
            <ErrorProvider>
              <LoadingStateProvider
                options={{
                  defaultTimeout: 30000,
                  showSlowConnectionWarning: true,
                  slowConnectionThreshold: 5000,
                  maxConcurrentOperations: 10,
                }}
              >
                <AuthProvider>
                  <FormValidationProvider>
                    <AppRoutes />
                    <ToastContainer position="top-right" />
                  </FormValidationProvider>
                </AuthProvider>
              </LoadingStateProvider>
            </ErrorProvider>
          </HelmetProvider>
        </Router>
        {/* React Query Devtools - only in development */}
        {env.isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;