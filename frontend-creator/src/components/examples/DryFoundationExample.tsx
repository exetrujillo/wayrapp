/**
 * DRY Foundation Usage Examples
 * 
 * This component demonstrates how to use the new DRY foundation architecture
 * for common CRUD operations and form handling.
 * 
 * @module DryFoundationExample
 * @category Examples
 * @author Exequiel Trujillo
 * @since 1.0.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DynamicForm,
  useDynamicForm,
  useCourseHooks,
  useLevelHooks,
  useCacheManager,
} from '../../lib/dryFoundation';

// ============================================================================
// Example 1: Simple Course List with CRUD Operations
// ============================================================================

export const CourseListExample: React.FC = () => {
  const navigate = useNavigate();
  const courseHooks = useCourseHooks();

  // Fetch courses using the generic hooks
  const { data: coursesResponse, isLoading, error } = courseHooks.useList({
    page: 1,
    limit: 10,
  });

  // Delete mutation
  const deleteMutation = courseHooks.useDelete({
    onSuccess: () => {
      // Cache is automatically invalidated by the hook
      console.log('Course deleted successfully');
    },
  });

  const courses = coursesResponse?.data || [];

  if (isLoading) {
    return <div className="p-4">Loading courses...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error.message}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>
        <button
          onClick={() => navigate('/courses/create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Course
        </button>
      </div>

      <div className="grid gap-4">
        {courses.map((course: any) => (
          <div key={course.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{course.name}</h3>
                <p className="text-gray-600">
                  {course.sourceLanguage} → {course.targetLanguage}
                </p>
                {course.description && (
                  <p className="text-sm text-gray-500 mt-2">{course.description}</p>
                )}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate(`/courses/${course.id}/edit`)}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this course?')) {
                      deleteMutation.mutate(course.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Example 2: Course Creation Form
// ============================================================================

export const CourseCreateExample: React.FC = () => {
  const navigate = useNavigate();

  // Use the dynamic form hook for course creation
  const courseForm = useDynamicForm({
    entityType: 'course',
    mode: 'create',
    onSuccess: (course) => {
      console.log('Course created:', course);
      navigate(`/courses/${course.id}`);
    },
    onError: (error) => {
      console.error('Failed to create course:', error);
    },
    onCancel: () => {
      navigate('/courses');
    },
  });

  return (
    <div className="max-w-2xl mx-auto p-6">
      <DynamicForm
        config={courseForm.formConfig}
        initialValues={courseForm.initialValues}
        onSubmit={courseForm.onSubmit}
        onCancel={courseForm.onCancel}
        loading={courseForm.loading}
        error={courseForm.error}
      />
    </div>
  );
};

// ============================================================================
// Example 3: Course Edit Form with Auto-save
// ============================================================================

export const CourseEditExample: React.FC<{ courseId: string }> = ({ courseId }) => {
  const navigate = useNavigate();

  // Use the dynamic form hook for course editing with auto-save
  const courseForm = useDynamicForm({
    entityType: 'course',
    mode: 'edit',
    entityId: courseId,
    autoSave: true,
    autoSaveInterval: 10000, // Auto-save every 10 seconds
    onSuccess: (course) => {
      console.log('Course updated:', course);
      navigate(`/courses/${course.id}`);
    },
    onError: (error) => {
      console.error('Failed to update course:', error);
    },
    onCancel: () => {
      navigate(`/courses/${courseId}`);
    },
  });

  if (courseForm.entityLoading) {
    return <div className="p-6">Loading course...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <DynamicForm
        config={courseForm.formConfig}
        initialValues={courseForm.initialValues}
        onSubmit={courseForm.onSubmit}
        onCancel={courseForm.onCancel}
        loading={courseForm.loading}
        error={courseForm.error}
        autoSave={courseForm.autoSave}
        autoSaveInterval={courseForm.autoSaveInterval}
      />
    </div>
  );
};

// ============================================================================
// Example 4: Hierarchical Content Management
// ============================================================================

export const LevelManagementExample: React.FC<{ courseId: string }> = ({ courseId }) => {
  const levelHooks = useLevelHooks();

  // Fetch levels for a specific course
  const { data: levelsResponse, isLoading } = levelHooks.useListByParent!(courseId);

  // Reorder mutation
  const reorderMutation = levelHooks.useReorder!({
    onSuccess: () => {
      console.log('Levels reordered successfully');
    },
  });

  const levels = levelsResponse?.data || [];

  const handleReorder = async (newOrder: string[]) => {
    await reorderMutation.mutateAsync({
      parentId: courseId,
      orderedIds: newOrder,
    });
  };

  if (isLoading) {
    return <div className="p-4">Loading levels...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Course Levels</h2>
      
      <div className="space-y-2">
        {levels.map((level: any, index: number) => (
          <div
            key={level.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div>
              <span className="font-medium">{level.name}</span>
              <span className="ml-2 text-sm text-gray-500">({level.code})</span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  const newOrder = [...levels];
                  if (index > 0) {
                    [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
                    handleReorder(newOrder.map(l => l.id));
                  }
                }}
                disabled={index === 0 || reorderMutation.isPending}
                className="px-2 py-1 text-xs bg-gray-100 rounded disabled:opacity-50"
              >
                ↑
              </button>
              <button
                onClick={() => {
                  const newOrder = [...levels];
                  if (index < levels.length - 1) {
                    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                    handleReorder(newOrder.map(l => l.id));
                  }
                }}
                disabled={index === levels.length - 1 || reorderMutation.isPending}
                className="px-2 py-1 text-xs bg-gray-100 rounded disabled:opacity-50"
              >
                ↓
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Example 5: Cache Management
// ============================================================================

export const CacheManagementExample: React.FC = () => {
  const cacheManager = useCacheManager();

  const handleInvalidateAllCourses = async () => {
    await cacheManager.invalidateEntity('courses');
    console.log('All course caches invalidated');
  };

  const handleInvalidateHierarchy = async () => {
    await cacheManager.invalidateHierarchy('courses', 'example-course-id');
    console.log('Course hierarchy invalidated');
  };

  const handleInvalidateManyToMany = async () => {
    await cacheManager.invalidateManyToMany('lessons', 'lesson-id', 'exercises', 'exercise-id');
    console.log('Lesson-exercise relationship invalidated');
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Cache Management</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Entity Cache Operations</h3>
          <button
            onClick={handleInvalidateAllCourses}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Invalidate All Courses
          </button>
        </div>

        <div>
          <h3 className="font-medium mb-2">Hierarchical Cache Operations</h3>
          <button
            onClick={handleInvalidateHierarchy}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Invalidate Course Hierarchy
          </button>
        </div>

        <div>
          <h3 className="font-medium mb-2">Many-to-Many Cache Operations</h3>
          <button
            onClick={handleInvalidateManyToMany}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Invalidate Lesson-Exercise Relationship
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Example Component
// ============================================================================

export const DryFoundationExample: React.FC = () => {
  const [activeExample, setActiveExample] = React.useState<string>('list');

  const examples = [
    { id: 'list', name: 'Course List', component: CourseListExample },
    { id: 'create', name: 'Course Create', component: CourseCreateExample },
    { id: 'edit', name: 'Course Edit', component: () => <CourseEditExample courseId="example-course" /> },
    { id: 'levels', name: 'Level Management', component: () => <LevelManagementExample courseId="example-course" /> },
    { id: 'cache', name: 'Cache Management', component: CacheManagementExample },
  ];

  const ActiveComponent = examples.find(ex => ex.id === activeExample)?.component || CourseListExample;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {examples.map((example) => (
              <button
                key={example.id}
                onClick={() => setActiveExample(example.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm
                  ${activeExample === example.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {example.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <ActiveComponent />
      </div>
    </div>
  );
};

export default DryFoundationExample;