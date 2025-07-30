# Hierarchical Breadcrumb Navigation System

## Overview

This directory contains the intelligent hierarchical breadcrumb navigation system for WayrApp Creator. The system provides smart navigation that validates entity existence, shows loading states, and prevents navigation to non-existent pages.

## Components

### HierarchicalBreadcrumb.tsx
The main breadcrumb component that renders intelligent navigation breadcrumbs.

**Features:**
- ✅ Entity validation before making links clickable
- ✅ Loading states for dynamic breadcrumb segments  
- ✅ Navigation prevention for non-existent entities
- ✅ Accessibility support with ARIA labels
- ✅ Responsive design with touch-friendly interfaces
- ✅ Custom navigation handlers

**Usage:**
```tsx
import { HierarchicalBreadcrumb } from './components/navigation/HierarchicalBreadcrumb';

<HierarchicalBreadcrumb 
  currentPath={{ courseId: 'course1', levelId: 'level1', sectionId: 'section1' }}
  onNavigate={(path) => navigate(path)}
/>
```

### BreadcrumbExample.tsx
Comprehensive example showing different usage patterns and advanced features.

**Features:**
- Basic breadcrumb usage
- Custom navigation handlers
- Debug information display
- Integration patterns

## Hooks

### useBreadcrumbs.ts
Custom hook that manages breadcrumb state and navigation logic.

**Features:**
- ✅ Entity validation using existing CRUD hooks
- ✅ Loading state management
- ✅ Navigation handling with validation
- ✅ Integration with React Router

**Usage:**
```tsx
const { breadcrumbs, navigate, isValidPath } = useBreadcrumbs(currentPath, {
  showLoadingStates: true,
  onNavigate: customNavigationHandler
});
```

## Utilities

### breadcrumbUtils.ts
Utility functions for breadcrumb generation and path management.

**Features:**
- ✅ URL path generation and parsing
- ✅ Hierarchy path validation
- ✅ Entity existence checking
- ✅ Safe path creation (handles undefined values)

## Tests

### __tests__/HierarchicalBreadcrumb.test.tsx
Comprehensive test suite covering:
- ✅ Entity validation and loading states
- ✅ Navigation prevention for non-existent entities
- ✅ Custom navigation handlers
- ✅ Accessibility features
- ✅ Edge cases and error handling

## Integration

The breadcrumb system integrates seamlessly with:
- **React Router** - for URL-based navigation
- **TanStack Query** - for entity data fetching and caching
- **Existing CRUD hooks** - for entity validation
- **Tailwind CSS** - for styling and responsive design

## Architecture

The system follows a layered architecture:

1. **Component Layer** - React components for UI rendering
2. **Hook Layer** - Custom hooks for state management and logic
3. **Utility Layer** - Pure functions for path manipulation and validation
4. **Integration Layer** - Connects with existing app infrastructure

## Key Features Implemented

✅ **Intelligent Entity Validation** - Breadcrumbs validate entity existence before making links clickable  
✅ **Dynamic Loading States** - Shows loading indicators for breadcrumb segments being fetched  
✅ **Navigation Prevention** - Non-existent entities are displayed as text, not clickable links  
✅ **Breadcrumb Generation** - Utility functions that work with the complete hierarchy  
✅ **React Router Integration** - Seamless integration with existing routing  
✅ **Accessibility Support** - Proper ARIA labels and keyboard navigation  
✅ **Error Handling** - Graceful handling of missing entities and network errors  
✅ **TypeScript Support** - Full type safety with proper interfaces  
✅ **Responsive Design** - Works on desktop, tablet, and mobile devices  
✅ **Customizable** - Supports custom navigation handlers and styling  

## Usage Patterns

### Basic Usage
```tsx
<HierarchicalBreadcrumb currentPath={currentPath} />
```

### With Custom Navigation
```tsx
<HierarchicalBreadcrumb 
  currentPath={currentPath}
  onNavigate={(path) => {
    console.log('Navigating to:', path);
    navigate(generateUrl(path));
  }}
/>
```

### Without Home Icon
```tsx
<HierarchicalBreadcrumb 
  currentPath={currentPath}
  showHomeIcon={false}
/>
```

### With Custom Styling
```tsx
<HierarchicalBreadcrumb 
  currentPath={currentPath}
  className="my-custom-breadcrumb-styles"
/>
```

## Future Enhancements

Potential improvements for future iterations:
- [ ] Breadcrumb caching for better performance
- [ ] Keyboard shortcuts for breadcrumb navigation
- [ ] Breadcrumb history and back/forward navigation
- [ ] Custom breadcrumb item renderers
- [ ] Breadcrumb analytics and usage tracking