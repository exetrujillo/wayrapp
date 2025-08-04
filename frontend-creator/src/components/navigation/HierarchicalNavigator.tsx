/**
 * Hierarchical Navigator Component for WayrApp Creator
 * 
 * This component provides a navigation interface that shows the entire
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

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { HierarchyPath } from '../../utils/breadcrumbUtils';
import { useSimpleHierarchyData } from '../../hooks/useSimpleHierarchyData';

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
 * Interface for hierarchy tree node
 */
interface HierarchyTreeNode {
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
 * Interface for search result
 */
interface SearchResult {
  id: string;
  name: string;
  type: 'course' | 'level' | 'section' | 'module' | 'lesson';
  path: HierarchyPath;
  parentName?: string;
  matchedText: string;
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
 * Enhanced hierarchical navigator component with complete data loading
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

  // Load complete hierarchy data using simple approach
  const hierarchyData = useSimpleHierarchyData();
  
  // Build tree data from hierarchy data
  const treeData = useMemo(() => {
    const { courses, levels, sections, modules, lessons } = hierarchyData;
    
    return courses.map(course => {
      const courseLevels = levels.filter(level => level.courseId === course.id);
      
      const levelNodes = courseLevels.map(level => {
        const levelSections = sections.filter(section => section.levelId === level.id);
        
        const sectionNodes = levelSections.map(section => {
          const sectionModules = modules.filter(module => module.sectionId === section.id);
          
          const moduleNodes = sectionModules.map(module => {
            const moduleLessons = lessons.filter(lesson => lesson.moduleId === module.id);
            
            const lessonNodes = moduleLessons.map(lesson => ({
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
  }, [hierarchyData]);

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
   * Build navigation path from node and tree structure
   */
  const buildNavigationPath = useCallback((node: HierarchyTreeNode): HierarchyPath => {
    // Find the full path by traversing up the tree
    const findParentPath = (currentNode: HierarchyTreeNode): HierarchyPath => {
      const currentPath: HierarchyPath = {};

      // Set current node in path
      switch (currentNode.type) {
        case 'course':
          currentPath.courseId = currentNode.id;
          break;
        case 'level':
          currentPath.levelId = currentNode.id;
          // Find parent course
          const parentCourse = treeData.find(course =>
            course.children.some(level => level.id === currentNode.id)
          );
          if (parentCourse) {
            currentPath.courseId = parentCourse.id;
          }
          break;
        case 'section':
          currentPath.sectionId = currentNode.id;
          // Find parent level and course
          for (const course of treeData) {
            for (const level of course.children) {
              if (level.children.some(section => section.id === currentNode.id)) {
                currentPath.courseId = course.id;
                currentPath.levelId = level.id;
                break;
              }
            }
          }
          break;
        case 'module':
          currentPath.moduleId = currentNode.id;
          // Find parent section, level, and course
          for (const course of treeData) {
            for (const level of course.children) {
              for (const section of level.children) {
                if (section.children.some(module => module.id === currentNode.id)) {
                  currentPath.courseId = course.id;
                  currentPath.levelId = level.id;
                  currentPath.sectionId = section.id;
                  break;
                }
              }
            }
          }
          break;
        case 'lesson':
          currentPath.lessonId = currentNode.id;
          // Find parent module, section, level, and course
          for (const course of treeData) {
            for (const level of course.children) {
              for (const section of level.children) {
                for (const module of section.children) {
                  if (module.children.some(lesson => lesson.id === currentNode.id)) {
                    currentPath.courseId = course.id;
                    currentPath.levelId = level.id;
                    currentPath.sectionId = section.id;
                    currentPath.moduleId = module.id;
                    break;
                  }
                }
              }
            }
          }
          break;
      }

      return currentPath;
    };

    return findParentPath(node);
  }, [treeData]);

  /**
   * Perform search across complete hierarchy
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

      // Helper function to search nodes recursively
      const searchNodes = (nodes: HierarchyTreeNode[], parentName?: string) => {
        nodes.forEach(node => {
          // Check if node matches search query
          if (node.name.toLowerCase().includes(lowerQuery) ||
            (node.metadata?.code && node.metadata.code.toLowerCase().includes(lowerQuery))) {

            const nodePath = buildNavigationPath(node);
            results.push({
              id: node.id,
              name: node.name,
              type: node.type,
              path: nodePath,
              ...(parentName && { parentName }),
              matchedText: node.name
            });
          }

          // Search children recursively
          if (node.children.length > 0) {
            searchNodes(node.children, node.name);
          }
        });
      };

      // Search all tree data
      searchNodes(treeData);

      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [treeData, buildNavigationPath]);

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
   * Check if a node is currently selected
   */
  const isNodeSelected = useCallback((node: HierarchyTreeNode): boolean => {
    switch (node.type) {
      case 'course':
        return currentPath.courseId === node.id;
      case 'level':
        return currentPath.levelId === node.id;
      case 'section':
        return currentPath.sectionId === node.id;
      case 'module':
        return currentPath.moduleId === node.id;
      case 'lesson':
        return currentPath.lessonId === node.id;
      default:
        return false;
    }
  }, [currentPath]);

  /**
   * Render a tree node
   */
  const renderTreeNode = (node: HierarchyTreeNode, depth: number = 0) => {
    const isCurrentNode = isNodeSelected(node);
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const paddingLeft = depth * 20;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 hover:bg-gray-50 cursor-pointer rounded-md transition-colors duration-150 ${isCurrentNode ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
          onClick={() => {
            // Navigate to the node
            const path = buildNavigationPath(node);
            handleNavigate(path);
          }}
        >
          {/* Expansion toggle */}
          {hasChildren && (
            <button
              className="mr-2 p-1 hover:bg-gray-200 rounded"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpansion(node.id);
              }}
              role="button"
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.name}`}
            >
              {isExpanded ? (
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
              <span className={`text-sm font-medium truncate ${isCurrentNode ? 'text-blue-700' : 'text-gray-900'
                }`}>
                {node.name}
              </span>

              {/* Child count */}
              {node.metadata?.childCount !== undefined && node.metadata.childCount > 0 && (
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

            {/* Experience points for lessons */}
            {node.type === 'lesson' && node.metadata?.experiencePoints && (
              <div className="text-xs text-primary-600">
                {node.metadata.experiencePoints} XP
              </div>
            )}
          </div>
        </div>

        {/* Render children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
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

    const { courses, levels, sections, modules, lessons } = hierarchyData;
    const totalCourses = courses.length;
    const totalLevels = levels.length;
    const totalSections = sections.length;
    const totalModules = modules.length;
    const totalLessons = lessons.length;
    
    const totalItems = totalCourses + totalLevels + totalSections + totalModules + totalLessons;
    const completionPercentage = totalItems > 0 ? Math.round((totalLessons / totalItems) * 100) : 0;

    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          {t('hierarchicalNavigator.statistics', 'Content Statistics')}
        </h4>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">{t('hierarchicalNavigator.courses', 'Courses')}</div>
            <div className="font-semibold text-gray-900">{totalCourses}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('hierarchicalNavigator.levels', 'Levels')}</div>
            <div className="font-semibold text-gray-900">{totalLevels}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('hierarchicalNavigator.sections', 'Sections')}</div>
            <div className="font-semibold text-gray-900">{totalSections}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('hierarchicalNavigator.modules', 'Modules')}</div>
            <div className="font-semibold text-gray-900">{totalModules}</div>
          </div>
          <div>
            <div className="text-gray-500">{t('hierarchicalNavigator.lessons', 'Lessons')}</div>
            <div className="font-semibold text-gray-900">{totalLessons}</div>
          </div>
        </div>

        {completionPercentage > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">{t('hierarchicalNavigator.completion', 'Completion')}</span>
              <span className="font-semibold">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (hierarchyData.isLoading) {
    return (
      <div className={`hierarchical-navigator ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border border-gray-300 border-t-blue-600 rounded-full"></div>
          <span className="ml-3 text-gray-600">{t('common.loading', 'Loading...')}</span>
        </div>
      </div>
    );
  }

  if (hierarchyData.error) {
    return (
      <div className={`hierarchical-navigator ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="text-red-600">
            <p>Error loading hierarchy data</p>
            <p className="text-sm">{hierarchyData.error.message}</p>
          </div>
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
              placeholder={t('hierarchicalNavigator.searchPlaceholder', 'Search content...')}
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
          {treeData.length === 0 && !hierarchyData.isLoading && (
            <div className="text-center py-8">
              <BookIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h4 className="mt-2 text-sm font-medium text-gray-900">
                {t('hierarchicalNavigator.noCourses', 'No courses available')}
              </h4>
              <p className="mt-1 text-sm text-gray-500">
                {t('hierarchicalNavigator.createFirstCourse', 'Create your first course to get started')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HierarchicalNavigator;