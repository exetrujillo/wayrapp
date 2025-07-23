# Implementation Plan


- [x] 1. Set up monorepo frontend structure and design system








  - Create `/frontend-creator` and `/frontend-mobile` directories with proper isolation
  - Create shared design tokens configuration file with WayrApp color palette (#50A8B1 primary, #F8F8F8 secondary), typography scale (Lato/Open Sans/Roboto), spacing system (4-8px grid), and component styling rules
  - Implement centralized constants for BCP 47 language codes, API endpoints, and validation schemas
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 4.1_

- [x] 2. Initialize Creator Tool project structure




  - Set up Vite + React with TypeScript project in `/frontend-creator`
  - Install and configure core dependencies: react-router-dom, axios, i18next, react-i18next, zod, tailwindcss, @headlessui/react
  - Configure Tailwind CSS with design system tokens and component utilities
  - Set up TypeScript configuration with path aliases and strict type checking
  - Create basic project structure with components, pages, services, hooks, and utils directories
  - _Requirements: 2.1_

- [x] 3. Initialize Mobile App project structure




  - Set up React Native project with Expo and TypeScript in `/frontend-mobile`
  - Install and configure core dependencies: @react-navigation/native, react-native-paper, axios, i18next, react-i18next, @react-native-async-storage/async-storage
  - Configure React Native Paper theme with design system colors and typography
  - Set up navigation structure with stack navigators for different app flows
  - Create basic project structure with components, screens, services, and navigation directories
  - _Requirements: 3.1_


- [x] 4. Implement Creator Tool API infrastructure





  - Create axios client with request/response interceptors for JWT token management
  - Implement authentication service with login, logout, and token refresh functionality
  - Create API service methods for courses, lessons, exercises, and content management
  - Add comprehensive error handling and API response type definitions
  - _Requirements: 2.2_

- [x] 5. Build Creator Tool authentication system




  - Develop Login page with email/password form and validation
  - Implement authentication context and protected route guards
  - Create JWT token storage and retrieval using localStorage
  - Add logout functionality with session cleanup
  - Implement "Remember me" functionality and session persistence
  - _Requirements: 2.3_

- [x] 6. Develop Creator Tool core UI components





  - Create reusable Button component with primary/secondary variants and loading states
  - Implement Input component with validation states, icons, and accessibility features
  - Build Card component for content display with consistent styling
  - Create Modal component for dialogs and confirmations
  - Implement LoadingSpinner and feedback components (success/error messages)
  - Apply design system colors, typography, spacing, and rounded corners consistently
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

- [x] 7. Implement Creator Tool layout and navigation






  - Create Header component with user profile, navigation, and language selector
  - Build Sidebar navigation with menu items and user context
  - Implement main Layout component with responsive design
  - Set up React Router with protected routes and navigation guards
  - Add breadcrumb navigation and page titles
  - _Requirements: 2.1_

- [x] 8. Build Course Creation Form





  - Implement form with inputs for id, name, description (textarea), and is_public (checkbox)
  - Create searchable dropdown for source_language and target_language with BCP 47 validation
  - Add real-time form validation using Zod schemas
  - Implement form submission to POST /api/v1/courses with loading states
  - Add form reset and success/error feedback
  - _Requirements: 2.4, 2.5_

- [x] 9. Build Lesson Creation Form





  - Implement form with inputs for id, name, experience_points (numeric, default 10), and order (numeric)
  - Create searchable dropdown for moduleId selection (fetching from API)
  - Add form validation and submission to POST /api/v1/modules/{moduleId}/lessons
  - Implement dynamic module loading and error handling
  - _Requirements: 2.4, 2.5_

- [x] 10. Build Exercise Creation Form





  - Implement dynamic form supporting all 6 exercise_types with type-specific fields
  - Create JSONB data editor for exercise content with validation
  - Add exercise_type dropdown with dynamic form field rendering
  - Implement form submission to POST /api/v1/exercises
  - Add preview functionality for different exercise types
  - _Requirements: 2.4, 2.5_

- [x] 11. Build Exercise Assignment Form





  - Create form for assigning exercises to lessons with order specification
  - Implement searchable dropdown for existing exercise_ids
  - Add form submission to POST /api/v1/lessons/{lessonId}/exercises
  - Include drag-and-drop reordering functionality for exercise sequences
  - _Requirements: 2.4, 2.5_

- [x] 12. Implement content listing and management





  - Create paginated lists for Courses, Lessons, and Exercises with search and filtering
  - Implement ContentCard components with view/edit/delete actions
  - Add content creation dashboard with quick action buttons
  - Create content detail views with edit capabilities
  - Implement bulk operations and content organization features
  - _Requirements: 2.6_

- [x] 13. Add Creator Tool testing infrastructure





  - Set up Jest and React Testing Library with proper configuration
  - Create unit tests for core UI components (Button, Input, Card, Modal)
  - Implement integration tests for form submissions and API interactions
  - Add component tests for authentication flow and protected routes
  - Create mock API responses and test utilities
  - _Requirements: Testing strategy from design document_

- [ ] 14. Set up Mobile App navigation and theming



  - Configure React Navigation with stack navigators for Server Selection, Auth, and Main flows
  - Apply React Native Paper theme with design system colors and typography
  - Create navigation components and screen transition animations
  - Implement deep linking and navigation state persistence
  - _Requirements: 3.8_

- [ ] 15. Build Mobile App core UI components
  - Create Button component with primary/secondary variants matching design system
  - Implement Card component for server and course displays
  - Build Input component with validation states and mobile-optimized interactions
  - Create LoadingSpinner and progress indicators
  - Implement feedback components for success/error states with animations
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

- [ ] 16. Implement Mobile App API infrastructure
  - Create axios client with AsyncStorage for secure JWT token management
  - Implement server discovery service to fetch server list from public JSON URL
  - Add offline handling and network error management
  - Create API service methods for authentication, courses, and progress tracking
  - Implement automatic token refresh and session management
  - _Requirements: 3.1, 3.2_

- [ ] 17. Build Server Discovery Screen
  - Create ServerList component displaying available WayrApp servers
  - Implement server fetching from publicly hosted JSON file with fallback to hardcoded list
  - Add diverse server examples with BCP 47 language codes (eu, es, qu, aym, nah, gn, pt-BR, en-CA)
  - Create ServerCard components showing name, description, languages, and connection status
  - Implement search and filter functionality by region and language
  - _Requirements: 3.2_

- [ ] 18. Implement server selection and storage
  - Add server selection functionality with secure URL storage using AsyncStorage
  - Implement connection testing and status indicators
  - Create server switching capability with data cleanup
  - Add manual server URL input option for custom servers
  - _Requirements: 3.2_

- [ ] 19. Build Mobile App authentication screens
  - Create Login screen with email/password inputs and server-specific branding
  - Implement Register screen with full name, email, password confirmation, and native language selection
  - Add form validation and submission with visual feedback
  - Implement secure token storage and authentication state management
  - Create language selector and terms acceptance functionality
  - _Requirements: 3.3_

- [ ] 20. Implement Course Dashboard
  - Create Course Dashboard screen fetching and displaying available courses
  - Build CourseCard components with thumbnails, progress indicators, and next lesson preview
  - Add user progress summary with XP, streak, and achievement displays
  - Implement course selection and navigation to lesson content
  - Create pull-to-refresh and offline course caching
  - _Requirements: 3.4_

- [ ] 21. Build Lesson Player with exercise rendering
  - Create Lesson Player screen with dynamic exercise type rendering
  - Implement exercise renderers for translation, fill-in-blank, multiple choice, and other types
  - Add appropriate input fields and interaction elements for each exercise type
  - Create immediate visual and auditory feedback system for correct/incorrect answers
  - Implement smooth navigation between exercises with progress tracking
  - _Requirements: 3.6_

- [ ] 22. Implement progress tracking and completion
  - Add answer submission functionality with progress updates
  - Create XP, streak, and lives indicators with real-time updates
  - Implement progress submission to POST /api/v1/progress/lessons/{lessonId}/complete
  - Add lesson completion flow with celebration animations and achievements
  - Create offline progress caching and synchronization when online
  - _Requirements: 3.7_

- [ ] 23. Implement comprehensive i18n support
  - Set up i18next configuration for both Creator Tool and Mobile App
  - Create translation files for English, Spanish, and Euskera with comprehensive coverage
  - Replace all hardcoded UI strings with i18n translation keys
  - Implement language detection, switching, and persistence
  - Add RTL language support and locale-specific formatting
  - _Requirements: 1.5_

- [ ] 24. Configure monorepo deployment
  - Update vercel.json for proper backend Serverless Function deployment
  - Configure Creator Tool deployment as Static Site with proper routing
  - Set up Mobile App web deployment using Expo web build
  - Ensure correct CORS configuration and environment variable management
  - Test deployment pipeline and build optimization
  - _Requirements: 4.2, 4.3_

- [ ] 25. Implement Mobile App testing infrastructure
  - Set up Jest and React Native Testing Library with Expo configuration
  - Create component tests for core mobile UI components
  - Implement integration tests for server discovery and authentication flows
  - Add end-to-end tests for learning flow and progress tracking
  - Create performance tests for lesson loading and exercise rendering
  - _Requirements: Testing strategy from design document_

- [ ] 26. Conduct end-to-end integration testing
  - Test complete content creation flow from Creator Tool to Mobile App
  - Verify content created in Creator Tool appears correctly in Mobile App
  - Test cross-application workflows and data consistency
  - Implement automated testing for critical user journeys
  - Conduct accessibility testing and WCAG AA compliance verification
  - _Requirements: All requirements integration testing_

- [ ] 27. Final optimization and quality assurance
  - Conduct comprehensive code review and refactoring
  - Implement code splitting and lazy loading for Creator Tool routes
  - Add offline support and intelligent caching for Mobile App
  - Optimize bundle sizes and implement performance monitoring
  - Add comprehensive error boundaries and user feedback throughout both apps
  - Conduct security audit and implement additional security measures
  - _Requirements: Performance and security considerations from design document_