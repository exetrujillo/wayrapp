# Requirements Document

## Introduction

This feature implements the complete user flow for viewing a list of existing courses and creating new courses within the WayrApp Creator CMS. The feature enables content creators to efficiently manage their course catalog by providing a comprehensive interface for course listing, creation, and basic management operations. The implementation strictly adheres to the established data hierarchy defined in the database schema and API contract, ensuring seamless integration with the existing system architecture.

## Requirements

### Requirement 1

**User Story:** As a content creator, I want to view a paginated list of all my courses, so that I can efficiently browse and manage my course catalog.

#### Acceptance Criteria

1. WHEN the user navigates to the /courses page THEN the system SHALL display a loading state while fetching course data
2. WHEN the course data is successfully fetched THEN the system SHALL display a paginated list of courses using CourseCard components
3. WHEN the API call fails THEN the system SHALL display a user-friendly error message with a retry option
4. WHEN no courses exist THEN the system SHALL display an empty state message with a "Create New Course" call-to-action
5. WHEN the user interacts with pagination controls THEN the system SHALL fetch and display the appropriate page of results
6. WHEN the user performs a search THEN the system SHALL filter courses based on the search query with debounced input

### Requirement 2

**User Story:** As a content creator, I want to create a new course with all required information, so that I can start building educational content within the established data hierarchy.

#### Acceptance Criteria

1. WHEN the user clicks "Create New Course" THEN the system SHALL navigate to the /courses/new page
2. WHEN the create course page loads THEN the system SHALL display a form with fields for all required Course entity properties
3. WHEN the user submits the form with valid data THEN the system SHALL send a POST request to the /api/v1/courses endpoint
4. WHEN the course creation is successful THEN the system SHALL invalidate the courses list cache and redirect to /courses
5. WHEN the form contains validation errors THEN the system SHALL display field-specific error messages without submitting
6. WHEN the API returns an error THEN the system SHALL display the error message and allow the user to retry

### Requirement 3

**User Story:** As a content creator, I want the course list to automatically refresh after creating a new course, so that I can immediately see my newly created course in the list.

#### Acceptance Criteria

1. WHEN a course is successfully created THEN the system SHALL invalidate the TanStack Query cache for the courses list
2. WHEN the cache is invalidated THEN the system SHALL automatically refetch the courses list data
3. WHEN the user is redirected to /courses after creation THEN the system SHALL display the updated list including the new course
4. WHEN the cache invalidation fails THEN the system SHALL still redirect but may require manual refresh to see the new course

### Requirement 4

**User Story:** As a content creator, I want form validation that matches the API requirements, so that I can receive immediate feedback and avoid submission errors.

#### Acceptance Criteria

1. WHEN the user enters course data THEN the system SHALL validate all fields using a Zod schema that matches API requirements
2. WHEN required fields are empty THEN the system SHALL display validation errors and prevent form submission
3. WHEN language codes are invalid THEN the system SHALL display specific error messages for BCP 47 format requirements
4. WHEN the course name is too short THEN the system SHALL display a minimum length validation error
5. WHEN all validation passes THEN the system SHALL enable the submit button and allow form submission

### Requirement 5

**User Story:** As a content creator, I want consistent loading states and error handling, so that I have a smooth and predictable user experience.

#### Acceptance Criteria

1. WHEN any API operation is in progress THEN the system SHALL display appropriate loading indicators
2. WHEN API operations complete successfully THEN the system SHALL remove loading states and display results
3. WHEN API operations fail THEN the system SHALL display user-friendly error messages with actionable next steps
4. WHEN network errors occur THEN the system SHALL provide retry mechanisms for failed operations
5. WHEN the user navigates between pages THEN the system SHALL maintain consistent loading and error state patterns

### Requirement 6

**User Story:** As a developer implementing this feature, I want all code to pass TypeScript compilation, tests, and linting, so that the implementation maintains code quality and doesn't introduce regressions.

#### Acceptance Criteria

1. WHEN any code changes are made THEN the system SHALL pass `npm run type-check` with "Found 0 errors"
2. WHEN any code changes are made THEN the system SHALL pass `npm test` with all tests passing
3. WHEN any code changes are made THEN the system SHALL pass `npm run lint` with no linting errors
4. WHEN TypeScript errors occur THEN the system SHALL fix the root cause without using @ts-ignore suppressions
5. WHEN implementing new components THEN the system SHALL include appropriate JSDoc comments for complex logic

### Requirement 7

**User Story:** As a developer working within the monorepo structure, I want all changes to respect workspace boundaries, so that the implementation doesn't affect other parts of the system.

#### Acceptance Criteria

1. WHEN implementing the feature THEN the system SHALL only modify files within the frontend-creator workspace
2. WHEN using shared utilities THEN the system SHALL import from the frontend-shared package appropriately
3. WHEN making API calls THEN the system SHALL use the existing API service patterns and endpoints
4. WHEN creating new components THEN the system SHALL follow the established component structure and naming conventions
5. WHEN adding dependencies THEN the system SHALL only modify package.json if explicitly required by the task

