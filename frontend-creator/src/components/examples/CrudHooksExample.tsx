/**
 * Example component demonstrating the usage of generic CRUD hooks
 * 
 * This component shows how to use the createCrudHooks factory and predefined
 * entity hooks for common CRUD operations with automatic cache management
 * and optimistic updates.
 */

import React, { useState } from 'react';
import { 
  useCourseHooks, 
  useLevelHooks, 
} from '../../hooks/useCrudHooks';
import { Course } from '../../utils/types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { LoadingSpinner } from '../ui/LoadingSpinner';

/**
 * Example using predefined course hooks
 */
const CourseExample: React.FC = () => {
  const courseHooks = useCourseHooks();
  const { data: courses, isLoading, error } = courseHooks.useList();
  const createMutation = courseHooks.useCreate();
  const updateMutation = courseHooks.useUpdate();
  const deleteMutation = courseHooks.useDelete();

  const handleCreateCourse = () => {
    createMutation.mutate({
      id: `course-${Date.now()}`,
      name: 'New Course',
      sourceLanguage: 'en',
      targetLanguage: 'es',
      isPublic: true,
    });
  };

  const handleUpdateCourse = (course: Course) => {
    updateMutation.mutate({
      id: course.id,
      data: { name: `${course.name} (Updated)` },
    });
  };

  const handleDeleteCourse = (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      deleteMutation.mutate(courseId);
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Course Management Example</h3>
      
      <div className="mb-4">
        <Button 
          onClick={handleCreateCourse}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? 'Creating...' : 'Create Course'}
        </Button>
      </div>

      <div className="space-y-2">
        {courses?.data.map((course) => (
          <div key={course.id} className="flex items-center justify-between p-3 border rounded">
            <div>
              <h4 className="font-medium">{course.name}</h4>
              <p className="text-sm text-gray-600">
                {course.sourceLanguage} → {course.targetLanguage}
              </p>
            </div>
            <div className="space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpdateCourse(course)}
                disabled={updateMutation.isPending}
              >
                Update
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteCourse(course.id)}
                disabled={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

/**
 * Example using hierarchical level hooks
 */
const LevelExample: React.FC<{ courseId: string }> = ({ courseId }) => {
  const levelHooks = useLevelHooks();
  const { data: levels, isLoading } = levelHooks.useListByParent!(courseId);
  const reorderMutation = levelHooks.useReorder!();

  const handleReorderLevels = () => {
    if (levels?.data && levels.data.length > 1) {
      // Reverse the order as an example
      const reversedIds = [...levels.data].reverse().map(level => level.id);
      reorderMutation.mutate({
        parentId: courseId,
        orderedIds: reversedIds,
      });
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Level Management Example</h3>
      
      <div className="mb-4">
        <Button 
          onClick={handleReorderLevels}
          disabled={reorderMutation.isPending || !levels?.data || levels.data.length <= 1}
        >
          {reorderMutation.isPending ? 'Reordering...' : 'Reverse Order'}
        </Button>
      </div>

      <div className="space-y-2">
        {levels?.data.map((level, index) => (
          <div key={level.id} className="flex items-center p-3 border rounded">
            <span className="mr-3 text-sm text-gray-500">#{index + 1}</span>
            <div>
              <h4 className="font-medium">{level.name}</h4>
              <p className="text-sm text-gray-600">Code: {level.code}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

/**
 * Example using the generic factory directly
 */
const CustomEntityExample: React.FC = () => {
  // Create custom hooks for a hypothetical entity
  // const customHooks = createCrudHooks<any>({
  //   endpoint: 'custom-entities',
  //   supportsReorder: true,
  //   cacheInvalidation: {
  //     onCreate: ['custom-entities'],
  //     onUpdate: ['custom-entities'],
  //     onDelete: ['custom-entities'],
  //   },
  // });

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Custom Entity Example</h3>
      <p className="text-gray-600">
        This demonstrates how to create CRUD hooks for any entity type using the generic factory.
        The hooks provide the same interface and functionality as the predefined entity hooks.
      </p>
      
      <div className="mt-4 p-3 bg-gray-50 rounded">
        <code className="text-sm">
          {`const customHooks = createCrudHooks<MyEntity>({
  endpoint: 'my-entities',
  supportsReorder: true,
  cacheInvalidation: {
    onCreate: ['my-entities'],
    onUpdate: ['my-entities'],
    onDelete: ['my-entities'],
  },
});`}
        </code>
      </div>
    </Card>
  );
};

/**
 * Example using convenience hooks
 */
const ConvenienceHooksExample: React.FC = () => {
  // Using the convenience wrapper
  // const { useList, useCreate, useUpdate, useDelete } = useEntityCrud<Course>({
  //   endpoint: 'courses',
  //   cacheInvalidation: { onCreate: ['courses'] },
  // });

  // Using hierarchical convenience hook
  // const levelHooks = useHierarchicalEntity<Level>('levels', 'courses');

  return (
    <Card>
      <h3 className="text-lg font-semibold mb-4">Convenience Hooks Example</h3>
      <p className="text-gray-600 mb-4">
        The library provides convenience functions for common patterns:
      </p>
      
      <div className="space-y-4">
        <div className="p-3 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">useEntityCrud</h4>
          <code className="text-sm">
            {`const { useList, useCreate, useUpdate, useDelete } = useEntityCrud<Course>({
  endpoint: 'courses',
  cacheInvalidation: { onCreate: ['courses'] }
});`}
          </code>
        </div>
        
        <div className="p-3 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">useHierarchicalEntity</h4>
          <code className="text-sm">
            {`const levelHooks = useHierarchicalEntity<Level>('levels', 'courses');`}
          </code>
        </div>
      </div>
    </Card>
  );
};

/**
 * Main example component showcasing all CRUD hooks patterns
 */
export const CrudHooksExample: React.FC = () => {
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Generic CRUD Hooks Examples</h2>
        <p className="text-gray-600">
          This page demonstrates the usage of the generic CRUD hooks factory system
          that provides consistent interfaces for all entity types with automatic
          cache management, optimistic updates, and specialized operations.
        </p>
      </div>

      <CourseExample />
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Select a course to view its levels:
        </label>
        <input
          type="text"
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          placeholder="Enter course ID"
          className="px-3 py-2 border rounded-md"
        />
      </div>

      {selectedCourseId && <LevelExample courseId={selectedCourseId} />}
      
      <CustomEntityExample />
      
      <ConvenienceHooksExample />
    </div>
  );
};

export default CrudHooksExample;