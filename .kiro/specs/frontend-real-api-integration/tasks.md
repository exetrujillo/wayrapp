# Implementation Plan

- [x] 1. Environment Configuration and Dependencies Setup





  - Update environment configuration files to support production API integration
  - Install TanStack Query for data fetching and caching
  - Configure build system to use environment variables correctly
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 1.1 Update environment configuration files


  - Modify `frontend-creator/.env` and `frontend-creator/.env.example` with production API URL
  - Set VITE_ENABLE_MSW to false by default for production API usage
  - Add all required environment variables with proper defaults
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 1.2 Install TanStack Query dependency



  - Add @tanstack/react-query to frontend-creator package.json
  - Install the dependency using npm
  - Verify installation and version compatibility
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 1.3 Create environment configuration utility


  - Create `frontend-creator/src/config/environment.ts` to centralize environment variable access
  - Implement type-safe environment configuration loading
  - Export configuration object for use throughout the application
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2. TypeScript Interface Alignment







  - Update all TypeScript interfaces to match the backend Prisma schema exactly
  - Add missing interfaces for Level, Section, and Module entities
  - Update existing interfaces to use correct field names and types
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2.1 Update User interface to match backend schema


  - Modify User interface in `frontend-creator/src/utils/types.ts` to match Prisma User model
  - Update field names and types to match backend exactly (username, countryCode, isActive, role enum)
  - Ensure all optional fields are properly marked
  - _Requirements: 1.1, 1.6_



- [x] 2.2 Update Course interface for isPublic field





  - Replace status field with isPublic boolean in Course interface
  - Update field naming from snake_case to camelCase (sourceLanguage, targetLanguage)
  - Update CreateCourseRequest and UpdateCourseRequest interfaces accordingly


  - _Requirements: 1.2, 1.6_

- [x] 2.3 Update Exercise interface and enum types









  - Change exerciseType enum to match backend: 'translation', 'fill-in-the-blank', 'vof', 'pairs', 'informative', 'ordering'


  - Update Exercise interface to use exerciseType instead of exercise_type
  - Update EXERCISE_TYPES constant in constants.ts to match new enum values
  - _Requirements: 1.3, 1.6_



- [x] 2.4 Add missing Level, Section, and Module interfaces





  - Create Level interface with id, courseId, code, name, order, createdAt, updatedAt fields
  - Create Section interface with id, levelId, name, order, createdAt, updatedAt fields
  - Create Module interface with id, sectionId, moduleType enum, name, order, createdAt, updatedAt fields
  - _Requirements: 1.4, 1.6_

- [x] 2.5 Update AuthResponse interface for production API





  - Change token field to accessToken in AuthResponse interface
  - Ensure User interface in AuthResponse matches updated User type
  - Update all references to use accessToken instead of token
  - _Requirements: 1.1, 4.2, 4.3_

- [x] 3. API Client Configuration Update







  - Update API client to use environment-based configuration
  - Ensure proper base URL configuration from environment variables
  - Test API client initialization with production URL
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.1 Update API client base URL configuration




  - Modify `frontend-creator/src/services/api.ts` to use environment configuration
  - Replace hardcoded base URL with config.apiUrl from environment utility
  - Ensure API client properly initializes with production URL
  - _Requirements: 3.1, 3.2_




- [x] 3.2 Update authentication token handling


  - Modify API client to use accessToken field name instead of token
  - Update token storage and retrieval logic in auth service
  - Ensure request interceptor uses correct token field name
  - _Requirements: 3.2, 4.2, 4.3_

- [x] 4. TanStack Query Integration





  - Set up QueryClient with appropriate configuration
  - Wrap application with QueryClientProvider
  - Configure query defaults for caching and error handling
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4.1 Configure QueryClient with optimal settings


  - Create `frontend-creator/src/config/queryClient.ts` with QueryClient configuration
  - Set appropriate staleTime, cacheTime, and retry policies
  - Configure error handling for different HTTP status codes
  - _Requirements: 7.1, 7.2, 7.4_



- [ ] 4.2 Integrate QueryClientProvider in application root





  - Modify `frontend-creator/src/App.tsx` or `frontend-creator/src/main.tsx` to wrap app with QueryClientProvider
  - Ensure QueryClient is properly initialized and provided to all components
  - Test that TanStack Query is available throughout the application
  - _Requirements: 7.1, 7.2_

- [x] 5. Authentication Service Updates





  - Update authentication service to work with production API endpoints
  - Implement proper session management with real tokens
  - Add user profile fetching from /auth/me endpoint
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 5.1 Update login method for production API


  - Modify `frontend-creator/src/services/auth.ts` login method to use production /auth/login endpoint
  - Update token storage to use accessToken field name
  - Ensure proper error handling for authentication failures
  - _Requirements: 4.1, 4.2, 4.4_

- [x] 5.2 Implement user profile fetching


  - Add getCurrentUserProfile method to AuthService that calls /auth/me endpoint
  - Update method to return properly typed User object
  - Implement error handling for profile fetch failures
  - _Requirements: 4.5, 5.5_

- [x] 5.3 Update session management logic


  - Modify setSession and clearSession methods to handle accessToken field
  - Update isAuthenticated method to work with production token format
  - Ensure proper token expiry handling
  - _Requirements: 4.2, 4.3, 5.1, 5.2, 5.3_

- [x] 6. Authentication Context Enhancement








  - Update AuthContext to fetch user profile on initialization
  - Implement proper session persistence and validation
  - Add error handling for authentication state management
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 6.1 Update AuthContext initialization logic








  - Modify `frontend-creator/src/contexts/AuthContext.tsx` to fetch user profile from /auth/me on app start
  - Replace getCurrentUser() call with API call to get fresh user data
  - Implement proper error handling when profile fetch fails
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 6.2 Enhance session persistence logic






  - Update useEffect in AuthProvider to handle token validation
  - Implement automatic logout when tokens are invalid or expired
  - Add proper loading states during authentication initialization
  - _Requirements: 5.2, 5.3, 5.4_




- [x] 6.3 Update login and logout methods




  - Ensure login method properly handles production API response format
  - Update logout method to work with production API if logout endpoint exists
  - Add proper error handling and user feedback for auth operations
  - _Requirements: 4.1, 4.4, 5.6_

- [x] 7. Protected Route Integration





  - Ensure protected routes work with real authentication state
  - Update route protection logic to handle session validation
  - Test unauthorized access handling
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7.1 Update ProtectedRoute component logic


  - Locate and modify ProtectedRoute component to work with updated AuthContext
  - Ensure proper redirection to login page for unauthenticated users
  - Test that authenticated users can access protected routes
  - _Requirements: 6.1, 6.2, 6.3_


- [x] 7.2 Test session expiration handling

  - Verify that expired sessions properly redirect to login page
  - Test that session expiration during app usage is handled gracefully
  - Ensure proper cleanup of authentication state on session expiry
  - _Requirements: 6.4, 6.5_

- [x] 8. Data Fetching Service Updates




  - Update service layer methods to work with production API
  - Implement TanStack Query hooks for data fetching
  - Add proper loading and error states
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 8.1 Create TanStack Query hooks for courses


  - Create `frontend-creator/src/hooks/useCourses.ts` with useCoursesQuery hook
  - Implement query hook that calls courseService.getCourses with proper typing
  - Add loading, error, and success states handling
  - _Requirements: 7.1, 7.3, 7.4_

- [x] 8.2 Update course service for production API


  - Modify `frontend-creator/src/services/courseService.ts` to work with production endpoints
  - Ensure proper data transformation if needed between frontend and backend formats
  - Add error handling for API failures
  - _Requirements: 7.2, 7.3, 7.5_

- [ ] 9. MSW Conditional Loading
  - Update MSW initialization to respect VITE_ENABLE_MSW environment variable
  - Ensure MSW is disabled by default for production API usage
  - Maintain MSW functionality for development scenarios
  - _Requirements: 2.2, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9.1 Update MSW initialization logic
  - Modify `frontend-creator/src/mocks/browser.ts` and main.tsx to check VITE_ENABLE_MSW
  - Only initialize MSW when environment variable is set to true
  - Ensure application works correctly with MSW disabled
  - _Requirements: 2.2, 8.2, 8.5_

- [ ] 9.2 Test MSW conditional loading
  - Verify that MSW is disabled when VITE_ENABLE_MSW=false
  - Test that real API calls are made when MSW is disabled
  - Ensure MSW can still be enabled for development when needed
  - _Requirements: 8.1, 8.3, 8.4_

- [ ] 10. Integration Testing and Validation
  - Test complete authentication flow with production API
  - Validate data fetching works correctly
  - Ensure error handling works as expected
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 10.1 Test login flow with production API
  - Create test script or manual test to verify login works with real credentials
  - Test that successful login stores tokens correctly and updates auth state
  - Verify that login failures are handled gracefully with proper error messages
  - _Requirements: 4.1, 4.2, 4.4_

- [ ] 10.2 Test session persistence and validation
  - Verify that page refresh maintains authentication state
  - Test that expired tokens are handled correctly
  - Ensure protected routes work properly with real authentication
  - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3_

- [ ] 10.3 Test data fetching with production API
  - Verify that course data can be fetched from production API
  - Test loading states and error handling in data fetching
  - Ensure TanStack Query integration works correctly
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 10.4 Validate TypeScript compilation
  - Run TypeScript compiler to ensure no type errors exist
  - Verify that all interface updates are compatible with existing code
  - Test that the application builds successfully for production
  - _Requirements: 1.5, 8.3, 8.4_