### Requirement 8

**User Story:** As a content creator, after creating a course, I want to manage its hierarchical structure by adding, editing, and deleting Levels and Sections, so that I can organize the learning path for my students.

#### Acceptance Criteria

1. WHEN the user navigates to a specific course's detail page (e.g., /courses/:courseId) THEN the system SHALL display a list of all Levels associated with that course.
2. WHEN viewing the course detail page THEN the user SHALL have clear options (e.g., "Add Level" button) to create a new Level within that course via a form.
3. WHEN a Level is selected THEN the system SHALL display a list of all Sections associated with that Level.
4. WHEN viewing a Level's details THEN the user SHALL have options to create a new Section within that Level.
5. WHEN creating a Level or Section THEN the form submission SHALL use the correct nested API endpoints (e.g., POST /api/v1/courses/:courseId/levels).
6. WHEN a Level or Section is created THEN the UI SHALL automatically refresh to show the new entity in its respective list.

### Requirement 9

**User Story:** As a content creator, I want to manage the core learning units by adding, editing, and deleting Modules and Lessons within the course structure, so that I can build the actual content of the course.

#### Acceptance Criteria

1. WHEN a Section is selected THEN the system SHALL display a list of all Modules associated with that Section.
2. WHEN viewing a Section's details THEN the user SHALL have options to create a new Module within that Section.
3. WHEN creating a Module THEN the user MUST select a moduleType from a predefined list: informative, basic_lesson, reading, dialogue, or exam.
4. WHEN a Module is selected THEN the system SHALL display a list of all Lessons associated with that Module.
5. WHEN viewing a Module's details THEN the user SHALL have options to create a new Lesson within that Module.
6. WHEN creating a Module or Lesson THEN the form submission SHALL use the correct nested API endpoints (e.g., POST /api/v1/modules/:moduleId/lessons).
7. WHEN a Module or Lesson is created THEN the UI SHALL automatically refresh to show the new entity.
8. WHEN creating a Lesson THEN the user SHALL be able to define its experiencePoints.

### Requirement 10

**User Story:** As a content creator, I want to manage a global, reusable "bank" of exercises, so that I can create exercises once and use them in multiple lessons across different courses.

#### Acceptance Criteria

1. WHEN the user navigates to a dedicated "Exercises" page (e.g., /exercises) THEN the system SHALL display a list of all reusable exercises in the system.
2. WHEN on the Exercises page THEN the user SHALL have an option to create a new exercise.
3. WHEN creating a new exercise THEN the user MUST first select an exerciseType from a predefined list: translation, fill-in-the-blank, vof (True/False), pairs, informative, or ordering.
4. WHEN an exerciseType is selected THEN the form SHALL dynamically change to show the specific fields required for that type (e.g., "source_text" and "target_text" for a translation exercise).
5. WHEN a new exercise is created THEN the submission SHALL use the global endpoint POST /api/v1/exercises.
6. WHEN viewing the exercise list THEN the user SHALL be able to edit or delete existing reusable exercises.

### Requirement 11

**User Story:** As a content creator, while editing a Lesson, I want to assign, unassign, and reorder exercises from my global "bank", so that I can construct the interactive part of the lesson.

#### Acceptance Criteria

1. WHEN viewing the detail page for a specific Lesson THEN the system SHALL display a list of all exercises currently assigned to it, in their correct order.
2. WHEN viewing a Lesson THEN there SHALL be an "Assign Exercise" feature that allows the user to select one or more exercises from the global exercise bank.
3. WHEN an exercise is assigned THEN the system SHALL make a POST request to the many-to-many endpoint (/api/v1/lessons/:lessonId/exercises) with the exerciseId and order.
4. WHEN viewing the list of assigned exercises THEN the user SHALL have an option to change their order (e.g., via drag-and-drop or up/down arrows).
5. WHEN the order of exercises is changed THEN the system SHALL make a PUT request to /api/v1/lessons/:lessonId/exercises/reorder with the new sequence of exercise IDs.
6. WHEN viewing an assigned exercise THEN the user SHALL have an option to "Unassign" it, which triggers a DELETE request to /api/v1/lessons/:lessonId/exercises/:exerciseId.

### Requirement 12

**User Story:** As a developer, I want all data fetching for the hierarchical content to use TanStack Query, so that caching, loading, and error states are handled consistently and efficiently.

#### Acceptance Criteria

1. WHEN fetching lists of Levels, Sections, Modules, or Lessons THEN the system SHALL use dedicated TanStack Query hooks (e.g., useLevelsQuery, useSectionsQuery).
2. WHEN creating, updating, or deleting any hierarchical entity THEN the system SHALL use TanStack Query mutations (e.g., useCreateLevelMutation).
3. WHEN a mutation is successful (e.g., a new Section is created) THEN the corresponding query cache for its list (e.g., the Sections list for that Level) SHALL be invalidated to trigger an automatic refetch.
4. WHEN navigating the hierarchy THEN the UI SHALL display appropriate loading states (e.g., skeleton loaders) while child entities are being fetched.




