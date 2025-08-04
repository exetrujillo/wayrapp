import { useState, useEffect } from 'react';
import { useCoursesQuery } from './index';
import { Course, Level, Section, Module, Lesson } from '../utils/types';

/**
 * Simple hierarchy data interface
 */
export interface SimpleHierarchyData {
  courses: Course[];
  levels: Level[];
  sections: Section[];
  modules: Module[];
  lessons: Lesson[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Simple hook that loads hierarchy data without any conditional hooks
 * This is a safe alternative that avoids the Rules of Hooks violation
 */
export const useSimpleHierarchyData = (): SimpleHierarchyData => {
  // Always call useCoursesQuery at the top level - no conditions
  const { data: coursesData, isLoading: coursesLoading, error: coursesError } = useCoursesQuery();
  
  // State for all hierarchy data
  const [hierarchyState, setHierarchyState] = useState({
    levels: [] as Level[],
    sections: [] as Section[],
    modules: [] as Module[],
    lessons: [] as Lesson[],
    isLoading: false,
    error: null as Error | null
  });

  // Load hierarchy data when courses change
  useEffect(() => {
    const courses = coursesData?.data || [];
    
    if (courses.length === 0) {
      setHierarchyState({
        levels: [],
        sections: [],
        modules: [],
        lessons: [],
        isLoading: false,
        error: null
      });
      return;
    }

    const loadAllData = async () => {
      setHierarchyState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Load levels
        const { levelService } = await import('../services/levelService');
        const levelPromises = courses.map(course => 
          levelService.getLevelsByCourse(course.id).catch(() => ({ data: [] }))
        );
        const levelResponses = await Promise.all(levelPromises);
        const levels = levelResponses.flatMap(response => response.data || []);

        // Load sections
        const { sectionService } = await import('../services/sectionService');
        const sectionPromises = levels.map(level => 
          sectionService.getSectionsByLevel(level.id).catch(() => ({ data: [] }))
        );
        const sectionResponses = await Promise.all(sectionPromises);
        const sections = sectionResponses.flatMap(response => response.data || []);

        // Load modules
        const { moduleService } = await import('../services/moduleService');
        const modulePromises = sections.map(section => 
          moduleService.getModulesBySection(section.id).catch(() => ({ data: [] }))
        );
        const moduleResponses = await Promise.all(modulePromises);
        const modules = moduleResponses.flatMap(response => response.data || []);

        // Load lessons
        const { lessonService } = await import('../services/lessonService');
        const lessonPromises = modules.map(module => 
          lessonService.getLessonsByModule(module.id).catch(() => ({ data: [] }))
        );
        const lessonResponses = await Promise.all(lessonPromises);
        const lessons = lessonResponses.flatMap(response => response.data || []);

        setHierarchyState({
          levels,
          sections,
          modules,
          lessons,
          isLoading: false,
          error: null
        });

      } catch (error) {
        console.error('Failed to load hierarchy data:', error);
        setHierarchyState(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error
        }));
      }
    };

    loadAllData();
  }, [coursesData]);

  return {
    courses: coursesData?.data || [],
    levels: hierarchyState.levels,
    sections: hierarchyState.sections,
    modules: hierarchyState.modules,
    lessons: hierarchyState.lessons,
    isLoading: coursesLoading || hierarchyState.isLoading,
    error: coursesError || hierarchyState.error
  };
};