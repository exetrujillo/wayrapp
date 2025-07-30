/**
 * Example usage of the HierarchicalBreadcrumb component
 * 
 * This component demonstrates how to integrate the intelligent breadcrumb
 * navigation system into pages throughout the application. It shows proper
 * usage patterns and integration with React Router.
 * 
 * @module BreadcrumbExample
 * @category Examples
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Use in a lesson page
 * <BreadcrumbExample 
 *   currentPath={{ courseId: 'course1', levelId: 'level1', lessonId: 'lesson1' }}
 * />
 */

import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { HierarchicalBreadcrumb } from './HierarchicalBreadcrumb';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';
import { HierarchyPath } from '../../utils/breadcrumbUtils';

/**
 * Props for the BreadcrumbExample component
 */
interface BreadcrumbExampleProps {
  /** Optional override for current path */
  currentPath?: HierarchyPath;
  /** Whether to show additional debug information */
  showDebugInfo?: boolean;
}

/**
 * Example component showing breadcrumb integration patterns
 * 
 * @param props - Component props
 * @returns JSX element demonstrating breadcrumb usage
 */
export const BreadcrumbExample: React.FC<BreadcrumbExampleProps> = ({
  currentPath: overridePath,
  showDebugInfo = false
}) => {
  const location = useLocation();
  const params = useParams();

  // Extract hierarchy path from URL params (typical usage pattern)
  const pathFromParams: HierarchyPath = {};
  if (params.courseId) pathFromParams.courseId = params.courseId;
  if (params.levelId) pathFromParams.levelId = params.levelId;
  if (params.sectionId) pathFromParams.sectionId = params.sectionId;
  if (params.moduleId) pathFromParams.moduleId = params.moduleId;
  if (params.lessonId) pathFromParams.lessonId = params.lessonId;

  // Use override path or extract from URL
  const currentPath = overridePath || pathFromParams;

  // Use the breadcrumb navigation hook for advanced features
  const {
    breadcrumbs,
    isLoading,
    isValidPath,
    navigate,
    navigateToValidParent,
    generateUrl
  } = useBreadcrumbs(currentPath, {
    autoRedirect: true,
    showLoadingStates: true
  });

  /**
   * Handle navigation with custom logic
   */
  const handleCustomNavigation = (path: HierarchyPath) => {
    console.log('Navigating to:', path);
    navigate(path);
  };

  return (
    <div className="space-y-6">
      {/* Basic breadcrumb usage */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">Basic Breadcrumb Navigation</h3>
        <HierarchicalBreadcrumb 
          currentPath={currentPath}
          className="mb-2"
        />
        <p className="text-sm text-gray-600">
          This shows the standard breadcrumb navigation with entity validation
          and loading states.
        </p>
      </div>

      {/* Breadcrumb with custom navigation */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">Custom Navigation Handler</h3>
        <HierarchicalBreadcrumb 
          currentPath={currentPath}
          onNavigate={handleCustomNavigation}
          className="mb-2"
        />
        <p className="text-sm text-gray-600">
          This breadcrumb uses a custom navigation handler that logs navigation
          events before proceeding.
        </p>
      </div>

      {/* Breadcrumb without home icon */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">Without Home Icon</h3>
        <HierarchicalBreadcrumb 
          currentPath={currentPath}
          showHomeIcon={false}
          className="mb-2"
        />
        <p className="text-sm text-gray-600">
          This breadcrumb hides the home icon for a more compact display.
        </p>
      </div>

      {/* Advanced breadcrumb features */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">Advanced Features</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Path Status
            </label>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                isValidPath 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isValidPath ? 'Valid Path' : 'Invalid Path'}
              </span>
              {isLoading && (
                <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                  Loading...
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Navigation Actions
            </label>
            <div className="flex space-x-2">
              <button
                onClick={navigateToValidParent}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isValidPath}
              >
                Go to Valid Parent
              </button>
              <button
                onClick={() => {
                  if (currentPath.courseId) {
                    navigate({ courseId: currentPath.courseId });
                  }
                }}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={!currentPath.courseId}
              >
                Go to Course
              </button>
            </div>
          </div>

          {showDebugInfo && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Debug Information
              </label>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                <div><strong>Current Path:</strong> {JSON.stringify(currentPath, null, 2)}</div>
                <div><strong>URL:</strong> {location.pathname}</div>
                <div><strong>Generated URL:</strong> {generateUrl(currentPath)}</div>
                <div><strong>Breadcrumb Count:</strong> {breadcrumbs.length}</div>
                <div><strong>Loading:</strong> {isLoading.toString()}</div>
                <div><strong>Valid:</strong> {isValidPath.toString()}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb items list */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-3">Breadcrumb Items Details</h3>
        <div className="space-y-2">
          {breadcrumbs.length === 0 ? (
            <p className="text-gray-500 text-sm">No breadcrumb items to display</p>
          ) : (
            breadcrumbs.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="text-xs text-gray-500">({item.entityType})</span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.isLoading && (
                    <span className="text-xs text-yellow-600">Loading</span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.isClickable 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.isClickable ? 'Clickable' : 'Not Clickable'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.exists 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {item.exists ? 'Exists' : 'Missing'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Example page component showing breadcrumb integration in a typical page
 */
export const ExampleLessonPage: React.FC = () => {
  const params = useParams();
  
  const currentPath: HierarchyPath = {};
  if (params.courseId) currentPath.courseId = params.courseId;
  if (params.levelId) currentPath.levelId = params.levelId;
  if (params.sectionId) currentPath.sectionId = params.sectionId;
  if (params.moduleId) currentPath.moduleId = params.moduleId;
  if (params.lessonId) currentPath.lessonId = params.lessonId;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <HierarchicalBreadcrumb currentPath={currentPath} />
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Lesson Content
          </h1>
          <p className="text-gray-600">
            This is an example lesson page showing how breadcrumbs integrate
            with the page layout. The breadcrumb navigation appears in the
            header and provides context for the current location.
          </p>
          
          <div className="mt-8">
            <BreadcrumbExample 
              currentPath={currentPath}
              showDebugInfo={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};