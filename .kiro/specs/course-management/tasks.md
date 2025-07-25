# Implementation Plan

- [x] 1. Set up foundational infrastructure and API services






  - Create new service files (levelService.ts, sectionService.ts, moduleService.ts, lessonService.ts) that extend the base ApiClient
  - Ensure each service handles errors consistently and aligns with nested API endpoints (/courses/:courseId/levels, etc.)
  - Update API constants with new endpoint definitions for hierarchical resources
  - Create corresponding Zod validation schemas for all new form data types

  - _Requirements: 7.3, 6.1_



- [x] 2. Implement TanStack Query hooks for hierarchical data management










  - Create a new central queryKeys.ts factory for all hierarchical entities
  - Implement all necessary useQuery and useMutation hooks for Levels, Sections, Modules, and Lessons


  - Ensure mutation hooks correctly configure onSuccess callbacks to invalidate appropriate query keys
  - Set up optimistic updates for better user experience
  - _Requirements: 12.1, 12.2, 12.3, 3.1, 3.2_

- [x] 3. Create core UI components for hierarchical navigation







  - Create HierarchicalNavigator component using existing Card, Button, and Input components from src/components/ui
  - Create LevelsSection, SectionsSection, ModulesSection, and LessonsSection components using ContentList component
  - Build new Card components (LevelCard, SectionCard, etc.) styled consistently with existing CourseCard
  - Implement breadcrumb navigation component
  - _Requirements: 8.1, 8.3, 9.1, 9.4_

- [x] 4. Develop modal-based CRUD forms for hierarchical entities


  - Refactor existing form logic into modals by finding existing logic in CreateLevelPage (if exists) and moving inside Modal component
  - Create CreateOrEdit[Entity]Modal components using Modal component from src/components/ui
  - Reuse components from src/components/forms wherever possible
  - Ensure forms use react-hook-form and Zod schemas from Task 1
  - _Requirements: 8.2, 8.4, 9.2, 9.5, 4.1, 4.2_

- [x] 5. Build the central CourseDetailPage hub





  - Create main CourseDetailPage.tsx as the "smart" container that manages Level/Section/Module selection state
  - Synchronize selection with URL query parameters (?level=...)
  - Render HierarchicalNavigator and pass down state and callbacks
  - Manage isOpen state for all CRUD modals
  - _Requirements: 8.1, 8.5, 8.6, 9.6, 9.7_

- [x] 6. Enhance CoursesListPage with improved functionality




  - Update existing CoursesListPage to use new TanStack Query patterns
  - Ensure proper integration with course creation flow
  - Implement cache invalidation after course creation
  - Add navigation to CourseDetailPage from course cards
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.4, 3.3_

- [x] 7. Implement CreateCoursePage with enhanced validation






  - Update existing CreateCoursePage to use new validation schemas
  - Ensure proper error handling and user feedback
  - Implement redirect to CourseDetailPage after successful creation
  - Add loading states and form submission handling
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 4.3, 4.4, 4.5_

- [x] 8. Create global exercise bank management system





  - Implement ExercisesPage for managing the global exercise bank
  - Create DynamicExerciseForm that adapts to different exercise types
  - Build exercise type-specific form sections (translation, fill-in-the-blank, VOF, pairs, ordering, informative)
  - Implement exercise CRUD operations with proper validation
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_
- [x] 9. Develop LessonDetailPage for exercise assignment management



  - Create LessonDetailPage as a dedicated page for lesson exercise management
  - Implement AssignedExercisesList with drag-and-drop reordering functionality
  - Build ExerciseAssignmentModal for selecting exercises from global bank
  - Add exercise unassignment functionality
  - Implement exercise order management with API integration
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 10. Implement comprehensive error handling and loading states

























  - Add consistent loading states across all components using LoadingSpinner
  - Implement error boundaries for different application levels
  - Create user-friendly error messages with retry mechanisms
  - Add network error detection and recovery
  - Ensure consistent error handling patterns across all API operations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 11. Add comprehensive form validation and user feedback










  - Implement Zod validation schemas for all form types
  - Add real-time validation feedback in all forms
  - Create field-specific error message display
  - Implement form submission state management
  - Add success feedback after successful operations
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 12. Create comprehensive test suite for all components
  - Write unit tests for all new components and hooks
  - Create integration tests for user workflows
  - Add API service tests with mock responses
  - Implement form validation tests
  - Create error handling tests
  - _Requirements: 6.2, 6.3_

- [ ] 13. Optimize performance and bundle size
  - Implement code splitting for lazy-loaded components
  - Optimize TanStack Query caching strategies
  - Add bundle analysis and optimization
  - Implement efficient re-rendering patterns
  - Add performance monitoring for critical user flows
  - _Requirements: 6.1, 6.4_

- [ ] 14. Ensure TypeScript compliance and code quality
  - Run type checking and fix all TypeScript errors without using @ts-ignore
  - Add JSDoc comments for complex logic and new components
  - Ensure all code passes linting standards
  - Implement consistent naming conventions
  - Add proper type definitions for all new interfaces
  - _Requirements: 6.1, 6.4, 6.5, 7.4, 7.5_

- [ ] 15. Final integration testing and quality assurance
  - Perform end-to-end testing of complete user workflows
  - Verify cache invalidation works correctly across all operations
  - Test deep linking and URL state synchronization
  - Validate responsive design across different screen sizes
  - Ensure accessibility compliance for all new components
  - _Requirements: 6.2, 6.3, 7.1, 7.2_