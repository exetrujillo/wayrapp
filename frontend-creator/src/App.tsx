// frontend-creator/src/App.tsx
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { HelmetProvider } from 'react-helmet-async';

import { AuthProvider } from './contexts/AuthContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { FormValidationProvider } from './contexts/FormValidationContext';
import { LoadingStateProvider } from './components/ui/LoadingStateProvider';

import { queryClient } from './config/queryClient';
import { ToastContainer } from './components/ui/ToastContainer';
import { env } from './config/environment';
import './styles/globals.css';

// Import pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { PageLoading } from './components/ui/LoadingStates';

// Lazy-loaded pages for better performance
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CreateCoursePage = lazy(() => import('./pages/CreateCoursePage'));
const EditCoursePage = lazy(() => import('./pages/EditCoursePage'));
const CourseDetailPage = lazy(() => import('./pages/CourseDetailPage'));
const LevelDetailPage = lazy(() => import('./pages/LevelDetailPage'));
const SectionDetailPage = lazy(() => import('./pages/SectionDetailPage'));
const ModuleDetailPage = lazy(() => import('./pages/ModuleDetailPage'));
const LessonsPage = lazy(() => import('./pages/LessonsPage'));
const CreateLessonPage = lazy(() => import('./pages/CreateLessonPage'));
const LessonDetailPage = lazy(() => import('./pages/LessonDetailPage'));
const ExercisesPage = lazy(() => import('./pages/ExercisesPage'));
const CreateExercisePage = lazy(() => import('./pages/CreateExercisePage'));
const ExerciseAssignmentPage = lazy(() => import('./pages/ExerciseAssignmentPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const HierarchicalNavigatorDemo = lazy(() => import('./pages/HierarchicalNavigatorDemo'));
const UnifiedFormExample = lazy(() => import('./components/examples/UnifiedFormExample'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

/**
 * Enhanced loading fallback component with network awareness for lazy-loaded routes.
 * 
 * This component provides a consistent loading experience while lazy-loaded page components
 * are being fetched. It includes network status monitoring to provide better user feedback
 * during slow connections or network issues. The component uses the PageLoading component
 * with enhanced features like network status display and responsive design.
 * 
 * Features:
 * - Full-screen loading indicator
 * - Network status awareness
 * - Consistent styling with application theme
 * - Responsive design for all screen sizes
 * 
 * @returns {JSX.Element} Full-screen loading component with network awareness
 */
const LoadingFallback = () => (
  <div className="min-h-screen bg-secondary-100">
    <PageLoading
      message="Loading application..."
      showNetworkStatus={true}
      className="min-h-screen"
    />
  </div>
);

/**
 * Application routing component that defines all route configurations for the creator platform.
 * 
 * This component encapsulates all route definitions including public routes (login), protected
 * routes (dashboard, courses, lessons, exercises), and fallback routes (404, redirects).
 * All protected routes are automatically wrapped with ProtectedRoute component to ensure
 * proper authentication before access. The component uses Suspense boundaries to handle
 * lazy-loaded page components with appropriate loading fallbacks.
 * 
 * Route structure:
 * - /login - Public authentication page
 * - /dashboard - Protected main dashboard
 * - /courses/* - Course management routes (list, create, detail)
 * - /lessons/* - Lesson management routes (list, create, detail)
 * - /exercises/* - Exercise management routes (list, create, assignment)
 * - /profile - User profile management
 * - / - Redirects to dashboard
 * - * - 404 not found page
 * 
 * @returns {JSX.Element} Suspense-wrapped Routes component with all application routes
 */
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

        <Route path="/courses/:courseId/edit" element={
          <ProtectedRoute>
            <EditCoursePage />
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId" element={
          <ProtectedRoute>
            <CourseDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId/levels/:levelId" element={
          <ProtectedRoute>
            <LevelDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId/levels/:levelId/sections/:sectionId" element={
          <ProtectedRoute>
            <SectionDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId/levels/:levelId/sections/:sectionId/modules/:moduleId" element={
          <ProtectedRoute>
            <ModuleDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/courses/:courseId/levels/:levelId/sections/:sectionId/modules/:moduleId/lessons/:lessonId" element={
          <ProtectedRoute>
            <LessonDetailPage />
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

        <Route path="/demo/hierarchical-navigator" element={
          <ProtectedRoute>
            <HierarchicalNavigatorDemo />
          </ProtectedRoute>
        } />

        <Route path="/demo/unified-forms" element={
          <ProtectedRoute>
            <UnifiedFormExample />
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

/**
 * Main application component that serves as the root of the creator frontend application.
 * 
 * This component establishes the complete application architecture by orchestrating all essential
 * providers and routing configuration. It follows a hierarchical provider pattern where each
 * provider wraps its children to provide specific functionality throughout the component tree.
 * The component implements code splitting through lazy loading for optimal performance and
 * includes comprehensive error handling and loading states.
 * 
 * The App component is used as the root component in main.tsx and serves as the entry point
 * for the entire creator application. It manages the global application state through various
 * context providers and handles all client-side routing for the educational content creation
 * platform.
 * 
 * Architecture layers (from outermost to innermost):
 * 1. QueryClientProvider - Server state management with React Query
 * 2. ErrorProvider - Global error handling and toast notifications
 * 3. Router - Client-side routing with React Router
 * 4. HelmetProvider - Document head management for SEO
 * 5. LoadingStateProvider - Global loading state coordination
 * 6. AuthProvider - User authentication and session management
 * 7. FormValidationProvider - Form state and validation management
 * 8. AppRoutes - Application route definitions and lazy-loaded pages
 * 
 * @returns {JSX.Element} The complete application component tree with all providers and routing
 * 
 * @example
 * // Used in main.tsx as the root component
 * import App from './App';
 * 
 * ReactDOM.createRoot(document.getElementById('root')!).render(
 *   <React.StrictMode>
 *     <App />
 *   </React.StrictMode>
 * );
 * 
 * @example
 * // The component automatically handles:
 * // - User authentication state
 * // - Protected route access
 * // - Global loading indicators
 * // - Error boundaries and toast notifications
 * // - Code splitting with lazy-loaded pages
 * // - SEO meta tag management
 * // - Form validation across the application
 */
function App() {
  return (
    // 1. QueryClientProvider: Manages all server state.
    <QueryClientProvider client={queryClient}>

      {/* 2. ErrorProvider: Catches errors from any component below it. */}
      <ErrorProvider>

        {/* 3. Router: Handles all application routing. */}
        <Router basename="/creator">

          {/* 4. HelmetProvider: Manages document head tags. */}
          <HelmetProvider>

            {/* 5. LoadingStateProvider: Manages global loading indicators. */}
            <LoadingStateProvider
              options={{
                defaultTimeout: 30000,
                showSlowConnectionWarning: true,
                slowConnectionThreshold: 5000,
                maxConcurrentOperations: 10,
              }}
            >

              {/* 6. AuthProvider: Manages user authentication state. */}
              <AuthProvider>

                {/* 7. FormValidationProvider: Manages form state. */}
                <FormValidationProvider>

                  {/* Main application routes are the innermost children */}
                  <AppRoutes />

                  {/* Global components like Toasts go here */}
                  <ToastContainer position="top-right" />

                </FormValidationProvider>
              </AuthProvider>
            </LoadingStateProvider>
          </HelmetProvider>
        </Router>
      </ErrorProvider>

      {/* React Query Devtools for debugging in development */}
      {env.isDevelopment && <ReactQueryDevtools initialIsOpen={false} />}

    </QueryClientProvider>
  );
}

export default App;