/**
 * Enhanced Hierarchical Navigator Component for WayrApp Creator
 * 
 * This component provides a comprehensive navigation interface that shows the entire
 * course hierarchy as an expandable tree view with search functionality and statistics.
 * It complements the existing breadcrumb navigation by providing a bird's-eye view
 * of the complete content structure.
 * 
 * Key features:
 * - Expandable tree view of the entire hierarchy
 * - Quick navigation between any hierarchy levels
 * - Search functionality across all content
 * - Statistics and completion status indicators
 * - Dynamic loading of child content
 * - Keyboard navigation support
 * - Responsive design for different screen sizes
 * 
 * @module HierarchicalNavigator
 * @category Navigation
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic usage
 * <HierarchicalNavigator 
 *   currentPath={{ courseId: 'course1', levelId: 'level1' }}
 *   onNavigate={(path) => navigate(path)}
 * />
 * 
 * @example
 * // With search and statistics
 * <HierarchicalNavigator 
 *   currentPath={{ courseId: 'course1' }}
 *   onNavigate={(path) => navigate(path)}
 *   showSearch={true}
 *   showStatistics={true}
 * />
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HierarchyPath } from '../../utils/breadcrumbUtils';
import { 
  useCoursesQuery, 
  useLevelsQuery, 
  useSectionsQuery, 
  useModulesQuery, 
  useLessonsQuery 
} from '../../hooks';
// Types are imported through hooks

// Simple SVG icons
const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);

const BookIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V4.804z" />
  </svg>
);

const LayersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
  </svg>
);

const CollectionIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
  </svg>
);

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
  </svg>
);

/**
 * Interface for tree node data structure
 */
interface TreeNode {
  id: string;
  name: string;
  type: 'course' | 'level' | 'section' | 'module' | 'lesson';
  parentId?: string;
  children: TreeNode[];
  isExpanded: boolean;
  isLoading: boolean;
  order: number;
  metadata?: {
    code?: string;
    moduleType?: string;
    experiencePoints?: number;
    childCount?: number;
  };
}

/**
 * Interface for search result
 */
interface SearchResult {
  id: string;
  name: string;
  type: 'course' | 'level' | 'section' | 'module' | 'lesson';
  path: HierarchyPath;
  parentName?: string | undefined;
  matchedText: string;
}

/**
 * Interface for hierarchy statistics
 */
interface HierarchyStats {
  totalCourses: number;
  totalLevels: number;
  totalSections: number;
  totalModules: number;
  totalLessons: number;
  completionPercentage: number;
}

/**
 * Props for the HierarchicalNavigator component
 */
interface HierarchicalNavigatorProps {
  /** Current position in the hierarchy */
  currentPath?: HierarchyPath;
  /** Callback when user navigates to a different level */
  onNavigate?: (path: HierarchyPath) => void;
  /** Whether to show search functionality */
  showSearch?: boolean;
  /** Whether to show statistics */
  showStatistics?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Maximum height for the navigator */
  maxHeight?: string;
  /** Whether to show in compact mode */
  compact?: boolean;
}

/**
 * Enhanced hierarchical navigator component with tree view, search, and statistics
 */
export const HierarchicalNavigator: React.FC<HierarchicalNavigatorProps> = ({
  currentPath = {},
  onNavigate,
  showSearch = true,
  showStatistics = true,
  className = '',
  maxHeight = '600px',
  compact = false
}) => {
  const { t } = useTranslation();
  
  // State management
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Data fetching
  const { data: coursesData, isLoading: coursesLoading } = useCoursesQuery();
  const courses = coursesData?.data || [];

  // Dynamic data loading for expanded nodes
  const expandedCourses = Array.from(expandedNodes).filter(id => 
    courses.some(course => course.id === id)
  );
  


  // Load levels for expanded courses
  const levelQueries = expandedCourses.map(courseId => ({
    courseId,
    query: useLevelsQuery(courseId, undefined, true)
  }));

  // Load sections for expanded levels
  const expandedLevelsData = Array.from(expandedNodes).filter(id => {
    // Check if this is a level ID by looking for it in the loaded levels
    return levelQueries.some(lq => 
      lq.query.data?.data?.some(level => level.id === id)
    );
  });

  const sectionQueries = expandedLevelsData.map(levelId => ({
    levelId,
    query: useSectionsQuery(levelId, undefined, true)
  }));

  // Load modules for expanded sections
  const expandedSectionsData = Array.from(expandedNodes).filter(id => {
    return sectionQueries.some(sq => 
      sq.query.data?.data?.some(section => section.id === id)
    );
  });

  const moduleQueries = expandedSectionsData.map(sectionId => ({
    sectionId,
    query: useModulesQuery(sectionId, undefined, true)
  }));

  // Load lessons for expanded modules
  const expandedModulesData = Array.from(expandedNodes).filter(id => {
    return moduleQueries.some(mq => 
      mq.query.data?.data?.some(module => module.id === id)
    );
  });

  const lessonQueries = expandedModulesData.map(moduleId => ({
    moduleId,
    query: useLessonsQuery(moduleId, undefined, true)
  }));

  // Build tree structure with dynamic loading
  const treeData = useMemo(() => {
    const buildTree = (): TreeNode[] => {
      return courses.map(course => {
        const isExpanded = expandedNodes.has(course.id);
        const levelQuery = levelQueries.find(q => q.courseId === course.id);
        const levels = levelQuery?.query.data?.data || [];
        
        const children: TreeNode[] = isExpanded ? levels.map(level => {
          const levelExpanded = expandedNodes.has(level.id);
          const sectionQuery = sectionQueries.find(q => q.levelId === level.id);
          const sections = sectionQuery?.query.data?.data || [];

          const levelChildren: TreeNode[] = levelExpanded ? sections.map(section => {
            const sectionExpanded = expandedNodes.has(section.id);
            const moduleQuery = moduleQueries.find(q => q.sectionId === section.id);
            const modules = moduleQuery?.query.data?.data || [];

            const sectionChildren: TreeNode[] = sectionExpanded ? modules.map(module => {
              const moduleExpanded = expandedNodes.has(module.id);
              const lessonQuery = lessonQueries.find(q => q.moduleId === module.id);
              const lessons = lessonQuery?.query.data?.data || [];

              const moduleChildren: TreeNode[] = moduleExpanded ? lessons.map(lesson => ({
                id: lesson.id,
                name: lesson.id, // Use lesson ID as name since Lesson interface doesn't have name property
                type: 'lesson' as const,
                parentId: module.id,
                children: [],
                isExpanded: false,
                isLoading: false,
                order: lesson.order,
                metadata: {
                  experiencePoints: lesson.experiencePoints
                }
              })) : [];

              return {
                id: module.id,
                name: module.name,
                type: 'module' as const,
                parentId: section.id,
                children: moduleChildren,
                isExpanded: moduleExpanded,
                isLoading: lessonQuery?.query.isLoading || false,
                order: module.order,
                metadata: {
                  moduleType: module.moduleType,
                  childCount: lessons.length
                }
              };
            }) : [];

            return {
              id: section.id,
              name: section.name,
              type: 'section' as const,
              parentId: level.id,
              children: sectionChildren,
              isExpanded: sectionExpanded,
              isLoading: moduleQuery?.query.isLoading || false,
              order: section.order,
              metadata: {
                childCount: modules.length
              }
            };
          }) : [];

          return {
            id: level.id,
            name: level.name,
            type: 'level' as const,
            parentId: course.id,
            children: levelChildren,
            isExpanded: levelExpanded,
            isLoading: sectionQuery?.query.isLoading || false,
            order: level.order,
            metadata: {
              code: level.code,
              childCount: sections.length
            }
          };
        }) : [];

        return {
          id: course.id,
          name: course.name,
          type: 'course' as const,
          children,
          isExpanded,
          isLoading: levelQuery?.query.isLoading || false,
          order: 0,
          metadata: {
            childCount: levels.length
          }
        };
      });
    };

    return buildTree();
  }, [courses, expandedNodes, levelQueries, sectionQueries, moduleQueries, lessonQueries]);

  // Calculate statistics
  const statistics = useMemo((): HierarchyStats => {
    let totalLevels = 0;
    let totalSections = 0;
    let totalModules = 0;
    let totalLessons = 0;

    // Count levels from all level queries
    levelQueries.forEach(lq => {
      if (lq.query.data?.data) {
        totalLevels += lq.query.data.data.length;
      }
    });

    // Count sections from all section queries
    sectionQueries.forEach(sq => {
      if (sq.query.data?.data) {
        totalSections += sq.query.data.data.length;
      }
    });

    // Count modules from all module queries
    moduleQueries.forEach(mq => {
      if (mq.query.data?.data) {
        totalModules += mq.query.data.data.length;
      }
    });

    // Count lessons from all lesson queries
    lessonQueries.forEach(lq => {
      if (lq.query.data?.data) {
        totalLessons += lq.query.data.data.length;
      }
    });

    // Calculate completion percentage (simplified - could be more sophisticated)
    const totalItems = courses.length + totalLevels + totalSections + totalModules + totalLessons;
    const completionPercentage = totalItems > 0 ? Math.round((totalLessons / totalItems) * 100) : 0;

    return {
      totalCourses: courses.length,
      totalLevels,
      totalSections,
      totalModules,
      totalLessons,
      completionPercentage
    };
  }, [courses, levelQueries, sectionQueries, moduleQueries, lessonQueries]);

  /**
   * Toggle expansion state of a tree node
   */
  const toggleExpansion = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  /**
   * Handle navigation to a specific path
   */
  const handleNavigate = useCallback((path: HierarchyPath) => {
    if (onNavigate) {
      onNavigate(path);
    }
  }, [onNavigate]);

  /**
   * Build navigation path from node
   */
  const buildNavigationPath = useCallback((node: TreeNode): HierarchyPath => {
    const path: HierarchyPath = {};
    
    // Find the full path by traversing up the tree
    const findPath = (currentNode: TreeNode, currentPath: HierarchyPath = {}): HierarchyPath => {
      switch (currentNode.type) {
        case 'course':
          return { ...currentPath, courseId: currentNode.id };
        case 'level':
          return { ...currentPath, levelId: currentNode.id };
        case 'section':
          return { ...currentPath, sectionId: currentNode.id };
        case 'module':
          return { ...currentPath, moduleId: currentNode.id };
        case 'lesson':
          return { ...currentPath, lessonId: currentNode.id };
        default:
          return currentPath;
      }
    };

    return findPath(node, path);
  }, []);

  /**
   * Perform search across hierarchy
   */
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    try {
      const results: SearchResult[] = [];
      const lowerQuery = query.toLowerCase();

      // Search courses
      courses
        .filter(course => course.name.toLowerCase().includes(lowerQuery))
        .forEach(course => {
          results.push({
            id: course.id,
            name: course.name,
            type: 'course' as const,
            path: { courseId: course.id },
            matchedText: course.name
          });
        });

      // Search levels
      levelQueries.forEach(lq => {
        if (lq.query.data?.data) {
          lq.query.data.data
            .filter(level => level.name.toLowerCase().includes(lowerQuery) || level.code.toLowerCase().includes(lowerQuery))
            .forEach(level => {
              const course = courses.find(c => c.id === level.courseId);
              results.push({
                id: level.id,
                name: level.name,
                type: 'level' as const,
                path: { courseId: level.courseId, levelId: level.id },
                parentName: course?.name || undefined,
                matchedText: level.name
              });
            });
        }
      });

      // Search sections
      sectionQueries.forEach(sq => {
        if (sq.query.data?.data) {
          sq.query.data.data
            .filter(section => section.name.toLowerCase().includes(lowerQuery))
            .forEach(section => {
              // Find the parent level and course
              const level = levelQueries
                .flatMap(lq => lq.query.data?.data || [])
                .find(l => l.id === section.levelId);
              
              results.push({
                id: section.id,
                name: section.name,
                type: 'section' as const,
                path: { 
                  courseId: level?.courseId, 
                  levelId: section.levelId, 
                  sectionId: section.id 
                },
                parentName: level?.name || undefined,
                matchedText: section.name
              });
            });
        }
      });

      // Search modules
      moduleQueries.forEach(mq => {
        if (mq.query.data?.data) {
          mq.query.data.data
            .filter(module => module.name.toLowerCase().includes(lowerQuery))
            .forEach(module => {
              // Find the parent section
              const section = sectionQueries
                .flatMap(sq => sq.query.data?.data || [])
                .find(s => s.id === module.sectionId);
              
              results.push({
                id: module.id,
                name: module.name,
                type: 'module' as const,
                path: { 
                  courseId: section?.levelId ? levelQueries
                    .flatMap(lq => lq.query.data?.data || [])
                    .find(l => l.id === section.levelId)?.courseId : undefined,
                  levelId: section?.levelId,
                  sectionId: module.sectionId, 
                  moduleId: module.id 
                },
                parentName: section?.name || undefined,
                matchedText: module.name
              });
            });
        }
      });

      // Search lessons
      lessonQueries.forEach(lq => {
        if (lq.query.data?.data) {
          lq.query.data.data
            .filter(lesson => lesson.id.toLowerCase().includes(lowerQuery)) // Use lesson.id since name doesn't exist
            .forEach(lesson => {
              // Find the parent module
              const module = moduleQueries
                .flatMap(mq => mq.query.data?.data || [])
                .find(m => m.id === lesson.moduleId);
              
              results.push({
                id: lesson.id,
                name: lesson.id, // Use lesson.id as name since name property doesn't exist
                type: 'lesson' as const,
                path: { 
                  courseId: module ? sectionQueries
                    .flatMap(sq => sq.query.data?.data || [])
                    .find(s => s.id === module.sectionId)?.levelId ? levelQueries
                      .flatMap(lq => lq.query.data?.data || [])
                      .find(l => l.id === sectionQueries
                        .flatMap(sq => sq.query.data?.data || [])
                        .find(s => s.id === module.sectionId)?.levelId)?.courseId : undefined : undefined,
                  levelId: module ? sectionQueries
                    .flatMap(sq => sq.query.data?.data || [])
                    .find(s => s.id === module.sectionId)?.levelId : undefined,
                  sectionId: module?.sectionId,
                  moduleId: lesson.moduleId,
                  lessonId: lesson.id 
                },
                parentName: module?.name || undefined,
                matchedText: lesson.id // Use lesson.id as matched text
              });
            });
        }
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [courses, levelQueries, sectionQueries, moduleQueries, lessonQueries]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  /**
   * Get icon for tree node type
   */
  const getNodeIcon = (type: string) => {
    const iconClass = "h-4 w-4 text-gray-500";
    
    switch (type) {
      case 'course':
        return <BookIcon className={iconClass} />;
      case 'level':
        return <LayersIcon className={iconClass} />;
      case 'section':
        return <CollectionIcon className={iconClass} />;
      case 'module':
        return <DocumentIcon className={iconClass} />;
      case 'lesson':
        return <DocumentIcon className={iconClass} />;
      default:
        return <DocumentIcon className={iconClass} />;
    }
  };

  /**
   * Render a tree node
   */
  const renderTreeNode = (node: TreeNode, depth: number = 0) => {
    const isCurrentNode = currentPath.courseId === node.id ||
                         currentPath.levelId === node.id ||
                         currentPath.sectionId === node.id ||
                         currentPath.moduleId === node.id ||
                         currentPath.lessonId === node.id;

    const hasChildren = node.children.length > 0;
    const paddingLeft = depth * 20;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer rounded-md transition-colors duration-150 ${
            isCurrentNode ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
          onClick={() => {
            // Navigate to the node
            const path = buildNavigationPath(node);
            handleNavigate(path);
          }}
        >
          {/* Expansion toggle */}
          {(hasChildren || node.metadata?.childCount !== undefined) && (
            <button
              className="mr-2 p-1 hover:bg-gray-200 rounded"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpansion(node.id);
              }}
              role="button"
              aria-label={`${node.isExpanded ? 'Collapse' : 'Expand'} ${node.name}`}
            >
              {node.isExpanded ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronRightIcon className="h-3 w-3" />
              )}
            </button>
          )}
          
          {/* Node icon */}
          <div className="mr-3">
            {getNodeIcon(node.type)}
          </div>
          
          {/* Node content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium truncate ${
                isCurrentNode ? 'text-blue-700' : 'text-gray-900'
              }`}>
                {node.name}
              </span>
              
              {/* Metadata */}
              {node.metadata?.childCount !== undefined && (
                <span className="text-xs text-gray-500 ml-2">
                  ({node.metadata.childCount})
                </span>
              )}
            </div>
            
            {/* Additional info for compact mode */}
            {compact && node.metadata?.code && (
              <div className="text-xs text-gray-500 truncate">
                {node.metadata.code}
              </div>
            )}
          </div>
          
          {/* Loading indicator */}
          {node.isLoading && (
            <div className="ml-2" role="status" aria-label="Loading">
              <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>
            </div>
          )}
        </div>
        
        {/* Render children */}
        {node.isExpanded && node.children.map(child => 
          renderTreeNode(child, depth + 1)
        )}
      </div>
    );
  };

  /**
   * Render search results
   */
  const renderSearchResults = () => {
    if (!searchQuery) return null;

    return (
      <div className="border-t border-gray-200 mt-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">
            {t('hierarchicalNavigator.searchResults')}
          </h4>
          {isSearching && (
            <div className="animate-spin h-4 w-4 border border-gray-300 border-t-blue-600 rounded-full"></div>
          )}
        </div>
        
        {searchResults.length === 0 && !isSearching ? (
          <p className="text-sm text-gray-500 italic">
            {t('hierarchicalNavigator.noResults')}
          </p>
        ) : (
          <div className="space-y-2">
            {searchResults.map(result => (
              <div
                key={result.id}
                className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                onClick={() => handleNavigate(result.path)}
              >
                <div className="mr-3">
                  {getNodeIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {result.name}
                  </div>
                  {result.parentName && (
                    <div className="text-xs text-gray-500 truncate">
                      in {result.parentName}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 uppercase">
                  {result.type}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  /**
   * Render statistics panel
   */
  const renderStatistics = () => {
    if (!showStatistics) return null;

    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          {t('hierarchicalNavigator.statistics')}
        </h4>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">{t('hierarchicalNavigator.courses')}</div>
            <div className="font-semibold text-gray-900">{statistics.totalCourses}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('hierarchicalNavigator.levels')}</div>
            <div className="font-semibold text-gray-900">{statistics.totalLevels}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('hierarchicalNavigator.sections')}</div>
            <div className="font-semibold text-gray-900">{statistics.totalSections}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('hierarchicalNavigator.modules')}</div>
            <div className="font-semibold text-gray-900">{statistics.totalModules}</div>
          </div>
        </div>
        
        {statistics.completionPercentage > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">{t('hierarchicalNavigator.completion')}</span>
              <span className="font-semibold">{statistics.completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${statistics.completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (coursesLoading) {
    return (
      <div className={`hierarchical-navigator ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border border-gray-300 border-t-blue-600 rounded-full"></div>
          <span className="ml-3 text-gray-600">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`hierarchical-navigator bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('hierarchicalNavigator.title')}
        </h3>
        
        {/* Search */}
        {showSearch && (
          <div className="mt-3 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              placeholder={t('hierarchicalNavigator.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div 
        className="overflow-y-auto"
        style={{ maxHeight }}
      >
        <div className="p-4">
          {/* Statistics */}
          {renderStatistics()}
          
          {/* Tree view */}
          {searchQuery ? (
            renderSearchResults()
          ) : (
            <div className="space-y-1">
              {treeData.map(node => renderTreeNode(node))}
            </div>
          )}
          
          {/* Empty state */}
          {treeData.length === 0 && !coursesLoading && (
            <div className="text-center py-8">
              <BookIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h4 className="mt-2 text-sm font-medium text-gray-900">
                {t('hierarchicalNavigator.noCourses')}
              </h4>
              <p className="mt-1 text-sm text-gray-500">
                {t('hierarchicalNavigator.createFirstCourse')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HierarchicalNavigator;