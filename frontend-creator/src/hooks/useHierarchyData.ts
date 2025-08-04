import { useMemo, useState, useEffect } from 'react';
import { useCoursesQuery } from './index';
import { Course, Level, Section, Module, Lesson } from '../utils/types';

/**
 * Interface for complete hierarchy data with counts
 */
export interface HierarchyData {
  courses: Course[];
  levels: Level[];
  sections: Section[];
  modules: Module[];
  lessons: Lesson[];
  statistics: {
    totalCourses: number;
    totalLevels: number;
    totalSections: number;
    totalModules: number;
    totalLessons: number;
    completionPercentage: number;
  };
  isLoading: boolean;
  error: Error | null;
}

/**
 * Interface for hierarchy tree node with complete data
 */
export interface HierarchyTreeNode {
  id: string;
  name: string;
  type: 'course' | 'level' | 'section' | 'module' | 'lesson';
  parentId?: string;
  children: HierarchyTreeNode[];
  order: number;
  metadata?: {
    code?: string;
    moduleType?: string;
    experiencePoints?: number;
    childCount: number;
  };
}

/**
 * Hook to load complete hierarchy data efficiently
 * This approach uses direct service calls instead of conditional hooks
 * 
 * @returns Complete hierarchy data with statistics and tree structure
 */
export const useHierarchyData = (): HierarchyData => {
  // Always call useCoursesQuery at the top level
  const { data: coursesData, isLoading: coursesLoading, error: coursesError } = useCoursesQuery();
  const courses = coursesData?.data || [];

  // State for hierarchy data
  const [allLevels, setAllLevels] = useState<Level[]>([]);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);
  const [hierarchyError, setHierarchyError] = useState<Error | null>(null);

  // Load hierarchy data sequentially using direct service calls
  useEffect(() => {
    if (courses.length === 0) {
      // Reset state when no courses
      setAllLevels([]);
      setAllSections([]);
      setAllModules([]);
      setAllLessons([]);
      return;
    }

    const loadHierarchyData = async () => {
      setIsLoadingHierarchy(true);
      setHierarchyError(null);
      
      try {
        // Load all levels using direct service calls
        const levelPromises = courses.map(async (course) => {
          const { levelService } = await import('../services/levelService');
          return levelService.getLevelsByCourse(course.id);
        });
        const levelResponses = await Promise.all(levelPromises);
        const levels = levelResponses.flatMap(response => response.data || []);
        setAllLevels(levels);

        if (levels.length === 0) {
          setAllSections([]);
          setAllModules([]);
          setAllLessons([]);
          return;
        }

        // Load all sections
        const sectionPromises = levels.map(async (level) => {
          const { sectionService } = await import('../services/sectionService');
          return sectionService.getSectionsByLevel(level.id);
        });
        const sectionResponses = await Promise.all(sectionPromises);
        const sections = sectionResponses.flatMap(response => response.data || []);
        setAllSections(sections);

        if (sections.length === 0) {
          setAllModules([]);
          setAllLessons([]);
          return;
        }

        // Load all modules
        const modulePromises = sections.map(async (section) => {
          const { moduleService } = await import('../services/moduleService');
          return moduleService.getModulesBySection(section.id);
        });
        const moduleResponses = await Promise.all(modulePromises);
        const modules = moduleResponses.flatMap(response => response.data || []);
        setAllModules(modules);

        if (modules.length === 0) {
          setAllLessons([]);
          return;
        }

        // Load all lessons
        const lessonPromises = modules.map(async (module) => {
          const { lessonService } = await import('../services/lessonService');
          return lessonService.getLessonsByModule(module.id);
        });
        const lessonResponses = await Promise.all(lessonPromises);
        const lessons = lessonResponses.flatMap(response => response.data || []);
        setAllLessons(lessons);

      } catch (error) {
        console.error('Failed to load hierarchy data:', error);
        setHierarchyError(error as Error);
      } finally {
        setIsLoadingHierarchy(false);
      }
    };

    loadHierarchyData();
  }, [courses]);

  // Calculate loading state
  const isLoading = useMemo(() => {
    return coursesLoading || isLoadingHierarchy;
  }, [coursesLoading, isLoadingHierarchy]);

  // Calculate error state
  const error = useMemo(() => {
    return coursesError || hierarchyError;
  }, [coursesError, hierarchyError]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalCourses = courses.length;
    const totalLevels = allLevels.length;
    const totalSections = allSections.length;
    const totalModules = allModules.length;
    const totalLessons = allLessons.length;
    
    // Calculate completion percentage based on lessons having content
    const totalItems = totalCourses + totalLevels + totalSections + totalModules + totalLessons;
    const completionPercentage = totalItems > 0 ? Math.round((totalLessons / totalItems) * 100) : 0;
    
    return {
      totalCourses,
      totalLevels,
      totalSections,
      totalModules,
      totalLessons,
      completionPercentage
    };
  }, [courses.length, allLevels.length, allSections.length, allModules.length, allLessons.length]);

  return {
    courses,
    levels: allLevels,
    sections: allSections,
    modules: allModules,
    lessons: allLessons,
    statistics,
    isLoading,
    error
  };
};

/**
 * Hook to build tree structure from hierarchy data
 * 
 * @param hierarchyData Complete hierarchy data
 * @returns Tree structure for rendering
 */
export const useHierarchyTree = (hierarchyData: HierarchyData): HierarchyTreeNode[] => {
  return useMemo(() => {
    const { courses, levels, sections, modules, lessons } = hierarchyData;
    
    // Build tree structure
    const buildTree = (): HierarchyTreeNode[] => {
      return courses.map(course => {
        const courseLevels = levels.filter(level => level.courseId === course.id);
        
        const levelNodes: HierarchyTreeNode[] = courseLevels.map(level => {
          const levelSections = sections.filter(section => section.levelId === level.id);
          
          const sectionNodes: HierarchyTreeNode[] = levelSections.map(section => {
            const sectionModules = modules.filter(module => module.sectionId === section.id);
            
            const moduleNodes: HierarchyTreeNode[] = sectionModules.map(module => {
              const moduleLessons = lessons.filter(lesson => lesson.moduleId === module.id);
              
              const lessonNodes: HierarchyTreeNode[] = moduleLessons.map(lesson => ({
                id: lesson.id,
                name: lesson.name,
                type: 'lesson' as const,
                parentId: module.id,
                children: [],
                order: lesson.order || 0,
                metadata: {
                  experiencePoints: lesson.experiencePoints,
                  childCount: 0
                }
              }));
              
              return {
                id: module.id,
                name: module.name,
                type: 'module' as const,
                parentId: section.id,
                children: lessonNodes.sort((a, b) => a.order - b.order),
                order: module.order || 0,
                metadata: {
                  moduleType: module.moduleType,
                  childCount: lessonNodes.length
                }
              };
            });
            
            return {
              id: section.id,
              name: section.name,
              type: 'section' as const,
              parentId: level.id,
              children: moduleNodes.sort((a, b) => a.order - b.order),
              order: section.order || 0,
              metadata: {
                childCount: moduleNodes.length
              }
            };
          });
          
          return {
            id: level.id,
            name: level.name,
            type: 'level' as const,
            parentId: course.id,
            children: sectionNodes.sort((a, b) => a.order - b.order),
            order: level.order || 0,
            metadata: {
              code: level.code,
              childCount: sectionNodes.length
            }
          };
        });
        
        return {
          id: course.id,
          name: course.name,
          type: 'course' as const,
          children: levelNodes.sort((a, b) => a.order - b.order),
          order: 0,
          metadata: {
            childCount: levelNodes.length
          }
        };
      });
    };
    
    return buildTree();
  }, [hierarchyData]);
};