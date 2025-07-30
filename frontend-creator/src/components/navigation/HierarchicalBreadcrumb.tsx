/**
 * Intelligent Hierarchical Breadcrumb Navigation System for WayrApp Creator
 * 
 * This component provides intelligent breadcrumb navigation that validates entity existence
 * before making links clickable, implements loading states for dynamic breadcrumb segments,
 * and prevents navigation to non-existent entities. It generates breadcrumbs dynamically
 * based on the current hierarchy path and validates each segment before rendering.
 * 
 * Key features:
 * - Validates parent entity existence before showing child breadcrumbs as clickable
 * - Shows non-existent intermediate levels (like "Niveles") as non-clickable placeholders
 * - Implements proper hierarchical validation (level requires course, section requires level, etc.)
 * - Provides loading states during entity validation
 * - Prevents navigation to invalid or non-existent entities
 * 
 * @module HierarchicalBreadcrumb
 * @category Navigation
 * @author Exequiel Trujillo
 * @since 1.0.0
 * 
 * @example
 * // Basic usage with hierarchy path
 * <HierarchicalBreadcrumb 
 *   currentPath={{ courseId: 'course1', levelId: 'level1', sectionId: 'section1' }}
 *   onNavigate={(path) => navigate(path)}
 * />
 * 
 * @example
 * // With auto-redirect to nearest valid parent
 * <HierarchicalBreadcrumb 
 *   currentPath={{ courseId: 'invalid', levelId: 'level1' }}
 *   onNavigate={(path) => navigate(path)}
 * />
 * // Will show "Unknown Course" as non-clickable and "Niveles" as non-clickable placeholder
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
// Simple SVG icons to replace heroicons
const ChevronRightIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
);

const HomeIcon = ({ className }: { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
);
import { useBreadcrumbs, useHierarchyPathFromUrl } from '../../hooks/useBreadcrumbs';
import { HierarchyPath } from '../../utils/breadcrumbUtils';



/**
 * Props for the HierarchicalBreadcrumb component
 */
interface HierarchicalBreadcrumbProps {
    /** Current position in the hierarchy (optional - will be parsed from URL if not provided) */
    currentPath?: HierarchyPath;
    /** Callback when user navigates to a different level */
    onNavigate?: (path: HierarchyPath) => void;
    /** Additional CSS classes */
    className?: string;
    /** Whether to show the home icon */
    showHomeIcon?: boolean;
    /** Title for the current page (for compatibility with legacy breadcrumb) */
    title?: string | undefined;
}

/**
 * Intelligent breadcrumb navigation component that validates entity existence
 * and provides loading states for dynamic segments.
 * 
 * @param props - Component props
 * @returns JSX element representing the breadcrumb navigation
 */
export const HierarchicalBreadcrumb: React.FC<HierarchicalBreadcrumbProps> = ({
    currentPath,
    onNavigate,
    className = '',
    showHomeIcon = true,
    title
}) => {
    const location = useLocation();
    
    // Parse current path from URL if not provided
    const parsedPath = useHierarchyPathFromUrl(location.pathname);
    const effectivePath = currentPath || parsedPath;
    
    // Use the breadcrumbs hook for intelligent navigation
    const { breadcrumbs, navigate: navigateToPath } = useBreadcrumbs(effectivePath, {
        ...(onNavigate && { onNavigate }),
        showLoadingStates: true
    });

    /**
     * Handle breadcrumb navigation with validation
     */
    const handleNavigate = (item: any) => {
        if (!item.isClickable || item.isLoading) {
            return;
        }

        // Extract path components for navigation
        const pathComponents = item.path.split('/').filter(Boolean);
        const newPath: HierarchyPath = {};

        // Build hierarchy path based on the clicked item
        if (pathComponents.includes('courses') && pathComponents[1]) {
            newPath.courseId = pathComponents[1];
        }
        if (pathComponents.includes('levels') && pathComponents[3]) {
            newPath.levelId = pathComponents[3];
        }
        if (pathComponents.includes('sections') && pathComponents[5]) {
            newPath.sectionId = pathComponents[5];
        }
        if (pathComponents.includes('modules') && pathComponents[7]) {
            newPath.moduleId = pathComponents[7];
        }
        if (pathComponents.includes('lessons') && pathComponents[9]) {
            newPath.lessonId = pathComponents[9];
        }

        // Use the hook's navigation method
        navigateToPath(newPath);
    };

    /**
     * Render individual breadcrumb item
     */
    const renderBreadcrumbItem = (item: any, index: number) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
            <li key={item.id} className="flex items-center">
                {index > 0 && (
                    <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
                )}

                {item.isLoading ? (
                    <div className="flex items-center space-x-2">
                        <div className="animate-pulse bg-gray-200 h-4 w-20 rounded"></div>
                        <div className="animate-spin h-3 w-3 border border-gray-300 border-t-blue-600 rounded-full"></div>
                    </div>
                ) : item.isClickable && !isLast ? (
                    <button
                        onClick={() => handleNavigate(item)}
                        className="text-blue-600 hover:text-blue-800 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded px-1 py-0.5 transition-colors duration-200"
                        aria-label={`Navigate to ${item.entityType}: ${item.label}`}
                    >
                        {item.label}
                    </button>
                ) : (
                    <span
                        className={`${isLast
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-500 cursor-not-allowed'
                            }`}
                        title={!item.isClickable && !isLast ? 'Entity not found or loading' : undefined}
                    >
                        {item.label}
                    </span>
                )}
            </li>
        );
    };

    // Don't render if no path is provided
    if (!effectivePath.courseId) {
        return null;
    }

    return (
        <nav
            className={`flex items-center space-x-1 text-sm mb-4 ${className}`}
            aria-label="Breadcrumb navigation"
        >
            <ol className="flex items-center space-x-1">
                {showHomeIcon && (
                    <li className="flex items-center">
                        <Link
                            to="/courses"
                            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded p-1 transition-colors duration-200"
                            aria-label="Go to courses home"
                        >
                            <HomeIcon className="h-4 w-4" />
                        </Link>
                        {(breadcrumbs.length > 0 || title) && (
                            <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
                        )}
                    </li>
                )}

                {breadcrumbs.map((item, index) => renderBreadcrumbItem(item, index))}
                
                {/* Add title as final breadcrumb item if provided */}
                {title && (
                    <li className="flex items-center">
                        {breadcrumbs.length > 0 && (
                            <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-2" />
                        )}
                        <span className="text-gray-900 font-medium" aria-current="page">
                            {title}
                        </span>
                    </li>
                )}
            </ol>
        </nav>
    );
};
