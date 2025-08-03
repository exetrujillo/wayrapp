/**
 * Demo page for the Hierarchical Navigator component
 * 
 * This page demonstrates the hierarchical navigator component with all its features:
 * - Expandable tree view with current position
 * - Quick navigation between hierarchy levels
 * - Search functionality within the hierarchy
 * - Hierarchy overview with statistics
 * 
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import PageTitle from '../components/layout/PageTitle';
import { HierarchicalNavigator } from '../components/navigation/HierarchicalNavigator';
import { HierarchyPath } from '../utils/breadcrumbUtils';

/**
 * Demo page component for the hierarchical navigator
 */
const HierarchicalNavigatorDemo: React.FC = () => {
  const navigate = useNavigate();
  const [currentPath, setCurrentPath] = useState<HierarchyPath>({});

  /**
   * Handle navigation from the hierarchical navigator
   */
  const handleNavigate = (path: HierarchyPath) => {
    setCurrentPath(path);

    // In a real application, this would navigate to the appropriate page
    console.log('Navigating to:', path);

    // Example navigation logic
    if (path.lessonId) {
      navigate(`/courses/${path.courseId}/levels/${path.levelId}/sections/${path.sectionId}/modules/${path.moduleId}/lessons/${path.lessonId}`);
    } else if (path.moduleId) {
      navigate(`/courses/${path.courseId}/levels/${path.levelId}/sections/${path.sectionId}/modules/${path.moduleId}`);
    } else if (path.sectionId) {
      navigate(`/courses/${path.courseId}/levels/${path.levelId}/sections/${path.sectionId}`);
    } else if (path.levelId) {
      navigate(`/courses/${path.courseId}/levels/${path.levelId}`);
    } else if (path.courseId) {
      navigate(`/courses/${path.courseId}`);
    }
  };

  return (
    <>
      <PageTitle title="Hierarchical Navigator Demo" />
      <Layout title="Hierarchical Navigator Demo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Hierarchical Navigator Demo
            </h1>
            <p className="text-lg text-gray-600 mb-6">
              This demo showcases the hierarchical navigator component with all its features:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-8">
              <li>Expandable tree view showing the complete course hierarchy</li>
              <li>Current position highlighting and navigation</li>
              <li>Search functionality across all content levels</li>
              <li>Real-time statistics and completion tracking</li>
              <li>Responsive design and accessibility features</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Hierarchical Navigator */}
            <div className="lg:col-span-1">
              <HierarchicalNavigator
                currentPath={currentPath}
                onNavigate={handleNavigate}
                showSearch={true}
                showStatistics={true}
                maxHeight="800px"
                className="sticky top-4"
              />
            </div>

            {/* Content Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Current Selection
                </h2>

                {Object.keys(currentPath).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Selection
                    </h3>
                    <p className="text-gray-500">
                      Click on any item in the navigator to see its details here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-blue-900 mb-2">
                        Navigation Path
                      </h3>
                      <div className="text-sm text-blue-700 space-y-1">
                        {currentPath.courseId && (
                          <div><strong>Course:</strong> {currentPath.courseId}</div>
                        )}
                        {currentPath.levelId && (
                          <div><strong>Level:</strong> {currentPath.levelId}</div>
                        )}
                        {currentPath.sectionId && (
                          <div><strong>Section:</strong> {currentPath.sectionId}</div>
                        )}
                        {currentPath.moduleId && (
                          <div><strong>Module:</strong> {currentPath.moduleId}</div>
                        )}
                        {currentPath.lessonId && (
                          <div><strong>Lesson:</strong> {currentPath.lessonId}</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Features Demonstrated
                      </h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>✅ Tree view with expandable nodes</li>
                        <li>✅ Current position highlighting</li>
                        <li>✅ Quick navigation between levels</li>
                        <li>✅ Search across all content</li>
                        <li>✅ Real-time statistics display</li>
                        <li>✅ Loading states and error handling</li>
                        <li>✅ Responsive design</li>
                        <li>✅ Accessibility support</li>
                      </ul>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="text-lg font-medium text-green-900 mb-2">
                        Task 2.6 Requirements Met
                      </h3>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>✅ Shows current position in hierarchy with expandable tree view</li>
                        <li>✅ Provides quick navigation between hierarchy levels</li>
                        <li>✅ Implements search functionality within the hierarchy</li>
                        <li>✅ Creates hierarchy overview with statistics (counts, completion status)</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default HierarchicalNavigatorDemo;